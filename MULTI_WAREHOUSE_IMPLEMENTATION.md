# Multi-Warehouse Stock-In Workflow Implementation Guide

## Overview

This document describes the complete multi-warehouse stock-in workflow system with role-based access control and comprehensive audit logging.

## Architecture

### 1. Core Components

#### Types & Validation (`types/warehouse.ts` & `utils/workflow-validation.ts`)
- **Warehouse & User Types**: Define warehouse, user, and role structures
- **Workflow States**: Complete 8-stage workflow definition
- **Transition Rules**: Defines valid state transitions and prevents invalid moves
- **Role-Based Access**: Each stage has required roles

#### Context Providers (`contexts/`)
- **AuthContext** (`contexts/auth-context.tsx`): User authentication and role management
- **WarehouseContext** (`contexts/warehouse-context.tsx`): Warehouse selection and multi-tenancy
- **StockInProviderEnhanced** (`components/stock-in/stock-in-context-enhanced.tsx`): Enhanced workflow with validation

### 2. Workflow Stages

```
1. pending_approval (Start)
   ↓ (Approval Stage)
2. approved
   ↓ (Auto or Manual)
3. grn_generated
   ↓ (Vehicle Registration)
4. vehicle_entered
   ↓ (Goods Inspection)
5. unloading_inspection
   ↓ (Allocation)
6. put_away
   ↓ (Vehicle Exit)
7. vehicle_exited
   ↓ (Finalization)
8. completed (End)

Rejection paths:
- pending_approval → rejected
- pending_approval → modification_requested → pending_approval
```

### 3. Role-Based Access Control

| Role | Permissions |
|------|-------------|
| **admin** | Full access to all warehouses and operations |
| **manager** | Full access to assigned warehouse |
| **approver** | Can approve/reject stock-in requests |
| **operator** | Can execute stages (vehicle entry, inspection, put-away) |
| **viewer** | Read-only access |

### 4. User & Warehouse Model

```typescript
// User can have access to multiple warehouses
User {
  id: string
  name: string
  role: UserRole
  warehouseIds: string[] // Multiple warehouses
}

// Warehouse tracks manager and capacity
Warehouse {
  id: string
  name: string
  managerId: string
  capacity: number
  usedCapacity: number
  zones: string[]
}

// All operations track user & warehouse
StockInRequest {
  warehouseId: string
  createdBy: string
  approvedBy?: string
  rejectedBy?: string
  inspectedBy?: string
  ...
}
```

## Key Features

### 1. Manager Approval Stage

The approval stage is now properly implemented as a separate workflow step:

```typescript
// Before (Broken):
approveRequest() → status becomes "grn_generated" (skipped approval)

// After (Fixed):
approveRequest() → status becomes "approved"
generateGRNForRequest() → status becomes "grn_generated"
```

**Components:**
- `ApprovalStage` - Full approval UI with three options:
  - ✅ Approve (sets status to "approved")
  - ❌ Reject (sets status to "rejected", requires reason)
  - ⚠️ Request Modifications (sets status to "modification_requested")

- Permission checks ensure only approvers can access
- Real-time validation of transitions

### 2. Warehouse Isolation

Each operation is scoped to the current warehouse:

```typescript
// Contexts filter by current warehouse
getRequestsByWarehouse(warehouseId)
getInventoryByWarehouse(warehouseId)
getAuditByWarehouse(warehouseId)

// StockInRequest includes warehouseId
request.warehouseId = currentWarehouse.id
```

### 3. Audit Logging with User Info

Every action is logged with complete context:

```typescript
AuditEntry {
  action: string
  performedBy: string (User ID)
  performedByName: string (User name for UI)
  userRole: string (Role at time of action)
  warehouseId: string (Which warehouse)
  timestamp: string
  details: string
}
```

**Example Audit Trail:**
1. 2024-02-20 10:15 - Stock-In Request Created by supplier_mgr (operator) in Delhi Warehouse
2. 2024-02-20 10:20 - Request Approved by warehouse_mgr (manager) in Delhi Warehouse
3. 2024-02-20 10:25 - GRN Generated (auto)
4. 2024-02-20 10:30 - Vehicle Entry Recorded by dock_operator (operator)
5. etc.

### 4. Workflow Validation

Strict validation prevents invalid transitions:

```typescript
// Validates transition rules
validateTransition("pending_approval", "approved") ✅
validateTransition("pending_approval", "vehicle_entered") ❌ (invalid)
validateTransition("completed", "approved") ❌ (no backward)

// Role-based validation
canApprove(userRole) // Only admin, manager, approver
canOperate(userRole) // admin, manager, operator
canAccessStage(stage, userRole)
```

## Usage Examples

### Creating a Stock-In Request

```typescript
const { createRequest } = useStockInEnhanced();
const { currentWarehouse } = useWarehouse();
const { currentUser } = useAuth();

const newRequest = createRequest({
  supplierName: "ABC Supplies",
  supplierContact: "supplier@abc.com",
  products: [
    {
      id: "prod_001",
      sku: "SKU-001",
      name: "Product Name",
      quantity: 100,
      weight: 50,
      uom: "boxes",
    }
  ],
  expectedDeliveryDate: "2024-02-25",
  purchaseOrderRef: "PO-2024-001",
  warehouseId: currentWarehouse.id,
});

// Automatically:
// - Sets createdBy to currentUser.id
// - Sets status to "pending_approval"
// - Logs audit entry
```

### Approving a Request

```typescript
const { approveRequest } = useStockInEnhanced();
const { currentUser } = useAuth();

// Validates:
// 1. User has "approver", "manager", or "admin" role
// 2. Current status is "pending_approval"
// 3. Valid transition exists

const result = approveRequest(requestId);

if (result.success) {
  // Status changed to "approved"
  // Audit logged with currentUser.id as approvedBy
} else {
  console.error(result.error);
}
```

### Recording Vehicle Entry

```typescript
const { recordVehicleEntry } = useStockInEnhanced();

const result = recordVehicleEntry(requestId, {
  vehicleNumber: "MH01AB1234",
  driverName: "John Doe",
  driverPhone: "+91-9876543210",
  grossWeight: 5000,
});

// Validates:
// 1. Current status is "grn_generated"
// 2. Can transition to "vehicle_entered"
// Auto-generates gate entry pass
```

## Components

### UI Components for Role Testing

#### RoleSwitcher (`role-switcher.tsx`)
- Dropdown to switch between roles (for testing)
- Shows current role
- Updates auth context

#### WarehouseSelector (`warehouse-selector.tsx`)
- Select warehouse from user's assigned warehouses
- Shows warehouse capacity utilization
- Updates warehouse context

#### ApprovalStage (`approval-stage.tsx`)
- Complete approval UI
- Three action tabs: Approve, Reject, Modify
- Permission checks
- Validation feedback

#### RequestDetailEnhanced (`request-detail-enhanced.tsx`)
- Tabs: Details, Products, History, Approval
- Workflow progress visualization
- Complete request summary
- Integrated ApprovalStage

## Testing the System

### 1. Test Workflow Progression

```
As Admin:
1. Create request → pending_approval
2. Switch to Approver role
3. Approve request → approved
4. Generate GRN → grn_generated
5. Record vehicle entry → vehicle_entered
6. Record inspection → unloading_inspection
7. Allocate put-away → put_away
8. Confirm put-away (adds to inventory)
9. Record vehicle exit → vehicle_exited
10. Complete request → completed
```

### 2. Test Role Permissions

**Admin can:**
- All operations
- Access all warehouses

**Manager can:**
- All operations in their warehouse
- Approve requests

**Approver can:**
- Approve/reject/modify requests only
- Cannot perform other stages

**Operator can:**
- Execute stages (vehicle entry, inspection, etc.)
- Cannot approve

**Viewer can:**
- View everything
- Cannot perform any actions

### 3. Test Warehouse Isolation

```
As Admin in Delhi warehouse:
1. Create request A → appears in Delhi only
2. Switch to Mumbai warehouse
3. Create request B → appears in Mumbai only
4. Request A not visible in Mumbai
5. Audit logs filtered by warehouse
```

### 4. Invalid Transitions

```
Try to:
- Skip stages (pending_approval → vehicle_entered) ❌
- Go backward (completed → pending_approval) ❌
- Approve as viewer ❌
- Operate as viewer ❌
```

## Integration Points

### Existing Components Using Enhanced Context

To use the new workflow validation and warehouse support, update existing components:

```typescript
// Old
import { useStockIn } from "@/components/stock-in/stock-in-context";

// New
import { useStockInEnhanced } from "@/components/stock-in/stock-in-context-enhanced";
import { useAuth } from "@/contexts/auth-context";
import { useWarehouse } from "@/contexts/warehouse-context";

function MyComponent() {
  const { createRequest, approveRequest } = useStockInEnhanced();
  const { currentUser } = useAuth();
  const { currentWarehouse } = useWarehouse();
  
  // Handle results with error messages
  const result = approveRequest(id);
  if (!result.success) {
    showError(result.error);
  }
}
```

## Mock Data

### Mock Users
- **admin_001**: Admin (all warehouses)
- **manager_001**: Manager (Delhi warehouse)
- **approver_001**: Approver (Delhi, Mumbai)
- **operator_001**: Operator (Delhi warehouse)

### Mock Warehouses
- **warehouse_001**: Delhi (Capacity: 10000)
- **warehouse_002**: Mumbai (Capacity: 15000)
- **warehouse_003**: Bangalore (Capacity: 12000)

### Testing Workflow

1. **Create a Request** (any user)
2. **Switch to Approver role**
3. **Approve the request** (approver only)
4. **Continue through stages**

## Error Handling

All operations return `{ success: boolean; error?: string }`:

```typescript
const result = approveRequest(id);

if (!result.success) {
  // Handle specific errors
  if (result.error?.includes("permission")) {
    showPermissionError();
  } else if (result.error?.includes("transition")) {
    showInvalidTransitionError();
  }
}
```

## Database Considerations (for production)

When migrating to a real database:

1. **Add warehouse_id index** on stock_in_requests, inventory, audit_logs
2. **Add user_id index** on operations for audit trailing
3. **Add status index** for quick workflow queries
4. **Add composite index** (warehouse_id, status) for filtering
5. **Implement Row Level Security** (RLS) if using Supabase
6. **Add foreign key** from stock_in_requests to warehouses
7. **Track user_id & role** separately from user name (name can change)

## Next Steps

1. **Connect to real database** (Supabase, Neon, etc.)
2. **Implement persistent storage** for requests and inventory
3. **Add API routes** for operations
4. **Implement real authentication** (next-auth, Supabase Auth)
5. **Add rate limiting** for API endpoints
6. **Implement proper error handling** and logging
7. **Add email notifications** for approvals/rejections
8. **Create admin dashboard** for user management

## Troubleshooting

### Issue: Approval button not appearing
- Check user role (must be admin, manager, or approver)
- Check request status (must be pending_approval)
- Use RoleSwitcher to test different roles

### Issue: Cannot change warehouse
- Check if user has access to warehouse (warehouseIds)
- Use WarehouseSelector to verify available warehouses

### Issue: Requests not visible after warehouse switch
- Ensure requests are scoped to warehouse (getRequestsByWarehouse)
- Check if created in different warehouse

### Issue: Invalid transition errors
- Review workflow_validation.ts for valid transitions
- Check current request status
- Ensure you're moving to next logical stage

---

**Last Updated**: 2024-02-20
**Version**: 1.0

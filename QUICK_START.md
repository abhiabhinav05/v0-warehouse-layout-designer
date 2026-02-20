# Quick Start Guide - Multi-Warehouse Stock-In

## Testing the System in 5 Minutes

### Step 1: Navigate to Stock-In Page
1. Open the application
2. Click **Stock-In** in the navigation menu
3. You're now in the warehouse management system

### Step 2: Create a Stock-In Request
1. Look for "Create New Request" button
2. Fill in:
   - **Supplier Name**: ABC Supplies
   - **Supplier Contact**: supplier@abc.com
   - **PO Reference**: PO-2024-001
   - **Expected Delivery Date**: 2024-02-25
3. Add Products:
   - **SKU**: SKU-001
   - **Name**: Test Product
   - **Quantity**: 100
   - **UOM**: boxes
4. Click **Create Request**
5. Status: **pending_approval** ✓

### Step 3: Test Manager Approval
1. Look at top navigation bar
2. Find the **Role Switcher** (shows your current role)
3. Click the role dropdown
4. Select **Approver** role
5. Return to your request
6. Click the **Approval** tab
7. You now see three options:
   - ✅ **Approve Request** (green)
   - ❌ **Reject Request** (red)
   - ⚠️ **Request Modifications** (amber)
8. Click **Approve Request**
9. Status changes to: **approved** ✓

### Step 4: Continue Through Workflow
1. Status should now be **approved**
2. Generate GRN (button should be available)
3. Record Vehicle Entry
4. Record Inspection
5. Allocate Put-Away
6. Record Vehicle Exit
7. Complete Request
8. Status: **completed** ✓

### Step 5: Check Audit Log
1. Click **Audit Log** in navigation
2. You'll see complete history:
   - Request Created by admin_001
   - Request Approved by approver_001
   - And all subsequent actions
3. Each entry shows:
   - ⏱️ Timestamp
   - 👤 Who did it
   - 🔤 Their role
   - 📝 What they did

## Key Features

### Role Switcher (Top Left)
```
Current Role: Admin
Click dropdown to switch to:
- Admin (full access)
- Manager (warehouse access)
- Approver (approval access)
- Operator (stage operations)
- Viewer (read-only)
```

### Warehouse Selector (Top Right)
```
Current Warehouse: Delhi
Capacity: 4500 / 10000 units (45%)
Click to switch to:
- Delhi Warehouse
- Mumbai Warehouse
- Bangalore Warehouse
```

### Approval Stage (What Fixed!)
```
BEFORE (Broken):
Create → pending_approval → grn_generated ❌

AFTER (Fixed):
Create → pending_approval → approved → grn_generated ✓
              (manager must approve)
```

## Important Concepts

### Workflow States
1. **pending_approval** - Waiting for manager
2. **approved** - Manager approved
3. **grn_generated** - Goods Receipt Note created
4. **vehicle_entered** - Truck arrived
5. **unloading_inspection** - Goods inspected
6. **put_away** - Allocated to storage
7. **vehicle_exited** - Truck left
8. **completed** - All done

### Rejection Paths
- **pending_approval** → **rejected** (manager rejects)
- **pending_approval** → **modification_requested** (ask for changes)
- **modification_requested** → **pending_approval** (resubmit)

### Role Permissions
```
Admin       → Can do everything
Manager     → Can do everything in their warehouse
Approver    → Can only approve/reject/modify
Operator    → Can execute stages (vehicle entry, inspection)
Viewer      → Can only read, no actions
```

## Common Tasks

### Create & Complete a Request
```
1. Create Request (status: pending_approval)
2. Switch to Approver
3. Approve (status: approved)
4. Generate GRN (status: grn_generated)
5. Record Vehicle Entry (status: vehicle_entered)
6. Record Inspection (status: unloading_inspection)
7. Allocate Put-Away (status: put_away)
8. Confirm Put-Away (adds to inventory)
9. Record Vehicle Exit (status: vehicle_exited)
10. Complete (status: completed)
```

### Test Rejection
```
1. Create Request
2. Switch to Approver
3. Click Approval tab
4. Select Reject tab
5. Enter rejection reason
6. Click Reject Request
7. Status: rejected (final)
```

### Test Modification Request
```
1. Create Request
2. Switch to Approver
3. Click Approval tab
4. Select "Request Changes" tab
5. Enter modification details
6. Click "Request Modifications"
7. Status: modification_requested
8. Can be resubmitted
```

### Switch Warehouses
```
1. Find Warehouse Selector (top right)
2. Click to open dropdown
3. Select different warehouse
4. All data refreshes for that warehouse
5. Requests/inventory isolated by warehouse
```

### Export Audit Log
```
1. Go to Audit Log page
2. Click "Export CSV" button
3. CSV file downloads with all entries
4. Includes: Timestamp, User, Role, Action, Details
```

## Troubleshooting

### Q: Approval button not showing
**A:** Check role in top-left. Must be Admin, Manager, or Approver.

### Q: Cannot change warehouse
**A:** Only users with that warehouse in their access list can switch. Admin can access all.

### Q: Request disappeared after warehouse switch
**A:** Different warehouses have different requests. This is by design (data isolation).

### Q: Error "Invalid transition"
**A:** You're trying to skip stages. Follow workflow order: pending → approved → grn → vehicle → inspection → put_away → exit → completed.

### Q: Cannot perform inspection
**A:** Request must be in "vehicle_entered" status first.

## Audit Trail Example

```
2024-02-20 10:15 ✓ Stock-In Request Created
  By: admin_001 | Role: Admin
  Details: Request created for ABC Supplies

2024-02-20 10:20 ✓ Request Approved
  By: approver_001 | Role: Approver
  Details: Approved. Ready for GRN generation

2024-02-20 10:25 ✓ GRN Generated
  Details: GRN-20240220-ABC1

2024-02-20 10:30 ✓ Vehicle Entry Recorded
  By: operator_001 | Role: Operator
  Details: Vehicle: MH01AB1234, Driver: John, Pass: GEP-ABC123

2024-02-20 10:40 ✓ Inspection Recorded
  By: operator_001 | Role: Operator
  Details: Status: accepted, Items inspected: 1

2024-02-20 10:50 ✓ Put-Away Allocated
  Details: 1 allocation configured

2024-02-20 11:00 ✓ Put-Away Confirmed
  Details: 1 item(s) added to inventory

2024-02-20 11:10 ✓ Vehicle Exit Recorded
  Details: Net weight: 4800

2024-02-20 11:15 ✓ Request Completed
  Details: Fully completed
```

## Mock Users (for testing)

### Switch roles by clicking top-left dropdown

| User | Role | Warehouses | Can Do |
|------|------|-----------|--------|
| admin_001 | Admin | All 3 | Everything |
| manager_001 | Manager | Delhi | Everything in Delhi |
| approver_001 | Approver | Delhi, Mumbai | Approve/Reject only |
| operator_001 | Operator | Delhi | Execute stages only |
| (Viewer role available) | Viewer | Any | View only |

## That's It!

You now know how to:
- ✅ Create stock-in requests
- ✅ Approve them (fixed workflow!)
- ✅ Execute workflow stages
- ✅ Switch roles and warehouses
- ✅ View audit trails
- ✅ Export data

For detailed documentation, see:
- `MULTI_WAREHOUSE_IMPLEMENTATION.md` - Complete technical guide
- `IMPLEMENTATION_COMPLETE.md` - Project summary

Happy testing!

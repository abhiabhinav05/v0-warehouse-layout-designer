export type StockInStatus =
  | "pending_approval"
  | "approved"
  | "rejected"
  | "modification_requested"
  | "grn_generated"
  | "vehicle_entered"
  | "unloading_inspection"
  | "put_away"
  | "completed"
  | "partially_completed";

export interface ProductLine {
  id: string;
  sku: string;
  name: string;
  quantity: number;
  weight: number;
  dimensions: { l: number; w: number; h: number };
  batchNumber?: string;
  expiryDate?: string;
  uom: string;
}

export interface VehicleEntry {
  vehicleNumber: string;
  driverName: string;
  driverPhone: string;
  gateEntryPassId: string;
  grossWeight?: number;
  entryTime: string;
  exitTime?: string;
  netWeight?: number;
  exitPassId?: string;
}

export interface InspectionItem {
  productId: string;
  expectedQty: number;
  receivedQty: number;
  acceptedQty: number;
  damagedQty: number;
  shortageQty: number;
  skuVerified: boolean;
  notes: string;
}

export interface InspectionResult {
  inspectedAt: string;
  inspectedBy: string;
  items: InspectionItem[];
  overallStatus: "accepted" | "partial" | "rejected";
}

export interface PutAwayAllocation {
  productId: string;
  quantity: number;
  zoneId: string;
  zoneName: string;
  structureId: string;
  structureName: string;
  levelId: string;
  levelName: string;
  partitionId: string;
  partitionName: string;
  strategy: "manual" | "fifo" | "fefo";
}

export interface StockInRequest {
  id: string;
  supplierName: string;
  supplierContact: string;
  products: ProductLine[];
  expectedDeliveryDate: string;
  purchaseOrderRef: string;
  warehouseId: string;
  vehicleNumber?: string;
  driverName?: string;
  driverPhone?: string;
  status: StockInStatus;
  grnNumber?: string;
  createdAt: string;
  approvedAt?: string;
  rejectedAt?: string;
  rejectionReason?: string;
  modificationNote?: string;
  vehicleEntry?: VehicleEntry;
  inspection?: InspectionResult;
  putAwayAllocations?: PutAwayAllocation[];
  completedAt?: string;
}

export interface InventoryItem {
  id: string;
  grnNumber: string;
  productId: string;
  sku: string;
  productName: string;
  quantity: number;
  weight: number;
  uom: string;
  batchNumber?: string;
  expiryDate?: string;
  zoneId: string;
  zoneName: string;
  structureId: string;
  structureName: string;
  levelId: string;
  levelName: string;
  partitionId: string;
  partitionName: string;
  placedAt: string;
}

export interface AuditEntry {
  id: string;
  timestamp: string;
  action: string;
  entity: string;
  entityId: string;
  details: string;
  performedBy: string;
}

export interface WarehouseZoneInfo {
  id: string;
  label: string;
}

export interface StructureLevelPartition {
  id: string;
  label: string;
  maxCapacity: number;
  usedCapacity: number;
}

export interface StructureLevel {
  id: string;
  label: string;
  partitions: StructureLevelPartition[];
}

export interface WarehouseStructureInfo {
  id: string;
  label: string;
  zoneId: string;
  zoneName: string;
  levels: StructureLevel[];
}

export interface WarehouseLayoutData {
  zones: WarehouseZoneInfo[];
  structures: WarehouseStructureInfo[];
}

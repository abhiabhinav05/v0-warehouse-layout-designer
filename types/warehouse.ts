export type UserRole = "admin" | "manager" | "approver" | "operator" | "viewer";

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  warehouseIds: string[]; // Warehouses user has access to
  createdAt: Date;
}

export interface Warehouse {
  id: string;
  name: string;
  location: string;
  managerId: string; // User ID of warehouse manager
  capacity: number;
  usedCapacity: number;
  zones: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface WorkflowStage {
  stage: string;
  name: string;
  requiredRole: UserRole[];
  description: string;
  order: number;
}

export const WORKFLOW_STAGES: Record<string, WorkflowStage> = {
  pending_approval: {
    stage: "pending_approval",
    name: "Pending Approval",
    requiredRole: ["admin", "manager", "approver"],
    description: "Request awaiting manager approval",
    order: 1,
  },
  approved: {
    stage: "approved",
    name: "Approved",
    requiredRole: ["admin", "manager"],
    description: "Request approved by manager",
    order: 2,
  },
  grn_generated: {
    stage: "grn_generated",
    name: "GRN Generated",
    requiredRole: ["admin", "manager", "operator"],
    description: "Goods Receipt Note generated",
    order: 3,
  },
  vehicle_entered: {
    stage: "vehicle_entered",
    name: "Vehicle Entered",
    requiredRole: ["admin", "manager", "operator"],
    description: "Delivery vehicle entered warehouse",
    order: 4,
  },
  unloading_inspection: {
    stage: "unloading_inspection",
    name: "Unloading & Inspection",
    requiredRole: ["admin", "manager", "operator"],
    description: "Goods unloaded and inspected",
    order: 5,
  },
  put_away: {
    stage: "put_away",
    name: "Put-Away",
    requiredRole: ["admin", "manager", "operator"],
    description: "Goods allocated to storage locations",
    order: 6,
  },
  vehicle_exited: {
    stage: "vehicle_exited",
    name: "Vehicle Exited",
    requiredRole: ["admin", "manager", "operator"],
    description: "Delivery vehicle exited warehouse",
    order: 7,
  },
  completed: {
    stage: "completed",
    name: "Completed",
    requiredRole: ["admin", "manager"],
    description: "Stock-in request completed",
    order: 8,
  },
  rejected: {
    stage: "rejected",
    name: "Rejected",
    requiredRole: ["admin", "manager", "approver"],
    description: "Request rejected by manager",
    order: -1,
  },
  modification_requested: {
    stage: "modification_requested",
    name: "Modification Requested",
    requiredRole: ["admin", "manager", "approver"],
    description: "Modifications requested",
    order: -2,
  },
};

export const VALID_TRANSITIONS: Record<string, string[]> = {
  pending_approval: ["approved", "rejected", "modification_requested"],
  approved: ["grn_generated"],
  grn_generated: ["vehicle_entered"],
  vehicle_entered: ["unloading_inspection"],
  unloading_inspection: ["put_away"],
  put_away: ["vehicle_exited"],
  vehicle_exited: ["completed"],
  completed: [],
  rejected: [],
  modification_requested: ["pending_approval"],
};

"use client";

import React, { createContext, useContext, useState, useCallback } from "react";
import type {
  StockInRequest,
  StockInStatus,
  InventoryItem,
  AuditEntry,
  ProductLine,
  VehicleEntry,
  InspectionResult,
  PutAwayAllocation,
} from "./types";
import { validateTransition, canAccessStage, canApprove } from "@/utils/workflow-validation";
import { useAuth } from "@/contexts/auth-context";
import { useWarehouse } from "@/contexts/warehouse-context";

function generateId() {
  return Math.random().toString(36).substring(2, 10);
}

function generateGRN() {
  const d = new Date();
  const dateStr = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, "0")}${String(d.getDate()).padStart(2, "0")}`;
  return `GRN-${dateStr}-${generateId().substring(0, 4).toUpperCase()}`;
}

function generatePassId(prefix: string) {
  return `${prefix}-${generateId().substring(0, 6).toUpperCase()}`;
}

interface StockInContextType {
  requests: StockInRequest[];
  inventory: InventoryItem[];
  auditLog: AuditEntry[];
  getRequestsByWarehouse: (warehouseId: string) => StockInRequest[];
  getInventoryByWarehouse: (warehouseId: string) => InventoryItem[];
  getAuditByWarehouse: (warehouseId: string) => AuditEntry[];
  createRequest: (
    data: Omit<StockInRequest, "id" | "status" | "createdAt" | "grnNumber" | "createdBy">
  ) => StockInRequest | null;
  approveRequest: (id: string) => { success: boolean; error?: string };
  rejectRequest: (id: string, reason: string) => { success: boolean; error?: string };
  requestModification: (id: string, note: string) => { success: boolean; error?: string };
  generateGRNForRequest: (id: string) => { success: boolean; error?: string };
  recordVehicleEntry: (id: string, entry: Omit<VehicleEntry, "gateEntryPassId" | "entryTime">) => { success: boolean; error?: string };
  recordInspection: (id: string, inspection: Omit<InspectionResult, "inspectedAt">) => { success: boolean; error?: string };
  allocatePutAway: (id: string, allocations: PutAwayAllocation[]) => { success: boolean; error?: string };
  confirmPutAway: (id: string) => { success: boolean; error?: string };
  recordVehicleExit: (id: string, netWeight?: number) => { success: boolean; error?: string };
  completeRequest: (id: string) => { success: boolean; error?: string };
  getRequest: (id: string) => StockInRequest | undefined;
}

const StockInContext = createContext<StockInContextType | null>(null);

export function StockInProviderEnhanced({ children }: { children: React.ReactNode }) {
  const [requests, setRequests] = useState<StockInRequest[]>([]);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [auditLog, setAuditLog] = useState<AuditEntry[]>([]);
  const { currentUser } = useAuth();
  const { currentWarehouse } = useWarehouse();

  const addAudit = useCallback(
    (action: string, entity: string, entityId: string, details: string, warehouseId: string) => {
      if (!currentUser) return;
      const entry: AuditEntry = {
        id: generateId(),
        timestamp: new Date().toISOString(),
        action,
        entity,
        entityId,
        details,
        performedBy: currentUser.id,
        performedByName: currentUser.name,
        userRole: currentUser.role,
        warehouseId,
      };
      setAuditLog((prev) => [entry, ...prev]);
    },
    [currentUser]
  );

  const getRequestsByWarehouse = useCallback((warehouseId: string) => {
    return requests.filter((r) => r.warehouseId === warehouseId);
  }, [requests]);

  const getInventoryByWarehouse = useCallback((warehouseId: string) => {
    return inventory.filter((i) => i.warehouseId === warehouseId);
  }, [inventory]);

  const getAuditByWarehouse = useCallback((warehouseId: string) => {
    return auditLog.filter((a) => a.warehouseId === warehouseId);
  }, [auditLog]);

  const createRequest = useCallback(
    (data: Omit<StockInRequest, "id" | "status" | "createdAt" | "grnNumber" | "createdBy">) => {
      if (!currentUser || !currentWarehouse) {
        console.error("[v0] User or warehouse not available");
        return null;
      }

      const newReq: StockInRequest = {
        ...data,
        id: generateId(),
        status: "pending_approval",
        createdAt: new Date().toISOString(),
        createdBy: currentUser.id,
        warehouseId: currentWarehouse.id,
      };
      setRequests((prev) => [newReq, ...prev]);
      addAudit(
        "Stock-In Request Created",
        "StockInRequest",
        newReq.id,
        `Request created for supplier ${data.supplierName} with ${data.products.length} product line(s). PO: ${data.purchaseOrderRef}`,
        currentWarehouse.id
      );
      return newReq;
    },
    [currentUser, currentWarehouse, addAudit]
  );

  const updateRequest = useCallback(
    (id: string, updater: (req: StockInRequest) => StockInRequest) => {
      setRequests((prev) => prev.map((r) => (r.id === id ? updater(r) : r)));
    },
    []
  );

  const approveRequest = useCallback(
    (id: string) => {
      if (!currentUser || !canApprove(currentUser.role)) {
        return { success: false, error: "You don't have permission to approve requests" };
      }

      const req = requests.find((r) => r.id === id);
      if (!req) {
        return { success: false, error: "Request not found" };
      }

      // Validate transition
      const validation = validateTransition(req.status, "approved");
      if (!validation.isValid) {
        return { success: false, error: validation.error };
      }

      const grn = generateGRN();
      updateRequest(id, (r) => ({
        ...r,
        status: "approved",
        approvedAt: new Date().toISOString(),
        approvedBy: currentUser.id,
      }));
      addAudit(
        "Request Approved",
        "StockInRequest",
        id,
        `Approved by ${currentUser.name}. Ready for GRN generation.`,
        req.warehouseId
      );
      return { success: true };
    },
    [currentUser, requests, updateRequest, addAudit]
  );

  const rejectRequest = useCallback(
    (id: string, reason: string) => {
      if (!currentUser || !canApprove(currentUser.role)) {
        return { success: false, error: "You don't have permission to reject requests" };
      }

      const req = requests.find((r) => r.id === id);
      if (!req) {
        return { success: false, error: "Request not found" };
      }

      // Validate transition
      const validation = validateTransition(req.status, "rejected");
      if (!validation.isValid) {
        return { success: false, error: validation.error };
      }

      updateRequest(id, (r) => ({
        ...r,
        status: "rejected",
        rejectedAt: new Date().toISOString(),
        rejectedBy: currentUser.id,
        rejectionReason: reason,
      }));
      addAudit(
        "Request Rejected",
        "StockInRequest",
        id,
        `Rejected by ${currentUser.name}. Reason: ${reason}`,
        req.warehouseId
      );
      return { success: true };
    },
    [currentUser, requests, updateRequest, addAudit]
  );

  const requestModification = useCallback(
    (id: string, note: string) => {
      if (!currentUser || !canApprove(currentUser.role)) {
        return { success: false, error: "You don't have permission to request modifications" };
      }

      const req = requests.find((r) => r.id === id);
      if (!req) {
        return { success: false, error: "Request not found" };
      }

      // Validate transition
      const validation = validateTransition(req.status, "modification_requested");
      if (!validation.isValid) {
        return { success: false, error: validation.error };
      }

      updateRequest(id, (r) => ({
        ...r,
        status: "modification_requested",
        modificationNote: note,
      }));
      addAudit(
        "Modification Requested",
        "StockInRequest",
        id,
        `Modifications requested by ${currentUser.name}. Note: ${note}`,
        req.warehouseId
      );
      return { success: true };
    },
    [currentUser, requests, updateRequest, addAudit]
  );

  const generateGRNForRequest = useCallback(
    (id: string) => {
      const req = requests.find((r) => r.id === id);
      if (!req) {
        return { success: false, error: "Request not found" };
      }

      // Validate transition
      const validation = validateTransition(req.status, "grn_generated");
      if (!validation.isValid) {
        return { success: false, error: validation.error };
      }

      const grn = generateGRN();
      updateRequest(id, (r) => ({
        ...r,
        status: "grn_generated",
        grnNumber: grn,
      }));
      addAudit(
        "GRN Generated",
        "StockInRequest",
        id,
        `GRN generated: ${grn}`,
        req.warehouseId
      );
      return { success: true };
    },
    [requests, updateRequest, addAudit]
  );

  const recordVehicleEntry = useCallback(
    (id: string, entry: Omit<VehicleEntry, "gateEntryPassId" | "entryTime">) => {
      const req = requests.find((r) => r.id === id);
      if (!req) {
        return { success: false, error: "Request not found" };
      }

      // Validate transition
      const validation = validateTransition(req.status, "vehicle_entered");
      if (!validation.isValid) {
        return { success: false, error: validation.error };
      }

      const vehicleEntry: VehicleEntry = {
        ...entry,
        gateEntryPassId: generatePassId("GEP"),
        entryTime: new Date().toISOString(),
      };
      updateRequest(id, (r) => ({
        ...r,
        status: "vehicle_entered",
        vehicleEntry,
      }));
      addAudit(
        "Vehicle Entry Recorded",
        "StockInRequest",
        id,
        `Vehicle: ${entry.vehicleNumber}, Driver: ${entry.driverName}, Pass: ${vehicleEntry.gateEntryPassId}`,
        req.warehouseId
      );
      return { success: true };
    },
    [requests, updateRequest, addAudit]
  );

  const recordInspection = useCallback(
    (id: string, inspection: Omit<InspectionResult, "inspectedAt">) => {
      const req = requests.find((r) => r.id === id);
      if (!req || !currentUser) {
        return { success: false, error: "Request or user not found" };
      }

      // Validate transition
      const validation = validateTransition(req.status, "unloading_inspection");
      if (!validation.isValid) {
        return { success: false, error: validation.error };
      }

      const result: InspectionResult = {
        ...inspection,
        inspectedAt: new Date().toISOString(),
      };
      updateRequest(id, (r) => ({
        ...r,
        status: "unloading_inspection",
        inspection: result,
        inspectedBy: currentUser.id,
      }));
      addAudit(
        "Inspection Recorded",
        "StockInRequest",
        id,
        `Status: ${result.overallStatus}, Items inspected: ${result.items.length}`,
        req.warehouseId
      );
      return { success: true };
    },
    [requests, currentUser, updateRequest, addAudit]
  );

  const allocatePutAway = useCallback(
    (id: string, allocations: PutAwayAllocation[]) => {
      const req = requests.find((r) => r.id === id);
      if (!req) {
        return { success: false, error: "Request not found" };
      }

      // Validate transition
      const validation = validateTransition(req.status, "put_away");
      if (!validation.isValid) {
        return { success: false, error: validation.error };
      }

      updateRequest(id, (r) => ({
        ...r,
        status: "put_away",
        putAwayAllocations: allocations,
      }));
      addAudit(
        "Put-Away Allocated",
        "StockInRequest",
        id,
        `${allocations.length} allocation(s) configured`,
        req.warehouseId
      );
      return { success: true };
    },
    [requests, updateRequest, addAudit]
  );

  const confirmPutAway = useCallback(
    (id: string) => {
      const req = requests.find((r) => r.id === id);
      if (!req || !req.putAwayAllocations || !req.grnNumber || !currentUser) {
        return { success: false, error: "Invalid request or missing data" };
      }

      const newItems: InventoryItem[] = req.putAwayAllocations.map((alloc) => {
        const product = req.products.find((p) => p.id === alloc.productId);
        return {
          id: generateId(),
          grnNumber: req.grnNumber!,
          productId: alloc.productId,
          sku: product?.sku || "",
          productName: product?.name || "",
          quantity: alloc.quantity,
          weight: product?.weight || 0,
          uom: product?.uom || "units",
          batchNumber: product?.batchNumber,
          expiryDate: product?.expiryDate,
          zoneId: alloc.zoneId,
          zoneName: alloc.zoneName,
          structureId: alloc.structureId,
          structureName: alloc.structureName,
          levelId: alloc.levelId,
          levelName: alloc.levelName,
          partitionId: alloc.partitionId,
          partitionName: alloc.partitionName,
          warehouseId: req.warehouseId,
          placedAt: new Date().toISOString(),
          placedBy: currentUser.id,
        };
      });

      setInventory((prev) => [...prev, ...newItems]);
      addAudit(
        "Put-Away Confirmed & Inventory Updated",
        "StockInRequest",
        id,
        `${newItems.length} item(s) added to inventory`,
        req.warehouseId
      );
      return { success: true };
    },
    [requests, currentUser, addAudit]
  );

  const recordVehicleExit = useCallback(
    (id: string, netWeight?: number) => {
      const req = requests.find((r) => r.id === id);
      if (!req) {
        return { success: false, error: "Request not found" };
      }

      // Validate transition
      const validation = validateTransition(req.status, "vehicle_exited");
      if (!validation.isValid) {
        return { success: false, error: validation.error };
      }

      updateRequest(id, (r) => ({
        ...r,
        status: "vehicle_exited",
        vehicleEntry: r.vehicleEntry
          ? {
              ...r.vehicleEntry,
              exitTime: new Date().toISOString(),
              netWeight,
              exitPassId: generatePassId("GXP"),
            }
          : r.vehicleEntry,
      }));
      addAudit(
        "Vehicle Exit Recorded",
        "StockInRequest",
        id,
        `Net weight: ${netWeight ?? "N/A"}`,
        req.warehouseId
      );
      return { success: true };
    },
    [requests, updateRequest, addAudit]
  );

  const completeRequest = useCallback(
    (id: string) => {
      const req = requests.find((r) => r.id === id);
      if (!req || !currentUser) {
        return { success: false, error: "Request or user not found" };
      }

      // Validate transition
      const validation = validateTransition(req.status, "completed");
      if (!validation.isValid) {
        return { success: false, error: validation.error };
      }

      const hasPartial = req.inspection?.overallStatus === "partial";
      updateRequest(id, (r) => ({
        ...r,
        status: hasPartial ? "partially_completed" : "completed",
        completedAt: new Date().toISOString(),
        completedBy: currentUser.id,
      }));
      addAudit(
        "Request Completed",
        "StockInRequest",
        id,
        hasPartial ? "Completed with partial acceptance" : "Fully completed",
        req.warehouseId
      );
      return { success: true };
    },
    [requests, currentUser, updateRequest, addAudit]
  );

  const getRequest = useCallback(
    (id: string) => requests.find((r) => r.id === id),
    [requests]
  );

  return (
    <StockInContext.Provider
      value={{
        requests,
        inventory,
        auditLog,
        getRequestsByWarehouse,
        getInventoryByWarehouse,
        getAuditByWarehouse,
        createRequest,
        approveRequest,
        rejectRequest,
        requestModification,
        generateGRNForRequest,
        recordVehicleEntry,
        recordInspection,
        allocatePutAway,
        confirmPutAway,
        recordVehicleExit,
        completeRequest,
        getRequest,
      }}
    >
      {children}
    </StockInContext.Provider>
  );
}

export function useStockInEnhanced() {
  const ctx = useContext(StockInContext);
  if (!ctx) throw new Error("useStockInEnhanced must be used within StockInProviderEnhanced");
  return ctx;
}

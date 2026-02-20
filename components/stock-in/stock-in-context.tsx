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
  createRequest: (
    data: Omit<StockInRequest, "id" | "status" | "createdAt" | "grnNumber">
  ) => StockInRequest;
  approveRequest: (id: string) => void;
  rejectRequest: (id: string, reason: string) => void;
  requestModification: (id: string, note: string) => void;
  generateGRNForRequest: (id: string) => void;
  recordVehicleEntry: (id: string, entry: Omit<VehicleEntry, "gateEntryPassId" | "entryTime">) => void;
  recordInspection: (id: string, inspection: Omit<InspectionResult, "inspectedAt">) => void;
  allocatePutAway: (id: string, allocations: PutAwayAllocation[]) => void;
  confirmPutAway: (id: string) => void;
  recordVehicleExit: (id: string, netWeight?: number) => void;
  completeRequest: (id: string) => void;
  getRequest: (id: string) => StockInRequest | undefined;
  updateRequestStatus: (id: string, status: StockInStatus) => void;
}

const StockInContext = createContext<StockInContextType | null>(null);

export function StockInProvider({ children }: { children: React.ReactNode }) {
  const [requests, setRequests] = useState<StockInRequest[]>([]);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [auditLog, setAuditLog] = useState<AuditEntry[]>([]);

  const addAudit = useCallback(
    (action: string, entity: string, entityId: string, details: string) => {
      const entry: AuditEntry = {
        id: generateId(),
        timestamp: new Date().toISOString(),
        action,
        entity,
        entityId,
        details,
        performedBy: "System",
      };
      setAuditLog((prev) => [entry, ...prev]);
    },
    []
  );

  const createRequest = useCallback(
    (data: Omit<StockInRequest, "id" | "status" | "createdAt" | "grnNumber">) => {
      const newReq: StockInRequest = {
        ...data,
        id: generateId(),
        status: "pending_approval",
        createdAt: new Date().toISOString(),
      };
      setRequests((prev) => [newReq, ...prev]);
      addAudit(
        "Stock-In Request Created",
        "StockInRequest",
        newReq.id,
        `Request created for supplier ${data.supplierName} with ${data.products.length} product line(s). PO: ${data.purchaseOrderRef}`
      );
      return newReq;
    },
    [addAudit]
  );

  const updateRequest = useCallback(
    (id: string, updater: (req: StockInRequest) => StockInRequest) => {
      setRequests((prev) => prev.map((r) => (r.id === id ? updater(r) : r)));
    },
    []
  );

  const approveRequest = useCallback(
    (id: string) => {
      const grn = generateGRN();
      updateRequest(id, (r) => ({
        ...r,
        status: "grn_generated",
        approvedAt: new Date().toISOString(),
        grnNumber: grn,
      }));
      addAudit("Request Approved & GRN Generated", "StockInRequest", id, `Approved. GRN: ${grn}`);
    },
    [updateRequest, addAudit]
  );

  const rejectRequest = useCallback(
    (id: string, reason: string) => {
      updateRequest(id, (r) => ({
        ...r,
        status: "rejected",
        rejectedAt: new Date().toISOString(),
        rejectionReason: reason,
      }));
      addAudit("Request Rejected", "StockInRequest", id, `Reason: ${reason}`);
    },
    [updateRequest, addAudit]
  );

  const requestModification = useCallback(
    (id: string, note: string) => {
      updateRequest(id, (r) => ({
        ...r,
        status: "modification_requested",
        modificationNote: note,
      }));
      addAudit("Modification Requested", "StockInRequest", id, `Note: ${note}`);
    },
    [updateRequest, addAudit]
  );

  const generateGRNForRequest = useCallback(
    (id: string) => {
      const grn = generateGRN();
      updateRequest(id, (r) => ({
        ...r,
        status: "grn_generated",
        grnNumber: grn,
      }));
      addAudit("GRN Generated", "StockInRequest", id, `GRN: ${grn}`);
    },
    [updateRequest, addAudit]
  );

  const recordVehicleEntry = useCallback(
    (id: string, entry: Omit<VehicleEntry, "gateEntryPassId" | "entryTime">) => {
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
        `Vehicle: ${entry.vehicleNumber}, Driver: ${entry.driverName}, Pass: ${vehicleEntry.gateEntryPassId}`
      );
    },
    [updateRequest, addAudit]
  );

  const recordInspection = useCallback(
    (id: string, inspection: Omit<InspectionResult, "inspectedAt">) => {
      const result: InspectionResult = {
        ...inspection,
        inspectedAt: new Date().toISOString(),
      };
      updateRequest(id, (r) => ({
        ...r,
        status: "unloading_inspection",
        inspection: result,
      }));
      addAudit(
        "Inspection Recorded",
        "StockInRequest",
        id,
        `Status: ${result.overallStatus}, Items inspected: ${result.items.length}`
      );
    },
    [updateRequest, addAudit]
  );

  const allocatePutAway = useCallback(
    (id: string, allocations: PutAwayAllocation[]) => {
      updateRequest(id, (r) => ({
        ...r,
        status: "put_away",
        putAwayAllocations: allocations,
      }));
      addAudit(
        "Put-Away Allocated",
        "StockInRequest",
        id,
        `${allocations.length} allocation(s) configured`
      );
    },
    [updateRequest, addAudit]
  );

  const confirmPutAway = useCallback(
    (id: string) => {
      const req = requests.find((r) => r.id === id);
      if (!req || !req.putAwayAllocations || !req.grnNumber) return;

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
          placedAt: new Date().toISOString(),
        };
      });

      setInventory((prev) => [...prev, ...newItems]);
      addAudit(
        "Put-Away Confirmed & Inventory Updated",
        "StockInRequest",
        id,
        `${newItems.length} item(s) added to inventory`
      );
    },
    [requests, addAudit]
  );

  const recordVehicleExit = useCallback(
    (id: string, netWeight?: number) => {
      updateRequest(id, (r) => ({
        ...r,
        vehicleEntry: r.vehicleEntry
          ? {
              ...r.vehicleEntry,
              exitTime: new Date().toISOString(),
              netWeight,
              exitPassId: generatePassId("GXP"),
            }
          : r.vehicleEntry,
      }));
      addAudit("Vehicle Exit Recorded", "StockInRequest", id, `Net weight: ${netWeight ?? "N/A"}`);
    },
    [updateRequest, addAudit]
  );

  const completeRequest = useCallback(
    (id: string) => {
      const req = requests.find((r) => r.id === id);
      const hasPartial = req?.inspection?.overallStatus === "partial";
      updateRequest(id, (r) => ({
        ...r,
        status: hasPartial ? "partially_completed" : "completed",
        completedAt: new Date().toISOString(),
      }));
      addAudit(
        "Request Completed",
        "StockInRequest",
        id,
        hasPartial ? "Completed with partial acceptance" : "Fully completed"
      );
    },
    [requests, updateRequest, addAudit]
  );

  const getRequest = useCallback(
    (id: string) => requests.find((r) => r.id === id),
    [requests]
  );

  const updateRequestStatus = useCallback(
    (id: string, status: StockInStatus) => {
      updateRequest(id, (r) => ({ ...r, status }));
    },
    [updateRequest]
  );

  return (
    <StockInContext.Provider
      value={{
        requests,
        inventory,
        auditLog,
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
        updateRequestStatus,
      }}
    >
      {children}
    </StockInContext.Provider>
  );
}

export function useStockIn() {
  const ctx = useContext(StockInContext);
  if (!ctx) throw new Error("useStockIn must be used within StockInProvider");
  return ctx;
}

"use client";

import { useState } from "react";
import {
  ArrowLeft,
  Check,
  ChevronDown,
  ChevronRight,
  FileText,
  ShieldCheck,
  Truck,
  ClipboardCheck,
  PackageOpen,
  LogOut,
  CheckCircle2,
  CircleDot,
  Circle,
} from "lucide-react";
import { useStockIn } from "./stock-in-context";
import { useWarehouseData } from "./warehouse-data-context";
import { StatusBadge } from "./status-badge";
import type {
  StockInRequest,
  StockInStatus,
  InspectionItem,
  PutAwayAllocation,
} from "./types";

// --- Stage definitions ---
const stageOrder: { key: string; label: string; icon: React.ElementType; statusMatch: StockInStatus[] }[] = [
  { key: "created", label: "Request Created", icon: FileText, statusMatch: ["pending_approval", "modification_requested"] },
  { key: "approval", label: "Manager Approval", icon: ShieldCheck, statusMatch: ["approved", "rejected"] },
  { key: "grn", label: "GRN Generation", icon: FileText, statusMatch: ["grn_generated"] },
  { key: "vehicle_entry", label: "Vehicle Entry", icon: Truck, statusMatch: ["vehicle_entered"] },
  { key: "inspection", label: "Unloading & Inspection", icon: ClipboardCheck, statusMatch: ["unloading_inspection"] },
  { key: "put_away", label: "Put-Away", icon: PackageOpen, statusMatch: ["put_away"] },
  { key: "vehicle_exit", label: "Vehicle Exit", icon: LogOut, statusMatch: [] },
  { key: "completion", label: "Completion", icon: CheckCircle2, statusMatch: ["completed", "partially_completed"] },
];

function getActiveStageIndex(status: StockInStatus): number {
  if (status === "rejected") return 1;
  const idx = stageOrder.findIndex((s) => s.statusMatch.includes(status));
  return idx >= 0 ? idx : 0;
}

function getStageState(stageIdx: number, activeIdx: number): "done" | "active" | "upcoming" {
  if (stageIdx < activeIdx) return "done";
  if (stageIdx === activeIdx) return "active";
  return "upcoming";
}

interface RequestDetailProps {
  requestId: string;
  onBack: () => void;
}

export function RequestDetail({ requestId, onBack }: RequestDetailProps) {
  const { getRequest, approveRequest, rejectRequest, requestModification, recordVehicleEntry, recordInspection, allocatePutAway, confirmPutAway, recordVehicleExit, completeRequest } = useStockIn();
  const request = getRequest(requestId);
  const [expandedStage, setExpandedStage] = useState<string | null>(null);

  if (!request) {
    return (
      <div className="p-6">
        <button onClick={onBack} className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> Back
        </button>
        <p className="mt-8 text-center text-muted-foreground">Request not found.</p>
      </div>
    );
  }

  const activeStageIdx = getActiveStageIndex(request.status);

  const toggleStage = (key: string) => {
    setExpandedStage((prev) => (prev === key ? null : key));
  };

  return (
    <div className="flex flex-col gap-6 p-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button onClick={onBack} className="rounded-md p-1.5 hover:bg-accent">
          <ArrowLeft className="h-5 w-5 text-muted-foreground" />
        </button>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-lg font-bold text-foreground">{request.purchaseOrderRef}</h1>
            <StatusBadge status={request.status} />
          </div>
          <p className="text-sm text-muted-foreground">
            {request.supplierName} &middot; {request.products.length} product(s)
            {request.grnNumber && (
              <span className="ml-2 font-mono text-xs">GRN: {request.grnNumber}</span>
            )}
          </p>
        </div>
      </div>

      {/* Stepper Timeline */}
      <div className="flex items-center gap-0 overflow-x-auto rounded-lg border border-border bg-card p-4">
        {stageOrder.map((stage, idx) => {
          const state = getStageState(idx, activeStageIdx);
          const isRejected = request.status === "rejected" && idx === 1;
          return (
            <div key={stage.key} className="flex items-center">
              <button
                onClick={() => toggleStage(stage.key)}
                className="flex flex-col items-center gap-1.5 px-3"
              >
                <div
                  className={`flex h-8 w-8 items-center justify-center rounded-full border-2 transition-colors ${
                    isRejected
                      ? "border-red-400 bg-red-50 text-red-600"
                      : state === "done"
                        ? "border-emerald-400 bg-emerald-50 text-emerald-600"
                        : state === "active"
                          ? "border-blue-400 bg-blue-50 text-blue-600"
                          : "border-border bg-muted text-muted-foreground"
                  }`}
                >
                  {state === "done" ? (
                    <Check className="h-4 w-4" />
                  ) : state === "active" ? (
                    <CircleDot className="h-4 w-4" />
                  ) : (
                    <Circle className="h-4 w-4" />
                  )}
                </div>
                <span
                  className={`whitespace-nowrap text-[10px] font-medium ${
                    state === "active"
                      ? "text-blue-600"
                      : state === "done"
                        ? "text-emerald-600"
                        : "text-muted-foreground"
                  }`}
                >
                  {stage.label}
                </span>
              </button>
              {idx < stageOrder.length - 1 && (
                <div
                  className={`h-0.5 w-8 ${
                    idx < activeStageIdx ? "bg-emerald-400" : "bg-border"
                  }`}
                />
              )}
            </div>
          );
        })}
      </div>

      {/* Stage Cards */}
      <div className="flex flex-col gap-3">
        {stageOrder.map((stage, idx) => {
          const state = getStageState(idx, activeStageIdx);
          const isExpanded = expandedStage === stage.key;
          return (
            <div
              key={stage.key}
              className={`rounded-lg border transition-colors ${
                state === "active"
                  ? "border-blue-200 bg-blue-50/30"
                  : state === "done"
                    ? "border-border bg-card"
                    : "border-border bg-muted/30"
              }`}
            >
              <button
                onClick={() => toggleStage(stage.key)}
                className="flex w-full items-center gap-3 px-4 py-3 text-left"
              >
                <stage.icon
                  className={`h-4 w-4 ${
                    state === "active"
                      ? "text-blue-600"
                      : state === "done"
                        ? "text-emerald-600"
                        : "text-muted-foreground"
                  }`}
                />
                <span
                  className={`flex-1 text-sm font-medium ${
                    state === "upcoming" ? "text-muted-foreground" : "text-foreground"
                  }`}
                >
                  {stage.label}
                </span>
                {state === "done" && (
                  <span className="mr-2 text-[10px] font-medium text-emerald-600">DONE</span>
                )}
                {isExpanded ? (
                  <ChevronDown className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                )}
              </button>
              {isExpanded && (
                <div className="border-t border-border px-4 py-4">
                  <StageContent
                    stageKey={stage.key}
                    request={request}
                    state={state}
                    approveRequest={approveRequest}
                    rejectRequest={rejectRequest}
                    requestModification={requestModification}
                    recordVehicleEntry={recordVehicleEntry}
                    recordInspection={recordInspection}
                    allocatePutAway={allocatePutAway}
                    confirmPutAway={confirmPutAway}
                    recordVehicleExit={recordVehicleExit}
                    completeRequest={completeRequest}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// --- Stage Content Renderer ---
interface StageContentProps {
  stageKey: string;
  request: StockInRequest;
  state: "done" | "active" | "upcoming";
  approveRequest: (id: string) => void;
  rejectRequest: (id: string, reason: string) => void;
  requestModification: (id: string, note: string) => void;
  recordVehicleEntry: (id: string, entry: { vehicleNumber: string; driverName: string; driverPhone: string; grossWeight?: number }) => void;
  recordInspection: (id: string, inspection: { inspectedBy: string; items: InspectionItem[]; overallStatus: "accepted" | "partial" | "rejected" }) => void;
  allocatePutAway: (id: string, allocations: PutAwayAllocation[]) => void;
  confirmPutAway: (id: string) => void;
  recordVehicleExit: (id: string, netWeight?: number) => void;
  completeRequest: (id: string) => void;
}

function StageContent(props: StageContentProps) {
  switch (props.stageKey) {
    case "created":
      return <CreatedStage request={props.request} />;
    case "approval":
      return (
        <ApprovalStage
          request={props.request}
          state={props.state}
          approveRequest={props.approveRequest}
          rejectRequest={props.rejectRequest}
          requestModification={props.requestModification}
        />
      );
    case "grn":
      return <GRNStage request={props.request} />;
    case "vehicle_entry":
      return (
        <VehicleEntryStage
          request={props.request}
          state={props.state}
          recordVehicleEntry={props.recordVehicleEntry}
        />
      );
    case "inspection":
      return (
        <InspectionStage
          request={props.request}
          state={props.state}
          recordInspection={props.recordInspection}
        />
      );
    case "put_away":
      return (
        <PutAwayStage
          request={props.request}
          state={props.state}
          allocatePutAway={props.allocatePutAway}
          confirmPutAway={props.confirmPutAway}
        />
      );
    case "vehicle_exit":
      return (
        <VehicleExitStage
          request={props.request}
          state={props.state}
          recordVehicleExit={props.recordVehicleExit}
        />
      );
    case "completion":
      return (
        <CompletionStage
          request={props.request}
          state={props.state}
          completeRequest={props.completeRequest}
        />
      );
    default:
      return null;
  }
}

const labelClass = "text-xs font-medium text-muted-foreground";
const valueClass = "text-sm text-foreground";
const inputClass =
  "w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground outline-none focus:ring-2 focus:ring-ring";

// --- Stage 1: Created ---
function CreatedStage({ request }: { request: StockInRequest }) {
  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-3 gap-4">
        <div><p className={labelClass}>Supplier</p><p className={valueClass}>{request.supplierName}</p></div>
        <div><p className={labelClass}>Contact</p><p className={valueClass}>{request.supplierContact || "--"}</p></div>
        <div><p className={labelClass}>PO Reference</p><p className={valueClass}>{request.purchaseOrderRef}</p></div>
        <div><p className={labelClass}>Expected Delivery</p><p className={valueClass}>{request.expectedDeliveryDate}</p></div>
        <div><p className={labelClass}>Created</p><p className={valueClass}>{new Date(request.createdAt).toLocaleString()}</p></div>
      </div>
      <div>
        <p className={`${labelClass} mb-2`}>Products ({request.products.length})</p>
        <div className="overflow-hidden rounded-md border border-border">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="px-3 py-2 text-left font-medium text-muted-foreground">SKU</th>
                <th className="px-3 py-2 text-left font-medium text-muted-foreground">Name</th>
                <th className="px-3 py-2 text-right font-medium text-muted-foreground">Qty</th>
                <th className="px-3 py-2 text-left font-medium text-muted-foreground">UOM</th>
                <th className="px-3 py-2 text-right font-medium text-muted-foreground">Weight</th>
                <th className="px-3 py-2 text-left font-medium text-muted-foreground">Batch</th>
                <th className="px-3 py-2 text-left font-medium text-muted-foreground">Expiry</th>
              </tr>
            </thead>
            <tbody>
              {request.products.map((p) => (
                <tr key={p.id} className="border-b border-border last:border-0">
                  <td className="px-3 py-2 font-mono">{p.sku}</td>
                  <td className="px-3 py-2">{p.name}</td>
                  <td className="px-3 py-2 text-right">{p.quantity}</td>
                  <td className="px-3 py-2">{p.uom}</td>
                  <td className="px-3 py-2 text-right">{p.weight}</td>
                  <td className="px-3 py-2">{p.batchNumber || "--"}</td>
                  <td className="px-3 py-2">{p.expiryDate || "--"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// --- Stage 2: Approval ---
function ApprovalStage({
  request,
  state,
  approveRequest,
  rejectRequest,
  requestModification,
}: {
  request: StockInRequest;
  state: string;
  approveRequest: (id: string) => void;
  rejectRequest: (id: string, reason: string) => void;
  requestModification: (id: string, note: string) => void;
}) {
  const [reason, setReason] = useState("");
  const [action, setAction] = useState<"" | "reject" | "modify">("");

  if (request.status === "rejected") {
    return (
      <div className="rounded-md border border-red-200 bg-red-50 p-3">
        <p className="text-sm font-medium text-red-800">Request Rejected</p>
        <p className="mt-1 text-xs text-red-600">Reason: {request.rejectionReason}</p>
      </div>
    );
  }

  if (request.approvedAt) {
    return (
      <div className="rounded-md border border-emerald-200 bg-emerald-50 p-3">
        <p className="text-sm font-medium text-emerald-800">Approved</p>
        <p className="mt-1 text-xs text-emerald-600">
          Approved at {new Date(request.approvedAt).toLocaleString()}
        </p>
      </div>
    );
  }

  if (request.status === "modification_requested") {
    return (
      <div className="rounded-md border border-orange-200 bg-orange-50 p-3">
        <p className="text-sm font-medium text-orange-800">Modification Requested</p>
        <p className="mt-1 text-xs text-orange-600">Note: {request.modificationNote}</p>
      </div>
    );
  }

  if (state !== "active") {
    return <p className="text-xs text-muted-foreground">Awaiting previous stage completion.</p>;
  }

  return (
    <div className="flex flex-col gap-3">
      <p className="text-xs text-muted-foreground">
        Review the request details and take an action.
      </p>
      {action && (
        <div className="flex flex-col gap-2">
          <label className={labelClass}>
            {action === "reject" ? "Rejection Reason" : "Modification Note"}
          </label>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={3}
            className={inputClass}
            placeholder={action === "reject" ? "Why is this request rejected?" : "What needs to be modified?"}
          />
        </div>
      )}
      <div className="flex gap-2">
        {!action && (
          <>
            <button
              onClick={() => approveRequest(request.id)}
              className="rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700"
            >
              Approve
            </button>
            <button
              onClick={() => setAction("reject")}
              className="rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
            >
              Reject
            </button>
            <button
              onClick={() => setAction("modify")}
              className="rounded-md border border-input px-4 py-2 text-sm font-medium text-foreground hover:bg-accent"
            >
              Request Modification
            </button>
          </>
        )}
        {action === "reject" && (
          <>
            <button
              onClick={() => { if (reason.trim()) { rejectRequest(request.id, reason); setAction(""); } }}
              disabled={!reason.trim()}
              className="rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
            >
              Confirm Rejection
            </button>
            <button onClick={() => { setAction(""); setReason(""); }} className="rounded-md border border-input px-4 py-2 text-sm font-medium text-foreground hover:bg-accent">
              Cancel
            </button>
          </>
        )}
        {action === "modify" && (
          <>
            <button
              onClick={() => { if (reason.trim()) { requestModification(request.id, reason); setAction(""); } }}
              disabled={!reason.trim()}
              className="rounded-md bg-orange-600 px-4 py-2 text-sm font-medium text-white hover:bg-orange-700 disabled:opacity-50"
            >
              Send Modification Request
            </button>
            <button onClick={() => { setAction(""); setReason(""); }} className="rounded-md border border-input px-4 py-2 text-sm font-medium text-foreground hover:bg-accent">
              Cancel
            </button>
          </>
        )}
      </div>
    </div>
  );
}

// --- Stage 3: GRN ---
function GRNStage({ request }: { request: StockInRequest }) {
  if (!request.grnNumber) {
    return <p className="text-xs text-muted-foreground">GRN will be generated upon approval.</p>;
  }
  return (
    <div className="rounded-md border border-blue-200 bg-blue-50 p-4">
      <p className={labelClass}>Goods Receipt Note Number</p>
      <p className="mt-1 text-lg font-bold text-blue-800 font-mono">{request.grnNumber}</p>
      <p className="mt-2 text-xs text-blue-600">
        Generated at approval. This GRN tracks the entire inbound shipment.
      </p>
    </div>
  );
}

// --- Stage 4: Vehicle Entry ---
function VehicleEntryStage({
  request,
  state,
  recordVehicleEntry,
}: {
  request: StockInRequest;
  state: string;
  recordVehicleEntry: (id: string, entry: { vehicleNumber: string; driverName: string; driverPhone: string; grossWeight?: number }) => void;
}) {
  const [vehicleNumber, setVehicleNumber] = useState(request.vehicleNumber || "");
  const [driverName, setDriverName] = useState(request.driverName || "");
  const [driverPhone, setDriverPhone] = useState(request.driverPhone || "");
  const [grossWeight, setGrossWeight] = useState<string>("");

  if (request.vehicleEntry) {
    const ve = request.vehicleEntry;
    return (
      <div className="flex flex-col gap-3">
        <div className="rounded-md border border-emerald-200 bg-emerald-50 p-3">
          <p className="text-sm font-medium text-emerald-800">Vehicle Entry Recorded</p>
        </div>
        <div className="grid grid-cols-3 gap-4">
          <div><p className={labelClass}>Vehicle</p><p className={valueClass}>{ve.vehicleNumber}</p></div>
          <div><p className={labelClass}>Driver</p><p className={valueClass}>{ve.driverName}</p></div>
          <div><p className={labelClass}>Phone</p><p className={valueClass}>{ve.driverPhone}</p></div>
          <div><p className={labelClass}>Gate Entry Pass</p><p className={valueClass + " font-mono"}>{ve.gateEntryPassId}</p></div>
          <div><p className={labelClass}>Gross Weight</p><p className={valueClass}>{ve.grossWeight ?? "--"}</p></div>
          <div><p className={labelClass}>Entry Time</p><p className={valueClass}>{new Date(ve.entryTime).toLocaleString()}</p></div>
        </div>
      </div>
    );
  }

  const isActive = state === "active" || (request.grnNumber && !request.vehicleEntry);
  if (!isActive) {
    return <p className="text-xs text-muted-foreground">Awaiting GRN generation.</p>;
  }

  return (
    <div className="flex flex-col gap-4">
      <p className="text-xs text-muted-foreground">Record vehicle and driver details for gate entry.</p>
      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-1.5">
          <label className={labelClass}>Vehicle Number *</label>
          <input value={vehicleNumber} onChange={(e) => setVehicleNumber(e.target.value)} className={inputClass} />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className={labelClass}>Driver Name *</label>
          <input value={driverName} onChange={(e) => setDriverName(e.target.value)} className={inputClass} />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className={labelClass}>Driver Phone *</label>
          <input value={driverPhone} onChange={(e) => setDriverPhone(e.target.value)} className={inputClass} />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className={labelClass}>Gross Weight (optional)</label>
          <input type="number" value={grossWeight} onChange={(e) => setGrossWeight(e.target.value)} className={inputClass} />
        </div>
      </div>
      <button
        onClick={() => {
          if (vehicleNumber && driverName && driverPhone) {
            recordVehicleEntry(request.id, {
              vehicleNumber,
              driverName,
              driverPhone,
              grossWeight: grossWeight ? Number(grossWeight) : undefined,
            });
          }
        }}
        disabled={!vehicleNumber || !driverName || !driverPhone}
        className="self-start rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
      >
        Record Entry & Generate Gate Pass
      </button>
    </div>
  );
}

// --- Stage 5: Inspection ---
function InspectionStage({
  request,
  state,
  recordInspection,
}: {
  request: StockInRequest;
  state: string;
  recordInspection: (id: string, inspection: { inspectedBy: string; items: InspectionItem[]; overallStatus: "accepted" | "partial" | "rejected" }) => void;
}) {
  const [inspectedBy, setInspectedBy] = useState("Warehouse Inspector");
  const [items, setItems] = useState<InspectionItem[]>(
    request.products.map((p) => ({
      productId: p.id,
      expectedQty: p.quantity,
      receivedQty: p.quantity,
      acceptedQty: p.quantity,
      damagedQty: 0,
      shortageQty: 0,
      skuVerified: true,
      notes: "",
    }))
  );

  const updateItem = (productId: string, field: string, value: unknown) => {
    setItems((prev) =>
      prev.map((item) => (item.productId === productId ? { ...item, [field]: value } : item))
    );
  };

  if (request.inspection) {
    const insp = request.inspection;
    return (
      <div className="flex flex-col gap-3">
        <div className={`rounded-md border p-3 ${
          insp.overallStatus === "accepted" ? "border-emerald-200 bg-emerald-50" :
          insp.overallStatus === "partial" ? "border-yellow-200 bg-yellow-50" :
          "border-red-200 bg-red-50"
        }`}>
          <p className={`text-sm font-medium ${
            insp.overallStatus === "accepted" ? "text-emerald-800" :
            insp.overallStatus === "partial" ? "text-yellow-800" :
            "text-red-800"
          }`}>
            Inspection: {insp.overallStatus.charAt(0).toUpperCase() + insp.overallStatus.slice(1)}
          </p>
          <p className="mt-1 text-xs opacity-70">
            By {insp.inspectedBy} at {new Date(insp.inspectedAt).toLocaleString()}
          </p>
        </div>
        <div className="overflow-hidden rounded-md border border-border">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="px-3 py-2 text-left font-medium text-muted-foreground">Product</th>
                <th className="px-3 py-2 text-right font-medium text-muted-foreground">Expected</th>
                <th className="px-3 py-2 text-right font-medium text-muted-foreground">Received</th>
                <th className="px-3 py-2 text-right font-medium text-muted-foreground">Accepted</th>
                <th className="px-3 py-2 text-right font-medium text-muted-foreground">Damaged</th>
                <th className="px-3 py-2 text-right font-medium text-muted-foreground">Shortage</th>
                <th className="px-3 py-2 text-center font-medium text-muted-foreground">SKU OK</th>
              </tr>
            </thead>
            <tbody>
              {insp.items.map((item) => {
                const product = request.products.find((p) => p.id === item.productId);
                return (
                  <tr key={item.productId} className="border-b border-border last:border-0">
                    <td className="px-3 py-2">{product?.name || item.productId}</td>
                    <td className="px-3 py-2 text-right">{item.expectedQty}</td>
                    <td className="px-3 py-2 text-right">{item.receivedQty}</td>
                    <td className="px-3 py-2 text-right">{item.acceptedQty}</td>
                    <td className="px-3 py-2 text-right">{item.damagedQty}</td>
                    <td className="px-3 py-2 text-right">{item.shortageQty}</td>
                    <td className="px-3 py-2 text-center">{item.skuVerified ? "Yes" : "No"}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  if (state !== "active" && !request.vehicleEntry) {
    return <p className="text-xs text-muted-foreground">Awaiting vehicle entry.</p>;
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-4">
        <div className="flex flex-col gap-1.5">
          <label className={labelClass}>Inspected By</label>
          <input value={inspectedBy} onChange={(e) => setInspectedBy(e.target.value)} className={inputClass} />
        </div>
      </div>
      <div className="overflow-hidden rounded-md border border-border">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-border bg-muted/50">
              <th className="px-3 py-2 text-left font-medium text-muted-foreground">Product</th>
              <th className="px-3 py-2 text-right font-medium text-muted-foreground">Expected</th>
              <th className="px-3 py-2 text-right font-medium text-muted-foreground">Received</th>
              <th className="px-3 py-2 text-right font-medium text-muted-foreground">Accepted</th>
              <th className="px-3 py-2 text-right font-medium text-muted-foreground">Damaged</th>
              <th className="px-3 py-2 text-right font-medium text-muted-foreground">Shortage</th>
              <th className="px-3 py-2 text-center font-medium text-muted-foreground">SKU OK</th>
              <th className="px-3 py-2 text-left font-medium text-muted-foreground">Notes</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => {
              const product = request.products.find((p) => p.id === item.productId);
              return (
                <tr key={item.productId} className="border-b border-border last:border-0">
                  <td className="px-3 py-2">{product?.name}</td>
                  <td className="px-3 py-2 text-right">{item.expectedQty}</td>
                  <td className="px-3 py-2">
                    <input type="number" min={0} value={item.receivedQty} onChange={(e) => updateItem(item.productId, "receivedQty", Number(e.target.value))} className="w-16 rounded border border-input bg-background px-2 py-1 text-right text-xs outline-none" />
                  </td>
                  <td className="px-3 py-2">
                    <input type="number" min={0} value={item.acceptedQty} onChange={(e) => updateItem(item.productId, "acceptedQty", Number(e.target.value))} className="w-16 rounded border border-input bg-background px-2 py-1 text-right text-xs outline-none" />
                  </td>
                  <td className="px-3 py-2">
                    <input type="number" min={0} value={item.damagedQty} onChange={(e) => updateItem(item.productId, "damagedQty", Number(e.target.value))} className="w-16 rounded border border-input bg-background px-2 py-1 text-right text-xs outline-none" />
                  </td>
                  <td className="px-3 py-2">
                    <input type="number" min={0} value={item.shortageQty} onChange={(e) => updateItem(item.productId, "shortageQty", Number(e.target.value))} className="w-16 rounded border border-input bg-background px-2 py-1 text-right text-xs outline-none" />
                  </td>
                  <td className="px-3 py-2 text-center">
                    <input type="checkbox" checked={item.skuVerified} onChange={(e) => updateItem(item.productId, "skuVerified", e.target.checked)} />
                  </td>
                  <td className="px-3 py-2">
                    <input value={item.notes} onChange={(e) => updateItem(item.productId, "notes", e.target.value)} className="w-full rounded border border-input bg-background px-2 py-1 text-xs outline-none" placeholder="Notes..." />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <button
        onClick={() => {
          const hasPartial = items.some((i) => i.acceptedQty < i.expectedQty);
          const allRejected = items.every((i) => i.acceptedQty === 0);
          const overallStatus = allRejected ? "rejected" : hasPartial ? "partial" : "accepted";
          recordInspection(request.id, { inspectedBy, items, overallStatus });
        }}
        className="self-start rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
      >
        Submit Inspection
      </button>
    </div>
  );
}

// --- Stage 6: Put-Away ---
function PutAwayStage({
  request,
  state,
  allocatePutAway,
  confirmPutAway,
}: {
  request: StockInRequest;
  state: string;
  allocatePutAway: (id: string, allocations: PutAwayAllocation[]) => void;
  confirmPutAway: (id: string) => void;
}) {
  const { layoutData } = useWarehouseData();
  const [allocations, setAllocations] = useState<PutAwayAllocation[]>(() => {
    if (request.putAwayAllocations) return request.putAwayAllocations;
    const acceptedProducts = request.inspection
      ? request.inspection.items.filter((i) => i.acceptedQty > 0)
      : request.products.map((p) => ({ productId: p.id, acceptedQty: p.quantity }));
    return acceptedProducts.map((item) => ({
      productId: item.productId,
      quantity: item.acceptedQty,
      zoneId: "",
      zoneName: "",
      structureId: "",
      structureName: "",
      levelId: "",
      levelName: "",
      partitionId: "",
      partitionName: "",
      strategy: "manual" as const,
    }));
  });

  const updateAllocation = (productId: string, fields: Partial<PutAwayAllocation>) => {
    setAllocations((prev) =>
      prev.map((a) => (a.productId === productId ? { ...a, ...fields } : a))
    );
  };

  if (request.putAwayAllocations && request.status !== "put_away") {
    return (
      <div className="flex flex-col gap-3">
        <div className="rounded-md border border-emerald-200 bg-emerald-50 p-3">
          <p className="text-sm font-medium text-emerald-800">Put-Away Completed</p>
        </div>
        <div className="overflow-hidden rounded-md border border-border">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="px-3 py-2 text-left font-medium text-muted-foreground">Product</th>
                <th className="px-3 py-2 text-right font-medium text-muted-foreground">Qty</th>
                <th className="px-3 py-2 text-left font-medium text-muted-foreground">Zone</th>
                <th className="px-3 py-2 text-left font-medium text-muted-foreground">Structure</th>
                <th className="px-3 py-2 text-left font-medium text-muted-foreground">Level</th>
                <th className="px-3 py-2 text-left font-medium text-muted-foreground">Partition</th>
                <th className="px-3 py-2 text-left font-medium text-muted-foreground">Strategy</th>
              </tr>
            </thead>
            <tbody>
              {request.putAwayAllocations.map((alloc) => {
                const product = request.products.find((p) => p.id === alloc.productId);
                return (
                  <tr key={alloc.productId} className="border-b border-border last:border-0">
                    <td className="px-3 py-2">{product?.name}</td>
                    <td className="px-3 py-2 text-right">{alloc.quantity}</td>
                    <td className="px-3 py-2">{alloc.zoneName}</td>
                    <td className="px-3 py-2">{alloc.structureName}</td>
                    <td className="px-3 py-2">{alloc.levelName}</td>
                    <td className="px-3 py-2">{alloc.partitionName}</td>
                    <td className="px-3 py-2 uppercase">{alloc.strategy}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  if (state !== "active" && !request.inspection) {
    return <p className="text-xs text-muted-foreground">Awaiting inspection.</p>;
  }

  const zones = layoutData.zones;
  const structures = layoutData.structures;

  return (
    <div className="flex flex-col gap-4">
      <p className="text-xs text-muted-foreground">
        Assign warehouse locations for each accepted product.
        {zones.length === 0 && " (No zones found -- set up zones in the Layout Designer first.)"}
      </p>
      <div className="flex flex-col gap-4">
        {allocations.map((alloc) => {
          const product = request.products.find((p) => p.id === alloc.productId);
          const zoneStructures = structures.filter((s) => s.zoneId === alloc.zoneId);
          const selectedStructure = structures.find((s) => s.id === alloc.structureId);
          const levels = selectedStructure?.levels || [];
          const selectedLevel = levels.find((l) => l.id === alloc.levelId);
          const partitions = selectedLevel?.partitions || [];
          const selectedPartition = partitions.find((p) => p.id === alloc.partitionId);
          const availableCapacity = selectedPartition
            ? selectedPartition.maxCapacity - selectedPartition.usedCapacity
            : null;

          return (
            <div key={alloc.productId} className="rounded-md border border-border p-4">
              <div className="mb-3 flex items-center justify-between">
                <span className="text-sm font-medium text-foreground">
                  {product?.name} ({product?.sku})
                </span>
                <span className="text-xs text-muted-foreground">Qty: {alloc.quantity}</span>
              </div>
              <div className="grid grid-cols-5 gap-3">
                <div className="flex flex-col gap-1">
                  <label className={labelClass}>Zone</label>
                  <select
                    value={alloc.zoneId}
                    onChange={(e) => {
                      const zone = zones.find((z) => z.id === e.target.value);
                      updateAllocation(alloc.productId, {
                        zoneId: e.target.value,
                        zoneName: zone?.label || "",
                        structureId: "",
                        structureName: "",
                        levelId: "",
                        levelName: "",
                        partitionId: "",
                        partitionName: "",
                      });
                    }}
                    className={inputClass}
                  >
                    <option value="">Select zone</option>
                    {zones.map((z) => (
                      <option key={z.id} value={z.id}>{z.label}</option>
                    ))}
                  </select>
                </div>
                <div className="flex flex-col gap-1">
                  <label className={labelClass}>Structure</label>
                  <select
                    value={alloc.structureId}
                    onChange={(e) => {
                      const struct = zoneStructures.find((s) => s.id === e.target.value);
                      updateAllocation(alloc.productId, {
                        structureId: e.target.value,
                        structureName: struct?.label || "",
                        levelId: "",
                        levelName: "",
                        partitionId: "",
                        partitionName: "",
                      });
                    }}
                    className={inputClass}
                    disabled={!alloc.zoneId}
                  >
                    <option value="">Select structure</option>
                    {zoneStructures.map((s) => (
                      <option key={s.id} value={s.id}>{s.label}</option>
                    ))}
                  </select>
                </div>
                <div className="flex flex-col gap-1">
                  <label className={labelClass}>Level</label>
                  <select
                    value={alloc.levelId}
                    onChange={(e) => {
                      const lvl = levels.find((l) => l.id === e.target.value);
                      updateAllocation(alloc.productId, {
                        levelId: e.target.value,
                        levelName: lvl?.label || "",
                        partitionId: "",
                        partitionName: "",
                      });
                    }}
                    className={inputClass}
                    disabled={!alloc.structureId}
                  >
                    <option value="">Select level</option>
                    {levels.map((l) => (
                      <option key={l.id} value={l.id}>{l.label}</option>
                    ))}
                  </select>
                </div>
                <div className="flex flex-col gap-1">
                  <label className={labelClass}>Partition</label>
                  <select
                    value={alloc.partitionId}
                    onChange={(e) => {
                      const part = partitions.find((p) => p.id === e.target.value);
                      updateAllocation(alloc.productId, {
                        partitionId: e.target.value,
                        partitionName: part?.label || "",
                      });
                    }}
                    className={inputClass}
                    disabled={!alloc.levelId}
                  >
                    <option value="">Select partition</option>
                    {partitions.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.label} ({p.maxCapacity - p.usedCapacity} avail)
                      </option>
                    ))}
                  </select>
                  {availableCapacity !== null && (
                    <span className={`text-[10px] font-medium ${availableCapacity >= alloc.quantity ? "text-emerald-600" : "text-red-600"}`}>
                      {availableCapacity >= alloc.quantity
                        ? `Capacity OK (${availableCapacity} available)`
                        : `Insufficient (${availableCapacity} available)`}
                    </span>
                  )}
                </div>
                <div className="flex flex-col gap-1">
                  <label className={labelClass}>Strategy</label>
                  <select
                    value={alloc.strategy}
                    onChange={(e) => updateAllocation(alloc.productId, { strategy: e.target.value as PutAwayAllocation["strategy"] })}
                    className={inputClass}
                  >
                    <option value="manual">Manual</option>
                    <option value="fifo">FIFO</option>
                    <option value="fefo">FEFO</option>
                  </select>
                </div>
              </div>
            </div>
          );
        })}
      </div>
      <div className="flex gap-2">
        {!request.putAwayAllocations ? (
          <button
            onClick={() => allocatePutAway(request.id, allocations)}
            disabled={allocations.some((a) => !a.partitionId)}
            className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
          >
            Allocate Put-Away
          </button>
        ) : (
          <button
            onClick={() => confirmPutAway(request.id)}
            className="rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700"
          >
            Confirm Put-Away & Update Inventory
          </button>
        )}
      </div>
    </div>
  );
}

// --- Stage 7: Vehicle Exit ---
function VehicleExitStage({
  request,
  state,
  recordVehicleExit,
}: {
  request: StockInRequest;
  state: string;
  recordVehicleExit: (id: string, netWeight?: number) => void;
}) {
  const [netWeight, setNetWeight] = useState<string>("");

  if (request.vehicleEntry?.exitTime) {
    const ve = request.vehicleEntry;
    return (
      <div className="flex flex-col gap-3">
        <div className="rounded-md border border-emerald-200 bg-emerald-50 p-3">
          <p className="text-sm font-medium text-emerald-800">Vehicle Exited</p>
        </div>
        <div className="grid grid-cols-3 gap-4">
          <div><p className={labelClass}>Exit Pass</p><p className={valueClass + " font-mono"}>{ve.exitPassId}</p></div>
          <div><p className={labelClass}>Net Weight</p><p className={valueClass}>{ve.netWeight ?? "--"}</p></div>
          <div><p className={labelClass}>Exit Time</p><p className={valueClass}>{new Date(ve.exitTime!).toLocaleString()}</p></div>
        </div>
      </div>
    );
  }

  if (state !== "active" && !request.putAwayAllocations) {
    return <p className="text-xs text-muted-foreground">Awaiting put-away completion.</p>;
  }

  return (
    <div className="flex flex-col gap-4">
      <p className="text-xs text-muted-foreground">Record vehicle exit after put-away is complete.</p>
      <div className="flex items-end gap-4">
        <div className="flex flex-col gap-1.5">
          <label className={labelClass}>Net Weight (optional)</label>
          <input type="number" value={netWeight} onChange={(e) => setNetWeight(e.target.value)} className={inputClass} />
        </div>
        <button
          onClick={() => recordVehicleExit(request.id, netWeight ? Number(netWeight) : undefined)}
          className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          Record Exit & Generate Exit Pass
        </button>
      </div>
    </div>
  );
}

// --- Stage 8: Completion ---
function CompletionStage({
  request,
  state,
  completeRequest,
}: {
  request: StockInRequest;
  state: string;
  completeRequest: (id: string) => void;
}) {
  if (request.status === "completed" || request.status === "partially_completed") {
    return (
      <div className="rounded-md border border-emerald-200 bg-emerald-50 p-4">
        <p className="text-sm font-medium text-emerald-800">
          {request.status === "completed" ? "Fully Completed" : "Partially Completed"}
        </p>
        <p className="mt-1 text-xs text-emerald-600">
          Completed at {request.completedAt ? new Date(request.completedAt).toLocaleString() : "--"}
        </p>
        {request.grnNumber && (
          <p className="mt-1 text-xs text-emerald-600">GRN: {request.grnNumber}</p>
        )}
      </div>
    );
  }

  const canComplete = request.vehicleEntry?.exitTime;
  if (!canComplete && state !== "active") {
    return <p className="text-xs text-muted-foreground">Awaiting vehicle exit.</p>;
  }

  return (
    <div className="flex flex-col gap-4">
      <p className="text-xs text-muted-foreground">
        All stages are complete. Mark this stock-in request as completed.
      </p>
      <div className="rounded-md border border-border bg-muted/30 p-4">
        <div className="grid grid-cols-3 gap-4 text-xs">
          <div><p className={labelClass}>GRN</p><p className="font-mono text-foreground">{request.grnNumber}</p></div>
          <div><p className={labelClass}>Products</p><p className="text-foreground">{request.products.length} item(s)</p></div>
          <div><p className={labelClass}>Inspection</p><p className="text-foreground">{request.inspection?.overallStatus || "N/A"}</p></div>
          <div><p className={labelClass}>Allocations</p><p className="text-foreground">{request.putAwayAllocations?.length || 0} placement(s)</p></div>
          <div><p className={labelClass}>Vehicle Entry</p><p className="text-foreground">{request.vehicleEntry?.entryTime ? "Recorded" : "N/A"}</p></div>
          <div><p className={labelClass}>Vehicle Exit</p><p className="text-foreground">{request.vehicleEntry?.exitTime ? "Recorded" : "N/A"}</p></div>
        </div>
      </div>
      <button
        onClick={() => completeRequest(request.id)}
        className="self-start rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700"
      >
        Mark as Completed
      </button>
    </div>
  );
}

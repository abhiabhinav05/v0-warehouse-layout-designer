"use client";

import { useState } from "react";
import { Plus, ClipboardList, CheckCircle2, Clock, XCircle, Search } from "lucide-react";
import { useStockIn } from "./stock-in-context";
import { StatusBadge } from "./status-badge";
import { CreateRequestForm } from "./create-request-form";
import { RequestDetail } from "./request-detail";
import type { StockInStatus } from "./types";

const summaryCards = [
  {
    label: "Pending",
    statuses: ["pending_approval", "modification_requested"] as StockInStatus[],
    icon: Clock,
    color: "text-amber-600 bg-amber-50 border-amber-200",
  },
  {
    label: "In Progress",
    statuses: [
      "approved",
      "grn_generated",
      "vehicle_entered",
      "unloading_inspection",
      "put_away",
    ] as StockInStatus[],
    icon: ClipboardList,
    color: "text-blue-600 bg-blue-50 border-blue-200",
  },
  {
    label: "Completed",
    statuses: ["completed", "partially_completed"] as StockInStatus[],
    icon: CheckCircle2,
    color: "text-emerald-600 bg-emerald-50 border-emerald-200",
  },
  {
    label: "Rejected",
    statuses: ["rejected"] as StockInStatus[],
    icon: XCircle,
    color: "text-red-600 bg-red-50 border-red-200",
  },
];

export function StockInDashboard() {
  const { requests } = useStockIn();
  const [showCreate, setShowCreate] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");

  const filteredRequests = requests.filter((r) => {
    const matchesSearch =
      !search ||
      r.supplierName.toLowerCase().includes(search.toLowerCase()) ||
      r.purchaseOrderRef.toLowerCase().includes(search.toLowerCase()) ||
      (r.grnNumber && r.grnNumber.toLowerCase().includes(search.toLowerCase()));
    const matchesFilter = filterStatus === "all" || r.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  if (selectedId) {
    return <RequestDetail requestId={selectedId} onBack={() => setSelectedId(null)} />;
  }

  return (
    <div className="flex flex-col gap-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-foreground">Stock-In Requests</h1>
          <p className="text-sm text-muted-foreground">
            Manage incoming goods, approvals, and warehouse placement
          </p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          <Plus className="h-4 w-4" /> New Request
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-4 gap-4">
        {summaryCards.map((card) => {
          const count = requests.filter((r) =>
            card.statuses.includes(r.status)
          ).length;
          return (
            <div
              key={card.label}
              className={`flex items-center gap-3 rounded-lg border p-4 ${card.color}`}
            >
              <card.icon className="h-8 w-8" />
              <div>
                <p className="text-2xl font-bold">{count}</p>
                <p className="text-xs font-medium opacity-80">{card.label}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by supplier, PO ref, or GRN..."
            className="w-full rounded-md border border-input bg-background py-2 pl-10 pr-3 text-sm text-foreground outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground outline-none focus:ring-2 focus:ring-ring"
        >
          <option value="all">All Statuses</option>
          <option value="pending_approval">Pending Approval</option>
          <option value="modification_requested">Modification Requested</option>
          <option value="grn_generated">GRN Generated</option>
          <option value="vehicle_entered">Vehicle Entered</option>
          <option value="unloading_inspection">Inspection Done</option>
          <option value="put_away">Put-Away</option>
          <option value="completed">Completed</option>
          <option value="partially_completed">Partially Completed</option>
          <option value="rejected">Rejected</option>
        </select>
      </div>

      {/* Table */}
      {filteredRequests.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border py-16 text-muted-foreground">
          <ClipboardList className="mb-3 h-10 w-10" />
          <p className="text-sm font-medium">No stock-in requests yet</p>
          <p className="text-xs">Create a new request to get started</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-lg border border-border">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                  PO Ref
                </th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                  Supplier
                </th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                  Products
                </th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">GRN</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                  Expected Delivery
                </th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                  Status
                </th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                  Created
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredRequests.map((req) => (
                <tr
                  key={req.id}
                  onClick={() => setSelectedId(req.id)}
                  className="cursor-pointer border-b border-border transition-colors last:border-0 hover:bg-accent/50"
                >
                  <td className="px-4 py-3 font-medium text-foreground">
                    {req.purchaseOrderRef}
                  </td>
                  <td className="px-4 py-3 text-foreground">{req.supplierName}</td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {req.products.length} item(s)
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-muted-foreground">
                    {req.grnNumber || "--"}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {req.expectedDeliveryDate}
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={req.status} />
                  </td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">
                    {new Date(req.createdAt).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Create Form Modal */}
      {showCreate && (
        <CreateRequestForm
          onClose={() => setShowCreate(false)}
          onCreated={(id) => {
            setShowCreate(false);
            setSelectedId(id);
          }}
        />
      )}
    </div>
  );
}

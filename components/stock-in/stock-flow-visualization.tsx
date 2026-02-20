"use client";

import { useStockIn } from "./stock-in-context";
import {
  FileText,
  ShieldCheck,
  Truck,
  ClipboardCheck,
  PackageOpen,
  LogOut,
  CheckCircle2,
  TrendingUp,
  AlertCircle,
  Clock,
} from "lucide-react";
import type { StockInStatus } from "./types";

const stageInfo = [
  {
    key: "pending_approval",
    label: "Pending",
    icon: Clock,
    color: "bg-amber-50 border-amber-200 text-amber-600",
    description: "Requests awaiting approval",
  },
  {
    key: "approved",
    label: "Approved",
    icon: ShieldCheck,
    color: "bg-blue-50 border-blue-200 text-blue-600",
    description: "Approved & GRN generated",
  },
  {
    key: "vehicle_entered",
    label: "Vehicle",
    icon: Truck,
    color: "bg-indigo-50 border-indigo-200 text-indigo-600",
    description: "Vehicle at gate",
  },
  {
    key: "unloading_inspection",
    label: "Inspection",
    icon: ClipboardCheck,
    color: "bg-purple-50 border-purple-200 text-purple-600",
    description: "Unloading & inspection",
  },
  {
    key: "put_away",
    label: "Put-Away",
    icon: PackageOpen,
    color: "bg-cyan-50 border-cyan-200 text-cyan-600",
    description: "Items placed in warehouse",
  },
  {
    key: "vehicle_exit",
    label: "Exit",
    icon: LogOut,
    color: "bg-slate-50 border-slate-200 text-slate-600",
    description: "Vehicle departed",
  },
  {
    key: "completed",
    label: "Completed",
    icon: CheckCircle2,
    color: "bg-emerald-50 border-emerald-200 text-emerald-600",
    description: "All steps done",
  },
];

export function StockFlowVisualization() {
  const { requests } = useStockIn();

  // Count requests by stage
  const stageCounts = {
    pending_approval: requests.filter(
      (r) => r.status === "pending_approval" || r.status === "modification_requested"
    ).length,
    approved: requests.filter(
      (r) =>
        r.status === "approved" ||
        r.status === "grn_generated"
    ).length,
    vehicle_entered: requests.filter((r) => r.status === "vehicle_entered").length,
    unloading_inspection: requests.filter((r) => r.status === "unloading_inspection").length,
    put_away: requests.filter((r) => r.status === "put_away").length,
    vehicle_exit: requests.filter((r) => r.vehicleEntry?.exitTime).length,
    completed: requests.filter(
      (r) => r.status === "completed" || r.status === "partially_completed"
    ).length,
    rejected: requests.filter((r) => r.status === "rejected").length,
  };

  const totalRequests = requests.length;
  const completedRequests = stageCounts.completed;
  const pendingRequests = stageCounts.pending_approval;
  const rejectedRequests = stageCounts.rejected;
  const completionRate = totalRequests > 0 ? Math.round((completedRequests / totalRequests) * 100) : 0;

  return (
    <div className="flex flex-col gap-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-5 gap-3">
        <div className="rounded-lg border border-blue-200 bg-blue-50 p-3">
          <p className="text-[11px] font-medium text-blue-600">Total Requests</p>
          <p className="mt-1 text-2xl font-bold text-blue-900">{totalRequests}</p>
        </div>
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3">
          <p className="text-[11px] font-medium text-emerald-600">Completed</p>
          <p className="mt-1 text-2xl font-bold text-emerald-900">{completedRequests}</p>
          <p className="text-[10px] text-emerald-600">{completionRate}% done</p>
        </div>
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-3">
          <p className="text-[11px] font-medium text-amber-600">In Progress</p>
          <p className="mt-1 text-2xl font-bold text-amber-900">
            {totalRequests - completedRequests - rejectedRequests}
          </p>
        </div>
        <div className="rounded-lg border border-red-200 bg-red-50 p-3">
          <p className="text-[11px] font-medium text-red-600">Rejected</p>
          <p className="mt-1 text-2xl font-bold text-red-900">{rejectedRequests}</p>
        </div>
        <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
          <p className="text-[11px] font-medium text-slate-600">Pending Approval</p>
          <p className="mt-1 text-2xl font-bold text-slate-900">{pendingRequests}</p>
        </div>
      </div>

      {/* Flow Stages */}
      <div>
        <h3 className="mb-4 text-sm font-semibold text-foreground">Stock-In Processing Flow</h3>
        <div className="flex flex-col gap-3">
          {stageInfo.map((stage, idx) => {
            const count =
              stageCounts[stage.key as keyof typeof stageCounts] || 0;
            const percentage =
              totalRequests > 0 ? Math.round((count / totalRequests) * 100) : 0;

            return (
              <div
                key={stage.key}
                className={`rounded-lg border p-3 ${stage.color}`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex flex-1 items-start gap-3">
                    <stage.icon className="h-5 w-5 flex-shrink-0 mt-0.5" />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium">{stage.label}</p>
                      <p className="text-xs opacity-75">{stage.description}</p>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1 flex-shrink-0">
                    <p className="text-lg font-bold">{count}</p>
                    <p className="text-xs font-medium opacity-70">{percentage}%</p>
                  </div>
                </div>
                {totalRequests > 0 && (
                  <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-black/10">
                    <div
                      className="h-full rounded-full bg-current transition-all"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Flow Health */}
      <div className="rounded-lg border border-border bg-card p-4">
        <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-foreground">
          <TrendingUp className="h-4 w-4" /> Workflow Health
        </h3>
        <div className="grid grid-cols-2 gap-4 text-xs">
          <div>
            <p className="text-muted-foreground">Completion Rate</p>
            <p className="mt-1 text-xl font-bold text-emerald-600">{completionRate}%</p>
          </div>
          <div>
            <p className="text-muted-foreground">Success Rate</p>
            <p className="mt-1 text-xl font-bold text-emerald-600">
              {totalRequests > 0
                ? Math.round(((completedRequests) / totalRequests) * 100)
                : 0}%
            </p>
          </div>
          <div>
            <p className="text-muted-foreground">Active Requests</p>
            <p className="mt-1 text-xl font-bold text-blue-600">
              {totalRequests - completedRequests}
            </p>
          </div>
          <div>
            <p className="text-muted-foreground">Rejection Rate</p>
            <p className="mt-1 text-xl font-bold text-red-600">
              {totalRequests > 0
                ? Math.round((rejectedRequests / totalRequests) * 100)
                : 0}%
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

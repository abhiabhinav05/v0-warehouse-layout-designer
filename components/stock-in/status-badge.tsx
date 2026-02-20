import type { StockInStatus } from "./types";

const statusConfig: Record<StockInStatus, { label: string; className: string }> = {
  pending_approval: {
    label: "Pending Approval",
    className: "bg-amber-100 text-amber-800 border-amber-200",
  },
  approved: {
    label: "Approved",
    className: "bg-emerald-100 text-emerald-800 border-emerald-200",
  },
  rejected: {
    label: "Rejected",
    className: "bg-red-100 text-red-800 border-red-200",
  },
  modification_requested: {
    label: "Modification Requested",
    className: "bg-orange-100 text-orange-800 border-orange-200",
  },
  grn_generated: {
    label: "GRN Generated",
    className: "bg-blue-100 text-blue-800 border-blue-200",
  },
  vehicle_entered: {
    label: "Vehicle Entered",
    className: "bg-indigo-100 text-indigo-800 border-indigo-200",
  },
  unloading_inspection: {
    label: "Inspection Done",
    className: "bg-violet-100 text-violet-800 border-violet-200",
  },
  put_away: {
    label: "Put-Away",
    className: "bg-cyan-100 text-cyan-800 border-cyan-200",
  },
  completed: {
    label: "Completed",
    className: "bg-emerald-100 text-emerald-800 border-emerald-200",
  },
  partially_completed: {
    label: "Partially Completed",
    className: "bg-yellow-100 text-yellow-800 border-yellow-200",
  },
};

export function StatusBadge({ status }: { status: StockInStatus }) {
  const config = statusConfig[status];
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${config.className}`}
    >
      {config.label}
    </span>
  );
}

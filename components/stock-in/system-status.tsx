"use client";

import { useStockIn } from "./stock-in-context";
import { AlertCircle, CheckCircle2, Clock, Zap } from "lucide-react";

export function SystemStatus() {
  const { requests, inventory } = useStockIn();

  const stats = {
    total: requests.length,
    pending: requests.filter(r => r.status === "pending_approval" || r.status === "modification_requested").length,
    inProgress: requests.filter(r => 
      r.status === "approved" || 
      r.status === "grn_generated" || 
      r.status === "vehicle_entered" || 
      r.status === "unloading_inspection" || 
      r.status === "put_away"
    ).length,
    completed: requests.filter(r => r.status === "completed" || r.status === "partially_completed").length,
    rejected: requests.filter(r => r.status === "rejected").length,
    inventory: inventory.length,
    expiringItems: inventory.filter(i => {
      if (!i.expiryDate) return false;
      const diff = new Date(i.expiryDate).getTime() - new Date().getTime();
      return diff > 0 && diff <= 30 * 24 * 60 * 60 * 1000;
    }).length,
  };

  const health = {
    completionRate: stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0,
    successRate: stats.total > 0 ? Math.round(((stats.total - stats.rejected) / stats.total) * 100) : 0,
    efficiency: stats.total > 0 ? Math.round(((stats.completed + stats.inProgress) / stats.total) * 100) : 100,
  };

  const status = health.completionRate >= 70 ? "healthy" : health.completionRate >= 40 ? "warning" : "critical";

  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-3">
            <div
              className={`h-3 w-3 rounded-full ${
                status === "healthy"
                  ? "bg-emerald-500 animate-pulse"
                  : status === "warning"
                    ? "bg-amber-500 animate-pulse"
                    : "bg-red-500 animate-pulse"
              }`}
            />
            <p className="text-xs font-semibold text-foreground">System Status</p>
          </div>
          <p className={`text-sm font-medium ${
            status === "healthy"
              ? "text-emerald-600"
              : status === "warning"
                ? "text-amber-600"
                : "text-red-600"
          }`}>
            {status === "healthy" ? "Healthy" : status === "warning" ? "Warning" : "Critical"}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            {stats.pending} pending • {stats.inProgress} active • {stats.completed} done
          </p>
        </div>

        <div className="grid grid-cols-3 gap-3 text-right">
          <div>
            <p className="text-[10px] text-muted-foreground font-medium">Completion</p>
            <p className="text-sm font-bold text-foreground">{health.completionRate}%</p>
          </div>
          <div>
            <p className="text-[10px] text-muted-foreground font-medium">Success</p>
            <p className="text-sm font-bold text-foreground">{health.successRate}%</p>
          </div>
          <div>
            <p className="text-[10px] text-muted-foreground font-medium">Efficiency</p>
            <p className="text-sm font-bold text-foreground">{health.efficiency}%</p>
          </div>
        </div>
      </div>

      {stats.expiringItems > 0 && (
        <div className="mt-3 flex items-center gap-2 rounded-md border border-amber-200 bg-amber-50 px-3 py-2">
          <AlertCircle className="h-3.5 w-3.5 text-amber-600 flex-shrink-0" />
          <p className="text-xs text-amber-700 font-medium">{stats.expiringItems} items expiring soon</p>
        </div>
      )}
    </div>
  );
}

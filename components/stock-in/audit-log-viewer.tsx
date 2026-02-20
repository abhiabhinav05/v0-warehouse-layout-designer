"use client";

import { useState, useMemo } from "react";
import { Search, FileText, Filter } from "lucide-react";
import { useStockIn } from "./stock-in-context";

export function AuditLogViewer() {
  const { auditLog } = useStockIn();
  const [search, setSearch] = useState("");
  const [filterEntity, setFilterEntity] = useState("all");
  const [filterAction, setFilterAction] = useState("all");

  const entities = useMemo(() => [...new Set(auditLog.map((e) => e.entity))], [auditLog]);
  const actions = useMemo(() => [...new Set(auditLog.map((e) => e.action))], [auditLog]);

  const filtered = useMemo(() => {
    return auditLog.filter((entry) => {
      const matchSearch =
        !search ||
        entry.action.toLowerCase().includes(search.toLowerCase()) ||
        entry.details.toLowerCase().includes(search.toLowerCase()) ||
        entry.entityId.toLowerCase().includes(search.toLowerCase());
      const matchEntity = filterEntity === "all" || entry.entity === filterEntity;
      const matchAction = filterAction === "all" || entry.action === filterAction;
      return matchSearch && matchEntity && matchAction;
    });
  }, [auditLog, search, filterEntity, filterAction]);

  const inputClass =
    "rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground outline-none focus:ring-2 focus:ring-ring";

  return (
    <div className="flex flex-col gap-6 p-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-foreground">Audit Log</h1>
        <p className="text-sm text-muted-foreground">
          Track all actions performed across the stock-in workflow
        </p>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by action, details, or entity ID..."
            className={`w-full pl-10 ${inputClass}`}
          />
        </div>
        <div className="flex items-center gap-1 text-muted-foreground">
          <Filter className="h-4 w-4" />
        </div>
        <select value={filterEntity} onChange={(e) => setFilterEntity(e.target.value)} className={inputClass}>
          <option value="all">All Entities</option>
          {entities.map((e) => (
            <option key={e} value={e}>{e}</option>
          ))}
        </select>
        <select value={filterAction} onChange={(e) => setFilterAction(e.target.value)} className={inputClass}>
          <option value="all">All Actions</option>
          {actions.map((a) => (
            <option key={a} value={a}>{a}</option>
          ))}
        </select>
      </div>

      {/* Stats */}
      <div className="flex items-center gap-6 text-sm text-muted-foreground">
        <span>{auditLog.length} total entries</span>
        <span>{filtered.length} matching</span>
      </div>

      {/* Table */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border py-16 text-muted-foreground">
          <FileText className="mb-3 h-10 w-10" />
          <p className="text-sm font-medium">No audit entries</p>
          <p className="text-xs">Actions will be logged here automatically</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-lg border border-border">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Timestamp</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Action</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Entity</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Entity ID</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Details</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Performed By</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((entry) => (
                <tr key={entry.id} className="border-b border-border last:border-0 hover:bg-accent/50">
                  <td className="whitespace-nowrap px-4 py-3 text-xs text-muted-foreground">
                    {new Date(entry.timestamp).toLocaleString()}
                  </td>
                  <td className="px-4 py-3">
                    <span className="inline-flex rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary">
                      {entry.action}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">{entry.entity}</td>
                  <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{entry.entityId}</td>
                  <td className="max-w-xs truncate px-4 py-3 text-xs text-foreground">{entry.details}</td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">{entry.performedBy}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

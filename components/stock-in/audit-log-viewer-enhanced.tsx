"use client";

import React, { useMemo, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AuditEntry } from "./types";
import { useStockInEnhanced } from "./stock-in-context-enhanced";
import { useWarehouse } from "@/contexts/warehouse-context";
import {
  Download,
  Filter,
  Search,
  CheckCircle,
  AlertCircle,
  XCircle,
  Info,
} from "lucide-react";
import { Input } from "@/components/ui/input";

export function AuditLogViewerEnhanced() {
  const { auditLog } = useStockInEnhanced();
  const { currentWarehouse } = useWarehouse();
  const [searchTerm, setSearchTerm] = useState("");
  const [actionFilter, setActionFilter] = useState("all");
  const [roleFilter, setRoleFilter] = useState("all");
  const [sortBy, setSortBy] = useState<"latest" | "oldest">("latest");

  // Filter logs by current warehouse
  const warehouseAuditLog = useMemo(
    () =>
      auditLog.filter((log) => log.warehouseId === currentWarehouse?.id),
    [auditLog, currentWarehouse?.id]
  );

  // Apply filters and search
  const filteredLogs = useMemo(() => {
    let filtered = warehouseAuditLog;

    // Search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (log) =>
          log.action.toLowerCase().includes(term) ||
          log.details.toLowerCase().includes(term) ||
          log.performedByName.toLowerCase().includes(term) ||
          log.entityId.toLowerCase().includes(term)
      );
    }

    // Action filter
    if (actionFilter !== "all") {
      filtered = filtered.filter((log) =>
        log.action.toLowerCase().includes(actionFilter.toLowerCase())
      );
    }

    // Role filter
    if (roleFilter !== "all") {
      filtered = filtered.filter((log) => log.userRole === roleFilter);
    }

    // Sort
    if (sortBy === "oldest") {
      filtered.sort(
        (a, b) =>
          new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
      );
    } else {
      filtered.sort(
        (a, b) =>
          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      );
    }

    return filtered;
  }, [warehouseAuditLog, searchTerm, actionFilter, roleFilter, sortBy]);

  // Get unique actions for filter
  const uniqueActions = useMemo(
    () => [...new Set(warehouseAuditLog.map((log) => log.action))],
    [warehouseAuditLog]
  );

  // Get unique roles for filter
  const uniqueRoles = useMemo(
    () => [...new Set(warehouseAuditLog.map((log) => log.userRole))],
    [warehouseAuditLog]
  );

  // Export as CSV
  const handleExport = () => {
    const csv = [
      ["Timestamp", "Action", "Entity", "User", "Role", "Details"],
      ...filteredLogs.map((log) => [
        new Date(log.timestamp).toLocaleString(),
        log.action,
        `${log.entity} #${log.entityId}`,
        log.performedByName,
        log.userRole,
        log.details,
      ]),
    ]
      .map((row) => row.map((cell) => `"${cell}"`).join(","))
      .join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `audit-log-${currentWarehouse?.name}-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  };

  // Get icon for action type
  const getActionIcon = (action: string) => {
    if (action.includes("Approved")) return <CheckCircle className="h-4 w-4 text-green-600" />;
    if (action.includes("Rejected")) return <XCircle className="h-4 w-4 text-red-600" />;
    if (action.includes("Error") || action.includes("Failed"))
      return <AlertCircle className="h-4 w-4 text-red-600" />;
    return <Info className="h-4 w-4 text-blue-600" />;
  };

  // Get color for role
  const getRoleColor = (role: string) => {
    const colors: Record<string, string> = {
      admin: "bg-purple-100 text-purple-800",
      manager: "bg-blue-100 text-blue-800",
      approver: "bg-green-100 text-green-800",
      operator: "bg-amber-100 text-amber-800",
      viewer: "bg-gray-100 text-gray-800",
    };
    return colors[role] || "bg-gray-100 text-gray-800";
  };

  return (
    <div className="w-full space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Audit Log</h1>
        <p className="text-gray-600 mt-1">
          Complete audit trail for {currentWarehouse?.name}
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-gray-600 text-sm">Total Entries</p>
              <p className="text-3xl font-bold mt-2">{warehouseAuditLog.length}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-gray-600 text-sm">Filtered Results</p>
              <p className="text-3xl font-bold mt-2 text-blue-600">
                {filteredLogs.length}
              </p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-gray-600 text-sm">Unique Actions</p>
              <p className="text-3xl font-bold mt-2">{uniqueActions.length}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-gray-600 text-sm">Users</p>
              <p className="text-3xl font-bold mt-2">{uniqueRoles.length}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filters & Search
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            {/* Search */}
            <div>
              <label className="block text-sm font-medium mb-2">Search</label>
              <div className="relative">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search logs..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Action Filter */}
            <div>
              <label className="block text-sm font-medium mb-2">Action</label>
              <Select value={actionFilter} onValueChange={setActionFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Actions</SelectItem>
                  {uniqueActions.map((action) => (
                    <SelectItem key={action} value={action}>
                      {action}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Role Filter */}
            <div>
              <label className="block text-sm font-medium mb-2">Role</label>
              <Select value={roleFilter} onValueChange={setRoleFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Roles</SelectItem>
                  {uniqueRoles.map((role) => (
                    <SelectItem key={role} value={role}>
                      {role}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Sort */}
            <div>
              <label className="block text-sm font-medium mb-2">Sort</label>
              <Select value={sortBy} onValueChange={(v: any) => setSortBy(v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="latest">Latest First</SelectItem>
                  <SelectItem value="oldest">Oldest First</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Export */}
            <div className="flex items-end">
              <Button
                onClick={handleExport}
                className="w-full"
                variant="outline"
              >
                <Download className="h-4 w-4 mr-2" />
                Export CSV
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Audit Log Table */}
      <Card>
        <CardHeader>
          <CardTitle>Activity Log</CardTitle>
          <CardDescription>
            Showing {filteredLogs.length} of {warehouseAuditLog.length} entries
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filteredLogs.length === 0 ? (
            <div className="text-center py-12">
              <AlertCircle className="h-8 w-8 text-gray-400 mx-auto mb-2" />
              <p className="text-gray-600">No audit logs found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b bg-gray-50">
                  <tr>
                    <th className="text-left py-3 px-4 font-semibold">
                      Timestamp
                    </th>
                    <th className="text-left py-3 px-4 font-semibold">Action</th>
                    <th className="text-left py-3 px-4 font-semibold">
                      Entity
                    </th>
                    <th className="text-left py-3 px-4 font-semibold">User</th>
                    <th className="text-left py-3 px-4 font-semibold">Role</th>
                    <th className="text-left py-3 px-4 font-semibold">Details</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredLogs.map((log, idx) => (
                    <tr key={log.id} className="border-b hover:bg-gray-50">
                      <td className="py-3 px-4 font-mono text-xs whitespace-nowrap">
                        {new Date(log.timestamp).toLocaleString()}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          {getActionIcon(log.action)}
                          <span className="font-medium">{log.action}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4 font-mono text-xs">
                        {log.entity} #{log.entityId.slice(0, 6)}
                      </td>
                      <td className="py-3 px-4">
                        <div>
                          <p className="font-medium">{log.performedByName}</p>
                          <p className="text-xs text-gray-500">{log.performedBy}</p>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <Badge className={getRoleColor(log.userRole)}>
                          {log.userRole}
                        </Badge>
                      </td>
                      <td className="py-3 px-4 text-gray-600 max-w-xs truncate">
                        {log.details}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Compliance Info */}
      <Card className="bg-blue-50 border-blue-200">
        <CardHeader>
          <CardTitle className="text-blue-900">Compliance & Data Protection</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-blue-800">
          <p>
            ✓ All operations are logged with user identification and timestamp
          </p>
          <p>✓ Warehouse isolation ensures data separation between locations</p>
          <p>✓ Role-based access control prevents unauthorized actions</p>
          <p>✓ Audit trail is immutable and non-repudiable</p>
          <p>✓ Logs can be exported for compliance audits</p>
          <p>✓ User name and role captured at time of action for accountability</p>
        </CardContent>
      </Card>
    </div>
  );
}

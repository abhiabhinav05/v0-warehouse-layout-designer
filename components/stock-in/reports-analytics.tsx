"use client";

import { useState, useMemo } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  ScatterChart,
  Scatter,
} from "recharts";
import { useStockIn } from "./stock-in-context";
import { useWarehouseData } from "./warehouse-data-context";
import { Calendar, Download, Filter, TrendingUp, AlertTriangle, CheckCircle2 } from "lucide-react";

export function ReportsAnalytics() {
  const { requests, inventory } = useStockIn();
  const { layoutData } = useWarehouseData();
  const [timeRange, setTimeRange] = useState<"week" | "month" | "quarter" | "year" | "all">("month");
  const [reportType, setReportType] = useState<"performance" | "capacity" | "quality" | "compliance">("performance");

  const now = new Date();
  const getDateRange = () => {
    const start = new Date();
    if (timeRange === "week") start.setDate(start.getDate() - 7);
    else if (timeRange === "month") start.setMonth(start.getMonth() - 1);
    else if (timeRange === "quarter") start.setMonth(start.getMonth() - 3);
    else if (timeRange === "year") start.setFullYear(start.getFullYear() - 1);
    else return new Date(0);
    return start;
  };

  const filteredRequests = useMemo(
    () => requests.filter((r) => new Date(r.createdAt) >= getDateRange()),
    [requests, timeRange]
  );

  // Performance Report
  const performanceData = useMemo(() => {
    const total = filteredRequests.length;
    const completed = filteredRequests.filter(
      (r) => r.status === "completed" || r.status === "partially_completed"
    ).length;
    const rejected = filteredRequests.filter((r) => r.status === "rejected").length;
    const inProgress = total - completed - rejected;

    const avgTime = (() => {
      const completedWithTime = filteredRequests.filter((r) => r.completedAt);
      if (completedWithTime.length === 0) return 0;
      const totalHours = completedWithTime.reduce(
        (sum, r) => sum + (new Date(r.completedAt!).getTime() - new Date(r.createdAt).getTime()) / (1000 * 60 * 60),
        0
      );
      return Math.round(totalHours / completedWithTime.length);
    })();

    const qualityScore = total > 0 ? Math.round(((total - rejected) / total) * 100) : 0;

    return {
      total,
      completed,
      rejected,
      inProgress,
      avgTime,
      completionRate: total > 0 ? Math.round((completed / total) * 100) : 0,
      qualityScore,
      efficiency: total > 0 ? Math.round(((completed + inProgress) / total) * 100) : 0,
    };
  }, [filteredRequests]);

  // Capacity Report
  const capacityData = useMemo(() => {
    return layoutData.zones.map((zone) => {
      const structures = layoutData.structures.filter((s) => s.zoneId === zone.id);
      let totalCap = 0;
      let usedCap = 0;

      structures.forEach((s) => {
        s.levels.forEach((l) => {
          l.partitions.forEach((p) => {
            totalCap += p.maxCapacity;
            usedCap += p.usedCapacity;
          });
        });
      });

      const percentage = totalCap > 0 ? Math.round((usedCap / totalCap) * 100) : 0;
      return {
        name: zone.label,
        used: usedCap,
        available: totalCap - usedCap,
        percentage,
      };
    });
  }, [layoutData]);

  // Quality Report
  const qualityData = useMemo(() => {
    const acceptedRequests = filteredRequests.filter((r) => r.inspection?.overallStatus === "accepted");
    const partialRequests = filteredRequests.filter((r) => r.inspection?.overallStatus === "partial");
    const rejectedRequests = filteredRequests.filter((r) => r.inspection?.overallStatus === "rejected");

    return [
      { name: "Accepted", value: acceptedRequests.length, color: "#10b981" },
      { name: "Partial", value: partialRequests.length, color: "#f59e0b" },
      { name: "Rejected", value: rejectedRequests.length, color: "#ef4444" },
    ].filter((item) => item.value > 0);
  }, [filteredRequests]);

  // Compliance Report
  const complianceData = useMemo(() => {
    const requiredSteps = ["approval", "grn", "vehicle_entry", "inspection", "put_away", "vehicle_exit"];
    const completionByStep = requiredSteps.map((step) => {
      const completed = filteredRequests.filter((r) => {
        if (step === "approval") return r.approvedAt;
        if (step === "grn") return r.grnNumber;
        if (step === "vehicle_entry") return r.vehicleEntry;
        if (step === "inspection") return r.inspection;
        if (step === "put_away") return r.putAwayAllocations;
        if (step === "vehicle_exit") return r.vehicleEntry?.exitTime;
        return false;
      }).length;

      return {
        name: step.replace(/_/g, " ").toUpperCase(),
        completion: filteredRequests.length > 0 ? Math.round((completed / filteredRequests.length) * 100) : 0,
      };
    });

    return completionByStep;
  }, [filteredRequests]);

  // Supplier Performance
  const supplierPerformance = useMemo(() => {
    const suppliers: { [key: string]: { total: number; completed: number; rejected: number } } = {};

    filteredRequests.forEach((r) => {
      if (!suppliers[r.supplierName]) {
        suppliers[r.supplierName] = { total: 0, completed: 0, rejected: 0 };
      }
      suppliers[r.supplierName].total++;
      if (r.status === "completed" || r.status === "partially_completed") {
        suppliers[r.supplierName].completed++;
      }
      if (r.status === "rejected") {
        suppliers[r.supplierName].rejected++;
      }
    });

    return Object.entries(suppliers)
      .map(([name, stats]) => ({
        name,
        total: stats.total,
        completed: stats.completed,
        rejected: stats.rejected,
        onTimeRate: stats.total > 0 ? Math.round(((stats.total - stats.rejected) / stats.total) * 100) : 0,
      }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 10);
  }, [filteredRequests]);

  const COLORS = ["#10b981", "#3b82f6", "#f59e0b", "#ef4444", "#8b5cf6", "#06b6d4"];

  const inputClass =
    "rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground outline-none focus:ring-2 focus:ring-ring";

  return (
    <div className="flex flex-col gap-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Reports & Analytics</h1>
          <p className="text-sm text-muted-foreground">
            Comprehensive insights into warehouse operations
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-muted-foreground" />
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value as any)}
            className={inputClass}
          >
            <option value="week">Last Week</option>
            <option value="month">Last Month</option>
            <option value="quarter">Last Quarter</option>
            <option value="year">Last Year</option>
            <option value="all">All Time</option>
          </select>
          <button className="flex items-center gap-2 rounded-md border border-input px-3 py-2 text-sm font-medium hover:bg-accent">
            <Download className="h-4 w-4" /> Export
          </button>
        </div>
      </div>

      {/* Report Type Selector */}
      <div className="flex items-center gap-2">
        <Filter className="h-4 w-4 text-muted-foreground" />
        {["performance", "capacity", "quality", "compliance"].map((type) => (
          <button
            key={type}
            onClick={() => setReportType(type as any)}
            className={`rounded-md px-4 py-2 text-sm font-medium transition-colors ${
              reportType === type
                ? "bg-primary text-primary-foreground"
                : "border border-input text-foreground hover:bg-accent"
            }`}
          >
            {type.charAt(0).toUpperCase() + type.slice(1)}
          </button>
        ))}
      </div>

      {/* Performance Report */}
      {reportType === "performance" && (
        <>
          {/* KPIs */}
          <div className="grid grid-cols-4 gap-4">
            <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-medium text-blue-600">Total Requests</p>
                  <p className="mt-2 text-2xl font-bold text-blue-900">{performanceData.total}</p>
                </div>
                <TrendingUp className="h-8 w-8 text-blue-500 opacity-20" />
              </div>
            </div>
            <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-medium text-emerald-600">Completion Rate</p>
                  <p className="mt-2 text-2xl font-bold text-emerald-900">{performanceData.completionRate}%</p>
                </div>
                <CheckCircle2 className="h-8 w-8 text-emerald-500 opacity-20" />
              </div>
            </div>
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-medium text-amber-600">Avg Processing Time</p>
                  <p className="mt-2 text-2xl font-bold text-amber-900">{performanceData.avgTime}h</p>
                </div>
                <TrendingUp className="h-8 w-8 text-amber-500 opacity-20" />
              </div>
            </div>
            <div className="rounded-lg border border-purple-200 bg-purple-50 p-4">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-medium text-purple-600">Quality Score</p>
                  <p className="mt-2 text-2xl font-bold text-purple-900">{performanceData.qualityScore}%</p>
                </div>
                <CheckCircle2 className="h-8 w-8 text-purple-500 opacity-20" />
              </div>
            </div>
          </div>

          {/* Charts */}
          <div className="grid grid-cols-2 gap-6">
            <div className="rounded-lg border border-border bg-card p-4">
              <h3 className="mb-4 text-sm font-semibold text-foreground">Supplier On-Time Rate</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={supplierPerformance.slice(0, 5)}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis dataKey="name" stroke="var(--muted-foreground)" style={{ fontSize: "10px" }} />
                  <YAxis stroke="var(--muted-foreground)" />
                  <Tooltip
                    contentStyle={{ backgroundColor: "var(--card)", border: "1px solid var(--border)" }}
                    labelStyle={{ color: "var(--foreground)" }}
                  />
                  <Bar dataKey="onTimeRate" fill="#3b82f6" name="On-Time Rate %" />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="rounded-lg border border-border bg-card p-4">
              <h3 className="mb-4 text-sm font-semibold text-foreground">Request Status Distribution</h3>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={[
                      { name: "Completed", value: performanceData.completed, color: "#10b981" },
                      { name: "In Progress", value: performanceData.inProgress, color: "#3b82f6" },
                      { name: "Rejected", value: performanceData.rejected, color: "#ef4444" },
                    ]}
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {[
                      { name: "Completed", value: performanceData.completed, color: "#10b981" },
                      { name: "In Progress", value: performanceData.inProgress, color: "#3b82f6" },
                      { name: "Rejected", value: performanceData.rejected, color: "#ef4444" },
                    ].map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </>
      )}

      {/* Capacity Report */}
      {reportType === "capacity" && (
        <>
          <div className="rounded-lg border border-border bg-card p-4">
            <h3 className="mb-4 text-sm font-semibold text-foreground">Zone Capacity Utilization</h3>
            <ResponsiveContainer width="100%" height={400}>
              <BarChart data={capacityData}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="name" stroke="var(--muted-foreground)" />
                <YAxis stroke="var(--muted-foreground)" />
                <Tooltip
                  contentStyle={{ backgroundColor: "var(--card)", border: "1px solid var(--border)" }}
                  labelStyle={{ color: "var(--foreground)" }}
                />
                <Legend />
                <Bar dataKey="used" fill="#ef4444" name="Used Capacity" />
                <Bar dataKey="available" fill="#10b981" name="Available Capacity" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Capacity Table */}
          <div className="overflow-hidden rounded-lg border border-border">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Zone</th>
                  <th className="px-4 py-3 text-right font-medium text-muted-foreground">Used</th>
                  <th className="px-4 py-3 text-right font-medium text-muted-foreground">Available</th>
                  <th className="px-4 py-3 text-right font-medium text-muted-foreground">Utilization</th>
                </tr>
              </thead>
              <tbody>
                {capacityData.map((zone) => (
                  <tr key={zone.name} className="border-b border-border last:border-0 hover:bg-accent/50">
                    <td className="px-4 py-3">{zone.name}</td>
                    <td className="px-4 py-3 text-right">{zone.used}</td>
                    <td className="px-4 py-3 text-right">{zone.available}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="h-2 w-16 overflow-hidden rounded-full bg-muted">
                          <div
                            className={`h-full rounded-full ${
                              zone.percentage > 90 ? "bg-red-500" : zone.percentage > 70 ? "bg-amber-500" : "bg-emerald-500"
                            }`}
                            style={{ width: `${zone.percentage}%` }}
                          />
                        </div>
                        <span className="text-right text-[11px] font-medium">{zone.percentage}%</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* Quality Report */}
      {reportType === "quality" && (
        <>
          <div className="rounded-lg border border-border bg-card p-4">
            <h3 className="mb-4 text-sm font-semibold text-foreground">Quality Distribution</h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={qualityData}
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                  label
                >
                  {qualityData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </>
      )}

      {/* Compliance Report */}
      {reportType === "compliance" && (
        <>
          <div className="rounded-lg border border-border bg-card p-4">
            <h3 className="mb-4 text-sm font-semibold text-foreground">Process Step Compliance</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={complianceData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis type="number" stroke="var(--muted-foreground)" />
                <YAxis dataKey="name" type="category" width={100} stroke="var(--muted-foreground)" style={{ fontSize: "11px" }} />
                <Tooltip
                  contentStyle={{ backgroundColor: "var(--card)", border: "1px solid var(--border)" }}
                  labelStyle={{ color: "var(--foreground)" }}
                />
                <Bar dataKey="completion" fill="#10b981" name="Completion %" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </>
      )}
    </div>
  );
}

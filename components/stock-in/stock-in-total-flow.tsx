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
} from "recharts";
import { useStockIn } from "./stock-in-context";
import { Calendar, TrendingUp, Package, AlertCircle } from "lucide-react";
import type { StockInStatus } from "./types";

export function StockInTotalFlow() {
  const { requests } = useStockIn();
  const [timeFilter, setTimeFilter] = useState<"today" | "week" | "month" | "all">("all");

  // Filter by time
  const filteredRequests = useMemo(() => {
    const now = new Date();
    let startDate = new Date(0); // Beginning of time for 'all'

    if (timeFilter === "today") {
      startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    } else if (timeFilter === "week") {
      startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    } else if (timeFilter === "month") {
      startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    }

    return requests.filter((r) => new Date(r.createdAt) >= startDate);
  }, [requests, timeFilter]);

  // Status distribution
  const statusDistribution = useMemo(() => {
    const counts = {
      "Pending Approval": 0,
      "Approved": 0,
      "In Transit": 0,
      "Inspection": 0,
      "Put-Away": 0,
      "Completed": 0,
      "Rejected": 0,
    };

    filteredRequests.forEach((r) => {
      if (r.status === "pending_approval" || r.status === "modification_requested") {
        counts["Pending Approval"]++;
      } else if (r.status === "approved" || r.status === "grn_generated") {
        counts["Approved"]++;
      } else if (r.status === "vehicle_entered") {
        counts["In Transit"]++;
      } else if (r.status === "unloading_inspection") {
        counts["Inspection"]++;
      } else if (r.status === "put_away") {
        counts["Put-Away"]++;
      } else if (r.status === "completed" || r.status === "partially_completed") {
        counts["Completed"]++;
      } else if (r.status === "rejected") {
        counts["Rejected"]++;
      }
    });

    return Object.entries(counts)
      .filter(([_, v]) => v > 0)
      .map(([name, value]) => ({ name, value }));
  }, [filteredRequests]);

  // Daily requests
  const dailyData = useMemo(() => {
    const dateCounts: { [key: string]: number } = {};

    filteredRequests.forEach((r) => {
      const date = new Date(r.createdAt).toLocaleDateString();
      dateCounts[date] = (dateCounts[date] || 0) + 1;
    });

    return Object.entries(dateCounts)
      .map(([date, count]) => ({ date, requests: count }))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .slice(-14); // Last 14 days
  }, [filteredRequests]);

  // Metrics
  const metrics = useMemo(() => {
    const total = filteredRequests.length;
    const completed = filteredRequests.filter(
      (r) => r.status === "completed" || r.status === "partially_completed"
    ).length;
    const rejected = filteredRequests.filter((r) => r.status === "rejected").length;
    const inProgress = total - completed - rejected;

    const totalProducts = filteredRequests.reduce((sum, r) => sum + r.products.length, 0);
    const totalQty = filteredRequests.reduce(
      (sum, r) =>
        sum +
        r.products.reduce(
          (pSum, p) => pSum + (r.inspection?.items.find((i) => i.productId === p.id)?.acceptedQty ?? p.quantity),
          0
        ),
      0
    );

    const avgProcessingTime = (() => {
      if (completed === 0) return 0;
      const times = filteredRequests
        .filter((r) => r.completedAt)
        .map((r) => new Date(r.completedAt!).getTime() - new Date(r.createdAt).getTime());
      return Math.round(times.reduce((a, b) => a + b, 0) / times.length / (1000 * 60 * 60)); // hours
    })();

    return {
      total,
      completed,
      rejected,
      inProgress,
      completionRate: total > 0 ? Math.round((completed / total) * 100) : 0,
      successRate: total > 0 ? Math.round(((total - rejected) / total) * 100) : 0,
      totalProducts,
      totalQty,
      avgProcessingTime,
    };
  }, [filteredRequests]);

  const COLORS = ["#10b981", "#3b82f6", "#f59e0b", "#ef4444", "#8b5cf6", "#06b6d4", "#6b7280"];

  return (
    <div className="flex flex-col gap-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Stock-In Total Flow</h1>
          <p className="text-sm text-muted-foreground">
            Complete workflow analytics and performance metrics
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-muted-foreground" />
          <select
            value={timeFilter}
            onChange={(e) => setTimeFilter(e.target.value as any)}
            className="rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground outline-none focus:ring-2 focus:ring-ring"
          >
            <option value="today">Today</option>
            <option value="week">Last 7 Days</option>
            <option value="month">Last 30 Days</option>
            <option value="all">All Time</option>
          </select>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-4 gap-4">
        <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
          <p className="text-xs font-medium text-blue-600">Total Requests</p>
          <p className="mt-2 text-3xl font-bold text-blue-900">{metrics.total}</p>
          <p className="mt-1 text-xs text-blue-600">{filteredRequests.length} in selected period</p>
        </div>
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4">
          <p className="text-xs font-medium text-emerald-600">Completion Rate</p>
          <p className="mt-2 text-3xl font-bold text-emerald-900">{metrics.completionRate}%</p>
          <p className="mt-1 text-xs text-emerald-600">{metrics.completed} completed</p>
        </div>
        <div className="rounded-lg border border-purple-200 bg-purple-50 p-4">
          <p className="text-xs font-medium text-purple-600">Success Rate</p>
          <p className="mt-2 text-3xl font-bold text-purple-900">{metrics.successRate}%</p>
          <p className="mt-1 text-xs text-purple-600">{metrics.rejected} rejected</p>
        </div>
        <div className="rounded-lg border border-orange-200 bg-orange-50 p-4">
          <p className="text-xs font-medium text-orange-600">Avg Processing</p>
          <p className="mt-2 text-3xl font-bold text-orange-900">{metrics.avgProcessingTime}h</p>
          <p className="mt-1 text-xs text-orange-600">Average time to complete</p>
        </div>
      </div>

      {/* Additional Metrics */}
      <div className="grid grid-cols-3 gap-4">
        <div className="rounded-lg border border-border bg-card p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground">Total Products</p>
              <p className="mt-2 text-2xl font-bold text-foreground">{metrics.totalProducts}</p>
            </div>
            <Package className="h-8 w-8 text-blue-500 opacity-20" />
          </div>
        </div>
        <div className="rounded-lg border border-border bg-card p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground">Total Units Received</p>
              <p className="mt-2 text-2xl font-bold text-foreground">{metrics.totalQty}</p>
            </div>
            <TrendingUp className="h-8 w-8 text-emerald-500 opacity-20" />
          </div>
        </div>
        <div className="rounded-lg border border-border bg-card p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground">In Progress</p>
              <p className="mt-2 text-2xl font-bold text-foreground">{metrics.inProgress}</p>
            </div>
            <AlertCircle className="h-8 w-8 text-amber-500 opacity-20" />
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-2 gap-6">
        {/* Status Distribution */}
        <div className="rounded-lg border border-border bg-card p-4">
          <h3 className="mb-4 text-sm font-semibold text-foreground">Status Distribution</h3>
          {statusDistribution.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={statusDistribution}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={2}
                  dataKey="value"
                >
                  {statusDistribution.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex h-64 items-center justify-center text-muted-foreground">
              No data available
            </div>
          )}
        </div>

        {/* Daily Trend */}
        <div className="rounded-lg border border-border bg-card p-4">
          <h3 className="mb-4 text-sm font-semibold text-foreground">Daily Requests</h3>
          {dailyData.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={dailyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="date" stroke="var(--muted-foreground)" style={{ fontSize: "11px" }} />
                <YAxis stroke="var(--muted-foreground)" style={{ fontSize: "11px" }} />
                <Tooltip
                  contentStyle={{ backgroundColor: "var(--card)", border: "1px solid var(--border)" }}
                  labelStyle={{ color: "var(--foreground)" }}
                />
                <Line
                  type="monotone"
                  dataKey="requests"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  dot={{ fill: "#3b82f6", r: 3 }}
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex h-64 items-center justify-center text-muted-foreground">
              No data available
            </div>
          )}
        </div>
      </div>

      {/* Request Stages Flow */}
      <div className="rounded-lg border border-border bg-card p-4">
        <h3 className="mb-4 text-sm font-semibold text-foreground">Requests by Stage</h3>
        {filteredRequests.length > 0 ? (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart
              data={[
                {
                  name: "Status",
                  "Pending": filteredRequests.filter(r => r.status === "pending_approval" || r.status === "modification_requested").length,
                  "Approved": filteredRequests.filter(r => r.status === "approved" || r.status === "grn_generated").length,
                  "Transit": filteredRequests.filter(r => r.status === "vehicle_entered").length,
                  "Inspection": filteredRequests.filter(r => r.status === "unloading_inspection").length,
                  "Put-Away": filteredRequests.filter(r => r.status === "put_away").length,
                  "Completed": filteredRequests.filter(r => r.status === "completed" || r.status === "partially_completed").length,
                  "Rejected": filteredRequests.filter(r => r.status === "rejected").length,
                },
              ]}
              margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="name" stroke="var(--muted-foreground)" />
              <YAxis stroke="var(--muted-foreground)" />
              <Tooltip
                contentStyle={{ backgroundColor: "var(--card)", border: "1px solid var(--border)" }}
                labelStyle={{ color: "var(--foreground)" }}
              />
              <Legend />
              <Bar dataKey="Pending" fill="#f59e0b" />
              <Bar dataKey="Approved" fill="#3b82f6" />
              <Bar dataKey="Transit" fill="#06b6d4" />
              <Bar dataKey="Inspection" fill="#8b5cf6" />
              <Bar dataKey="Put-Away" fill="#ec4899" />
              <Bar dataKey="Completed" fill="#10b981" />
              <Bar dataKey="Rejected" fill="#ef4444" />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex h-80 items-center justify-center text-muted-foreground">
            No data available
          </div>
        )}
      </div>
    </div>
  );
}

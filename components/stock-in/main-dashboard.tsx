"use client";

import Link from "next/link";
import { useStockIn } from "./stock-in-context";
import { StockFlowVisualization } from "./stock-flow-visualization";
import {
  PackagePlus,
  TrendingUp,
  Archive,
  TrendingDown,
  BarChart3,
  FileText,
  ArrowRight,
} from "lucide-react";

export function MainDashboard() {
  const { requests, inventory } = useStockIn();

  const stats = {
    totalRequests: requests.length,
    pendingRequests: requests.filter(
      (r) => r.status === "pending_approval" || r.status === "modification_requested"
    ).length,
    completedRequests: requests.filter(
      (r) => r.status === "completed" || r.status === "partially_completed"
    ).length,
    inventoryItems: inventory.length,
    totalUnits: inventory.reduce((sum, i) => sum + i.quantity, 0),
  };

  const quickLinks = [
    {
      href: "/stock-in",
      label: "Stock-In Requests",
      icon: PackagePlus,
      color: "bg-blue-50 text-blue-600 border-blue-200",
      description: "Manage incoming shipments",
      stat: stats.totalRequests,
    },
    {
      href: "/stock-in-flow",
      label: "Flow Analytics",
      icon: TrendingUp,
      color: "bg-green-50 text-green-600 border-green-200",
      description: "Track workflow performance",
      stat: `${Math.round((stats.completedRequests / stats.totalRequests) * 100) || 0}%`,
    },
    {
      href: "/inventory",
      label: "Inventory Management",
      icon: Archive,
      color: "bg-purple-50 text-purple-600 border-purple-200",
      description: "Browse & manage stored items",
      stat: stats.inventoryItems,
    },
    {
      href: "/stock-out",
      label: "Stock-Out",
      icon: TrendingDown,
      color: "bg-orange-50 text-orange-600 border-orange-200",
      description: "Outbound & movements",
      stat: "Track",
    },
    {
      href: "/reports",
      label: "Reports",
      icon: BarChart3,
      color: "bg-indigo-50 text-indigo-600 border-indigo-200",
      description: "Analytics & insights",
      stat: "View",
    },
    {
      href: "/audit-log",
      label: "Audit Log",
      icon: FileText,
      color: "bg-slate-50 text-slate-600 border-slate-200",
      description: "Activity tracking",
      stat: "Review",
    },
  ];

  return (
    <div className="flex flex-col gap-6 p-6">
      {/* Welcome Header */}
      <div className="rounded-lg border border-border bg-gradient-to-r from-blue-50 to-indigo-50 p-6">
        <h1 className="text-3xl font-bold text-foreground">Warehouse Manager</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Complete warehouse management system with stock-in workflows, inventory tracking, and analytics
        </p>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-4 gap-4">
        <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
          <p className="text-xs font-medium text-blue-600">Total Requests</p>
          <p className="mt-2 text-3xl font-bold text-blue-900">{stats.totalRequests}</p>
          <p className="text-[11px] text-blue-600 mt-1">All time stock-in requests</p>
        </div>
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
          <p className="text-xs font-medium text-amber-600">Pending</p>
          <p className="mt-2 text-3xl font-bold text-amber-900">{stats.pendingRequests}</p>
          <p className="text-[11px] text-amber-600 mt-1">Awaiting approval</p>
        </div>
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4">
          <p className="text-xs font-medium text-emerald-600">Completed</p>
          <p className="mt-2 text-3xl font-bold text-emerald-900">{stats.completedRequests}</p>
          <p className="text-[11px] text-emerald-600 mt-1">Fully processed</p>
        </div>
        <div className="rounded-lg border border-indigo-200 bg-indigo-50 p-4">
          <p className="text-xs font-medium text-indigo-600">Inventory Units</p>
          <p className="mt-2 text-3xl font-bold text-indigo-900">{stats.totalUnits}</p>
          <p className="text-[11px] text-indigo-600 mt-1">{stats.inventoryItems} items stored</p>
        </div>
      </div>

      {/* Stock Flow Visualization */}
      <div className="rounded-lg border border-border bg-card p-6">
        <h2 className="mb-4 text-lg font-semibold text-foreground">Stock-In Processing Pipeline</h2>
        <StockFlowVisualization />
      </div>

      {/* Quick Links */}
      <div>
        <h2 className="mb-4 text-lg font-semibold text-foreground">Quick Access</h2>
        <div className="grid grid-cols-3 gap-4">
          {quickLinks.map((link) => {
            const Icon = link.icon;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`rounded-lg border p-5 transition-all hover:shadow-md hover:border-foreground/50 ${link.color}`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <Icon className="h-5 w-5 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-semibold text-sm">{link.label}</p>
                      <p className="text-xs opacity-75 mt-0.5">{link.description}</p>
                    </div>
                  </div>
                  <ArrowRight className="h-4 w-4 flex-shrink-0 opacity-50" />
                </div>
                <p className="text-2xl font-bold mt-3">{link.stat}</p>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Feature Highlights */}
      <div className="rounded-lg border border-border bg-card p-6">
        <h3 className="text-lg font-semibold text-foreground mb-4">System Features</h3>
        <div className="grid grid-cols-2 gap-6">
          <div className="flex gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-100 text-blue-600 flex-shrink-0">
              <PackagePlus className="h-4 w-4" />
            </div>
            <div>
              <p className="font-medium text-sm">Complete Stock-In Workflow</p>
              <p className="text-xs text-muted-foreground mt-1">
                From request creation through approval, GRN generation, vehicle entry, inspection, and put-away
              </p>
            </div>
          </div>

          <div className="flex gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-green-100 text-green-600 flex-shrink-0">
              <TrendingUp className="h-4 w-4" />
            </div>
            <div>
              <p className="font-medium text-sm">Real-Time Analytics</p>
              <p className="text-xs text-muted-foreground mt-1">
                Monitor processing status, completion rates, and workflow health with live dashboards
              </p>
            </div>
          </div>

          <div className="flex gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-100 text-purple-600 flex-shrink-0">
              <Archive className="h-4 w-4" />
            </div>
            <div>
              <p className="font-medium text-sm">Advanced Inventory</p>
              <p className="text-xs text-muted-foreground mt-1">
                Track placements by zone, structure, level. Monitor expiry dates and manage capacity
              </p>
            </div>
          </div>

          <div className="flex gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-orange-100 text-orange-600 flex-shrink-0">
              <TrendingDown className="h-4 w-4" />
            </div>
            <div>
              <p className="font-medium text-sm">Stock-Out Management</p>
              <p className="text-xs text-muted-foreground mt-1">
                Handle outbound shipments, returns, damage adjustments, and inventory movements
              </p>
            </div>
          </div>

          <div className="flex gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-100 text-indigo-600 flex-shrink-0">
              <BarChart3 className="h-4 w-4" />
            </div>
            <div>
              <p className="font-medium text-sm">Comprehensive Reports</p>
              <p className="text-xs text-muted-foreground mt-1">
                Performance metrics, capacity utilization, quality analysis, and supplier compliance
              </p>
            </div>
          </div>

          <div className="flex gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-slate-600 flex-shrink-0">
              <FileText className="h-4 w-4" />
            </div>
            <div>
              <p className="font-medium text-sm">Complete Audit Trail</p>
              <p className="text-xs text-muted-foreground mt-1">
                Full activity logging for compliance, tracking actions from request to completion
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

"use client";

import { useState, useMemo } from "react";
import {
  Search,
  Archive,
  AlertTriangle,
  Package,
  TrendingDown,
  Download,
  Filter,
  BarChart3,
} from "lucide-react";
import { useStockIn } from "./stock-in-context";
import { useWarehouseData } from "./warehouse-data-context";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";

export function InventoryAdvanced() {
  const { inventory } = useStockIn();
  const { layoutData } = useWarehouseData();
  const [search, setSearch] = useState("");
  const [filterZone, setFilterZone] = useState("all");
  const [filterStructure, setFilterStructure] = useState("all");
  const [sortBy, setSortBy] = useState<"qty" | "expiry" | "zone" | "recent">("recent");
  const [viewMode, setViewMode] = useState<"table" | "analytics">("table");

  const now = new Date();
  const thirtyDaysMs = 30 * 24 * 60 * 60 * 1000;

  const filtered = useMemo(() => {
    let items = inventory.filter((item) => {
      const matchSearch =
        !search ||
        item.sku.toLowerCase().includes(search.toLowerCase()) ||
        item.productName.toLowerCase().includes(search.toLowerCase()) ||
        item.grnNumber.toLowerCase().includes(search.toLowerCase());
      const matchZone = filterZone === "all" || item.zoneId === filterZone;
      const matchStructure = filterStructure === "all" || item.structureId === filterStructure;
      return matchSearch && matchZone && matchStructure;
    });

    // Sort
    switch (sortBy) {
      case "qty":
        items.sort((a, b) => b.quantity - a.quantity);
        break;
      case "expiry":
        items.sort((a, b) => {
          if (!a.expiryDate && !b.expiryDate) return 0;
          if (!a.expiryDate) return 1;
          if (!b.expiryDate) return -1;
          return new Date(a.expiryDate).getTime() - new Date(b.expiryDate).getTime();
        });
        break;
      case "zone":
        items.sort((a, b) => a.zoneName.localeCompare(b.zoneName));
        break;
      case "recent":
        items.sort((a, b) => new Date(b.placedAt).getTime() - new Date(a.placedAt).getTime());
        break;
    }

    return items;
  }, [inventory, search, filterZone, filterStructure, sortBy]);

  // Analytics
  const analytics = useMemo(() => {
    const totalQty = inventory.reduce((sum, i) => sum + i.quantity, 0);
    const uniqueSKUs = new Set(inventory.map((i) => i.sku)).size;
    const totalValue = inventory.reduce((sum, i) => sum + i.quantity, 0); // simplified, no price data

    const expiringItems = inventory.filter((item) => {
      if (!item.expiryDate) return false;
      const diff = new Date(item.expiryDate).getTime() - now.getTime();
      return diff > 0 && diff <= thirtyDaysMs;
    });

    const expiredItems = inventory.filter((item) => {
      if (!item.expiryDate) return false;
      return new Date(item.expiryDate).getTime() < now.getTime();
    });

    // By zone
    const byZone = layoutData.zones.map((zone) => {
      const items = inventory.filter((i) => i.zoneId === zone.id);
      const qty = items.reduce((sum, i) => sum + i.quantity, 0);
      const skus = new Set(items.map((i) => i.sku)).size;
      return { name: zone.label, quantity: qty, skus, items: items.length };
    });

    // By UOM
    const byUom: { [key: string]: number } = {};
    inventory.forEach((i) => {
      byUom[i.uom] = (byUom[i.uom] || 0) + i.quantity;
    });

    const byUomData = Object.entries(byUom).map(([name, value]) => ({ name, value }));

    return {
      totalQty,
      uniqueSKUs,
      totalValue,
      expiringItems: expiringItems.length,
      expiredItems: expiredItems.length,
      byZone,
      byUomData,
      placements: inventory.length,
    };
  }, [inventory, layoutData, now]);

  const COLORS = ["#10b981", "#3b82f6", "#f59e0b", "#ef4444", "#8b5cf6", "#06b6d4"];

  const inputClass =
    "rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground outline-none focus:ring-2 focus:ring-ring";

  return (
    <div className="flex flex-col gap-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-foreground">Advanced Inventory</h1>
          <p className="text-sm text-muted-foreground">
            Analytics, tracking, and storage optimization
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setViewMode(viewMode === "table" ? "analytics" : "table")}
            className="flex items-center gap-2 rounded-md border border-input px-3 py-2 text-sm font-medium text-foreground hover:bg-accent"
          >
            <BarChart3 className="h-4 w-4" />
            {viewMode === "table" ? "View Analytics" : "View Table"}
          </button>
          <button className="flex items-center gap-2 rounded-md border border-input px-3 py-2 text-sm font-medium text-foreground hover:bg-accent">
            <Download className="h-4 w-4" /> Export
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-5 gap-4">
        <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
          <p className="text-xs font-medium text-blue-600">Total Units</p>
          <p className="mt-2 text-2xl font-bold text-blue-900">{analytics.totalQty}</p>
        </div>
        <div className="rounded-lg border border-indigo-200 bg-indigo-50 p-4">
          <p className="text-xs font-medium text-indigo-600">Unique SKUs</p>
          <p className="mt-2 text-2xl font-bold text-indigo-900">{analytics.uniqueSKUs}</p>
        </div>
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4">
          <p className="text-xs font-medium text-emerald-600">Placements</p>
          <p className="mt-2 text-2xl font-bold text-emerald-900">{analytics.placements}</p>
        </div>
        {analytics.expiringItems > 0 && (
          <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
            <p className="text-xs font-medium text-amber-600">Expiring Soon</p>
            <p className="mt-2 text-2xl font-bold text-amber-900">{analytics.expiringItems}</p>
          </div>
        )}
        {analytics.expiredItems > 0 && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-4">
            <p className="text-xs font-medium text-red-600">Expired</p>
            <p className="mt-2 text-2xl font-bold text-red-900">{analytics.expiredItems}</p>
          </div>
        )}
      </div>

      {viewMode === "analytics" ? (
        <>
          {/* Analytics Charts */}
          <div className="grid grid-cols-2 gap-6">
            {/* By Zone */}
            <div className="rounded-lg border border-border bg-card p-4">
              <h3 className="mb-4 text-sm font-semibold text-foreground">Inventory by Zone</h3>
              {analytics.byZone.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={analytics.byZone}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                    <XAxis dataKey="name" stroke="var(--muted-foreground)" style={{ fontSize: "11px" }} />
                    <YAxis stroke="var(--muted-foreground)" style={{ fontSize: "11px" }} />
                    <Tooltip
                      contentStyle={{ backgroundColor: "var(--card)", border: "1px solid var(--border)" }}
                      labelStyle={{ color: "var(--foreground)" }}
                    />
                    <Legend />
                    <Bar dataKey="quantity" fill="#3b82f6" name="Units" />
                    <Bar dataKey="items" fill="#8b5cf6" name="Items" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex h-80 items-center justify-center text-muted-foreground">
                  No data available
                </div>
              )}
            </div>

            {/* By UOM */}
            <div className="rounded-lg border border-border bg-card p-4">
              <h3 className="mb-4 text-sm font-semibold text-foreground">Inventory by Unit of Measure</h3>
              {analytics.byUomData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={analytics.byUomData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, value }) => `${name}: ${value}`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {analytics.byUomData.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex h-80 items-center justify-center text-muted-foreground">
                  No data available
                </div>
              )}
            </div>
          </div>

          {/* Zone Details Table */}
          <div className="rounded-lg border border-border bg-card overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Zone</th>
                  <th className="px-4 py-3 text-right font-medium text-muted-foreground">Total Units</th>
                  <th className="px-4 py-3 text-right font-medium text-muted-foreground">Items</th>
                  <th className="px-4 py-3 text-right font-medium text-muted-foreground">SKUs</th>
                </tr>
              </thead>
              <tbody>
                {analytics.byZone.map((zone) => (
                  <tr key={zone.name} className="border-b border-border last:border-0 hover:bg-accent/50">
                    <td className="px-4 py-3 font-medium">{zone.name}</td>
                    <td className="px-4 py-3 text-right">{zone.quantity}</td>
                    <td className="px-4 py-3 text-right">{zone.items}</td>
                    <td className="px-4 py-3 text-right">{zone.skus}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      ) : (
        <>
          {/* Filters */}
          <div className="flex items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by SKU, product name, or GRN..."
                className={`w-full pl-10 ${inputClass}`}
              />
            </div>
            <div className="flex items-center gap-1 text-muted-foreground">
              <Filter className="h-4 w-4" />
            </div>
            <select value={filterZone} onChange={(e) => setFilterZone(e.target.value)} className={inputClass}>
              <option value="all">All Zones</option>
              {layoutData.zones.map((z) => (
                <option key={z.id} value={z.id}>{z.label}</option>
              ))}
            </select>
            <select value={filterStructure} onChange={(e) => setFilterStructure(e.target.value)} className={inputClass}>
              <option value="all">All Structures</option>
              {layoutData.structures.map((s) => (
                <option key={s.id} value={s.id}>{s.label}</option>
              ))}
            </select>
            <select value={sortBy} onChange={(e) => setSortBy(e.target.value as any)} className={inputClass}>
              <option value="recent">Recently Added</option>
              <option value="qty">Highest Quantity</option>
              <option value="expiry">Expiring Soon</option>
              <option value="zone">By Zone</option>
            </select>
          </div>

          {/* Table */}
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border py-16 text-muted-foreground">
              <Archive className="mb-3 h-10 w-10" />
              <p className="text-sm font-medium">No inventory items match your filters</p>
            </div>
          ) : (
            <div className="overflow-hidden rounded-lg border border-border">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/50">
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">SKU</th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Product</th>
                    <th className="px-4 py-3 text-right font-medium text-muted-foreground">Qty</th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">UOM</th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">GRN</th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Zone</th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Location</th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Batch</th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Expiry</th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Placed</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((item) => {
                    const isExpiring =
                      item.expiryDate &&
                      new Date(item.expiryDate).getTime() - now.getTime() <= thirtyDaysMs &&
                      new Date(item.expiryDate).getTime() > now.getTime();
                    const isExpired = item.expiryDate && new Date(item.expiryDate).getTime() < now.getTime();

                    return (
                      <tr
                        key={item.id}
                        className={`border-b border-border last:border-0 ${
                          isExpired ? "bg-red-50/50" : isExpiring ? "bg-amber-50/50" : ""
                        }`}
                      >
                        <td className="px-4 py-3 font-mono text-xs">{item.sku}</td>
                        <td className="px-4 py-3">{item.productName}</td>
                        <td className="px-4 py-3 text-right font-medium">{item.quantity}</td>
                        <td className="px-4 py-3 text-muted-foreground">{item.uom}</td>
                        <td className="px-4 py-3 font-mono text-xs">{item.grnNumber}</td>
                        <td className="px-4 py-3">{item.zoneName}</td>
                        <td className="px-4 py-3 text-xs text-muted-foreground">
                          {item.structureName} / {item.levelName} / {item.partitionName}
                        </td>
                        <td className="px-4 py-3 text-xs text-muted-foreground">{item.batchNumber || "--"}</td>
                        <td className="px-4 py-3 text-xs">
                          {item.expiryDate ? (
                            <span
                              className={
                                isExpired
                                  ? "font-medium text-red-600"
                                  : isExpiring
                                    ? "font-medium text-amber-600"
                                    : "text-muted-foreground"
                              }
                            >
                              {item.expiryDate}
                              {isExpiring && " (soon)"}
                              {isExpired && " (expired)"}
                            </span>
                          ) : (
                            "--"
                          )}
                        </td>
                        <td className="px-4 py-3 text-xs text-muted-foreground">
                          {new Date(item.placedAt).toLocaleDateString()}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </div>
  );
}

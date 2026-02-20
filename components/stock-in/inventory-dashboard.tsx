"use client";

import { useState, useMemo } from "react";
import { Search, Archive, AlertTriangle, Package } from "lucide-react";
import { useStockIn } from "./stock-in-context";
import { useWarehouseData } from "./warehouse-data-context";

export function InventoryDashboard() {
  const { inventory } = useStockIn();
  const { layoutData } = useWarehouseData();
  const [search, setSearch] = useState("");
  const [filterZone, setFilterZone] = useState("all");
  const [filterStructure, setFilterStructure] = useState("all");

  const now = new Date();
  const thirtyDaysMs = 30 * 24 * 60 * 60 * 1000;

  const filtered = useMemo(() => {
    return inventory.filter((item) => {
      const matchSearch =
        !search ||
        item.sku.toLowerCase().includes(search.toLowerCase()) ||
        item.productName.toLowerCase().includes(search.toLowerCase()) ||
        item.grnNumber.toLowerCase().includes(search.toLowerCase());
      const matchZone = filterZone === "all" || item.zoneId === filterZone;
      const matchStructure = filterStructure === "all" || item.structureId === filterStructure;
      return matchSearch && matchZone && matchStructure;
    });
  }, [inventory, search, filterZone, filterStructure]);

  const expiringItems = inventory.filter((item) => {
    if (!item.expiryDate) return false;
    const diff = new Date(item.expiryDate).getTime() - now.getTime();
    return diff > 0 && diff <= thirtyDaysMs;
  });

  const totalQuantity = inventory.reduce((sum, i) => sum + i.quantity, 0);
  const uniqueSKUs = new Set(inventory.map((i) => i.sku)).size;

  // Capacity summary by zone
  const zoneSummary = layoutData.zones.map((zone) => {
    const zoneStructures = layoutData.structures.filter((s) => s.zoneId === zone.id);
    let totalCap = 0;
    let usedCap = 0;
    zoneStructures.forEach((s) => {
      s.levels.forEach((l) => {
        l.partitions.forEach((p) => {
          totalCap += p.maxCapacity;
          usedCap += p.usedCapacity;
        });
      });
    });
    return { ...zone, totalCap, usedCap, percentage: totalCap > 0 ? Math.round((usedCap / totalCap) * 100) : 0 };
  });

  const inputClass =
    "rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground outline-none focus:ring-2 focus:ring-ring";

  return (
    <div className="flex flex-col gap-6 p-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-foreground">Inventory</h1>
        <p className="text-sm text-muted-foreground">
          Browse all stored items and monitor capacity
        </p>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-4 gap-4">
        <div className="flex items-center gap-3 rounded-lg border border-blue-200 bg-blue-50 p-4 text-blue-600">
          <Package className="h-8 w-8" />
          <div>
            <p className="text-2xl font-bold">{totalQuantity}</p>
            <p className="text-xs font-medium opacity-80">Total Units</p>
          </div>
        </div>
        <div className="flex items-center gap-3 rounded-lg border border-indigo-200 bg-indigo-50 p-4 text-indigo-600">
          <Archive className="h-8 w-8" />
          <div>
            <p className="text-2xl font-bold">{uniqueSKUs}</p>
            <p className="text-xs font-medium opacity-80">Unique SKUs</p>
          </div>
        </div>
        <div className="flex items-center gap-3 rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-emerald-600">
          <Package className="h-8 w-8" />
          <div>
            <p className="text-2xl font-bold">{inventory.length}</p>
            <p className="text-xs font-medium opacity-80">Placements</p>
          </div>
        </div>
        {expiringItems.length > 0 && (
          <div className="flex items-center gap-3 rounded-lg border border-amber-200 bg-amber-50 p-4 text-amber-600">
            <AlertTriangle className="h-8 w-8" />
            <div>
              <p className="text-2xl font-bold">{expiringItems.length}</p>
              <p className="text-xs font-medium opacity-80">Expiring Soon</p>
            </div>
          </div>
        )}
      </div>

      {/* Capacity by Zone */}
      {zoneSummary.length > 0 && (
        <div>
          <h2 className="mb-3 text-sm font-semibold text-foreground">Zone Capacity Overview</h2>
          <div className="grid grid-cols-4 gap-3">
            {zoneSummary.map((zone) => (
              <div key={zone.id} className="rounded-md border border-border p-3">
                <p className="text-sm font-medium text-foreground">{zone.label}</p>
                <div className="mt-2 h-2 overflow-hidden rounded-full bg-muted">
                  <div
                    className={`h-full rounded-full transition-all ${
                      zone.percentage > 90 ? "bg-red-500" : zone.percentage > 70 ? "bg-amber-500" : "bg-emerald-500"
                    }`}
                    style={{ width: `${zone.percentage}%` }}
                  />
                </div>
                <p className="mt-1 text-[10px] text-muted-foreground">
                  {zone.usedCap} / {zone.totalCap} used ({zone.percentage}%)
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

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
      </div>

      {/* Table */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border py-16 text-muted-foreground">
          <Archive className="mb-3 h-10 w-10" />
          <p className="text-sm font-medium">No inventory items</p>
          <p className="text-xs">Complete a stock-in put-away to see items here</p>
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
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Structure</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Level / Partition</th>
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
                return (
                  <tr
                    key={item.id}
                    className={`border-b border-border last:border-0 ${isExpiring ? "bg-amber-50/50" : ""}`}
                  >
                    <td className="px-4 py-3 font-mono text-xs">{item.sku}</td>
                    <td className="px-4 py-3">{item.productName}</td>
                    <td className="px-4 py-3 text-right font-medium">{item.quantity}</td>
                    <td className="px-4 py-3 text-muted-foreground">{item.uom}</td>
                    <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{item.grnNumber}</td>
                    <td className="px-4 py-3">{item.zoneName}</td>
                    <td className="px-4 py-3">{item.structureName}</td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">
                      {item.levelName} / {item.partitionName}
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">{item.batchNumber || "--"}</td>
                    <td className="px-4 py-3 text-xs">
                      {item.expiryDate ? (
                        <span className={isExpiring ? "font-medium text-amber-600" : "text-muted-foreground"}>
                          {item.expiryDate}
                          {isExpiring && " (soon)"}
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
    </div>
  );
}

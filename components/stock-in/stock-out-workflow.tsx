"use client";

import { useState, useMemo } from "react";
import {
  Plus,
  Search,
  TrendingDown,
  ArrowRight,
  CheckCircle2,
  Clock,
  Package,
  Trash2,
  AlertCircle,
} from "lucide-react";
import { useStockIn } from "./stock-in-context";
import { useWarehouseData } from "./warehouse-data-context";

interface StockOutItem {
  id: string;
  inventoryId: string;
  sku: string;
  productName: string;
  quantity: number;
  uom: string;
  fromZone: string;
  fromLocation: string;
  reason: "sale" | "return" | "damage" | "adjustment" | "other";
  status: "pending" | "processing" | "completed";
  createdAt: string;
  completedAt?: string;
  notes: string;
}

export function StockOutWorkflow() {
  const { inventory } = useStockIn();
  const [stockOuts, setStockOuts] = useState<StockOutItem[]>([]);
  const [showCreate, setShowCreate] = useState(false);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<"all" | "pending" | "processing" | "completed">("all");
  const [selectedInventoryId, setSelectedInventoryId] = useState("");
  const [quantity, setQuantity] = useState("");
  const [reason, setReason] = useState<StockOutItem["reason"]>("sale");
  const [notes, setNotes] = useState("");

  const filtered = useMemo(() => {
    return stockOuts.filter((item) => {
      const matchSearch =
        !search ||
        item.sku.toLowerCase().includes(search.toLowerCase()) ||
        item.productName.toLowerCase().includes(search.toLowerCase());
      const matchStatus = filterStatus === "all" || item.status === filterStatus;
      return matchSearch && matchStatus;
    });
  }, [stockOuts, search, filterStatus]);

  const stats = useMemo(() => {
    return {
      total: stockOuts.length,
      pending: stockOuts.filter((i) => i.status === "pending").length,
      processing: stockOuts.filter((i) => i.status === "processing").length,
      completed: stockOuts.filter((i) => i.status === "completed").length,
      totalQtyOut: stockOuts.reduce((sum, i) => sum + i.quantity, 0),
    };
  }, [stockOuts]);

  const handleCreateStockOut = () => {
    if (!selectedInventoryId || !quantity) return;

    const inventoryItem = inventory.find((i) => i.id === selectedInventoryId);
    if (!inventoryItem || Number(quantity) > inventoryItem.quantity) return;

    const newStockOut: StockOutItem = {
      id: Math.random().toString(36).substring(2, 10),
      inventoryId: selectedInventoryId,
      sku: inventoryItem.sku,
      productName: inventoryItem.productName,
      quantity: Number(quantity),
      uom: inventoryItem.uom,
      fromZone: inventoryItem.zoneName,
      fromLocation: `${inventoryItem.structureName} / ${inventoryItem.levelName} / ${inventoryItem.partitionName}`,
      reason,
      status: "pending",
      createdAt: new Date().toISOString(),
      notes,
    };

    setStockOuts((prev) => [newStockOut, ...prev]);
    setSelectedInventoryId("");
    setQuantity("");
    setReason("sale");
    setNotes("");
    setShowCreate(false);
  };

  const updateStatus = (id: string, status: StockOutItem["status"]) => {
    setStockOuts((prev) =>
      prev.map((item) =>
        item.id === id
          ? {
              ...item,
              status,
              completedAt: status === "completed" ? new Date().toISOString() : item.completedAt,
            }
          : item
      )
    );
  };

  const deleteStockOut = (id: string) => {
    setStockOuts((prev) => prev.filter((item) => item.id !== id));
  };

  const reasonColors: Record<StockOutItem["reason"], string> = {
    sale: "bg-emerald-50 text-emerald-700 border-emerald-200",
    return: "bg-blue-50 text-blue-700 border-blue-200",
    damage: "bg-red-50 text-red-700 border-red-200",
    adjustment: "bg-amber-50 text-amber-700 border-amber-200",
    other: "bg-slate-50 text-slate-700 border-slate-200",
  };

  const statusColors: Record<StockOutItem["status"], string> = {
    pending: "bg-slate-50 border-slate-200 text-slate-600",
    processing: "bg-blue-50 border-blue-200 text-blue-600",
    completed: "bg-emerald-50 border-emerald-200 text-emerald-600",
  };

  const inputClass =
    "w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground outline-none focus:ring-2 focus:ring-ring";

  return (
    <div className="flex flex-col gap-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-foreground">Stock Out / Movement</h1>
          <p className="text-sm text-muted-foreground">
            Track outbound shipments, returns, and inventory adjustments
          </p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          <Plus className="h-4 w-4" /> New Stock Out
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-5 gap-3">
        <div className="rounded-lg border border-blue-200 bg-blue-50 p-3">
          <p className="text-[11px] font-medium text-blue-600">Total Movements</p>
          <p className="mt-1 text-2xl font-bold text-blue-900">{stats.total}</p>
        </div>
        <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
          <p className="text-[11px] font-medium text-slate-600">Pending</p>
          <p className="mt-1 text-2xl font-bold text-slate-900">{stats.pending}</p>
        </div>
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-3">
          <p className="text-[11px] font-medium text-amber-600">Processing</p>
          <p className="mt-1 text-2xl font-bold text-amber-900">{stats.processing}</p>
        </div>
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3">
          <p className="text-[11px] font-medium text-emerald-600">Completed</p>
          <p className="mt-1 text-2xl font-bold text-emerald-900">{stats.completed}</p>
        </div>
        <div className="rounded-lg border border-purple-200 bg-purple-50 p-3">
          <p className="text-[11px] font-medium text-purple-600">Total Units Out</p>
          <p className="mt-1 text-2xl font-bold text-purple-900">{stats.totalQtyOut}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by SKU or product name..."
            className={`w-full pl-10 ${inputClass}`}
          />
        </div>
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value as any)}
          className={inputClass}
        >
          <option value="all">All Status</option>
          <option value="pending">Pending</option>
          <option value="processing">Processing</option>
          <option value="completed">Completed</option>
        </select>
      </div>

      {/* Table */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border py-16 text-muted-foreground">
          <TrendingDown className="mb-3 h-10 w-10" />
          <p className="text-sm font-medium">No stock out movements yet</p>
          <p className="text-xs">Create your first movement to get started</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-lg border border-border">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">SKU</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Product</th>
                <th className="px-4 py-3 text-right font-medium text-muted-foreground">Qty</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">From</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Reason</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Status</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Date</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((item) => (
                <tr key={item.id} className="border-b border-border last:border-0 hover:bg-accent/50">
                  <td className="px-4 py-3 font-mono text-xs">{item.sku}</td>
                  <td className="px-4 py-3">{item.productName}</td>
                  <td className="px-4 py-3 text-right font-medium">{item.quantity} {item.uom}</td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">
                    <div>{item.fromZone}</div>
                    <div className="opacity-70">{item.fromLocation}</div>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex rounded-full border px-2.5 py-0.5 text-xs font-medium capitalize ${
                        reasonColors[item.reason]
                      }`}
                    >
                      {item.reason}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-medium ${
                        statusColors[item.status]
                      }`}
                    >
                      {item.status === "pending" && <Clock className="h-3 w-3" />}
                      {item.status === "processing" && <ArrowRight className="h-3 w-3" />}
                      {item.status === "completed" && <CheckCircle2 className="h-3 w-3" />}
                      {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">
                    {new Date(item.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      {item.status === "pending" && (
                        <>
                          <button
                            onClick={() => updateStatus(item.id, "processing")}
                            className="rounded px-2 py-1 text-[11px] font-medium text-blue-600 hover:bg-blue-50"
                          >
                            Start
                          </button>
                          <button
                            onClick={() => deleteStockOut(item.id)}
                            className="rounded p-1 text-red-600 hover:bg-red-50"
                          >
                            <Trash2 className="h-3 w-3" />
                          </button>
                        </>
                      )}
                      {item.status === "processing" && (
                        <button
                          onClick={() => updateStatus(item.id, "completed")}
                          className="rounded px-2 py-1 text-[11px] font-medium text-emerald-600 hover:bg-emerald-50"
                        >
                          Complete
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Create Modal */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/40 p-4 pt-16 overflow-y-auto">
          <div className="w-full max-w-2xl rounded-lg border border-border bg-card shadow-lg">
            <div className="flex items-center justify-between border-b border-border px-6 py-4">
              <h2 className="text-lg font-semibold text-foreground">New Stock Out</h2>
              <button
                onClick={() => setShowCreate(false)}
                className="rounded-md p-1 hover:bg-accent text-muted-foreground"
              >
                ✕
              </button>
            </div>

            <div className="flex flex-col gap-6 p-6">
              <div className="flex flex-col gap-2">
                <label className="text-xs font-medium text-muted-foreground">Select Inventory Item *</label>
                <select
                  value={selectedInventoryId}
                  onChange={(e) => setSelectedInventoryId(e.target.value)}
                  className={inputClass}
                >
                  <option value="">Choose an item from inventory</option>
                  {inventory.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.sku} - {item.productName} (Qty: {item.quantity} {item.uom}, {item.zoneName})
                    </option>
                  ))}
                </select>
              </div>

              {selectedInventoryId && (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex flex-col gap-2">
                      <label className="text-xs font-medium text-muted-foreground">Quantity to Remove *</label>
                      <input
                        type="number"
                        min={1}
                        max={inventory.find((i) => i.id === selectedInventoryId)?.quantity || 0}
                        value={quantity}
                        onChange={(e) => setQuantity(e.target.value)}
                        className={inputClass}
                        placeholder="Enter quantity"
                      />
                    </div>
                    <div className="flex flex-col gap-2">
                      <label className="text-xs font-medium text-muted-foreground">Reason *</label>
                      <select value={reason} onChange={(e) => setReason(e.target.value as any)} className={inputClass}>
                        <option value="sale">Sale</option>
                        <option value="return">Return</option>
                        <option value="damage">Damage</option>
                        <option value="adjustment">Adjustment</option>
                        <option value="other">Other</option>
                      </select>
                    </div>
                  </div>

                  <div className="flex flex-col gap-2">
                    <label className="text-xs font-medium text-muted-foreground">Notes</label>
                    <textarea
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      rows={3}
                      className={inputClass}
                      placeholder="Optional notes about this movement..."
                    />
                  </div>
                </>
              )}

              <div className="flex justify-end gap-3 border-t border-border pt-4">
                <button
                  onClick={() => setShowCreate(false)}
                  className="rounded-md border border-input px-4 py-2 text-sm font-medium text-foreground hover:bg-accent"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateStockOut}
                  disabled={!selectedInventoryId || !quantity}
                  className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
                >
                  Create Movement
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

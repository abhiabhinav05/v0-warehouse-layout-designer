"use client";

import { useState } from "react";
import { Plus, Trash2, X } from "lucide-react";
import { useStockIn } from "./stock-in-context";
import type { ProductLine } from "./types";

function generateId() {
  return Math.random().toString(36).substring(2, 10);
}

function emptyProduct(): ProductLine {
  return {
    id: generateId(),
    sku: "",
    name: "",
    quantity: 1,
    weight: 0,
    dimensions: { l: 0, w: 0, h: 0 },
    batchNumber: "",
    expiryDate: "",
    uom: "units",
  };
}

interface CreateRequestFormProps {
  onClose: () => void;
  onCreated: (id: string) => void;
}

export function CreateRequestForm({ onClose, onCreated }: CreateRequestFormProps) {
  const { createRequest } = useStockIn();

  const [supplierName, setSupplierName] = useState("");
  const [supplierContact, setSupplierContact] = useState("");
  const [expectedDeliveryDate, setExpectedDeliveryDate] = useState("");
  const [purchaseOrderRef, setPurchaseOrderRef] = useState("");
  const [vehicleNumber, setVehicleNumber] = useState("");
  const [driverName, setDriverName] = useState("");
  const [driverPhone, setDriverPhone] = useState("");
  const [products, setProducts] = useState<ProductLine[]>([emptyProduct()]);

  const addProduct = () => setProducts((p) => [...p, emptyProduct()]);

  const removeProduct = (id: string) => {
    if (products.length <= 1) return;
    setProducts((p) => p.filter((item) => item.id !== id));
  };

  const updateProduct = (id: string, field: string, value: unknown) => {
    setProducts((prev) =>
      prev.map((p) => {
        if (p.id !== id) return p;
        if (field.startsWith("dimensions.")) {
          const dimKey = field.split(".")[1] as "l" | "w" | "h";
          return { ...p, dimensions: { ...p.dimensions, [dimKey]: Number(value) } };
        }
        return { ...p, [field]: value };
      })
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!supplierName || !purchaseOrderRef || !expectedDeliveryDate) return;
    if (products.some((p) => !p.sku || !p.name || p.quantity < 1)) return;

    const req = createRequest({
      supplierName,
      supplierContact,
      expectedDeliveryDate,
      purchaseOrderRef,
      warehouseId: "warehouse",
      vehicleNumber: vehicleNumber || undefined,
      driverName: driverName || undefined,
      driverPhone: driverPhone || undefined,
      products,
    });
    onCreated(req.id);
  };

  const inputClass =
    "w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground outline-none focus:ring-2 focus:ring-ring";
  const labelClass = "text-xs font-medium text-muted-foreground";

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/40 p-4 pt-16 overflow-y-auto">
      <div className="w-full max-w-3xl rounded-lg border border-border bg-card shadow-lg">
        <div className="flex items-center justify-between border-b border-border px-6 py-4">
          <h2 className="text-lg font-semibold text-foreground">New Stock-In Request</h2>
          <button onClick={onClose} className="rounded-md p-1 hover:bg-accent">
            <X className="h-5 w-5 text-muted-foreground" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-6 p-6">
          {/* Supplier Info */}
          <section>
            <h3 className="mb-3 text-sm font-semibold text-foreground">Supplier Information</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <label className={labelClass}>Supplier Name *</label>
                <input
                  required
                  value={supplierName}
                  onChange={(e) => setSupplierName(e.target.value)}
                  className={inputClass}
                  placeholder="Enter supplier name"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className={labelClass}>Contact Info</label>
                <input
                  value={supplierContact}
                  onChange={(e) => setSupplierContact(e.target.value)}
                  className={inputClass}
                  placeholder="Phone or email"
                />
              </div>
            </div>
          </section>

          {/* Delivery Info */}
          <section>
            <h3 className="mb-3 text-sm font-semibold text-foreground">Delivery Information</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <label className={labelClass}>Purchase Order Ref *</label>
                <input
                  required
                  value={purchaseOrderRef}
                  onChange={(e) => setPurchaseOrderRef(e.target.value)}
                  className={inputClass}
                  placeholder="PO-XXXX"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className={labelClass}>Expected Delivery Date *</label>
                <input
                  required
                  type="date"
                  value={expectedDeliveryDate}
                  onChange={(e) => setExpectedDeliveryDate(e.target.value)}
                  className={inputClass}
                />
              </div>
            </div>
          </section>

          {/* Vehicle Info (optional) */}
          <section>
            <h3 className="mb-3 text-sm font-semibold text-foreground">
              Vehicle Information <span className="font-normal text-muted-foreground">(optional)</span>
            </h3>
            <div className="grid grid-cols-3 gap-4">
              <div className="flex flex-col gap-1.5">
                <label className={labelClass}>Vehicle Number</label>
                <input
                  value={vehicleNumber}
                  onChange={(e) => setVehicleNumber(e.target.value)}
                  className={inputClass}
                  placeholder="XX-00-XX-0000"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className={labelClass}>Driver Name</label>
                <input
                  value={driverName}
                  onChange={(e) => setDriverName(e.target.value)}
                  className={inputClass}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className={labelClass}>Driver Phone</label>
                <input
                  value={driverPhone}
                  onChange={(e) => setDriverPhone(e.target.value)}
                  className={inputClass}
                />
              </div>
            </div>
          </section>

          {/* Products */}
          <section>
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-foreground">Product Lines</h3>
              <button
                type="button"
                onClick={addProduct}
                className="flex items-center gap-1 rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90"
              >
                <Plus className="h-3 w-3" /> Add Product
              </button>
            </div>
            <div className="flex flex-col gap-4">
              {products.map((product, idx) => (
                <div
                  key={product.id}
                  className="rounded-md border border-border bg-accent/30 p-4"
                >
                  <div className="mb-3 flex items-center justify-between">
                    <span className="text-xs font-semibold text-muted-foreground">
                      Product #{idx + 1}
                    </span>
                    {products.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeProduct(product.id)}
                        className="rounded p-1 text-destructive hover:bg-destructive/10"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <div className="flex flex-col gap-1">
                      <label className={labelClass}>SKU *</label>
                      <input
                        required
                        value={product.sku}
                        onChange={(e) => updateProduct(product.id, "sku", e.target.value)}
                        className={inputClass}
                        placeholder="SKU-001"
                      />
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className={labelClass}>Product Name *</label>
                      <input
                        required
                        value={product.name}
                        onChange={(e) => updateProduct(product.id, "name", e.target.value)}
                        className={inputClass}
                      />
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className={labelClass}>UOM</label>
                      <select
                        value={product.uom}
                        onChange={(e) => updateProduct(product.id, "uom", e.target.value)}
                        className={inputClass}
                      >
                        <option value="units">Units</option>
                        <option value="kg">Kilograms</option>
                        <option value="liters">Liters</option>
                        <option value="boxes">Boxes</option>
                        <option value="pallets">Pallets</option>
                      </select>
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className={labelClass}>Quantity *</label>
                      <input
                        required
                        type="number"
                        min={1}
                        value={product.quantity}
                        onChange={(e) =>
                          updateProduct(product.id, "quantity", Number(e.target.value))
                        }
                        className={inputClass}
                      />
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className={labelClass}>Weight</label>
                      <input
                        type="number"
                        min={0}
                        step={0.1}
                        value={product.weight}
                        onChange={(e) =>
                          updateProduct(product.id, "weight", Number(e.target.value))
                        }
                        className={inputClass}
                      />
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className={labelClass}>Batch Number</label>
                      <input
                        value={product.batchNumber || ""}
                        onChange={(e) => updateProduct(product.id, "batchNumber", e.target.value)}
                        className={inputClass}
                      />
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className={labelClass}>Dimensions (L x W x H)</label>
                      <div className="flex gap-1">
                        <input
                          type="number"
                          min={0}
                          placeholder="L"
                          value={product.dimensions.l || ""}
                          onChange={(e) =>
                            updateProduct(product.id, "dimensions.l", e.target.value)
                          }
                          className={inputClass}
                        />
                        <input
                          type="number"
                          min={0}
                          placeholder="W"
                          value={product.dimensions.w || ""}
                          onChange={(e) =>
                            updateProduct(product.id, "dimensions.w", e.target.value)
                          }
                          className={inputClass}
                        />
                        <input
                          type="number"
                          min={0}
                          placeholder="H"
                          value={product.dimensions.h || ""}
                          onChange={(e) =>
                            updateProduct(product.id, "dimensions.h", e.target.value)
                          }
                          className={inputClass}
                        />
                      </div>
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className={labelClass}>Expiry Date</label>
                      <input
                        type="date"
                        value={product.expiryDate || ""}
                        onChange={(e) => updateProduct(product.id, "expiryDate", e.target.value)}
                        className={inputClass}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Actions */}
          <div className="flex justify-end gap-3 border-t border-border pt-4">
            <button
              type="button"
              onClick={onClose}
              className="rounded-md border border-input px-4 py-2 text-sm font-medium text-foreground hover:bg-accent"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
            >
              Submit Request
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

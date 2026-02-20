"use client";

import React from "react";
import { useWarehouse } from "@/contexts/warehouse-context";
import { useAuth } from "@/contexts/auth-context";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Warehouse } from "lucide-react";

export function WarehouseSelector() {
  const { warehouses, currentWarehouse, selectWarehouse } = useWarehouse();
  const { currentUser, switchWarehouse } = useAuth();

  if (!currentUser || !currentWarehouse) {
    return null;
  }

  // Filter warehouses the user has access to
  const accessibleWarehouses = warehouses.filter((w) =>
    currentUser.warehouseIds.includes(w.id)
  );

  const handleWarehouseChange = (warehouseId: string) => {
    selectWarehouse(warehouseId);
    switchWarehouse(warehouseId);
  };

  return (
    <div className="flex items-center gap-3 px-4 py-3 bg-white border-b border-gray-200">
      <Warehouse className="h-5 w-5 text-gray-600" />
      <div className="flex-1">
        <p className="text-xs text-gray-500 font-medium uppercase tracking-wider">
          Current Warehouse
        </p>
        <Select value={currentWarehouse.id} onValueChange={handleWarehouseChange}>
          <SelectTrigger className="w-full mt-1">
            <SelectValue placeholder="Select warehouse" />
          </SelectTrigger>
          <SelectContent>
            {accessibleWarehouses.map((warehouse) => (
              <SelectItem key={warehouse.id} value={warehouse.id}>
                <div className="flex items-center gap-2">
                  <span className="font-medium">{warehouse.name}</span>
                  <span className="text-xs text-gray-500">
                    {warehouse.location}
                  </span>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Warehouse Info */}
      <div className="hidden md:block text-right">
        <p className="text-xs text-gray-600">
          <span className="font-semibold">{currentWarehouse.usedCapacity}</span> /{" "}
          <span>{currentWarehouse.capacity}</span> units
        </p>
        <p className="text-xs text-gray-500">
          {Math.round(
            (currentWarehouse.usedCapacity / currentWarehouse.capacity) * 100
          )}
          % utilized
        </p>
      </div>
    </div>
  );
}

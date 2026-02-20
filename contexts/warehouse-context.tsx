"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { Warehouse } from "@/types/warehouse";

interface WarehouseContextType {
  warehouses: Warehouse[];
  currentWarehouse: Warehouse | null;
  isLoading: boolean;
  selectWarehouse: (warehouseId: string) => void;
  getWarehouseById: (id: string) => Warehouse | null;
}

const WarehouseContext = createContext<WarehouseContextType | undefined>(
  undefined
);

// Mock warehouses
const MOCK_WAREHOUSES: Warehouse[] = [
  {
    id: "warehouse_001",
    name: "Delhi Warehouse",
    location: "Delhi, India",
    managerId: "manager_001",
    capacity: 10000,
    usedCapacity: 4500,
    zones: ["Zone-A", "Zone-B", "Zone-C"],
    createdAt: new Date("2024-01-15"),
    updatedAt: new Date(),
  },
  {
    id: "warehouse_002",
    name: "Mumbai Warehouse",
    location: "Mumbai, India",
    managerId: "manager_002",
    capacity: 15000,
    usedCapacity: 8200,
    zones: ["Zone-A", "Zone-B", "Zone-C", "Zone-D"],
    createdAt: new Date("2024-01-20"),
    updatedAt: new Date(),
  },
  {
    id: "warehouse_003",
    name: "Bangalore Warehouse",
    location: "Bangalore, India",
    managerId: "manager_003",
    capacity: 12000,
    usedCapacity: 6100,
    zones: ["Zone-A", "Zone-B", "Zone-C"],
    createdAt: new Date("2024-02-01"),
    updatedAt: new Date(),
  },
];

export function WarehouseProvider({ children }: { children: React.ReactNode }) {
  const [currentWarehouse, setCurrentWarehouse] = useState<Warehouse | null>(
    null
  );
  const [isLoading, setIsLoading] = useState(true);

  // Initialize with first warehouse
  useEffect(() => {
    if (MOCK_WAREHOUSES.length > 0) {
      setCurrentWarehouse(MOCK_WAREHOUSES[0]);
    }
    setIsLoading(false);
  }, []);

  const selectWarehouse = (warehouseId: string) => {
    const warehouse = MOCK_WAREHOUSES.find((w) => w.id === warehouseId);
    if (warehouse) {
      setCurrentWarehouse(warehouse);
    }
  };

  const getWarehouseById = (id: string): Warehouse | null => {
    return MOCK_WAREHOUSES.find((w) => w.id === id) || null;
  };

  return (
    <WarehouseContext.Provider
      value={{
        warehouses: MOCK_WAREHOUSES,
        currentWarehouse,
        isLoading,
        selectWarehouse,
        getWarehouseById,
      }}
    >
      {children}
    </WarehouseContext.Provider>
  );
}

export function useWarehouse() {
  const context = useContext(WarehouseContext);
  if (!context) {
    throw new Error("useWarehouse must be used within a WarehouseProvider");
  }
  return context;
}

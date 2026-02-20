"use client";

import React, { createContext, useContext, useState, useCallback } from "react";
import type { WarehouseLayoutData, WarehouseZoneInfo, WarehouseStructureInfo } from "./types";

interface WarehouseDataContextType {
  layoutData: WarehouseLayoutData;
  setLayoutData: (data: WarehouseLayoutData) => void;
  updatePartitionCapacity: (
    structureId: string,
    levelId: string,
    partitionId: string,
    addedQuantity: number
  ) => void;
}

const WarehouseDataContext = createContext<WarehouseDataContextType | null>(null);

export function WarehouseDataProvider({ children }: { children: React.ReactNode }) {
  const [layoutData, setLayoutDataState] = useState<WarehouseLayoutData>({
    zones: [],
    structures: [],
  });

  const setLayoutData = useCallback((data: WarehouseLayoutData) => {
    setLayoutDataState(data);
  }, []);

  const updatePartitionCapacity = useCallback(
    (structureId: string, levelId: string, partitionId: string, addedQuantity: number) => {
      setLayoutDataState((prev) => ({
        ...prev,
        structures: prev.structures.map((s) =>
          s.id === structureId
            ? {
                ...s,
                levels: s.levels.map((l) =>
                  l.id === levelId
                    ? {
                        ...l,
                        partitions: l.partitions.map((p) =>
                          p.id === partitionId
                            ? { ...p, usedCapacity: p.usedCapacity + addedQuantity }
                            : p
                        ),
                      }
                    : l
                ),
              }
            : s
        ),
      }));
    },
    []
  );

  return (
    <WarehouseDataContext.Provider value={{ layoutData, setLayoutData, updatePartitionCapacity }}>
      {children}
    </WarehouseDataContext.Provider>
  );
}

export function useWarehouseData() {
  const ctx = useContext(WarehouseDataContext);
  if (!ctx) throw new Error("useWarehouseData must be used within WarehouseDataProvider");
  return ctx;
}

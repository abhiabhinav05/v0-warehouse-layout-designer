"use client";

import { WarehouseDataProvider } from "@/components/stock-in/warehouse-data-context";
import { StockInProvider } from "@/components/stock-in/stock-in-context";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <WarehouseDataProvider>
      <StockInProvider>{children}</StockInProvider>
    </WarehouseDataProvider>
  );
}

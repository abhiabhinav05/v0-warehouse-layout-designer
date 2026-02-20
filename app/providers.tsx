"use client";

import { WarehouseDataProvider } from "@/components/stock-in/warehouse-data-context";
import { StockInProvider } from "@/components/stock-in/stock-in-context";
import { AuthProvider } from "@/contexts/auth-context";
import { WarehouseProvider } from "@/contexts/warehouse-context";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <WarehouseProvider>
        <WarehouseDataProvider>
          <StockInProvider>{children}</StockInProvider>
        </WarehouseDataProvider>
      </WarehouseProvider>
    </AuthProvider>
  );
}

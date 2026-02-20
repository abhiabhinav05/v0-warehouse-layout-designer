"use client";

import { useState } from "react";
import { MainDashboard } from "@/components/stock-in/main-dashboard";
import { ReactFlowProvider } from "@xyflow/react";
import { WarehouseCanvas } from "@/components/warehouse/warehouse-canvas";
import { Layout as LayoutIcon, Package } from "lucide-react";

export default function Page() {
  const [view, setView] = useState<"dashboard" | "layout">("dashboard");

  return (
    <div className="flex flex-col h-full">
      {/* View Selector */}
      <div className="flex items-center border-b border-border bg-card px-6 py-3 gap-2">
        <button
          onClick={() => setView("dashboard")}
          className={`flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-colors ${
            view === "dashboard"
              ? "bg-primary text-primary-foreground"
              : "text-muted-foreground hover:text-foreground hover:bg-accent"
          }`}
        >
          <Package className="h-4 w-4" />
          Warehouse Manager
        </button>
        <button
          onClick={() => setView("layout")}
          className={`flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-colors ${
            view === "layout"
              ? "bg-primary text-primary-foreground"
              : "text-muted-foreground hover:text-foreground hover:bg-accent"
          }`}
        >
          <LayoutIcon className="h-4 w-4" />
          Layout Designer
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto">
        {view === "dashboard" ? (
          <MainDashboard />
        ) : (
          <ReactFlowProvider>
            <WarehouseCanvas />
          </ReactFlowProvider>
        )}
      </div>
    </div>
  );
}

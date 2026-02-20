"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, PackagePlus, Archive, FileText, Warehouse, TrendingUp, TrendingDown, BarChart3 } from "lucide-react";
import { RoleSwitcher } from "./role-switcher";
import { WarehouseSelector } from "./warehouse-selector";

const navItems = [
  { href: "/", label: "Layout Designer", icon: LayoutDashboard },
  { href: "/stock-in", label: "Stock-In", icon: PackagePlus },
  { href: "/stock-in-flow", label: "Flow Analytics", icon: TrendingUp },
  { href: "/inventory", label: "Inventory", icon: Archive },
  { href: "/stock-out", label: "Stock-Out", icon: TrendingDown },
  { href: "/reports", label: "Reports", icon: BarChart3 },
  { href: "/audit-log", label: "Audit Log", icon: FileText },
];

export function NavBar() {
  const pathname = usePathname();

  return (
    <div className="flex flex-col border-b border-border">
      {/* Top bar: Role and Warehouse Info */}
      <div className="flex items-center h-10 bg-gray-100 border-b border-border">
        <div className="flex-1 flex items-center">
          <RoleSwitcher />
        </div>
        <WarehouseSelector />
      </div>

      {/* Main Navigation */}
      <header className="flex h-12 items-center bg-card px-4">
        <div className="flex items-center gap-2 mr-8">
          <Warehouse className="h-5 w-5 text-primary" />
          <span className="text-sm font-semibold text-foreground">Warehouse Manager</span>
        </div>
        <nav className="flex items-center gap-1">
          {navItems.map((item) => {
            const isActive =
              item.href === "/"
                ? pathname === "/"
                : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-accent hover:text-foreground"
                }`}
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </header>
    </div>
  );
}

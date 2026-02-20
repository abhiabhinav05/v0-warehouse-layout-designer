"use client";

import React from "react";
import { useAuth } from "@/contexts/auth-context";
import { UserRole } from "@/types/warehouse";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Shield, ChevronDown } from "lucide-react";

const ROLES: { value: UserRole; label: string; color: string }[] = [
  { value: "admin", label: "Admin", color: "bg-purple-100 text-purple-800" },
  { value: "manager", label: "Manager", color: "bg-blue-100 text-blue-800" },
  {
    value: "approver",
    label: "Approver",
    color: "bg-green-100 text-green-800",
  },
  {
    value: "operator",
    label: "Operator",
    color: "bg-amber-100 text-amber-800",
  },
  { value: "viewer", label: "Viewer", color: "bg-gray-100 text-gray-800" },
];

export function RoleSwitcher() {
  const { currentUser, switchRole } = useAuth();

  if (!currentUser) {
    return null;
  }

  const currentRoleConfig = ROLES.find((r) => r.value === currentUser.role);

  return (
    <div className="flex items-center gap-2 px-4 py-3 border-r border-gray-200">
      <Shield className="h-4 w-4 text-gray-600" />
      <span className="text-xs text-gray-600 font-medium">Role:</span>
      
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className={`${currentRoleConfig?.color} border-0`}
          >
            {currentUser.role}
            <ChevronDown className="ml-1 h-3 w-3" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          <DropdownMenuLabel>Switch Role (for testing)</DropdownMenuLabel>
          <DropdownMenuSeparator />
          {ROLES.map((role) => (
            <DropdownMenuItem
              key={role.value}
              onClick={() => switchRole(role.value)}
              className={currentUser.role === role.value ? "bg-gray-100" : ""}
            >
              <Badge className={`${role.color} mr-2`}>{role.label}</Badge>
              {currentUser.role === role.value && (
                <span className="text-xs ml-auto">Active</span>
              )}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      <div className="hidden md:block text-xs text-gray-500 ml-2">
        {currentUser.name}
      </div>
    </div>
  );
}

"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { User, UserRole } from "@/types/warehouse";

interface AuthContextType {
  currentUser: User | null;
  isLoading: boolean;
  login: (userId: string) => void;
  logout: () => void;
  switchRole: (role: UserRole) => void;
  switchWarehouse: (warehouseId: string) => void;
  currentWarehouseId: string | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Mock users for demo purposes
const MOCK_USERS: Record<string, User> = {
  admin_001: {
    id: "admin_001",
    name: "Admin User",
    email: "admin@warehouse.com",
    role: "admin",
    warehouseIds: ["warehouse_001", "warehouse_002", "warehouse_003"],
    createdAt: new Date(),
  },
  manager_001: {
    id: "manager_001",
    name: "Warehouse Manager",
    email: "manager@warehouse.com",
    role: "manager",
    warehouseIds: ["warehouse_001"],
    createdAt: new Date(),
  },
  approver_001: {
    id: "approver_001",
    name: "Approver",
    email: "approver@warehouse.com",
    role: "approver",
    warehouseIds: ["warehouse_001", "warehouse_002"],
    createdAt: new Date(),
  },
  operator_001: {
    id: "operator_001",
    name: "Warehouse Operator",
    email: "operator@warehouse.com",
    role: "operator",
    warehouseIds: ["warehouse_001"],
    createdAt: new Date(),
  },
};

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [currentWarehouseId, setCurrentWarehouseId] = useState<string | null>(
    null
  );
  const [isLoading, setIsLoading] = useState(true);

  // Initialize with admin user
  useEffect(() => {
    const defaultUser = MOCK_USERS.admin_001;
    setCurrentUser(defaultUser);
    if (defaultUser.warehouseIds.length > 0) {
      setCurrentWarehouseId(defaultUser.warehouseIds[0]);
    }
    setIsLoading(false);
  }, []);

  const login = (userId: string) => {
    const user = MOCK_USERS[userId];
    if (user) {
      setCurrentUser(user);
      if (user.warehouseIds.length > 0) {
        setCurrentWarehouseId(user.warehouseIds[0]);
      }
    }
  };

  const logout = () => {
    setCurrentUser(null);
    setCurrentWarehouseId(null);
  };

  const switchRole = (role: UserRole) => {
    if (!currentUser) return;

    // Find a user with this role
    const userWithRole = Object.values(MOCK_USERS).find((u) => u.role === role);
    if (userWithRole) {
      setCurrentUser(userWithRole);
      if (userWithRole.warehouseIds.length > 0) {
        setCurrentWarehouseId(userWithRole.warehouseIds[0]);
      }
    }
  };

  const switchWarehouse = (warehouseId: string) => {
    if (currentUser && currentUser.warehouseIds.includes(warehouseId)) {
      setCurrentWarehouseId(warehouseId);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        isLoading,
        login,
        logout,
        switchRole,
        switchWarehouse,
        currentWarehouseId,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

"use client";

import { createContext, useContext } from "react";

type Role = "admin" | "manager";

const AdminRoleContext = createContext<Role>("admin");

export function AdminRoleProvider({
  role,
  children,
}: {
  role: Role;
  children: React.ReactNode;
}) {
  return (
    <AdminRoleContext.Provider value={role}>
      {children}
    </AdminRoleContext.Provider>
  );
}

export function useAdminRole(): Role {
  return useContext(AdminRoleContext);
}

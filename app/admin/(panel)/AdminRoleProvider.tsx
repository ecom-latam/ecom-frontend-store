'use client';

import { createContext, useContext, useEffect, useState } from 'react';

type AdminRole = 'Admin' | 'Manager' | 'Seller' | null;

const AdminRoleContext = createContext<AdminRole>(null);

export function useAdminRole(): AdminRole {
  return useContext(AdminRoleContext);
}

export function AdminRoleProvider({ children }: { children: React.ReactNode }) {
  const [role, setRole] = useState<AdminRole>(null);

  useEffect(() => {
    fetch('/api/admin/me')
      .then((r) => r.json())
      .then((data: { role?: string }) => {
        if (data.role) setRole(data.role as AdminRole);
      })
      .catch(() => {});
  }, []);

  return <AdminRoleContext.Provider value={role}>{children}</AdminRoleContext.Provider>;
}

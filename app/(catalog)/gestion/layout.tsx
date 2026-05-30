'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getAccessTokenRole } from '@/utils/helpers';
import { GestionSidebar } from '@/components/gestion/GestionSidebar';

const MANAGEMENT_ROLES = ['Admin', 'Manager', 'Seller'];

export default function GestionLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [role, setRole] = useState<string | null>(null);

  useEffect(() => {
    const r = getAccessTokenRole();
    if (!r || !MANAGEMENT_ROLES.includes(r)) {
      router.replace('/productos');
    } else {
      setRole(r);
    }
  }, [router]);

  if (!role) return null;

  return (
    <div style={{ display: 'flex', flex: 1 }}>
      <GestionSidebar role={role} />
      <div style={{ flex: 1, minWidth: 0 }}>{children}</div>
    </div>
  );
}

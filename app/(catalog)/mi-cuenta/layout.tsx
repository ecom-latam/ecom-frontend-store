'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getAccessTokenRole } from '@/utils/helpers';
import { MiCuentaSidebar } from '@/components/catalog/MiCuentaSidebar';

export default function MiCuentaLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const role = getAccessTokenRole();
    if (role !== 'Customer') {
      router.replace('/productos');
    } else {
      setReady(true);
    }
  }, [router]);

  if (!ready) return null;

  return (
    <div style={{ display: 'flex' }}>
      <MiCuentaSidebar />
      <div style={{ flex: 1, minWidth: 0 }}>{children}</div>
    </div>
  );
}

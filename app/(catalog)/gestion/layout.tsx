'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { getAccessTokenRole } from '@/utils/helpers';
import { GestionSidebar } from '@/components/gestion/GestionSidebar';
import { usePageConfig } from '@/context/PageConfigContext';

const MANAGEMENT_ROLES = ['Admin', 'Manager', 'Seller'];

// EC-560: secciones de /gestion que solo aplican a tiendas con el modulo activo.
const CATALOG_PATHS = ['/gestion/productos', '/gestion/categorias', '/gestion/opciones'];
const PURCHASES_PATHS = ['/gestion/pedidos', '/gestion/clientes', '/gestion/reportes'];

export default function GestionLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { hasCatalog, hasPurchases } = usePageConfig();
  const [role, setRole] = useState<string | null>(null);

  useEffect(() => {
    const r = getAccessTokenRole();
    if (!r || !MANAGEMENT_ROLES.includes(r)) {
      router.replace('/productos');
      return;
    }
    if (hasCatalog === false && CATALOG_PATHS.some((p) => pathname.startsWith(p))) {
      router.replace('/gestion');
      return;
    }
    if (hasPurchases === false && PURCHASES_PATHS.some((p) => pathname.startsWith(p))) {
      router.replace('/gestion');
      return;
    }
    setRole(r);
  }, [router, pathname, hasCatalog, hasPurchases]);

  if (!role) return null;

  return (
    <div style={{ display: 'flex', flex: 1 }}>
      <GestionSidebar role={role} />
      <div style={{ flex: 1, minWidth: 0 }}>{children}</div>
    </div>
  );
}

'use client';

import { usePathname } from 'next/navigation';
import { Sidebar } from 'zoui';
import { usePageConfig } from '@/context/PageConfigContext';
import type React from 'react';

const ELEVATED_ROLES = ['Admin', 'Manager'];

interface NavItem {
  label: string;
  href: string;
  elevated: boolean;
  disabled?: boolean;
  icon: React.ReactNode;
  // EC-560: si se setea, el item solo se muestra cuando el modulo
  // correspondiente esta activo para el tipo de tienda (EC-558).
  requires?: 'catalog' | 'purchases';
}

interface NavGroup {
  label: string | null;
  items: NavItem[];
}

const ICON = {
  resumen: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="3" width="7" height="7" rx="1" />
      <rect x="3" y="14" width="7" height="7" rx="1" />
      <rect x="14" y="14" width="7" height="7" rx="1" />
    </svg>
  ),
  pedidos: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2" />
      <rect x="9" y="3" width="6" height="4" rx="1" />
      <path d="M9 12h6M9 16h4" />
    </svg>
  ),
  clientes: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  ),
  productos: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
    </svg>
  ),
  categorias: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
    </svg>
  ),
  opciones: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" />
      <line x1="7" y1="7" x2="7.01" y2="7" />
    </svg>
  ),
  reportes: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="20" x2="18" y2="10" />
      <line x1="12" y1="20" x2="12" y2="4" />
      <line x1="6" y1="20" x2="6" y2="14" />
    </svg>
  ),
  configuracion: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </svg>
  ),
};

const NAV_GROUPS: NavGroup[] = [
  { label: null, items: [
    { label: 'Resumen', href: '/gestion', elevated: false, icon: ICON.resumen },
  ] },
  { label: 'Ventas', items: [
    { label: 'Pedidos',  href: '/gestion/pedidos',  elevated: false, icon: ICON.pedidos, requires: 'purchases' },
    { label: 'Clientes', href: '/gestion/clientes', elevated: false, disabled: true, icon: ICON.clientes, requires: 'purchases' },
  ] },
  { label: 'Catálogo', items: [
    { label: 'Productos',  href: '/gestion/productos',  elevated: true, icon: ICON.productos, requires: 'catalog' },
    { label: 'Categorías', href: '/gestion/categorias', elevated: true, icon: ICON.categorias, requires: 'catalog' },
    { label: 'Opciones',   href: '/gestion/opciones',   elevated: true, icon: ICON.opciones, requires: 'catalog' },
  ] },
  { label: 'Análisis', items: [
    { label: 'Reportes', href: '/gestion/reportes', elevated: true, disabled: true, icon: ICON.reportes, requires: 'purchases' },
  ] },
  { label: 'Configuración', items: [
    { label: 'Configuración', href: '/gestion/configuracion', elevated: true, icon: ICON.configuracion },
  ] },
];

interface Props {
  role: string;
}

export function GestionSidebar({ role }: Props) {
  const pathname = usePathname();
  const isElevated = ELEVATED_ROLES.includes(role);
  const { hasCatalog, hasPurchases } = usePageConfig();

  function itemVisible(item: NavItem): boolean {
    if (item.requires === 'catalog') return hasCatalog !== false;
    if (item.requires === 'purchases') return hasPurchases !== false;
    return true;
  }

  function renderItem(item: NavItem) {
    const isActive = item.href === '/gestion'
      ? pathname === '/gestion'
      : pathname === item.href || pathname.startsWith(`${item.href}/`);

    if (item.disabled) {
      return (
        <Sidebar.Item key={item.href} disabled icon={item.icon}>
          {item.label}
        </Sidebar.Item>
      );
    }

    return (
      <Sidebar.Item
        key={item.href}
        href={item.href}
        active={isActive}
        icon={item.icon}
      >
        {item.label}
      </Sidebar.Item>
    );
  }

  const visibleGroups = NAV_GROUPS
    .map((group) => ({ ...group, items: group.items.filter((i) => (!i.elevated || isElevated) && itemVisible(i)) }))
    .filter((group) => group.items.length > 0);

  return (
    <Sidebar>
      <Sidebar.Header label="Panel" />
      <Sidebar.Nav>
        {visibleGroups.map((group, idx) => (
          <Sidebar.Group key={group.label ?? `group-${idx}`} label={group.label ?? undefined}>
            {group.items.map(renderItem)}
          </Sidebar.Group>
        ))}
      </Sidebar.Nav>
    </Sidebar>
  );
}

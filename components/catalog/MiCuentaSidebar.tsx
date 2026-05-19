'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Sidebar } from 'zoui';

const OrdersIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2" />
    <rect x="9" y="3" width="6" height="4" rx="1" />
    <path d="M9 12h6M9 16h4" />
  </svg>
);

const NAV_ITEMS = [
  { label: 'Mis pedidos', href: '/mi-cuenta/pedidos', icon: <OrdersIcon /> },
];

export function MiCuentaSidebar() {
  const pathname = usePathname();

  return (
    <Sidebar>
      <Sidebar.Header label="Mi cuenta" />
      <Sidebar.Nav>
        {NAV_ITEMS.map((item) => {
          const isActive = item.href === '/mi-cuenta'
            ? pathname === '/mi-cuenta'
            : pathname === item.href || pathname.startsWith(`${item.href}/`);

          return (
            <Sidebar.Item
              key={item.href}
              as={Link}
              href={item.href}
              active={isActive}
              icon={item.icon}
            >
              {item.label}
            </Sidebar.Item>
          );
        })}
      </Sidebar.Nav>
    </Sidebar>
  );
}

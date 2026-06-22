'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';

import { useCart } from '@/context/CartContext';
import { usePageConfig } from '@/context/PageConfigContext';
import { getAccessTokenRole } from '@/utils/helpers';
import { Navbar } from 'zoui';

const MANAGEMENT_ROLES = ['Admin', 'Manager', 'Seller'];

export function CatalogNavbar() {
  const router = useRouter();
  const { itemCount, openDrawer } = useCart();
  const { hasCatalog, hasPurchases } = usePageConfig();

  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [canManage,  setCanManage]  = useState(false);
  const [isCustomer, setIsCustomer] = useState(false);
  const [isDark,     setIsDark]     = useState(false);

  useEffect(() => {
    const role = getAccessTokenRole();
    setIsLoggedIn(!!localStorage.getItem('access_token'));
    setCanManage(role !== null && MANAGEMENT_ROLES.includes(role));
    setIsCustomer(role === 'Customer');
    setIsDark(document.documentElement.getAttribute('data-theme') === 'dark');
  }, []);

  const toggleTheme = useCallback(() => {
    const next = isDark ? 'light' : 'dark';
    setIsDark(!isDark);
    document.documentElement.setAttribute('data-theme', next);
    document.cookie = `ui-theme=${next}; path=/; max-age=31536000`;
  }, [isDark]);

  // EC-559: "Inicio" solo tiene sentido como link separado en tiendas con
  // catalogo (la home es informativa por default y el logo ya apunta ahi).
  const links = [
    ...(hasCatalog !== false ? [{ label: 'Inicio', onClick: () => router.push('/') }] : []),
    ...(canManage ? [{ label: 'Gestión', onClick: () => router.push('/gestion') }] : []),
  ];

  return (
    <Navbar
      storeName="Tienda"
      links={links}
      onLogoClick={() => router.push(hasCatalog !== false ? '/productos' : '/')}
      cartCount={Math.min(itemCount, 99)}
      onCartClick={isCustomer && hasPurchases !== false ? openDrawer : undefined}
      isLoggedIn={isLoggedIn}
      isDark={isDark}
      onThemeToggle={toggleTheme}
      onLogin={() => router.push('/iniciar-sesion')}
      onLogout={async () => {
        const BFF_URL = process.env.NEXT_PUBLIC_BFF_URL ?? 'http://localhost:4000';
        await fetch(`${BFF_URL}/api/auth/logout`, { method: 'POST', credentials: 'include' }).catch(() => {});
        localStorage.removeItem('access_token');
        document.cookie = '_auth=; path=/; max-age=0';
        window.location.href = '/productos';
      }}
      onRegister={() => router.push('/registro')}
      onMyAccount={isCustomer ? () => router.push('/mi-cuenta') : undefined}
    />
  );
}

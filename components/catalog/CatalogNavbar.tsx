'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';

import { useCart } from '@/context/CartContext';
import { useStoreConfig } from '@/context/StoreConfigContext';
import { getAccessTokenRole } from '@/utils/helpers';
import { Navbar } from 'zoui';
import type { NavbarVariant } from 'zoui';

const MANAGEMENT_ROLES = ['Admin', 'Manager', 'Seller'];

export function CatalogNavbar() {
  const router = useRouter();
  const { itemCount, openDrawer } = useCart();
  const { theme } = useStoreConfig();

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

  const links = [
    { label: 'Inicio', onClick: () => router.push('/') },
    ...(canManage ? [{ label: 'Gestión', onClick: () => router.push('/gestion') }] : []),
  ];

  const variant = (theme ?? 'outlined') as NavbarVariant;

  return (
    <Navbar
      variant={variant}
      storeName="Tienda"
      links={links}
      onLogoClick={() => router.push('/productos')}
      cartCount={Math.min(itemCount, 99)}
      onCartClick={isCustomer ? openDrawer : undefined}
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

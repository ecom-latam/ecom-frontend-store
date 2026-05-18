'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

import { useCart } from '@/context/CartContext';
import { getAccessTokenRole } from '@/utils/helpers';
import { Navbar, Button } from 'zoui';

const MANAGEMENT_ROLES = ['Admin', 'Manager', 'Seller'];

const SunIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="5" />
    <line x1="12" y1="1" x2="12" y2="3" /><line x1="12" y1="21" x2="12" y2="23" />
    <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" /><line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
    <line x1="1" y1="12" x2="3" y2="12" /><line x1="21" y1="12" x2="23" y2="12" />
    <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" /><line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
  </svg>
);

const MoonIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
  </svg>
);

export function CatalogNavbar() {
  const router = useRouter();
  const { itemCount, openDrawer } = useCart();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [canManage, setCanManage] = useState(false);
  const [theme, setTheme] = useState<'light' | 'dark'>('light');

  useEffect(() => {
    const role = getAccessTokenRole();
    setIsLoggedIn(!!localStorage.getItem('access_token'));
    setCanManage(role !== null && MANAGEMENT_ROLES.includes(role));
    setTheme((document.documentElement.dataset.theme as 'light' | 'dark') ?? 'light');
  }, []);

  function toggleTheme() {
    const next = theme === 'light' ? 'dark' : 'light';
    setTheme(next);
    document.documentElement.dataset.theme = next;
    document.cookie = `ui-theme=${next}; path=/`;
  }

  async function handleLogout() {
    const BFF_URL = process.env.NEXT_PUBLIC_BFF_URL ?? 'http://localhost:4000';
    await fetch(`${BFF_URL}/api/auth/logout`, { method: 'POST', credentials: 'include' }).catch(() => {});
    localStorage.removeItem('access_token');
    document.cookie = '_auth=; path=/; max-age=0';
    setIsLoggedIn(false);
    window.location.href = '/productos';
  }

  return (
    <Navbar variant="bordered" style={{ position: 'sticky', top: 0, zIndex: 40 }}>
      <Navbar.Logo as={Link} href="/productos">Tienda</Navbar.Logo>

      <Navbar.Links>
        {isLoggedIn && (
          <Navbar.Link as={Link} href="/mis-pedidos">Mis pedidos</Navbar.Link>
        )}
        {canManage && (
          <Navbar.Link as={Link} href="/gestion">Gestión</Navbar.Link>
        )}
      </Navbar.Links>

      <Navbar.Actions>
        <Button
          variant="ghost"
          shape="square"
          size="md"
          onClick={toggleTheme}
          title={theme === 'dark' ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
        >
          {theme === 'dark' ? <SunIcon /> : <MoonIcon />}
        </Button>

        {isLoggedIn ? (
          <Button variant="ghost" shape="rounded" size="md" onClick={handleLogout}>
            Salir
          </Button>
        ) : (
          <>
            <Button variant="ghost" shape="rounded" size="md" onClick={() => router.push('/iniciar-sesion')}>
              Iniciar sesión
            </Button>
            <Button variant="outlined" shape="rounded" size="md" onClick={() => router.push('/registro')}>
              Registrate
            </Button>
          </>
        )}

        <Navbar.Cart count={Math.min(itemCount, 99)} onClick={openDrawer} />
      </Navbar.Actions>
    </Navbar>
  );
}

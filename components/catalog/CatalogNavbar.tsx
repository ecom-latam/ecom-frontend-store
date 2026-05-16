'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

import { useCart } from '@/context/CartContext';
import { getAccessTokenRole } from '@/utils/helpers';
import { Navbar, Button } from 'zoui';

const MANAGEMENT_ROLES = ['Admin', 'Manager', 'Seller'];

export function CatalogNavbar() {
  const router = useRouter();
  const { itemCount, openDrawer } = useCart();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [canManage, setCanManage] = useState(false);

  useEffect(() => {
    const role = getAccessTokenRole();
    setIsLoggedIn(!!localStorage.getItem('access_token'));
    setCanManage(role !== null && MANAGEMENT_ROLES.includes(role));
  }, []);

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
        {canManage && (
          <Navbar.Link as={Link} href="/gestion">Gestión</Navbar.Link>
        )}
      </Navbar.Links>

      <Navbar.Actions>
        {isLoggedIn ? (
          <Button variant="ghost" shape="rounded" size="sm" onClick={handleLogout}>
            Salir
          </Button>
        ) : (
          <>
            <Button variant="ghost" shape="rounded" size="sm" onClick={() => router.push('/iniciar-sesion')}>
              Iniciar sesión
            </Button>
            <Button variant="outlined" shape="rounded" size="sm" onClick={() => router.push('/registro')}>
              Registrate
            </Button>
          </>
        )}

        <Navbar.Cart count={Math.min(itemCount, 99)} onClick={openDrawer} />
      </Navbar.Actions>
    </Navbar>
  );
}

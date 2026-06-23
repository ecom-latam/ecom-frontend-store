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
  const { hasCatalog, hasPurchases, pages } = usePageConfig();

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

  const homePage = pages?.find((p) => p.slug === 'home');
  const otherPages = pages?.filter((p) => p.slug !== 'home') ?? [];

  // EC-559/646: en tiendas con catalogo, "Inicio" -> '/' siempre redirige a
  // /productos (el logo ya apunta ahi, pero se deja el link explicito como
  // siempre). En tiendas sin catalogo, '/' es justo donde se renderiza el
  // contenido real de 'home' -- ahi el link sale de esa misma pagina (su
  // titulo, o "Inicio" si no le pusieron uno) en vez de omitirse.
  // EC-588: las demas paginas del page builder van despues, en el orden en
  // que se crearon.
  const links = [
    ...(hasCatalog !== false
      ? [{ label: 'Inicio', onClick: () => router.push('/') }]
      : homePage ? [{ label: homePage.title || 'Inicio', onClick: () => router.push('/') }] : []),
    ...otherPages.map((p) => ({ label: p.title || p.slug, onClick: () => router.push(`/${p.slug}`) })),
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
      // EC-640: en "Pagina informativa" y "Pagina + catalogo" (hasPurchases=false)
      // no hay cuenta de comprador -- ocultar Ingresar/Registrarse del navbar.
      // No afecta /iniciar-sesion en si: Admin/Manager/Seller siguen entrando
      // por url directa para llegar a /gestion.
      showAuth={hasPurchases !== false}
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

'use client';

import { useState, useEffect } from 'react';
import { brandScale, BRAND_STEPS, ZouiThemeProvider, getFontOption, loadFont } from 'zoui';
import type { SurfaceVariant } from 'zoui';
import { PageConfigContext } from '@/context/PageConfigContext';
import type { PageConfig } from '@/context/PageConfigContext';

const BFF_URL = process.env.NEXT_PUBLIC_BFF_URL ?? 'http://localhost:4000';

function applyBrandColor(hue: number, sat: number, lit: number) {
  const root = document.documentElement;
  const contrast = (lit >= 62 || (hue >= 45 && hue <= 75)) ? '#000000' : '#ffffff';
  const scale = brandScale(hue, sat, lit);
  for (const step of BRAND_STEPS) {
    root.style.setProperty(`--color-brand-${step}`, scale[step]);
  }
  root.style.setProperty('--color-brand-contrast', contrast);
}

function applyFont(fontId: string) {
  const opt = getFontOption(fontId);
  loadFont(opt);
  document.documentElement.style.setProperty('--font-ui', opt.stack);
}

function applyStoreTheme(theme: string) {
  document.documentElement.setAttribute('data-store-theme', theme);
}

function getSlug(): string {
  return window.location.hostname.split('.')[0];
}

// Un solo fetch a /api/page/public -- ecom-page ya embebe la
// config comercial de ecom-store bajo `store` cuando la tienda tiene
// catalogo, asi que el front no pide mas los dos servicios por separado.
// Esto ya NO corre siempre -- app/layout.tsx hace el mismo fetch en
// el servidor (cache: 'no-store') y pinta el theme inicial sin flash. Esta
// funcion solo se usa como fallback si ese fetch SSR fallo.
async function fetchPageInfo(): Promise<Record<string, unknown> | null> {
  try {
    const slug = getSlug();
    const res = await fetch(`${BFF_URL}/api/page/public?_store=${slug}`, {
      headers: { 'X-Tenant-Slug': slug },
      cache: 'no-store',
    });
    if (!res.ok) return null;
    return await res.json().catch(() => null);
  } catch {
    return null;
  }
}

function toPageConfig(raw: Record<string, unknown>): PageConfig {
  const store = (raw.store ?? undefined) as PageConfig['store'];
  return {
    theme:       raw.theme       as string | undefined,
    hasCatalog:    raw.hasCatalog !== false,
    catalog_label: typeof raw.catalog_label === 'string' && raw.catalog_label ? raw.catalog_label : 'Productos',
    catalog_slug:  typeof raw.catalog_slug === 'string' && raw.catalog_slug ? raw.catalog_slug : 'productos',
    hasPurchases:  raw.hasPurchases !== false,
    hasMetrics:    raw.hasMetrics === true,
    store: store && {
      currency:              store.currency === 'USD' ? 'USD' : 'ARS',
      mp_public_key:         store.mp_public_key ?? null,
      product_detail_layout: store.product_detail_layout,
      cart_layout:           store.cart_layout,
      search_preset:         store.search_preset,
      promo_bar_enabled:     store.promo_bar_enabled === true,
      promo_bar_position:    (['above-navbar', 'below-navbar', 'footer'].includes(store.promo_bar_position as string) ? store.promo_bar_position : 'above-navbar') as 'above-navbar' | 'below-navbar' | 'footer',
      free_shipping_min_amount: typeof store.free_shipping_min_amount === 'number' ? store.free_shipping_min_amount : null,
      installments_count:    typeof store.installments_count === 'number' ? store.installments_count : null,
      interest_free:         store.interest_free === true,
      ratings_enabled:       store.ratings_enabled === true,
      reviews_enabled:       store.reviews_enabled === true,
    },
    // `pages` del backend incluye 'home' (siempre primera, con
    // rows) -- se expone tal cual por context, sin filtrar. El navbar
    // (CatalogNavbar) decide si home necesita su propio link aparte segun
    // hasCatalog. El context no necesita las rows de ninguna pagina -- las
    // de home se leen directo del fetch SSR (ver InformationalHome), las de
    // las demas se piden por slug puntual (getPageBySlug) al navegar.
    pages: Array.isArray(raw.pages)
      ? raw.pages
          .filter((p): p is { slug: string; title: string; isHome: boolean } => typeof p?.slug === 'string')
          .map((p) => ({ slug: p.slug, title: typeof p.title === 'string' ? p.title : '', isHome: Boolean(p.isHome) }))
      : undefined,
  };
}

export function DynamicStoreTheme({
  initialConfig,
  children,
}: {
  initialConfig: Record<string, unknown>;
  children: React.ReactNode;
}) {
  const [config, setConfig] = useState<PageConfig>(() => toPageConfig(initialConfig));

  // Si initialConfig vino de la SSR (caso normal), el theme y la
  // config ya estan aplicados -- ver el <style> + data-store-theme que
  // arma app/layout.tsx. Solo se reintenta del lado del cliente si la SSR
  // no trajo nada (fallo el fetch en el servidor).
  useEffect(() => {
    if (Object.keys(initialConfig).length > 0) return;

    fetchPageInfo().then((fresh) => {
      if (!fresh) return;
      if (typeof fresh.brand_hue === 'number') {
        const sat = typeof fresh.brand_saturation === 'number' ? fresh.brand_saturation : 72;
        const lit = typeof fresh.brand_lightness === 'number' ? fresh.brand_lightness : 50;
        applyBrandColor(fresh.brand_hue, sat, lit);
      }
      if (typeof fresh.font_id === 'string') applyFont(fresh.font_id);
      if (typeof fresh.theme === 'string') applyStoreTheme(fresh.theme);
      setConfig(toPageConfig(fresh));
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // El fondo de la tienda publica es siempre el del theme elegido --
  // ya no es una seleccion independiente (background eliminado).
  const backgroundVariant = (config.theme ?? 'outlined') as SurfaceVariant;

  return (
    <PageConfigContext.Provider value={config}>
      <ZouiThemeProvider variant={config.theme}>
        <div className="zoui-surface" data-variant={backgroundVariant}>
          {children}
        </div>
      </ZouiThemeProvider>
    </PageConfigContext.Provider>
  );
}

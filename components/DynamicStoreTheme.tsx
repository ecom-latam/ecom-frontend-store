'use client';

import { useState, useEffect } from 'react';
import { brandScale, BRAND_STEPS, ZouiThemeProvider } from 'zoui';
import type { SurfaceVariant } from 'zoui';
import { PageConfigContext } from '@/context/PageConfigContext';
import type { PageConfig } from '@/context/PageConfigContext';

const SESSION_KEY = 'store-theme-config';
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

function applyFont(fontFamily: string) {
  document.documentElement.style.setProperty('--font-ui', `'${fontFamily}', sans-serif`);
}

function applyStoreTheme(theme: string) {
  document.documentElement.setAttribute('data-store-theme', theme);
}

function getSlug(): string {
  return window.location.hostname.split('.')[0];
}

function readSession(): Record<string, unknown> | null {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function writeSession(config: Record<string, unknown>): void {
  try {
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(config));
  } catch {}
}

// EC-632/633: un solo fetch a /api/page/public -- ecom-page ya embebe la
// config comercial de ecom-store bajo `store` cuando la tienda tiene
// catalogo, asi que el front no pide mas los dos servicios por separado.
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
    hasCatalog:   raw.hasCatalog !== false,
    hasPurchases: raw.hasPurchases !== false,
    hasMetrics:   raw.hasMetrics === true,
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

  function apply(raw: Record<string, unknown>) {
    if (typeof raw.brand_hue === 'number') {
      const sat = typeof raw.brand_saturation === 'number' ? raw.brand_saturation : 72;
      const lit = typeof raw.brand_lightness === 'number' ? raw.brand_lightness : 50;
      applyBrandColor(raw.brand_hue, sat, lit);
    }
    if (typeof raw.font_family === 'string') applyFont(raw.font_family);
    if (typeof raw.theme === 'string') applyStoreTheme(raw.theme);
    setConfig(toPageConfig(raw));
  }

  useEffect(() => {
    const cached = readSession();
    if (cached) apply(cached);

    fetchPageInfo().then((fresh) => {
      if (fresh) {
        writeSession(fresh);
        apply(fresh);
      }
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // EC-628: el fondo de la tienda publica es siempre el del theme elegido --
  // ya no es una seleccion independiente (background eliminado, ver EC-627/630).
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

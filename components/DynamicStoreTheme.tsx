'use client';

import { useState, useEffect } from 'react';
import { brandScale, BRAND_STEPS, ZouiThemeProvider } from 'zoui';
import type { SurfaceVariant } from 'zoui';
import { StoreConfigContext } from '@/context/StoreConfigContext';
import type { StoreConfig } from '@/context/StoreConfigContext';

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

// EC-553: branding (theme, background, brand_hue, font_family, etc.) vive en
// ecom-page; el resto (currency, mp_public_key, toggles de catalogo) sigue en
// ecom-store. Se piden en paralelo y se mergean, igual que getStoreInfo() en
// lib/api/storeClient.ts (acá no se puede reusar esa funcion porque usa
// next/headers, server-only).
async function fetchConfig(): Promise<Record<string, unknown> | null> {
  try {
    const slug = getSlug();
    const headers = { 'X-Tenant-Slug': slug };
    const [pageRes, storeRes] = await Promise.all([
      fetch(`${BFF_URL}/api/page/public?_store=${slug}`, { headers, cache: 'no-store' }),
      fetch(`${BFF_URL}/api/store/public?_store=${slug}`, { headers, cache: 'no-store' }),
    ]);
    if (!pageRes.ok && !storeRes.ok) return null;
    const page = pageRes.ok ? await pageRes.json().catch(() => ({})) : {};
    const store = storeRes.ok ? await storeRes.json().catch(() => ({})) : {};
    return { ...page, ...store };
  } catch {
    return null;
  }
}

function toStoreConfig(raw: Record<string, unknown>): StoreConfig {
  return {
    theme:      raw.theme      as string | undefined,
    background: raw.background as string | undefined,
    product_detail_layout: raw.product_detail_layout as string | undefined,
    cart_layout:           raw.cart_layout           as string | undefined,
    search_preset:         raw.search_preset         as string | undefined,
    currency:              raw.currency === 'USD' ? 'USD' : 'ARS',
    mp_public_key:         (raw.mp_public_key as string | null | undefined) ?? null,
    promo_bar_enabled:     raw.promo_bar_enabled === true,
    promo_bar_position:    (['above-navbar', 'below-navbar', 'footer'].includes(raw.promo_bar_position as string) ? raw.promo_bar_position : 'above-navbar') as 'above-navbar' | 'below-navbar' | 'footer',
    free_shipping_min_amount: typeof raw.free_shipping_min_amount === 'number' ? raw.free_shipping_min_amount : null,
    installments_count:    typeof raw.installments_count === 'number' ? raw.installments_count : null,
    interest_free:         raw.interest_free === true,
    ratings_enabled:       raw.ratings_enabled === true,
    reviews_enabled:       raw.reviews_enabled === true,
  };
}

export function DynamicStoreTheme({
  initialConfig,
  children,
}: {
  initialConfig: Record<string, unknown>;
  children: React.ReactNode;
}) {
  const [config, setConfig] = useState<StoreConfig>(() => toStoreConfig(initialConfig));

  function apply(raw: Record<string, unknown>) {
    if (typeof raw.brand_hue === 'number') {
      const sat = typeof raw.brand_saturation === 'number' ? raw.brand_saturation : 72;
      const lit = typeof raw.brand_lightness === 'number' ? raw.brand_lightness : 50;
      applyBrandColor(raw.brand_hue, sat, lit);
    }
    if (typeof raw.font_family === 'string') applyFont(raw.font_family);
    if (typeof raw.theme === 'string') applyStoreTheme(raw.theme);
    setConfig(toStoreConfig(raw));
  }

  useEffect(() => {
    const cached = readSession();
    if (cached) apply(cached);

    fetchConfig().then((fresh) => {
      if (fresh) {
        writeSession(fresh);
        apply(fresh);
      }
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const backgroundVariant = (config.background ?? 'default') as SurfaceVariant;

  return (
    <StoreConfigContext.Provider value={config}>
      <ZouiThemeProvider variant={config.theme}>
        <div className="zoui-surface" data-variant={backgroundVariant}>
          {children}
        </div>
      </ZouiThemeProvider>
    </StoreConfigContext.Provider>
  );
}

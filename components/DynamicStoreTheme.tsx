'use client';

import { useState, useEffect } from 'react';
import { brandScale, BRAND_STEPS } from 'zoui';
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

function applyStoreTheme(buttonVariant: string) {
  document.documentElement.setAttribute('data-store-theme', buttonVariant);
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

async function fetchConfig(): Promise<Record<string, unknown> | null> {
  try {
    const slug = getSlug();
    const res = await fetch(`${BFF_URL}/api/store/public?_store=${slug}`, {
      headers: { 'X-Tenant-Slug': slug },
      cache: 'no-store',
    });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

function toStoreConfig(raw: Record<string, unknown>): StoreConfig {
  const presets = (raw.components_presets ?? {}) as Record<string, unknown>;
  return {
    components_presets: {
      button:       presets.button       as string | undefined,
      input:        presets.input        as string | undefined,
      select:       presets.select       as string | undefined,
      textarea:     presets.textarea     as string | undefined,
      navbar:       presets.navbar       as string | undefined,
      product_card: presets.product_card as string | undefined,
      view_toggle:  presets.view_toggle  as string | undefined,
    },
    product_detail_layout: raw.product_detail_layout as string | undefined,
    cart_layout:           raw.cart_layout           as string | undefined,
    search_preset:         raw.search_preset         as string | undefined,
    currency:              raw.currency === 'USD' ? 'USD' : 'ARS',
    mp_public_key:         (raw.mp_public_key as string | null | undefined) ?? null,
    name:                  raw.name                 as string | undefined,
    logo_url:              raw.logo_url              as string | undefined,
    logo_dark_url:         raw.logo_dark_url         as string | undefined,
    logo_large_url:        raw.logo_large_url        as string | undefined,
    logo_large_dark_url:   raw.logo_large_dark_url   as string | undefined,
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
    const presets = raw.components_presets as Record<string, unknown> | undefined;
    if (typeof presets?.button === 'string') applyStoreTheme(presets.button);
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

  return (
    <StoreConfigContext.Provider value={config}>
      {children}
    </StoreConfigContext.Provider>
  );
}

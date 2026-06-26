'use client';

import { createContext, useContext } from 'react';

export type Currency = 'ARS' | 'USD';

// EC-633: la config comercial (currency, mp_public_key, promo_bar, etc.) solo
// existe cuando la tienda tiene catalogo -- ecom-page la embebe bajo `store`
// (ver EC-632). El resto de los campos son siempre de la pagina en si.
export interface PageStoreConfig {
  currency?: Currency;
  mp_public_key?: string | null;
  product_detail_layout?: string;
  cart_layout?: string;
  search_preset?: string;
  promo_bar_enabled?: boolean;
  promo_bar_position?: 'above-navbar' | 'below-navbar' | 'footer';
  free_shipping_min_amount?: number | null;
  installments_count?: number | null;
  interest_free?: boolean;
  ratings_enabled?: boolean;
  reviews_enabled?: boolean;
}

export interface PageConfigPage {
  slug:   string;
  title:  string;
  isHome: boolean;
}

export interface PageConfig {
  theme?: string;
  hasCatalog?: boolean;
  hasPurchases?: boolean;
  // EC-568: solo tipado por consistencia -- EC-14 (analiticas) no existe
  // todavia, nada lee este campo en el storefront.
  hasMetrics?: boolean;
  store?: PageStoreConfig;
  // EC-588: paginas visibles del page builder (sin 'home') -- el navbar
  // arma sus links desde esto.
  pages?: PageConfigPage[];
}

export const PageConfigContext = createContext<PageConfig>({});

export function usePageConfig(): PageConfig {
  return useContext(PageConfigContext);
}

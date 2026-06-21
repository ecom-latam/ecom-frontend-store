'use client';

import { createContext, useContext } from 'react';

export type Currency = 'ARS' | 'USD';

export interface StoreConfig {
  theme?: string;
  background?: string;
  product_detail_layout?: string;
  cart_layout?: string;
  search_preset?: string;
  currency?: Currency;
  mp_public_key?: string | null;
  promo_bar_enabled?: boolean;
  promo_bar_position?: 'above-navbar' | 'below-navbar' | 'footer';
  free_shipping_min_amount?: number | null;
  installments_count?: number | null;
  interest_free?: boolean;
  ratings_enabled?: boolean;
  reviews_enabled?: boolean;
  hasCatalog?: boolean;
  hasPurchases?: boolean;
  // EC-568: solo tipado por consistencia -- EC-14 (analiticas) no existe
  // todavia, nada lee este campo en el storefront.
  hasMetrics?: boolean;
}

export const StoreConfigContext = createContext<StoreConfig>({});

export function useStoreConfig(): StoreConfig {
  return useContext(StoreConfigContext);
}

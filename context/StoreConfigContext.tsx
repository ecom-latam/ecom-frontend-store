'use client';

import { createContext, useContext } from 'react';

export interface ComponentsPresets {
  button?: string;
  input?: string;
  select?: string;
  textarea?: string;
  navbar?: string;
  product_card?: string;
  view_toggle?: string;
}

export type Currency = 'ARS' | 'USD';

export interface StoreConfig {
  name?: string;
  logo_url?: string;
  logo_dark_url?: string;
  logo_large_url?: string;
  logo_large_dark_url?: string;
  components_presets?: ComponentsPresets;
  product_detail_layout?: string;
  cart_layout?: string;
  search_preset?: string;
  currency?: Currency;
  mp_public_key?: string | null;
}

export const StoreConfigContext = createContext<StoreConfig>({});

export function useStoreConfig(): StoreConfig {
  return useContext(StoreConfigContext);
}

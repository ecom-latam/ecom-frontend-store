'use client';

import { usePageConfig } from '@/context/PageConfigContext';
import { formatPrice } from '@/lib/format';

/** Muestra un precio con la moneda de la tienda y 2 decimales. Útil en árboles server-rendered. */
export function Price({ value }: { value: number }) {
  const { store } = usePageConfig();
  return <>{formatPrice(value, store?.currency)}</>;
}

import type { Currency } from '@/context/PageConfigContext';

const SYMBOL: Record<Currency, string> = {
  ARS: '$',
  USD: 'U$D ',
};

/**
 * Formatea un monto para mostrar: símbolo de moneda + miles (.) + SIEMPRE 2 decimales.
 * Ej: formatPrice(15000) → "$15.000,00" · formatPrice(15000.5, 'USD') → "U$D 15.000,50".
 */
export function formatPrice(value: number, currency: Currency = 'ARS'): string {
  const formatted = new Intl.NumberFormat('es-AR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
  return `${SYMBOL[currency]}${formatted}`;
}

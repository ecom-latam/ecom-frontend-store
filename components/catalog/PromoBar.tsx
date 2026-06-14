'use client';

import { useState, useEffect } from 'react';
import { useStoreConfig } from '@/context/StoreConfigContext';

function buildMessages(
  freeShipping: number | null | undefined,
  installments: number | null | undefined,
  interestFree: boolean,
): string[] {
  const msgs: string[] = [];

  if (freeShipping !== null && freeShipping !== undefined) {
    if (freeShipping === 0) {
      msgs.push('Envío gratis en todos tus pedidos');
    } else {
      const formatted = new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(freeShipping);
      msgs.push(`Envío gratis en pedidos mayores a ${formatted}`);
    }
  }

  if (installments && installments > 1) {
    msgs.push(interestFree ? `Hasta ${installments} cuotas sin interés` : `Hasta ${installments} cuotas`);
  }

  return msgs;
}

export function PromoBar() {
  const { promo_bar_enabled, free_shipping_min_amount, installments_count, interest_free } = useStoreConfig();
  const [activeIndex, setActiveIndex] = useState(0);

  const messages = buildMessages(free_shipping_min_amount, installments_count, interest_free ?? false);

  useEffect(() => {
    setActiveIndex(0);
    if (messages.length <= 1) return;
    const timer = setInterval(() => {
      setActiveIndex(i => (i + 1) % messages.length);
    }, 4000);
    return () => clearInterval(timer);
  }, [messages.length]);

  if (!promo_bar_enabled || messages.length === 0) return null;

  return (
    <div
      style={{
        background: 'var(--color-brand-500)',
        color: 'var(--color-brand-contrast)',
        fontSize: '12px',
        fontFamily: 'var(--font-ui)',
        fontWeight: 500,
        textAlign: 'center',
        padding: '6px 16px',
        lineHeight: 1.4,
        letterSpacing: '0.01em',
      }}
      aria-live="polite"
    >
      {messages[activeIndex]}
    </div>
  );
}

'use client';

import { useEffect, Suspense } from 'react';
import styles from './MpResult.module.scss';
import { useRouter, useSearchParams } from 'next/navigation';
import { Text } from 'zoui';
import { StoreButton } from '@/components/ui/StoreButton';
import { useCart } from '@/context/CartContext';

type Variant = 'success' | 'pending' | 'failure';

const COPY: Record<Variant, { icon: string; color: string; title: string; body: string }> = {
  success: {
    icon: '✓',
    color: 'var(--color-success-600, #16a34a)',
    title: '¡Pago confirmado!',
    body: 'Tu pago se realizó con éxito. Estamos preparando tu pedido.',
  },
  pending: {
    icon: '⏳',
    color: 'var(--color-warning-600, #d97706)',
    title: 'Tu pago está pendiente',
    body: 'Mercado Pago todavía está procesando el pago. Te avisaremos cuando se acredite.',
  },
  failure: {
    icon: '✕',
    color: 'var(--color-error-600, #dc2626)',
    title: 'El pago no se completó',
    body: 'No se pudo concretar el pago. Tu carrito sigue guardado para que vuelvas a intentar.',
  },
};

function MpResultInner({ variant }: { variant: Variant }) {
  const router = useRouter();
  const params = useSearchParams();
  const { clearCart } = useCart();
  const orderId = params.get('order');
  const copy = COPY[variant];

  // En éxito o pendiente la orden ya se creó: se vacía el carrito.
  // En fallo se conserva para que el comprador reintente.
  useEffect(() => {
    if (variant === 'success' || variant === 'pending') {
      clearCart().catch((err) => console.error('[MpResult]', err));
    }
  }, [variant, clearCart]);

  return (
    <main className={styles.root} style={{ background: 'var(--color-bg-surface)' }}>
      <div className={styles.container}>
        <div
          style={{
            width: 64, height: 64, borderRadius: '50%', margin: '0 auto 20px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 32, color: copy.color, border: `2px solid ${copy.color}`,
          }}
        >
          {copy.icon}
        </div>
        <Text variant="heading-2" as="h1" style={{ marginBottom: '12px' }} data-testid="mp-result-title">{copy.title}</Text>
        <Text variant="body" color="muted" as="p" style={{ marginBottom: '28px' }}>{copy.body}</Text>

        <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
          {orderId && (variant === 'success' || variant === 'pending') && (
            <StoreButton size="md" onClick={() => router.push(`/pedidos/${orderId}`)}>
              Ver pedido
            </StoreButton>
          )}
          {variant === 'failure' && (
            <StoreButton size="md" onClick={() => router.push('/carrito')}>
              Volver al carrito
            </StoreButton>
          )}
          <StoreButton emphasis="outlined" size="md" onClick={() => router.push('/productos')}>
            Seguir comprando
          </StoreButton>
        </div>
      </div>
    </main>
  );
}

export function MpResult({ variant }: { variant: Variant }) {
  return (
    <Suspense fallback={null}>
      <MpResultInner variant={variant} />
    </Suspense>
  );
}

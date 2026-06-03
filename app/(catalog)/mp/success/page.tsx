'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Text } from 'zoui';
import { StoreButton } from '@/components/ui/StoreButton';
import { payment as paymentApi } from '@/utils/api/payment';
import { useCart } from '@/context/CartContext';
import { getAccessTokenUserId } from '@/utils/helpers';

const MP_CONTEXT_KEY = 'mp_checkout_context';

function MpSuccessContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { clearCart } = useCart();
  const paymentId = searchParams.get('payment_id') ?? '';

  const [phase, setPhase] = useState<'processing' | 'done' | 'error'>('processing');
  const [orderId, setOrderId] = useState('');

  useEffect(() => {
    if (!paymentId) {
      setPhase('error');
      return;
    }

    async function process() {
      try {
        const rawCtx = sessionStorage.getItem(MP_CONTEXT_KEY);
        const ctx = rawCtx ? JSON.parse(rawCtx) : {};
        sessionStorage.removeItem(MP_CONTEXT_KEY);

        const customerId = getAccessTokenUserId() ?? '';

        const { data } = await paymentApi.processPayment({
          payment_id: paymentId,
          customerId,
          shippingAddress: ctx.shippingAddress ?? { fullName: '', phone: '' },
          shippingMethod:  ctx.shippingMethod  ?? 'pickup',
          notes:           ctx.notes           ?? '',
        });

        await clearCart();
        setOrderId(data.order_id);
        setPhase('done');
      } catch {
        setPhase('error');
      }
    }

    process();
  }, [paymentId, clearCart]);

  if (phase === 'processing') {
    return (
      <main style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--color-bg-subtle)' }}>
        <div style={{ textAlign: 'center' }}>
          <Text variant="body-sm" color="secondary">Confirmando tu pago...</Text>
        </div>
      </main>
    );
  }

  if (phase === 'error') {
    return (
      <main style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--color-bg-subtle)', padding: '16px' }}>
        <div style={{ textAlign: 'center', maxWidth: '400px' }}>
          <Text variant="heading-2" as="h1" style={{ marginBottom: '8px' }}>Hubo un problema</Text>
          <Text variant="body-sm" color="secondary" as="p" style={{ marginBottom: '24px' }}>
            Tu pago fue recibido por MercadoPago pero no pudimos confirmar tu pedido. Contactá al vendedor con tu comprobante de pago.
          </Text>
          <StoreButton size="md" onClick={() => router.push('/mis-pedidos')}>
            Ver mis pedidos
          </StoreButton>
        </div>
      </main>
    );
  }

  return (
    <main style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--color-bg-subtle)', padding: '16px' }}>
      <div style={{ textAlign: 'center', maxWidth: '400px' }}>
        <div style={{ fontSize: '3rem', marginBottom: '16px' }}>✓</div>
        <Text variant="heading-2" as="h1" style={{ marginBottom: '8px' }}>¡Pedido confirmado!</Text>
        <Text variant="body-sm" color="secondary" as="p" style={{ marginBottom: '24px' }}>
          Tu pago fue procesado y tu pedido está confirmado.
        </Text>
        <StoreButton size="md" onClick={() => router.push(orderId ? `/pedidos/${orderId}` : '/mis-pedidos')}>
          Ver mi pedido
        </StoreButton>
      </div>
    </main>
  );
}

export default function MpSuccessPage() {
  return <Suspense><MpSuccessContent /></Suspense>;
}

import Image from 'next/image';
import { Text } from 'zoui';
import type { PaymentMethod } from '@/utils/api/orders';
import type { Currency } from '@/context/PageConfigContext';
import { StoreButton } from '@/components/ui/StoreButton';
import { formatPrice } from '@/lib/format';

interface CartItem {
  _id:      string;
  name:     string;
  image:    string | null;
  price:    number;
  quantity: number;
}

interface OrderSummaryProps {
  items:         CartItem[];
  subtotal:      number;
  currency:      Currency | undefined;
  error:         string | null;
  submitting:    boolean;
  paymentMethod: PaymentMethod;
  onSubmit:      () => void;
}

export function OrderSummary({ items, subtotal, currency, error, submitting, paymentMethod, onSubmit }: OrderSummaryProps) {
  return (
    <div style={{ position: 'sticky', top: '24px' }}>
      <section style={{ background: 'var(--color-bg-default)', border: '1px solid var(--color-border-default)', borderRadius: 'var(--radius-lg)', padding: '24px' }}>
        <Text variant="heading-3" as="h2" style={{ marginBottom: '20px' }}>Resumen del pedido</Text>

        <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {items.map((item) => (
            <li key={item._id} style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
              <div style={{ width: 48, height: 48, background: 'var(--color-bg-subtle)', borderRadius: 'var(--radius-sm)', overflow: 'hidden', flexShrink: 0 }}>
                {item.image ? (
                  <Image src={item.image} alt={item.name} width={48} height={48} style={{ objectFit: 'cover', width: '100%', height: '100%' }} />
                ) : (
                  <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-fg-disabled)' }}>□</div>
                )}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <Text variant="body-sm" weight="medium" as="p" truncate>{item.name}</Text>
                <Text variant="caption" color="muted" as="p">x{item.quantity}</Text>
              </div>
              <Text variant="body-sm" weight="semibold" as="span" style={{ flexShrink: 0 }}>
                {formatPrice(item.price * item.quantity, currency)}
              </Text>
            </li>
          ))}
        </ul>

        <div style={{ borderTop: '1px solid var(--color-border-default)', marginTop: '16px', paddingTop: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
            <Text variant="body-sm" color="muted" as="span">Subtotal</Text>
            <Text variant="body-sm" as="span">{formatPrice(subtotal, currency)}</Text>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <Text variant="body-sm" color="muted" as="span">Envío</Text>
            <Text variant="body-sm" as="span">A coordinar</Text>
          </div>
        </div>

        <div style={{ borderTop: '1px solid var(--color-border-default)', marginTop: '16px', paddingTop: '16px', display: 'flex', justifyContent: 'space-between' }}>
          <Text variant="body" weight="semibold" as="span">Total</Text>
          <Text variant="body" weight="semibold" as="span">{formatPrice(subtotal, currency)}</Text>
        </div>

        {error && (
          <div style={{ marginTop: '16px', padding: '12px', background: 'var(--color-error-50)', border: '1px solid var(--color-error-200)', borderRadius: 'var(--radius-md)' }}>
            <Text variant="body-sm" style={{ color: 'var(--color-error-700)' }} as="p">{error}</Text>
          </div>
        )}

        <StoreButton
          size="md"
          disabled={submitting}
          style={{ marginTop: '20px', width: '100%', justifyContent: 'center' }}
          onClick={onSubmit}
          data-testid="checkout-submit-btn"
        >
          {submitting ? 'Procesando...' : paymentMethod === 'mp' ? 'Pagar con Mercado Pago' : 'Confirmar pedido'}
        </StoreButton>
      </section>
    </div>
  );
}

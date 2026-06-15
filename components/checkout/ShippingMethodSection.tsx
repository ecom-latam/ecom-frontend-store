import { Text, OptionCard } from 'zoui';
import type { OptionCardVariant } from 'zoui';
import type { ShippingMethod } from '@/utils/api/orders';

interface ShippingMethodSectionProps {
  value:   ShippingMethod;
  variant: OptionCardVariant;
  onChange: (method: ShippingMethod) => void;
}

export function ShippingMethodSection({ value, variant, onChange }: ShippingMethodSectionProps) {
  return (
    <section style={{ background: 'var(--color-bg-default)', border: '1px solid var(--color-border-default)', borderRadius: 'var(--radius-lg)', padding: '24px' }}>
      <Text variant="heading-3" as="h2" style={{ marginBottom: '20px' }}>Método de entrega</Text>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {(['delivery', 'pickup'] as const).map((method) => (
          <OptionCard
            key={method}
            variant={variant}
            name="shippingMethod"
            value={method}
            label={method === 'delivery' ? 'Envío a domicilio' : 'Retiro en tienda'}
            description={method === 'delivery' ? 'Recibís el pedido en tu dirección.' : 'Retirás el pedido en el local cuando esté listo.'}
            selected={value === method}
            onChange={() => onChange(method)}
            data-testid={`checkout-shipping-${method}`}
          />
        ))}
      </div>
    </section>
  );
}

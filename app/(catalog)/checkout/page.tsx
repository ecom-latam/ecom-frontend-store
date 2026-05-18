'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

import { useCart } from '@/context/CartContext';
import { getAccessTokenRole } from '@/utils/helpers';
import { orders } from '@/utils/api/orders';
import type { CreateOrderPayload, PaymentMethod } from '@/utils/api/orders';
import { Button, Input, Select, Textarea, Text } from 'zoui';

const PROVINCES = [
  'Buenos Aires',
  'Catamarca',
  'Chaco',
  'Chubut',
  'Ciudad Autónoma de Buenos Aires',
  'Córdoba',
  'Corrientes',
  'Entre Ríos',
  'Formosa',
  'Jujuy',
  'La Pampa',
  'La Rioja',
  'Mendoza',
  'Misiones',
  'Neuquén',
  'Río Negro',
  'Salta',
  'San Juan',
  'San Luis',
  'Santa Cruz',
  'Santa Fe',
  'Santiago del Estero',
  'Tierra del Fuego',
  'Tucumán',
];

export default function CheckoutPage() {
  const router = useRouter();
  const { items, itemCount } = useCart();

  const [ready, setReady] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState({
    fullName: '',
    phone: '',
    address: '',
    city: '',
    province: '',
    zip: '',
    paymentMethod: '' as PaymentMethod | '',
    notes: '',
  });

  useEffect(() => {
    const role = getAccessTokenRole();
    if (!role) {
      router.replace('/iniciar-sesion?redirect=/checkout');
      return;
    }
    setReady(true);
  }, [router]);

  if (!ready) return null;

  if (itemCount === 0) {
    return (
      <main className="min-h-screen" style={{ background: 'var(--color-bg-surface)' }}>
        <div className="max-w-2xl mx-auto px-4 py-16 text-center">
          <Text variant="body" color="muted" style={{ marginBottom: '16px' }}>
            Tu carrito está vacío.
          </Text>
          <Button variant="filled" shape="rounded" size="md" onClick={() => router.push('/productos')}>
            Ver productos
          </Button>
        </div>
      </main>
    );
  }

  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

  function set(field: keyof typeof form, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
    setError(null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!form.paymentMethod) {
      setError('Seleccioná un método de pago.');
      return;
    }

    const payload: CreateOrderPayload = {
      shippingAddress: {
        fullName: form.fullName,
        phone: form.phone,
        address: form.address,
        city: form.city,
        province: form.province,
        zip: form.zip,
      },
      paymentMethod: form.paymentMethod as PaymentMethod,
      notes: form.notes,
    };

    setSubmitting(true);
    setError(null);

    try {
      const { data: order } = await orders.create(payload);
      router.push(`/pedidos/${order._id}`);
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { error?: string; name?: string } } };
      const code = axiosErr?.response?.data?.error;
      if (code === 'CART_EMPTY') {
        setError('Tu carrito está vacío.');
      } else if (code === 'INSUFFICIENT_STOCK') {
        const name = axiosErr?.response?.data?.name ?? 'un producto';
        setError(`Stock insuficiente para "${name}". Actualizá tu carrito.`);
      } else {
        setError('Ocurrió un error al crear el pedido. Intentá de nuevo.');
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="min-h-screen" style={{ background: 'var(--color-bg-surface)' }}>
      <div className="max-w-5xl mx-auto px-4 py-8">
        <Text variant="heading-2" as="h1" style={{ marginBottom: '32px' }}>
          Checkout
        </Text>

        <form onSubmit={handleSubmit}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: '32px', alignItems: 'start' }}>

            {/* Left column — shipping + payment */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>

              <section style={{ background: 'var(--color-bg-default)', border: '1px solid var(--color-border-default)', borderRadius: 'var(--radius-lg)', padding: '24px' }}>
                <Text variant="heading-3" as="h2" style={{ marginBottom: '20px' }}>
                  Datos de envío
                </Text>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div style={{ gridColumn: '1 / -1' }}>
                    <Input
                      label="Nombre completo"
                      value={form.fullName}
                      onChange={(e) => set('fullName', e.target.value)}
                      required
                      size="md"
                      variant="outlined"
                    />
                  </div>
                  <div style={{ gridColumn: '1 / -1' }}>
                    <Input
                      label="Teléfono"
                      value={form.phone}
                      onChange={(e) => set('phone', e.target.value)}
                      required
                      size="md"
                      variant="outlined"
                    />
                  </div>
                  <div style={{ gridColumn: '1 / -1' }}>
                    <Input
                      label="Dirección"
                      value={form.address}
                      onChange={(e) => set('address', e.target.value)}
                      required
                      size="md"
                      variant="outlined"
                    />
                  </div>
                  <div>
                    <Input
                      label="Ciudad"
                      value={form.city}
                      onChange={(e) => set('city', e.target.value)}
                      required
                      size="md"
                      variant="outlined"
                    />
                  </div>
                  <div>
                    <Input
                      label="Código postal"
                      value={form.zip}
                      onChange={(e) => set('zip', e.target.value)}
                      size="md"
                      variant="outlined"
                    />
                  </div>
                  <div style={{ gridColumn: '1 / -1' }}>
                    <Select
                      label="Provincia"
                      value={form.province}
                      onChange={(e) => set('province', e.target.value)}
                      required
                      size="md"
                      variant="outlined"
                    >
                      <option value="">Seleccioná una provincia</option>
                      {PROVINCES.map((p) => (
                        <option key={p} value={p}>{p}</option>
                      ))}
                    </Select>
                  </div>
                </div>
              </section>

              <section style={{ background: 'var(--color-bg-default)', border: '1px solid var(--color-border-default)', borderRadius: 'var(--radius-lg)', padding: '24px' }}>
                <Text variant="heading-3" as="h2" style={{ marginBottom: '20px' }}>
                  Método de pago
                </Text>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {(['transfer', 'cash'] as const).map((method) => (
                    <label
                      key={method}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        padding: '16px',
                        border: `2px solid ${form.paymentMethod === method ? 'var(--color-brand-500)' : 'var(--color-border-default)'}`,
                        borderRadius: 'var(--radius-md)',
                        cursor: 'pointer',
                        background: form.paymentMethod === method ? 'var(--color-brand-50)' : 'var(--color-bg-default)',
                      }}
                    >
                      <input
                        type="radio"
                        name="paymentMethod"
                        value={method}
                        checked={form.paymentMethod === method}
                        onChange={() => set('paymentMethod', method)}
                        style={{ accentColor: 'var(--color-brand-500)' }}
                      />
                      <div>
                        <Text variant="body-sm" weight="semibold" as="span">
                          {method === 'transfer' ? 'Transferencia bancaria' : 'Efectivo en mano'}
                        </Text>
                        <Text variant="caption" color="muted" as="p">
                          {method === 'transfer'
                            ? 'Recibirás los datos para transferir al confirmar el pedido.'
                            : 'Pagás en efectivo al momento de recibir el pedido.'}
                        </Text>
                      </div>
                    </label>
                  ))}
                </div>
              </section>

              <section style={{ background: 'var(--color-bg-default)', border: '1px solid var(--color-border-default)', borderRadius: 'var(--radius-lg)', padding: '24px' }}>
                <Text variant="heading-3" as="h2" style={{ marginBottom: '16px' }}>
                  Notas del pedido (opcional)
                </Text>
                <Textarea
                  label="Notas"
                  value={form.notes}
                  onChange={(e) => set('notes', e.target.value)}
                  placeholder="Instrucciones especiales, referencias de entrega..."
                  variant="outlined"
                />
              </section>
            </div>

            {/* Right column — order summary */}
            <div style={{ position: 'sticky', top: '24px' }}>
              <section style={{ background: 'var(--color-bg-default)', border: '1px solid var(--color-border-default)', borderRadius: 'var(--radius-lg)', padding: '24px' }}>
                <Text variant="heading-3" as="h2" style={{ marginBottom: '20px' }}>
                  Resumen del pedido
                </Text>

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
                        ${(item.price * item.quantity).toLocaleString('es-AR')}
                      </Text>
                    </li>
                  ))}
                </ul>

                <div style={{ borderTop: '1px solid var(--color-border-default)', marginTop: '16px', paddingTop: '16px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                    <Text variant="body-sm" color="muted" as="span">Subtotal</Text>
                    <Text variant="body-sm" as="span">${subtotal.toLocaleString('es-AR')}</Text>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Text variant="body-sm" color="muted" as="span">Envío</Text>
                    <Text variant="body-sm" as="span">A coordinar</Text>
                  </div>
                </div>

                <div style={{ borderTop: '1px solid var(--color-border-default)', marginTop: '16px', paddingTop: '16px', display: 'flex', justifyContent: 'space-between' }}>
                  <Text variant="body" weight="semibold" as="span">Total</Text>
                  <Text variant="body" weight="semibold" as="span">${subtotal.toLocaleString('es-AR')}</Text>
                </div>

                {error && (
                  <div style={{ marginTop: '16px', padding: '12px', background: 'var(--color-error-50)', border: '1px solid var(--color-error-200)', borderRadius: 'var(--radius-md)' }}>
                    <Text variant="body-sm" style={{ color: 'var(--color-error-700)' }} as="p">{error}</Text>
                  </div>
                )}

                <Button
                  type="submit"
                  variant="filled"
                  shape="pill"
                  size="md"
                  disabled={submitting}
                  style={{ marginTop: '20px', width: '100%', justifyContent: 'center' }}
                >
                  {submitting ? 'Procesando...' : 'Confirmar pedido'}
                </Button>
              </section>
            </div>

          </div>
        </form>
      </div>
    </main>
  );
}

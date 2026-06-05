'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

import { useCart } from '@/context/CartContext';
import { getAccessTokenRole } from '@/utils/helpers';
import { orders } from '@/utils/api/orders';
import type { PaymentMethod, ShippingMethod } from '@/utils/api/orders';
import { addresses as addressesApi } from '@/utils/api/addresses';
import type { Address } from '@/utils/api/addresses';
import { payment as paymentApi } from '@/utils/api/payment';
import type { MpCardData } from '@/components/MercadoPagoForm';
import { Text } from 'zoui';
import { StoreButton } from '@/components/ui/StoreButton';
import { StoreInput } from '@/components/ui/StoreInput';
import { StoreSelect } from '@/components/ui/StoreSelect';
import { StoreTextarea } from '@/components/ui/StoreTextarea';
import { useStoreConfig } from '@/context/StoreConfigContext';
import { formatPrice } from '@/lib/format';

// MP SDK is client-side only — must not SSR
const MercadoPagoForm = dynamic(() => import('@/components/MercadoPagoForm'), { ssr: false });

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
  const { items, itemCount, clearCart } = useCart();
  const { currency, mp_public_key } = useStoreConfig();
  const mpAvailable = !!mp_public_key && currency === 'ARS';

  const [ready, setReady] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [savedAddresses, setSavedAddresses] = useState<Address[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string | 'new'>('new');

  const [form, setForm] = useState({
    fullName: '',
    phone: '',
    address: '',
    city: '',
    province: '',
    zip: '',
    shippingMethod: 'delivery' as ShippingMethod,
    paymentMethod: 'transfer' as PaymentMethod,
    notes: '',
  });

  useEffect(() => {
    const role = getAccessTokenRole();
    if (!role) {
      router.replace('/iniciar-sesion?redirect=/checkout');
      return;
    }
    if (role !== 'Customer') {
      router.replace('/productos');
      return;
    }
    setReady(true);
    addressesApi.list().then(({ data }) => {
      setSavedAddresses(data);
      const def = data.find((a) => a.isDefault) ?? data[0];
      if (def) {
        setSelectedAddressId(def._id);
        setForm((prev) => ({
          ...prev,
          fullName: def.fullName,
          phone: def.phone,
          address: def.address,
          city: def.city,
          province: def.province,
          zip: def.zip ?? '',
        }));
      }
    }).catch(() => {});
  }, [router]);

  function applyAddress(id: string) {
    setSelectedAddressId(id);
    if (id === 'new') {
      setForm((prev) => ({ ...prev, fullName: '', phone: '', address: '', city: '', province: '', zip: '' }));
      return;
    }
    const addr = savedAddresses.find((a) => a._id === id);
    if (addr) {
      setForm((prev) => ({
        ...prev,
        fullName: addr.fullName,
        phone: addr.phone,
        address: addr.address,
        city: addr.city,
        province: addr.province,
        zip: addr.zip ?? '',
      }));
    }
  }

  if (!ready) return null;

  if (itemCount === 0) {
    return (
      <main className="min-h-screen" style={{ background: 'var(--color-bg-surface)' }}>
        <div className="max-w-2xl mx-auto px-4 py-16 text-center">
          <Text variant="body" color="muted" style={{ marginBottom: '16px' }}>
            Tu carrito está vacío.
          </Text>
          <StoreButton size="md" onClick={() => router.push('/productos')}>
            Ver productos
          </StoreButton>
        </div>
      </main>
    );
  }

  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

  function set(field: keyof typeof form, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
    setError(null);
  }

  const shippingAddress = {
    fullName: form.fullName,
    phone: form.phone,
    address: form.address,
    city: form.city,
    province: form.province,
    zip: form.zip,
  };

  async function payWithTransfer() {
    const { data: order } = await orders.create({
      shippingAddress,
      paymentMethod: 'transfer',
      shippingMethod: form.shippingMethod,
      notes: form.notes,
    });
    await clearCart();
    router.push(`/pedidos/${order._id}`);
  }

  async function handleMpCardSubmit(cardData: MpCardData) {
    setSubmitting(true);
    setError(null);
    try {
      const { data } = await paymentApi.processMp({
        ...cardData,
        amount: subtotal,
        shippingAddress,
        shippingMethod: form.shippingMethod,
      });
      await clearCart();
      if (data.status === 'processed') {
        router.push(`/pedidos/${data.orderId}`);
      } else if (data.status === 'pending') {
        router.push(`/pedidos/${data.orderId}?mp=pending`);
      } else {
        setError('El pago fue rechazado. Revisá los datos de tu tarjeta e intentá nuevamente.');
      }
    } catch {
      setError('No se pudo procesar el pago. Intentá nuevamente.');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleSubmit() {
    if (form.shippingMethod === 'delivery' && (!form.address || !form.city || !form.province)) {
      setError('Completá los datos de envío.');
      return;
    }
    if (form.paymentMethod === 'mp') return; // MP uses inline form, not this button

    setSubmitting(true);
    setError(null);

    try {
      await payWithTransfer();
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

        <div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: '32px', alignItems: 'start' }}>

            {/* Left column — shipping + payment */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>

              <section style={{ background: 'var(--color-bg-default)', border: '1px solid var(--color-border-default)', borderRadius: 'var(--radius-lg)', padding: '24px' }}>
                <Text variant="heading-3" as="h2" style={{ marginBottom: '20px' }}>
                  Método de entrega
                </Text>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {(['delivery', 'pickup'] as const).map((method) => (
                    <label
                      key={method}
                      data-testid={`checkout-shipping-${method}`}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        padding: '16px',
                        border: `2px solid ${form.shippingMethod === method ? 'var(--color-brand-500)' : 'var(--color-border-default)'}`,
                        borderRadius: 'var(--radius-md)',
                        cursor: 'pointer',
                        background: form.shippingMethod === method ? 'var(--color-brand-50)' : 'var(--color-bg-default)',
                      }}
                    >
                      <input
                        type="radio"
                        name="shippingMethod"
                        value={method}
                        checked={form.shippingMethod === method}
                        onChange={() => set('shippingMethod', method)}
                        style={{ accentColor: 'var(--color-brand-500)' }}
                      />
                      <div>
                        <Text variant="body-sm" weight="semibold" as="span">
                          {method === 'delivery' ? 'Envío a domicilio' : 'Retiro en tienda'}
                        </Text>
                        <Text variant="caption" color="muted" as="p">
                          {method === 'delivery'
                            ? 'Recibís el pedido en tu dirección.'
                            : 'Retirás el pedido en el local cuando esté listo.'}
                        </Text>
                      </div>
                    </label>
                  ))}
                </div>
              </section>

              <section style={{ background: 'var(--color-bg-default)', border: '1px solid var(--color-border-default)', borderRadius: 'var(--radius-lg)', padding: '24px' }}>
                <Text variant="heading-3" as="h2" style={{ marginBottom: '20px' }}>
                  {form.shippingMethod === 'delivery' ? 'Datos de envío' : 'Datos de contacto'}
                </Text>

                {savedAddresses.length > 0 && form.shippingMethod === 'delivery' && (
                  <div style={{ marginBottom: '20px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {savedAddresses.map((addr) => (
                      <label
                        key={addr._id}
                        style={{
                          display: 'flex',
                          alignItems: 'flex-start',
                          gap: '12px',
                          padding: '14px',
                          border: `2px solid ${selectedAddressId === addr._id ? 'var(--color-brand-500)' : 'var(--color-border-default)'}`,
                          borderRadius: 'var(--radius-md)',
                          cursor: 'pointer',
                          background: selectedAddressId === addr._id ? 'var(--color-brand-50)' : 'var(--color-bg-default)',
                        }}
                      >
                        <input
                          type="radio"
                          name="savedAddress"
                          value={addr._id}
                          checked={selectedAddressId === addr._id}
                          onChange={() => applyAddress(addr._id)}
                          style={{ accentColor: 'var(--color-brand-500)', marginTop: '2px', flexShrink: 0 }}
                        />
                        <div>
                          <Text variant="body-sm" weight="semibold" as="span">{addr.label}</Text>
                          {addr.isDefault && (
                            <Text variant="caption" color="muted" as="span" style={{ marginLeft: '6px' }}>· Predeterminada</Text>
                          )}
                          <Text variant="caption" color="muted" as="p">
                            {addr.address}{addr.floor ? `, ${addr.floor}` : ''} — {addr.city}, {addr.province}
                          </Text>
                        </div>
                      </label>
                    ))}
                    <label
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        padding: '14px',
                        border: `2px solid ${selectedAddressId === 'new' ? 'var(--color-brand-500)' : 'var(--color-border-default)'}`,
                        borderRadius: 'var(--radius-md)',
                        cursor: 'pointer',
                        background: selectedAddressId === 'new' ? 'var(--color-brand-50)' : 'var(--color-bg-default)',
                      }}
                    >
                      <input
                        type="radio"
                        name="savedAddress"
                        value="new"
                        checked={selectedAddressId === 'new'}
                        onChange={() => applyAddress('new')}
                        style={{ accentColor: 'var(--color-brand-500)', flexShrink: 0 }}
                      />
                      <Text variant="body-sm" weight="semibold" as="span">Ingresar nueva dirección</Text>
                    </label>
                  </div>
                )}

                {(selectedAddressId === 'new' || form.shippingMethod !== 'delivery') && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div style={{ gridColumn: '1 / -1' }}>
                    <StoreInput
                      label="Nombre completo"
                      value={form.fullName}
                      onChange={(e) => set('fullName', e.target.value)}
                      required
                      size="md"                      data-testid="checkout-fullname"
                    />
                  </div>
                  <div style={{ gridColumn: '1 / -1' }}>
                    <StoreInput
                      label="Teléfono"
                      value={form.phone}
                      onChange={(e) => set('phone', e.target.value)}
                      required
                      size="md"                      data-testid="checkout-phone"
                    />
                  </div>
                  {form.shippingMethod === 'delivery' && (
                    <>
                      <div style={{ gridColumn: '1 / -1' }}>
                        <StoreInput
                          label="Dirección"
                          value={form.address}
                          onChange={(e) => set('address', e.target.value)}
                          required
                          size="md"                          data-testid="checkout-address"
                        />
                      </div>
                      <div>
                        <StoreInput
                          label="Ciudad"
                          value={form.city}
                          onChange={(e) => set('city', e.target.value)}
                          required
                          size="md"                          data-testid="checkout-city"
                        />
                      </div>
                      <div>
                        <StoreInput
                          label="Código postal"
                          value={form.zip}
                          onChange={(e) => set('zip', e.target.value)}
                          size="md"                          data-testid="checkout-zip"
                        />
                      </div>
                      <div style={{ gridColumn: '1 / -1' }}>
                        <StoreSelect
                          label="Provincia"
                          value={form.province || undefined}
                          onValueChange={(val) => set('province', val)}
                          size="md"
                          placeholder="Seleccioná una provincia"
                          options={PROVINCES.map((p) => ({ value: p, label: p }))}
                          data-testid="checkout-province"
                        />
                      </div>
                    </>
                  )}
                </div>
                )}
              </section>

              <section style={{ background: 'var(--color-bg-default)', border: '1px solid var(--color-border-default)', borderRadius: 'var(--radius-lg)', padding: '24px' }}>
                <Text variant="heading-3" as="h2" style={{ marginBottom: '20px' }}>
                  Método de pago
                </Text>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <label
                    data-testid="checkout-payment-transfer"
                    style={{
                      display: 'flex', alignItems: 'center', gap: '12px', padding: '16px', cursor: 'pointer',
                      border: `2px solid ${form.paymentMethod === 'transfer' ? 'var(--color-brand-500)' : 'var(--color-border-default)'}`,
                      borderRadius: 'var(--radius-md)',
                      background: form.paymentMethod === 'transfer' ? 'var(--color-brand-50)' : 'var(--color-bg-default)',
                    }}
                  >
                    <input type="radio" name="paymentMethod" value="transfer" checked={form.paymentMethod === 'transfer'} onChange={() => set('paymentMethod', 'transfer')} style={{ accentColor: 'var(--color-brand-500)' }} />
                    <div>
                      <Text variant="body-sm" weight="semibold" as="span">Transferencia bancaria</Text>
                      <Text variant="caption" color="muted" as="p">Recibirás los datos para transferir al confirmar el pedido.</Text>
                    </div>
                  </label>

                  {mpAvailable && (
                    <div>
                      <label
                        data-testid="checkout-payment-mp"
                        style={{
                          display: 'flex', alignItems: 'center', gap: '12px', padding: '16px', cursor: 'pointer',
                          border: `2px solid ${form.paymentMethod === 'mp' ? 'var(--color-brand-500)' : 'var(--color-border-default)'}`,
                          borderRadius: form.paymentMethod === 'mp' ? 'var(--radius-md) var(--radius-md) 0 0' : 'var(--radius-md)',
                          background: form.paymentMethod === 'mp' ? 'var(--color-brand-50)' : 'var(--color-bg-default)',
                        }}
                      >
                        <input type="radio" name="paymentMethod" value="mp" checked={form.paymentMethod === 'mp'} onChange={() => set('paymentMethod', 'mp')} style={{ accentColor: 'var(--color-brand-500)' }} />
                        <div style={{ flex: 1 }}>
                          <Text variant="body-sm" weight="semibold" as="span">Mercado Pago</Text>
                          <Text variant="caption" color="muted" as="p">Tarjeta de crédito o débito. Los datos de la tarjeta se ingresan directamente en el sitio.</Text>
                        </div>
                        <svg width="32" height="20" viewBox="0 0 32 20" fill="none" style={{ flexShrink: 0 }}>
                          <circle cx="10" cy="10" r="10" fill="#009EE3" />
                          <circle cx="22" cy="10" r="10" fill="#009EE3" fillOpacity="0.5" />
                        </svg>
                      </label>
                      {form.paymentMethod === 'mp' && mp_public_key && (
                        <div style={{ border: `2px solid var(--color-brand-500)`, borderTop: 'none', borderRadius: '0 0 var(--radius-md) var(--radius-md)', padding: '20px', background: 'var(--color-bg-default)' }}>
                          <MercadoPagoForm
                            publicKey={mp_public_key}
                            amount={subtotal}
                            submitting={submitting}
                            onSubmit={handleMpCardSubmit}
                          />
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </section>

              <section style={{ background: 'var(--color-bg-default)', border: '1px solid var(--color-border-default)', borderRadius: 'var(--radius-lg)', padding: '24px' }}>
                <Text variant="heading-3" as="h2" style={{ marginBottom: '16px' }}>
                  Notas del pedido (opcional)
                </Text>
                <StoreTextarea
                  label="Notas"
                  value={form.notes}
                  onChange={(e) => set('notes', e.target.value)}
                  placeholder="Instrucciones especiales, referencias de entrega..."                />
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

                {form.paymentMethod !== 'mp' && (
                  <StoreButton
                    size="md"
                    disabled={submitting}
                    style={{ marginTop: '20px', width: '100%', justifyContent: 'center' }}
                    onClick={handleSubmit}
                    data-testid="checkout-submit-btn"
                  >
                    {submitting ? 'Procesando...' : 'Confirmar pedido'}
                  </StoreButton>
                )}
              </section>
            </div>

          </div>
        </div>
      </div>
    </main>
  );
}

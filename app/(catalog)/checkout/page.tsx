'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

import { useCart } from '@/context/CartContext';
import { getAccessTokenRole } from '@/utils/helpers';
import { orders } from '@/utils/api/orders';
import type { PaymentMethod, ShippingMethod } from '@/utils/api/orders';
import { addresses as addressesApi } from '@/utils/api/addresses';
import type { Address } from '@/utils/api/addresses';
import { payment as paymentApi } from '@/utils/api/payment';
import { Text, OptionCard } from 'zoui';
import type { OptionCardVariant } from 'zoui';
import { StoreButton } from '@/components/ui/StoreButton';
import { StoreInput } from '@/components/ui/StoreInput';
import { StorePhoneInput } from '@/components/ui/StorePhoneInput';
import { StoreSelect } from '@/components/ui/StoreSelect';
import { StoreTextarea } from '@/components/ui/StoreTextarea';
import { useStoreConfig } from '@/context/StoreConfigContext';
import { formatPrice } from '@/lib/format';

const ALNUM = /[^a-zA-Z0-9]/g;

function filterName(raw: string):         string {
  return raw
    .replace(/[^a-zA-ZáéíóúüñÁÉÍÓÚÜÑ ]/g, '')
    .replace(/^ +/, '')
    .replace(/ {2,}/g, ' ')
    .slice(0, 50);
}
function filterStreet(raw: string):        string { return raw.replace(/[^a-zA-ZáéíóúüñÁÉÍÓÚÜÑ0-9\s.,\-]/g, '').slice(0, 50); }
function filterStreetNumber(raw: string):  string { return raw.replace(ALNUM, '').slice(0, 8); }
function filterCity(raw: string):          string { return raw.replace(/[^a-zA-ZáéíóúüñÁÉÍÓÚÜÑ\s.\-]/g, '').slice(0, 40); }
function filterFloor(raw: string):         string { return raw.replace(/\D/g, '').slice(0, 2); }
function filterApartment(raw: string):     string { return raw.replace(ALNUM, '').slice(0, 5); }
function filterZip(raw: string):           string { return raw.replace(/\D/g, '').slice(0, 4); }

function splitAddress(addr: { fullName: string; phone: string; address: string; floor?: string; city: string; province: string; zip?: string }) {
  // Try to split "Av. Corrientes 1234" → street: "Av. Corrientes", streetNumber: "1234"
  const lastSpace = addr.address.lastIndexOf(' ');
  const tail = addr.address.slice(lastSpace + 1);
  const hasNumber = lastSpace > 0 && /^\d+[a-zA-Z]?$/.test(tail);
  return {
    fullName: addr.fullName,
    phone: addr.phone,
    street: hasNumber ? addr.address.slice(0, lastSpace) : addr.address,
    streetNumber: hasNumber ? tail : '',
    floor: addr.floor ?? '',
    apartment: '',
    city: addr.city,
    province: addr.province,
    zip: addr.zip ?? '',
  };
}

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
  const { currency, mp_public_key, theme } = useStoreConfig();
  const mpAvailable = !!mp_public_key && currency === 'ARS';
  const optionCardVariant = (theme ?? 'outlined') as OptionCardVariant;

  const [ready, setReady] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [savedAddresses, setSavedAddresses] = useState<Address[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string | 'new'>('new');

  const [form, setForm] = useState({
    fullName: '',
    phone: '',
    street: '',
    streetNumber: '',
    floor: '',
    apartment: '',
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
        setForm((prev) => ({ ...prev, ...splitAddress(def) }));
      }
    }).catch(() => {});
  }, [router]);

  function applyAddress(id: string) {
    setSelectedAddressId(id);
    if (id === 'new') {
      setForm((prev) => ({ ...prev, fullName: '', phone: '', street: '', streetNumber: '', floor: '', apartment: '', city: '', province: '', zip: '' }));
      return;
    }
    const addr = savedAddresses.find((a) => a._id === id);
    if (addr) setForm((prev) => ({ ...prev, ...splitAddress(addr) }));
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

  const fullStreet = [form.street.trim(), form.streetNumber.trim()].filter(Boolean).join(' ') +
    (form.floor.trim() ? `, Piso ${form.floor.trim()}` : '') +
    (form.apartment.trim() ? ` Dpto ${form.apartment.trim()}` : '');

  const shippingAddress = {
    fullName: form.fullName,
    phone: form.phone,
    address: fullStreet,
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

  // Checkout Pro: crea la preferencia y redirige al comprador a Mercado Pago.
  // El carrito NO se vacía acá: la orden queda pendiente y el pago lo confirma el
  // webhook. Si el comprador vuelve sin pagar, su carrito sigue intacto.
  async function payWithMercadoPago() {
    const { data } = await paymentApi.createMpPreference({
      shippingAddress,
      shippingMethod: form.shippingMethod,
      notes: form.notes,
      storeOrigin: window.location.origin,
    });
    window.location.href = data.initPoint;
  }

  async function handleSubmit() {
    if (form.fullName.trim().length < 3) {
      setError('El nombre completo es requerido (mínimo 3 caracteres).');
      return;
    }
    const phoneDigits = form.phone.replace(/\D/g, '');
    if (phoneDigits.length < 10) {
      setError('El teléfono debe incluir código de área y número completo (mínimo 10 dígitos).');
      return;
    }
    if (phoneDigits.length > 11) {
      setError('El teléfono no puede tener más de 11 dígitos.');
      return;
    }
    if (form.shippingMethod === 'delivery') {
      if (form.street.trim().length < 3) { setError('Ingresá el nombre de la calle.'); return; }
      if (!form.streetNumber.trim()) { setError('El número de calle es requerido.'); return; }
      if (form.city.trim().length < 2) { setError('Ingresá la ciudad.'); return; }
      if (!form.province) { setError('Seleccioná una provincia.'); return; }
      if (form.zip && !/^\d{4}$/.test(form.zip)) {
        setError('El código postal debe tener 4 dígitos.'); return;
      }
    }

    setSubmitting(true);
    setError(null);

    try {
      if (form.paymentMethod === 'mp') {
        await payWithMercadoPago();
      } else {
        await payWithTransfer();
      }
    } catch {
      setError('No se pudo iniciar el pago. Intentá nuevamente.');
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
                    <OptionCard
                      key={method}
                      variant={optionCardVariant}
                      name="shippingMethod"
                      value={method}
                      label={method === 'delivery' ? 'Envío a domicilio' : 'Retiro en tienda'}
                      description={method === 'delivery' ? 'Recibís el pedido en tu dirección.' : 'Retirás el pedido en el local cuando esté listo.'}
                      selected={form.shippingMethod === method}
                      onChange={() => set('shippingMethod', method)}
                      data-testid={`checkout-shipping-${method}`}
                    />
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
                      <OptionCard
                        key={addr._id}
                        variant={optionCardVariant}
                        name="savedAddress"
                        value={addr._id}
                        label={addr.label + (addr.isDefault ? ' · Predeterminada' : '')}
                        description={`${addr.address}${addr.floor ? `, ${addr.floor}` : ''} — ${addr.city}, ${addr.province}`}
                        selected={selectedAddressId === addr._id}
                        onChange={() => applyAddress(addr._id)}
                      />
                    ))}
                    <OptionCard
                      variant={optionCardVariant}
                      name="savedAddress"
                      value="new"
                      label="Ingresar nueva dirección"
                      selected={selectedAddressId === 'new'}
                      onChange={() => applyAddress('new')}
                    />
                  </div>
                )}

                {(selectedAddressId === 'new' || form.shippingMethod !== 'delivery') && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div style={{ gridColumn: '1 / -1' }}>
                    <StoreInput
                      label="Nombre completo"
                      value={form.fullName}
                      onChange={(e) => set('fullName', filterName(e.target.value))}
                      required
                      size="md"
                      maxLength={50}
                      data-testid="checkout-fullname"
                    />
                  </div>
                  <div style={{ gridColumn: '1 / -1' }}>
                    <StorePhoneInput
                      label="Teléfono"
                      value={form.phone}
                      onChange={(e) => set('phone', e.target.value)}
                      required
                      size="md"
                      hint="Incluí el código de área"
                      data-testid="checkout-phone"
                    />
                  </div>
                  {form.shippingMethod === 'delivery' && (
                    <>
                      <div style={{ gridColumn: '1 / -1' }}>
                        <StoreInput
                          label="Calle"
                          value={form.street}
                          onChange={(e) => set('street', filterStreet(e.target.value))}
                          required
                          size="md"
                          placeholder="Av. Corrientes"
                          maxLength={50}
                          data-testid="checkout-street"
                        />
                      </div>
                      <div>
                        <StoreInput
                          label="Número"
                          value={form.streetNumber}
                          onChange={(e) => set('streetNumber', filterStreetNumber(e.target.value))}
                          required
                          size="md"
                          inputMode="numeric"
                          placeholder="1234"
                          maxLength={8}
                          data-testid="checkout-street-number"
                        />
                      </div>
                      <div>
                        <StoreInput
                          label="Código postal"
                          value={form.zip}
                          onChange={(e) => set('zip', filterZip(e.target.value))}
                          size="md"
                          inputMode="numeric"
                          placeholder="1043"
                          maxLength={4}
                          data-testid="checkout-zip"
                        />
                      </div>
                      <div>
                        <StoreInput
                          label="Piso (opcional)"
                          value={form.floor}
                          onChange={(e) => set('floor', filterFloor(e.target.value))}
                          size="md"
                          inputMode="numeric"
                          placeholder="3"
                          maxLength={2}
                          data-testid="checkout-floor"
                        />
                      </div>
                      <div>
                        <StoreInput
                          label="Dpto (opcional)"
                          value={form.apartment}
                          onChange={(e) => set('apartment', filterApartment(e.target.value))}
                          size="md"
                          placeholder="A"
                          maxLength={5}
                          data-testid="checkout-apartment"
                        />
                      </div>
                      <div style={{ gridColumn: '1 / -1' }}>
                        <StoreInput
                          label="Ciudad"
                          value={form.city}
                          onChange={(e) => set('city', filterCity(e.target.value))}
                          required
                          size="md"
                          placeholder="Buenos Aires"
                          maxLength={40}
                          data-testid="checkout-city"
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
                  <OptionCard
                    variant={optionCardVariant}
                    name="paymentMethod"
                    value="transfer"
                    label="Transferencia bancaria"
                    description="Recibirás los datos para transferir al confirmar el pedido."
                    selected={form.paymentMethod === 'transfer'}
                    onChange={() => set('paymentMethod', 'transfer')}
                    data-testid="checkout-payment-transfer"
                  />
                  {mpAvailable && (
                    <OptionCard
                      variant={optionCardVariant}
                      name="paymentMethod"
                      value="mp"
                      label="Mercado Pago"
                      description="Vas a completar el pago en Mercado Pago (tarjeta, dinero en cuenta y más). Después volvés a la tienda."
                      selected={form.paymentMethod === 'mp'}
                      onChange={() => set('paymentMethod', 'mp')}
                      data-testid="checkout-payment-mp"
                      trailing={
                        <svg width="32" height="20" viewBox="0 0 32 20" fill="none">
                          <circle cx="10" cy="10" r="10" fill="#009EE3" />
                          <circle cx="22" cy="10" r="10" fill="#009EE3" fillOpacity="0.5" />
                        </svg>
                      }
                    />
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
                  onChange={(e) => set('notes', e.target.value.slice(0, 500))}
                  placeholder="Instrucciones especiales, referencias de entrega..."
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
                  onClick={handleSubmit}
                  data-testid="checkout-submit-btn"
                >
                  {submitting
                    ? 'Procesando...'
                    : form.paymentMethod === 'mp'
                      ? 'Pagar con Mercado Pago'
                      : 'Confirmar pedido'}
                </StoreButton>
              </section>
            </div>

          </div>
        </div>
      </div>
    </main>
  );
}

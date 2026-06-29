import { Text, OptionCard } from 'zoui';
import type { Address } from '@/utils/api/addresses';
import type { CheckoutForm } from '@/hooks/useCheckoutForm';
import { StoreInput }       from '@/components/ui/StoreInput';
import { StorePhoneInput }  from '@/components/ui/StorePhoneInput';
import { StoreSelect }      from '@/components/ui/StoreSelect';
import { PROVINCES }        from '@/lib/constants';
import { filterName, filterStreet, filterStreetNumber, filterCity, filterFloor, filterApartment, filterZip } from '@/lib/checkout';

interface ShippingDataSectionProps {
  form:               CheckoutForm;
  set:                (field: keyof CheckoutForm, value: string) => void;
  shippingMethod:     'delivery' | 'pickup';
  savedAddresses:     Address[];
  selectedAddressId:  string | 'new';
  onApplyAddress:     (id: string) => void;
}

export function ShippingDataSection({ form, set, shippingMethod, savedAddresses, selectedAddressId, onApplyAddress }: ShippingDataSectionProps) {
  return (
    <section style={{ background: 'var(--color-bg-default)', border: '1px solid var(--color-border-default)', borderRadius: 'var(--radius-lg)', padding: '24px' }}>
      <Text variant="heading-3" style={{ marginBottom: '20px' }}>
        {shippingMethod === 'delivery' ? 'Datos de envío' : 'Datos de contacto'}
      </Text>

      {savedAddresses.length > 0 && shippingMethod === 'delivery' && (
        <div style={{ marginBottom: '20px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {savedAddresses.map((addr) => (
            <OptionCard
              key={addr._id}
              name="savedAddress"
              value={addr._id}
              label={addr.label + (addr.isDefault ? ' · Predeterminada' : '')}
              description={`${addr.address}${addr.floor ? `, ${addr.floor}` : ''} — ${addr.city}, ${addr.province}`}
              selected={selectedAddressId === addr._id}
              onChange={() => onApplyAddress(addr._id)}
            />
          ))}
          <OptionCard
            name="savedAddress"
            value="new"
            label="Ingresar nueva dirección"
            selected={selectedAddressId === 'new'}
            onChange={() => onApplyAddress('new')}
          />
        </div>
      )}

      {(selectedAddressId === 'new' || shippingMethod !== 'delivery') && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          <div style={{ gridColumn: '1 / -1' }}>
            <StoreInput label="Nombre completo" value={form.fullName} onChange={(e) => set('fullName', filterName(e.target.value))} required size="md" maxLength={50} data-testid="checkout-fullname" />
          </div>
          <div style={{ gridColumn: '1 / -1' }}>
            <StorePhoneInput label="Teléfono" value={form.phone} onChange={(e) => set('phone', e.target.value)} required size="md" hint="Incluí el código de área" data-testid="checkout-phone" />
          </div>
          {shippingMethod === 'delivery' && (
            <>
              <div style={{ gridColumn: '1 / -1' }}>
                <StoreInput label="Calle" value={form.street} onChange={(e) => set('street', filterStreet(e.target.value))} required size="md" placeholder="Av. Corrientes" maxLength={50} data-testid="checkout-street" />
              </div>
              <div>
                <StoreInput label="Número" value={form.streetNumber} onChange={(e) => set('streetNumber', filterStreetNumber(e.target.value))} required size="md" inputMode="numeric" placeholder="1234" maxLength={8} data-testid="checkout-street-number" />
              </div>
              <div>
                <StoreInput label="Código postal" value={form.zip} onChange={(e) => set('zip', filterZip(e.target.value))} size="md" inputMode="numeric" placeholder="1043" maxLength={4} data-testid="checkout-zip" />
              </div>
              <div>
                <StoreInput label="Piso (opcional)" value={form.floor} onChange={(e) => set('floor', filterFloor(e.target.value))} size="md" inputMode="numeric" placeholder="3" maxLength={2} data-testid="checkout-floor" />
              </div>
              <div>
                <StoreInput label="Dpto (opcional)" value={form.apartment} onChange={(e) => set('apartment', filterApartment(e.target.value))} size="md" placeholder="A" maxLength={5} data-testid="checkout-apartment" />
              </div>
              <div style={{ gridColumn: '1 / -1' }}>
                <StoreInput label="Ciudad" value={form.city} onChange={(e) => set('city', filterCity(e.target.value))} required size="md" placeholder="Buenos Aires" maxLength={40} data-testid="checkout-city" />
              </div>
              <div style={{ gridColumn: '1 / -1' }}>
                <StoreSelect label="Provincia" value={form.province || undefined} onValueChange={(val) => set('province', val)} size="md" placeholder="Seleccioná una provincia" options={PROVINCES.map((p) => ({ value: p, label: p }))} data-testid="checkout-province" />
              </div>
            </>
          )}
        </div>
      )}
    </section>
  );
}

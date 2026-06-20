'use client';

import { useEffect, useState } from 'react';
import { Text, Modal, Icon } from 'zoui';
import { StoreButton }       from '@/components/ui/StoreButton';
import { StoreInput }        from '@/components/ui/StoreInput';
import { StoreSelect }       from '@/components/ui/StoreSelect';
import { AddressCard }            from '@/components/direcciones/AddressCard';
import { AddressSlotsIndicator }  from '@/components/direcciones/AddressSlotsIndicator';
import { PROVINCES, ADDRESS_MAX } from '@/lib/constants';
import { addresses } from '@/utils/api/addresses';
import type { Address, AddressPayload } from '@/utils/api/addresses';

const MAX = ADDRESS_MAX;

const Req = () => (
  <span style={{ color: 'var(--color-error-500)', marginLeft: '2px' }} aria-hidden="true">*</span>
);

const LocationIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 10c0 6-8 12-8 12S4 16 4 10a8 8 0 1 1 16 0Z" />
    <circle cx="12" cy="10" r="3" />
  </svg>
);

const EMPTY_FORM: AddressPayload = {
  label: '', fullName: '', phone: '', address: '', floor: '',
  city: '', province: '', zip: '',
};

export default function DireccionesPage() {
  const [list, setList]               = useState<Address[]>([]);
  const [loading, setLoading]         = useState(true);
  const [modalOpen, setModalOpen]     = useState(false);
  const [editing, setEditing]         = useState<Address | null>(null);
  const [form, setForm]               = useState<AddressPayload>(EMPTY_FORM);
  const [saving, setSaving]           = useState(false);
  const [error, setError]             = useState<string | null>(null);
  const [deleting, setDeleting]       = useState<string | null>(null);
  const [settingDefault, setSettingDefault] = useState<string | null>(null);
  const [touched, setTouched]         = useState<Partial<Record<keyof AddressPayload, boolean>>>({});

  useEffect(() => {
    addresses.list()
      .then((r) => setList(r.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  function openCreate() {
    setEditing(null);
    setForm(EMPTY_FORM);
    setError(null);
    setTouched({});
    setModalOpen(true);
  }

  function openEdit(addr: Address) {
    setEditing(addr);
    setForm({
      label: addr.label, fullName: addr.fullName, phone: addr.phone,
      address: addr.address, floor: addr.floor, city: addr.city,
      province: addr.province, zip: addr.zip,
    });
    setError(null);
    setTouched({});
    setModalOpen(true);
  }

  function set(field: keyof AddressPayload, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
    setError(null);
  }

  function touch(field: keyof AddressPayload) {
    setTouched((prev) => ({ ...prev, [field]: true }));
  }

  function validate(f: AddressPayload): Partial<Record<keyof AddressPayload, string>> {
    const e: Partial<Record<keyof AddressPayload, string>> = {};
    if (!f.label.trim()) e.label = 'Requerido.';
    if (!f.fullName.trim()) e.fullName = 'Requerido.';
    else if (/\d/.test(f.fullName)) e.fullName = 'No puede contener números.';
    if (!f.phone.trim()) e.phone = 'Requerido.';
    else if (f.phone.replace(/\D/g, '').length < 7) e.phone = 'Mínimo 7 dígitos.';
    else if (f.phone.replace(/\D/g, '').length > 15) e.phone = 'Máximo 15 dígitos.';
    if (!f.address.trim()) e.address = 'Requerido.';
    if (!f.city.trim()) e.city = 'Requerido.';
    else if (/\d/.test(f.city)) e.city = 'No puede contener números.';
    if (!f.province) e.province = 'Seleccioná una provincia.';
    if (f.zip && !/^\d{4,8}$/.test(f.zip)) e.zip = 'Solo números (4 a 8 dígitos).';
    return e;
  }

  async function handleSave() {
    setSaving(true);
    setError(null);
    try {
      if (editing) {
        const { data } = await addresses.update(editing._id, form);
        setList((prev) => prev.map((a) => (a._id === data._id ? data : a)));
      } else {
        const { data } = await addresses.create(form);
        setList((prev) => [...prev, data]);
      }
      setModalOpen(false);
    } catch (err: unknown) {
      const axErr = err as { response?: { data?: { error?: string } } };
      const code  = axErr?.response?.data?.error;
      if (code === 'ADDRESS_LIMIT_REACHED') setError('Llegaste al límite de 5 direcciones.');
      else if (code?.startsWith('MISSING_')) setError('Completá todos los campos requeridos.');
      else setError('Ocurrió un error. Intentá de nuevo.');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    setDeleting(id);
    try {
      await addresses.remove(id);
      setList((prev) => prev.filter((a) => a._id !== id));
    } finally {
      setDeleting(null);
    }
  }

  async function handleSetDefault(id: string) {
    setSettingDefault(id);
    try {
      const { data } = await addresses.setDefault(id);
      setList((prev) => prev.map((a) => ({ ...a, isDefault: a._id === data._id })));
    } finally {
      setSettingDefault(null);
    }
  }

  const count       = list.length;
  const atLimit     = count >= MAX;
  const formErrors  = validate(form);
  const isFormValid = Object.keys(formErrors).length === 0;

  return (
    <main style={{ padding: '32px 24px', maxWidth: 680 }}>

      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '28px' }}>
        <div>
          <Text variant="heading-2" as="h1">Mis direcciones</Text>
          <Text variant="body-sm" color="muted" as="p" style={{ marginTop: '4px' }}>
            Guardá hasta 5 direcciones de envío
          </Text>
        </div>
        <StoreButton
          size="md"
          onClick={openCreate}
          disabled={atLimit}
          title={atLimit ? 'Llegaste al límite de 5 direcciones' : undefined}
          style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}
        >
          <Icon name="plus" size="sm" />
          Agregar
        </StoreButton>
      </div>

      <AddressSlotsIndicator count={count} />

      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {[1, 2].map((n) => (
            <div key={n} style={{ height: 120, borderRadius: 'var(--radius-lg)', background: 'var(--color-bg-subtle)', animation: 'pulse 1.5s infinite' }} />
          ))}
        </div>
      ) : count === 0 ? (
        <div style={{ border: '2px dashed var(--color-border-default)', borderRadius: 'var(--radius-lg)', padding: '48px 24px', textAlign: 'center' }}>
          <div style={{ color: 'var(--color-fg-disabled)', marginBottom: '12px' }}>
            <LocationIcon />
          </div>
          <Text variant="body" color="muted" as="p">Todavía no tenés direcciones guardadas.</Text>
          <Text variant="body-sm" color="muted" as="p" style={{ marginTop: '6px' }}>
            Usá el botón "Agregar" para guardar tu primera dirección de envío.
          </Text>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {list.map((addr) => (
            <AddressCard
              key={addr._id}
              addr={addr}
              deleting={deleting === addr._id}
              settingDefault={settingDefault === addr._id}
              onEdit={() => openEdit(addr)}
              onDelete={() => handleDelete(addr._id)}
              onSetDefault={() => handleSetDefault(addr._id)}
            />
          ))}
        </div>
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} size="md">
        <Modal.Header>
          <Text variant="heading-3" as="h2">
            {editing ? 'Editar dirección' : 'Nueva dirección'}
          </Text>
        </Modal.Header>

        <Modal.Body>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <StoreInput
              label="Etiqueta"
              labelAction={<Req />}
              placeholder='Ej: "Casa", "Trabajo"'
              value={form.label}
              onChange={(e) => set('label', e.target.value)}
              onBlur={() => touch('label')}
              error={touched.label ? formErrors.label : undefined}
              maxLength={30}
              size="md"
            />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div style={{ gridColumn: '1 / -1' }}>
                <StoreInput
                  label="Nombre completo"
                  labelAction={<Req />}
                  value={form.fullName}
                  onChange={(e) => set('fullName', e.target.value.replace(/[^a-záéíóúüñA-ZÁÉÍÓÚÜÑ\s'.-]/g, ''))}
                  onBlur={() => touch('fullName')}
                  error={touched.fullName ? formErrors.fullName : undefined}
                  variant="outlined"
                  size="md"
                />
              </div>
              <div style={{ gridColumn: '1 / -1' }}>
                <StoreInput
                  label="Teléfono"
                  labelAction={<Req />}
                  placeholder="Ej: 1112345678"
                  value={form.phone}
                  onChange={(e) => set('phone', e.target.value.replace(/\D/g, ''))}
                  onBlur={() => touch('phone')}
                  error={touched.phone ? formErrors.phone : undefined}
                  inputMode="tel"
                  variant="outlined"
                  size="md"
                />
              </div>
              <div style={{ gridColumn: '1 / -1' }}>
                <StoreInput
                  label="Dirección"
                  labelAction={<Req />}
                  placeholder="Calle y número"
                  value={form.address}
                  onChange={(e) => set('address', e.target.value)}
                  onBlur={() => touch('address')}
                  error={touched.address ? formErrors.address : undefined}
                  variant="outlined"
                  size="md"
                />
              </div>
              <div style={{ gridColumn: '1 / -1' }}>
                <StoreInput
                  label="Piso / Depto"
                  hint="Opcional"
                  placeholder="Ej: 3° B"
                  value={form.floor}
                  onChange={(e) => set('floor', e.target.value)}
                  variant="outlined"
                  size="md"
                />
              </div>
              <div>
                <StoreInput
                  label="Ciudad"
                  labelAction={<Req />}
                  value={form.city}
                  onChange={(e) => set('city', e.target.value.replace(/[^a-záéíóúüñA-ZÁÉÍÓÚÜÑ\s'.-]/g, ''))}
                  onBlur={() => touch('city')}
                  error={touched.city ? formErrors.city : undefined}
                  variant="outlined"
                  size="md"
                />
              </div>
              <div>
                <StoreInput
                  label="Código postal"
                  hint="Opcional"
                  placeholder="Ej: 1425"
                  value={form.zip}
                  onChange={(e) => set('zip', e.target.value.replace(/\D/g, '').slice(0, 8))}
                  onBlur={() => touch('zip')}
                  error={touched.zip ? formErrors.zip : undefined}
                  inputMode="numeric"
                  variant="outlined"
                  size="md"
                />
              </div>
              <div style={{ gridColumn: '1 / -1' }}>
                <StoreSelect
                  label="Provincia"
                  labelAction={<Req />}
                  value={form.province || undefined}
                  onValueChange={(val) => { set('province', val); touch('province'); }}
                  error={touched.province ? formErrors.province : undefined}
                  placeholder="Seleccioná una provincia"
                  options={PROVINCES.map((p) => ({ value: p, label: p }))}
                  variant="outlined"
                  size="md"
                />
              </div>
            </div>

            {error && (
              <div style={{ padding: '10px 14px', background: 'var(--color-error-50)', border: '1px solid var(--color-error-200)', borderRadius: 'var(--radius-md)' }}>
                <Text variant="body-sm" style={{ color: 'var(--color-error-700)' }} as="p">{error}</Text>
              </div>
            )}
          </div>
        </Modal.Body>

        <Modal.Footer>
          <StoreButton emphasis="ghost" size="md" onClick={() => setModalOpen(false)} disabled={saving}>
            Cancelar
          </StoreButton>
          <StoreButton size="md" onClick={handleSave} disabled={saving || !isFormValid}>
            {saving ? 'Guardando...' : editing ? 'Guardar cambios' : 'Agregar dirección'}
          </StoreButton>
        </Modal.Footer>
      </Modal>
    </main>
  );
}

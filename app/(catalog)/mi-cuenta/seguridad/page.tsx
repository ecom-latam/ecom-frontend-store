'use client';

import { useState } from 'react';
import { Text } from 'zoui';
import { StoreButton } from '@/components/ui/StoreButton';
import { StorePasswordInput } from '@/components/ui/StorePasswordInput';
import { security } from '@/utils/api/security';

const ShieldIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
  </svg>
);

const PhoneIcon = () => (
  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <rect x="5" y="2" width="14" height="20" rx="2" ry="2" />
    <line x1="12" y1="18" x2="12.01" y2="18" />
  </svg>
);

const EMPTY = { current: '', next: '', confirm: '' };

export default function SeguridadPage() {
  const [form, setForm] = useState(EMPTY);
  const [touched, setTouched] = useState<Partial<Record<keyof typeof EMPTY, boolean>>>({});
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  function set(field: keyof typeof EMPTY, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
    setSuccess(false);
    setApiError(null);
  }

  function touch(field: keyof typeof EMPTY) {
    setTouched((prev) => ({ ...prev, [field]: true }));
  }

  function validate() {
    const e: Partial<Record<keyof typeof EMPTY, string>> = {};
    if (!form.current) e.current = 'Requerido.';
    if (!form.next) e.next = 'Requerido.';
    else if (form.next.length < 8) e.next = 'Mínimo 8 caracteres.';
    else if (form.next === form.current) e.next = 'La nueva contraseña debe ser diferente a la actual.';
    if (!form.confirm) e.confirm = 'Requerido.';
    else if (form.confirm !== form.next) e.confirm = 'Las contraseñas no coinciden.';
    return e;
  }

  const errors = validate();
  const isValid = Object.keys(errors).length === 0;

  async function handleSave() {
    setTouched({ current: true, next: true, confirm: true });
    if (!isValid) return;

    setSaving(true);
    setApiError(null);
    try {
      await security.changePassword(form.current, form.next);
      setSuccess(true);
      setForm(EMPTY);
      setTouched({});
    } catch (err: unknown) {
      const code = (err as { response?: { data?: { error?: string } } })?.response?.data?.error;
      if (code === 'INVALID_CURRENT_PASSWORD') setApiError('La contraseña actual es incorrecta.');
      else if (code === 'PASSWORD_TOO_SHORT') setApiError('La nueva contraseña debe tener al menos 8 caracteres.');
      else setApiError('Ocurrió un error. Intentá de nuevo.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <main style={{ padding: '32px 24px', maxWidth: 560 }}>
      <Text variant="heading-2" style={{ marginBottom: '32px' }}>Seguridad</Text>

      {/* ── Cambiar contraseña ── */}
      <section style={{ background: 'var(--color-bg-default)', border: '1px solid var(--color-border-default)', borderRadius: 'var(--radius-lg)', padding: '24px', marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
          <div style={{ color: 'var(--color-fg-muted)' }}><ShieldIcon /></div>
          <Text variant="heading-3">Cambiar contraseña</Text>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <StorePasswordInput
            label="Contraseña actual"
            value={form.current}
            onChange={(e) => set('current', e.target.value)}
            onBlur={() => touch('current')}
            error={touched.current ? errors.current : undefined}
            size="md"
            autoComplete="current-password"
          />
          <StorePasswordInput
            label="Nueva contraseña"
            value={form.next}
            onChange={(e) => set('next', e.target.value)}
            onBlur={() => touch('next')}
            error={touched.next ? errors.next : undefined}
            hint={!touched.next || !errors.next ? 'Mínimo 8 caracteres.' : undefined}
            size="md"
            autoComplete="new-password"
          />
          <StorePasswordInput
            label="Confirmar nueva contraseña"
            value={form.confirm}
            onChange={(e) => set('confirm', e.target.value)}
            onBlur={() => touch('confirm')}
            error={touched.confirm ? errors.confirm : undefined}
            size="md"
            autoComplete="new-password"
          />
        </div>

        {apiError && (
          <div style={{ marginTop: '16px', padding: '10px 14px', background: 'var(--color-error-50)', border: '1px solid var(--color-error-200)', borderRadius: 'var(--radius-md)' }}>
            <Text variant="body-sm" style={{ color: 'var(--color-error-700)' }}>{apiError}</Text>
          </div>
        )}

        {success && (
          <div style={{ marginTop: '16px', padding: '10px 14px', background: 'var(--color-success-50)', border: '1px solid var(--color-success-200)', borderRadius: 'var(--radius-md)' }}>
            <Text variant="body-sm" style={{ color: 'var(--color-success-700)' }}>Contraseña actualizada correctamente.</Text>
          </div>
        )}

        <div style={{ marginTop: '24px', display: 'flex', justifyContent: 'flex-end' }}>
          <StoreButton
            size="md"
            onClick={handleSave}
            disabled={!isValid || saving}
          >
            {saving ? 'Guardando...' : 'Guardar contraseña'}
          </StoreButton>
        </div>
      </section>

      {/* ── MFA (deshabilitado) ── */}
      <section style={{ background: 'var(--color-bg-default)', border: '1px solid var(--color-border-default)', borderRadius: 'var(--radius-lg)', padding: '24px', opacity: 0.5, pointerEvents: 'none', userSelect: 'none' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ color: 'var(--color-fg-muted)' }}><ShieldIcon /></div>
            <Text variant="heading-3">Autenticación de dos factores</Text>
          </div>
          <span style={{
            fontSize: 'var(--font-size-xs)',
            fontWeight: 600,
            padding: '3px 8px',
            borderRadius: 'var(--radius-full)',
            background: 'var(--color-bg-subtle)',
            color: 'var(--color-fg-muted)',
            border: '1px solid var(--color-border-default)',
            letterSpacing: '0.04em',
            textTransform: 'uppercase',
          }}>
            Próximamente
          </span>
        </div>

        <div style={{ display: 'flex', gap: '20px', alignItems: 'flex-start' }}>
          <div style={{ flexShrink: 0, color: 'var(--color-fg-disabled)', marginTop: '4px' }}>
            <PhoneIcon />
          </div>
          <div style={{ flex: 1 }}>
            <Text variant="body-sm" weight="medium" style={{ marginBottom: '6px' }}>
              Aplicación de autenticación (TOTP)
            </Text>
            <Text variant="body-sm" color="muted" style={{ lineHeight: 1.6 }}>
              Usá una app como Google Authenticator o Authy para generar códigos temporales al iniciar sesión. Agrega una capa extra de seguridad a tu cuenta.
            </Text>

            <div style={{ marginTop: '20px', display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <Text variant="caption" color="muted">Estado</Text>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--color-fg-disabled)' }} />
                  <Text variant="body-sm">No activado</Text>
                </div>
              </div>

              <StoreButton emphasis="outlined" size="sm" disabled>
                Activar
              </StoreButton>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

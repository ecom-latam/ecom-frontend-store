'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { isAxiosError } from 'axios';
import { apiClient, startSession } from '@/utils/api';

const ROLE_LABELS: Record<string, string> = {
  Manager: 'Manager',
  Seller: 'Vendedor',
};

type InviteInfo = {
  storeId: string;
  role: string;
};

const ERRORS: Record<string, string> = {
  INVALID_EMAIL: 'El email es inválido.',
  INVALID_PASSWORD: 'La contraseña debe tener al menos 8 caracteres.',
  INVALID_CREDENTIALS: 'Contraseña incorrecta para este email.',
  NO_PASSWORD_SET: 'Esta cuenta usa otro método de autenticación.',
  EMAIL_TAKEN: 'Ya existe una cuenta con ese email.',
  INVITATION_EXPIRED: 'El link de invitación expiró.',
  INVITATION_INVALID: 'El link de invitación no es válido.',
  INTERNAL_ERROR: 'Error del servidor. Intentá de nuevo.',
};

export default function InvitacionPage() {
  const { token } = useParams<{ token: string }>();
  const router = useRouter();

  const [info, setInfo] = useState<InviteInfo | null>(null);
  const [tokenError, setTokenError] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    async function validate() {
      try {
        const { data } = await apiClient.get(`/api/auth/invitations/${token}`);
        setInfo(data as InviteInfo);
      } catch (err) {
        if (isAxiosError(err)) {
          const code = err.response?.data?.error as string | undefined;
          setTokenError(ERRORS[code ?? ''] ?? 'El link de invitación no es válido.');
        } else {
          setTokenError('Error de conexión al validar la invitación.');
        }
      } finally {
        setLoading(false);
      }
    }
    validate();
  }, [token]);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    const form = new FormData(e.currentTarget);
    const email = form.get('email') as string;
    const password = form.get('password') as string;

    try {
      const { data } = await apiClient.post(`/api/auth/invitations/${token}`, { email, password });
      const accessToken = (data as { accessToken?: string }).accessToken;
      if (accessToken) startSession(accessToken);
      setSuccess(true);
    } catch (err) {
      if (isAxiosError(err)) {
        const code = err.response?.data?.error as string | undefined;
        setError(ERRORS[code ?? ''] ?? ERRORS.INTERNAL_ERROR);
      } else {
        setError(ERRORS.INTERNAL_ERROR);
      }
    } finally {
      setSubmitting(false);
    }
  }

  const centeredLayout: React.CSSProperties = {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'var(--color-bg-subtle)',
    padding: '16px',
  };

  if (loading) {
    return (
      <main style={centeredLayout}>
        <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-fg-secondary)' }}>
          Validando invitación...
        </p>
      </main>
    );
  }

  if (tokenError) {
    return (
      <main style={centeredLayout}>
        <div style={{ textAlign: 'center' }}>
          <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-error-600)' }}>{tokenError}</p>
          <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-fg-muted)', marginTop: '8px' }}>
            El link puede haber expirado o ya fue utilizado.
          </p>
        </div>
      </main>
    );
  }

  if (success) {
    return (
      <main style={centeredLayout}>
        <div style={{ textAlign: 'center' }}>
          <p style={{ fontSize: 'var(--font-size-sm)', fontWeight: 500, color: 'var(--color-fg-primary)' }}>
            ¡Listo! Tu cuenta fue creada.
          </p>
          <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-fg-secondary)', marginTop: '4px' }}>
            Podés{' '}
            <button
              onClick={() => router.push('/iniciar-sesion')}
              style={{ color: 'var(--color-fg-primary)', fontWeight: 500, background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}
            >
              iniciar sesión
            </button>
            .
          </p>
        </div>
      </main>
    );
  }

  return (
    <main style={centeredLayout}>
      <div style={{
        background: 'var(--color-bg-surface)',
        border: '1px solid var(--color-border-default)',
        borderRadius: 'var(--radius-lg)',
        padding: '32px',
        width: '100%',
        maxWidth: '380px',
      }}>
        <h1 style={{ fontSize: 'var(--font-size-xl)', fontWeight: 600, color: 'var(--color-fg-primary)', marginBottom: '4px' }}>
          Aceptar invitación
        </h1>
        <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-fg-secondary)', marginBottom: '24px' }}>
          Vas a unirte como <strong>{ROLE_LABELS[info!.role] ?? info!.role}</strong>.
        </p>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div className="field field--outlined">
            <label htmlFor="email" className="field__label">Email</label>
            <input
              id="email"
              name="email"
              type="email"
              required
              autoComplete="email"
              className="field__input"
            />
          </div>

          <div className="field field--outlined">
            <label htmlFor="password" className="field__label">Contraseña</label>
            <input
              id="password"
              name="password"
              type="password"
              required
              minLength={8}
              autoComplete="new-password"
              className="field__input"
            />
            <p className="field__hint">Mínimo 8 caracteres.</p>
          </div>

          {error && <p className="field__hint field__hint--error">{error}</p>}

          <button
            type="submit"
            disabled={submitting}
            className="btn btn--filled btn--rounded btn--md"
            style={{ width: '100%', justifyContent: 'center' }}
          >
            {submitting ? 'Creando cuenta...' : 'Aceptar invitación'}
          </button>
        </form>
      </div>
    </main>
  );
}

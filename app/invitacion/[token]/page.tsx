'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { isAxiosError } from 'axios';
import { apiClient, startSession } from '@/utils/api';
import { Text } from 'zoui';
import { StoreButton } from '@/components/ui/StoreButton';
import { StoreInput } from '@/components/ui/StoreInput';
import { StorePasswordInput } from '@/components/ui/StorePasswordInput';

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
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
  const formValid = emailValid && password.length >= 8;

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

  async function handleSubmit() {
    setError('');
    setSubmitting(true);

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
        <Text variant="body-sm" color="secondary">Validando invitación...</Text>
      </main>
    );
  }

  if (tokenError) {
    return (
      <main style={centeredLayout}>
        <div style={{ textAlign: 'center' }}>
          <Text variant="body-sm" as="p" style={{ color: 'var(--color-error-500)' }}>{tokenError}</Text>
          <Text variant="body-sm" color="muted" as="p" style={{ marginTop: '8px' }}>
            El link puede haber expirado o ya fue utilizado.
          </Text>
        </div>
      </main>
    );
  }

  if (success) {
    return (
      <main style={centeredLayout}>
        <div style={{ textAlign: 'center' }}>
          <Text variant="body-sm" weight="medium" as="p">¡Listo! Tu cuenta fue creada.</Text>
          <Text variant="body-sm" color="secondary" as="p" style={{ marginTop: '4px' }}>
            Podés{' '}
            <StoreButton emphasis="ghost" size="md" onClick={() => router.push('/iniciar-sesion')} style={{ padding: 0, height: 'auto', textDecoration: 'underline', fontWeight: 500 }}>
              iniciar sesión
            </StoreButton>
            .
          </Text>
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
        <Text variant="heading-2" as="h1" style={{ marginBottom: '4px' }}>Aceptar invitación</Text>
        <Text variant="body-sm" color="secondary" as="p" style={{ marginBottom: '24px' }}>
          Vas a unirte como <strong>{ROLE_LABELS[info!.role] ?? info!.role}</strong>.
        </Text>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <StoreInput
            label="Email"
            type="email"
            autoComplete="email"
            fullWidth
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
          />
          <StorePasswordInput
            label="Contraseña"
            minLength={8}
            autoComplete="new-password"
            hint="Mínimo 8 caracteres."
            fullWidth
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
          />

          {error && <Text variant="body-sm" as="p" style={{ color: 'var(--color-error-500)' }}>{error}</Text>}

          <StoreButton
            disabled={!formValid || submitting}
            size="md"
            style={{ width: '100%', justifyContent: 'center' }}
            onClick={handleSubmit}
          >
            {submitting ? 'Creando cuenta...' : 'Aceptar invitación'}
          </StoreButton>
        </div>
      </div>
    </main>
  );
}

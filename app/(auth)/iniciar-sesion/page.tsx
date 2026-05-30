'use client';

import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { isAxiosError } from 'axios';
import { auth, startSession } from '@/utils/api';
import { Text } from 'zoui';
import { StoreButton } from '@/components/ui/StoreButton';
import { StoreInput } from '@/components/ui/StoreInput';

const ERRORS: Record<string, string> = {
  INVALID_CREDENTIALS: 'Email o contraseña incorrectos.',
  ACCOUNT_LOCKED: 'Cuenta bloqueada temporalmente. Intentá en 15 minutos.',
  RATE_LIMIT_EXCEEDED: 'Demasiados intentos. Esperá unos minutos.',
  INTERNAL_ERROR: 'Error del servidor. Intentá de nuevo.',
};

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get('next') ?? '/';
  const registered = searchParams.get('registered') === '1';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit() {
    setError('');
    setLoading(true);

    try {
      const { data } = await auth.login(email, password, { _skipModal: true });
      const res = data as { status?: string; mfaToken?: string; accessToken?: string };

      if (res.status === 'MFA_REQUIRED') {
        router.push(`/iniciar-sesion/verificar-mfa?mfaToken=${encodeURIComponent(res.mfaToken!)}&next=${encodeURIComponent(next)}`);
        return;
      }

      if (res.status === 'MFA_SETUP_REQUIRED') {
        setError('Tu cuenta requiere configurar verificación en dos pasos. Accedé desde la plataforma de gestión.');
        return;
      }

      startSession(res.accessToken!);
      router.push(next);
    } catch (err) {
      if (isAxiosError(err)) {
        const code = err.response?.data?.error as string | undefined;
        setError(ERRORS[code ?? ''] ?? ERRORS.INTERNAL_ERROR);
      } else {
        setError(ERRORS.INTERNAL_ERROR);
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ width: '100%', maxWidth: '384px', background: 'var(--color-bg-surface)', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-sm)', border: '1px solid var(--color-border-default)', padding: '40px 32px' }}>
      <Link href="/productos" style={{ display: 'block', marginBottom: '24px', textDecoration: 'none' }}>
        <Text variant="body-sm" color="muted">← Volver a la tienda</Text>
      </Link>

      <Text variant="heading-2" as="h1" style={{ marginBottom: '4px' }}>Iniciar sesión</Text>
      <Text variant="body-sm" color="muted" style={{ marginBottom: '24px' }}>Accedé a tu cuenta.</Text>

      {registered && (
        <div style={{ marginBottom: '16px', background: 'var(--color-success-50)', border: '1px solid var(--color-success-100)', borderRadius: 'var(--radius-md)', padding: '8px 12px' }}>
          <Text variant="body-sm" style={{ color: 'var(--color-success-700)' }}>Cuenta creada. Podés iniciar sesión.</Text>
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <StoreInput id="email" type="email" autoComplete="email" autoFocus label="Email" fullWidth value={email} onChange={(e) => setEmail(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleSubmit()} data-testid="store-login-email" />
        <StoreInput id="password" type="password" autoComplete="current-password" label="Contraseña" fullWidth value={password} onChange={(e) => setPassword(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleSubmit()} data-testid="store-login-password" />

        {error && (
          <Text variant="body-sm" as="p" style={{ color: 'var(--color-error-500)' }} data-testid="store-login-error">{error}</Text>
        )}

        <StoreButton loading={loading} size="md" style={{ width: '100%' }} onClick={handleSubmit} data-testid="store-login-submit">
          {loading ? 'Ingresando...' : 'Ingresar'}
        </StoreButton>
      </div>

      <Text variant="body-sm" color="muted" as="p" style={{ textAlign: 'center', marginTop: '24px' }}>
        ¿No tenés cuenta?{' '}
        <Link href="/registro" style={{ color: 'var(--color-fg-primary)', fontWeight: 500, textDecoration: 'underline' }}>
          Registrate
        </Link>
      </Text>
    </div>
  );
}

export default function IniciarSesionPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { isAxiosError } from 'axios';
import { auth, startSession } from '@/utils/api';
import { Text } from 'zoui';
import { StoreButton } from '@/components/ui/StoreButton';
import { StoreInput } from '@/components/ui/StoreInput';
import { StorePasswordInput } from '@/components/ui/StorePasswordInput';

const ERRORS: Record<string, string> = {
  INVALID_EMAIL: 'El email no es válido.',
  INVALID_PASSWORD: 'La contraseña debe tener al menos 8 caracteres.',
  EMAIL_TAKEN: 'Ya existe una cuenta con ese email.',
  MISSING_STORE_ID: 'No se pudo identificar la tienda.',
  MISSING_TENANT: 'No se pudo identificar la tienda.',
  INTERNAL_ERROR: 'Error del servidor. Intentá de nuevo.',
};

export default function RegistroPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
  const isValid = emailValid && password.length >= 8;

  async function handleSubmit() {
    if (!isValid) return;
    setError('');
    setLoading(true);

    try {
      await auth.registerCustomer(email, password, { _skipModal: true });
      const { data } = await auth.login(email, password, { _skipModal: true });
      const res = data as { accessToken?: string };
      if (res.accessToken) startSession(res.accessToken);
      router.push('/');
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

      <Text variant="heading-2" style={{ marginBottom: '4px' }}>Crear cuenta</Text>
      <Text variant="body-sm" color="muted" style={{ marginBottom: '24px' }}>Registrate para comprar en esta tienda.</Text>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <StoreInput id="email" type="email" autoComplete="email" autoFocus label="Email" fullWidth value={email} onChange={(e) => setEmail(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleSubmit()} data-testid="store-register-email" />
        <StorePasswordInput
          id="password"
          autoComplete="new-password"
          label="Contraseña"
          hint="Mínimo 8 caracteres"
          fullWidth
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
          data-testid="store-register-password"
        />

        {error && (
          <Text variant="body-sm" style={{ color: 'var(--color-error-500)' }} data-testid="store-register-error">{error}</Text>
        )}

        <StoreButton loading={loading} disabled={!isValid || loading} size="md" style={{ width: '100%' }} onClick={handleSubmit} data-testid="store-register-submit">
          {loading ? 'Creando cuenta...' : 'Crear cuenta'}
        </StoreButton>
      </div>

      <Text variant="body-sm" color="muted" style={{ textAlign: 'center', marginTop: '24px' }}>
        ¿Ya tenés cuenta?{' '}
        <Link href="/iniciar-sesion" style={{ color: 'var(--color-fg-primary)', fontWeight: 500, textDecoration: 'underline' }}>
          Iniciá sesión
        </Link>
      </Text>
    </div>
  );
}

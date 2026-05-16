'use client';

import { useState, FormEvent, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { isAxiosError } from 'axios';
import { auth, startSession } from '@/utils/api';
import { Button, Input } from 'zoui';

const ERRORS: Record<string, string> = {
  INVALID_TOTP: 'Código incorrecto. Verificá tu app de autenticación.',
  MISSING_CODE: 'Ingresá el código de 6 dígitos.',
  RATE_LIMIT_EXCEEDED: 'Demasiados intentos. Esperá unos minutos.',
  INTERNAL_ERROR: 'Error del servidor. Intentá de nuevo.',
};

function MfaVerifyForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const mfaToken = searchParams.get('mfaToken') ?? '';
  const next = searchParams.get('next') ?? '/';

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (!mfaToken) {
    router.replace('/iniciar-sesion');
    return null;
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError('');
    setLoading(true);

    const form = new FormData(e.currentTarget);
    const code = form.get('code') as string;

    try {
      const { data } = await auth.mfaVerify(mfaToken, code);
      const accessToken = (data as { accessToken?: string }).accessToken;
      if (accessToken) startSession(accessToken);
      router.push(next);
    } catch (err) {
      if (isAxiosError(err)) {
        const code2 = err.response?.data?.error as string | undefined;
        setError(ERRORS[code2 ?? ''] ?? ERRORS.INTERNAL_ERROR);
      } else {
        setError(ERRORS.INTERNAL_ERROR);
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{
      width: '100%',
      maxWidth: '380px',
      background: 'var(--color-bg-surface)',
      borderRadius: 'var(--radius-lg)',
      border: '1px solid var(--color-border-default)',
      padding: '40px 32px',
    }}>
      <h1 style={{ fontSize: 'var(--font-size-xl)', fontWeight: 600, color: 'var(--color-fg-primary)', marginBottom: '8px' }}>
        Verificación en dos pasos
      </h1>
      <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-fg-secondary)', marginBottom: '24px' }}>
        Ingresá el código de 6 dígitos de tu app de autenticación.
      </p>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <Input
          name="code"
          label="Código"
          type="text"
          inputMode="numeric"
          pattern="\d{6}"
          maxLength={6}
          required
          autoComplete="one-time-code"
          autoFocus
          error={error || undefined}
          style={{ textAlign: 'center', letterSpacing: '0.2em', fontFamily: 'monospace' }}
          fullWidth
        />

        <Button
          type="submit"
          disabled={loading}
          variant="filled"
          shape="rounded"
          size="md"
          style={{ width: '100%', justifyContent: 'center' }}
        >
          {loading ? 'Verificando...' : 'Verificar'}
        </Button>
      </form>
    </div>
  );
}

export default function VerificarMfaPage() {
  return (
    <Suspense>
      <MfaVerifyForm />
    </Suspense>
  );
}

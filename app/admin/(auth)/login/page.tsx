'use client';

import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import type { LoginResponse } from '@/lib/auth/types';

import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

const LOGIN_ERRORS: Record<string, string> = {
  INVALID_CREDENTIALS: 'Email o contraseña incorrectos.',
  ACCOUNT_LOCKED: 'Cuenta bloqueada temporalmente. Intentá en 15 minutos.',
  RATE_LIMIT_EXCEEDED: 'Demasiados intentos. Esperá unos minutos.',
  INTERNAL_ERROR: 'Error del servidor. Intentá de nuevo.',
};

const MFA_ERRORS: Record<string, string> = {
  INVALID_TOTP: 'Código incorrecto. Verificá tu app de autenticación.',
  MISSING_CODE: 'Ingresá el código de 6 dígitos.',
  RATE_LIMIT_EXCEEDED: 'Demasiados intentos. Esperá unos minutos.',
  INTERNAL_ERROR: 'Error del servidor. Intentá de nuevo.',
};

export default function AdminLoginPage() {
  const router = useRouter();
  const [step, setStep] = useState<'credentials' | 'mfa'>('credentials');
  const [mfaToken, setMfaToken] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleCredentials(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError('');
    setLoading(true);

    const form = new FormData(e.currentTarget);
    const email = form.get('email') as string;
    const password = form.get('password') as string;

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data: LoginResponse | { error: string } = await res.json();

      if (!res.ok) {
        const code = (data as { error: string }).error;
        setError(LOGIN_ERRORS[code] ?? LOGIN_ERRORS.INTERNAL_ERROR);
        return;
      }

      const loginData = data as LoginResponse;

      if ('status' in loginData && loginData.status === 'MFA_REQUIRED') {
        setMfaToken(loginData.mfaToken);
        setStep('mfa');
        return;
      }

      if ('status' in loginData && loginData.status === 'MFA_SETUP_REQUIRED') {
        setError('Esta cuenta requiere configurar MFA. Iniciá sesión desde la plataforma principal.');
        return;
      }

      router.push('/admin');
    } catch {
      setError(LOGIN_ERRORS.INTERNAL_ERROR);
    } finally {
      setLoading(false);
    }
  }

  async function handleMfa(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError('');
    setLoading(true);

    const form = new FormData(e.currentTarget);
    const code = form.get('code') as string;

    try {
      const res = await fetch('/api/auth/mfa/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, mfaToken }),
      });

      const data = await res.json();

      if (!res.ok) {
        const errCode = data?.error ?? 'INTERNAL_ERROR';
        setError(MFA_ERRORS[errCode] ?? MFA_ERRORS.INTERNAL_ERROR);
        return;
      }

      router.push('/admin');
    } catch {
      setError(MFA_ERRORS.INTERNAL_ERROR);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="w-full max-w-sm bg-white rounded-lg shadow-sm border border-gray-200 px-8 py-10">
        {step === 'credentials' ? (
          <>
            <h1 className="text-xl font-semibold text-gray-900 mb-1">Panel de administración</h1>
            <p className="text-sm text-gray-500 mb-6">Accedé con tu cuenta de administrador.</p>

            <form onSubmit={handleCredentials} className="space-y-4">
              <Input
                id="email"
                name="email"
                type="email"
                required
                autoComplete="email"
                autoFocus
                label="Email"
                fullWidth
              />

              <Input
                id="password"
                name="password"
                type="password"
                required
                autoComplete="current-password"
                label="Contraseña"
                fullWidth
              />

              {error && <p className="field__hint field__hint--error">{error}</p>}

              <Button
                type="submit"
                loading={loading}
                variant="filled"
                shape="rounded"
                size="md"
                style={{ width: '100%' }}
              >
                {loading ? 'Ingresando...' : 'Ingresar'}
              </Button>
            </form>
          </>
        ) : (
          <>
            <h1 className="text-xl font-semibold text-gray-900 mb-1">Verificación en dos pasos</h1>
            <p className="text-sm text-gray-500 mb-6">
              Ingresá el código de 6 dígitos de tu app de autenticación.
            </p>

            <form onSubmit={handleMfa} className="space-y-4">
              <Input
                id="code"
                name="code"
                type="text"
                inputMode="numeric"
                pattern="\d{6}"
                maxLength={6}
                required
                autoComplete="one-time-code"
                autoFocus
                label="Código"
                inputClassName="text-center tracking-widest font-mono"
                fullWidth
              />

              {error && <p className="field__hint field__hint--error">{error}</p>}

              <Button
                type="submit"
                loading={loading}
                variant="filled"
                shape="rounded"
                size="md"
                style={{ width: '100%' }}
              >
                {loading ? 'Verificando...' : 'Verificar'}
              </Button>

              <button
                type="button"
                onClick={() => {
                  setStep('credentials');
                  setError('');
                  setMfaToken('');
                }}
                className="btn btn--ghost btn--rounded btn--sm"
                style={{ width: '100%' }}
              >
                ← Volver
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}

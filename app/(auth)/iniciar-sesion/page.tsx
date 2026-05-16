'use client';

import { useState, FormEvent, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { isAxiosError } from 'axios';
import { auth, startSession } from '@/utils/api';
import { Button, Input } from 'zoui';

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

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError('');
    setLoading(true);

    const form = new FormData(e.currentTarget);
    const email = form.get('email') as string;
    const password = form.get('password') as string;

    try {
      const { data } = await auth.login(email, password);
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
    <div className="w-full max-w-sm bg-white rounded-lg shadow-sm border border-gray-200 px-8 py-10">
      <Link href="/productos" className="block text-sm text-gray-500 hover:text-gray-700 mb-6">
        ← Volver a la tienda
      </Link>

      <h1 className="text-xl font-semibold text-gray-900 mb-1">Iniciar sesión</h1>
      <p className="text-sm text-gray-500 mb-6">Accedé a tu cuenta.</p>

      {registered && (
        <p className="mb-4 text-sm text-green-700 bg-green-50 border border-green-200 rounded-md px-3 py-2">
          Cuenta creada. Podés iniciar sesión.
        </p>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <Input id="email" name="email" type="email" required autoComplete="email" autoFocus label="Email" fullWidth />
        <Input id="password" name="password" type="password" required autoComplete="current-password" label="Contraseña" fullWidth />

        {error && <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-error-600)' }}>{error}</p>}

        <Button type="submit" loading={loading} variant="filled" shape="rounded" size="md" style={{ width: '100%' }}>
          {loading ? 'Ingresando...' : 'Ingresar'}
        </Button>
      </form>

      <p className="text-sm text-center text-gray-500 mt-6">
        ¿No tenés cuenta?{' '}
        <Link href="/registro" className="text-gray-900 font-medium hover:underline">
          Registrate
        </Link>
      </p>
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

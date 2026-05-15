'use client';

import { useState, FormEvent } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

const ERRORS: Record<string, string> = {
  INVALID_CREDENTIALS: 'Email o contraseña incorrectos.',
  ACCOUNT_LOCKED: 'Cuenta bloqueada temporalmente. Intentá en 15 minutos.',
  RATE_LIMIT_EXCEEDED: 'Demasiados intentos. Esperá unos minutos.',
  INTERNAL_ERROR: 'Error del servidor. Intentá de nuevo.',
};

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
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
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        const code = (data as { error: string }).error;
        setError(ERRORS[code] ?? ERRORS.INTERNAL_ERROR);
        return;
      }

      if ('status' in data && (data.status === 'MFA_REQUIRED' || data.status === 'MFA_SETUP_REQUIRED')) {
        setError('Esta cuenta requiere verificación adicional. Usá el panel de administración.');
        return;
      }

      const next = searchParams.get('next');
      router.push(next && next.startsWith('/') ? next : '/products');
      router.refresh();
    } catch {
      setError(ERRORS.INTERNAL_ERROR);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="w-full max-w-sm bg-white rounded-lg shadow-sm border border-gray-200 px-8 py-10">
        <h1 className="text-xl font-semibold text-gray-900 mb-1">Iniciar sesión</h1>
        <p className="text-sm text-gray-500 mb-6">Accedé con tu cuenta de comprador.</p>

        <form onSubmit={handleSubmit} className="space-y-4">
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

        <p className="text-sm text-center text-gray-500 mt-6">
          ¿No tenés cuenta?{' '}
          <Link href="/register" className="text-gray-900 font-medium hover:underline">
            Registrate
          </Link>
        </p>
      </div>
    </div>
  );
}

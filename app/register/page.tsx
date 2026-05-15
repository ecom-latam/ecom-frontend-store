'use client';

import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

const ERRORS: Record<string, string> = {
  INVALID_EMAIL: 'El email no es válido.',
  INVALID_PASSWORD: 'La contraseña debe tener al menos 8 caracteres.',
  EMAIL_TAKEN: 'Ya existe una cuenta con ese email.',
  MISSING_STORE_ID: 'No se pudo identificar la tienda.',
  MISSING_TENANT: 'No se pudo identificar la tienda.',
  INTERNAL_ERROR: 'Error del servidor. Intentá de nuevo.',
};

export default function RegisterPage() {
  const router = useRouter();
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
      const res = await fetch('/api/auth/customer/register', {
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

      // Auto-login after registration
      const loginRes = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      if (loginRes.ok) {
        router.push('/products');
        router.refresh();
      } else {
        router.push('/login');
      }
    } catch {
      setError(ERRORS.INTERNAL_ERROR);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="w-full max-w-sm bg-white rounded-lg shadow-sm border border-gray-200 px-8 py-10">
        <h1 className="text-xl font-semibold text-gray-900 mb-1">Crear cuenta</h1>
        <p className="text-sm text-gray-500 mb-6">Registrate para comprar en esta tienda.</p>

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
            autoComplete="new-password"
            label="Contraseña"
            hint="Mínimo 8 caracteres"
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
            {loading ? 'Registrando...' : 'Crear cuenta'}
          </Button>
        </form>

        <p className="text-sm text-center text-gray-500 mt-6">
          ¿Ya tenés cuenta?{' '}
          <Link href="/login" className="text-gray-900 font-medium hover:underline">
            Iniciá sesión
          </Link>
        </p>
      </div>
    </div>
  );
}

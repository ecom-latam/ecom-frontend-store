'use client';

import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { isAxiosError } from 'axios';
import { auth, startSession } from '@/utils/api';
import { Button, Input } from 'zoui';

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
      await auth.registerCustomer(email, password);
      const { data } = await auth.login(email, password);
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
    <div className="w-full max-w-sm bg-white rounded-lg shadow-sm border border-gray-200 px-8 py-10">
      <Link href="/productos" className="block text-sm text-gray-500 hover:text-gray-700 mb-6">
        ← Volver a la tienda
      </Link>

      <h1 className="text-xl font-semibold text-gray-900 mb-1">Crear cuenta</h1>
      <p className="text-sm text-gray-500 mb-6">Registrate para comprar en esta tienda.</p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <Input id="email" name="email" type="email" required autoComplete="email" autoFocus label="Email" fullWidth />
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

        {error && <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-error-600)' }}>{error}</p>}

        <Button type="submit" loading={loading} variant="filled" shape="rounded" size="md" style={{ width: '100%' }}>
          {loading ? 'Creando cuenta...' : 'Crear cuenta'}
        </Button>
      </form>

      <p className="text-sm text-center text-gray-500 mt-6">
        ¿Ya tenés cuenta?{' '}
        <Link href="/iniciar-sesion" className="text-gray-900 font-medium hover:underline">
          Iniciá sesión
        </Link>
      </p>
    </div>
  );
}

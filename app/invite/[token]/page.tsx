'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';

const ROLE_LABELS: Record<string, string> = {
  Manager: 'Manager',
  Seller: 'Vendedor',
};

type InviteInfo = {
  storeId: string;
  role: string;
};

const ACCEPT_ERRORS: Record<string, string> = {
  INVALID_EMAIL: 'El email es inválido.',
  INVALID_PASSWORD: 'La contraseña debe tener al menos 8 caracteres.',
  INVALID_CREDENTIALS: 'Contraseña incorrecta para este email.',
  NO_PASSWORD_SET: 'Esta cuenta usa otro método de autenticación.',
  EMAIL_TAKEN: 'Ya existe una cuenta con ese email.',
  INVITATION_EXPIRED: 'El link de invitación expiró.',
  INVITATION_INVALID: 'El link de invitación no es válido.',
  INTERNAL_ERROR: 'Error del servidor. Intentá de nuevo.',
};

export default function InvitePage() {
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
        const res = await fetch(`/api/invitations/${token}`);
        const data = await res.json();
        if (!res.ok) {
          setTokenError(ACCEPT_ERRORS[data?.error] ?? 'El link de invitación no es válido.');
          return;
        }
        setInfo(data);
      } catch {
        setTokenError('Error de conexión al validar la invitación.');
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
      const res = await fetch(`/api/invitations/${token}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(ACCEPT_ERRORS[data?.error] ?? ACCEPT_ERRORS.INTERNAL_ERROR);
        return;
      }

      setSuccess(true);
      setTimeout(() => router.push('/admin/login'), 2000);
    } catch {
      setError(ACCEPT_ERRORS.INTERNAL_ERROR);
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <p className="text-sm text-gray-500">Validando invitación...</p>
      </div>
    );
  }

  if (tokenError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <p className="text-sm text-red-600">{tokenError}</p>
          <p className="text-sm text-gray-400 mt-2">El link puede haber expirado o ya fue utilizado.</p>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <p className="text-sm font-medium text-gray-900">¡Listo! Tu cuenta fue creada.</p>
          <p className="text-sm text-gray-500 mt-1">Redirigiendo al login...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="bg-white border border-gray-200 rounded-lg p-8 w-full max-w-sm">
        <h1 className="text-xl font-semibold text-gray-900 mb-1">Aceptar invitación</h1>
        <p className="text-sm text-gray-500 mb-6">
          Vas a unirte como <strong>{ROLE_LABELS[info!.role] ?? info!.role}</strong>.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              autoComplete="email"
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
              Contraseña
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              minLength={8}
              autoComplete="new-password"
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
            />
            <p className="text-xs text-gray-400 mt-1">Mínimo 8 caracteres.</p>
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-gray-900 text-white text-sm font-medium py-2 rounded-md hover:bg-gray-700 disabled:opacity-50 transition-colors"
          >
            {submitting ? 'Creando cuenta...' : 'Aceptar invitación'}
          </button>
        </form>
      </div>
    </div>
  );
}

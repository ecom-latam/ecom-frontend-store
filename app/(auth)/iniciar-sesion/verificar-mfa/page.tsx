'use client';

import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { auth, startSession } from '@/utils/api';
import { Text } from 'zoui';
import { StoreButton } from '@/components/ui/StoreButton';
import { StoreInput } from '@/components/ui/StoreInput';

function MfaVerifyForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const mfaToken = searchParams.get('mfaToken') ?? '';
  const next = searchParams.get('next') ?? '/';

  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);

  if (!mfaToken) {
    router.replace('/iniciar-sesion');
    return null;
  }

  async function handleSubmit() {
    setLoading(true);
    try {
      const { data } = await auth.mfaVerify(mfaToken, code);
      const accessToken = (data as { accessToken?: string }).accessToken;
      if (accessToken) startSession(accessToken);
      router.push(next);
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
      <Text variant="heading-2" as="h1" style={{ marginBottom: '8px' }}>Verificación en dos pasos</Text>
      <Text variant="body-sm" color="secondary" style={{ marginBottom: '24px' }}>
        Ingresá el código de 6 dígitos de tu app de autenticación.
      </Text>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <StoreInput
          label="Código"
          type="text"
          inputMode="numeric"
          maxLength={6}
          autoComplete="one-time-code"
          autoFocus
          style={{ textAlign: 'center', letterSpacing: '0.2em', fontFamily: 'monospace' }}
          fullWidth
          value={code}
          onChange={(e) => setCode(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
        />

        <StoreButton
          disabled={loading}
          size="md"
          style={{ width: '100%', justifyContent: 'center' }}
          onClick={handleSubmit}
        >
          {loading ? 'Verificando...' : 'Verificar'}
        </StoreButton>
      </div>
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

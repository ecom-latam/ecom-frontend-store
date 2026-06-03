'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { auth, startSession } from '@/utils/api';
import { Text } from 'zoui';
import { StoreButton } from '@/components/ui/StoreButton';
import { StoreInput } from '@/components/ui/StoreInput';

export default function RegistroPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit() {
    setLoading(true);
    try {
      await auth.registerCustomer(email, password);
      const { data } = await auth.login(email, password, { _skipModal: true });
      const res = data as { accessToken?: string };
      if (res.accessToken) startSession(res.accessToken);
      router.push('/');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ width: '100%', maxWidth: '384px', background: 'var(--color-bg-surface)', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-sm)', border: '1px solid var(--color-border-default)', padding: '40px 32px' }}>
      <Link href="/productos" style={{ display: 'block', marginBottom: '24px', textDecoration: 'none' }}>
        <Text variant="body-sm" color="muted">← Volver a la tienda</Text>
      </Link>

      <Text variant="heading-2" as="h1" style={{ marginBottom: '4px' }}>Crear cuenta</Text>
      <Text variant="body-sm" color="muted" style={{ marginBottom: '24px' }}>Registrate para comprar en esta tienda.</Text>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <StoreInput id="email" type="email" autoComplete="email" autoFocus label="Email" fullWidth value={email} onChange={(e) => setEmail(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleSubmit()} />
        <StoreInput
          id="password"
          type="password"
          autoComplete="new-password"
          label="Contraseña"
          hint="Mínimo 8 caracteres"
          fullWidth
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
        />

        <StoreButton loading={loading} size="md" style={{ width: '100%' }} onClick={handleSubmit}>
          {loading ? 'Creando cuenta...' : 'Crear cuenta'}
        </StoreButton>
      </div>

      <Text variant="body-sm" color="muted" as="p" style={{ textAlign: 'center', marginTop: '24px' }}>
        ¿Ya tenés cuenta?{' '}
        <Link href="/iniciar-sesion" style={{ color: 'var(--color-fg-primary)', fontWeight: 500, textDecoration: 'underline' }}>
          Iniciá sesión
        </Link>
      </Text>
    </div>
  );
}

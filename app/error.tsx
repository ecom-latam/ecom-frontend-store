'use client';

import { Text } from 'zoui';
import { StoreButton } from '@/components/ui/StoreButton';
import styles from './error.module.scss';

export default function GlobalError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className={styles.root}>
      <Text variant="heading-1" color="muted" style={{ fontSize: '60px', marginBottom: '16px' }}>!</Text>
      <Text variant="heading-2" style={{ marginBottom: '12px' }}>Algo salió mal</Text>
      <Text variant="body" color="secondary" style={{ marginBottom: '32px', maxWidth: '360px' }}>
        Ocurrió un error inesperado. Podés intentar de nuevo o volver al inicio.
      </Text>
      <StoreButton size="md" onClick={reset}>
        Reintentar
      </StoreButton>
    </main>
  );
}

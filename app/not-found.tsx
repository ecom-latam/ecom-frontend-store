'use client';

import { Text } from 'zoui';
import { StoreButton } from '@/components/ui/StoreButton';
import { useRouter } from 'next/navigation';
import styles from './not-found.module.scss';

export default function NotFound() {
  const router = useRouter();
  return (
    <main className={styles.root}>
      <Text variant="heading-1" color="muted" style={{ fontSize: '60px', marginBottom: '16px' }}>404</Text>
      <Text variant="heading-2" as="h1" style={{ marginBottom: '12px' }}>Página no encontrada</Text>
      <Text variant="body" color="secondary" style={{ marginBottom: '32px', maxWidth: '360px' }}>
        La página que buscás no existe o fue movida.
      </Text>
      <StoreButton size="md" onClick={() => router.push('/productos')}>
        Ver productos
      </StoreButton>
    </main>
  );
}

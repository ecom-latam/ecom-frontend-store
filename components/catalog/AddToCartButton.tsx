'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

import type { Product } from '@/lib/api/storeClient';
import { Button } from 'zoui';
import { AddToCartModal } from './AddToCartModal';

interface Props {
  product: Product;
  hasSession: boolean;
  availableStock?: number;
}

export function AddToCartButton({ product, hasSession, availableStock }: Props) {
  const router = useRouter();
  const [modalOpen, setModalOpen] = useState(false);

  const isOutOfStock = availableStock !== undefined && availableStock === 0;

  if (isOutOfStock) {
    return (
      <Button
        variant="outlined"
        shape="pill"
        size="md"
        style={{ marginTop: '24px', width: '100%' }}
        disabled
      >
        Sin stock
      </Button>
    );
  }

  if (!hasSession) {
    return (
      <Button
        variant="filled"
        shape="pill"
        size="md"
        style={{ marginTop: '24px', width: '100%', justifyContent: 'center' }}
        onClick={() => router.push(`/iniciar-sesion?next=/producto?id=${product._id}`)}
      >
        Iniciar sesión para comprar
      </Button>
    );
  }

  return (
    <>
      <Button
        onClick={() => setModalOpen(true)}
        variant="filled"
        shape="pill"
        size="md"
        style={{ marginTop: '24px', width: '100%' }}
      >
        Agregar al carrito
      </Button>

      {modalOpen && (
        <AddToCartModal product={product} onClose={() => setModalOpen(false)} />
      )}
    </>
  );
}

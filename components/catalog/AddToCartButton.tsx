'use client';

import { useState } from 'react';

import type { Product } from '@/lib/api/storeClient';
import { Button } from '@/components/ui/Button';
import { AddToCartModal } from './AddToCartModal';

interface Props {
  product: Product;
  hasSession: boolean;
}

export function AddToCartButton({ product, hasSession }: Props) {
  const [modalOpen, setModalOpen] = useState(false);

  if (!hasSession) {
    return (
      <a
        href={`/login?next=/products/${product._id}`}
        className="btn btn--filled btn--pill btn--md mt-6"
        style={{ width: '100%', justifyContent: 'center' }}
      >
        Iniciar sesión para comprar
      </a>
    );
  }

  return (
    <>
      <Button
        onClick={() => setModalOpen(true)}
        variant="filled"
        shape="pill"
        size="md"
        className="mt-6"
        style={{ width: '100%' }}
      >
        Agregar al carrito
      </Button>

      {modalOpen && (
        <AddToCartModal product={product} onClose={() => setModalOpen(false)} />
      )}
    </>
  );
}

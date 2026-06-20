'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

import type { Product } from '@/lib/api/storeClient';
import { isBuyer } from '@/utils/helpers';
import { Button } from 'zoui';
import type { ButtonVariant } from 'zoui';
import { AddToCartModal } from './AddToCartModal';
import { useStoreConfig } from '@/context/StoreConfigContext';

interface Props {
  product: Product;
  hasSession: boolean;
  availableStock?: number;
  quantity?: number;
}

export function AddToCartButton({ product, hasSession, availableStock, quantity = 1 }: Props) {
  const router = useRouter();
  const { theme } = useStoreConfig();
  const btnVariant = (theme ?? 'outlined') as ButtonVariant;
  const [modalOpen, setModalOpen] = useState(false);
  const [canBuy, setCanBuy] = useState<boolean | null>(null);

  useEffect(() => {
    setCanBuy(isBuyer());
  }, []);

  const isOutOfStock = availableStock !== undefined && availableStock === 0;

  if (canBuy === null) return null;

  if (hasSession && !canBuy) return null;

  if (isOutOfStock) {
    return (
      <Button
        emphasis="outlined"
        size="md"
        style={{ width: '100%' }}
        disabled
      >
        Sin stock
      </Button>
    );
  }

  if (!hasSession) {
    return (
      <Button
        variant={btnVariant}
        size="md"
        style={{ width: '100%', justifyContent: 'center' }}
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
        variant={btnVariant}
        size="md"
        style={{ width: '100%' }}
      >
        Agregar al carrito
      </Button>

      <AddToCartModal product={product} open={modalOpen} onClose={() => setModalOpen(false)} initialQuantity={quantity} />
    </>
  );
}

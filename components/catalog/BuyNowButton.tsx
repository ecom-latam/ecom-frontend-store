'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from 'zoui';
import type { ButtonVariant } from 'zoui';
import { useCart } from '@/context/CartContext';
import { useStoreConfig } from '@/context/StoreConfigContext';

interface BuyNowButtonProps {
  productId: string;
  quantity: number;
  selectedOptions?: Record<string, string>;
  disabled?: boolean;
}

export function BuyNowButton({ productId, quantity, selectedOptions, disabled }: BuyNowButtonProps) {
  const router = useRouter();
  const { addItem } = useCart();
  const { theme } = useStoreConfig();
  const btnVariant = (theme ?? 'outlined') as ButtonVariant;
  const [loading, setLoading] = useState(false);

  async function handleClick() {
    setLoading(true);
    const result = await addItem({ productId, selectedOptions, quantity });
    setLoading(false);
    if (result.ok) {
      router.push('/checkout');
    }
  }

  return (
    <Button
      variant={btnVariant}
      size="md"
      fullWidth
      disabled={disabled || loading}
      onClick={handleClick}
      style={{ justifyContent: 'center' }}
    >
      {loading ? 'Agregando…' : 'Comprar ahora'}
    </Button>
  );
}

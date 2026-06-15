'use client';
import { MoneyInput } from 'zoui';
import type { ComponentProps } from 'react';
import { useStoreConfig } from '@/context/StoreConfigContext';

type Props = ComponentProps<typeof MoneyInput>;

export function StoreMoneyInput({ variant, currency, ...props }: Props) {
  const { theme, currency: storeCurrency } = useStoreConfig();
  return (
    <MoneyInput
      variant={(variant ?? theme ?? 'outlined') as Props['variant']}
      currency={currency ?? storeCurrency ?? 'ARS'}
      {...props}
    />
  );
}

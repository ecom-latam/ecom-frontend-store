'use client';
import { MoneyInput } from 'zoui';
import type { ComponentProps } from 'react';
import { usePageConfig } from '@/context/PageConfigContext';

type Props = ComponentProps<typeof MoneyInput>;

export function StoreMoneyInput({ currency, ...props }: Props) {
  const { store } = usePageConfig();
  const storeCurrency = store?.currency;
  return (
    <MoneyInput
      currency={currency ?? storeCurrency ?? 'ARS'}
      {...props}
    />
  );
}

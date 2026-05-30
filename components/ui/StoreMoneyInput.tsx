'use client';
import { MoneyInput } from 'zoui';
import type { ComponentProps } from 'react';
import { useStoreConfig } from '@/context/StoreConfigContext';

type Props = ComponentProps<typeof MoneyInput>;

export function StoreMoneyInput({ variant, ...props }: Props) {
  const { components_presets } = useStoreConfig();
  return <MoneyInput variant={(variant ?? components_presets?.input ?? 'outlined') as Props['variant']} {...props} />;
}

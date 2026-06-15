'use client';
import { Select } from 'zoui';
import type { ComponentProps } from 'react';
import { useStoreConfig } from '@/context/StoreConfigContext';

type Props = ComponentProps<typeof Select>;

export function StoreSelect({ variant, ...props }: Props) {
  const { theme } = useStoreConfig();
  return <Select variant={(variant ?? theme ?? 'outlined') as Props['variant']} {...props} />;
}

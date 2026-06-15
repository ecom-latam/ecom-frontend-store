'use client';
import { Input } from 'zoui';
import type { ComponentProps } from 'react';
import { useStoreConfig } from '@/context/StoreConfigContext';

type Props = ComponentProps<typeof Input>;

export function StoreInput({ variant, ...props }: Props) {
  const { theme } = useStoreConfig();
  return <Input variant={(variant ?? theme ?? 'outlined') as Props['variant']} {...props} />;
}

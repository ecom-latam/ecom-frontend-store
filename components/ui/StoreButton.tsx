'use client';
import { Button } from 'zoui';
import type { ComponentProps } from 'react';
import { useStoreConfig } from '@/context/StoreConfigContext';

type Props = ComponentProps<typeof Button>;

export function StoreButton({ variant, ...props }: Props) {
  const { theme } = useStoreConfig();
  return <Button variant={(variant ?? theme ?? 'outlined') as Props['variant']} {...props} />;
}

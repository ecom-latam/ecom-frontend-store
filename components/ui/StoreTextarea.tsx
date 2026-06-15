'use client';
import { Textarea } from 'zoui';
import type { ComponentProps } from 'react';
import { useStoreConfig } from '@/context/StoreConfigContext';

type Props = ComponentProps<typeof Textarea>;

export function StoreTextarea({ variant, ...props }: Props) {
  const { theme } = useStoreConfig();
  return <Textarea variant={(variant ?? theme ?? 'outlined') as Props['variant']} {...props} />;
}

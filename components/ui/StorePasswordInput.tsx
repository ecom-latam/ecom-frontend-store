'use client';
import { PasswordInput } from 'zoui';
import type { ComponentProps } from 'react';
import { useStoreConfig } from '@/context/StoreConfigContext';

type Props = ComponentProps<typeof PasswordInput>;

export function StorePasswordInput({ variant, ...props }: Props) {
  const { theme } = useStoreConfig();
  return <PasswordInput variant={(variant ?? theme ?? 'outlined') as Props['variant']} {...props} />;
}

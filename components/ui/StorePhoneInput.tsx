'use client';
import { PhoneInput } from 'zoui';
import type { ComponentProps } from 'react';
import { useStoreConfig } from '@/context/StoreConfigContext';

type Props = ComponentProps<typeof PhoneInput>;

export function StorePhoneInput({ variant, ...props }: Props) {
  const { theme } = useStoreConfig();
  return <PhoneInput variant={(variant ?? theme ?? 'outlined') as Props['variant']} {...props} />;
}

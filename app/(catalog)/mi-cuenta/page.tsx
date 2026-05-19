'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function MiCuentaPage() {
  const router = useRouter();
  useEffect(() => { router.replace('/mi-cuenta/pedidos'); }, [router]);
  return null;
}

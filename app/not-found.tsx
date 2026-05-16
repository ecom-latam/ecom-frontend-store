'use client';

import { Button } from 'zoui';
import { useRouter } from 'next/navigation';

export default function NotFound() {
  const router = useRouter();
  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-6 text-center">
      <p className="text-6xl font-bold text-gray-200 mb-4">404</p>
      <h1 className="text-2xl font-semibold text-gray-900 mb-3">Página no encontrada</h1>
      <p className="text-gray-600 mb-8 max-w-sm">
        La página que buscás no existe o fue movida.
      </p>
      <Button variant="filled" shape="rounded" size="md" onClick={() => router.push('/productos')}>
        Ver productos
      </Button>
    </main>
  );
}

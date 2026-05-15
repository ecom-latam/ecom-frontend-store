import Link from 'next/link';

export default function NotFound() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-6 text-center">
      <p className="text-6xl font-bold text-gray-200 mb-4">404</p>
      <h1 className="text-2xl font-semibold text-gray-900 mb-3">Página no encontrada</h1>
      <p className="text-gray-600 mb-8 max-w-sm">
        La página que buscás no existe o fue movida.
      </p>
      <Link
        href="/products"
        className="bg-gray-900 text-white px-6 py-2.5 rounded-md text-sm font-medium hover:bg-gray-700"
      >
        Ver productos
      </Link>
    </main>
  );
}

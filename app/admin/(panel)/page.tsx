import { headers } from 'next/headers';
import Link from 'next/link';

export default async function AdminDashboardPage() {
  const headerStore = await headers();
  const slug = headerStore.get('x-store-slug') ?? '';

  return (
    <div>
      <h1 className="text-2xl font-semibold text-gray-900 mb-1">Dashboard</h1>
      <p className="text-sm text-gray-500 mb-8">
        Bienvenido al panel de administración de <span className="font-medium text-gray-700">{slug}</span>.
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-2xl">
        <Link
          href="/admin/products"
          className="block p-5 bg-white border border-gray-200 rounded-lg hover:border-gray-400 transition-colors"
        >
          <h2 className="text-sm font-semibold text-gray-900 mb-1">Productos</h2>
          <p className="text-xs text-gray-500">Administrá el catálogo de tu tienda.</p>
        </Link>
      </div>
    </div>
  );
}

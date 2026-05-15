'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { EmptyState, ICON_BOX } from '@/components/ui/EmptyState';

type Category = {
  _id: string;
  name: string;
  slug: string;
  status: string;
  parentId: string | null;
};

export default function AdminCategoriesPage() {
  const router = useRouter();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [archiving, setArchiving] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/admin/categories');
      if (!res.ok) {
        if (res.status === 401) { router.replace('/admin/login'); return; }
        setError('No se pudieron cargar las categorías.');
        return;
      }
      setCategories(await res.json());
    } catch {
      setError('Error de conexión.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  async function handleArchive(id: string, name: string) {
    if (!confirm(`¿Archivar la categoría "${name}"?`)) return;
    setArchiving(id);
    try {
      const res = await fetch(`/api/admin/categories/${id}`, { method: 'DELETE' });
      if (!res.ok) { alert('No se pudo archivar la categoría.'); return; }
      setCategories((prev) => prev.filter((c) => c._id !== id));
    } catch {
      alert('Error de conexión.');
    } finally {
      setArchiving(null);
    }
  }

  const active = categories.filter((c) => c.status === 'active');
  const archived = categories.filter((c) => c.status === 'archived');

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">Categorías</h1>
        <Link
          href="/admin/categories/new"
          className="bg-gray-900 text-white text-sm font-medium px-4 py-2 rounded-md hover:bg-gray-700 transition-colors"
        >
          Nueva categoría
        </Link>
      </div>

      {loading && <p className="text-sm text-gray-500">Cargando categorías...</p>}
      {!loading && error && <p className="text-sm text-red-600">{error}</p>}

      {!loading && !error && active.length === 0 && (
        <EmptyState
          icon={ICON_BOX}
          title="Todavía no tenés categorías."
          tone="neutral"
          bordered
          actions={
            <Link href="/admin/categories/new" className="btn btn--sm btn--rounded btn--filled">
              Crear categoría
            </Link>
          }
        />
      )}

      {!loading && !error && active.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden mb-6">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Nombre</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Slug</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {active.map((cat) => (
                <tr key={cat._id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 font-medium text-gray-900">{cat.name}</td>
                  <td className="px-4 py-3 text-gray-500 font-mono text-xs">{cat.slug}</td>
                  <td className="px-4 py-3 text-right">
                    <Link
                      href={`/admin/categories/${cat._id}/edit`}
                      className="text-gray-500 hover:text-gray-900 mr-4"
                    >
                      Editar
                    </Link>
                    <button
                      onClick={() => handleArchive(cat._id, cat.name)}
                      disabled={archiving === cat._id}
                      className="text-red-500 hover:text-red-700 disabled:opacity-50"
                    >
                      {archiving === cat._id ? 'Archivando...' : 'Archivar'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {!loading && !error && archived.length > 0 && (
        <details className="text-sm text-gray-400">
          <summary className="cursor-pointer hover:text-gray-600 mb-2">
            {archived.length} categoría{archived.length !== 1 ? 's' : ''} archivada{archived.length !== 1 ? 's' : ''}
          </summary>
          <ul className="mt-2 space-y-1 pl-2">
            {archived.map((cat) => (
              <li key={cat._id} className="text-gray-400">{cat.name}</li>
            ))}
          </ul>
        </details>
      )}
    </div>
  );
}

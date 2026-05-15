'use client';

import { useState, useEffect, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

type Category = { _id: string; name: string };

const ERRORS: Record<string, string> = {
  MISSING_NAME: 'El nombre es obligatorio.',
  SLUG_CONFLICT: 'Ya existe una categoría con ese nombre.',
  INTERNAL_ERROR: 'Error del servidor. Intentá de nuevo.',
};

export default function AdminCategoryNewPage() {
  const router = useRouter();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch('/api/admin/categories')
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) setCategories(data.filter((c) => c.status === 'active'));
      })
      .catch(() => {});
  }, []);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError('');
    setLoading(true);
    const form = new FormData(e.currentTarget);
    const parentId = form.get('parentId') as string;

    try {
      const res = await fetch('/api/admin/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.get('name') as string,
          ...(parentId ? { parentId } : {}),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        if (res.status === 401) { router.replace('/admin/login'); return; }
        setError(data.error ?? 'INTERNAL_ERROR');
        return;
      }
      router.push('/admin/categories');
    } catch {
      setError('INTERNAL_ERROR');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <div className="mb-6">
        <Link href="/admin/categories" className="text-sm text-gray-500 hover:text-gray-700">
          ← Volver a categorías
        </Link>
        <h1 className="text-2xl font-semibold text-gray-900 mt-2">Nueva categoría</h1>
      </div>

      <form onSubmit={handleSubmit} className="max-w-sm space-y-4">
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
            Nombre <span className="text-red-500">*</span>
          </label>
          <input
            id="name"
            name="name"
            type="text"
            required
            autoFocus
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
          />
        </div>

        {categories.length > 0 && (
          <div>
            <label htmlFor="parentId" className="block text-sm font-medium text-gray-700 mb-1">
              Categoría padre
            </label>
            <select
              id="parentId"
              name="parentId"
              defaultValue=""
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 bg-white"
            >
              <option value="">Sin categoría padre</option>
              {categories.map((c) => (
                <option key={c._id} value={c._id}>{c.name}</option>
              ))}
            </select>
          </div>
        )}

        {error && <p className="text-sm text-red-600">{ERRORS[error] ?? error}</p>}

        <div className="flex items-center gap-3 pt-1">
          <button
            type="submit"
            disabled={loading}
            className="bg-gray-900 text-white text-sm font-medium px-5 py-2 rounded-md hover:bg-gray-700 disabled:opacity-50 transition-colors"
          >
            {loading ? 'Creando...' : 'Crear categoría'}
          </button>
          <Link href="/admin/categories" className="text-sm text-gray-500 hover:text-gray-700">
            Cancelar
          </Link>
        </div>
      </form>
    </div>
  );
}

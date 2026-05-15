'use client';

import { useState, useEffect, FormEvent } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';

type Category = { _id: string; name: string; parentId: string | null; status: string };

const ERRORS: Record<string, string> = {
  MISSING_NAME: 'El nombre es obligatorio.',
  INVALID_NAME: 'El nombre no es válido.',
  SLUG_CONFLICT: 'Ya existe una categoría con ese nombre.',
  EMPTY_UPDATE: 'No hay cambios para guardar.',
  INTERNAL_ERROR: 'Error del servidor. Intentá de nuevo.',
};

export default function AdminCategoryEditPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const id = params.id;

  const [category, setCategory] = useState<Category | null>(null);
  const [allCategories, setAllCategories] = useState<Category[]>([]);
  const [fetchError, setFetchError] = useState('');
  const [loading, setLoading] = useState(false);
  const [saveError, setSaveError] = useState('');

  useEffect(() => {
    Promise.all([
      fetch(`/api/admin/categories/${id}`).then((r) => r.json()),
      fetch('/api/admin/categories').then((r) => r.json()),
    ])
      .then(([cat, all]) => {
        if (cat.error) { setFetchError('No se pudo cargar la categoría.'); return; }
        setCategory(cat);
        if (Array.isArray(all)) {
          setAllCategories(all.filter((c: Category) => c._id !== id && c.status === 'active'));
        }
      })
      .catch(() => setFetchError('Error de conexión.'));
  }, [id]);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaveError('');
    setLoading(true);
    const form = new FormData(e.currentTarget);
    const parentId = form.get('parentId') as string;

    try {
      const res = await fetch(`/api/admin/categories/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.get('name') as string,
          parentId: parentId || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        if (res.status === 401) { router.replace('/admin/login'); return; }
        setSaveError(data.error ?? 'INTERNAL_ERROR');
        return;
      }
      router.push('/admin/categories');
    } catch {
      setSaveError('INTERNAL_ERROR');
    } finally {
      setLoading(false);
    }
  }

  if (fetchError) {
    return (
      <div>
        <Link href="/admin/categories" className="text-sm text-gray-500 hover:text-gray-700">
          ← Volver a categorías
        </Link>
        <p className="mt-4 text-sm text-red-600">{fetchError}</p>
      </div>
    );
  }

  if (!category) return <p className="text-sm text-gray-500">Cargando...</p>;

  return (
    <div>
      <div className="mb-6">
        <Link href="/admin/categories" className="text-sm text-gray-500 hover:text-gray-700">
          ← Volver a categorías
        </Link>
        <h1 className="text-2xl font-semibold text-gray-900 mt-2">Editar categoría</h1>
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
            defaultValue={category.name}
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
          />
        </div>

        {allCategories.length > 0 && (
          <div>
            <label htmlFor="parentId" className="block text-sm font-medium text-gray-700 mb-1">
              Categoría padre
            </label>
            <select
              id="parentId"
              name="parentId"
              defaultValue={category.parentId ?? ''}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 bg-white"
            >
              <option value="">Sin categoría padre</option>
              {allCategories.map((c) => (
                <option key={c._id} value={c._id}>{c.name}</option>
              ))}
            </select>
          </div>
        )}

        {saveError && <p className="text-sm text-red-600">{ERRORS[saveError] ?? saveError}</p>}

        <div className="flex items-center gap-3 pt-1">
          <button
            type="submit"
            disabled={loading}
            className="bg-gray-900 text-white text-sm font-medium px-5 py-2 rounded-md hover:bg-gray-700 disabled:opacity-50 transition-colors"
          >
            {loading ? 'Guardando...' : 'Guardar cambios'}
          </button>
          <Link href="/admin/categories" className="text-sm text-gray-500 hover:text-gray-700">
            Cancelar
          </Link>
        </div>
      </form>
    </div>
  );
}

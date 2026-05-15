'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { EmptyState, ICON_BOX } from '@/components/ui/EmptyState';

type StoreOption = {
  _id: string;
  name: string;
  values: string[];
};

export default function AdminVariablesPage() {
  const router = useRouter();
  const [options, setOptions] = useState<StoreOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [deleting, setDeleting] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/admin/options');
      if (!res.ok) {
        if (res.status === 401) { router.replace('/admin/login'); return; }
        setError('No se pudieron cargar las variables.');
        return;
      }
      setOptions(await res.json());
    } catch {
      setError('Error de conexión.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  async function handleDelete(id: string, name: string) {
    if (!confirm(`¿Eliminar la variable "${name}"? Esta acción es permanente.`)) return;
    setDeleting(id);
    try {
      const res = await fetch(`/api/admin/options/${id}`, { method: 'DELETE' });
      if (!res.ok) { alert('No se pudo eliminar la variable.'); return; }
      setOptions((prev) => prev.filter((o) => o._id !== id));
    } catch {
      alert('Error de conexión.');
    } finally {
      setDeleting(null);
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">Variables</h1>
        <Link
          href="/admin/variables/new"
          className="bg-gray-900 text-white text-sm font-medium px-4 py-2 rounded-md hover:bg-gray-700 transition-colors"
        >
          Nueva variable
        </Link>
      </div>

      {loading && <p className="text-sm text-gray-500">Cargando variables...</p>}
      {!loading && error && <p className="text-sm text-red-600">{error}</p>}

      {!loading && !error && options.length === 0 && (
        <EmptyState
          icon={ICON_BOX}
          title="Todavía no tenés variables."
          description="Las variables definen las opciones disponibles para tus productos (ej: Color, Talle)."
          tone="neutral"
          bordered
          actions={
            <Link href="/admin/variables/new" className="bg-gray-900 text-white text-sm font-medium px-4 py-2 rounded-md hover:bg-gray-700 transition-colors">
              Crear variable
            </Link>
          }
        />
      )}

      {!loading && !error && options.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Nombre</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Valores</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {options.map((opt) => (
                <tr key={opt._id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 font-medium text-gray-900">{opt.name}</td>
                  <td className="px-4 py-3 text-gray-500">
                    <div className="flex flex-wrap gap-1">
                      {opt.values.map((v) => (
                        <span
                          key={v}
                          className="inline-block bg-gray-100 text-gray-700 text-xs px-2 py-0.5 rounded-full"
                        >
                          {v}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right whitespace-nowrap">
                    <Link
                      href={`/admin/variables/${opt._id}/edit`}
                      className="text-gray-500 hover:text-gray-900 mr-4"
                    >
                      Editar
                    </Link>
                    <button
                      onClick={() => handleDelete(opt._id, opt.name)}
                      disabled={deleting === opt._id}
                      className="text-red-500 hover:text-red-700 disabled:opacity-50"
                    >
                      {deleting === opt._id ? 'Eliminando...' : 'Eliminar'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

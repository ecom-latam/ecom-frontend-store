'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { Suspense } from 'react';
import { useAdminRole } from '@/app/admin/(panel)/AdminRoleProvider';
import { Badge } from '@/components/ui/Badge';
import { Pagination } from '@/components/ui/Pagination';
import { EmptyState, ICON_BOX, ICON_SEARCH } from '@/components/ui/EmptyState';

type BadgeType = 'neutral' | 'success' | 'warning' | 'error';
const STATUS_BADGE: Record<string, BadgeType> = {
  draft: 'neutral',
  active: 'success',
  paused: 'warning',
  archived: 'error',
};

function StockCell({ productId, initialStock }: { productId: string; initialStock: number }) {
  const [value, setValue] = useState(initialStock);
  const [saving, setSaving] = useState(false);
  const [hasError, setHasError] = useState(false);
  const savedRef = useRef(initialStock);

  async function save() {
    const next = value;
    if (next === savedRef.current || saving) return;
    setSaving(true);
    setHasError(false);
    try {
      const res = await fetch(`/api/admin/products/${productId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stock: next }),
      });
      if (!res.ok) { setValue(savedRef.current); setHasError(true); return; }
      savedRef.current = next;
    } catch {
      setValue(savedRef.current);
      setHasError(true);
    } finally {
      setSaving(false);
    }
  }

  return (
    <input
      type="number"
      min="0"
      step="1"
      value={value}
      disabled={saving}
      onChange={(e) => { setValue(parseInt(e.target.value, 10) || 0); setHasError(false); }}
      onBlur={save}
      onKeyDown={(e) => { if (e.key === 'Enter') e.currentTarget.blur(); }}
      className={`w-16 border rounded px-1.5 py-0.5 text-sm text-gray-600 focus:outline-none focus:ring-1 disabled:opacity-50 ${
        hasError ? 'border-red-400 focus:ring-red-400' : 'border-transparent focus:border-gray-300 focus:ring-gray-300'
      }`}
      title={hasError ? 'No se pudo guardar el stock' : undefined}
    />
  );
}

type Product = {
  _id: string;
  name: string;
  price: number;
  stock: number;
  status: string;
};

type ListResponse = {
  data: Product[];
  total: number;
  limit: number;
  page: number;
};

type Category = { _id: string; name: string };

const STATUS_LABELS: Record<string, string> = {
  draft: 'Borrador',
  active: 'Activo',
  paused: 'Pausado',
  archived: 'Archivado',
};

const LIMIT = 20;

function ProductListContent() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const role = useAdminRole();
  const isSeller = role === 'Seller';

  const page = parseInt(searchParams.get('page') ?? '1', 10);
  const q = searchParams.get('q') ?? '';
  const status = searchParams.get('status') ?? '';
  const categoryId = searchParams.get('categoryId') ?? '';

  const [response, setResponse] = useState<ListResponse | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [deleting, setDeleting] = useState<string | null>(null);
  const [search, setSearch] = useState(q);

  function buildUrl(overrides: Record<string, string | number>) {
    const params = new URLSearchParams();
    const merged = { page, q, status, categoryId, ...overrides };
    if (merged.q) params.set('q', String(merged.q));
    if (merged.status) params.set('status', String(merged.status));
    if (merged.categoryId) params.set('categoryId', String(merged.categoryId));
    if (Number(merged.page) > 1) params.set('page', String(merged.page));
    const qs = params.toString();
    return `${pathname}${qs ? `?${qs}` : ''}`;
  }

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams();
      params.set('limit', String(LIMIT));
      if (page > 1) params.set('page', String(page));
      if (q) params.set('q', q);
      if (status) params.set('status', status);
      if (categoryId) params.set('categoryId', categoryId);

      const res = await fetch(`/api/admin/products?${params}`);
      if (!res.ok) {
        if (res.status === 401) { router.replace('/admin/login'); return; }
        setError('No se pudieron cargar los productos.');
        return;
      }
      setResponse(await res.json());
    } catch {
      setError('Error de conexión.');
    } finally {
      setLoading(false);
    }
  }, [page, q, status, categoryId, router]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    fetch('/api/admin/categories')
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) setCategories(data.filter((c: Category & { status: string }) => c.status === 'active'));
      })
      .catch(() => {});
  }, []);

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    router.push(buildUrl({ q: search, page: 1 }));
  }

  async function handleDelete(id: string, name: string) {
    if (!confirm(`¿Archivar "${name}"?`)) return;
    setDeleting(id);
    try {
      const res = await fetch(`/api/admin/products/${id}`, { method: 'DELETE' });
      if (!res.ok) { alert('No se pudo archivar el producto.'); return; }
      setResponse((prev) => prev ? { ...prev, data: prev.data.filter((p) => p._id !== id), total: prev.total - 1 } : prev);
    } catch {
      alert('Error de conexión.');
    } finally {
      setDeleting(null);
    }
  }

  const totalPages = response ? Math.ceil(response.total / LIMIT) : 1;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">Productos</h1>
        {!isSeller && (
          <Link href="/admin/products/new" className="btn btn--filled btn--rounded btn--sm">
            Nuevo producto
          </Link>
        )}
      </div>

      <div className="flex flex-wrap gap-3 mb-5">
        <form onSubmit={handleSearch} className="flex gap-2">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar productos..."
            className="border border-gray-300 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 w-52"
          />
          <button type="submit" className="bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm px-3 py-1.5 rounded-md transition-colors">
            Buscar
          </button>
          {q && (
            <button type="button" onClick={() => router.push(buildUrl({ q: '', page: 1 }))} className="text-sm text-gray-400 hover:text-gray-600">
              ✕
            </button>
          )}
        </form>

        <select
          value={categoryId}
          onChange={(e) => router.push(buildUrl({ categoryId: e.target.value, page: 1 }))}
          className="border border-gray-300 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 bg-white"
        >
          <option value="">Todas las categorías</option>
          {categories.map((c) => (
            <option key={c._id} value={c._id}>{c.name}</option>
          ))}
        </select>

        <select
          value={status}
          onChange={(e) => router.push(buildUrl({ status: e.target.value, page: 1 }))}
          className="border border-gray-300 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 bg-white"
        >
          <option value="">Todos los estados</option>
          {Object.entries(STATUS_LABELS).map(([val, label]) => (
            <option key={val} value={val}>{label}</option>
          ))}
        </select>

        {(q || status || categoryId) && (
          <button
            onClick={() => router.push(buildUrl({ q: '', status: '', categoryId: '', page: 1 }))}
            className="text-sm text-gray-400 hover:text-gray-600"
          >
            Limpiar filtros
          </button>
        )}
      </div>

      {loading && <p className="text-sm text-gray-500">Cargando productos...</p>}
      {!loading && error && <p className="text-sm text-red-600">{error}</p>}

      {!loading && !error && response?.data.length === 0 && (
        <EmptyState
          icon={q || status || categoryId ? ICON_SEARCH : ICON_BOX}
          title={q || status || categoryId ? 'No hay productos con esos filtros.' : 'Todavía no tenés productos.'}
          description={q || status || categoryId ? 'Probá ajustando los filtros.' : undefined}
          tone="neutral"
          bordered
          actions={
            !q && !status && !categoryId && !isSeller ? (
              <Link href="/admin/products/new" className="btn btn--sm btn--rounded btn--filled">
                Nuevo producto
              </Link>
            ) : (q || status || categoryId) ? (
              <button
                onClick={() => router.push(buildUrl({ q: '', status: '', categoryId: '', page: 1 }))}
                className="btn btn--sm btn--rounded btn--ghost"
              >
                Limpiar filtros
              </button>
            ) : undefined
          }
        />
      )}

      {!loading && !error && response && response.data.length > 0 && (
        <>
          <div className="bg-white border border-gray-200 rounded-lg overflow-hidden mb-4">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Nombre</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Precio</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Stock</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Estado</th>
                  {!isSeller && <th className="px-4 py-3" />}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {response.data.map((product) => (
                  <tr key={product._id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 font-medium text-gray-900">{product.name}</td>
                    <td className="px-4 py-3 text-gray-600">${product.price.toLocaleString('es-AR')}</td>
                    <td className="px-4 py-3">
                      {isSeller
                        ? <span className="text-sm text-gray-600">{product.stock}</span>
                        : <StockCell productId={product._id} initialStock={product.stock} />}
                    </td>
                    <td className="px-4 py-3">
                      <Badge type={STATUS_BADGE[product.status] ?? 'neutral'} shape="pill">
                        {STATUS_LABELS[product.status] ?? product.status}
                      </Badge>
                    </td>
                    {!isSeller && (
                      <td className="px-4 py-3 text-right">
                        <Link href={`/admin/products/${product._id}/edit`} className="text-gray-500 hover:text-gray-900 mr-4">
                          Editar
                        </Link>
                        <button
                          onClick={() => handleDelete(product._id, product.name)}
                          disabled={deleting === product._id}
                          className="text-red-500 hover:text-red-700 disabled:opacity-50"
                        >
                          {deleting === product._id ? 'Archivando...' : 'Archivar'}
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">{response.total} productos en total</span>
              <Pagination
                page={page}
                totalPages={totalPages}
                variant="compact"
                onPageChange={(p) => router.push(buildUrl({ page: p }))}
              />
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default function AdminProductsPage() {
  return (
    <Suspense>
      <ProductListContent />
    </Suspense>
  );
}

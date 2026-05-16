'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { isAxiosError } from 'axios';
import { products as productsApi, categories as categoriesApi } from '@/utils/api';
import type { Product, ProductPayload, ProductStatus, Category } from '@/utils/api';

// ─── Constants ───────────────────────────────────────────────────────────────

const STATUS_LABELS: Record<ProductStatus, string> = {
  active:   'Activo',
  draft:    'Borrador',
  paused:   'Inactivo',
  archived: 'Archivado',
};

const STATUS_BADGE: Record<ProductStatus, string> = {
  active:   'success',
  draft:    'neutral',
  paused:   'warning',
  archived: 'error',
};

const FILTER_OPTIONS: { label: string; value: ProductStatus | '' }[] = [
  { label: 'Todos', value: '' },
  { label: 'Activos', value: 'active' },
  { label: 'Borradores', value: 'draft' },
  { label: 'Inactivos', value: 'paused' },
];

const LIMIT = 20;

const EMPTY_FORM: ProductPayload = {
  name: '',
  description: '',
  price: 0,
  salePrice: null,
  stock: 0,
  categoryId: null,
  status: 'draft',
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatPrice(n: number) {
  return '$' + n.toLocaleString('es-AR');
}

function MainImage({ images }: { images: Product['images'] }) {
  const main = images.find(i => i.isMain) ?? images[0];
  if (!main) {
    return (
      <div style={{ width: 40, height: 40, borderRadius: 'var(--radius-md)', background: 'var(--color-bg-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--color-fg-disabled)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="3" width="18" height="18" rx="2" />
          <circle cx="8.5" cy="8.5" r="1.5" />
          <path d="m21 15-5-5L5 21" />
        </svg>
      </div>
    );
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={main.url} alt="" style={{ width: 40, height: 40, borderRadius: 'var(--radius-md)', objectFit: 'cover', border: '1px solid var(--color-border-default)' }} />
  );
}

// ─── Confirm Modal ────────────────────────────────────────────────────────────

interface ConfirmModalProps {
  title: string;
  message: string;
  confirmLabel: string;
  danger?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

function ConfirmModal({ title, message, confirmLabel, danger = false, onConfirm, onCancel }: ConfirmModalProps) {
  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="modal modal--sm" onClick={(e) => e.stopPropagation()}>
        <div className="modal__header">
          <h3 className="modal__title">{title}</h3>
        </div>
        <div className="modal__body">
          <p style={{ fontSize: 'var(--font-size-base)', color: 'var(--color-fg-secondary)', lineHeight: 'var(--line-height-normal)' }}>{message}</p>
        </div>
        <div className="modal__footer">
          <button
            onClick={onConfirm}
            className="btn btn--md btn--rounded btn--filled"
            style={danger ? { background: 'var(--color-error-500)', borderColor: 'var(--color-error-500)' } : undefined}
          >
            {confirmLabel}
          </button>
          <button onClick={onCancel} className="btn btn--md btn--rounded btn--outlined">Cancelar</button>
        </div>
      </div>
    </div>
  );
}

// ─── Product Drawer ───────────────────────────────────────────────────────────

interface DrawerProps {
  product: Product | null;
  categories: Category[];
  onClose: () => void;
  onSaved: () => void;
}

function ProductDrawer({ product, categories, onClose, onSaved }: DrawerProps) {
  const [form, setForm] = useState<ProductPayload>(
    product
      ? { name: product.name, description: product.description, price: product.price, salePrice: product.salePrice, stock: product.stock, categoryId: product.categoryId, status: product.status }
      : EMPTY_FORM
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  function set<K extends keyof ProductPayload>(key: K, value: ProductPayload[K]) {
    setForm(f => ({ ...f, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (product) {
        await productsApi.update(product._id, form);
      } else {
        await productsApi.create(form);
      }
      onSaved();
    } catch (err) {
      if (isAxiosError(err)) {
        setError(err.response?.data?.error ?? 'Error al guardar el producto.');
      } else {
        setError('Error inesperado.');
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="drawer-overlay" onClick={onClose}>
      <aside className="drawer drawer--right drawer--lg" onClick={(e) => e.stopPropagation()}>
        <div className="drawer__header">
          <h2 className="drawer__title">{product ? 'Editar producto' : 'Nuevo producto'}</h2>
          <button onClick={onClose} className="btn btn--ghost btn--square btn--sm drawer__close" aria-label="Cerrar">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'contents' }}>
          <div className="drawer__body" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

            <div className="field field--outlined">
              <label className="field__label">Nombre *</label>
              <div className="field__control">
                <input required value={form.name} onChange={e => set('name', e.target.value)} placeholder="Ej: Remera de algodón" />
              </div>
            </div>

            <div className="field field--outlined field--textarea">
              <label className="field__label">Descripción</label>
              <div className="field__control">
                <textarea value={form.description ?? ''} onChange={e => set('description', e.target.value)} placeholder="Descripción del producto" />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div className="field field--outlined">
                <label className="field__label">Precio *</label>
                <div className="field__control">
                  <input required type="number" min={0} step={0.01} value={form.price} onChange={e => set('price', parseFloat(e.target.value) || 0)} />
                </div>
              </div>
              <div className="field field--outlined">
                <label className="field__label">Precio de oferta</label>
                <div className="field__control">
                  <input type="number" min={0} step={0.01} value={form.salePrice ?? ''} onChange={e => set('salePrice', e.target.value ? parseFloat(e.target.value) : null)} placeholder="Opcional" />
                </div>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div className="field field--outlined">
                <label className="field__label">Stock</label>
                <div className="field__control">
                  <input type="number" min={0} value={form.stock ?? 0} onChange={e => set('stock', parseInt(e.target.value) || 0)} />
                </div>
              </div>
              <div className="field field--outlined">
                <label className="field__label">Categoría</label>
                <div className="field__control">
                  <select value={form.categoryId ?? ''} onChange={e => set('categoryId', e.target.value || null)}>
                    <option value="">Sin categoría</option>
                    {categories.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
                  </select>
                  <svg className="field__chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="6 9 12 15 18 9" /></svg>
                </div>
              </div>
            </div>

            <div className="field field--outlined">
              <label className="field__label">Estado</label>
              <div className="field__control">
                <select value={form.status} onChange={e => set('status', e.target.value as ProductStatus)}>
                  {(Object.keys(STATUS_LABELS) as ProductStatus[]).filter(s => s !== 'archived').map(s => (
                    <option key={s} value={s}>{STATUS_LABELS[s]}</option>
                  ))}
                </select>
                <svg className="field__chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="6 9 12 15 18 9" /></svg>
              </div>
            </div>

            {error && <p className="field__hint field__hint--error">{error}</p>}
          </div>

          <div className="drawer__footer" style={{ flexDirection: 'row', justifyContent: 'flex-end' }}>
            <button type="button" onClick={onClose} className="btn btn--md btn--rounded btn--outlined">Cancelar</button>
            <button type="submit" disabled={loading} className="btn btn--md btn--rounded btn--filled">
              {loading ? 'Guardando...' : product ? 'Guardar cambios' : 'Crear producto'}
            </button>
          </div>
        </form>
      </aside>
    </div>
  );
}

// ─── Page ────────────────────────────────────────────────────────────────────

export default function GestionProductosPage() {
  const [productList, setProductList] = useState<Product[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<ProductStatus | ''>('');

  const [categoryMap, setCategoryMap] = useState<Record<string, string>>({});
  const [categoryList, setCategoryList] = useState<Category[]>([]);

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);
  const [confirmModal, setConfirmModal] = useState<{ title: string; message: string; confirmLabel: string; danger?: boolean; onConfirm: () => void } | null>(null);

  const searchTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const totalPages = Math.ceil(total / LIMIT);

  const load = useCallback(async (p: number, q: string, status: ProductStatus | '') => {
    setLoading(true);
    try {
      const params = { page: p, limit: LIMIT, ...(q ? { q } : {}), ...(status ? { status } : {}) };
      const { data } = await productsApi.list(params);
      setProductList(data.data);
      setTotal(data.total);
    } catch {
      // silent — table shows empty state
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(page, search, statusFilter); }, [load, page, statusFilter]);

  useEffect(() => {
    categoriesApi.list().then(({ data }) => {
      setCategoryList(data);
      setCategoryMap(Object.fromEntries(data.map(c => [c._id, c.name])));
    }).catch(() => {});
  }, []);

  function handleSearch(value: string) {
    setSearch(value);
    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    searchTimeout.current = setTimeout(() => { setPage(1); load(1, value, statusFilter); }, 350);
  }

  function handleStatusFilter(value: ProductStatus | '') {
    setStatusFilter(value);
    setPage(1);
  }

  function openCreate() { setEditing(null); setDrawerOpen(true); }
  function openEdit(product: Product) { setEditing(product); setDrawerOpen(true); }

  function handleToggleStatus(product: Product) {
    const newStatus = product.status === 'active' ? 'paused' : 'active';
    const doToggle = async () => {
      setConfirmModal(null);
      try { await productsApi.update(product._id, { status: newStatus }); load(page, search, statusFilter); } catch { /* silent */ }
    };
    if (newStatus === 'paused') {
      setConfirmModal({ title: 'Desactivar producto', message: `¿Querés desactivar "${product.name}"? Dejará de estar visible en la tienda.`, confirmLabel: 'Desactivar', onConfirm: doToggle });
    } else {
      doToggle();
    }
  }

  function handleDelete(product: Product) {
    setConfirmModal({
      title: 'Eliminar producto',
      message: `¿Querés eliminar "${product.name}"? Esta acción no se puede deshacer.`,
      confirmLabel: 'Eliminar',
      danger: true,
      onConfirm: async () => {
        setConfirmModal(null);
        try { await productsApi.delete(product._id); load(page, search, statusFilter); } catch { /* silent */ }
      },
    });
  }

  function handleSaved() { setDrawerOpen(false); load(page, search, statusFilter); }

  return (
    <main style={{ padding: '32px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h1 style={{ fontSize: '22px', fontWeight: 700, color: 'var(--color-fg-primary)' }}>Productos</h1>
        <button onClick={openCreate} className="btn btn--md btn--rounded btn--filled">
          + Nuevo producto
        </button>
      </div>

      <div style={{ display: 'flex', gap: '12px', marginBottom: '20px' }}>
        <div className="field field--outlined field--sm" style={{ width: 280 }}>
          <div className="field__control">
            <input value={search} onChange={e => handleSearch(e.target.value)} placeholder="Buscar por nombre..." />
          </div>
        </div>
        <div className="field field--outlined field--sm" style={{ width: 160 }}>
          <div className="field__control">
            <select value={statusFilter} onChange={e => handleStatusFilter(e.target.value as ProductStatus | '')}>
              {FILTER_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
            <svg className="field__chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="6 9 12 15 18 9" /></svg>
          </div>
        </div>
      </div>

      <div className="table-wrapper">
        <table className="table table--compact">
          <thead className="table__head">
            <tr>
              <th className="table__th" style={{ width: 56 }} />
              <th className="table__th">Nombre</th>
              <th className="table__th" style={{ textAlign: 'center' }}>Estado</th>
              <th className="table__th" style={{ textAlign: 'center' }}>Categoría</th>
              <th className="table__th" style={{ textAlign: 'center' }}>Precio</th>
              <th className="table__th" style={{ textAlign: 'center' }}>Stock</th>
              <th className="table__th table__th--right">Acciones</th>
            </tr>
          </thead>
          <tbody className="table__body">
            {loading ? (
              <tr className="table__row">
                <td className="table__td table__td--muted" colSpan={7} style={{ textAlign: 'center', padding: '48px' }}>Cargando...</td>
              </tr>
            ) : productList.length === 0 ? (
              <tr className="table__row">
                <td className="table__td table__td--muted" colSpan={7} style={{ textAlign: 'center', padding: '48px' }}>
                  {search || statusFilter ? 'Sin resultados para los filtros aplicados.' : 'Todavía no hay productos. ¡Creá el primero!'}
                </td>
              </tr>
            ) : productList.map((product) => (
              <tr key={product._id} className="table__row">
                <td className="table__td"><MainImage images={product.images} /></td>
                <td className="table__td" style={{ maxWidth: 240 }}>
                  <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontWeight: 500 }}>{product.name}</div>
                  {product.salePrice !== null && (
                    <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-fg-muted)', marginTop: 2 }}>Oferta: {formatPrice(product.salePrice)}</div>
                  )}
                </td>
                <td className="table__td" style={{ textAlign: 'center' }}>
                  <span className={`badge badge--pill badge--${STATUS_BADGE[product.status]}`}>{STATUS_LABELS[product.status]}</span>
                </td>
                <td className="table__td table__td--muted" style={{ textAlign: 'center' }}>
                  {product.categoryId ? (categoryMap[product.categoryId] ?? '—') : '—'}
                </td>
                <td className="table__td" style={{ textAlign: 'center', whiteSpace: 'nowrap' }}>{formatPrice(product.price)}</td>
                <td className="table__td" style={{ textAlign: 'center' }}>{product.stock}</td>
                <td className="table__td table__td--right">
                  <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end' }}>
                    <button
                      onClick={() => handleToggleStatus(product)}
                      className="btn btn--sm btn--rounded btn--ghost"
                      style={{ color: product.status === 'active' ? 'var(--color-warning-700)' : 'var(--color-success-700)', minWidth: 90 }}
                    >
                      {product.status === 'active' ? 'Desactivar' : 'Activar'}
                    </button>
                    <button onClick={() => openEdit(product)} className="btn btn--sm btn--rounded btn--ghost">Editar</button>
                    <button onClick={() => handleDelete(product)} className="btn btn--sm btn--rounded btn--ghost" style={{ color: 'var(--color-error-500)' }}>Eliminar</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '16px' }}>
          <span style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-fg-muted)' }}>
            {total} productos · página {page} de {totalPages}
          </span>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="btn btn--sm btn--rounded btn--outlined">← Anterior</button>
            <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="btn btn--sm btn--rounded btn--outlined">Siguiente →</button>
          </div>
        </div>
      )}

      {drawerOpen && (
        <ProductDrawer product={editing} categories={categoryList} onClose={() => setDrawerOpen(false)} onSaved={handleSaved} />
      )}

      {confirmModal && (
        <ConfirmModal
          title={confirmModal.title}
          message={confirmModal.message}
          confirmLabel={confirmModal.confirmLabel}
          danger={confirmModal.danger}
          onConfirm={confirmModal.onConfirm}
          onCancel={() => setConfirmModal(null)}
        />
      )}
    </main>
  );
}

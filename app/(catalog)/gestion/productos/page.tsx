'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { isAxiosError } from 'axios';
import { products as productsApi, categories as categoriesApi } from '@/utils/api';
import type { Product, ProductPayload, ProductStatus, Category } from '@/utils/api';
import { Modal, Drawer, Table, Badge, Input, Textarea, Select, Button, Pagination } from 'zoui';

// ─── Constants ───────────────────────────────────────────────────────────────

const STATUS_LABELS: Record<ProductStatus, string> = {
  active:   'Activo',
  draft:    'Borrador',
  paused:   'Inactivo',
  archived: 'Archivado',
};

const STATUS_BADGE: Record<ProductStatus, 'success' | 'neutral' | 'warning' | 'error'> = {
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
    <Modal size="sm" onClose={onCancel}>
      <Modal.Header>{title}</Modal.Header>
      <Modal.Body>
        <p style={{ fontSize: 'var(--font-size-base)', color: 'var(--color-fg-secondary)', lineHeight: 'var(--line-height-normal)' }}>{message}</p>
      </Modal.Body>
      <Modal.Footer>
        <Button
          variant="filled"
          shape="rounded"
          size="md"
          onClick={onConfirm}
          style={danger ? { background: 'var(--color-error-500)', borderColor: 'var(--color-error-500)' } : undefined}
        >
          {confirmLabel}
        </Button>
        <Button variant="outlined" shape="rounded" size="md" onClick={onCancel}>Cancelar</Button>
      </Modal.Footer>
    </Modal>
  );
}

// ─── Product Drawer ───────────────────────────────────────────────────────────

interface ProductDrawerProps {
  product: Product | null;
  categories: Category[];
  onClose: () => void;
  onSaved: () => void;
}

function ProductDrawer({ product, categories, onClose, onSaved }: ProductDrawerProps) {
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
    <Drawer side="right" size="lg" onClose={onClose} label={product ? 'Editar producto' : 'Nuevo producto'}>
      <Drawer.Header onClose={onClose}>{product ? 'Editar producto' : 'Nuevo producto'}</Drawer.Header>
      <form onSubmit={handleSubmit} style={{ display: 'contents' }}>
        <Drawer.Body style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <Input
            label="Nombre *"
            required
            value={form.name}
            onChange={e => set('name', e.target.value)}
            placeholder="Ej: Remera de algodón"
            fullWidth
            testId="prod-name-input"
          />

          <Textarea
            label="Descripción"
            value={form.description ?? ''}
            onChange={e => set('description', e.target.value)}
            placeholder="Descripción del producto"
            fullWidth
          />

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <Input
              label="Precio *"
              required
              type="number"
              min={0}
              step={0.01}
              value={form.price}
              onChange={e => set('price', parseFloat(e.target.value) || 0)}
              fullWidth
              testId="prod-price-input"
            />
            <Input
              label="Precio de oferta"
              type="number"
              min={0}
              step={0.01}
              value={form.salePrice ?? ''}
              onChange={e => set('salePrice', e.target.value ? parseFloat(e.target.value) : null)}
              placeholder="Opcional"
              fullWidth
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <Input
              label="Stock"
              type="number"
              min={0}
              value={form.stock ?? 0}
              onChange={e => set('stock', parseInt(e.target.value) || 0)}
              fullWidth
              testId="prod-stock-input"
            />
            <Select
              label="Categoría"
              value={form.categoryId ?? ''}
              onChange={e => set('categoryId', e.target.value || null)}
              fullWidth
              testId="prod-category-select"
            >
              <option value="">Sin categoría</option>
              {categories.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
            </Select>
          </div>

          <Select
            label="Estado"
            value={form.status}
            onChange={e => set('status', e.target.value as ProductStatus)}
            fullWidth
          >
            {(Object.keys(STATUS_LABELS) as ProductStatus[]).filter(s => s !== 'archived').map(s => (
              <option key={s} value={s}>{STATUS_LABELS[s]}</option>
            ))}
          </Select>

          {error && (
            <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-error-600)' }}>{error}</p>
          )}
        </Drawer.Body>

        <Drawer.Footer style={{ flexDirection: 'row', justifyContent: 'flex-end' }}>
          <Button type="button" variant="outlined" shape="rounded" size="md" onClick={onClose}>Cancelar</Button>
          <Button type="submit" variant="filled" shape="rounded" size="md" disabled={loading} testId="prod-submit-btn">
            {loading ? 'Guardando...' : product ? 'Guardar cambios' : 'Crear producto'}
          </Button>
        </Drawer.Footer>
      </form>
    </Drawer>
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

  const [counts, setCounts] = useState<{ active: number; draft: number; paused: number }>({ active: 0, draft: 0, paused: 0 });

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

  const loadCounts = useCallback(async () => {
    try {
      const [active, draft, paused] = await Promise.all([
        productsApi.list({ page: 1, limit: 1, status: 'active' }),
        productsApi.list({ page: 1, limit: 1, status: 'draft' }),
        productsApi.list({ page: 1, limit: 1, status: 'paused' }),
      ]);
      setCounts({ active: active.data.total, draft: draft.data.total, paused: paused.data.total });
    } catch {
      // silent
    }
  }, []);

  useEffect(() => { load(page, search, statusFilter); }, [load, page, statusFilter]);

  useEffect(() => {
    categoriesApi.list().then(({ data }) => {
      setCategoryList(data);
      setCategoryMap(Object.fromEntries(data.map(c => [c._id, c.name])));
    }).catch(() => {});
    loadCounts();
  }, [loadCounts]);

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

  function handleSaved() { setDrawerOpen(false); load(page, search, statusFilter); loadCounts(); }

  return (
    <main style={{ padding: '32px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h1 style={{ fontSize: '22px', fontWeight: 700, color: 'var(--color-fg-primary)' }}>Productos</h1>
        <Button variant="filled" shape="rounded" size="md" onClick={openCreate} testId="prod-new-btn">
          + Nuevo producto
        </Button>
      </div>

      <div style={{ display: 'flex', gap: '12px', marginBottom: '20px' }}>
        <div style={{ width: 280 }}>
          <Input
            value={search}
            onChange={e => handleSearch(e.target.value)}
            placeholder="Buscar por nombre..."
            size="sm"
            fullWidth
          />
        </div>
        <div style={{ width: 160 }}>
          <Select
            value={statusFilter}
            onChange={e => handleStatusFilter(e.target.value as ProductStatus | '')}
            size="sm"
            fullWidth
          >
            {FILTER_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </Select>
        </div>
      </div>

      <Table>
        <Table.Root compact>
          <Table.Head>
            <tr>
              <Table.Th style={{ width: 56 }} />
              <Table.Th>Nombre</Table.Th>
              <Table.Th style={{ textAlign: 'center' }}>Estado</Table.Th>
              <Table.Th style={{ textAlign: 'center' }}>Categoría</Table.Th>
              <Table.Th style={{ textAlign: 'center' }}>Precio</Table.Th>
              <Table.Th style={{ textAlign: 'center' }}>Stock</Table.Th>
              <Table.Th style={{ textAlign: 'center' }}>Acciones</Table.Th>
            </tr>
          </Table.Head>
          <Table.Body>
            {loading ? (
              <Table.Row>
                <Table.Td colSpan={7} style={{ textAlign: 'center', padding: '48px', color: 'var(--color-fg-muted)' }}>Cargando...</Table.Td>
              </Table.Row>
            ) : productList.length === 0 ? (
              <Table.Row>
                <Table.Td colSpan={7} style={{ textAlign: 'center', padding: '48px', color: 'var(--color-fg-muted)' }}>
                  {search || statusFilter ? 'Sin resultados para los filtros aplicados.' : 'Todavía no hay productos. ¡Creá el primero!'}
                </Table.Td>
              </Table.Row>
            ) : productList.map((product) => (
              <Table.Row key={product._id}>
                <Table.Td><MainImage images={product.images} /></Table.Td>
                <Table.Td style={{ maxWidth: 240 }}>
                  <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontWeight: 500 }}>{product.name}</div>
                  {product.salePrice !== null && (
                    <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-fg-muted)', marginTop: 2 }}>Oferta: {formatPrice(product.salePrice)}</div>
                  )}
                </Table.Td>
                <Table.Td style={{ textAlign: 'center' }}>
                  <Badge type={STATUS_BADGE[product.status]} shape="pill">{STATUS_LABELS[product.status]}</Badge>
                </Table.Td>
                <Table.Td muted style={{ textAlign: 'center' }}>
                  {product.categoryId ? (categoryMap[product.categoryId] ?? '—') : '—'}
                </Table.Td>
                <Table.Td style={{ textAlign: 'center', whiteSpace: 'nowrap' }}>{formatPrice(product.price)}</Table.Td>
                <Table.Td style={{ textAlign: 'center' }}>{product.stock}</Table.Td>
                <Table.Td style={{ textAlign: 'center' }}>
                  <div style={{ display: 'flex', gap: '6px', justifyContent: 'center' }}>
                    <Button variant="filled" shape="rounded" size="sm" onClick={() => openEdit(product)}>Editar</Button>
                    <Button
                      variant="outlined"
                      shape="rounded"
                      size="sm"
                      onClick={() => handleToggleStatus(product)}
                      testId="prod-toggle-btn"
                    >
                      {product.status === 'active' ? 'Desactivar' : 'Activar'}
                    </Button>
                    <Button variant="ghost" shape="rounded" size="sm" onClick={() => handleDelete(product)} style={{ color: 'var(--color-error-500)' }}>Eliminar</Button>
                  </div>
                </Table.Td>
              </Table.Row>
            ))}
          </Table.Body>
        </Table.Root>
      </Table>

      {!loading && (counts.active + counts.draft + counts.paused) > 0 && (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '12px' }}>
          <p style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-fg-muted)' }}>
            {counts.active + counts.draft + counts.paused} producto{counts.active + counts.draft + counts.paused !== 1 ? 's' : ''} · {counts.active} activo{counts.active !== 1 ? 's' : ''} · {counts.draft} borrador{counts.draft !== 1 ? 'es' : ''} · {counts.paused} inactivo{counts.paused !== 1 ? 's' : ''}
          </p>
          {totalPages > 1 && <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />}
        </div>
      )}

      {drawerOpen && (
        <ProductDrawer product={editing} categories={categoryList.filter(c => c.status === 'active')} onClose={() => setDrawerOpen(false)} onSaved={handleSaved} />
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

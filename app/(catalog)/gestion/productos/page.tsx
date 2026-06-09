'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { products as productsApi, categories as categoriesApi } from '@/utils/api';
import { triggerErrorModal } from '@/lib/errorModal';
import type { Product, ProductPayload, ProductStatus, Category } from '@/utils/api';
import { Modal, Drawer, Table, Badge, Pagination, Text } from 'zoui';
import { StoreButton } from '@/components/ui/StoreButton';
import { StoreInput } from '@/components/ui/StoreInput';
import { StoreMoneyInput } from '@/components/ui/StoreMoneyInput';
import { StoreNumberInput } from '@/components/ui/StoreNumberInput';
import { StoreSelect } from '@/components/ui/StoreSelect';
import { StoreTextarea } from '@/components/ui/StoreTextarea';
import { ImageUploader } from '@/components/ui/ImageUploader';
import { useStoreConfig } from '@/context/StoreConfigContext';
import { formatPrice } from '@/lib/format';

// ─── Constants ───────────────────────────────────────────────────────────────

const STATUS_LABELS: Record<ProductStatus, string> = {
  active:   'Activo',
  draft:    'Borrador',
  paused:   'Inactivo',
  archived: 'Archivado',
};

const STATUS_BADGE: Record<ProductStatus, 'success' | 'neutral' | 'warning' | 'danger'> = {
  active:   'success',
  draft:    'neutral',
  paused:   'warning',
  archived: 'danger',
};

const FILTER_OPTIONS: { label: string; value: ProductStatus | '__all__' }[] = [
  { label: 'Todos', value: '__all__' },
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
    <Modal open size="sm" onClose={onCancel}>
      <Modal.Header>{title}</Modal.Header>
      <Modal.Body>
        <Text variant="body" color="secondary" as="p">{message}</Text>
      </Modal.Body>
      <Modal.Footer>
        <StoreButton
          size="md"
          onClick={onConfirm}
          style={danger ? { background: 'var(--color-error-500)', borderColor: 'var(--color-error-500)' } : undefined}
        >
          {confirmLabel}
        </StoreButton>
        <StoreButton variant="secondary" size="md" onClick={onCancel}>Cancelar</StoreButton>
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
  const [images, setImages] = useState<Product['images']>(product?.images ?? []);
  const [loading, setLoading] = useState(false);

  function set<K extends keyof ProductPayload>(key: K, value: ProductPayload[K]) {
    setForm(f => ({ ...f, [key]: value }));
  }

  async function handleSubmit() {
    if (!form.name.trim()) {
      triggerErrorModal({ message: 'El nombre es requerido.', severity: 'info' });
      return;
    }
    if (form.price <= 0) {
      triggerErrorModal({ message: 'El precio debe ser mayor a 0.', severity: 'info' });
      return;
    }
    if (form.stock < 0) {
      triggerErrorModal({ message: 'El stock no puede ser negativo.', severity: 'info' });
      return;
    }
    if (form.salePrice !== null && form.salePrice !== undefined && form.salePrice >= form.price) {
      triggerErrorModal({ message: 'El precio de oferta debe ser menor al precio normal.', severity: 'info' });
      return;
    }
    setLoading(true);
    try {
      if (product) {
        await productsApi.update(product._id, form);
      } else {
        await productsApi.create(form);
      }
      onSaved();
    } catch {
      // errors shown via modal (axios interceptor)
    } finally {
      setLoading(false);
    }
  }

  return (
    <Drawer open side="right" size="lg" onClose={onClose} label={product ? 'Editar producto' : 'Nuevo producto'}>
      <Drawer.Header>{product ? 'Editar producto' : 'Nuevo producto'}</Drawer.Header>
      <>
        <Drawer.Body style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <StoreInput
            label="Nombre *"
            value={form.name}
            onChange={e => set('name', e.target.value)}
            placeholder="Ej: Remera de algodón"
            fullWidth
            data-testid="prod-name-input"
          />

          <StoreTextarea
            label="Descripción"
            value={form.description ?? ''}
            onChange={e => set('description', e.target.value)}
            placeholder="Descripción del producto"
            fullWidth
          />

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <StoreMoneyInput
              label="Precio *"
              value={form.price}
              onValueChange={v => set('price', v ?? 0)}
              fullWidth
              data-testid="prod-price-input"
            />
            <StoreMoneyInput
              label="Precio de oferta"
              value={form.salePrice ?? null}
              onValueChange={v => set('salePrice', v)}
              placeholder="Opcional"
              fullWidth
              data-testid="prod-sale-price-input"
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <StoreNumberInput
              label="Stock"
              value={form.stock ? String(form.stock) : ''}
              onChange={e => set('stock', parseInt(e.target.value, 10) || 0)}
              fullWidth
              data-testid="prod-stock-input"
            />
            <StoreSelect
              label="Categoría"
              value={form.categoryId || '__none__'}
              onValueChange={val => set('categoryId', val === '__none__' ? null : val)}
              options={[
                { value: '__none__', label: 'Sin categoría' },
                ...categories.map(c => ({ value: c._id, label: c.name })),
              ]}
              fullWidth
              data-testid="prod-category-select"
            />
          </div>

          <StoreSelect
            label="Estado"
            value={form.status}
            onValueChange={val => set('status', val as ProductStatus)}
            options={(Object.keys(STATUS_LABELS) as ProductStatus[])
              .filter(s => s !== 'archived')
              .map(s => ({ value: s, label: STATUS_LABELS[s] }))}
            fullWidth
          />

          <div>
            <Text variant="label" style={{ display: 'block', marginBottom: 8 }}>Imágenes</Text>
            {product ? (
              <ImageUploader
                productId={product._id}
                images={images}
                onImagesChange={setImages}
              />
            ) : (
              <p style={{ fontSize: 13, color: 'var(--color-fg-muted)', margin: 0 }}>
                Guardá el producto primero para agregar imágenes.
              </p>
            )}
          </div>

        </Drawer.Body>

        <Drawer.Footer style={{ flexDirection: 'row', justifyContent: 'flex-end' }}>
          <StoreButton type="button" variant="secondary" size="md" onClick={onClose}>Cancelar</StoreButton>
          <StoreButton size="md" disabled={loading} onClick={handleSubmit} data-testid="prod-submit-btn">
            {loading ? 'Guardando...' : product ? 'Guardar cambios' : 'Crear producto'}
          </StoreButton>
        </Drawer.Footer>
      </>
    </Drawer>
  );
}

// ─── Page ────────────────────────────────────────────────────────────────────

export default function GestionProductosPage() {
  const { currency } = useStoreConfig();
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
        <Text variant="heading-2" as="h1">Productos</Text>
        <StoreButton size="md" onClick={openCreate} data-testid="prod-new-btn">
          + Nuevo producto
        </StoreButton>
      </div>

      <div style={{ display: 'flex', gap: '12px', marginBottom: '20px' }}>
        <div style={{ width: 280 }}>
          <StoreInput
            value={search}
            onChange={e => handleSearch(e.target.value)}
            placeholder="Buscar por nombre..."
            size="sm"
            fullWidth
          />
        </div>
        <div style={{ width: 160 }}>
          <StoreSelect
            value={statusFilter || '__all__'}
            onValueChange={val => handleStatusFilter(val === '__all__' ? '' : val as ProductStatus)}
            options={FILTER_OPTIONS.map(o => ({ value: o.value, label: o.label }))}
            size="sm"
            fullWidth
          />
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
                  <Text variant="body-sm" weight="medium" truncate>{product.name}</Text>
                  {product.salePrice !== null && (
                    <Text variant="caption" color="muted" as="p" style={{ marginTop: 2 }}>Oferta: {formatPrice(product.salePrice, currency)}</Text>
                  )}
                </Table.Td>
                <Table.Td style={{ textAlign: 'center' }}>
                  <Badge tone={STATUS_BADGE[product.status]} variant="pill">{STATUS_LABELS[product.status]}</Badge>
                </Table.Td>
                <Table.Td muted style={{ textAlign: 'center' }}>
                  {product.categoryId ? (categoryMap[product.categoryId] ?? '—') : '—'}
                </Table.Td>
                <Table.Td style={{ textAlign: 'center', whiteSpace: 'nowrap' }}>{formatPrice(product.price, currency)}</Table.Td>
                <Table.Td style={{ textAlign: 'center' }}>{product.stock}</Table.Td>
                <Table.Td style={{ textAlign: 'center' }}>
                  <div style={{ display: 'flex', gap: '6px', justifyContent: 'center' }}>
                    <StoreButton size="md" onClick={() => openEdit(product)}>Editar</StoreButton>
                    <StoreButton
                      variant="secondary"
                      size="md"
                      onClick={() => handleToggleStatus(product)}
                      data-testid="prod-toggle-btn"
                    >
                      {product.status === 'active' ? 'Desactivar' : 'Activar'}
                    </StoreButton>
                    <StoreButton variant="ghost" size="md" onClick={() => handleDelete(product)} style={{ color: 'var(--color-error-500)' }}>Eliminar</StoreButton>
                  </div>
                </Table.Td>
              </Table.Row>
            ))}
          </Table.Body>
        </Table.Root>
      </Table>

      {!loading && (counts.active + counts.draft + counts.paused) > 0 && (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '12px' }}>
          <Text variant="caption" color="muted" as="p">
            {counts.active + counts.draft + counts.paused} producto{counts.active + counts.draft + counts.paused !== 1 ? 's' : ''} · {counts.active} activo{counts.active !== 1 ? 's' : ''} · {counts.draft} borrador{counts.draft !== 1 ? 'es' : ''} · {counts.paused} inactivo{counts.paused !== 1 ? 's' : ''}
          </Text>
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

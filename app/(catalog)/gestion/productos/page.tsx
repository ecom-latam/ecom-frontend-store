'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { products as productsApi, categories as categoriesApi, storeOptions as storeOptionsApi } from '@/utils/api';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { fetchProductsRequest } from '@/store/products/productsSlice';
import { fetchCategoriesRequest } from '@/store/categories/categoriesSlice';
import { fetchStoreOptionsRequest } from '@/store/storeOptions/storeOptionsSlice';
import { triggerErrorModal } from '@/lib/errorModal';
import type { Product, ProductPayload, ProductStatus, ProductImage, ProductVariant, StoreOption, Category } from '@/utils/api';
import { Modal, Drawer, Table, Badge, Pagination, Text, Tabs, Tooltip, Icon, Switch } from 'zoui';
import { StoreButton } from '@/components/ui/StoreButton';
import { StoreInput } from '@/components/ui/StoreInput';
import { StoreMoneyInput } from '@/components/ui/StoreMoneyInput';
import { StoreNumberInput } from '@/components/ui/StoreNumberInput';
import { StoreSelect } from '@/components/ui/StoreSelect';
import { StoreTextarea } from '@/components/ui/StoreTextarea';
import { usePageConfig } from '@/context/PageConfigContext';
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
        <StoreButton emphasis="outlined" size="md" onClick={onCancel}>Cancelar</StoreButton>
      </Modal.Footer>
    </Modal>
  );
}

// ─── Images Tab ───────────────────────────────────────────────────────────────

const UPLOAD_CHUNK_SIZE = 5; // limite del backend por request (multer upload.array)

interface ImagesTabProps {
  productId: string;
  images: ProductImage[];
  onChange: (images: ProductImage[]) => void;
}

function ImagesTab({ productId, images, onChange }: ImagesTabProps) {
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dragIndexRef = useRef<number | null>(null);

  async function handleFilesSelected(fileList: FileList | null) {
    if (!fileList || fileList.length === 0) return;
    const files = Array.from(fileList);
    setUploading(true);
    try {
      for (let i = 0; i < files.length; i += UPLOAD_CHUNK_SIZE) {
        const chunk = files.slice(i, i + UPLOAD_CHUNK_SIZE);
        const { data } = await productsApi.uploadImages(productId, chunk);
        onChange(data);
      }
    } catch {
      // errores mostrados via modal global (axios interceptor)
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  }

  async function handleDelete(publicId: string) {
    try {
      const { data } = await productsApi.deleteImage(productId, publicId);
      onChange(data);
    } catch {
      // errores mostrados via modal global
    }
  }

  async function handleSetMain(publicId: string) {
    try {
      const { data } = await productsApi.setMainImage(productId, publicId);
      onChange(data);
    } catch {
      // errores mostrados via modal global
    }
  }

  async function handleDrop(targetIndex: number) {
    const fromIndex = dragIndexRef.current;
    dragIndexRef.current = null;
    if (fromIndex === null || fromIndex === targetIndex) return;
    const reordered = [...images];
    const [moved] = reordered.splice(fromIndex, 1);
    reordered.splice(targetIndex, 0, moved);
    onChange(reordered);
    try {
      const { data } = await productsApi.reorderImages(productId, reordered.map(img => img.publicId));
      onChange(data);
    } catch {
      onChange(images);
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <div>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          hidden
          onChange={e => handleFilesSelected(e.target.files)}
        />
        <StoreButton
          size="md"
          emphasis="outlined"
          disabled={uploading}
          onClick={() => fileInputRef.current?.click()}
          data-testid="prod-images-upload-btn"
        >
          {uploading ? 'Subiendo...' : 'Subir imágenes'}
        </StoreButton>
      </div>

      {images.length === 0 ? (
        <Text variant="body-sm" color="muted" tag="p">Todavía no hay imágenes para este producto.</Text>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }} data-testid="prod-images-grid">
          {images.map((img, index) => (
            <div
              key={img.publicId}
              draggable
              onDragStart={() => { dragIndexRef.current = index; }}
              onDragOver={e => e.preventDefault()}
              onDrop={() => handleDrop(index)}
              data-testid="prod-image-card"
              style={{
                position: 'relative',
                border: '1px solid var(--color-border-default)',
                borderRadius: 'var(--radius-md)',
                overflow: 'hidden',
                cursor: 'grab',
              }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={img.url} alt="" style={{ width: '100%', height: 110, objectFit: 'cover', display: 'block' }} />

              {img.isMain && (
                <Badge tone="success" variant="pill" style={{ position: 'absolute', top: 6, left: 6 }}>Principal</Badge>
              )}

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 8px' }}>
                {img.isMain ? (
                  <span />
                ) : (
                  <button
                    type="button"
                    onClick={() => handleSetMain(img.publicId)}
                    title="Marcar como principal"
                    data-testid="prod-image-set-main-btn"
                    style={{ display: 'flex', alignItems: 'center', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-fg-muted)' }}
                  >
                    <Icon name="star" size="sm" />
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => handleDelete(img.publicId)}
                  title="Eliminar imagen"
                  data-testid="prod-image-delete-btn"
                  style={{ display: 'flex', alignItems: 'center', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-error-500)' }}
                >
                  <Icon name="trash" size="sm" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Variants Tab ─────────────────────────────────────────────────────────────

function combinationLabel(combination: ProductVariant['combination']): string {
  return combination.map(c => `${c.optionName}: ${c.value}`).join(' / ');
}

interface VariantRowProps {
  productId: string;
  variant: ProductVariant;
  onSave: (variantId: string, payload: Partial<Pick<ProductVariant, 'price' | 'stock' | 'enabled'>>) => void;
  onImagesChange: (variantId: string, images: ProductImage[]) => void;
}

function VariantRow({ productId, variant, onSave, onImagesChange }: VariantRowProps) {
  const [price, setPrice] = useState<number | null>(variant.price);
  const [stock, setStock] = useState(String(variant.stock));
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function handleFilesSelected(fileList: FileList | null) {
    if (!fileList || fileList.length === 0) return;
    const files = Array.from(fileList);
    setUploading(true);
    try {
      for (const file of files) {
        const { data } = await productsApi.addVariantImage(productId, variant._id, file);
        onImagesChange(variant._id, data);
      }
    } catch {
      // errores mostrados via modal global (axios interceptor)
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  }

  async function handleDeleteImage(publicId: string) {
    try {
      const { data } = await productsApi.deleteVariantImage(productId, variant._id, publicId);
      onImagesChange(variant._id, data);
    } catch {
      // errores mostrados via modal global
    }
  }

  return (
    <Table.Row data-testid="var-row">
      <Table.Td>{combinationLabel(variant.combination)}</Table.Td>
      <Table.Td style={{ textAlign: 'center' }}>
        <StoreMoneyInput
          value={price}
          placeholder="Precio base"
          onValueChange={setPrice}
          onBlur={() => onSave(variant._id, { price })}
          data-testid="var-price-input"
        />
      </Table.Td>
      <Table.Td style={{ textAlign: 'center' }}>
        <StoreNumberInput
          value={stock}
          onChange={e => setStock(e.target.value)}
          onBlur={() => onSave(variant._id, { stock: parseInt(stock, 10) || 0 })}
          data-testid="var-stock-input"
        />
      </Table.Td>
      <Table.Td style={{ textAlign: 'center' }}>
        <Switch
          checked={variant.enabled}
          onCheckedChange={enabled => onSave(variant._id, { enabled })}
          data-testid="var-enabled-switch"
        />
      </Table.Td>
      <Table.Td>
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flexWrap: 'wrap' }} data-testid="var-images-list">
          {variant.images.map(img => (
            <div key={img.publicId} style={{ position: 'relative', width: 28, height: 28 }} data-testid="var-image-thumb">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={img.url} alt="" style={{ width: 28, height: 28, objectFit: 'cover', borderRadius: 'var(--radius-sm)', display: 'block' }} />
              <button
                type="button"
                onClick={() => handleDeleteImage(img.publicId)}
                aria-label="Eliminar imagen"
                data-testid="var-image-delete-btn"
                style={{
                  position: 'absolute', top: -4, right: -4, width: 14, height: 14, borderRadius: '50%',
                  background: 'var(--color-error-500)', color: 'white', border: 'none', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0,
                }}
              >
                <Icon name="x" size="xs" />
              </button>
            </div>
          ))}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            hidden
            onChange={e => handleFilesSelected(e.target.files)}
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            aria-label="Subir imagen"
            data-testid="var-image-upload-btn"
            style={{
              width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center',
              border: '1px dashed var(--color-border-default)', borderRadius: 'var(--radius-sm)',
              background: 'none', cursor: 'pointer', color: 'var(--color-fg-muted)',
            }}
          >
            <Icon name="plus" size="xs" />
          </button>
        </div>
      </Table.Td>
    </Table.Row>
  );
}

interface VariantsTabProps {
  productId: string;
  product: Product;
  onChange: (product: Product) => void;
}

function VariantsTab({ productId, product, onChange }: VariantsTabProps) {
  const dispatch = useAppDispatch();
  const { list: reduxOptions } = useAppSelector((s) => s.storeOptions);
  const [allOptions, setAllOptions] = useState<StoreOption[]>([]);
  const [selected, setSelected] = useState<Set<string>>(
    new Set(product.linkedOptions.map(o => o.storeOptionId))
  );
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    dispatch(fetchStoreOptionsRequest());
  }, [dispatch]);

  useEffect(() => {
    if (reduxOptions.length > 0) setAllOptions(reduxOptions);
  }, [reduxOptions]);

  function toggleOption(id: string) {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }

  async function handleGenerate() {
    setGenerating(true);
    try {
      const { data } = await productsApi.setOptions(productId, Array.from(selected));
      onChange(data);
    } catch {
      // errores mostrados via modal global (axios interceptor)
    } finally {
      setGenerating(false);
    }
  }

  async function handleVariantSave(variantId: string, payload: Partial<Pick<ProductVariant, 'price' | 'stock' | 'enabled'>>) {
    try {
      const { data } = await productsApi.updateVariant(productId, variantId, payload);
      onChange({
        ...product,
        variants: product.variants.map(v => v._id === variantId ? data : v),
      });
    } catch {
      // errores mostrados via modal global
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div>
        <Text variant="label" tag="p" style={{ marginBottom: 8 }}>Opciones que definen las variantes</Text>
        {allOptions.length === 0 ? (
          <Text variant="body-sm" color="muted" tag="p">
            Todavía no creaste ninguna opción. Creálas desde Catálogo → Opciones.
          </Text>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {allOptions.map(opt => (
              <Switch
                key={opt._id}
                label={`${opt.name} (${opt.values.join(', ')})`}
                checked={selected.has(opt._id)}
                onCheckedChange={() => toggleOption(opt._id)}
                data-testid="var-option-switch"
              />
            ))}
          </div>
        )}
      </div>

      <div>
        <StoreButton
          size="md"
          emphasis="outlined"
          disabled={generating || selected.size === 0}
          onClick={handleGenerate}
          data-testid="var-generate-btn"
        >
          {generating ? 'Generando...' : 'Generar variantes'}
        </StoreButton>
      </div>

      {product.hasVariants && product.variants.length > 0 && (
        <Table>
          <Table.Root compact>
            <Table.Head>
              <tr>
                <Table.Th>Combinación</Table.Th>
                <Table.Th style={{ textAlign: 'center' }}>Precio</Table.Th>
                <Table.Th style={{ textAlign: 'center' }}>Stock</Table.Th>
                <Table.Th style={{ textAlign: 'center' }}>Habilitada</Table.Th>
                <Table.Th>Imágenes</Table.Th>
              </tr>
            </Table.Head>
            <Table.Body>
              {product.variants.map(variant => (
                <VariantRow
                  key={variant._id}
                  productId={productId}
                  variant={variant}
                  onSave={handleVariantSave}
                  onImagesChange={(variantId, images) => onChange({
                    ...product,
                    variants: product.variants.map(v => v._id === variantId ? { ...v, images } : v),
                  })}
                />
              ))}
            </Table.Body>
          </Table.Root>
        </Table>
      )}
    </div>
  );
}

// ─── Product Drawer ───────────────────────────────────────────────────────────

const SECTION_LOCKED_MESSAGE = 'Guardá los datos básicos primero para habilitar esta sección.';

function LockedTrigger({ value, children }: { value: string; children: string }) {
  return (
    <Tooltip content={SECTION_LOCKED_MESSAGE} side="bottom">
      <Tabs.Trigger value={value} disabled>{children}</Tabs.Trigger>
    </Tooltip>
  );
}

interface ProductDrawerProps {
  product: Product | null;
  categories: Category[];
  onClose: () => void;
  onSaved: () => void;
  onCreated: () => void;
}

function ProductDrawer({ product, categories, onClose, onSaved, onCreated }: ProductDrawerProps) {
  const [savedProduct, setSavedProduct] = useState<Product | null>(product);
  const [form, setForm] = useState<ProductPayload>(
    product
      ? { name: product.name, description: product.description, price: product.price, salePrice: product.salePrice, stock: product.stock, categoryId: product.categoryId, status: product.status }
      : EMPTY_FORM
  );
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('datos');

  const hasProductId = savedProduct !== null;

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
      if (savedProduct) {
        await productsApi.update(savedProduct._id, form);
        onSaved();
      } else {
        const { data } = await productsApi.create(form);
        setSavedProduct(data);
        onCreated();
      }
    } catch {
      // errors shown via modal (axios interceptor)
    } finally {
      setLoading(false);
    }
  }

  return (
    <Drawer open side="right" size="lg" onClose={onClose} label={savedProduct ? 'Editar producto' : 'Nuevo producto'}>
      <Drawer.Header>{savedProduct ? 'Editar producto' : 'Nuevo producto'}</Drawer.Header>
      <>
        <Drawer.Body>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <Tabs.List>
              <Tabs.Trigger value="datos">Datos básicos</Tabs.Trigger>
              {hasProductId
                ? <Tabs.Trigger value="imagenes">Imágenes</Tabs.Trigger>
                : <LockedTrigger value="imagenes">Imágenes</LockedTrigger>}
              {hasProductId
                ? <Tabs.Trigger value="variantes">Variantes</Tabs.Trigger>
                : <LockedTrigger value="variantes">Variantes</LockedTrigger>}
            </Tabs.List>

            <Tabs.Content value="datos">
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
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
              </div>
            </Tabs.Content>

            <Tabs.Content value="imagenes">
              {savedProduct && (
                <ImagesTab
                  productId={savedProduct._id}
                  images={savedProduct.images}
                  onChange={images => setSavedProduct(p => p && { ...p, images })}
                />
              )}
            </Tabs.Content>

            <Tabs.Content value="variantes">
              {savedProduct && (
                <VariantsTab
                  productId={savedProduct._id}
                  product={savedProduct}
                  onChange={updated => setSavedProduct(updated)}
                />
              )}
            </Tabs.Content>
          </Tabs>
        </Drawer.Body>

        <Drawer.Footer style={{ flexDirection: 'row', justifyContent: 'flex-end' }}>
          <StoreButton type="button" emphasis="outlined" size="md" onClick={onClose}>Cancelar</StoreButton>
          <StoreButton size="md" disabled={loading} onClick={handleSubmit} data-testid="prod-submit-btn">
            {loading ? 'Guardando...' : savedProduct ? 'Guardar cambios' : 'Crear producto'}
          </StoreButton>
        </Drawer.Footer>
      </>
    </Drawer>
  );
}

// ─── Page ────────────────────────────────────────────────────────────────────

export default function GestionProductosPage() {
  const { store } = usePageConfig();
  const currency = store?.currency;
  const dispatch = useAppDispatch();
  const { list: reduxProducts, total: reduxTotal, loading: reduxLoading } = useAppSelector((s) => s.products);
  const { list: reduxCategories } = useAppSelector((s) => s.categories);
  const catInitialized = useRef(false);
  const prodInitialized = useRef(false);

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

  const load = useCallback((p: number, q: string, status: ProductStatus | '') => {
    dispatch(fetchProductsRequest({
      page: p, limit: LIMIT,
      ...(q ? { q } : {}),
      ...(status ? { status } : {}),
    }));
  }, [dispatch]);

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
    if (!reduxLoading && !prodInitialized.current) {
      prodInitialized.current = true;
    }
    if (reduxProducts !== undefined) {
      setProductList(reduxProducts);
      setTotal(reduxTotal);
      setLoading(reduxLoading);
    }
  }, [reduxProducts, reduxTotal, reduxLoading]);

  useEffect(() => {
    dispatch(fetchCategoriesRequest());
    loadCounts();
  }, [dispatch, loadCounts]);

  useEffect(() => {
    if (catInitialized.current || reduxCategories.length === 0) return;
    catInitialized.current = true;
    setCategoryList(reduxCategories);
    setCategoryMap(Object.fromEntries(reduxCategories.map(c => [c._id, c.name])));
  }, [reduxCategories]);

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
  function handleCreated() { load(page, search, statusFilter); loadCounts(); }

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
                      emphasis="outlined"
                      size="md"
                      onClick={() => handleToggleStatus(product)}
                      data-testid="prod-toggle-btn"
                    >
                      {product.status === 'active' ? 'Desactivar' : 'Activar'}
                    </StoreButton>
                    <StoreButton emphasis="ghost" size="md" onClick={() => handleDelete(product)} style={{ color: 'var(--color-error-500)' }}>Eliminar</StoreButton>
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
        <ProductDrawer product={editing} categories={categoryList.filter(c => c.status === 'active')} onClose={() => setDrawerOpen(false)} onSaved={handleSaved} onCreated={handleCreated} />
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

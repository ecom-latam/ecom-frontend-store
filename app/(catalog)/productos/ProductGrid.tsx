'use client';

import { useRouter } from 'next/navigation';
import { useCallback } from 'react';

import type { Category, Product } from '@/lib/api/storeClient';
import { ProductCard, ProductGrid as ProductGridUI, Pagination, EmptyState, Icon, Badge, Text } from 'zoui';
import { StoreCatalogBar } from '@/components/catalog/StoreCatalogBar';
import { usePageConfig } from '@/context/PageConfigContext';
import { formatPrice } from '@/lib/format';

interface Props {
  products: Product[];
  categories: Category[];
  total: number;
  page: number;
  totalPages: number;
  currentCategoryId?: string;
  currentQ?: string;
  currentView: 'grid' | 'list';
}

function getMainImage(p: Product) {
  return p.images.find((img) => img.isMain) ?? p.images[0];
}

function getDisplayPrice(p: Product) {
  return p.salePrice ?? p.price;
}

function getDiscount(p: Product) {
  if (!p.salePrice || p.salePrice >= p.price) return undefined;
  return `−${Math.round((1 - p.salePrice / p.price) * 100)}%`;
}

function getEffectiveAvailableStock(p: Product): number {
  if (!p.hasVariants) return p.availableStock ?? p.stock;
  const stocks = p.variants
    .filter((v) => v.enabled !== false)
    .map((v) => v.availableStock ?? v.stock);
  return stocks.length === 0 ? 0 : Math.max(...stocks);
}

export function ProductGrid({
  products,
  categories,
  total,
  page,
  totalPages,
  currentCategoryId,
  currentQ,
  currentView,
}: Props) {
  const router = useRouter();
  const { store } = usePageConfig();
  const currency = store?.currency;
  const ratings_enabled = store?.ratings_enabled;

  // Reconstruimos los params desde los props (server-passed) en vez de useSearchParams:
  // así esta vista no fuerza el client-render bailout del Suspense (evita los warnings de hidratación).
  const navigate = useCallback(
    (updates: Record<string, string | undefined>) => {
      const params = new URLSearchParams();
      if (currentQ) params.set('q', currentQ);
      if (currentCategoryId) params.set('categoryId', currentCategoryId);
      if (currentView === 'list') params.set('view', 'list');
      if (page > 1) params.set('page', String(page));
      for (const [key, value] of Object.entries(updates)) {
        if (value === undefined) {
          params.delete(key);
        } else {
          params.set(key, value);
        }
      }
      const qs = params.toString();
      router.push(qs ? `/productos?${qs}` : '/productos');
    },
    [router, currentQ, currentCategoryId, currentView, page]
  );

  const catalogCategories = categories.map((c) => ({ label: c.name, value: c._id }));

  return (
    <div>
      <StoreCatalogBar
        searchValue={currentQ ?? ''}
        onSearch={(q) => navigate({ q: q || undefined, page: undefined })}
        categories={catalogCategories}
        categoryValue={currentCategoryId ?? ''}
        onCategoryChange={(val) => navigate({ categoryId: val || undefined, page: undefined })}
        view={currentView}
        onViewChange={(v) => navigate({ view: v })}
      />

      {total > 0 && (
        <Text variant="body-sm" color="secondary" style={{ margin: '16px 0' }}>
          {`${total} producto${total !== 1 ? 's' : ''}`}
        </Text>
      )}

      {products.length === 0 ? (
        <EmptyState
          icon={<Icon name="search" />}
          title="Sin resultados"
          description="Probá con menos filtros o ajustá los términos."
          tone="neutral"
        />
      ) : currentView === 'grid' ? (
        <ProductGridUI>
          {products.map((p) => {
            const mainImage = getMainImage(p);
            const displayPrice = getDisplayPrice(p);
            const hasDiscount = p.salePrice !== null && p.salePrice < p.price;
            const outOfStock = getEffectiveAvailableStock(p) === 0;
            return (
              <ProductCard
                key={p._id}
                name={p.name}
                price={formatPrice(displayPrice, currency)}
                priceOld={hasDiscount ? formatPrice(p.price, currency) : undefined}
                discount={getDiscount(p)}
                image={mainImage ? { url: mainImage.url, alt: p.name } : undefined}
                href={`/producto?id=${p._id}`}
                outOfStock={outOfStock}
                avgRating={ratings_enabled && p.avgRating != null ? p.avgRating : undefined}
                reviewCount={ratings_enabled && p.reviewCount != null ? p.reviewCount : undefined}
              />
            );
          })}
        </ProductGridUI>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {products.map((p) => (
            <ProductListItem key={p._id} product={p} />
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <div style={{ display: 'flex', justifyContent: 'center', marginTop: '32px' }}>
          <Pagination
            page={page}
            totalPages={totalPages}
            onPageChange={(p) => navigate({ page: String(p) })}
          />
        </div>
      )}
    </div>
  );
}

function ProductListItem({ product }: { product: Product }) {
  const { store } = usePageConfig();
  const currency = store?.currency;
  const mainImage = getMainImage(product);
  const displayPrice = getDisplayPrice(product);
  const hasDiscount = product.salePrice !== null && product.salePrice < product.price;
  const outOfStock = getEffectiveAvailableStock(product) === 0;

  return (
    <Link
      href={`/producto?id=${product._id}`}
      style={{
        display: 'flex',
        gap: '16px',
        border: '1px solid var(--color-border-default)',
        borderRadius: 'var(--radius-lg)',
        padding: '16px',
        textDecoration: 'none',
        transition: 'box-shadow 0.15s',
      }}
    >
      <div style={{ width: 80, height: 80, background: 'var(--color-bg-subtle)', borderRadius: 'var(--radius-md)', overflow: 'hidden', flexShrink: 0 }}>
        {mainImage ? (
          <Image
            src={mainImage.url}
            alt={product.name}
            width={80}
            height={80}
            style={{ objectFit: 'cover', width: '100%', height: '100%' }}
          />
        ) : (
          <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-fg-disabled)', fontSize: '24px' }}>
            □
          </div>
        )}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
        <Text variant="body-sm" weight="medium" as="p">{product.name}</Text>
        <div style={{ marginTop: '4px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Text variant="body-sm" weight="semibold" as="span">
            {formatPrice(displayPrice, currency)}
          </Text>
          {hasDiscount && (
            <Text variant="caption" color="muted" as="span" style={{ textDecoration: 'line-through' }}>
              {formatPrice(product.price, currency)}
            </Text>
          )}
          {outOfStock && (
            <Badge tone="danger" variant="pill">Sin stock</Badge>
          )}
        </div>
      </div>
    </Link>
  );
}

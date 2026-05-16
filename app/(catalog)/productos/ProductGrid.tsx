'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useCallback } from 'react';

import type { Category, Product } from '@/lib/api/storeClient';
import { ProductCard, ProductGrid as ProductGridUI, ViewToggle, Pagination, EmptyState, ICON_SEARCH, Input, Select, Button, Badge } from 'zoui';

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
  const searchParams = useSearchParams();

  const navigate = useCallback(
    (updates: Record<string, string | undefined>) => {
      const params = new URLSearchParams(searchParams.toString());
      for (const [key, value] of Object.entries(updates)) {
        if (value === undefined) {
          params.delete(key);
        } else {
          params.set(key, value);
        }
      }
      router.push(`/productos?${params.toString()}`);
    },
    [router, searchParams]
  );

  function handleSearch(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const q = (e.currentTarget.elements.namedItem('q') as HTMLInputElement).value.trim();
    navigate({ q: q || undefined, page: undefined });
  }

  return (
    <div>
      <div style={{ display: 'flex', gap: '12px', marginBottom: '24px', flexWrap: 'wrap' }}>
        <form onSubmit={handleSearch} style={{ display: 'flex', gap: '8px', flex: 1, minWidth: '200px' }}>
          <div style={{ flex: 1 }}>
            <Input
              name="q"
              defaultValue={currentQ ?? ''}
              placeholder="Buscar productos..."
              fullWidth
            />
          </div>
          <Button type="submit" variant="filled" shape="rounded" size="sm">
            Buscar
          </Button>
        </form>

        <div style={{ minWidth: '180px' }}>
          <Select
            value={currentCategoryId ?? ''}
            onChange={(e) => navigate({ categoryId: e.target.value || undefined, page: undefined })}
            fullWidth
          >
            <option value="">Todas las categorías</option>
            {categories.map((cat) => (
              <option key={cat._id} value={cat._id}>
                {cat.name}
              </option>
            ))}
          </Select>
        </div>

        <ViewToggle
          value={currentView}
          onChange={(v) => navigate({ view: v })}
          iconOnly
        />
      </div>

      <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-fg-secondary)', marginBottom: '16px' }}>
        {total === 0 ? 'Sin resultados' : `${total} producto${total !== 1 ? 's' : ''}`}
      </p>

      {products.length === 0 ? (
        <EmptyState
          icon={ICON_SEARCH}
          title="Sin resultados"
          description="Probá con menos filtros o ajustá los términos."
          tone="neutral"
        />
      ) : currentView === 'grid' ? (
        <ProductGridUI variant="normal">
          {products.map((p) => {
            const mainImage = getMainImage(p);
            const displayPrice = getDisplayPrice(p);
            const hasDiscount = p.salePrice !== null && p.salePrice < p.price;
            const outOfStock = getEffectiveAvailableStock(p) === 0;
            return (
              <ProductCard
                key={p._id}
                variant="classic"
                as={Link}
                ImageComponent={Image}
                name={p.name}
                price={`$${displayPrice.toLocaleString('es-AR')}`}
                priceOld={hasDiscount ? `$${p.price.toLocaleString('es-AR')}` : undefined}
                discount={getDiscount(p)}
                image={mainImage ? { url: mainImage.url, alt: p.name } : undefined}
                href={`/producto?id=${p._id}`}
                outOfStock={outOfStock}
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
        <p style={{ fontSize: 'var(--font-size-sm)', fontWeight: 500, color: 'var(--color-fg-primary)' }}>{product.name}</p>
        <div style={{ marginTop: '4px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontWeight: 600, color: 'var(--color-fg-primary)' }}>
            ${displayPrice.toLocaleString('es-AR')}
          </span>
          {hasDiscount && (
            <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-fg-muted)', textDecoration: 'line-through' }}>
              ${product.price.toLocaleString('es-AR')}
            </span>
          )}
          {outOfStock && (
            <Badge type="error" shape="pill">Sin stock</Badge>
          )}
        </div>
      </div>
    </Link>
  );
}

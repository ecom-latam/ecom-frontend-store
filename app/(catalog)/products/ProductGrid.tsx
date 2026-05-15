'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useCallback } from 'react';

import type { Category, Product } from '@/lib/api/storeClient';
import { ProductCard } from '@/components/ui/ProductCard';
import { ProductGrid as ProductGridUI } from '@/components/ui/ProductGrid';
import { ViewToggle } from '@/components/ui/ViewToggle';
import { Pagination } from '@/components/ui/Pagination';
import { EmptyState, ICON_SEARCH } from '@/components/ui/EmptyState';

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
      router.push(`/products?${params.toString()}`);
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
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <form onSubmit={handleSearch} className="flex gap-2 flex-1">
          <input
            name="q"
            defaultValue={currentQ ?? ''}
            placeholder="Buscar productos..."
            className="flex-1 border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
          />
          <button
            type="submit"
            className="bg-gray-900 text-white px-4 py-2 rounded-md text-sm hover:bg-gray-700"
          >
            Buscar
          </button>
        </form>

        <select
          value={currentCategoryId ?? ''}
          onChange={(e) => navigate({ categoryId: e.target.value || undefined, page: undefined })}
          className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
        >
          <option value="">Todas las categorías</option>
          {categories.map((cat) => (
            <option key={cat._id} value={cat._id}>
              {cat.name}
            </option>
          ))}
        </select>

        <ViewToggle
          value={currentView}
          onChange={(v) => navigate({ view: v })}
          iconOnly
        />
      </div>

      <p className="text-sm text-gray-500 mb-4">
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
            return (
              <ProductCard
                key={p._id}
                variant="classic"
                name={p.name}
                price={`$${displayPrice.toLocaleString('es-AR')}`}
                priceOld={hasDiscount ? `$${p.price.toLocaleString('es-AR')}` : undefined}
                discount={getDiscount(p)}
                image={mainImage ? { url: mainImage.url, alt: p.name } : undefined}
                href={`/products/${p._id}`}
              />
            );
          })}
        </ProductGridUI>
      ) : (
        <div className="flex flex-col gap-3">
          {products.map((p) => (
            <ProductListItem key={p._id} product={p} />
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex justify-center mt-8">
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

  return (
    <Link
      href={`/products/${product._id}`}
      className="flex gap-4 border border-gray-200 rounded-lg p-4 hover:shadow-sm transition-shadow"
    >
      <div className="w-20 h-20 bg-gray-100 rounded-md overflow-hidden flex-shrink-0">
        {mainImage ? (
          <Image
            src={mainImage.url}
            alt={product.name}
            width={80}
            height={80}
            className="object-cover w-full h-full"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-300 text-2xl">
            □
          </div>
        )}
      </div>
      <div className="flex flex-col justify-center">
        <p className="font-medium text-gray-900 text-sm">{product.name}</p>
        <div className="mt-1 flex items-center gap-2">
          <span className="font-semibold text-gray-900">${displayPrice.toLocaleString('es-AR')}</span>
          {hasDiscount && (
            <span className="text-xs text-gray-400 line-through">
              ${product.price.toLocaleString('es-AR')}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}

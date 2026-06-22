import Link from 'next/link';
import { ProductCard, ProductGrid as ProductGridUI } from 'zoui';
import { getProducts } from '@/lib/api/storeClient';
import type { Product } from '@/lib/api/storeClient';
import { formatPrice } from '@/lib/format';
import type { Currency } from '@/context/PageConfigContext';

interface RelatedProductsProps {
  categoryId: string;
  excludeId: string;
  currency?: Currency;
}

function getMainImage(p: Product) {
  return p.images.find((img) => img.isMain) ?? p.images[0] ?? null;
}

function getDisplayPrice(p: Product) {
  return p.salePrice ?? p.price;
}

function getDiscount(p: Product): string | undefined {
  if (p.salePrice !== null && p.salePrice < p.price) {
    const pct = Math.round((1 - p.salePrice / p.price) * 100);
    return `-${pct}%`;
  }
  return undefined;
}

function getEffectiveStock(p: Product): number {
  if (p.hasVariants) {
    return Math.max(0, ...p.variants.filter(v => v.enabled !== false).map(v => v.availableStock ?? v.stock));
  }
  return p.availableStock ?? p.stock;
}

export async function RelatedProducts({
  categoryId,
  excludeId,
  currency = 'ARS',
}: RelatedProductsProps) {
  let products: Product[];
  try {
    const result = await getProducts({ categoryId, exclude: excludeId, limit: 4 });
    products = result.data;
  } catch {
    return null;
  }

  if (products.length === 0) return null;

  return (
    <section style={{ marginTop: '48px' }}>
      <div
        style={{
          display:        'flex',
          alignItems:     'center',
          justifyContent: 'space-between',
          marginBottom:   '20px',
        }}
      >
        <h2
          style={{
            fontFamily: 'var(--font-display)',
            fontSize:   '20px',
            fontWeight: 600,
            color:      'var(--color-fg-primary)',
            margin:     0,
          }}
        >
          También te puede interesar
        </h2>
        <Link
          href={`/productos?categoryId=${categoryId}`}
          style={{
            fontFamily:     'var(--font-ui)',
            fontSize:       '13px',
            color:          'var(--color-brand-500)',
            textDecoration: 'none',
            fontWeight:     500,
          }}
        >
          Ver todo →
        </Link>
      </div>

      <ProductGridUI>
        {products.map((p) => {
          const mainImage = getMainImage(p);
          const displayPrice = getDisplayPrice(p);
          const hasDiscount = p.salePrice !== null && p.salePrice < p.price;
          const outOfStock = getEffectiveStock(p) === 0;

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
            />
          );
        })}
      </ProductGridUI>
    </section>
  );
}

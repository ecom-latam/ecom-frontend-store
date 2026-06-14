import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { cookies } from 'next/headers';
import { notFound } from 'next/navigation';

import { Text, Breadcrumbs } from 'zoui';
import { AddToCartButton } from '@/components/catalog/AddToCartButton';
import { Price } from '@/components/catalog/Price';
import { ShareButton } from '@/components/catalog/ShareButton';
import { getCategories, getProduct, getStoreInfo } from '@/lib/api/storeClient';
import type { BreadcrumbsVariant } from 'zoui';

interface Props {
  searchParams: { id?: string };
}

const BUTTON_TO_BREADCRUMBS: Record<string, BreadcrumbsVariant> = {
  outlined:  'outlined',
  filled:    'filled',
  soft:      'soft',
  ghost:     'ghost',
  editorial: 'editorial',
  boutique:  'boutique',
  terminal:  'terminal',
  brutalist: 'brutalist',
  retro:     'retro',
  glow:      'glow',
  gradient:  'gradient',
  neon:      'neon',
  frame:     'frame',
  pill:      'pill',
  capsule:   'capsule',
  glass:     'glass',
};

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const id = searchParams.id;
  if (!id) return {};
  try {
    const product = await getProduct(id);
    const mainImage = product.images.find((img) => img.isMain) ?? product.images[0];
    return {
      title: product.name,
      description: product.description || undefined,
      openGraph: {
        title: product.name,
        description: product.description || undefined,
        ...(mainImage ? { images: [mainImage.url] } : {}),
      },
    };
  } catch {
    return {};
  }
}

export default async function ProductoPage({ searchParams }: Props) {
  const id = searchParams.id;
  if (!id) notFound();

  const cookieStore = await cookies();
  const hasSession = cookieStore.has('_auth');

  const [product, categories, storeInfo] = await Promise.all([
    getProduct(id),
    getCategories(),
    getStoreInfo(),
  ]);

  const category = categories.find((c) => c._id === String(product.categoryId));
  const mainImage = product.images.find((img) => img.isMain) ?? product.images[0];
  const secondaryImages = product.images.filter((img) => img !== mainImage);
  const displayPrice = product.salePrice ?? product.price;
  const hasDiscount = product.salePrice !== null && product.salePrice < product.price;

  const effectiveStock = product.hasVariants
    ? Math.max(
        0,
        ...product.variants
          .filter((v) => v.enabled !== false)
          .map((v) => v.availableStock ?? v.stock)
      )
    : (product.availableStock ?? product.stock);

  const shareEnabled = storeInfo?.share_button_enabled ?? false;
  const storeVariant = storeInfo?.components_presets?.button ?? 'outlined';
  const breadcrumbsVariant: BreadcrumbsVariant = BUTTON_TO_BREADCRUMBS[storeVariant] ?? 'outlined';

  const breadcrumbItems = [
    { label: 'Tienda', href: '/productos' },
    ...(category ? [{ label: category.name, href: `/productos?categoryId=${category._id}` }] : []),
    { label: product.name },
  ];

  return (
    <main className="min-h-screen" style={{ background: 'var(--color-bg-surface)' }}>
      <div className="max-w-5xl mx-auto px-4 py-8">

        <div style={{ marginBottom: '24px' }}>
          <Breadcrumbs items={breadcrumbItems} variant={breadcrumbsVariant} />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-10 items-start">

          {/* Gallery — left col, scrolls naturally */}
          <div className="flex flex-col gap-3">
            <div
              className="rounded-lg overflow-hidden"
              style={{
                background: 'var(--color-bg-subtle)',
                aspectRatio: '4 / 5',
                position: 'relative',
              }}
            >
              {mainImage ? (
                <Image
                  src={mainImage.url}
                  alt={product.name}
                  fill
                  sizes="(max-width: 768px) 100vw, 50vw"
                  className="object-cover"
                  priority
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-6xl" style={{ color: 'var(--color-fg-disabled)' }}>
                  □
                </div>
              )}
            </div>

            {secondaryImages.length > 0 && (
              <div className="flex gap-2 overflow-x-auto">
                {secondaryImages.map((img, i) => (
                  <div
                    key={i}
                    className="flex-shrink-0 rounded-md overflow-hidden"
                    style={{
                      width: '72px',
                      height: '90px',
                      background: 'var(--color-bg-subtle)',
                      position: 'relative',
                    }}
                  >
                    <Image
                      src={img.url}
                      alt={`${product.name} ${i + 2}`}
                      fill
                      sizes="72px"
                      className="object-cover"
                    />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Info — right col, sticky */}
          <div
            className="flex flex-col"
            style={{ position: 'sticky', top: '80px', alignSelf: 'start' }}
          >
            {category && (
              <Link href={`/productos?categoryId=${category._id}`} style={{ textDecoration: 'none', marginBottom: '8px', display: 'block' }}>
                <Text variant="overline" color="muted">{category.name}</Text>
              </Link>
            )}

            <Text variant="heading-2" as="h1">{product.name}</Text>

            <div style={{ marginTop: '12px', display: 'flex', alignItems: 'baseline', gap: '12px' }}>
              <Text variant="heading-1" as="span"><Price value={displayPrice} /></Text>
              {hasDiscount && (
                <Text variant="body" color="muted" as="span" style={{ textDecoration: 'line-through' }}>
                  <Price value={product.price} />
                </Text>
              )}
            </div>

            {product.description && (
              <Text variant="body-sm" color="secondary" as="p" style={{ marginTop: '16px', whiteSpace: 'pre-line' }}>
                {product.description}
              </Text>
            )}

            {product.hasVariants && product.linkedOptions.length > 0 && (
              <div style={{ marginTop: '24px' }}>
                <Text variant="body-sm" color="muted" as="p">
                  {product.linkedOptions.map((o) => o.storeOptionName).join(', ')}
                </Text>
              </div>
            )}

            {effectiveStock > 0 ? (
              <Text variant="body-sm" as="p" style={{ marginTop: '24px', color: 'var(--color-success-700)' }}>
                Disponible ({effectiveStock} disponibles)
              </Text>
            ) : (
              <Text variant="body-sm" as="p" style={{ marginTop: '24px', color: 'var(--color-error-500)' }}>
                Sin stock
              </Text>
            )}

            <AddToCartButton product={product} hasSession={hasSession} availableStock={effectiveStock} />

            {shareEnabled && (
              <div style={{ marginTop: '16px' }}>
                <ShareButton title={product.name} />
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}

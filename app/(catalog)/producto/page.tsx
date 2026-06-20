import type { Metadata } from 'next';
import Image from 'next/image';
import { cookies } from 'next/headers';
import { notFound } from 'next/navigation';

import { Breadcrumbs } from 'zoui';
import { PDPInfoPanel } from '@/components/catalog/PDPInfoPanel';
import { RelatedProducts } from '@/components/catalog/RelatedProducts';
import { RatingsBlock } from '@/components/catalog/RatingsBlock';
import { getCategories, getProduct, getProductReviews, getStoreInfo } from '@/lib/api/storeClient';

interface Props {
  searchParams: { id?: string };
}


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

  const ratingsActive = storeInfo?.ratings_enabled || storeInfo?.reviews_enabled;
  const reviewsData = ratingsActive ? await getProductReviews(id, 3) : null;

  const category = categories.find((c) => c._id === String(product.categoryId));
  const mainImage = product.images.find((img) => img.isMain) ?? product.images[0];
  const secondaryImages = product.images.filter((img) => img !== mainImage);
  const displayPrice = product.salePrice ?? product.price;
  const hasDiscount = product.salePrice !== null && product.salePrice < product.price;

  const defaultStock = product.hasVariants
    ? Math.max(
        0,
        ...product.variants
          .filter((v) => v.enabled !== false)
          .map((v) => v.availableStock ?? v.stock)
      )
    : (product.availableStock ?? product.stock);

  const storeRatingsEnabled = storeInfo?.ratings_enabled ?? false;
  const storeReviewsEnabled = storeInfo?.reviews_enabled ?? false;

  const discountPercent = hasDiscount && product.salePrice
    ? Math.round((1 - product.salePrice / product.price) * 100)
    : null;

  const installmentsCount = storeInfo?.installments_count ?? null;
  const interestFree = storeInfo?.interest_free ?? false;
  const showInstallments = installmentsCount !== null && installmentsCount > 1;

  const breadcrumbItems = [
    { label: 'Tienda', href: '/productos' },
    ...(category ? [{ label: category.name, href: `/productos?categoryId=${category._id}` }] : []),
    { label: product.name },
  ];

  return (
    <main className="min-h-screen" style={{ background: 'var(--color-bg-surface)' }}>
      <div className="max-w-5xl mx-auto px-4 py-8">

        <div style={{ marginBottom: '24px' }}>
          <Breadcrumbs items={breadcrumbItems} />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-10 items-start">

          {/* Gallery — left col */}
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

          {/* Info — right col, sticky, client component */}
          <div
            className="flex flex-col"
            style={{ position: 'sticky', top: '80px', alignSelf: 'start' }}
          >
            <PDPInfoPanel
              product={product}
              hasSession={hasSession}
              defaultPrice={displayPrice}
              defaultStock={defaultStock}
              hasDiscount={hasDiscount}
              discountPercent={discountPercent}
              showInstallments={showInstallments}
              installmentsCount={installmentsCount}
              interestFree={interestFree}
              freeShippingMin={storeInfo?.free_shipping_min_amount}
              lowStockThreshold={storeInfo?.low_stock_threshold ?? 0}
              shareEnabled={storeInfo?.share_button_enabled ?? false}
              buyNowEnabled={storeInfo?.buy_now_enabled ?? false}
              returnsEnabled={storeInfo?.store_policies?.returns_enabled}
              returnDays={storeInfo?.store_policies?.return_days}
              warrantyEnabled={storeInfo?.store_policies?.warranty_enabled}
              warrantyMonths={storeInfo?.store_policies?.warranty_months}
              categoryName={category?.name}
              categoryId={category?._id}
            />
          </div>
        </div>

        {storeInfo?.related_products_enabled && category && (
          <RelatedProducts
            categoryId={String(category._id)}
            excludeId={id}
            currency={storeInfo.currency ?? 'ARS'}
          />
        )}

        {(storeRatingsEnabled || storeReviewsEnabled) && (
          <RatingsBlock
            avgRating={reviewsData?.avgRating ?? null}
            total={reviewsData?.total ?? 0}
            reviews={reviewsData?.data ?? []}
            distribution={reviewsData?.distribution ?? null}
            ratingsEnabled={storeRatingsEnabled}
            reviewsEnabled={storeReviewsEnabled}
          />
        )}
      </div>
    </main>
  );
}

import type { Metadata } from 'next';
import { cookies } from 'next/headers';
import { notFound, redirect } from 'next/navigation';

import { Breadcrumbs } from 'zoui';
import { ProductDetailSection } from '@/components/catalog/ProductDetailSection';
import { RelatedProducts } from '@/components/catalog/RelatedProducts';
import { RatingsBlock } from '@/components/catalog/RatingsBlock';
import { getCategories, getProduct, getProductReviews, getPageInfo } from '@/lib/api/storeClient';
import styles from './page.module.scss';

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
    getPageInfo(),
  ]);

  // EC-559: tiendas tipo "informativa" no tienen catalogo.
  if (storeInfo?.hasCatalog === false) {
    redirect('/');
  }

  const store = storeInfo?.store;

  const ratingsActive = store?.ratings_enabled || store?.reviews_enabled;
  const reviewsData = ratingsActive ? await getProductReviews(id, 3) : null;

  const category = categories.find((c) => c._id === String(product.categoryId));
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

  const storeRatingsEnabled = store?.ratings_enabled ?? false;
  const storeReviewsEnabled = store?.reviews_enabled ?? false;

  const discountPercent = hasDiscount && product.salePrice
    ? Math.round((1 - product.salePrice / product.price) * 100)
    : null;

  const installmentsCount = store?.installments_count ?? null;
  const interestFree = store?.interest_free ?? false;
  const showInstallments = installmentsCount !== null && installmentsCount > 1;

  const catalogSlug = storeInfo?.catalog_slug ?? 'productos';
  const breadcrumbItems = [
    { label: 'Tienda', href: `/${catalogSlug}` },
    ...(category ? [{ label: category.name, href: `/${catalogSlug}?categoryId=${category._id}` }] : []),
    { label: product.name },
  ];

  return (
    <main className={styles.root} style={{ background: 'var(--color-bg-surface)' }}>
      <div className={styles.container}>

        <div style={{ marginBottom: '24px' }}>
          <Breadcrumbs items={breadcrumbItems} />
        </div>

        <ProductDetailSection
          product={product}
          hasSession={hasSession}
          defaultPrice={displayPrice}
          defaultStock={defaultStock}
          hasDiscount={hasDiscount}
          discountPercent={discountPercent}
          showInstallments={showInstallments}
          installmentsCount={installmentsCount}
          interestFree={interestFree}
          freeShippingMin={store?.free_shipping_min_amount}
          lowStockThreshold={store?.low_stock_threshold ?? 0}
          shareEnabled={store?.share_button_enabled ?? false}
          buyNowEnabled={store?.buy_now_enabled ?? false}
          returnsEnabled={store?.store_policies?.returns_enabled}
          returnDays={store?.store_policies?.return_days}
          warrantyEnabled={store?.store_policies?.warranty_enabled}
          warrantyMonths={store?.store_policies?.warranty_months}
          categoryName={category?.name}
          categoryId={category?._id}
        />

        {store?.related_products_enabled && category && (
          <RelatedProducts
            categoryId={String(category._id)}
            excludeId={id}
            currency={store.currency ?? 'ARS'}
            catalogSlug={catalogSlug}
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

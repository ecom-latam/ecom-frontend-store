import { Suspense } from 'react';
import { redirect } from 'next/navigation';

import { getCategories, getProducts, getPageInfo } from '@/lib/api/storeClient';
import { Text } from 'zoui';
import { ProductGrid } from './ProductGrid';
import styles from './page.module.scss';

interface Props {
  searchParams: { page?: string; categoryId?: string; q?: string; view?: string };
}

export default async function ProductosPage({ searchParams }: Props) {
  const page = Math.max(parseInt(searchParams.page ?? '1', 10) || 1, 1);
  const limit = 30;

  const [storeInfo, categories] = await Promise.all([
    getPageInfo(),
    getCategories(),
  ]);

  // EC-714: si el catalog_slug cambió, redirigir al slug configurado
  const catalogSlug = storeInfo?.catalog_slug ?? 'productos';
  if (catalogSlug !== 'productos') {
    redirect(`/${catalogSlug}`);
  }

  // EC-559: tiendas tipo "informativa" no tienen catalogo.
  if (storeInfo?.hasCatalog === false) {
    redirect('/');
  }

  const productsRes = await getProducts({
    page,
    limit,
    categoryId: searchParams.categoryId,
    q: searchParams.q,
    hideOutOfStock: storeInfo?.store?.hide_out_of_stock_products,
  });

  const totalPages = Math.ceil(productsRes.total / limit);

  const catalogLabel = storeInfo?.catalog_label ?? 'Productos';

  return (
    <main className={styles.root} style={{ background: 'var(--color-bg-surface)' }}>
      <div className={styles.container}>
        <Text variant="heading-2" style={{ marginBottom: '24px' }}>{catalogLabel}</Text>

        <Suspense>
          <ProductGrid
            products={productsRes.data}
            categories={categories}
            total={productsRes.total}
            page={page}
            totalPages={totalPages}
            currentCategoryId={searchParams.categoryId}
            currentQ={searchParams.q}
            currentView={searchParams.view === 'list' ? 'list' : 'grid'}
          />
        </Suspense>
      </div>
    </main>
  );
}

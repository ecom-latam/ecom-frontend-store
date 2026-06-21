import { Suspense } from 'react';

import { getCategories, getProducts, getStoreInfo } from '@/lib/api/storeClient';
import { Text } from 'zoui';
import { ProductGrid } from './ProductGrid';

interface Props {
  searchParams: { page?: string; categoryId?: string; q?: string; view?: string };
}

export default async function ProductosPage({ searchParams }: Props) {
  const page = Math.max(parseInt(searchParams.page ?? '1', 10) || 1, 1);
  const limit = 30;

  const [storeInfo, categories] = await Promise.all([
    getStoreInfo(),
    getCategories(),
  ]);

  const productsRes = await getProducts({
    page,
    limit,
    categoryId: searchParams.categoryId,
    q: searchParams.q,
    hideOutOfStock: storeInfo?.hide_out_of_stock_products,
  });

  const totalPages = Math.ceil(productsRes.total / limit);

  return (
    <main className="min-h-screen" style={{ background: 'var(--color-bg-surface)' }}>
      <div className="max-w-7xl mx-auto px-4 py-8">
        <Text variant="heading-2" as="h1" style={{ marginBottom: '24px' }}>Productos</Text>

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

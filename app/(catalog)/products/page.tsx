import { Suspense } from 'react';

import { getCategories, getProducts } from '@/lib/api/storeClient';
import { ProductGrid } from './ProductGrid';

interface Props {
  searchParams: { page?: string; categoryId?: string; q?: string; view?: string };
}

export default async function ProductsPage({ searchParams }: Props) {
  const page = Math.max(parseInt(searchParams.page ?? '1', 10) || 1, 1);
  const limit = 30;

  const [productsRes, categories] = await Promise.all([
    getProducts({ page, limit, categoryId: searchParams.categoryId, q: searchParams.q }),
    getCategories(),
  ]);

  const totalPages = Math.ceil(productsRes.total / limit);

  return (
    <main className="min-h-screen bg-white">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Productos</h1>

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

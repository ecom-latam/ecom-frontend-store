import { Suspense } from 'react';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getPageBySlug, getPageInfo, getCategories, getProducts } from '@/lib/api/storeClient';
import { DynamicPage } from '@/components/catalog/DynamicPage';
import { Text } from 'zoui';
import { ProductGrid } from '../productos/ProductGrid';
import styles from './page.module.scss';

interface Props {
  params: { pageSlug: string };
  searchParams: { page?: string; categoryId?: string; q?: string; view?: string };
}

// Pagina dinamica del page builder (cualquier slug que no sea
// 'home', que vive en (catalog)/page.tsx). 'home' nunca llega hasta acá --
// Next no matchea /[pageSlug] contra /, solo contra /<algo>.
//
// EC-714: si el slug coincide con catalog_slug configurado, se renderiza
// la pagina de catalogo en vez de buscar una pagina del page builder.
// Esto permite que el slug del catalogo sea configurable (default: 'productos').
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const storeInfo = await getPageInfo();
  const catalogSlug = storeInfo?.catalog_slug ?? 'productos';
  if (params.pageSlug === catalogSlug) {
    return { title: storeInfo?.catalog_label || 'Productos' };
  }
  const page = await getPageBySlug(params.pageSlug);
  return { title: page?.title || undefined };
}

export default async function DynamicPageRoute({ params, searchParams }: Props) {
  const storeInfo = await getPageInfo();
  const catalogSlug = storeInfo?.catalog_slug ?? 'productos';

  if (params.pageSlug === catalogSlug) {
    if (storeInfo?.hasCatalog === false) notFound();

    const pageNum = Math.max(parseInt(searchParams.page ?? '1', 10) || 1, 1);
    const limit = 30;
    const [categories, productsRes] = await Promise.all([
      getCategories(),
      getProducts({
        page: pageNum,
        limit,
        categoryId: searchParams.categoryId,
        q: searchParams.q,
        hideOutOfStock: storeInfo?.store?.hide_out_of_stock_products,
      }),
    ]);
    const totalPages = Math.ceil(productsRes.total / limit);
    const catalogLabel = storeInfo?.catalog_label ?? 'Productos';

    return (
      <main className={styles.root} style={{ background: 'var(--color-bg-surface)' }}>
        <div className={styles.container}>
          <Text variant="heading-2" as="h1" style={{ marginBottom: '24px' }}>{catalogLabel}</Text>
          <Suspense>
            <ProductGrid
              products={productsRes.data}
              categories={categories}
              total={productsRes.total}
              page={pageNum}
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

  const page = await getPageBySlug(params.pageSlug);
  if (!page) notFound();
  return <DynamicPage page={page} />;
}

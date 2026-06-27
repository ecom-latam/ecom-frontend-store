'use client';

import { useSearchParams } from 'next/navigation';
import { Text, DynamicPageRenderer } from 'zoui';
import type { PageContent } from '@/lib/api/storeClient';

// EC-587: pagina generica del page builder (cualquier slug que no sea
// 'home'). EC-695: migrado a DynamicPageRenderer (grilla plana).
export function DynamicPage({ page }: { page: PageContent }) {
  const showGrid = useSearchParams().has('showGrid');

  return (
    <main className="min-h-screen" style={{ background: 'var(--color-bg-surface)' }}>
      <div className="p-4">
        {page.title && (
          <Text variant="heading-1" tag="h1" style={{ marginBottom: '24px' }}>{page.title}</Text>
        )}

        {page.blocks.length === 0 ? (
          <Text variant="body-sm" color="muted" tag="p">
            Esta página todavía no tiene contenido.
          </Text>
        ) : (
          <DynamicPageRenderer blocks={page.blocks} showGrid={showGrid} />
        )}
      </div>
    </main>
  );
}

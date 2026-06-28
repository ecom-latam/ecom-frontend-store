'use client';

import { DynamicPageRenderer } from 'zoui';
import type { PageContent } from '@/lib/api/storeClient';
import { PageUnderConstruction } from './PageUnderConstruction';

// EC-587: pagina generica del page builder (cualquier slug que no sea
// 'home'). EC-695: migrado a DynamicPageRenderer (grilla plana).
export function DynamicPage({ page }: { page: PageContent }) {
  return (
    <main className="min-h-screen" style={{ background: page.backgroundColor ?? 'var(--color-bg-surface)' }}>
      <div className="p-4">
        {page.blocks.length === 0
          ? <PageUnderConstruction />
          : <DynamicPageRenderer blocks={page.blocks} showGrid={page.workInProgress} />
        }
      </div>
    </main>
  );
}

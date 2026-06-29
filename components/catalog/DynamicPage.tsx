'use client';

import { DynamicPageRenderer } from 'zoui';
import type { PageContent } from '@/lib/api/storeClient';
import { PageUnderConstruction } from './PageUnderConstruction';
import styles from './DynamicPage.module.scss';

// EC-587: pagina generica del page builder (cualquier slug que no sea
// 'home'). EC-695: migrado a DynamicPageRenderer (grilla plana).
export function DynamicPage({ page }: { page: PageContent }) {
  return (
    <main className={styles.root} style={{ background: 'var(--color-bg-surface)' }}>
      <div className={styles.content}>
        {page.blocks.length === 0
          ? <PageUnderConstruction />
          : <DynamicPageRenderer blocks={page.blocks} showGrid={page.workInProgress} />
        }
      </div>
    </main>
  );
}

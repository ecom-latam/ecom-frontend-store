'use client';

import { Text, PageRow, PageBlockRenderer } from 'zoui';
import type { PageContent } from '@/lib/api/storeClient';

// EC-587: pagina generica del page builder (cualquier slug que no sea
// 'home'). A diferencia de InformationalHome (logo/nombre/descripcion de la
// tienda), esta solo tiene su propio titulo + las rows de contenido.
export function DynamicPage({ page }: { page: PageContent }) {
  return (
    <main className="min-h-screen" style={{ background: 'var(--color-bg-surface)' }}>
      <div className="p-4">
        {page.title && (
          <Text variant="heading-1" tag="h1" style={{ marginBottom: '24px' }}>{page.title}</Text>
        )}

        {page.rows.length === 0 ? (
          <Text variant="body-sm" color="muted" tag="p">
            Esta página todavía no tiene contenido.
          </Text>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            {page.rows.map((row, i) => (
              <PageRow key={i} blocks={row.blocks} renderBlock={(block) => <PageBlockRenderer block={block} />} />
            ))}
          </div>
        )}
      </div>
    </main>
  );
}

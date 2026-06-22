'use client';

import Image from 'next/image';
import { Text, PageRow, PageBlockRenderer } from 'zoui';
import type { PageInfo } from '@/lib/api/storeClient';

// EC-559/EC-589: home de tiendas tipo "informativa" (sin catalogo) --
// renderiza el branding + las rows de contenido generico de ecom-page
// (EC-582/583, DynamicPageRenderer de zoui). 'use client' es necesario --
// PageRow recibe `renderBlock`, una funcion, y los Server Components no
// pueden pasar funciones como prop a un Client Component (PageRow es
// 'use client' en zoui).
export function InformationalHome({ storeInfo }: { storeInfo: PageInfo }) {
  const rows = storeInfo.rows ?? [];

  return (
    <main className="min-h-screen" style={{ background: 'var(--color-bg-surface)' }}>
      <div className="max-w-3xl mx-auto px-4 py-12">
        {storeInfo.logo_url && (
          <div style={{ position: 'relative', width: 96, height: 96, marginBottom: '24px', borderRadius: 'var(--radius-lg)', overflow: 'hidden' }}>
            <Image src={storeInfo.logo_url} alt={storeInfo.name} fill sizes="96px" className="object-cover" />
          </div>
        )}

        <Text variant="heading-1" tag="h1" style={{ marginBottom: '12px' }}>{storeInfo.name}</Text>

        {storeInfo.description && (
          <Text variant="body" color="secondary" tag="p" style={{ marginBottom: '24px' }}>{storeInfo.description}</Text>
        )}

        {rows.length === 0 ? (
          <Text variant="body-sm" color="muted" tag="p">
            Esta tienda todavía no agregó contenido a su página.
          </Text>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24, marginTop: 24 }}>
            {rows.map((row, i) => (
              <PageRow key={i} blocks={row.blocks} renderBlock={(block) => <PageBlockRenderer block={block} />} />
            ))}
          </div>
        )}
      </div>
    </main>
  );
}

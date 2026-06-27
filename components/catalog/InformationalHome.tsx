'use client';

import Image from 'next/image';
import { useSearchParams } from 'next/navigation';
import { Text, DynamicPageRenderer } from 'zoui';
import type { PageInfo } from '@/lib/api/storeClient';

// EC-559/EC-589: home de tiendas tipo "informativa" (sin catalogo) --
// renderiza el branding + los bloques de contenido generico de ecom-page.
// EC-695: migrado a DynamicPageRenderer (grilla plana, reemplaza PageRow).
// 'use client' necesario porque DynamicPageRenderer es Client Component.
export function InformationalHome({ storeInfo }: { storeInfo: PageInfo }) {
  // EC-658: la home se identifica por isHome: true, no por slug === 'home'.
  const blocks = storeInfo.pages?.find((p) => p.isHome)?.blocks ?? [];
  const showGrid = useSearchParams().has('showGrid');

  // Si hay bloques, el page builder controla 100% del home — sin branding
  // hardcodeado arriba (nombre/logo/descripción ya están en la navbar y el
  // vendedor los incluye en la grilla si quiere). Sin bloques, muestra el
  // fallback de branding para que la home no quede vacía.
  if (blocks.length > 0) {
    return (
      <main className="min-h-screen" style={{ background: 'var(--color-bg-surface)' }}>
        <div className="p-4">
          <DynamicPageRenderer blocks={blocks} showGrid={showGrid} />
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen" style={{ background: 'var(--color-bg-surface)' }}>
      <div className="p-4">
        {storeInfo.logo_url && (
          <div style={{ position: 'relative', width: 96, height: 96, marginBottom: '24px', borderRadius: 'var(--radius-lg)', overflow: 'hidden' }}>
            <Image src={storeInfo.logo_url} alt={storeInfo.name} fill sizes="96px" className="object-cover" />
          </div>
        )}
        <Text variant="heading-1" tag="h1" style={{ marginBottom: '12px' }}>{storeInfo.name}</Text>
        {storeInfo.description && (
          <Text variant="body" color="secondary" tag="p" style={{ marginBottom: '24px' }}>{storeInfo.description}</Text>
        )}
        <Text variant="body-sm" color="muted" tag="p">
          Esta tienda todavía no agregó contenido a su página.
        </Text>
      </div>
    </main>
  );
}

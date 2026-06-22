import Image from 'next/image';
import { Text } from 'zoui';
import type { PageInfo } from '@/lib/api/storeClient';

type ContentBlock = { type: string; data: Record<string, unknown> };

function ContentBlockView({ block }: { block: ContentBlock }) {
  switch (block.type) {
    case 'heading':
      return typeof block.data.text === 'string'
        ? <Text variant="heading-2" as="h2" style={{ marginTop: '32px', marginBottom: '12px' }}>{block.data.text}</Text>
        : null;
    case 'text':
      return typeof block.data.text === 'string'
        ? <Text variant="body" as="p" style={{ marginBottom: '12px', whiteSpace: 'pre-wrap' }}>{block.data.text}</Text>
        : null;
    case 'image':
      return typeof block.data.url === 'string'
        ? (
          <div style={{ position: 'relative', width: '100%', aspectRatio: '16 / 9', marginBottom: '12px', borderRadius: 'var(--radius-lg)', overflow: 'hidden' }}>
            <Image
              src={block.data.url}
              alt={typeof block.data.alt === 'string' ? block.data.alt : ''}
              fill
              sizes="(max-width: 768px) 100vw, 720px"
              className="object-cover"
            />
          </div>
        )
        : null;
    default:
      return null;
  }
}

// EC-559: home de tiendas tipo "informativa" (sin catalogo) -- renderiza el
// branding y los bloques de contenido generico de ecom-page (EC-548). No
// existia ningun render de `content` en este storefront todavia.
export function InformationalHome({ storeInfo }: { storeInfo: PageInfo }) {
  const content = storeInfo.content ?? [];

  return (
    <main className="min-h-screen" style={{ background: 'var(--color-bg-surface)' }}>
      <div className="max-w-3xl mx-auto px-4 py-12">
        {storeInfo.logo_url && (
          <div style={{ position: 'relative', width: 96, height: 96, marginBottom: '24px', borderRadius: 'var(--radius-lg)', overflow: 'hidden' }}>
            <Image src={storeInfo.logo_url} alt={storeInfo.name} fill sizes="96px" className="object-cover" />
          </div>
        )}

        <Text variant="heading-1" as="h1" style={{ marginBottom: '12px' }}>{storeInfo.name}</Text>

        {storeInfo.description && (
          <Text variant="body" color="secondary" as="p" style={{ marginBottom: '24px' }}>{storeInfo.description}</Text>
        )}

        {content.length === 0 ? (
          <Text variant="body-sm" color="muted" as="p">
            Esta tienda todavía no agregó contenido a su página.
          </Text>
        ) : (
          content.map((block, i) => <ContentBlockView key={i} block={block} />)
        )}
      </div>
    </main>
  );
}

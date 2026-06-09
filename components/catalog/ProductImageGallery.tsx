'use client';

import { useState } from 'react';
import Image from 'next/image';

interface ProductImage {
  url: string;
  publicId: string;
  isMain: boolean;
}

interface Props {
  images: ProductImage[];
  productName: string;
}

export function ProductImageGallery({ images, productName }: Props) {
  const initialMain = images.find(i => i.isMain) ?? images[0] ?? null;
  const [activeUrl, setActiveUrl] = useState<string | null>(initialMain?.url ?? null);
  const [lightboxOpen, setLightboxOpen] = useState(false);

  if (images.length === 0) {
    return (
      <div className="aspect-square rounded-lg flex items-center justify-center text-6xl"
        style={{ background: 'var(--color-bg-subtle)', color: 'var(--color-fg-disabled)' }}>
        □
      </div>
    );
  }

  const displayUrl = activeUrl ?? images[0].url;

  return (
    <>
      <div className="flex flex-col gap-3">
        {/* Imagen principal */}
        <div
          className="aspect-square rounded-lg overflow-hidden"
          style={{ background: 'var(--color-bg-subtle)', cursor: 'zoom-in', position: 'relative' }}
          onClick={() => setLightboxOpen(true)}
        >
          <Image
            src={displayUrl}
            alt={productName}
            width={600}
            height={600}
            className="object-cover w-full h-full"
            priority
          />
          <div style={{
            position: 'absolute', bottom: 8, right: 8,
            background: 'rgba(0,0,0,0.4)', borderRadius: 6, padding: '4px 6px',
            color: '#fff', display: 'flex', alignItems: 'center', gap: 4,
            fontSize: 11, pointerEvents: 'none',
          }}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
              <line x1="11" y1="8" x2="11" y2="14" /><line x1="8" y1="11" x2="14" y2="11" />
            </svg>
            Zoom
          </div>
        </div>

        {/* Thumbnails */}
        {images.length > 1 && (
          <div className="flex gap-2 overflow-x-auto">
            {images.map((img) => {
              const isActive = img.url === displayUrl;
              return (
                <button
                  key={img.publicId}
                  onClick={() => setActiveUrl(img.url)}
                  style={{
                    width: 72, height: 72, flexShrink: 0,
                    borderRadius: 'var(--radius-md)', overflow: 'hidden', padding: 0, border: 'none',
                    outline: isActive ? '2px solid var(--color-brand-500)' : '1px solid var(--color-border-default)',
                    outlineOffset: isActive ? 2 : 0,
                    cursor: 'pointer', background: 'var(--color-bg-subtle)',
                    transition: 'outline 0.15s',
                  }}
                >
                  <Image
                    src={img.url}
                    alt=""
                    width={72}
                    height={72}
                    className="object-cover w-full h-full"
                  />
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Lightbox */}
      {lightboxOpen && (
        <div
          onClick={() => setLightboxOpen(false)}
          style={{
            position: 'fixed', inset: 0, zIndex: 9999,
            background: 'rgba(0,0,0,0.85)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'zoom-out',
          }}
        >
          <div style={{ position: 'relative', maxWidth: '90vw', maxHeight: '90vh' }}
            onClick={e => e.stopPropagation()}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={displayUrl}
              alt={productName}
              style={{ maxWidth: '90vw', maxHeight: '90vh', objectFit: 'contain', borderRadius: 8 }}
            />
            <button
              onClick={() => setLightboxOpen(false)}
              style={{
                position: 'absolute', top: -12, right: -12,
                width: 32, height: 32, borderRadius: '50%',
                background: 'rgba(255,255,255,0.15)', color: '#fff',
                border: 'none', cursor: 'pointer', fontSize: 18, lineHeight: 1,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}
            >×</button>
          </div>
        </div>
      )}
    </>
  );
}

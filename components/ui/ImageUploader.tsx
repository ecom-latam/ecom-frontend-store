'use client';

import { useRef, useState } from 'react';
import { products as productsApi } from '@/utils/api';
import type { ProductImage } from '@/utils/api';

const MAX_IMAGES = 10;

interface Props {
  productId: string;
  images: ProductImage[];
  onImagesChange: (images: ProductImage[]) => void;
}

export function ImageUploader({ productId, images, onImagesChange }: Props) {
  const [uploading, setUploading]       = useState(false);
  const [deletingId, setDeletingId]     = useState<string | null>(null);
  const [settingMainId, setSettingMain] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    setUploading(true);
    try {
      const { data } = await productsApi.uploadImages(productId, Array.from(files));
      onImagesChange(data);
    } catch {
      // interceptor de axios maneja el error
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  }

  async function handleDelete(publicId: string) {
    setDeletingId(publicId);
    try {
      const { data } = await productsApi.deleteImage(productId, publicId);
      onImagesChange(data);
    } catch {
    } finally {
      setDeletingId(null);
    }
  }

  async function handleSetMain(publicId: string) {
    setSettingMain(publicId);
    try {
      const { data } = await productsApi.setMainImage(productId, publicId);
      onImagesChange(data);
    } catch {
    } finally {
      setSettingMain(null);
    }
  }

  const canUpload = images.length < MAX_IMAGES;

  return (
    <div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 8 }}>
        {images.map(img => {
          const busy = deletingId === img.publicId || settingMainId === img.publicId;
          return (
            <div key={img.publicId} style={{ position: 'relative', width: 80, height: 80, flexShrink: 0 }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={img.url}
                alt=""
                onClick={() => !img.isMain && !busy && handleSetMain(img.publicId)}
                style={{
                  width: 80, height: 80, objectFit: 'cover',
                  borderRadius: 'var(--radius-md)',
                  border: img.isMain
                    ? '2px solid var(--color-brand-500)'
                    : '1px solid var(--color-border-default)',
                  cursor: img.isMain ? 'default' : 'pointer',
                  opacity: busy ? 0.4 : 1,
                  transition: 'opacity 0.15s',
                }}
              />
              {img.isMain && (
                <div style={{
                  position: 'absolute', top: 4, left: 4,
                  background: 'var(--color-brand-500)', color: '#fff',
                  borderRadius: 3, padding: '1px 5px',
                  fontSize: 10, fontWeight: 600, lineHeight: '16px',
                  pointerEvents: 'none',
                }}>
                  Principal
                </div>
              )}
              {!busy && (
                <button
                  onClick={() => handleDelete(img.publicId)}
                  style={{
                    position: 'absolute', top: 4, right: 4,
                    width: 20, height: 20, borderRadius: '50%',
                    background: 'rgba(0,0,0,0.55)', color: '#fff',
                    border: 'none', cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 14, lineHeight: 1, padding: 0,
                  }}
                >
                  ×
                </button>
              )}
            </div>
          );
        })}

        {canUpload && (
          <button
            onClick={() => inputRef.current?.click()}
            disabled={uploading}
            style={{
              width: 80, height: 80, flexShrink: 0,
              borderRadius: 'var(--radius-md)',
              border: '1.5px dashed var(--color-border-default)',
              background: 'transparent',
              cursor: uploading ? 'wait' : 'pointer',
              display: 'flex', flexDirection: 'column',
              alignItems: 'center', justifyContent: 'center',
              gap: 4, color: 'var(--color-fg-muted)',
            }}
          >
            {uploading ? (
              <span style={{ fontSize: 11 }}>Subiendo…</span>
            ) : (
              <>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
                </svg>
                <span style={{ fontSize: 10 }}>Agregar</span>
              </>
            )}
          </button>
        )}
      </div>

      <p style={{ fontSize: 11, color: 'var(--color-fg-muted)', margin: 0 }}>
        {images.length > 0
          ? `${images.length}/${MAX_IMAGES} imágenes · Clic en una imagen para hacerla principal`
          : 'Sin imágenes · Agregá hasta 10'}
      </p>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        style={{ display: 'none' }}
        onChange={e => handleFiles(e.target.files)}
      />
    </div>
  );
}

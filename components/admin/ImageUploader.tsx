'use client';

import { useRef, useState, useEffect } from 'react';
import Image from 'next/image';

export type ProductImage = {
  url: string;
  publicId: string;
  isMain: boolean;
};

type Props = {
  productId: string;
  initialImages?: ProductImage[];
  onChange?: (images: ProductImage[]) => void;
};

const MAX_IMAGES = 10;
const UPLOAD_BATCH = 5;

export default function ImageUploader({ productId, initialImages = [], onChange }: Props) {
  const [images, setImages] = useState<ProductImage[]>(initialImages);
  const [savedOrder, setSavedOrder] = useState(initialImages.map((i) => i.publicId).join(','));
  const [pending, setPending] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [actionFor, setActionFor] = useState<string | null>(null);
  const [error, setError] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const previewsRef = useRef<string[]>([]);
  previewsRef.current = previews;

  useEffect(() => {
    return () => { previewsRef.current.forEach(URL.revokeObjectURL); };
  }, []);

  const currentOrder = images.map((i) => i.publicId).join(',');
  const orderChanged = currentOrder !== savedOrder;

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    if (!files.length) return;

    const totalAfter = images.length + pending.length + files.length;
    if (totalAfter > MAX_IMAGES) {
      const allowed = MAX_IMAGES - images.length - pending.length;
      if (allowed <= 0) {
        setError(`Ya alcanzaste el máximo de ${MAX_IMAGES} imágenes.`);
        e.target.value = '';
        return;
      }
      setError(`Solo podés agregar ${allowed} imagen${allowed !== 1 ? 'es' : ''} más.`);
      const trimmed = files.slice(0, allowed);
      setPending((prev) => [...prev, ...trimmed]);
      setPreviews((prev) => [...prev, ...trimmed.map((f) => URL.createObjectURL(f))]);
    } else {
      setError('');
      setPending((prev) => [...prev, ...files]);
      setPreviews((prev) => [...prev, ...files.map((f) => URL.createObjectURL(f))]);
    }

    e.target.value = '';
  }

  async function handleUpload() {
    if (!pending.length) return;
    setUploading(true);
    setError('');

    try {
      let updated = [...images];

      for (let i = 0; i < pending.length; i += UPLOAD_BATCH) {
        const batch = pending.slice(i, i + UPLOAD_BATCH);
        const form = new FormData();
        batch.forEach((f) => form.append('images', f));

        const res = await fetch(`/api/admin/products/${productId}/images`, {
          method: 'POST',
          body: form,
        });

        if (!res.ok) {
          if (res.status === 401) { window.location.href = '/admin/login'; return; }
          const data = await res.json().catch(() => ({}));
          throw new Error((data as { error?: string }).error ?? 'UPLOAD_FAILED');
        }

        updated = await res.json();
      }

      previews.forEach(URL.revokeObjectURL);
      setImages(updated);
      setSavedOrder(updated.map((i) => i.publicId).join(','));
      setPending([]);
      setPreviews([]);
      onChange?.(updated);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al subir imágenes.');
    } finally {
      setUploading(false);
    }
  }

  function handleDiscard() {
    previews.forEach(URL.revokeObjectURL);
    setPending([]);
    setPreviews([]);
    setError('');
  }

  function move(index: number, direction: -1 | 1) {
    setImages((prev) => {
      const next = [...prev];
      const target = index + direction;
      if (target < 0 || target >= next.length) return prev;
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  }

  async function handleSaveOrder() {
    setSaving(true);
    setError('');
    try {
      const res = await fetch(`/api/admin/products/${productId}/images`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ order: images.map((i) => i.publicId) }),
      });
      if (!res.ok) {
        if (res.status === 401) { window.location.href = '/admin/login'; return; }
        throw new Error('ORDER_FAILED');
      }
      const updated: ProductImage[] = await res.json();
      setImages(updated);
      setSavedOrder(updated.map((i) => i.publicId).join(','));
      onChange?.(updated);
    } catch {
      setError('No se pudo guardar el orden.');
    } finally {
      setSaving(false);
    }
  }

  async function handleSetMain(publicId: string) {
    setActionFor(publicId);
    setError('');
    try {
      const res = await fetch(`/api/admin/products/${productId}/images`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ publicId }),
      });
      if (!res.ok) {
        if (res.status === 401) { window.location.href = '/admin/login'; return; }
        throw new Error('SET_MAIN_FAILED');
      }
      const updated: ProductImage[] = await res.json();
      setImages(updated);
      setSavedOrder(updated.map((i) => i.publicId).join(','));
      onChange?.(updated);
    } catch {
      setError('No se pudo marcar como principal.');
    } finally {
      setActionFor(null);
    }
  }

  async function handleDelete(publicId: string) {
    if (!confirm('¿Eliminar esta imagen?')) return;
    setActionFor(publicId);
    setError('');
    try {
      const res = await fetch(`/api/admin/products/${productId}/images`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ publicId }),
      });
      if (!res.ok) {
        if (res.status === 401) { window.location.href = '/admin/login'; return; }
        throw new Error('DELETE_FAILED');
      }
      const updated: ProductImage[] = await res.json();
      setImages(updated);
      setSavedOrder(updated.map((i) => i.publicId).join(','));
      onChange?.(updated);
    } catch {
      setError('No se pudo eliminar la imagen.');
    } finally {
      setActionFor(null);
    }
  }

  const totalCount = images.length + pending.length;
  const canAdd = totalCount < MAX_IMAGES;

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm text-gray-500">
          {totalCount} de {MAX_IMAGES} imágenes
        </span>
        {canAdd && (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="text-sm text-gray-900 font-medium hover:underline"
          >
            + Agregar imágenes
          </button>
        )}
        <input
          ref={inputRef}
          type="file"
          multiple
          accept="image/*"
          className="hidden"
          onChange={handleFileSelect}
        />
      </div>

      {images.length === 0 && pending.length === 0 && (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="w-full border-2 border-dashed border-gray-300 rounded-lg py-8 text-sm text-gray-400 hover:border-gray-400 hover:text-gray-500 transition-colors mb-2"
        >
          Hacé clic para agregar imágenes
        </button>
      )}

      {images.length > 0 && (
        <div className="space-y-2 mb-3">
          {images.map((img, idx) => (
            <div key={img.publicId} className="flex items-center gap-3 p-2 border border-gray-200 rounded-lg bg-white">
              <div className="relative w-14 h-14 flex-shrink-0 rounded overflow-hidden border border-gray-100">
                <Image src={img.url} alt="" fill className="object-cover" sizes="56px" />
              </div>

              <div className="flex-1 min-w-0">
                {img.isMain && (
                  <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-gray-900 text-white">
                    Principal
                  </span>
                )}
              </div>

              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => move(idx, -1)}
                  disabled={idx === 0 || actionFor === img.publicId}
                  className="p-1 text-gray-400 hover:text-gray-700 disabled:opacity-30"
                  title="Subir"
                >
                  ↑
                </button>
                <button
                  type="button"
                  onClick={() => move(idx, 1)}
                  disabled={idx === images.length - 1 || actionFor === img.publicId}
                  className="p-1 text-gray-400 hover:text-gray-700 disabled:opacity-30"
                  title="Bajar"
                >
                  ↓
                </button>
                {!img.isMain && (
                  <button
                    type="button"
                    onClick={() => handleSetMain(img.publicId)}
                    disabled={orderChanged || actionFor === img.publicId}
                    title={orderChanged ? 'Guardá el orden primero' : undefined}
                    className="px-2 py-1 text-xs text-gray-600 hover:text-gray-900 disabled:opacity-50"
                  >
                    {actionFor === img.publicId ? '...' : 'Marcar principal'}
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => handleDelete(img.publicId)}
                  disabled={orderChanged || actionFor === img.publicId}
                  title={orderChanged ? 'Guardá el orden primero' : undefined}
                  className="px-2 py-1 text-xs text-red-500 hover:text-red-700 disabled:opacity-50"
                >
                  {actionFor === img.publicId ? '...' : 'Eliminar'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {pending.length > 0 && (
        <div className="grid grid-cols-4 gap-2 mb-3">
          {previews.map((src, i) => (
            <div key={src} className="relative aspect-square rounded-md overflow-hidden border-2 border-dashed border-gray-300 opacity-70">
              <Image src={src} alt={`Pendiente ${i + 1}`} fill className="object-cover" sizes="120px" />
            </div>
          ))}
        </div>
      )}

      {error && <p className="text-sm text-red-600 mb-2">{error}</p>}

      <div className="flex items-center gap-3">
        {orderChanged && (
          <button
            type="button"
            onClick={handleSaveOrder}
            disabled={saving}
            className="bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm px-3 py-1.5 rounded-md transition-colors disabled:opacity-50"
          >
            {saving ? 'Guardando...' : 'Guardar orden'}
          </button>
        )}
        {pending.length > 0 && (
          <>
            <button
              type="button"
              onClick={handleUpload}
              disabled={uploading}
              className="bg-gray-900 text-white text-sm font-medium px-4 py-1.5 rounded-md hover:bg-gray-700 disabled:opacity-50 transition-colors"
            >
              {uploading ? 'Subiendo...' : `Subir ${pending.length} imagen${pending.length !== 1 ? 'es' : ''}`}
            </button>
            {!uploading && (
              <button
                type="button"
                onClick={handleDiscard}
                className="text-sm text-gray-400 hover:text-gray-600"
              >
                Descartar
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
}

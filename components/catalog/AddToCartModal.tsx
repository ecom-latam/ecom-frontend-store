'use client';

import { useMemo, useState } from 'react';

import { useCart } from '@/context/CartContext';
import type { Product, ProductVariant } from '@/lib/api/storeClient';
import { Button } from '@/components/ui/Button';

interface Props {
  product: Product;
  onClose: () => void;
}

function findMatchingVariant(
  variants: ProductVariant[],
  selected: Record<string, string>
): ProductVariant | undefined {
  return variants.find(
    (v) =>
      v.enabled &&
      v.combination.every((entry) => selected[entry.optionName] === entry.value)
  );
}

function isValueAvailable(
  variants: ProductVariant[],
  optionName: string,
  value: string,
  selected: Record<string, string>
): boolean {
  return variants.some(
    (v) =>
      v.enabled &&
      v.combination.some((e) => e.optionName === optionName && e.value === value) &&
      v.combination.every(
        (e) =>
          e.optionName === optionName ||
          selected[e.optionName] === undefined ||
          selected[e.optionName] === e.value
      )
  );
}

export function AddToCartModal({ product, onClose }: Props) {
  const { addItem, openDrawer } = useCart();

  const optionNames = useMemo(
    () => product.linkedOptions.map((o) => o.storeOptionName),
    [product.linkedOptions]
  );

  const optionValues = useMemo(() => {
    const map: Record<string, string[]> = {};
    for (const name of optionNames) {
      const seen = new Set<string>();
      for (const v of product.variants) {
        const entry = v.combination.find((e) => e.optionName === name);
        if (entry && !seen.has(entry.value)) {
          seen.add(entry.value);
          if (!map[name]) map[name] = [];
          map[name].push(entry.value);
        }
      }
    }
    return map;
  }, [optionNames, product.variants]);

  const [selectedOptions, setSelectedOptions] = useState<Record<string, string>>(() => {
    if (!product.hasVariants) return {};
    const initial: Record<string, string> = {};
    for (const name of optionNames) {
      const values = optionValues[name] ?? [];
      if (values.length === 1) initial[name] = values[0];
    }
    return initial;
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const allOptionsSelected =
    !product.hasVariants ||
    optionNames.every((name) => selectedOptions[name] !== undefined);

  const matchedVariant = product.hasVariants
    ? findMatchingVariant(product.variants, selectedOptions)
    : undefined;

  const canAddToCart = !product.hasVariants || (allOptionsSelected && matchedVariant !== undefined);

  function selectValue(optionName: string, value: string) {
    setSelectedOptions((prev) => {
      const next = { ...prev, [optionName]: value };
      for (const name of optionNames) {
        if (name === optionName) continue;
        if (
          next[name] !== undefined &&
          !isValueAvailable(product.variants, name, next[name], next)
        ) {
          delete next[name];
        }
      }
      return next;
    });
  }

  async function handleConfirm() {
    if (!canAddToCart) return;
    setIsSubmitting(true);
    setError(null);

    const result = await addItem({
      productId: product._id,
      selectedOptions: product.hasVariants ? selectedOptions : undefined,
    });

    setIsSubmitting(false);

    if (result.ok) {
      onClose();
      openDrawer();
    } else if (result.error === 'INSUFFICIENT_STOCK') {
      setError(`Sin stock suficiente. Disponible: ${result.available ?? 0}`);
    } else if (result.error === 'MISSING_OPTION' || result.error === 'INVALID_COMBINATION') {
      setError('Por favor seleccioná todas las opciones.');
    } else {
      setError('No se pudo agregar al carrito. Intentá de nuevo.');
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-white w-full sm:max-w-md rounded-t-2xl sm:rounded-2xl p-6 shadow-xl">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h2 className="font-semibold text-gray-900 text-base">{product.name}</h2>
            <p className="text-sm text-gray-500 mt-0.5">
              ${(product.salePrice ?? product.price).toLocaleString('es-AR')}
            </p>
          </div>
          <button onClick={onClose} className="btn btn--ghost btn--square btn--sm" style={{ marginTop: -4 }}>
            ✕
          </button>
        </div>

        {product.hasVariants && optionNames.length > 0 && (
          <div className="space-y-4 mb-6">
            {optionNames.map((name) => (
              <div key={name}>
                <p className="text-sm font-medium text-gray-700 mb-2">{name}</p>
                <div className="flex flex-wrap gap-2">
                  {(optionValues[name] ?? []).map((value) => {
                    const isSelected = selectedOptions[name] === value;
                    const available = isValueAvailable(product.variants, name, value, selectedOptions);
                    return (
                      <button
                        key={value}
                        onClick={() => available && selectValue(name, value)}
                        disabled={!available}
                        className={`btn btn--sm btn--rounded ${
                          isSelected ? 'btn--filled' : 'btn--outlined'
                        } ${!available ? 'opacity-40 cursor-not-allowed' : ''}`}
                      >
                        {value}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}

        {!product.hasVariants && (
          <p className="text-sm text-gray-500 mb-6">¿Confirmás que querés agregar este producto?</p>
        )}

        {error && (
          <p className="field__hint field__hint--error mb-4">{error}</p>
        )}

        <Button
          onClick={handleConfirm}
          disabled={!canAddToCart}
          loading={isSubmitting}
          variant="filled"
          shape="pill"
          size="md"
          style={{ width: '100%' }}
        >
          {isSubmitting ? 'Agregando...' : 'Agregar al carrito'}
        </Button>
      </div>
    </div>
  );
}

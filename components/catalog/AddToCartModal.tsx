'use client';

import { useMemo, useState } from 'react';

import { useCart } from '@/context/CartContext';
import type { Product, ProductVariant } from '@/lib/api/storeClient';
import { Modal, Button, Text } from 'zoui';
import { usePageConfig } from '@/context/PageConfigContext';
import { formatPrice } from '@/lib/format';

interface Props {
  product: Product;
  open: boolean;
  onClose: () => void;
  initialQuantity?: number;
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
      (v.availableStock ?? v.stock) > 0 &&
      v.combination.some((e) => e.optionName === optionName && e.value === value) &&
      v.combination.every(
        (e) =>
          e.optionName === optionName ||
          selected[e.optionName] === undefined ||
          selected[e.optionName] === e.value
      )
  );
}

export function AddToCartModal({ product, open, onClose, initialQuantity = 1 }: Props) {
  const { addItem, openDrawer } = useCart();
  const { store } = usePageConfig();
  const currency = store?.currency;

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

  const canAddToCart =
    !product.hasVariants
      ? (product.availableStock ?? product.stock) > 0
      : allOptionsSelected && matchedVariant !== undefined && (matchedVariant.availableStock ?? matchedVariant.stock) > 0;

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
      quantity: initialQuantity,
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
    <Modal open={open} size="md" onClose={onClose}>
      <Modal.Header>{product.name}</Modal.Header>
      <Modal.Body>
        <Text variant="body-sm" color="secondary" style={{ marginBottom: '16px' }}>
          {formatPrice(product.salePrice ?? product.price, currency)}
        </Text>

        {product.hasVariants && optionNames.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '24px' }}>
            {optionNames.map((name) => (
              <div key={name}>
                <Text variant="body-sm" weight="medium" style={{ marginBottom: '8px' }}>
                  {name}
                </Text>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                  {(optionValues[name] ?? []).map((value) => {
                    const isSelected = selectedOptions[name] === value;
                    const available = isValueAvailable(product.variants, name, value, selectedOptions);
                    return (
                      <Button
                        key={value}
                        size="md"
                        emphasis={isSelected ? 'filled' : 'outlined'}
                        onClick={() => available && selectValue(name, value)}
                        disabled={!available}
                        style={!available ? { opacity: 0.4 } : undefined}
                      >
                        {value}
                      </Button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}

        {!product.hasVariants && (
          <Text variant="body-sm" color="secondary" style={{ marginBottom: '24px' }}>
            ¿Confirmás que querés agregar este producto?
          </Text>
        )}

        {error && (
          <Text variant="body-sm" style={{ color: 'var(--color-error-500)', marginTop: '8px' }}>
            {error}
          </Text>
        )}
      </Modal.Body>
      <Modal.Footer>
        <Button
          size="md"
          onClick={handleConfirm}
          disabled={!canAddToCart || isSubmitting}
          style={{ width: '100%', justifyContent: 'center' }}
        >
          {isSubmitting ? 'Agregando...' : 'Agregar al carrito'}
        </Button>
      </Modal.Footer>
    </Modal>
  );
}

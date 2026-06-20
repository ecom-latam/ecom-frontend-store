'use client';

import { useState, useEffect } from 'react';
import { ChipGroup } from 'zoui';
import { Price } from './Price';
import type { Product, ProductVariant } from '@/lib/api/storeClient';

interface VariantSelectorProps {
  product: Product;
  onVariantChange?: (variant: ProductVariant | null, price: number, stock: number) => void;
}

function getOptionValues(product: Product, optionId: string): string[] {
  const seen = new Set<string>();
  const values: string[] = [];
  for (const v of product.variants) {
    const entry = v.combination.find(c => c.optionId === optionId);
    if (entry && !seen.has(entry.value)) {
      seen.add(entry.value);
      values.push(entry.value);
    }
  }
  return values;
}

function findVariant(product: Product, selection: Record<string, string>): ProductVariant | null {
  const optionIds = product.linkedOptions.map(o => o.storeOptionId);
  return (
    product.variants.find(v =>
      optionIds.every(id => {
        const entry = v.combination.find(c => c.optionId === id);
        return entry?.value === selection[id];
      })
    ) ?? null
  );
}

function isValueAvailable(product: Product, optionId: string, value: string, currentSelection: Record<string, string>): boolean {
  return product.variants.some(v => {
    if (v.enabled === false) return false;
    const entry = v.combination.find(c => c.optionId === optionId);
    if (entry?.value !== value) return false;
    return product.linkedOptions
      .filter(o => o.storeOptionId !== optionId)
      .every(o => {
        const sel = currentSelection[o.storeOptionId];
        if (!sel) return true;
        const e = v.combination.find(c => c.optionId === o.storeOptionId);
        return e?.value === sel;
      });
  });
}

export function VariantSelector({ product, onVariantChange }: VariantSelectorProps) {
  const [selection, setSelection] = useState<Record<string, string>>({});

  const selectedVariant = Object.keys(selection).length === product.linkedOptions.length
    ? findVariant(product, selection)
    : null;

  const displayPrice = selectedVariant?.price ?? product.salePrice ?? product.price;
  const displayStock = selectedVariant
    ? (selectedVariant.availableStock ?? selectedVariant.stock)
    : 0;

  useEffect(() => {
    onVariantChange?.(selectedVariant, displayPrice, displayStock);
  }, [selectedVariant, displayPrice, displayStock, onVariantChange]);

  function handleSelect(optionId: string, value: string) {
    setSelection(prev => ({ ...prev, [optionId]: value }));
  }

  if (!product.hasVariants || product.linkedOptions.length === 0) return null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {product.linkedOptions.map(option => {
        const values = getOptionValues(product, option.storeOptionId);
        const options = values.map(val => ({
          value: val,
          label: val,
          disabled: !isValueAvailable(product, option.storeOptionId, val, selection),
        }));
        return (
          <div key={option.storeOptionId}>
            <p style={{
              fontFamily: 'var(--font-ui)',
              fontSize: '12px',
              fontWeight: 600,
              color: 'var(--color-fg-secondary)',
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
              marginBottom: '8px',
            }}>
              {option.storeOptionName}
              {selection[option.storeOptionId] && (
                <span style={{ fontWeight: 400, textTransform: 'none', letterSpacing: 0, marginLeft: '8px', color: 'var(--color-fg-primary)' }}>
                  {selection[option.storeOptionId]}
                </span>
              )}
            </p>
            <ChipGroup
              name={option.storeOptionName}
              options={options}
              value={selection[option.storeOptionId]}
              onChange={val => handleSelect(option.storeOptionId, val)}
            />
          </div>
        );
      })}

      {selectedVariant && (
        <div style={{ fontSize: '13px', fontFamily: 'var(--font-ui)', color: 'var(--color-fg-secondary)' }}>
          Precio: <strong style={{ color: 'var(--color-fg-primary)' }}>
            <Price value={displayPrice} />
          </strong>
          {' · '}
          {displayStock > 0 ? `${displayStock} disponibles` : 'Sin stock para esta combinación'}
        </div>
      )}
    </div>
  );
}

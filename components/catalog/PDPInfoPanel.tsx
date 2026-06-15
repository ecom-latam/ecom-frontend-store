'use client';

import { useState, useCallback } from 'react';
import Link from 'next/link';
import { Text, Badge, QuantityStepper } from 'zoui';
import type { ChipGroupVariant, QuantityStepperVariant } from 'zoui';
import { Price } from './Price';
import { AddToCartButton } from './AddToCartButton';
import { BenefitsRow } from './BenefitsRow';
import { BuyNowButton } from './BuyNowButton';
import { SaveButton } from './SaveButton';
import { ShareButton } from './ShareButton';
import { VariantSelector } from './VariantSelector';
import type { Product, ProductVariant } from '@/lib/api/storeClient';

interface PDPInfoPanelProps {
  product: Product;
  hasSession: boolean;
  defaultPrice: number;
  defaultStock: number;
  hasDiscount: boolean;
  discountPercent: number | null;
  showInstallments: boolean;
  installmentsCount: number | null;
  interestFree: boolean;
  freeShippingMin: number | null | undefined;
  lowStockThreshold: number;
  shareEnabled: boolean;
  buyNowEnabled: boolean;
  returnsEnabled?: boolean;
  returnDays?: number;
  warrantyEnabled?: boolean;
  warrantyMonths?: number;
  chipVariant: ChipGroupVariant;
  categoryName?: string;
  categoryId?: string;
}

export function PDPInfoPanel({
  product,
  hasSession,
  defaultPrice,
  defaultStock,
  hasDiscount,
  discountPercent,
  showInstallments,
  installmentsCount,
  interestFree,
  freeShippingMin,
  lowStockThreshold,
  shareEnabled,
  buyNowEnabled,
  returnsEnabled,
  returnDays,
  warrantyEnabled,
  warrantyMonths,
  chipVariant,
  categoryName,
  categoryId,
}: PDPInfoPanelProps) {
  const [displayPrice, setDisplayPrice] = useState(defaultPrice);
  const [displayStock, setDisplayStock] = useState(defaultStock);
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(null);
  const [quantity, setQuantity] = useState(1);

  const handleVariantChange = useCallback(
    (variant: ProductVariant | null, price: number, stock: number) => {
      setSelectedVariant(variant);
      setDisplayPrice(price);
      setDisplayStock(stock);
      setQuantity(1);
    },
    []
  );

  const showFreeShipping = freeShippingMin !== null && freeShippingMin !== undefined
    && displayPrice >= freeShippingMin;

  const showLowStock = lowStockThreshold > 0 && displayStock > 0 && displayStock <= lowStockThreshold;

  const effectiveStock = product.hasVariants && selectedVariant === null
    ? 0
    : displayStock;

  const canBuy = effectiveStock > 0;

  return (
    <>
      {categoryName && categoryId && (
        <Link href={`/productos?categoryId=${categoryId}`} style={{ textDecoration: 'none', marginBottom: '8px', display: 'block' }}>
          <Text variant="overline" color="muted">{categoryName}</Text>
        </Link>
      )}

      <Text variant="heading-2" as="h1">{product.name}</Text>

      <div style={{ marginTop: '12px', display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
        <Text variant="heading-1" as="span"><Price value={displayPrice} /></Text>
        {hasDiscount && (
          <Text variant="body" color="muted" as="span" style={{ textDecoration: 'line-through' }}>
            <Price value={product.price} />
          </Text>
        )}
        {discountPercent && (
          <Badge variant="soft" tone="danger" size="sm">-{discountPercent}%</Badge>
        )}
      </div>

      {showInstallments && (
        <Text variant="body-sm" color="secondary" as="p" style={{ marginTop: '6px' }}>
          {interestFree
            ? `${installmentsCount} cuotas sin interés`
            : `Hasta ${installmentsCount} cuotas`}
        </Text>
      )}

      {product.description && (
        <Text variant="body-sm" color="secondary" as="p" style={{ marginTop: '16px', whiteSpace: 'pre-line' }}>
          {product.description}
        </Text>
      )}

      {product.hasVariants && product.linkedOptions.length > 0 && (
        <div style={{ marginTop: '24px' }}>
          <VariantSelector
            product={product}
            chipVariant={chipVariant}
            onVariantChange={handleVariantChange}
          />
        </div>
      )}

      <div style={{ marginTop: '20px', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
        {product.hasVariants && selectedVariant === null ? (
          <Text variant="body-sm" color="muted">Seleccioná una opción para ver disponibilidad</Text>
        ) : effectiveStock > 0 ? (
          <Badge variant="soft" tone={showLowStock ? 'warning' : 'success'} size="sm">
            {showLowStock ? 'Últimas unidades' : 'En stock'}
          </Badge>
        ) : (
          <Badge variant="soft" tone="danger" size="sm">Sin stock</Badge>
        )}
        {showFreeShipping && (
          <Badge variant="soft" tone="info" size="sm">Envío gratis</Badge>
        )}
      </div>

      {/* Buy bar */}
      <div style={{ marginTop: '24px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <QuantityStepper
            value={quantity}
            onChange={setQuantity}
            min={1}
            max={effectiveStock > 0 ? effectiveStock : 1}
            disabled={!canBuy}
            variant={chipVariant as unknown as QuantityStepperVariant}
          />
          <div style={{ flex: 1 }}>
            <AddToCartButton
              product={product}
              hasSession={hasSession}
              availableStock={effectiveStock}
              quantity={quantity}
            />
          </div>
          <SaveButton productId={product._id} />
        </div>

        {buyNowEnabled && hasSession && canBuy && (
          <BuyNowButton
            productId={product._id}
            quantity={quantity}
            selectedOptions={
              product.hasVariants && selectedVariant
                ? Object.fromEntries(selectedVariant.combination.map(e => [e.optionName, e.value]))
                : undefined
            }
          />
        )}
      </div>

      {shareEnabled && (
        <div style={{ marginTop: '16px' }}>
          <ShareButton title={product.name} />
        </div>
      )}

      <BenefitsRow
        freeShippingMin={freeShippingMin}
        returnsEnabled={returnsEnabled}
        returnDays={returnDays}
        warrantyEnabled={warrantyEnabled}
        warrantyMonths={warrantyMonths}
      />
    </>
  );
}

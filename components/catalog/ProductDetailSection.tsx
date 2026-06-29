'use client';

import { useState } from 'react';
import { ProductGallery } from './ProductGallery';
import { PDPInfoPanel } from './PDPInfoPanel';
import type { Product, ProductVariant } from '@/lib/api/storeClient';
import styles from './ProductDetailSection.module.scss';

interface ProductDetailSectionProps {
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
  categoryName?: string;
  categoryId?: string;
}

export function ProductDetailSection(props: ProductDetailSectionProps) {
  const { product } = props;
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(null);

  const galleryImages = selectedVariant && selectedVariant.images.length > 0
    ? selectedVariant.images
    : product.images;

  return (
    <div className={styles.grid}>
      <div data-testid="product-gallery-column">
        <ProductGallery images={galleryImages} productName={product.name} />
      </div>

      <div
        className={styles.infoColumn}
        style={{ position: 'sticky', top: '80px', alignSelf: 'start' }}
      >
        <PDPInfoPanel {...props} onVariantSelected={setSelectedVariant} />
      </div>
    </div>
  );
}

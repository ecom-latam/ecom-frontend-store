'use client';

import Image from 'next/image';
import styles from './ProductGallery.module.scss';

interface GalleryImage {
  url: string;
  publicId: string;
  isMain: boolean;
}

interface ProductGalleryProps {
  images: GalleryImage[];
  productName: string;
}

export function ProductGallery({ images, productName }: ProductGalleryProps) {
  const mainImage = images.find((img) => img.isMain) ?? images[0];
  const secondaryImages = images.filter((img) => img !== mainImage);

  return (
    <div className={styles.root} data-testid="product-gallery">
      <div
        className={styles.mainImage}
        style={{
          background: 'var(--color-bg-subtle)',
          aspectRatio: '4 / 5',
          position: 'relative',
        }}
      >
        {mainImage ? (
          <Image
            key={mainImage.publicId}
            src={mainImage.url}
            alt={productName}
            fill
            sizes="(max-width: 768px) 100vw, 50vw"
            style={{ objectFit: 'cover' }}
            priority
            data-testid="product-gallery-main-image"
          />
        ) : (
          <div className={styles.emptyPlaceholder} style={{ color: 'var(--color-fg-disabled)' }}>
            □
          </div>
        )}
      </div>

      {secondaryImages.length > 0 && (
        <div className={styles.thumbnails}>
          {secondaryImages.map((img, i) => (
            <div
              key={img.publicId}
              className={styles.thumbnail}
              style={{
                width: '72px',
                height: '90px',
                background: 'var(--color-bg-subtle)',
                position: 'relative',
              }}
            >
              <Image
                src={img.url}
                alt={`${productName} ${i + 2}`}
                fill
                sizes="72px"
                style={{ objectFit: 'cover' }}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

import Image from 'next/image';
import Link from 'next/link';
import type { ReactNode } from 'react';

type Variant = 'minimal' | 'classic' | 'bold';

interface Props {
  variant?: Variant;
  name: string;
  price: string;
  priceOld?: string;
  discount?: string;
  image?: { url: string; alt?: string };
  href?: string;
  cta?: ReactNode;
}

export function ProductCard({
  variant = 'classic',
  name,
  price,
  priceOld,
  discount,
  image,
  href,
  cta,
}: Props) {
  const inner = (
    <>
      <div className="product-card__media">
        {discount && <span className="product-card__discount">{discount}</span>}
        {image && (
          <Image
            src={image.url}
            alt={image.alt ?? name}
            width={400}
            height={400}
            className="object-cover w-full h-full"
          />
        )}
      </div>
      <div className="product-card__body">
        <h3 className="product-card__name">{name}</h3>
        <div className="product-card__prices">
          <span className="product-card__price">{price}</span>
          {priceOld && <span className="product-card__price-old">{priceOld}</span>}
        </div>
        {cta && <div className="product-card__cta">{cta}</div>}
      </div>
    </>
  );

  return (
    <article className={`product-card product-card--${variant}`}>
      {href ? <Link href={href}>{inner}</Link> : inner}
    </article>
  );
}

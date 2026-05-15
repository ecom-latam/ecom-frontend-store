import type { ReactNode } from 'react';

type Variant = 'normal' | 'compact' | 'wide';

interface Props {
  variant?: Variant;
  containerQuery?: boolean;
  children: ReactNode;
}

export function ProductGrid({ variant = 'normal', containerQuery = false, children }: Props) {
  const gridClass = [
    'product-grid',
    variant === 'compact' && 'product-grid--compact',
    variant === 'wide' && 'product-grid--wide',
  ]
    .filter(Boolean)
    .join(' ');

  if (containerQuery) {
    return (
      <div className="product-grid-host">
        <div className={gridClass}>{children}</div>
      </div>
    );
  }

  return <div className={gridClass}>{children}</div>;
}

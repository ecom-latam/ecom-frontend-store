import { ReactNode } from 'react';

type BadgeType = 'neutral' | 'info' | 'success' | 'warning' | 'error';
type BadgeShape = 'pill' | 'square';

interface Props {
  children: ReactNode;
  type?: BadgeType;
  shape?: BadgeShape;
  className?: string;
}

export function Badge({ children, type = 'neutral', shape = 'pill', className }: Props) {
  const cls = ['badge', `badge--${type}`, `badge--${shape}`, className]
    .filter(Boolean)
    .join(' ');

  return <span className={cls}>{children}</span>;
}

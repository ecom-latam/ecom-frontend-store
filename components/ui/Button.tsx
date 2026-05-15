import { ButtonHTMLAttributes, forwardRef } from 'react';

type Variant = 'filled' | 'outlined' | 'ghost';
type Shape = 'square' | 'rounded' | 'pill';
type Size = 'md' | 'sm';

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  shape?: Shape;
  size?: Size;
  loading?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, Props>(
  (
    { variant = 'filled', shape = 'rounded', size = 'md', loading, className, disabled, children, ...props },
    ref
  ) => {
    const cls = [
      'btn',
      `btn--${variant}`,
      `btn--${shape}`,
      `btn--${size}`,
      loading ? 'is-loading' : '',
      className,
    ]
      .filter(Boolean)
      .join(' ');

    return (
      <button ref={ref} className={cls} disabled={loading || disabled} {...props}>
        {children}
      </button>
    );
  }
);
Button.displayName = 'Button';

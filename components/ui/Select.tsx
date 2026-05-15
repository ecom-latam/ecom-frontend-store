import { SelectHTMLAttributes, forwardRef } from 'react';

type Variant = 'outlined' | 'underline';

interface Props extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  hint?: string;
  error?: string;
  variant?: Variant;
  fullWidth?: boolean;
}

const ChevronDown = () => (
  <svg
    className="field__chevron"
    viewBox="0 0 16 16"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M4 6l4 4 4-4" />
  </svg>
);

export const Select = forwardRef<HTMLSelectElement, Props>(
  (
    { label, hint, error, variant = 'outlined', fullWidth, id, className, children, ...props },
    ref
  ) => {
    const wrapperCls = [
      'field',
      `field--${variant}`,
      error ? 'is-error' : '',
      className,
    ]
      .filter(Boolean)
      .join(' ');

    return (
      <div className={wrapperCls} style={fullWidth ? { maxWidth: 'none' } : undefined}>
        {label && (
          <label htmlFor={id} className="field__label">
            {label}
          </label>
        )}
        <div className="field__control">
          <select ref={ref} id={id} {...props}>
            {children}
          </select>
          <ChevronDown />
        </div>
        {(hint || error) && (
          <span className={['field__hint', error ? 'field__hint--error' : ''].filter(Boolean).join(' ')}>
            {error || hint}
          </span>
        )}
      </div>
    );
  }
);
Select.displayName = 'Select';

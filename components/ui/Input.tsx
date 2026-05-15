import { InputHTMLAttributes, ReactNode, forwardRef } from 'react';

type Variant = 'outlined' | 'underline';

interface Props extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  labelAction?: ReactNode;
  hint?: string;
  error?: string;
  variant?: Variant;
  fullWidth?: boolean;
  inputClassName?: string;
}

export const Input = forwardRef<HTMLInputElement, Props>(
  (
    {
      label,
      labelAction,
      hint,
      error,
      variant = 'outlined',
      fullWidth,
      inputClassName,
      id,
      className,
      ...props
    },
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
        {(label || labelAction) && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            {label && (
              <label htmlFor={id} className="field__label">
                {label}
              </label>
            )}
            {labelAction}
          </div>
        )}
        <div className="field__control">
          <input ref={ref} id={id} className={inputClassName} {...props} />
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
Input.displayName = 'Input';

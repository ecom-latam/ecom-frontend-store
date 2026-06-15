import { Text } from 'zoui';

const MAX = 5;

interface AddressSlotsIndicatorProps {
  count: number;
}

export function AddressSlotsIndicator({ count }: AddressSlotsIndicatorProps) {
  const atLimit = count >= MAX;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '24px' }}>
      <div style={{ display: 'flex', gap: '5px' }}>
        {Array.from({ length: MAX }).map((_, i) => (
          <div
            key={i}
            style={{
              width: 28, height: 6, borderRadius: 3,
              background: i < count ? 'var(--color-brand-500)' : 'var(--color-border-default)',
              transition: 'background 0.2s',
            }}
          />
        ))}
      </div>
      <Text variant="caption" color="muted" style={{ fontWeight: atLimit ? 600 : 400 }}>
        {count} / {MAX}{atLimit && ' — límite alcanzado'}
      </Text>
    </div>
  );
}

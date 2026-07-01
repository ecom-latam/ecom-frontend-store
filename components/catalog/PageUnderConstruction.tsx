import { Text } from 'zoui';

export function PageUnderConstruction() {
  return (
    <div style={{
      display:        'flex',
      flexDirection:  'column',
      alignItems:     'center',
      justifyContent: 'center',
      minHeight:      '60vh',
      padding:        '48px 24px',
      textAlign:      'center',
      gap:            28,
    }}>
      <img
        src="/illustrations/construction-workers.webp"
        alt=""
        aria-hidden="true"
        style={{ objectFit: 'contain', width: '50vw', height: 'auto', maxWidth: 600 }}
      />

      <div style={{ maxWidth: 320 }}>
        <Text variant="heading-3" style={{ margin: '0 0 8px' }}>Estamos armando esta página</Text>
        <Text variant="body-sm" color="muted" style={{ margin: 0 }}>Volvé pronto, viene algo bueno.</Text>
      </div>
    </div>
  );
}

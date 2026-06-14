interface BenefitsRowProps {
  freeShippingMin?: number | null;
  returnsEnabled?: boolean;
  returnDays?: number;
  warrantyEnabled?: boolean;
  warrantyMonths?: number;
}

interface Benefit {
  icon: string;
  label: string;
}

function buildBenefits({
  freeShippingMin,
  returnsEnabled,
  returnDays,
  warrantyEnabled,
  warrantyMonths,
}: BenefitsRowProps): Benefit[] {
  const benefits: Benefit[] = [];

  if (freeShippingMin != null) {
    benefits.push({
      icon: '🚚',
      label: freeShippingMin === 0
        ? 'Envío gratis'
        : `Envío gratis en compras mayores a $${freeShippingMin.toLocaleString('es-AR')}`,
    });
  }

  if (returnsEnabled !== false && returnDays) {
    benefits.push({
      icon: '↩',
      label: `Devoluciones en ${returnDays} día${returnDays !== 1 ? 's' : ''}`,
    });
  }

  if (warrantyEnabled !== false && warrantyMonths) {
    benefits.push({
      icon: '🛡',
      label: `Garantía de ${warrantyMonths} mes${warrantyMonths !== 1 ? 'es' : ''}`,
    });
  }

  return benefits;
}

export function BenefitsRow(props: BenefitsRowProps) {
  const benefits = buildBenefits(props);
  if (benefits.length === 0) return null;

  return (
    <div
      style={{
        display:       'flex',
        flexWrap:      'wrap',
        gap:           '12px',
        marginTop:     '20px',
        paddingTop:    '20px',
        borderTop:     '1px solid var(--color-border-subtle)',
      }}
    >
      {benefits.map((b, i) => (
        <div
          key={i}
          style={{
            display:     'flex',
            alignItems:  'center',
            gap:         '6px',
            flex:        '1 1 140px',
          }}
        >
          <span aria-hidden="true" style={{ fontSize: '16px', lineHeight: 1 }}>
            {b.icon}
          </span>
          <span
            style={{
              fontFamily:  'var(--font-ui)',
              fontSize:    '12px',
              color:       'var(--color-fg-secondary)',
              lineHeight:  1.3,
            }}
          >
            {b.label}
          </span>
        </div>
      ))}
    </div>
  );
}

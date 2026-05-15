const ICON_GRID = (
  <svg viewBox="0 0 16 16" fill="currentColor" width="16" height="16" aria-hidden="true">
    <rect x="1" y="1" width="6" height="6" rx="1" />
    <rect x="9" y="1" width="6" height="6" rx="1" />
    <rect x="1" y="9" width="6" height="6" rx="1" />
    <rect x="9" y="9" width="6" height="6" rx="1" />
  </svg>
);

const ICON_LIST = (
  <svg viewBox="0 0 16 16" fill="currentColor" width="16" height="16" aria-hidden="true">
    <rect x="1" y="2" width="14" height="2" rx="1" />
    <rect x="1" y="7" width="14" height="2" rx="1" />
    <rect x="1" y="12" width="14" height="2" rx="1" />
  </svg>
);

type View = 'grid' | 'list';

interface Props {
  value: View;
  onChange: (value: View) => void;
  iconOnly?: boolean;
}

export function ViewToggle({ value, onChange, iconOnly = false }: Props) {
  const optionClass = (v: View) =>
    [
      'view-toggle__option',
      iconOnly && 'view-toggle__option--icon-only',
      value === v && 'is-active',
    ]
      .filter(Boolean)
      .join(' ');

  return (
    <div className="view-toggle" role="group" aria-label="Vista">
      <button
        className={optionClass('grid')}
        aria-pressed={value === 'grid'}
        aria-label="Grilla"
        onClick={() => onChange('grid')}
      >
        {ICON_GRID}
        <span className="view-toggle__label">Grilla</span>
      </button>
      <button
        className={optionClass('list')}
        aria-pressed={value === 'list'}
        aria-label="Lista"
        onClick={() => onChange('list')}
      >
        {ICON_LIST}
        <span className="view-toggle__label">Lista</span>
      </button>
    </div>
  );
}

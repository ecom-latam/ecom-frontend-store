const ICON_PREV = (
  <svg
    viewBox="0 0 16 16"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    width="16"
    height="16"
    aria-hidden="true"
  >
    <path d="M10 12L6 8l4-4" />
  </svg>
);

const ICON_NEXT = (
  <svg
    viewBox="0 0 16 16"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    width="16"
    height="16"
    aria-hidden="true"
  >
    <path d="M6 4l4 4-4 4" />
  </svg>
);

function pageTokens(total: number, current: number): (number | '…')[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  if (current <= 4) return [1, 2, 3, 4, 5, '…', total];
  if (current >= total - 3) return [1, '…', total - 4, total - 3, total - 2, total - 1, total];
  return [1, '…', current - 1, current, current + 1, '…', total];
}

interface Props {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  variant?: 'compact';
  size?: 'sm';
}

export function Pagination({ page, totalPages, onPageChange, variant, size }: Props) {
  const cls = ['pagination', variant && `pagination--${variant}`, size && `pagination--${size}`]
    .filter(Boolean)
    .join(' ');

  if (variant === 'compact') {
    return (
      <nav className={cls} role="navigation" aria-label="Paginación">
        <button
          className="pagination__cell pagination__cell--prev"
          disabled={page === 1}
          onClick={() => onPageChange(page - 1)}
        >
          {ICON_PREV} Anterior
        </button>
        <span className="pagination__counter">
          Página <strong>{page}</strong> de <strong>{totalPages}</strong>
        </span>
        <button
          className="pagination__cell pagination__cell--next"
          disabled={page === totalPages}
          onClick={() => onPageChange(page + 1)}
        >
          Siguiente {ICON_NEXT}
        </button>
      </nav>
    );
  }

  const tokens = pageTokens(totalPages, page);

  return (
    <nav className={cls} role="navigation" aria-label="Paginación">
      <button
        className="pagination__cell pagination__cell--prev"
        disabled={page === 1}
        onClick={() => onPageChange(page - 1)}
      >
        {ICON_PREV} Anterior
      </button>
      {tokens.map((token, i) =>
        token === '…' ? (
          <span key={`e-${i}`} className="pagination__ellipsis" aria-hidden="true">
            …
          </span>
        ) : (
          <button
            key={token}
            className={[
              'pagination__cell pagination__cell--page',
              token === page && 'is-active',
            ]
              .filter(Boolean)
              .join(' ')}
            aria-current={token === page ? 'page' : undefined}
            onClick={() => onPageChange(token as number)}
          >
            {token}
          </button>
        )
      )}
      <button
        className="pagination__cell pagination__cell--next"
        disabled={page === totalPages}
        onClick={() => onPageChange(page + 1)}
      >
        Siguiente {ICON_NEXT}
      </button>
    </nav>
  );
}

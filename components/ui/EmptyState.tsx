import type { ReactNode } from 'react';

type Tone = 'neutral' | 'success' | 'warning' | 'error';

interface Props {
  title: string;
  description?: string;
  icon?: ReactNode;
  tone?: Tone;
  size?: 'sm';
  surface?: boolean;
  bordered?: boolean;
  actions?: ReactNode;
}

export function EmptyState({ title, description, icon, tone, size, surface, bordered, actions }: Props) {
  const cls = [
    'empty-state',
    size && `empty-state--${size}`,
    surface && 'empty-state--surface',
    bordered && 'empty-state--bordered',
  ]
    .filter(Boolean)
    .join(' ');

  const mediaCls = ['empty-state__media', tone && `empty-state__media--${tone}`]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={cls}>
      {icon && <div className={mediaCls}>{icon}</div>}
      <h3 className="empty-state__title">{title}</h3>
      {description && <p className="empty-state__description">{description}</p>}
      {actions && <div className="empty-state__actions">{actions}</div>}
    </div>
  );
}

export const ICON_SEARCH = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="6" />
    <path d="M17 17l3.5 3.5" />
  </svg>
);

export const ICON_BOX = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
    <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
    <line x1="12" y1="22.08" x2="12" y2="12" />
  </svg>
);

export const ICON_USERS = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
  </svg>
);

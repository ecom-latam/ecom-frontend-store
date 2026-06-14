'use client';

import { useCallback } from 'react';
import { useToast } from 'zoui';

interface ShareButtonProps {
  title: string;
}

type ToastFn = (options: { message: string; type: 'success' | 'error' }) => void;

export function ShareButton({ title }: ShareButtonProps) {
  const { toast } = useToast();

  const handleShare = useCallback(async () => {
    const url = window.location.href;

    if (navigator.share) {
      try {
        await navigator.share({ title, url });
      } catch (err) {
        if ((err as { name?: string }).name !== 'AbortError') {
          await fallbackCopy(url, toast);
        }
      }
    } else {
      await fallbackCopy(url, toast);
    }
  }, [title, toast]);

  return (
    <button
      onClick={handleShare}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '6px',
        padding: '8px 16px',
        border: '1px solid var(--color-border-subtle)',
        borderRadius: 'var(--radius-md)',
        background: 'transparent',
        color: 'var(--color-fg-secondary)',
        fontFamily: 'var(--font-ui)',
        fontSize: '13px',
        cursor: 'pointer',
        transition: 'border-color 150ms, color 150ms',
      }}
      onMouseEnter={e => {
        (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--color-brand-400)';
        (e.currentTarget as HTMLButtonElement).style.color = 'var(--color-brand-500)';
      }}
      onMouseLeave={e => {
        (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--color-border-subtle)';
        (e.currentTarget as HTMLButtonElement).style.color = 'var(--color-fg-secondary)';
      }}
    >
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="18" cy="5" r="3" />
        <circle cx="6" cy="12" r="3" />
        <circle cx="18" cy="19" r="3" />
        <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
        <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
      </svg>
      Compartir
    </button>
  );
}

async function fallbackCopy(url: string, toast: ToastFn) {
  try {
    await navigator.clipboard.writeText(url);
    toast({ message: 'Enlace copiado', type: 'success' });
  } catch {
    toast({ message: 'No se pudo copiar el enlace', type: 'error' });
  }
}

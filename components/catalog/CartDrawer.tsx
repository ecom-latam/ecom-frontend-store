'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useEffect } from 'react';

import { useCart } from '@/context/CartContext';

export function CartDrawer() {
  const { items, isLoading, drawerOpen, closeDrawer, updateItem, removeItem } = useCart();

  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') closeDrawer();
    }
    if (drawerOpen) document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [drawerOpen, closeDrawer]);

  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

  if (!drawerOpen) return null;

  return (
    <div className="drawer-overlay" onClick={closeDrawer} aria-hidden="true">
      <aside
        className="drawer drawer--right drawer--sm"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-label="Carrito de compras"
      >
        <div className="drawer__header">
          <h2 className="drawer__title">Carrito</h2>
          <button onClick={closeDrawer} className="btn btn--ghost btn--square btn--sm drawer__close" aria-label="Cerrar">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {items.length === 0 ? (
          <div className="drawer__body" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
            <p style={{ color: 'var(--color-fg-muted)', fontSize: 'var(--font-size-sm)' }}>Tu carrito está vacío.</p>
            <Link
              href="/productos"
              onClick={closeDrawer}
              style={{ marginTop: '16px', fontSize: 'var(--font-size-sm)', color: 'var(--color-fg-primary)', textDecoration: 'underline', textUnderlineOffset: '2px' }}
            >
              Ver productos
            </Link>
          </div>
        ) : (
          <>
            <ul className="drawer__body" style={{ padding: 0 }}>
              {items.map((item) => (
                <li key={item._id} style={{ display: 'flex', gap: '12px', padding: '12px 16px', borderBottom: '1px solid var(--color-border-default)' }}>
                  <div style={{ width: 64, height: 64, background: 'var(--color-bg-subtle)', borderRadius: 'var(--radius-md)', overflow: 'hidden', flexShrink: 0 }}>
                    {item.image ? (
                      <Image src={item.image} alt={item.name} width={64} height={64} style={{ objectFit: 'cover', width: '100%', height: '100%' }} />
                    ) : (
                      <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-fg-disabled)', fontSize: '20px' }}>□</div>
                    )}
                  </div>

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: 'var(--font-size-sm)', fontWeight: 500, color: 'var(--color-fg-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.name}</p>

                    {Object.keys(item.selectedOptions).length > 0 && (
                      <p style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-fg-muted)', marginTop: '2px' }}>
                        {Object.entries(item.selectedOptions).map(([k, v]) => `${k}: ${v}`).join(' · ')}
                      </p>
                    )}

                    <p style={{ fontSize: 'var(--font-size-sm)', fontWeight: 600, color: 'var(--color-fg-primary)', marginTop: '4px' }}>
                      ${item.price.toLocaleString('es-AR')}
                    </p>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '8px' }}>
                      <button
                        className="btn btn--outlined btn--square btn--sm"
                        onClick={() => updateItem(item._id, item.quantity - 1)}
                        disabled={item.quantity <= 1 || isLoading}
                        style={{ width: 24, height: 24 }}
                      >
                        −
                      </button>
                      <span style={{ fontSize: 'var(--font-size-sm)', width: 20, textAlign: 'center' }}>{item.quantity}</span>
                      <button
                        className="btn btn--outlined btn--square btn--sm"
                        onClick={() => updateItem(item._id, item.quantity + 1)}
                        disabled={isLoading}
                        style={{ width: 24, height: 24 }}
                      >
                        +
                      </button>
                      <button
                        onClick={() => removeItem(item._id)}
                        disabled={isLoading}
                        className="btn btn--ghost btn--sm btn--rounded"
                        style={{ marginLeft: 'auto', fontSize: 'var(--font-size-xs)', color: 'var(--color-fg-muted)' }}
                      >
                        Eliminar
                      </button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>

            <div className="drawer__footer">
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--font-size-sm)', fontWeight: 600, color: 'var(--color-fg-primary)' }}>
                <span>Subtotal</span>
                <span>${subtotal.toLocaleString('es-AR')}</span>
              </div>
              <Link
                href="/carrito"
                onClick={closeDrawer}
                className="btn btn--outlined btn--pill btn--md"
                style={{ justifyContent: 'center' }}
              >
                Ver carrito completo
              </Link>
              <button
                disabled
                className="btn btn--filled btn--pill btn--md"
                title="Disponible próximamente"
                style={{ justifyContent: 'center', cursor: 'not-allowed' }}
              >
                Ir al checkout
              </button>
            </div>
          </>
        )}
      </aside>
    </div>
  );
}

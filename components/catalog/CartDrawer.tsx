'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useRef } from 'react';

import { useCart } from '@/context/CartContext';
import { Button } from '@/components/ui/Button';

export function CartDrawer() {
  const { items, isLoading, drawerOpen, closeDrawer, updateItem, removeItem } = useCart();

  const drawerRef = useRef<HTMLDivElement>(null);

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
    <>
      <div
        className="fixed inset-0 z-40 bg-black/40"
        onClick={closeDrawer}
        aria-hidden="true"
      />

      <aside
        ref={drawerRef}
        className="fixed right-0 top-0 z-50 h-full w-full max-w-sm bg-white shadow-xl flex flex-col"
        role="dialog"
        aria-label="Carrito de compras"
      >
        <div className="flex items-center justify-between px-4 py-4 border-b border-gray-100">
          <h2 className="font-semibold text-gray-900">Carrito</h2>
          <button onClick={closeDrawer} className="btn btn--ghost btn--square btn--sm">
            ✕
          </button>
        </div>

        {items.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center px-6">
            <p className="text-gray-400 text-sm">Tu carrito está vacío.</p>
            <Link
              href="/products"
              onClick={closeDrawer}
              className="mt-4 text-sm text-gray-900 underline underline-offset-2"
            >
              Ver productos
            </Link>
          </div>
        ) : (
          <>
            <ul className="flex-1 overflow-y-auto divide-y divide-gray-100">
              {items.map((item) => (
                <li key={item._id} className="flex gap-3 px-4 py-3">
                  <div className="w-16 h-16 bg-gray-100 rounded-md overflow-hidden flex-shrink-0">
                    {item.image ? (
                      <Image
                        src={item.image}
                        alt={item.name}
                        width={64}
                        height={64}
                        className="object-cover w-full h-full"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-300 text-xl">
                        □
                      </div>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{item.name}</p>

                    {Object.keys(item.selectedOptions).length > 0 && (
                      <p className="text-xs text-gray-400 mt-0.5">
                        {Object.entries(item.selectedOptions)
                          .map(([k, v]) => `${k}: ${v}`)
                          .join(' · ')}
                      </p>
                    )}

                    <p className="text-sm font-semibold text-gray-900 mt-1">
                      ${item.price.toLocaleString('es-AR')}
                    </p>

                    <div className="flex items-center gap-2 mt-2">
                      <Button
                        variant="outlined"
                        shape="square"
                        size="sm"
                        onClick={() => updateItem(item._id, item.quantity - 1)}
                        disabled={item.quantity <= 1 || isLoading}
                        style={{ width: 24, height: 24, minWidth: 'unset', padding: 0 }}
                      >
                        −
                      </Button>
                      <span className="text-sm w-5 text-center">{item.quantity}</span>
                      <Button
                        variant="outlined"
                        shape="square"
                        size="sm"
                        onClick={() => updateItem(item._id, item.quantity + 1)}
                        disabled={isLoading}
                        style={{ width: 24, height: 24, minWidth: 'unset', padding: 0 }}
                      >
                        +
                      </Button>

                      <button
                        onClick={() => removeItem(item._id)}
                        disabled={isLoading}
                        className="btn btn--ghost btn--square btn--sm ml-auto disabled:opacity-40"
                        style={{ fontSize: 12, color: 'var(--color-fg-muted)' }}
                      >
                        Eliminar
                      </button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>

            <div className="px-4 py-4 border-t border-gray-100 space-y-3">
              <div className="flex justify-between text-sm font-semibold text-gray-900">
                <span>Subtotal</span>
                <span>${subtotal.toLocaleString('es-AR')}</span>
              </div>

              <Link
                href="/cart"
                onClick={closeDrawer}
                className="btn btn--outlined btn--pill btn--md"
                style={{ width: '100%', justifyContent: 'center' }}
              >
                Ver carrito completo
              </Link>

              <Button
                disabled
                variant="filled"
                shape="pill"
                size="md"
                title="Disponible próximamente"
                style={{ width: '100%' }}
              >
                Ir al checkout
              </Button>
            </div>
          </>
        )}
      </aside>
    </>
  );
}

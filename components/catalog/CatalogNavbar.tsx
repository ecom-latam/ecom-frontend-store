'use client';

import Link from 'next/link';

import { useCart } from '@/context/CartContext';

export function CatalogNavbar() {
  const { itemCount, openDrawer } = useCart();

  return (
    <header className="navbar navbar--bordered" style={{ position: 'sticky', top: 0, zIndex: 40 }}>
      <div className="navbar__inner">
        <Link href="/products" className="navbar__logo">
          Tienda
        </Link>

        <div className="navbar__links" />

        <div className="navbar__actions">
          <button
            onClick={openDrawer}
            className="navbar__cart"
            aria-label={`Carrito${itemCount > 0 ? `, ${itemCount} items` : ''}`}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
              <line x1="3" y1="6" x2="21" y2="6" />
              <path d="M16 10a4 4 0 0 1-8 0" />
            </svg>

            {itemCount > 0 && (
              <span className="navbar__cart-badge">
                {itemCount > 99 ? '99+' : itemCount}
              </span>
            )}
          </button>
        </div>
      </div>
    </header>
  );
}

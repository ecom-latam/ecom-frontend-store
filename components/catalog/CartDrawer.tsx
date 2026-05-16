'use client';

import Image from 'next/image';
import { useRouter } from 'next/navigation';

import { useCart } from '@/context/CartContext';
import { Drawer, Button } from 'zoui';

export function CartDrawer() {
  const router = useRouter();
  const { items, isLoading, drawerOpen, closeDrawer, updateItem, removeItem } = useCart();

  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

  if (!drawerOpen) return null;

  return (
    <Drawer side="right" size="sm" onClose={closeDrawer} label="Carrito de compras">
      <Drawer.Header onClose={closeDrawer}>Carrito</Drawer.Header>

      {items.length === 0 ? (
        <Drawer.Body style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
          <p style={{ color: 'var(--color-fg-muted)', fontSize: 'var(--font-size-sm)' }}>Tu carrito está vacío.</p>
          <button
            onClick={() => { closeDrawer(); router.push('/productos'); }}
            style={{ marginTop: '16px', fontSize: 'var(--font-size-sm)', color: 'var(--color-fg-primary)', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline', textUnderlineOffset: '2px' }}
          >
            Ver productos
          </button>
        </Drawer.Body>
      ) : (
        <>
          <Drawer.Body style={{ padding: 0 }}>
            <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
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
                      <Button
                        variant="outlined"
                        shape="square"
                        size="sm"
                        onClick={() => updateItem(item._id, item.quantity - 1)}
                        disabled={item.quantity <= 1 || isLoading}
                        style={{ width: 24, height: 24 }}
                      >
                        −
                      </Button>
                      <span style={{ fontSize: 'var(--font-size-sm)', width: 20, textAlign: 'center' }}>{item.quantity}</span>
                      <Button
                        variant="outlined"
                        shape="square"
                        size="sm"
                        onClick={() => updateItem(item._id, item.quantity + 1)}
                        disabled={isLoading}
                        style={{ width: 24, height: 24 }}
                      >
                        +
                      </Button>
                      <Button
                        variant="ghost"
                        shape="rounded"
                        size="sm"
                        onClick={() => removeItem(item._id)}
                        disabled={isLoading}
                        style={{ marginLeft: 'auto', fontSize: 'var(--font-size-xs)', color: 'var(--color-fg-muted)' }}
                      >
                        Eliminar
                      </Button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </Drawer.Body>

          <Drawer.Footer>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--font-size-sm)', fontWeight: 600, color: 'var(--color-fg-primary)' }}>
              <span>Subtotal</span>
              <span>${subtotal.toLocaleString('es-AR')}</span>
            </div>
            <Button
              variant="outlined"
              shape="pill"
              size="md"
              style={{ justifyContent: 'center' }}
              onClick={() => { closeDrawer(); router.push('/carrito'); }}
            >
              Ver carrito completo
            </Button>
            <Button
              variant="filled"
              shape="pill"
              size="md"
              disabled
              title="Disponible próximamente"
              style={{ justifyContent: 'center', cursor: 'not-allowed' }}
            >
              Ir al checkout
            </Button>
          </Drawer.Footer>
        </>
      )}
    </Drawer>
  );
}

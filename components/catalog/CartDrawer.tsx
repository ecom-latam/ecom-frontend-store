'use client';

import { useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';

import { useCart } from '@/context/CartContext';
import { Drawer, Button, Text, Modal } from 'zoui';

export function CartDrawer() {
  const router = useRouter();
  const { items, isLoading, drawerOpen, closeDrawer, updateItem, removeItem } = useCart();
  const [itemToRemove, setItemToRemove] = useState<string | null>(null);
  const [stockLimits, setStockLimits] = useState<Record<string, number>>({});

  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

  if (!drawerOpen) return null;

  return (
    <>
    <Drawer side="right" size="sm" onClose={closeDrawer} label="Carrito de compras">
      <Drawer.Header onClose={closeDrawer}>Carrito</Drawer.Header>

      {items.length === 0 ? (
        <Drawer.Body style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
          <Text variant="body-sm" color="muted">Tu carrito está vacío.</Text>
          <Button variant="ghost" shape="rounded" size="md" onClick={() => { closeDrawer(); router.push('/productos'); }} style={{ marginTop: '16px', textDecoration: 'underline', textUnderlineOffset: '2px' }}>
            Ver productos
          </Button>
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
                    <Text variant="body-sm" weight="medium" as="p" truncate>{item.name}</Text>

                    {Object.keys(item.selectedOptions).length > 0 && (
                      <Text variant="caption" color="muted" as="p" style={{ marginTop: '2px' }}>
                        {Object.entries(item.selectedOptions).map(([k, v]) => `${k}: ${v}`).join(' · ')}
                      </Text>
                    )}

                    <Text variant="body-sm" weight="semibold" as="p" style={{ marginTop: '4px' }}>
                      ${item.price.toLocaleString('es-AR')}
                    </Text>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '8px' }}>
                      <Button
                        variant="outlined"
                        shape="square"
                        size="md"
                        onClick={() => item.quantity <= 1 ? setItemToRemove(item._id) : updateItem(item._id, item.quantity - 1)}
                        disabled={isLoading}
                        style={{ width: 24, height: 24 }}
                      >
                        −
                      </Button>
                      <Text variant="body-sm" as="span" style={{ width: 20, textAlign: 'center' }}>{item.quantity}</Text>
                      <Button
                        variant="outlined"
                        shape="square"
                        size="md"
                        onClick={async () => {
                          const result = await updateItem(item._id, item.quantity + 1);
                          if (!result.ok && result.error === 'INSUFFICIENT_STOCK') {
                            setStockLimits((prev) => ({ ...prev, [item._id]: result.available ?? item.quantity }));
                          }
                        }}
                        disabled={isLoading || (
                          item.stock !== undefined
                            ? item.quantity >= item.stock
                            : stockLimits[item._id] !== undefined && item.quantity >= stockLimits[item._id]
                        )}
                        style={{ width: 24, height: 24 }}
                      >
                        +
                      </Button>
                      <Button
                        variant="ghost"
                        shape="rounded"
                        size="md"
                        onClick={() => setItemToRemove(item._id)}
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
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <Text variant="body-sm" weight="semibold" as="span">Subtotal</Text>
              <Text variant="body-sm" weight="semibold" as="span">${subtotal.toLocaleString('es-AR')}</Text>
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
              style={{ justifyContent: 'center' }}
              onClick={() => { closeDrawer(); router.push('/checkout'); }}
            >
              Ir al checkout
            </Button>
          </Drawer.Footer>
        </>
      )}
    </Drawer>

    {itemToRemove && (
      <Modal size="sm" onClose={() => setItemToRemove(null)}>
        <Modal.Header onClose={() => setItemToRemove(null)}>Eliminar producto</Modal.Header>
        <Modal.Body>
          <Text variant="body-sm">¿Querés eliminar este producto del carrito?</Text>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="ghost" shape="rounded" size="md" onClick={() => setItemToRemove(null)}>
            Cancelar
          </Button>
          <Button variant="filled" shape="rounded" size="md" onClick={() => { removeItem(itemToRemove); setItemToRemove(null); }}>
            Eliminar
          </Button>
        </Modal.Footer>
      </Modal>
    )}
    </>
  );
}

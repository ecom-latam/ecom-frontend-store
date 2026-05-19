'use client';

import { useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';

import { useCart } from '@/context/CartContext';
import { Button, Text, Modal } from 'zoui';

export function CartPageContent() {
  const router = useRouter();
  const { items, isLoading, updateItem, removeItem, clearCart } = useCart();
  const [itemToRemove, setItemToRemove] = useState<string | null>(null);
  const [stockLimits, setStockLimits] = useState<Record<string, number>>({});

  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

  if (isLoading && items.length === 0) {
    return (
      <main className="min-h-screen" style={{ background: 'var(--color-bg-surface)' }}>
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="animate-pulse space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-24 rounded-lg" style={{ background: 'var(--color-bg-subtle)' }} />
            ))}
          </div>
        </div>
      </main>
    );
  }

  if (items.length === 0) {
    return (
      <main className="min-h-screen" style={{ background: 'var(--color-bg-surface)' }}>
        <div className="max-w-4xl mx-auto px-4 py-16 text-center">
          <Text variant="body" color="muted" style={{ marginBottom: '16px' }}>Tu carrito está vacío.</Text>
          <Button variant="filled" shape="rounded" size="md" onClick={() => router.push('/productos')}>
            Ver productos
          </Button>
        </div>
      </main>
    );
  }

  return (
    <>
    <main className="min-h-screen" style={{ background: 'var(--color-bg-surface)' }}>
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <Text variant="heading-2" as="h1">Mi carrito</Text>
          <Button variant="ghost" shape="rounded" size="md" onClick={clearCart} disabled={isLoading} style={{ color: 'var(--color-fg-muted)' }}>
            Vaciar carrito
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-3">
            {items.map((item) => (
              <div
                key={item._id}
                className="flex gap-4 rounded-xl p-4"
                style={{ border: '1px solid var(--color-border-default)' }}
              >
                <div className="w-24 h-24 rounded-lg overflow-hidden flex-shrink-0" style={{ background: 'var(--color-bg-subtle)' }}>
                  {item.image ? (
                    <Image
                      src={item.image}
                      alt={item.name}
                      width={96}
                      height={96}
                      className="object-cover w-full h-full"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-3xl" style={{ color: 'var(--color-fg-disabled)' }}>
                      □
                    </div>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <Button variant="ghost" shape="rounded" size="md" onClick={() => router.push(`/producto?id=${item.productId}`)} style={{ fontWeight: 500, padding: 0, height: 'auto', justifyContent: 'flex-start' }}>
                    {item.name}
                  </Button>

                  {Object.keys(item.selectedOptions).length > 0 && (
                    <Text variant="body-sm" color="muted" as="p" style={{ marginTop: '2px' }}>
                      {Object.entries(item.selectedOptions)
                        .map(([k, v]) => `${k}: ${v}`)
                        .join(' · ')}
                    </Text>
                  )}

                  <Text variant="body-sm" weight="semibold" as="p" style={{ marginTop: '4px' }}>
                    ${item.price.toLocaleString('es-AR')}
                  </Text>

                  <div className="flex items-center gap-2 mt-3">
                    <Button
                      variant="outlined"
                      shape="square"
                      size="md"
                      onClick={() => item.quantity <= 1 ? setItemToRemove(item._id) : updateItem(item._id, item.quantity - 1)}
                      disabled={isLoading}
                    >
                      −
                    </Button>
                    <Text variant="body-sm" weight="medium" as="span" style={{ width: '24px', textAlign: 'center' }}>{item.quantity}</Text>
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
                    >
                      +
                    </Button>

                    <Text variant="body-sm" color="secondary" as="span" style={{ marginLeft: '16px' }}>
                      Total: ${(item.price * item.quantity).toLocaleString('es-AR')}
                    </Text>

                    <Button variant="ghost" shape="rounded" size="md" onClick={() => setItemToRemove(item._id)} disabled={isLoading} style={{ marginLeft: 'auto', color: 'var(--color-fg-muted)' }}>
                      Eliminar
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="lg:col-span-1">
            <div className="rounded-xl p-5 sticky top-20 space-y-4" style={{ border: '1px solid var(--color-border-default)' }}>
              <Text variant="body" weight="semibold" as="h2">Resumen</Text>

              <div className="space-y-2">
                <div className="flex justify-between">
                  <Text variant="body-sm" color="secondary" as="span">Productos ({items.reduce((s, i) => s + i.quantity, 0)})</Text>
                  <Text variant="body-sm" color="secondary" as="span">${subtotal.toLocaleString('es-AR')}</Text>
                </div>
              </div>

              <div className="pt-3 flex justify-between" style={{ borderTop: '1px solid var(--color-border-default)' }}>
                <Text variant="body-sm" weight="semibold" as="span">Subtotal</Text>
                <Text variant="body-sm" weight="semibold" as="span">${subtotal.toLocaleString('es-AR')}</Text>
              </div>

              <Button
                variant="filled"
                shape="pill"
                size="md"
                onClick={() => router.push('/checkout')}
                style={{ width: '100%', justifyContent: 'center' }}
              >
                Ir al checkout
              </Button>

              <Button variant="ghost" shape="rounded" size="md" onClick={() => router.push('/productos')} style={{ width: '100%', justifyContent: 'center', color: 'var(--color-fg-muted)' }}>
                Seguir comprando
              </Button>
            </div>
          </div>
        </div>
      </div>
    </main>

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

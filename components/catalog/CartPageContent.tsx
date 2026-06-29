'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';

import { useCart } from '@/context/CartContext';
import { Button, Text, Modal } from 'zoui';
import { usePageConfig } from '@/context/PageConfigContext';
import { formatPrice } from '@/lib/format';
import styles from './CartPageContent.module.scss';

export function CartPageContent() {
  const router = useRouter();
  const { items, isLoading, updateItem, removeItem, clearCart } = useCart();
  const { hasPurchases, store } = usePageConfig();
  const currency = store?.currency;
  const [itemToRemove, setItemToRemove] = useState<string | null>(null);
  const [stockLimits, setStockLimits] = useState<Record<string, number>>({});

  // EC-559: tiendas sin el modulo de compras no tienen carrito.
  useEffect(() => {
    if (hasPurchases === false) router.replace('/productos');
  }, [hasPurchases, router]);

  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

  if (isLoading && items.length === 0) {
    return (
      <main className={styles.root} style={{ background: 'var(--color-bg-surface)' }}>
        <div className={styles.container}>
          <div className={styles.skeleton}>
            {[1, 2, 3].map((i) => (
              <div key={i} className={styles.skeletonItem} style={{ background: 'var(--color-bg-subtle)' }} />
            ))}
          </div>
        </div>
      </main>
    );
  }

  if (items.length === 0) {
    return (
      <main className={styles.root} style={{ background: 'var(--color-bg-surface)' }}>
        <div className={styles.containerCenter}>
          <Text variant="body" color="muted" style={{ marginBottom: '16px' }}>Tu carrito está vacío.</Text>
          <Button size="md" onClick={() => router.push('/productos')}>
            Ver productos
          </Button>
        </div>
      </main>
    );
  }

  return (
    <>
    <main className={styles.root} style={{ background: 'var(--color-bg-surface)' }}>
      <div className={styles.container}>
        <div className={styles.header}>
          <Text variant="heading-2">Mi carrito</Text>
          <Button emphasis="ghost" size="md" onClick={clearCart} disabled={isLoading} style={{ color: 'var(--color-fg-muted)' }}>
            Vaciar carrito
          </Button>
        </div>

        <div className={styles.grid}>
          <div className={styles.itemsList}>
            {items.map((item) => (
              <div
                key={item._id}
                className={styles.item}
                style={{ border: '1px solid var(--color-border-default)' }}
              >
                <div className={styles.itemImage} style={{ background: 'var(--color-bg-subtle)' }}>
                  {item.image ? (
                    <Image
                      src={item.image}
                      alt={item.name}
                      width={96}
                      height={96}
                      style={{ objectFit: 'cover', width: '100%', height: '100%' }}
                    />
                  ) : (
                    <div className={styles.itemImageEmpty} style={{ color: 'var(--color-fg-disabled)' }}>
                      □
                    </div>
                  )}
                </div>

                <div className={styles.itemContent}>
                  <Button emphasis="ghost" size="md" onClick={() => router.push(`/producto?id=${item.productId}`)} style={{ fontWeight: 500, padding: 0, height: 'auto', justifyContent: 'flex-start' }}>
                    {item.name}
                  </Button>

                  {Object.keys(item.selectedOptions).length > 0 && (
                    <Text variant="body-sm" color="muted" style={{ marginTop: '2px' }}>
                      {Object.entries(item.selectedOptions)
                        .map(([k, v]) => `${k}: ${v}`)
                        .join(' · ')}
                    </Text>
                  )}

                  <Text variant="body-sm" weight="semibold" style={{ marginTop: '4px' }}>
                    {formatPrice(item.price, currency)}
                  </Text>

                  <div className={styles.itemActions}>
                    <Button
                      emphasis="outlined"
                      size="md"
                      onClick={() => item.quantity <= 1 ? setItemToRemove(item._id) : updateItem(item._id, item.quantity - 1)}
                      disabled={isLoading}
                    >
                      −
                    </Button>
                    <Text variant="body-sm" weight="medium" style={{ width: '24px', textAlign: 'center' }}>{item.quantity}</Text>
                    <Button
                      emphasis="outlined"
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

                    <Text variant="body-sm" color="secondary" style={{ marginLeft: '16px' }}>
                      Total: {formatPrice(item.price * item.quantity, currency)}
                    </Text>

                    <Button emphasis="ghost" size="md" onClick={() => setItemToRemove(item._id)} disabled={isLoading} style={{ marginLeft: 'auto', color: 'var(--color-fg-muted)' }}>
                      Eliminar
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className={styles.summary}>
            <div className={styles.summaryInner} style={{ border: '1px solid var(--color-border-default)' }}>
              <Text variant="body" weight="semibold">Resumen</Text>

              <div className={styles.summaryItems}>
                <div className={styles.summaryRow}>
                  <Text variant="body-sm" color="secondary">Productos ({items.reduce((s, i) => s + i.quantity, 0)})</Text>
                  <Text variant="body-sm" color="secondary">{formatPrice(subtotal, currency)}</Text>
                </div>
              </div>

              <div className={styles.summaryTotal} style={{ borderTop: '1px solid var(--color-border-default)' }}>
                <Text variant="body-sm" weight="semibold">Subtotal</Text>
                <Text variant="body-sm" weight="semibold">{formatPrice(subtotal, currency)}</Text>
              </div>

              <Button
                size="md"
                onClick={() => router.push('/checkout')}
                style={{ width: '100%', justifyContent: 'center' }}
              >
                Ir al checkout
              </Button>

              <Button emphasis="ghost" size="md" onClick={() => router.push('/productos')} style={{ width: '100%', justifyContent: 'center', color: 'var(--color-fg-muted)' }}>
                Seguir comprando
              </Button>
            </div>
          </div>
        </div>
      </div>
    </main>

    <Modal open={!!itemToRemove} size="sm" onClose={() => setItemToRemove(null)}>
      <Modal.Header>Eliminar producto</Modal.Header>
      <Modal.Body>
        <Text variant="body-sm">¿Querés eliminar este producto del carrito?</Text>
      </Modal.Body>
      <Modal.Footer>
        <Button emphasis="ghost" size="md" onClick={() => setItemToRemove(null)}>
          Cancelar
        </Button>
        <Button size="md" onClick={() => { removeItem(itemToRemove!); setItemToRemove(null); }}>
          Eliminar
        </Button>
      </Modal.Footer>
    </Modal>
    </>
  );
}

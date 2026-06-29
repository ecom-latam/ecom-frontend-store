'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

import { getAccessTokenRole } from '@/utils/helpers';
import styles from './page.module.scss';
import { Badge, Text } from 'zoui';
import { StoreButton } from '@/components/ui/StoreButton';
import type { BadgeTone } from 'zoui';
import { usePageConfig } from '@/context/PageConfigContext';
import { formatPrice } from '@/lib/format';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { fetchMyOrdersRequest } from '@/store/orders/ordersSlice';

const STATUS_LABEL: Record<string, string> = {
  new: 'Nuevo',
  confirmed: 'Confirmado',
  processing: 'En preparación',
  shipped: 'Enviado',
  delivered: 'Entregado',
  cancelled: 'Cancelado',
};

const STATUS_TONE: Record<string, BadgeTone> = {
  new: 'neutral',
  confirmed: 'info',
  processing: 'warning',
  shipped: 'info',
  delivered: 'success',
  cancelled: 'danger',
};

export default function MisPedidosPage() {
  const router = useRouter();
  const { hasPurchases, store } = usePageConfig();
  const currency = store?.currency;
  const dispatch = useAppDispatch();
  const { list: orderList, listLoading: loading } = useAppSelector((s) => s.orders);

  useEffect(() => {
    const role = getAccessTokenRole();
    if (!role) {
      router.replace('/iniciar-sesion');
      return;
    }
    if (role !== 'Customer') {
      router.replace('/productos');
      return;
    }
    if (hasPurchases === false) {
      router.replace('/productos');
      return;
    }
    dispatch(fetchMyOrdersRequest());
  }, [router, hasPurchases, dispatch]);

  if (loading) {
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

  return (
    <main className={styles.root} style={{ background: 'var(--color-bg-surface)' }}>
      <div className={styles.container}>
        <Text variant="heading-2" style={{ marginBottom: '24px' }}>Mis pedidos</Text>

        {orderList.length === 0 ? (
          <div style={{ textAlign: 'center', paddingTop: '48px' }}>
            <Text variant="body" color="muted" style={{ marginBottom: '16px' }}>
              Todavía no tenés pedidos.
            </Text>
            <StoreButton size="md" onClick={() => router.push('/productos')}>
              Ver productos
            </StoreButton>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {orderList.map((order) => (
              <button
                key={order._id}
                onClick={() => router.push(`/pedidos/${order._id}`)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '16px',
                  padding: '16px 20px',
                  background: 'var(--color-bg-default)',
                  border: '1px solid var(--color-border-default)',
                  borderRadius: 'var(--radius-lg)',
                  cursor: 'pointer',
                  textAlign: 'left',
                  width: '100%',
                }}
              >
                <div style={{ flex: 1 }}>
                  <Text variant="body-sm" weight="semibold">
                    Pedido #{order.orderNumber}
                  </Text>
                  <Text variant="caption" color="muted">
                    {new Date(order.createdAt).toLocaleDateString('es-AR', {
                      day: '2-digit',
                      month: 'short',
                      year: 'numeric',
                    })}
                    {' · '}
                    {order.items.length} {order.items.length === 1 ? 'producto' : 'productos'}
                    {' · '}
                    {formatPrice(order.total, currency)}
                  </Text>
                </div>
                <Badge tone={STATUS_TONE[order.status]} variant="pill">
                  {STATUS_LABEL[order.status]}
                </Badge>
              </button>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}

'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

import { getAccessTokenRole } from '@/utils/helpers';
import { orders } from '@/utils/api/orders';
import type { Order } from '@/utils/api/orders';
import { Badge, Button, Text } from 'zoui';
import type { BadgeType } from 'zoui';

const STATUS_LABEL: Record<string, string> = {
  new: 'Nuevo',
  confirmed: 'Confirmado',
  processing: 'En preparación',
  shipped: 'Enviado',
  delivered: 'Entregado',
  cancelled: 'Cancelado',
};

const STATUS_TONE: Record<string, BadgeType> = {
  new: 'neutral',
  confirmed: 'info',
  processing: 'warning',
  shipped: 'info',
  delivered: 'success',
  cancelled: 'error',
};

export default function MisPedidosPage() {
  const router = useRouter();
  const [orderList, setOrderList] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const role = getAccessTokenRole();
    if (!role) {
      router.replace('/iniciar-sesion');
      return;
    }

    orders.getMy().then(({ data }) => {
      setOrderList(data.data ?? []);
    }).catch(() => {
      setOrderList([]);
    }).finally(() => {
      setLoading(false);
    });
  }, [router]);

  if (loading) {
    return (
      <main className="min-h-screen" style={{ background: 'var(--color-bg-surface)' }}>
        <div className="max-w-3xl mx-auto px-4 py-8">
          <div className="animate-pulse space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-20 rounded-lg" style={{ background: 'var(--color-bg-subtle)' }} />
            ))}
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen" style={{ background: 'var(--color-bg-surface)' }}>
      <div className="max-w-3xl mx-auto px-4 py-8">
        <Text variant="heading-2" as="h1" style={{ marginBottom: '24px' }}>Mis pedidos</Text>

        {orderList.length === 0 ? (
          <div style={{ textAlign: 'center', paddingTop: '48px' }}>
            <Text variant="body" color="muted" style={{ marginBottom: '16px' }}>
              Todavía no tenés pedidos.
            </Text>
            <Button variant="filled" shape="rounded" size="md" onClick={() => router.push('/productos')}>
              Ver productos
            </Button>
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
                  <Text variant="body-sm" weight="semibold" as="p">
                    Pedido #{order.orderNumber}
                  </Text>
                  <Text variant="caption" color="muted" as="p">
                    {new Date(order.createdAt).toLocaleDateString('es-AR', {
                      day: '2-digit',
                      month: 'short',
                      year: 'numeric',
                    })}
                    {' · '}
                    {order.items.length} {order.items.length === 1 ? 'producto' : 'productos'}
                    {' · '}
                    ${order.total.toLocaleString('es-AR')}
                  </Text>
                </div>
                <Badge type={STATUS_TONE[order.status]} shape="pill">
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

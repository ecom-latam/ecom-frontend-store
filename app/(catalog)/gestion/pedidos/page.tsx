'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { orders } from '@/utils/api/orders';
import type { Order, OrderStatus, PaymentStatus, PaymentMethod } from '@/utils/api/orders';
import { Badge, Table, Text, Pagination } from 'zoui';
import { StoreSelect } from '@/components/ui/StoreSelect';
import { StoreButton } from '@/components/ui/StoreButton';
import type { BadgeTone } from 'zoui';
import { useStoreConfig } from '@/context/StoreConfigContext';
import { formatPrice } from '@/lib/format';

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

const PAYMENT_LABEL: Record<string, string> = {
  pending: 'Pendiente',
  in_progress: 'Notificado',
  paid: 'Pagado',
  failed: 'Fallido',
};

const PAYMENT_TONE: Record<string, BadgeTone> = {
  pending: 'neutral',
  in_progress: 'warning',
  paid: 'success',
  failed: 'danger',
};

const LIMIT = 20;

export default function AdminPedidosPage() {
  const router = useRouter();
  const { currency } = useStoreConfig();

  const [orderList, setOrderList] = useState<Order[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);

  const [filterStatus, setFilterStatus] = useState<OrderStatus | ''>('');
  const [filterPayment, setFilterPayment] = useState<PaymentStatus | ''>('');
  const [filterMethod, setFilterMethod] = useState<PaymentMethod | ''>('');

  const fetchOrders = useCallback(async (p = page) => {
    setLoading(true);
    try {
      const { data } = await orders.admin.list({
        page: p,
        limit: LIMIT,
        status: filterStatus || undefined,
        paymentStatus: filterPayment || undefined,
        paymentMethod: filterMethod || undefined,
      });
      setOrderList(data.data ?? []);
      setTotal(data.total ?? 0);
    } catch {
      setOrderList([]);
    } finally {
      setLoading(false);
    }
  }, [page, filterStatus, filterPayment, filterMethod]);

  useEffect(() => {
    setPage(1);
    fetchOrders(1);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterStatus, filterPayment, filterMethod]);

  useEffect(() => {
    fetchOrders(page);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  const totalPages = Math.max(1, Math.ceil(total / LIMIT));

  return (
    <main style={{ padding: '32px', overflowY: 'auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
        <Text variant="heading-2" as="h1">Pedidos</Text>
        <Text variant="body-sm" color="muted" as="span">{total} en total</Text>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: '20px', flexWrap: 'wrap' }}>
        <div style={{ minWidth: '180px' }}>
          <StoreSelect
            label="Estado de orden"
            value={filterStatus || '__all__'}
            onValueChange={(val) => setFilterStatus(val === '__all__' ? '' : val as OrderStatus)}
            size="md"
            options={[
              { value: '__all__', label: 'Todos los estados' },
              { value: 'new', label: 'Nuevo' },
              { value: 'confirmed', label: 'Confirmado' },
              { value: 'processing', label: 'En preparación' },
              { value: 'shipped', label: 'Enviado' },
              { value: 'delivered', label: 'Entregado' },
              { value: 'cancelled', label: 'Cancelado' },
            ]}
          />
        </div>

        <div style={{ minWidth: '180px' }}>
          <StoreSelect
            label="Estado de pago"
            value={filterPayment || '__all__'}
            onValueChange={(val) => setFilterPayment(val === '__all__' ? '' : val as PaymentStatus)}
            size="md"
            options={[
              { value: '__all__', label: 'Todos los pagos' },
              { value: 'pending', label: 'Pendiente' },
              { value: 'in_progress', label: 'Notificado' },
              { value: 'paid', label: 'Pagado' },
              { value: 'failed', label: 'Fallido' },
            ]}
          />
        </div>

        <div style={{ minWidth: '180px' }}>
          <StoreSelect
            label="Método de pago"
            value={filterMethod || '__all__'}
            onValueChange={(val) => setFilterMethod(val === '__all__' ? '' : val as PaymentMethod)}
            size="md"
            options={[
              { value: '__all__', label: 'Todos los métodos' },
              { value: 'transfer', label: 'Transferencia' },
              { value: 'cash', label: 'Efectivo' },
            ]}
          />
        </div>
      </div>

      {loading ? (
        <div className="animate-pulse space-y-2">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-12 rounded" style={{ background: 'var(--color-bg-subtle)' }} />
          ))}
        </div>
      ) : orderList.length === 0 ? (
        <div style={{ textAlign: 'center', paddingTop: '48px' }}>
          <Text variant="body" color="muted">No se encontraron pedidos.</Text>
        </div>
      ) : (
        <>
          <Table>
            <Table.Head>
              <Table.Row>
                <Table.Th>Nº</Table.Th>
                <Table.Th>Fecha</Table.Th>
                <Table.Th>Cliente</Table.Th>
                <Table.Th>Total</Table.Th>
                <Table.Th>Pago</Table.Th>
                <Table.Th>Estado pago</Table.Th>
                <Table.Th>Estado orden</Table.Th>
                <Table.Th></Table.Th>
              </Table.Row>
            </Table.Head>
            <Table.Body>
              {orderList.map((order) => (
                <Table.Row key={order._id}>
                  <Table.Td>#{order.orderNumber}</Table.Td>
                  <Table.Td>
                    {new Date(order.createdAt).toLocaleDateString('es-AR', { day: '2-digit', month: 'short', year: 'numeric' })}
                  </Table.Td>
                  <Table.Td>
                    <Text variant="body-sm" as="span" truncate style={{ maxWidth: '160px', display: 'block' }}>
                      {order.shippingAddress.fullName}
                    </Text>
                  </Table.Td>
                  <Table.Td>{formatPrice(order.total, currency)}</Table.Td>
                  <Table.Td>
                    {order.paymentMethod === 'transfer' ? 'Transferencia' : 'Efectivo'}
                  </Table.Td>
                  <Table.Td>
                    <Badge tone={PAYMENT_TONE[order.paymentStatus]} variant="pill">
                      {PAYMENT_LABEL[order.paymentStatus]}
                    </Badge>
                  </Table.Td>
                  <Table.Td>
                    <Badge tone={STATUS_TONE[order.status]} variant="pill">
                      {STATUS_LABEL[order.status]}
                    </Badge>
                  </Table.Td>
                  <Table.Td>
                    <StoreButton
                      emphasis="ghost"
                      size="md"
                      onClick={() => router.push(`/gestion/pedidos/${order._id}`)}
                      data-testid={`order-view-btn-${order._id}`}
                    >
                      Ver
                    </StoreButton>
                  </Table.Td>
                </Table.Row>
              ))}
            </Table.Body>
          </Table>

          {totalPages > 1 && (
            <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'center' }}>
              <Pagination
                page={page}
                totalPages={totalPages}
                onPageChange={setPage}
              />
            </div>
          )}
        </>
      )}
    </main>
  );
}

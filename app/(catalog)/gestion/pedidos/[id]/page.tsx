'use client';

import { useEffect, useRef, useState } from 'react';
import styles from './page.module.scss';
import { useRouter, useParams } from 'next/navigation';
import Image from 'next/image';

import { orders } from '@/utils/api/orders';
import type { Order, OrderStatus } from '@/utils/api/orders';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { fetchAdminOrderRequest, clearCurrentOrder } from '@/store/orders/ordersSlice';
import { getNextAdminStatuses, getStepLabel } from '@/utils/workflows';
import { Badge, Button, Text, Modal } from 'zoui';
import { StoreButton } from '@/components/ui/StoreButton';
import { usePageConfig } from '@/context/PageConfigContext';
import { formatPrice } from '@/lib/format';
import type { BadgeTone } from 'zoui';

const STATUS_LABEL: Record<string, string> = {
  new: 'Nuevo',
  notified: 'Notificado',
  confirmed: 'Confirmado',
  processing: 'En preparación',
  shipped: 'Enviado',
  ready: 'Listo para retirar',
  delivered: 'Entregado',
  cancelled: 'Cancelado',
};

const STATUS_TONE: Record<string, BadgeTone> = {
  new: 'neutral',
  notified: 'warning',
  confirmed: 'info',
  processing: 'warning',
  shipped: 'info',
  ready: 'info',
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

const STATUS_ACTION_LABEL: Record<string, string> = {
  notified: 'Transferencia recibida',
  confirmed: 'Confirmar pedido',
  processing: 'Marcar en preparación',
  shipped: 'Marcar como enviado',
  ready: 'Preparar para retirar',
  delivered: 'Marcar como entregado',
};

export default function AdminPedidoDetailPage() {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();
  const { store } = usePageConfig();
  const currency = store?.currency;
  const dispatch = useAppDispatch();
  const { current: reduxOrder, currentLoading } = useAppSelector((s) => s.orders);
  const initialized = useRef(false);

  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmModal, setConfirmModal] = useState<{ type: 'confirmPayment' | 'status' | 'cancel'; status?: OrderStatus } | null>(null);

  useEffect(() => {
    initialized.current = false;
    dispatch(clearCurrentOrder());
    dispatch(fetchAdminOrderRequest(id));
  }, [id, dispatch]);

  useEffect(() => {
    if (initialized.current || currentLoading || reduxOrder === null) return;
    initialized.current = true;
    setOrder(reduxOrder);
    setLoading(false);
  }, [reduxOrder, currentLoading]);

  async function handleConfirmPayment() {
    setActionLoading(true);
    setError(null);
    try {
      const { data } = await orders.admin.confirmPayment(id);
      setOrder(data);
      setConfirmModal(null);
    } catch {
      setError('No se pudo confirmar el pago.');
    } finally {
      setActionLoading(false);
    }
  }

  async function handleStatusUpdate(status: OrderStatus) {
    setActionLoading(true);
    setError(null);
    try {
      const { data } = await orders.admin.updateStatus(id, status);
      setOrder(data);
      setConfirmModal(null);
    } catch {
      setError('No se pudo actualizar el estado.');
    } finally {
      setActionLoading(false);
    }
  }

  async function handleCancel() {
    setActionLoading(true);
    setError(null);
    try {
      const { data } = await orders.admin.cancel(id);
      setOrder(data);
      setConfirmModal(null);
    } catch {
      setError('No se pudo cancelar el pedido.');
    } finally {
      setActionLoading(false);
    }
  }

  if (loading) {
    return (
      <main style={{ padding: '32px' }}>
        <div className={styles.skeleton}>
          {[1, 2, 3].map((i) => (
            <div key={i} className={styles.skeletonItem} style={{ background: 'var(--color-bg-subtle)' }} />
          ))}
        </div>
      </main>
    );
  }

  if (!order) {
    return (
      <main style={{ padding: '32px' }}>
        <Text variant="body" color="muted">Pedido no encontrado.</Text>
        <StoreButton emphasis="ghost" size="md" style={{ marginTop: '12px' }} onClick={() => router.push('/gestion/pedidos')}>
          ← Volver a pedidos
        </StoreButton>
      </main>
    );
  }

  const canConfirmPayment = order.paymentStatus === 'in_progress' && order.status !== 'cancelled';
  const nonCancelNext = getNextAdminStatuses(order.paymentMethod, order.shippingMethod, order.status);
  const canCancel = order.status !== 'cancelled' && order.status !== 'delivered';

  return (
    <main style={{ padding: '32px', overflowY: 'auto' }}>
      <button
        onClick={() => router.push('/gestion/pedidos')}
        style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-fg-muted)', fontSize: 'var(--font-size-sm)', marginBottom: '16px', display: 'block' }}
      >
        ← Volver a pedidos
      </button>

      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '24px', flexWrap: 'wrap' }}>
        <Text variant="heading-2">Pedido #{order.orderNumber}</Text>
        <Badge tone={STATUS_TONE[order.status]} variant="pill" data-testid="order-status-badge">{STATUS_LABEL[order.status]}</Badge>
        <Badge tone={PAYMENT_TONE[order.paymentStatus]} variant="pill" data-testid="order-payment-badge">{PAYMENT_LABEL[order.paymentStatus]}</Badge>
      </div>

      {error && (
        <div style={{ marginBottom: '16px', padding: '12px', background: 'var(--color-error-50)', border: '1px solid var(--color-error-200)', borderRadius: 'var(--radius-md)' }}>
          <Text variant="body-sm" style={{ color: 'var(--color-error-700)' }}>{error}</Text>
        </div>
      )}

      <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap', alignItems: 'flex-start' }}>

        {/* Left column */}
        <div style={{ flex: '1 1 400px', display: 'flex', flexDirection: 'column', gap: '20px' }}>

          {/* Items */}
          <section style={{ background: 'var(--color-bg-default)', border: '1px solid var(--color-border-default)', borderRadius: 'var(--radius-lg)', padding: '20px' }}>
            <Text variant="heading-3" style={{ marginBottom: '16px' }}>Productos</Text>
            <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {order.items.map((item, idx) => (
                <li key={idx} style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                  <div style={{ width: 48, height: 48, background: 'var(--color-bg-subtle)', borderRadius: 'var(--radius-sm)', overflow: 'hidden', flexShrink: 0 }}>
                    {item.image ? (
                      <Image src={item.image} alt={item.name} width={48} height={48} style={{ objectFit: 'cover', width: '100%', height: '100%' }} />
                    ) : (
                      <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-fg-disabled)' }}>□</div>
                    )}
                  </div>
                  <div style={{ flex: 1 }}>
                    <Text variant="body-sm" weight="medium">{item.name}</Text>
                    {Object.keys(item.selectedOptions).length > 0 && (
                      <Text variant="caption" color="muted">
                        {Object.entries(item.selectedOptions).map(([k, v]) => `${k}: ${v}`).join(' · ')}
                      </Text>
                    )}
                    <Text variant="caption" color="muted">x{item.quantity} · {formatPrice(item.price, currency)}</Text>
                  </div>
                  <Text variant="body-sm" weight="semibold">{formatPrice(item.subtotal, currency)}</Text>
                </li>
              ))}
            </ul>
            <div style={{ borderTop: '1px solid var(--color-border-default)', marginTop: '16px', paddingTop: '16px', display: 'flex', justifyContent: 'space-between' }}>
              <Text variant="body" weight="semibold">Total</Text>
              <Text variant="body" weight="semibold">{formatPrice(order.total, currency)}</Text>
            </div>
          </section>

          {/* Shipping */}
          <section style={{ background: 'var(--color-bg-default)', border: '1px solid var(--color-border-default)', borderRadius: 'var(--radius-lg)', padding: '20px' }}>
            <Text variant="heading-3" style={{ marginBottom: '12px' }}>Datos de envío</Text>
            <Text variant="body-sm">{order.shippingAddress.fullName}</Text>
            <Text variant="body-sm">{order.shippingAddress.phone}</Text>
            <Text variant="body-sm">{order.shippingAddress.address}</Text>
            <Text variant="body-sm">
              {order.shippingAddress.city}, {order.shippingAddress.province}
              {order.shippingAddress.zip ? ` (${order.shippingAddress.zip})` : ''}
            </Text>
          </section>

          {/* Notes */}
          {order.notes && (
            <section style={{ background: 'var(--color-bg-default)', border: '1px solid var(--color-border-default)', borderRadius: 'var(--radius-lg)', padding: '20px' }}>
              <Text variant="heading-3" style={{ marginBottom: '8px' }}>Notas del cliente</Text>
              <Text variant="body-sm" color="muted">{order.notes}</Text>
            </section>
          )}
        </div>

        {/* Right column — actions */}
        <div style={{ flex: '0 0 300px', display: 'flex', flexDirection: 'column', gap: '20px' }}>

          {/* Payment actions */}
          <section style={{ background: 'var(--color-bg-default)', border: '1px solid var(--color-border-default)', borderRadius: 'var(--radius-lg)', padding: '20px' }}>
            <Text variant="heading-3" style={{ marginBottom: '12px' }}>Pago</Text>
            <Text variant="body-sm" style={{ marginBottom: '12px' }}>
              {order.paymentMethod === 'transfer' ? 'Transferencia bancaria' : 'Efectivo en mano'}
            </Text>
            {canConfirmPayment && (
              <StoreButton
                size="md"
                onClick={() => setConfirmModal({ type: 'confirmPayment' })}
                disabled={actionLoading}
                data-testid="confirm-payment-btn"
                style={{ width: '100%', justifyContent: 'center' }}
              >
                Confirmar pago recibido
              </StoreButton>
            )}
          </section>

          {/* Status actions */}
          {(nonCancelNext.length > 0 || canCancel) && (
            <section style={{ background: 'var(--color-bg-default)', border: '1px solid var(--color-border-default)', borderRadius: 'var(--radius-lg)', padding: '20px' }}>
              <Text variant="heading-3" style={{ marginBottom: '12px' }}>Estado del pedido</Text>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {nonCancelNext.map((status) => (
                  <StoreButton
                    key={status}
                    emphasis="outlined"
                    size="md"
                    onClick={() => setConfirmModal({ type: 'status', status: status as OrderStatus })}
                    disabled={actionLoading}
                    data-testid={`status-btn-${status}`}
                    style={{ justifyContent: 'center' }}
                  >
                    {STATUS_ACTION_LABEL[status]}
                  </StoreButton>
                ))}
                {canCancel && (
                  <StoreButton
                    emphasis="outlined"
                    size="md"
                    onClick={() => setConfirmModal({ type: 'cancel' })}
                    disabled={actionLoading}
                    data-testid="cancel-order-btn"
                    style={{ justifyContent: 'center', color: 'var(--color-error-600)', borderColor: 'var(--color-error-300)' }}
                  >
                    Cancelar pedido
                  </StoreButton>
                )}
              </div>
            </section>
          )}

          {/* Metadata */}
          <section style={{ background: 'var(--color-bg-default)', border: '1px solid var(--color-border-default)', borderRadius: 'var(--radius-lg)', padding: '20px' }}>
            <Text variant="heading-3" style={{ marginBottom: '12px' }}>Info</Text>
            <Text variant="caption" color="muted">
              Creado: {new Date(order.createdAt).toLocaleString('es-AR')}
            </Text>
            <Text variant="caption" color="muted">
              ID: {order._id}
            </Text>
          </section>
        </div>
      </div>

      {/* Confirm payment modal */}
      <Modal open={confirmModal?.type === 'confirmPayment'} size="sm" onClose={() => setConfirmModal(null)}>
        <Modal.Header>Confirmar pago</Modal.Header>
        <Modal.Body>
          <Text variant="body-sm">
            ¿Confirmás que recibiste el pago? El pedido pasará a estado "Confirmado".
          </Text>
        </Modal.Body>
        <Modal.Footer>
          <StoreButton emphasis="ghost" size="md" onClick={() => setConfirmModal(null)} disabled={actionLoading}>Cancelar</StoreButton>
          <StoreButton size="md" onClick={handleConfirmPayment} disabled={actionLoading} data-testid="confirm-payment-confirm-btn">
            {actionLoading ? 'Confirmando...' : 'Confirmar'}
          </StoreButton>
        </Modal.Footer>
      </Modal>

      {/* Status update modal */}
      <Modal open={!!(confirmModal?.type === 'status' && confirmModal.status)} size="sm" onClose={() => setConfirmModal(null)}>
        <Modal.Header>Actualizar estado</Modal.Header>
        <Modal.Body>
          <Text variant="body-sm">
            ¿Confirmás cambiar el estado a &ldquo;{confirmModal?.type === 'status' && confirmModal.status ? getStepLabel(order.paymentMethod, order.shippingMethod, confirmModal.status) : ''}&rdquo;?
          </Text>
        </Modal.Body>
        <Modal.Footer>
          <StoreButton emphasis="ghost" size="md" onClick={() => setConfirmModal(null)} disabled={actionLoading}>Cancelar</StoreButton>
          <StoreButton size="md" onClick={() => confirmModal?.type === 'status' && handleStatusUpdate(confirmModal.status!)} disabled={actionLoading} data-testid="status-confirm-btn">
            {actionLoading ? 'Actualizando...' : 'Confirmar'}
          </StoreButton>
        </Modal.Footer>
      </Modal>

      {/* Cancel modal */}
      <Modal open={confirmModal?.type === 'cancel'} size="sm" onClose={() => setConfirmModal(null)}>
          <Modal.Header>Cancelar pedido</Modal.Header>
          <Modal.Body>
            <Text variant="body-sm">
              ¿Estás seguro de que querés cancelar este pedido? Esta acción no se puede deshacer.
            </Text>
          </Modal.Body>
          <Modal.Footer>
            <StoreButton emphasis="ghost" size="md" onClick={() => setConfirmModal(null)} disabled={actionLoading}>Volver</StoreButton>
            <StoreButton
              size="md"
              onClick={handleCancel}
              disabled={actionLoading}
              data-testid="cancel-order-confirm-btn"
              style={{ background: 'var(--color-error-600)', borderColor: 'var(--color-error-600)' }}
            >
              {actionLoading ? 'Cancelando...' : 'Cancelar pedido'}
            </StoreButton>
          </Modal.Footer>
      </Modal>
    </main>
  );
}

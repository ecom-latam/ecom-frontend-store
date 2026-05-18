'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Image from 'next/image';

import { orders } from '@/utils/api/orders';
import type { Order, OrderStatus } from '@/utils/api/orders';
import { Badge, Button, Select, Text, Modal } from 'zoui';
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

const PAYMENT_LABEL: Record<string, string> = {
  pending: 'Pendiente',
  in_progress: 'Notificado',
  paid: 'Pagado',
  failed: 'Fallido',
};

const PAYMENT_TONE: Record<string, BadgeType> = {
  pending: 'neutral',
  in_progress: 'warning',
  paid: 'success',
  failed: 'error',
};

const NEXT_STATUS: Record<string, OrderStatus[]> = {
  new: ['cancelled'],
  confirmed: ['processing', 'cancelled'],
  processing: ['shipped', 'cancelled'],
  shipped: ['delivered'],
  delivered: [],
  cancelled: [],
};

const STATUS_ACTION_LABEL: Record<OrderStatus, string> = {
  processing: 'Marcar en preparación',
  shipped: 'Marcar como enviado',
  delivered: 'Marcar como entregado',
  cancelled: 'Cancelar pedido',
  new: '',
  confirmed: '',
};

export default function AdminPedidoDetailPage() {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();

  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmModal, setConfirmModal] = useState<{ type: 'confirmPayment' | 'status' | 'cancel'; status?: OrderStatus } | null>(null);

  useEffect(() => {
    orders.admin.getById(id).then(({ data }) => {
      setOrder(data);
    }).catch(() => setOrder(null)).finally(() => setLoading(false));
  }, [id]);

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
        <div className="animate-pulse space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 rounded-lg" style={{ background: 'var(--color-bg-subtle)' }} />
          ))}
        </div>
      </main>
    );
  }

  if (!order) {
    return (
      <main style={{ padding: '32px' }}>
        <Text variant="body" color="muted">Pedido no encontrado.</Text>
        <Button variant="ghost" shape="rounded" size="md" style={{ marginTop: '12px' }} onClick={() => router.push('/gestion/pedidos')}>
          ← Volver a pedidos
        </Button>
      </main>
    );
  }

  const canConfirmPayment = order.paymentStatus === 'in_progress' && order.status !== 'cancelled';
  const nextStatuses = NEXT_STATUS[order.status] ?? [];
  const nonCancelNext = nextStatuses.filter((s) => s !== 'cancelled');
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
        <Text variant="heading-2" as="h1">Pedido #{order.orderNumber}</Text>
        <Badge type={STATUS_TONE[order.status]} shape="pill" data-testid="order-status-badge">{STATUS_LABEL[order.status]}</Badge>
        <Badge type={PAYMENT_TONE[order.paymentStatus]} shape="pill" data-testid="order-payment-badge">{PAYMENT_LABEL[order.paymentStatus]}</Badge>
      </div>

      {error && (
        <div style={{ marginBottom: '16px', padding: '12px', background: 'var(--color-error-50)', border: '1px solid var(--color-error-200)', borderRadius: 'var(--radius-md)' }}>
          <Text variant="body-sm" style={{ color: 'var(--color-error-700)' }} as="p">{error}</Text>
        </div>
      )}

      <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap', alignItems: 'flex-start' }}>

        {/* Left column */}
        <div style={{ flex: '1 1 400px', display: 'flex', flexDirection: 'column', gap: '20px' }}>

          {/* Items */}
          <section style={{ background: 'var(--color-bg-default)', border: '1px solid var(--color-border-default)', borderRadius: 'var(--radius-lg)', padding: '20px' }}>
            <Text variant="heading-3" as="h2" style={{ marginBottom: '16px' }}>Productos</Text>
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
                    <Text variant="body-sm" weight="medium" as="p">{item.name}</Text>
                    {Object.keys(item.selectedOptions).length > 0 && (
                      <Text variant="caption" color="muted" as="p">
                        {Object.entries(item.selectedOptions).map(([k, v]) => `${k}: ${v}`).join(' · ')}
                      </Text>
                    )}
                    <Text variant="caption" color="muted" as="p">x{item.quantity} · ${item.price.toLocaleString('es-AR')}</Text>
                  </div>
                  <Text variant="body-sm" weight="semibold" as="span">${item.subtotal.toLocaleString('es-AR')}</Text>
                </li>
              ))}
            </ul>
            <div style={{ borderTop: '1px solid var(--color-border-default)', marginTop: '16px', paddingTop: '16px', display: 'flex', justifyContent: 'space-between' }}>
              <Text variant="body" weight="semibold" as="span">Total</Text>
              <Text variant="body" weight="semibold" as="span">${order.total.toLocaleString('es-AR')}</Text>
            </div>
          </section>

          {/* Shipping */}
          <section style={{ background: 'var(--color-bg-default)', border: '1px solid var(--color-border-default)', borderRadius: 'var(--radius-lg)', padding: '20px' }}>
            <Text variant="heading-3" as="h2" style={{ marginBottom: '12px' }}>Datos de envío</Text>
            <Text variant="body-sm" as="p">{order.shippingAddress.fullName}</Text>
            <Text variant="body-sm" as="p">{order.shippingAddress.phone}</Text>
            <Text variant="body-sm" as="p">{order.shippingAddress.address}</Text>
            <Text variant="body-sm" as="p">
              {order.shippingAddress.city}, {order.shippingAddress.province}
              {order.shippingAddress.zip ? ` (${order.shippingAddress.zip})` : ''}
            </Text>
          </section>

          {/* Notes */}
          {order.notes && (
            <section style={{ background: 'var(--color-bg-default)', border: '1px solid var(--color-border-default)', borderRadius: 'var(--radius-lg)', padding: '20px' }}>
              <Text variant="heading-3" as="h2" style={{ marginBottom: '8px' }}>Notas del cliente</Text>
              <Text variant="body-sm" color="muted" as="p">{order.notes}</Text>
            </section>
          )}
        </div>

        {/* Right column — actions */}
        <div style={{ flex: '0 0 300px', display: 'flex', flexDirection: 'column', gap: '20px' }}>

          {/* Payment actions */}
          <section style={{ background: 'var(--color-bg-default)', border: '1px solid var(--color-border-default)', borderRadius: 'var(--radius-lg)', padding: '20px' }}>
            <Text variant="heading-3" as="h2" style={{ marginBottom: '12px' }}>Pago</Text>
            <Text variant="body-sm" as="p" style={{ marginBottom: '12px' }}>
              {order.paymentMethod === 'transfer' ? 'Transferencia bancaria' : 'Efectivo en mano'}
            </Text>
            {canConfirmPayment && (
              <Button
                variant="filled"
                shape="rounded"
                size="md"
                onClick={() => setConfirmModal({ type: 'confirmPayment' })}
                disabled={actionLoading}
                data-testid="confirm-payment-btn"
                style={{ width: '100%', justifyContent: 'center' }}
              >
                Confirmar pago recibido
              </Button>
            )}
          </section>

          {/* Status actions */}
          {(nonCancelNext.length > 0 || canCancel) && (
            <section style={{ background: 'var(--color-bg-default)', border: '1px solid var(--color-border-default)', borderRadius: 'var(--radius-lg)', padding: '20px' }}>
              <Text variant="heading-3" as="h2" style={{ marginBottom: '12px' }}>Estado del pedido</Text>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {nonCancelNext.map((status) => (
                  <Button
                    key={status}
                    variant="outlined"
                    shape="rounded"
                    size="md"
                    onClick={() => setConfirmModal({ type: 'status', status })}
                    disabled={actionLoading}
                    data-testid={`status-btn-${status}`}
                    style={{ justifyContent: 'center' }}
                  >
                    {STATUS_ACTION_LABEL[status]}
                  </Button>
                ))}
                {canCancel && (
                  <Button
                    variant="outlined"
                    shape="rounded"
                    size="md"
                    onClick={() => setConfirmModal({ type: 'cancel' })}
                    disabled={actionLoading}
                    data-testid="cancel-order-btn"
                    style={{ justifyContent: 'center', color: 'var(--color-error-600)', borderColor: 'var(--color-error-300)' }}
                  >
                    Cancelar pedido
                  </Button>
                )}
              </div>
            </section>
          )}

          {/* Metadata */}
          <section style={{ background: 'var(--color-bg-default)', border: '1px solid var(--color-border-default)', borderRadius: 'var(--radius-lg)', padding: '20px' }}>
            <Text variant="heading-3" as="h2" style={{ marginBottom: '12px' }}>Info</Text>
            <Text variant="caption" color="muted" as="p">
              Creado: {new Date(order.createdAt).toLocaleString('es-AR')}
            </Text>
            <Text variant="caption" color="muted" as="p">
              ID: {order._id}
            </Text>
          </section>
        </div>
      </div>

      {/* Confirm payment modal */}
      {confirmModal?.type === 'confirmPayment' && (
        <Modal size="sm" onClose={() => setConfirmModal(null)}>
          <Modal.Header onClose={() => setConfirmModal(null)}>Confirmar pago</Modal.Header>
          <Modal.Body>
            <Text variant="body-sm" as="p">
              ¿Confirmás que recibiste el pago? El pedido pasará a estado "Confirmado".
            </Text>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="ghost" shape="rounded" size="md" onClick={() => setConfirmModal(null)} disabled={actionLoading}>Cancelar</Button>
            <Button variant="filled" shape="rounded" size="md" onClick={handleConfirmPayment} disabled={actionLoading} data-testid="confirm-payment-confirm-btn">
              {actionLoading ? 'Confirmando...' : 'Confirmar'}
            </Button>
          </Modal.Footer>
        </Modal>
      )}

      {/* Status update modal */}
      {confirmModal?.type === 'status' && confirmModal.status && (
        <Modal size="sm" onClose={() => setConfirmModal(null)}>
          <Modal.Header onClose={() => setConfirmModal(null)}>Actualizar estado</Modal.Header>
          <Modal.Body>
            <Text variant="body-sm" as="p">
              ¿Confirmás cambiar el estado a &ldquo;{STATUS_LABEL[confirmModal.status]}&rdquo;?
            </Text>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="ghost" shape="rounded" size="md" onClick={() => setConfirmModal(null)} disabled={actionLoading}>Cancelar</Button>
            <Button variant="filled" shape="rounded" size="md" onClick={() => handleStatusUpdate(confirmModal.status!)} disabled={actionLoading} data-testid="status-confirm-btn">
              {actionLoading ? 'Actualizando...' : 'Confirmar'}
            </Button>
          </Modal.Footer>
        </Modal>
      )}

      {/* Cancel modal */}
      {confirmModal?.type === 'cancel' && (
        <Modal size="sm" onClose={() => setConfirmModal(null)}>
          <Modal.Header onClose={() => setConfirmModal(null)}>Cancelar pedido</Modal.Header>
          <Modal.Body>
            <Text variant="body-sm" as="p">
              ¿Estás seguro de que querés cancelar este pedido? Esta acción no se puede deshacer.
            </Text>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="ghost" shape="rounded" size="md" onClick={() => setConfirmModal(null)} disabled={actionLoading}>Volver</Button>
            <Button
              variant="filled"
              shape="rounded"
              size="md"
              onClick={handleCancel}
              disabled={actionLoading}
              data-testid="cancel-order-confirm-btn"
              style={{ background: 'var(--color-error-600)', borderColor: 'var(--color-error-600)' }}
            >
              {actionLoading ? 'Cancelando...' : 'Cancelar pedido'}
            </Button>
          </Modal.Footer>
        </Modal>
      )}
    </main>
  );
}

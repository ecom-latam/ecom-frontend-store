'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Image from 'next/image';

import { getAccessTokenRole } from '@/utils/helpers';
import { orders } from '@/utils/api/orders';
import type { Order } from '@/utils/api/orders';
import { apiClient } from '@/utils/api';
import { Button, Badge, Text, Modal } from 'zoui';
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
  in_progress: 'Transferencia notificada',
  paid: 'Pagado',
  failed: 'Fallido',
};

const PAYMENT_TONE: Record<string, BadgeType> = {
  pending: 'neutral',
  in_progress: 'warning',
  paid: 'success',
  failed: 'error',
};

interface StorePublic {
  transfer_info?: string;
}

export default function OrderDetailPage() {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();

  const [order, setOrder] = useState<Order | null>(null);
  const [storeInfo, setStoreInfo] = useState<StorePublic | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [confirmModal, setConfirmModal] = useState<'notify' | 'cancel' | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchOrder = useCallback(async () => {
    try {
      const { data } = await orders.getById(id);
      setOrder(data);
    } catch {
      setOrder(null);
    }
  }, [id]);

  useEffect(() => {
    const role = getAccessTokenRole();
    if (!role) {
      router.replace('/iniciar-sesion');
      return;
    }

    async function load() {
      setLoading(true);
      try {
        const [orderRes, storeRes] = await Promise.all([
          orders.getById(id),
          apiClient.get<StorePublic>('/api/store/public').catch(() => ({ data: null })),
        ]);
        setOrder(orderRes.data);
        setStoreInfo(storeRes.data);
      } catch {
        setOrder(null);
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [id, router]);

  async function handleNotifyPayment() {
    setActionLoading(true);
    setError(null);
    try {
      const { data } = await orders.notifyPayment(id);
      setOrder(data);
      setConfirmModal(null);
    } catch {
      setError('No se pudo notificar el pago. Intentá de nuevo.');
    } finally {
      setActionLoading(false);
    }
  }

  async function handleCancel() {
    setActionLoading(true);
    setError(null);
    try {
      const { data } = await orders.cancel(id);
      setOrder(data);
      setConfirmModal(null);
      void fetchOrder();
    } catch {
      setError('No se pudo cancelar el pedido. Intentá de nuevo.');
    } finally {
      setActionLoading(false);
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen" style={{ background: 'var(--color-bg-surface)' }}>
        <div className="max-w-3xl mx-auto px-4 py-8">
          <div className="animate-pulse space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-24 rounded-lg" style={{ background: 'var(--color-bg-subtle)' }} />
            ))}
          </div>
        </div>
      </main>
    );
  }

  if (!order) {
    return (
      <main className="min-h-screen" style={{ background: 'var(--color-bg-surface)' }}>
        <div className="max-w-3xl mx-auto px-4 py-16 text-center">
          <Text variant="body" color="muted">Pedido no encontrado.</Text>
          <Button variant="filled" shape="rounded" size="md" style={{ marginTop: '16px' }} onClick={() => router.push('/mis-pedidos')}>
            Mis pedidos
          </Button>
        </div>
      </main>
    );
  }

  const canNotify = order.paymentMethod === 'transfer' && order.paymentStatus === 'pending' && order.status !== 'cancelled';
  const canCancel = order.paymentMethod === 'transfer' && order.paymentStatus !== 'paid' && order.status !== 'cancelled';

  return (
    <main className="min-h-screen" style={{ background: 'var(--color-bg-surface)' }}>
      <div className="max-w-3xl mx-auto px-4 py-8">
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
          <button onClick={() => router.push('/mis-pedidos')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-fg-muted)', fontSize: 'var(--font-size-sm)' }}>
            ← Mis pedidos
          </button>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '24px', flexWrap: 'wrap' }}>
          <Text variant="heading-2" as="h1">Pedido #{order.orderNumber}</Text>
          <Badge type={STATUS_TONE[order.status]} shape="pill">{STATUS_LABEL[order.status]}</Badge>
          <Badge type={PAYMENT_TONE[order.paymentStatus]} shape="pill">{PAYMENT_LABEL[order.paymentStatus]}</Badge>
        </div>

        {error && (
          <div style={{ marginBottom: '16px', padding: '12px', background: 'var(--color-error-50)', border: '1px solid var(--color-error-200)', borderRadius: 'var(--radius-md)' }}>
            <Text variant="body-sm" style={{ color: 'var(--color-error-700)' }} as="p">{error}</Text>
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

          {/* Items */}
          <section style={{ background: 'var(--color-bg-default)', border: '1px solid var(--color-border-default)', borderRadius: 'var(--radius-lg)', padding: '20px' }}>
            <Text variant="heading-3" as="h2" style={{ marginBottom: '16px' }}>Productos</Text>
            <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {order.items.map((item, idx) => (
                <li key={idx} style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                  <div style={{ width: 56, height: 56, background: 'var(--color-bg-subtle)', borderRadius: 'var(--radius-sm)', overflow: 'hidden', flexShrink: 0 }}>
                    {item.image ? (
                      <Image src={item.image} alt={item.name} width={56} height={56} style={{ objectFit: 'cover', width: '100%', height: '100%' }} />
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
                    <Text variant="caption" color="muted" as="p">x{item.quantity} · ${item.price.toLocaleString('es-AR')} c/u</Text>
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
            <Text variant="heading-3" as="h2" style={{ marginBottom: '12px' }}>Envío</Text>
            <Text variant="body-sm" as="p">{order.shippingAddress.fullName}</Text>
            <Text variant="body-sm" as="p">{order.shippingAddress.phone}</Text>
            <Text variant="body-sm" as="p">{order.shippingAddress.address}</Text>
            <Text variant="body-sm" as="p">{order.shippingAddress.city}, {order.shippingAddress.province}{order.shippingAddress.zip ? ` (${order.shippingAddress.zip})` : ''}</Text>
          </section>

          {/* Payment */}
          <section style={{ background: 'var(--color-bg-default)', border: '1px solid var(--color-border-default)', borderRadius: 'var(--radius-lg)', padding: '20px' }}>
            <Text variant="heading-3" as="h2" style={{ marginBottom: '12px' }}>Pago</Text>
            <Text variant="body-sm" as="p">
              Método: {order.paymentMethod === 'transfer' ? 'Transferencia bancaria' : 'Efectivo en mano'}
            </Text>

            {order.paymentMethod === 'transfer' && order.paymentStatus === 'pending' && storeInfo?.transfer_info && (
              <div style={{ marginTop: '16px', padding: '16px', background: 'var(--color-brand-50)', border: '1px solid var(--color-brand-200)', borderRadius: 'var(--radius-md)' }}>
                <Text variant="body-sm" weight="semibold" as="p" style={{ marginBottom: '8px' }}>
                  Datos para transferir:
                </Text>
                <Text variant="body-sm" as="p" style={{ whiteSpace: 'pre-wrap' }}>{storeInfo.transfer_info}</Text>
              </div>
            )}
          </section>

          {/* Notes */}
          {order.notes && (
            <section style={{ background: 'var(--color-bg-default)', border: '1px solid var(--color-border-default)', borderRadius: 'var(--radius-lg)', padding: '20px' }}>
              <Text variant="heading-3" as="h2" style={{ marginBottom: '8px' }}>Notas</Text>
              <Text variant="body-sm" color="muted" as="p">{order.notes}</Text>
            </section>
          )}

          {/* Actions */}
          {(canNotify || canCancel) && (
            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
              {canNotify && (
                <Button
                  variant="filled"
                  shape="rounded"
                  size="md"
                  onClick={() => setConfirmModal('notify')}
                  disabled={actionLoading}
                >
                  Ya transferí
                </Button>
              )}
              {canCancel && (
                <Button
                  variant="outlined"
                  shape="rounded"
                  size="md"
                  onClick={() => setConfirmModal('cancel')}
                  disabled={actionLoading}
                  style={{ color: 'var(--color-error-600)', borderColor: 'var(--color-error-300)' }}
                >
                  Cancelar pedido
                </Button>
              )}
            </div>
          )}

        </div>
      </div>

      {/* Confirm notify payment modal */}
      {confirmModal === 'notify' && (
        <Modal size="sm" onClose={() => setConfirmModal(null)}>
          <Modal.Header onClose={() => setConfirmModal(null)}>Confirmar pago</Modal.Header>
          <Modal.Body>
            <Text variant="body-sm" as="p">
              ¿Confirmás que ya realizaste la transferencia? El vendedor la verificará y confirmará tu pedido.
            </Text>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="ghost" shape="rounded" size="md" onClick={() => setConfirmModal(null)} disabled={actionLoading}>
              Cancelar
            </Button>
            <Button variant="filled" shape="rounded" size="md" onClick={handleNotifyPayment} disabled={actionLoading}>
              {actionLoading ? 'Enviando...' : 'Sí, ya transferí'}
            </Button>
          </Modal.Footer>
        </Modal>
      )}

      {/* Confirm cancel modal */}
      {confirmModal === 'cancel' && (
        <Modal size="sm" onClose={() => setConfirmModal(null)}>
          <Modal.Header onClose={() => setConfirmModal(null)}>Cancelar pedido</Modal.Header>
          <Modal.Body>
            <Text variant="body-sm" as="p">
              ¿Estás seguro de que querés cancelar este pedido? Esta acción no se puede deshacer.
            </Text>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="ghost" shape="rounded" size="md" onClick={() => setConfirmModal(null)} disabled={actionLoading}>
              Volver
            </Button>
            <Button
              variant="filled"
              shape="rounded"
              size="md"
              onClick={handleCancel}
              disabled={actionLoading}
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

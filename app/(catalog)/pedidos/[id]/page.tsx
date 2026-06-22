'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Image from 'next/image';

import { getAccessTokenRole } from '@/utils/helpers';
import { orders } from '@/utils/api/orders';
import type { Order } from '@/utils/api/orders';
import { apiClient } from '@/utils/api';
import { Button, Badge, Text, Modal } from 'zoui';
import { usePageConfig } from '@/context/PageConfigContext';
import { formatPrice } from '@/lib/format';
import { StoreButton } from '@/components/ui/StoreButton';
import type { BadgeTone } from 'zoui';

const STATUS_LABEL: Record<string, string> = {
  new:        'Nuevo',
  notified:   'Transferencia enviada',
  confirmed:  'Confirmado',
  processing: 'En preparación',
  shipped:    'Enviado',
  ready:      'Listo para retirar',
  delivered:  'Entregado',
  cancelled:  'Cancelado',
};

const STATUS_TONE: Record<string, BadgeTone> = {
  new:        'neutral',
  notified:   'warning',
  confirmed:  'info',
  processing: 'warning',
  shipped:    'info',
  ready:      'info',
  delivered:  'success',
  cancelled:  'danger',
};

const PAYMENT_NOTE: Record<string, string | null> = {
  pending:     null,
  in_progress: 'Transferencia notificada — el vendedor verificará el pago.',
  paid:        null,
  failed:      null,
};

interface TransferData {
  transfer_info?: string;
  transfer_cbu?: string;
  transfer_alias?: string;
  transfer_bank?: string;
  transfer_owner?: string;
  transfer_cuit?: string;
}

function TransferInfo({ store }: { store: TransferData }) {
  const fields = [
    { label: 'CBU',     value: store.transfer_cbu },
    { label: 'Alias',   value: store.transfer_alias },
    { label: 'Banco',   value: store.transfer_bank },
    { label: 'Titular', value: store.transfer_owner },
    { label: 'CUIT',    value: store.transfer_cuit },
  ].filter((f) => f.value);

  if (fields.length > 0) {
    return (
      <div style={{ marginTop: '16px', padding: '16px', background: 'var(--color-brand-50)', border: '1px solid var(--color-brand-200)', borderRadius: 'var(--radius-md)' }}>
        <Text variant="body-sm" weight="semibold" as="p" style={{ marginBottom: '12px' }}>
          Datos para transferir:
        </Text>
        <dl style={{ margin: 0, display: 'grid', gridTemplateColumns: 'auto 1fr', gap: '6px 16px' }}>
          {fields.map((f) => (
            <>
              <dt key={`dt-${f.label}`} style={{ fontWeight: 600, fontSize: 'var(--font-size-sm)', color: 'var(--color-fg-muted)' }}>{f.label}</dt>
              <dd key={`dd-${f.label}`} style={{ margin: 0, fontSize: 'var(--font-size-sm)', fontFamily: 'monospace', wordBreak: 'break-all' }}>{f.value}</dd>
            </>
          ))}
        </dl>
      </div>
    );
  }

  if (store.transfer_info) {
    return (
      <div style={{ marginTop: '16px', padding: '16px', background: 'var(--color-brand-50)', border: '1px solid var(--color-brand-200)', borderRadius: 'var(--radius-md)' }}>
        <Text variant="body-sm" weight="semibold" as="p" style={{ marginBottom: '8px' }}>Datos para transferir:</Text>
        <Text variant="body-sm" as="p" style={{ whiteSpace: 'pre-wrap' }}>{store.transfer_info}</Text>
      </div>
    );
  }

  return null;
}

export default function OrderDetailPage() {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();
  const { hasPurchases, store: pageStore } = usePageConfig();
  const currency = pageStore?.currency;
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [order, setOrder]           = useState<Order | null>(null);
  const [storeInfo, setStoreInfo]   = useState<TransferData | null>(null);
  const [loading, setLoading]       = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [confirmModal, setConfirmModal]   = useState<'notify' | 'cancel' | null>(null);
  const [error, setError]           = useState<string | null>(null);
  const [voucher, setVoucher]       = useState<File | null>(null);
  const [voucherPreview, setVoucherPreview] = useState<string | null>(null);

  useEffect(() => {
    const role = getAccessTokenRole();
    if (!role) { router.replace('/iniciar-sesion'); return; }
    if (role !== 'Customer') { router.replace('/productos'); return; }
    // EC-559: tiendas sin el modulo de compras no tienen pedidos.
    if (hasPurchases === false) { router.replace('/productos'); return; }

    async function load() {
      setLoading(true);
      try {
        const [orderRes, pageRes] = await Promise.all([
          orders.getById(id),
          apiClient.get<{ store?: TransferData }>('/api/page/public').catch(() => ({ data: null })),
        ]);
        setOrder(orderRes.data);
        setStoreInfo(pageRes.data?.store ?? null);
      } catch {
        setOrder(null);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id, router, hasPurchases]);

  function handleVoucherChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] ?? null;
    setVoucher(file);
    if (voucherPreview) URL.revokeObjectURL(voucherPreview);
    setVoucherPreview(file ? URL.createObjectURL(file) : null);
  }

  function openNotifyModal() {
    setVoucher(null);
    setVoucherPreview(null);
    setConfirmModal('notify');
  }

  async function handleNotifyPayment() {
    setActionLoading(true);
    setError(null);
    try {
      const { data } = await orders.notifyPayment(id, voucher);
      setOrder(data);
      setConfirmModal(null);
      setVoucher(null);
      setVoucherPreview(null);
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
          <StoreButton size="md" style={{ marginTop: '16px' }} onClick={() => router.push('/mis-pedidos')}>
            Mis pedidos
          </StoreButton>
        </div>
      </main>
    );
  }

  const canNotify   = order.paymentStatus === 'pending' && order.status === 'new';
  const canCancel   = order.paymentStatus !== 'paid' && !['cancelled', 'delivered'].includes(order.status);
  const paymentNote = PAYMENT_NOTE[order.paymentStatus];
  const hasTransferData = storeInfo && (
    storeInfo.transfer_cbu || storeInfo.transfer_alias || storeInfo.transfer_bank ||
    storeInfo.transfer_owner || storeInfo.transfer_cuit || storeInfo.transfer_info
  );

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
          <Badge tone={STATUS_TONE[order.status]} variant="pill">{STATUS_LABEL[order.status]}</Badge>
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
                    <Text variant="caption" color="muted" as="p">x{item.quantity} · {formatPrice(item.price, currency)} c/u</Text>
                  </div>
                  <Text variant="body-sm" weight="semibold" as="span">{formatPrice(item.subtotal, currency)}</Text>
                </li>
              ))}
            </ul>
            <div style={{ borderTop: '1px solid var(--color-border-default)', marginTop: '16px', paddingTop: '16px', display: 'flex', justifyContent: 'space-between' }}>
              <Text variant="body" weight="semibold" as="span">Total</Text>
              <Text variant="body" weight="semibold" as="span">{formatPrice(order.total, currency)}</Text>
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
            <Text variant="body-sm" as="p">Método: Transferencia bancaria</Text>

            {paymentNote && (
              <Text variant="body-sm" color="muted" as="p" style={{ marginTop: '8px' }}>{paymentNote}</Text>
            )}

            {order.paymentProofUrl && order.paymentStatus !== 'pending' && (
              <div style={{ marginTop: '12px' }}>
                <Text variant="body-sm" color="muted" as="p" style={{ marginBottom: '6px' }}>Comprobante adjunto:</Text>
                <a href={order.paymentProofUrl} target="_blank" rel="noopener noreferrer">
                  <Image src={order.paymentProofUrl} alt="Comprobante de transferencia" width={120} height={80} style={{ objectFit: 'cover', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border-default)' }} />
                </a>
              </div>
            )}

            {order.paymentStatus === 'pending' && hasTransferData && (
              <TransferInfo store={storeInfo!} />
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
                <StoreButton size="md" onClick={openNotifyModal} disabled={actionLoading}>
                  Ya transferí
                </StoreButton>
              )}
              {canCancel && (
                <StoreButton
                  emphasis="outlined"
                  size="md"
                  onClick={() => setConfirmModal('cancel')}
                  disabled={actionLoading}
                  style={{ color: 'var(--color-error-600)', borderColor: 'var(--color-error-300)' }}
                >
                  Cancelar pedido
                </StoreButton>
              )}
            </div>
          )}

        </div>
      </div>

      {/* Notify payment modal */}
      <Modal open={confirmModal === 'notify'} size="sm" onClose={() => !actionLoading && setConfirmModal(null)}>
        <Modal.Header>Confirmar pago</Modal.Header>
        <Modal.Body>
          <Text variant="body-sm" as="p" style={{ marginBottom: '16px' }}>
            ¿Confirmás que ya realizaste la transferencia? El vendedor la verificará y confirmará tu pedido.
          </Text>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            style={{ display: 'none' }}
            onChange={handleVoucherChange}
          />

          {voucherPreview ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <Image src={voucherPreview} alt="Comprobante" width={72} height={72} style={{ objectFit: 'cover', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border-default)', flexShrink: 0 }} />
              <div>
                <Text variant="caption" color="muted" as="p">{voucher?.name}</Text>
                <button
                  onClick={() => { setVoucher(null); setVoucherPreview(null); if (fileInputRef.current) fileInputRef.current.value = ''; }}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-error-600)', fontSize: 'var(--font-size-sm)', padding: 0 }}
                >
                  Quitar
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => fileInputRef.current?.click()}
              style={{ width: '100%', padding: '10px', border: '1px dashed var(--color-border-default)', borderRadius: 'var(--radius-md)', background: 'var(--color-bg-subtle)', cursor: 'pointer', color: 'var(--color-fg-muted)', fontSize: 'var(--font-size-sm)' }}
            >
              + Adjuntar comprobante (opcional)
            </button>
          )}
        </Modal.Body>
        <Modal.Footer>
          <StoreButton emphasis="ghost" size="md" onClick={() => setConfirmModal(null)} disabled={actionLoading}>
            Cancelar
          </StoreButton>
          <StoreButton size="md" onClick={handleNotifyPayment} disabled={actionLoading}>
            {actionLoading ? 'Enviando...' : 'Sí, ya transferí'}
          </StoreButton>
        </Modal.Footer>
      </Modal>

      {/* Cancel modal */}
      <Modal open={confirmModal === 'cancel'} size="sm" onClose={() => setConfirmModal(null)}>
        <Modal.Header>Cancelar pedido</Modal.Header>
        <Modal.Body>
          <Text variant="body-sm" as="p">
            ¿Estás seguro de que querés cancelar este pedido? Esta acción no se puede deshacer.
          </Text>
        </Modal.Body>
        <Modal.Footer>
          <StoreButton emphasis="ghost" size="md" onClick={() => setConfirmModal(null)} disabled={actionLoading}>
            Volver
          </StoreButton>
          <StoreButton
            size="md"
            onClick={handleCancel}
            disabled={actionLoading}
            style={{ background: 'var(--color-error-600)', borderColor: 'var(--color-error-600)' }}
          >
            {actionLoading ? 'Cancelando...' : 'Cancelar pedido'}
          </StoreButton>
        </Modal.Footer>
      </Modal>
    </main>
  );
}

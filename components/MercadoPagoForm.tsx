'use client';

import { useEffect, useRef, useState } from 'react';
import { StoreButton } from '@/components/ui/StoreButton';
import { StoreInput } from '@/components/ui/StoreInput';
import { StoreSelect } from '@/components/ui/StoreSelect';

declare global {
  interface Window {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    MercadoPago: any;
  }
}

export interface MpCardData {
  token: string;
  paymentMethodId: string;
  issuerId?: string;
  installments: number;
  paymentType: string;
  payer: {
    email: string;
    identification: { type: string; number: string };
  };
}

interface Installment {
  installments: number;
  recommended_message: string;
}

interface MercadoPagoFormProps {
  publicKey: string;
  amount: number;
  submitting: boolean;
  onSubmit: (cardData: MpCardData) => void;
}

const ID_TYPES = [
  { value: 'DNI',  label: 'DNI'  },
  { value: 'CUIL', label: 'CUIL' },
  { value: 'CUIT', label: 'CUIT' },
];

const fieldStyle = {
  height: '42px',
  border: '1px solid var(--color-border-default)',
  borderRadius: 'var(--radius-md)',
  padding: '0 12px',
  background: 'var(--color-bg-default)',
  fontSize: '14px',
  color: 'var(--color-fg-default)',
  width: '100%',
  boxSizing: 'border-box' as const,
};

export default function MercadoPagoForm({
  publicKey,
  amount,
  submitting,
  onSubmit,
}: MercadoPagoFormProps) {
  const mpRef = useRef<unknown>(null);
  const fieldsRef = useRef<{ cardNumber?: unknown; expDate?: unknown; cvv?: unknown }>({});
  const [sdkReady, setSdkReady] = useState(false);
  const [email, setEmail] = useState('');
  const [cardholderName, setCardholderName] = useState('');
  const [idType, setIdType] = useState('DNI');
  const [idNumber, setIdNumber] = useState('');
  const [installments, setInstallments] = useState<Installment[]>([]);
  const [selectedInstallments, setSelectedInstallments] = useState(1);
  const [localError, setLocalError] = useState<string | null>(null);

  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://sdk.mercadopago.com/js/v2';
    script.onload = () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const mp = new window.MercadoPago(publicKey, { locale: 'es-AR' }) as any;
      mpRef.current = mp;

      const fields = mp.fields;
      fieldsRef.current.cardNumber = fields.create('cardNumber', { placeholder: '0000 0000 0000 0000' });
      fieldsRef.current.expDate = fields.create('expirationDate', { placeholder: 'MM/YY' });
      fieldsRef.current.cvv = fields.create('securityCode', { placeholder: 'CVV' });

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (fieldsRef.current.cardNumber as any).mount('mp-card-number');
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (fieldsRef.current.expDate as any).mount('mp-expiration-date');
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (fieldsRef.current.cvv as any).mount('mp-security-code');

      // Load installments when card type is detected
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (fieldsRef.current.cardNumber as any).on('binChange', async (data: any) => {
        if (!data?.bin || data.bin.length < 6) { setInstallments([]); return; }
        try {
          const inst = await mp.getInstallments({ amount: String(amount), bin: data.bin });
          if (inst?.[0]?.payer_costs) {
            setInstallments(inst[0].payer_costs.map((c: { installments: number; recommended_message: string }) => ({
              installments: c.installments,
              recommended_message: c.recommended_message,
            })));
            setSelectedInstallments(inst[0].payer_costs[0]?.installments ?? 1);
          }
        } catch { setInstallments([]); }
      });

      setSdkReady(true);
    };
    document.head.appendChild(script);

    return () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      try { (fieldsRef.current.cardNumber as any)?.unmount(); } catch {}
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      try { (fieldsRef.current.expDate as any)?.unmount(); } catch {}
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      try { (fieldsRef.current.cvv as any)?.unmount(); } catch {}
      if (script.parentNode) script.parentNode.removeChild(script);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [publicKey, amount]);

  async function handlePay() {
    setLocalError(null);
    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { setLocalError('Ingresá un email válido.'); return; }
    if (!cardholderName.trim()) { setLocalError('Ingresá el nombre del titular.'); return; }
    if (!idNumber.trim()) { setLocalError('Ingresá el número de documento.'); return; }

    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const mp = mpRef.current as any;
      const result = await mp.fields.createCardToken({
        cardholderName: cardholderName.trim(),
        identificationType: idType,
        identificationNumber: idNumber.trim(),
      });

      if (result.error) {
        setLocalError('Datos de tarjeta inválidos. Revisá los campos e intentá nuevamente.');
        return;
      }

      onSubmit({
        token:           result.id,
        paymentMethodId: result.payment_method_id,
        issuerId:        result.issuer_id ? String(result.issuer_id) : undefined,
        installments:    selectedInstallments,
        paymentType:     result.payment_type_id || 'credit_card',
        payer: {
          email: email.trim(),
          identification: { type: idType, number: idNumber.trim() },
        },
      });
    } catch {
      setLocalError('No se pudo procesar la tarjeta. Intentá nuevamente.');
    }
  }

  if (!sdkReady) {
    return (
      <div style={{ padding: '16px', textAlign: 'center', color: 'var(--color-fg-muted)', fontSize: '14px' }}>
        Cargando formulario de pago…
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '16px' }}>
      <StoreInput
        label="Email del pagador"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="tu@email.com"
        type="email"
        size="md"
      />

      <div>
        <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, marginBottom: '6px', color: 'var(--color-fg-default)' }}>
          Número de tarjeta
        </label>
        <div id="mp-card-number" style={fieldStyle} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
        <div>
          <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, marginBottom: '6px', color: 'var(--color-fg-default)' }}>
            Vencimiento
          </label>
          <div id="mp-expiration-date" style={fieldStyle} />
        </div>
        <div>
          <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, marginBottom: '6px', color: 'var(--color-fg-default)' }}>
            CVV
          </label>
          <div id="mp-security-code" style={fieldStyle} />
        </div>
      </div>

      <StoreInput
        label="Nombre del titular (tal como figura en la tarjeta)"
        value={cardholderName}
        onChange={(e) => setCardholderName(e.target.value)}
        placeholder="JUAN PEREZ"
        size="md"
      />

      <div style={{ display: 'grid', gridTemplateColumns: '140px 1fr', gap: '12px' }}>
        <StoreSelect
          label="Tipo de documento"
          value={idType}
          onValueChange={setIdType}
          size="md"
          options={ID_TYPES}
        />
        <StoreInput
          label="Número de documento"
          value={idNumber}
          onChange={(e) => setIdNumber(e.target.value.replace(/\D/g, ''))}
          placeholder="12345678"
          inputMode="numeric"
          size="md"
        />
      </div>

      {installments.length > 1 && (
        <StoreSelect
          label="Cuotas"
          value={String(selectedInstallments)}
          onValueChange={(v) => setSelectedInstallments(Number(v))}
          size="md"
          options={installments.map((i) => ({ value: String(i.installments), label: i.recommended_message }))}
        />
      )}

      {localError && (
        <div style={{ padding: '10px 14px', background: 'var(--color-error-50)', border: '1px solid var(--color-error-200)', borderRadius: 'var(--radius-md)' }}>
          <span style={{ fontSize: '13px', color: 'var(--color-error-700)' }}>{localError}</span>
        </div>
      )}

      <StoreButton size="md" disabled={submitting} onClick={handlePay} style={{ width: '100%', justifyContent: 'center' }}>
        {submitting ? 'Procesando…' : 'Pagar con Mercado Pago'}
      </StoreButton>
    </div>
  );
}

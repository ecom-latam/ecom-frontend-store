'use client';

import { useEffect, useRef, useState } from 'react';
import styles from './page.module.scss';
import { Text, ColorPicker, useToast } from 'zoui';
import { StoreButton } from '@/components/ui/StoreButton';
import { StoreTextarea } from '@/components/ui/StoreTextarea';
import { apiClient } from '@/utils/api/client';
import { storeConfig } from '@/utils/api/storeConfig';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { fetchStoreConfigRequest } from '@/store/storeConfig/storeConfigSlice';

function getInitialHue(): number {
  if (typeof document === 'undefined') return 262;
  const style = getComputedStyle(document.documentElement);
  const brand500 = style.getPropertyValue('--color-brand-500').trim();
  const match = brand500.match(/hsl\((\d+)/);
  return match ? parseInt(match[1]) : 262;
}

// La paleta se escribe como CSS variables en documentElement para que el
// cambio de color sea instantaneo en toda la UI sin re-renderizar el arbol de
// React. Este componente es quien tiene el picker, asi que es el lugar natural
// para actualizar las vars mientras el vendedor arrastra, antes de confirmar
// el guardado via API.
function applyHueLive(hue: number) {
  const root = document.documentElement;
  const contrast = hue >= 45 && hue <= 75 ? '#000000' : '#ffffff';
  root.style.setProperty('--color-brand-50',       `hsl(${hue}, 95%, 97%)`);
  root.style.setProperty('--color-brand-100',      `hsl(${hue}, 90%, 93%)`);
  root.style.setProperty('--color-brand-200',      `hsl(${hue}, 85%, 86%)`);
  root.style.setProperty('--color-brand-300',      `hsl(${hue}, 80%, 75%)`);
  root.style.setProperty('--color-brand-400',      `hsl(${hue}, 75%, 62%)`);
  root.style.setProperty('--color-brand-500',      `hsl(${hue}, 72%, 50%)`);
  root.style.setProperty('--color-brand-600',      `hsl(${hue}, 75%, 42%)`);
  root.style.setProperty('--color-brand-700',      `hsl(${hue}, 80%, 34%)`);
  root.style.setProperty('--color-brand-contrast', contrast);
}

export default function ConfiguracionPage() {
  const { toast } = useToast();
  const dispatch = useAppDispatch();
  const { data: reduxConfig, loading: configLoading } = useAppSelector((s) => s.storeConfig);
  const initialized = useRef(false);

  const [hue, setHue] = useState<number>(getInitialHue);
  const [savingColor, setSavingColor] = useState(false);

  const [transferInfo, setTransferInfo] = useState('');
  const [savingTransfer, setSavingTransfer] = useState(false);
  const [loadingTransfer, setLoadingTransfer] = useState(true);

  useEffect(() => {
    dispatch(fetchStoreConfigRequest());
  }, [dispatch]);

  useEffect(() => {
    if (initialized.current || configLoading || reduxConfig === null) return;
    initialized.current = true;
    setTransferInfo(reduxConfig.transfer_info ?? '');
    setLoadingTransfer(false);
  }, [reduxConfig, configLoading]);

  function handleHueChange(newHue: number) {
    setHue(newHue);
    applyHueLive(newHue);
  }

  async function handleSaveColor() {
    setSavingColor(true);
    try {
      // EC-553: branding (brand_hue) se movio de ecom-store a ecom-page.
      await apiClient.patch('/api/page', { brand_hue: hue });
      toast({ message: 'Color de marca guardado', type: 'success' });
    } catch {
      toast({ message: 'No se pudo guardar el color', type: 'error' });
    } finally {
      setSavingColor(false);
    }
  }

  async function handleSaveTransfer() {
    setSavingTransfer(true);
    try {
      await storeConfig.updateTransferInfo(transferInfo);
      toast({ message: 'Datos de transferencia guardados', type: 'success' });
    } catch {
      toast({ message: 'No se pudo guardar', type: 'error' });
    } finally {
      setSavingTransfer(false);
    }
  }

  const sectionStyle = {
    background: 'var(--color-bg-surface)',
    border: '1px solid var(--color-border-default)',
    borderRadius: 'var(--radius-lg)',
    padding: '28px',
    maxWidth: '480px',
  };

  return (
    <main style={{ padding: '32px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <Text variant="heading-2" as="h1">Configuración</Text>

      {/* Color de marca */}
      <div style={sectionStyle}>
        <Text variant="heading-3" as="h2" style={{ marginBottom: '4px' }}>Color de marca</Text>
        <Text variant="body-sm" color="secondary" as="p" style={{ marginBottom: '28px' }}>
          El color elegido se aplica en toda la tienda para todos los visitantes.
        </Text>
        <div style={{ display: 'flex', alignItems: 'center', gap: '32px', flexWrap: 'wrap' }}>
          <ColorPicker
            hue={hue}
            sat={72}
            onHue={handleHueChange}
            size={160}
          />
          <button
            onClick={handleSaveColor}
            disabled={savingColor}
            style={{
              height: 'var(--control-height-md)',
              padding: '0 var(--control-padding-x-md)',
              borderRadius: 'var(--radius-full)',
              background: 'var(--color-brand-500)',
              color: 'var(--color-brand-contrast)',
              border: 'none',
              cursor: savingColor ? 'not-allowed' : 'pointer',
              opacity: savingColor ? 0.7 : 1,
              fontSize: 'var(--font-size-base)',
              fontWeight: 'var(--font-weight-medium)',
            }}
          >
            {savingColor ? 'Guardando…' : 'Guardar color'}
          </button>
        </div>
      </div>

      {/* Datos de transferencia */}
      <div style={sectionStyle}>
        <Text variant="heading-3" as="h2" style={{ marginBottom: '4px' }}>Datos para transferencia</Text>
        <Text variant="body-sm" color="secondary" as="p" style={{ marginBottom: '20px' }}>
          Se muestran al comprador en la página del pedido cuando elige pagar por transferencia.
        </Text>
        {loadingTransfer ? (
          <div className={styles.skeleton} style={{ background: 'var(--color-bg-subtle)' }} />
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <StoreTextarea
              label="Instrucciones de pago"
              value={transferInfo}
              onChange={(e) => setTransferInfo(e.target.value)}
              placeholder={"Banco: Banco Ejemplo\nCBU: 0000000000000000000000\nAlias: mi.alias\nTitular: Nombre Apellido\nCUIT: 20-12345678-9"}              data-testid="transfer-info-input"
            />
            <StoreButton
              size="md"
              onClick={handleSaveTransfer}
              disabled={savingTransfer}
              data-testid="transfer-info-save-btn"
            >
              {savingTransfer ? 'Guardando…' : 'Guardar'}
            </StoreButton>
          </div>
        )}
      </div>
    </main>
  );
}

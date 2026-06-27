'use client';

import { useEffect, useRef, useState } from 'react';
import { storeOptions as storeOptionsApi } from '@/utils/api';
import { triggerErrorModal } from '@/lib/errorModal';
import type { StoreOption, StoreOptionPayload } from '@/utils/api';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { fetchStoreOptionsRequest } from '@/store/storeOptions/storeOptionsSlice';
import { Modal, Drawer, Table, Text, Icon } from 'zoui';
import { StoreButton } from '@/components/ui/StoreButton';
import { StoreInput } from '@/components/ui/StoreInput';

// ─── Confirm Modal ────────────────────────────────────────────────────────────

interface ConfirmModalProps {
  title: string;
  message: string;
  confirmLabel: string;
  onConfirm: () => void;
  onCancel: () => void;
}

function ConfirmModal({ title, message, confirmLabel, onConfirm, onCancel }: ConfirmModalProps) {
  return (
    <Modal open size="sm" onClose={onCancel}>
      <Modal.Header>{title}</Modal.Header>
      <Modal.Body>
        <Text variant="body-sm" color="secondary" tag="p" style={{ lineHeight: 1.6 }}>{message}</Text>
      </Modal.Body>
      <Modal.Footer style={{ flexDirection: 'row', justifyContent: 'flex-end' }}>
        <StoreButton emphasis="outlined" size="md" onClick={onCancel}>Cancelar</StoreButton>
        <StoreButton
          size="md"
          onClick={onConfirm}
          data-testid="opt-confirm-btn"
          style={{ background: 'var(--color-error-500)', borderColor: 'var(--color-error-500)' }}
        >
          {confirmLabel}
        </StoreButton>
      </Modal.Footer>
    </Modal>
  );
}

// ─── Option Drawer ────────────────────────────────────────────────────────────

interface OptionDrawerProps {
  option: StoreOption | null;
  onClose: () => void;
  onSaved: () => void;
}

function OptionDrawer({ option, onClose, onSaved }: OptionDrawerProps) {
  const [name, setName] = useState(option?.name ?? '');
  const [values, setValues] = useState<string[]>(option?.values ?? []);
  const [valueInput, setValueInput] = useState('');
  const [loading, setLoading] = useState(false);

  function addValue() {
    const trimmed = valueInput.trim();
    if (!trimmed || values.includes(trimmed)) return;
    setValues(v => [...v, trimmed]);
    setValueInput('');
  }

  function removeValue(value: string) {
    setValues(v => v.filter(x => x !== value));
  }

  async function handleSubmit() {
    if (!name.trim()) {
      triggerErrorModal({ message: 'El nombre de la opción es requerido.', severity: 'info' });
      return;
    }
    if (values.length === 0) {
      triggerErrorModal({ message: 'Agregá al menos un valor.', severity: 'info' });
      return;
    }
    setLoading(true);
    try {
      const payload: StoreOptionPayload = { name: name.trim(), values };
      if (option) {
        await storeOptionsApi.update(option._id, payload);
      } else {
        await storeOptionsApi.create(payload);
      }
      onSaved();
    } catch {
      // errors shown via modal (axios interceptor)
    } finally {
      setLoading(false);
    }
  }

  return (
    <Drawer open side="right" size="md" onClose={onClose} label={option ? 'Editar opción' : 'Nueva opción'}>
      <Drawer.Header>{option ? 'Editar opción' : 'Nueva opción'}</Drawer.Header>
      <>
        <Drawer.Body style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <StoreInput
            label="Nombre *"
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="Ej: Talle, Color"
            fullWidth
            data-testid="opt-name-input"
          />

          <div>
            <StoreInput
              label="Valores *"
              value={valueInput}
              onChange={e => setValueInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addValue(); } }}
              placeholder="Ej: S, escribí y presioná Enter"
              fullWidth
              data-testid="opt-value-input"
            />
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '10px' }} data-testid="opt-values-list">
              {values.map(value => (
                <span
                  key={value}
                  data-testid="opt-value-chip"
                  style={{
                    display: 'flex', alignItems: 'center', gap: '4px',
                    padding: '4px 8px', borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--color-border-default)',
                    fontSize: '13px', color: 'var(--color-fg-secondary)',
                  }}
                >
                  {value}
                  <button
                    type="button"
                    onClick={() => removeValue(value)}
                    aria-label={`Eliminar ${value}`}
                    style={{ display: 'flex', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-fg-muted)', padding: 0 }}
                  >
                    <Icon name="x" size="xs" />
                  </button>
                </span>
              ))}
            </div>
          </div>
        </Drawer.Body>

        <Drawer.Footer style={{ flexDirection: 'row', justifyContent: 'flex-end' }}>
          <StoreButton type="button" emphasis="outlined" size="md" onClick={onClose}>Cancelar</StoreButton>
          <StoreButton size="md" disabled={loading} onClick={handleSubmit} data-testid="opt-submit-btn">
            {loading ? 'Guardando...' : option ? 'Guardar cambios' : 'Crear opción'}
          </StoreButton>
        </Drawer.Footer>
      </>
    </Drawer>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function GestionOpcionesPage() {
  const dispatch = useAppDispatch();
  const { list: reduxOptions, loading: reduxLoading } = useAppSelector((s) => s.storeOptions);
  const initialized = useRef(false);

  const [optionList, setOptionList] = useState<StoreOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editing, setEditing] = useState<StoreOption | null>(null);
  const [confirm, setConfirm] = useState<{ title: string; message: string; confirmLabel: string; onConfirm: () => void } | null>(null);

  useEffect(() => {
    dispatch(fetchStoreOptionsRequest());
  }, [dispatch]);

  useEffect(() => {
    if (reduxLoading || initialized.current) return;
    initialized.current = true;
    setOptionList(reduxOptions);
    setLoading(false);
  }, [reduxOptions, reduxLoading]);

  async function load() {
    setLoading(true);
    try {
      const { data } = await storeOptionsApi.list();
      setOptionList(data);
    } catch {
      // silent — table shows empty state
    } finally {
      setLoading(false);
    }
  }

  const filtered = optionList.filter(o => !search || o.name.toLowerCase().includes(search.toLowerCase()));

  function openCreate() { setEditing(null); setDrawerOpen(true); }
  function openEdit(option: StoreOption) { setEditing(option); setDrawerOpen(true); }
  function handleSaved() { setDrawerOpen(false); load(); }

  function handleDelete(option: StoreOption) {
    setConfirm({
      title: 'Eliminar opción',
      message: `¿Querés eliminar "${option.name}"? Esta acción no se puede deshacer.`,
      confirmLabel: 'Eliminar',
      onConfirm: async () => {
        setConfirm(null);
        try {
          await storeOptionsApi.delete(option._id);
          load();
        } catch {
          // errors shown via modal (axios interceptor)
        }
      },
    });
  }

  return (
    <main style={{ padding: '32px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <Text variant="heading-2" tag="h1">Opciones</Text>
        <StoreButton size="md" onClick={openCreate} data-testid="opt-new-btn">
          + Nueva opción
        </StoreButton>
      </div>

      <div style={{ marginBottom: '20px', width: 280 }}>
        <StoreInput
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Buscar por nombre..."
          size="sm"
          fullWidth
        />
      </div>

      <Table>
        <Table.Root compact>
          <Table.Head>
            <tr>
              <Table.Th>Nombre</Table.Th>
              <Table.Th>Valores</Table.Th>
              <Table.Th style={{ textAlign: 'center' }}>Acciones</Table.Th>
            </tr>
          </Table.Head>
          <Table.Body>
            {loading ? (
              <Table.Row>
                <Table.Td colSpan={3} style={{ textAlign: 'center', padding: '48px', color: 'var(--color-fg-muted)' }}>Cargando...</Table.Td>
              </Table.Row>
            ) : filtered.length === 0 ? (
              <Table.Row>
                <Table.Td colSpan={3} style={{ textAlign: 'center', padding: '48px', color: 'var(--color-fg-muted)' }}>
                  {search ? 'Sin resultados para la búsqueda.' : 'Todavía no hay opciones. ¡Creá la primera!'}
                </Table.Td>
              </Table.Row>
            ) : filtered.map(option => (
              <Table.Row key={option._id} data-testid={`opt-row-${option.name}`}>
                <Table.Td style={{ fontWeight: 500 }}>{option.name}</Table.Td>
                <Table.Td style={{ color: 'var(--color-fg-secondary)' }}>{option.values.join(', ')}</Table.Td>
                <Table.Td style={{ textAlign: 'center' }}>
                  <div style={{ display: 'flex', gap: '6px', justifyContent: 'center' }}>
                    <StoreButton size="md" onClick={() => openEdit(option)}>Editar</StoreButton>
                    <StoreButton emphasis="ghost" size="md" onClick={() => handleDelete(option)} style={{ color: 'var(--color-error-500)' }}>Eliminar</StoreButton>
                  </div>
                </Table.Td>
              </Table.Row>
            ))}
          </Table.Body>
        </Table.Root>
      </Table>

      {!loading && optionList.length > 0 && (
        <Text variant="caption" color="muted" tag="p" style={{ marginTop: '12px' }}>
          {optionList.length} opción{optionList.length !== 1 ? 'es' : ''}
        </Text>
      )}

      {drawerOpen && (
        <OptionDrawer option={editing} onClose={() => setDrawerOpen(false)} onSaved={handleSaved} />
      )}

      {confirm && (
        <ConfirmModal
          title={confirm.title}
          message={confirm.message}
          confirmLabel={confirm.confirmLabel}
          onConfirm={confirm.onConfirm}
          onCancel={() => setConfirm(null)}
        />
      )}
    </main>
  );
}

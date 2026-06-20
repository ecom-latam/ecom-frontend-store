import { Text, Badge, Icon } from 'zoui';
import type { Address } from '@/utils/api/addresses';
import { StoreButton } from '@/components/ui/StoreButton';

interface AddressCardProps {
  addr:           Address;
  deleting:       boolean;
  settingDefault: boolean;
  onEdit:         () => void;
  onDelete:       () => void;
  onSetDefault:   () => void;
}

export function AddressCard({ addr, deleting, settingDefault, onEdit, onDelete, onSetDefault }: AddressCardProps) {
  return (
    <div
      style={{
        background:    'var(--color-bg-default)',
        border:        addr.isDefault ? '2px solid var(--color-brand-500)' : '1px solid var(--color-border-default)',
        borderRadius:  'var(--radius-lg)',
        padding:       '20px',
        position:      'relative',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
        <Text variant="body-sm" weight="semibold" as="span">{addr.label}</Text>
        {addr.isDefault && <Badge tone="info" variant="pill" size="sm">Predeterminada</Badge>}
      </div>

      <Text variant="body-sm" color="muted" as="p">{addr.fullName} · {addr.phone}</Text>
      <Text variant="body-sm" color="muted" as="p">{addr.address}{addr.floor ? `, ${addr.floor}` : ''}</Text>
      <Text variant="body-sm" color="muted" as="p">{addr.city}, {addr.province}{addr.zip ? ` (${addr.zip})` : ''}</Text>

      <div style={{ display: 'flex', gap: '8px', marginTop: '16px', flexWrap: 'wrap' }}>
        <StoreButton emphasis="ghost" size="sm" onClick={onEdit} style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
          <Icon name="edit" size="sm" /> Editar
        </StoreButton>

        {!addr.isDefault && (
          <StoreButton emphasis="ghost" size="sm" disabled={settingDefault} onClick={onSetDefault} style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
            <Icon name="star" size="sm" />
            {settingDefault ? 'Guardando...' : 'Marcar predeterminada'}
          </StoreButton>
        )}

        <StoreButton emphasis="ghost" size="sm" disabled={deleting} onClick={onDelete} style={{ display: 'flex', alignItems: 'center', gap: '5px', color: 'var(--color-error-600)' }}>
          <Icon name="trash" size="sm" />
          {deleting ? 'Eliminando...' : 'Eliminar'}
        </StoreButton>
      </div>
    </div>
  );
}

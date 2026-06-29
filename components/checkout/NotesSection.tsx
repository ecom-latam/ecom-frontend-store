import { Text } from 'zoui';
import { StoreTextarea } from '@/components/ui/StoreTextarea';

interface NotesSectionProps {
  value:    string;
  onChange: (value: string) => void;
}

export function NotesSection({ value, onChange }: NotesSectionProps) {
  return (
    <section style={{ background: 'var(--color-bg-default)', border: '1px solid var(--color-border-default)', borderRadius: 'var(--radius-lg)', padding: '24px' }}>
      <Text variant="heading-3" style={{ marginBottom: '16px' }}>Notas del pedido (opcional)</Text>
      <StoreTextarea
        label="Notas"
        value={value}
        onChange={(e) => onChange(e.target.value.slice(0, 500))}
        placeholder="Instrucciones especiales, referencias de entrega..."
      />
    </section>
  );
}

import { Table, Badge } from 'zoui';

const STATS_MOCK = [
  { label: 'Pedidos hoy', value: '24', change: '+12%' },
  { label: 'Ingresos del mes', value: '$148.320', change: '+8%' },
  { label: 'Clientes nuevos', value: '37', change: '+5%' },
  { label: 'Productos activos', value: '142', change: '0%' },
];

const ORDERS_MOCK = [
  { id: '#0041', customer: 'Martina García', total: '$3.200', status: 'Pendiente' },
  { id: '#0040', customer: 'Lucas Romero', total: '$8.750', status: 'Enviado' },
  { id: '#0039', customer: 'Sofía Herrera', total: '$1.400', status: 'Entregado' },
  { id: '#0038', customer: 'Tomás Núñez', total: '$5.600', status: 'Pendiente' },
  { id: '#0037', customer: 'Valentina López', total: '$2.100', status: 'Cancelado' },
];

const STATUS_BADGE: Record<string, 'warning' | 'info' | 'success' | 'error'> = {
  Pendiente: 'warning',
  Enviado:   'info',
  Entregado: 'success',
  Cancelado: 'error',
};

export default function GestionPage() {
  return (
    <main style={{ padding: '32px', overflowY: 'auto' }}>
      <h1 style={{ fontSize: '22px', fontWeight: 700, color: 'var(--color-fg-primary)', marginBottom: '24px' }}>
        Resumen
      </h1>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '32px' }}>
        {STATS_MOCK.map((stat) => (
          <div key={stat.label} style={{
            background: 'var(--color-bg-surface)',
            border: '1px solid var(--color-border-default)',
            borderRadius: 'var(--radius-lg)',
            padding: '20px',
          }}>
            <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-fg-secondary)', marginBottom: '6px' }}>{stat.label}</p>
            <p style={{ fontSize: '24px', fontWeight: 700, color: 'var(--color-fg-primary)', marginBottom: '4px' }}>{stat.value}</p>
            <p style={{ fontSize: 'var(--font-size-xs)', color: stat.change.startsWith('+') ? 'var(--color-success-700)' : 'var(--color-fg-muted)' }}>
              {stat.change} vs mes anterior
            </p>
          </div>
        ))}
      </div>

      <div style={{ background: 'var(--color-bg-surface)', border: '1px solid var(--color-border-default)', borderRadius: 'var(--radius-lg)', overflow: 'hidden' }}>
        <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--color-border-default)' }}>
          <h2 style={{ fontSize: 'var(--font-size-lg)', fontWeight: 600, color: 'var(--color-fg-primary)' }}>Últimos pedidos</h2>
        </div>
        <Table style={{ border: 'none', borderRadius: 0 }}>
          <Table.Root>
            <Table.Head>
              <tr>
                {['Pedido', 'Cliente', 'Total', 'Estado'].map((col) => (
                  <Table.Th key={col}>{col}</Table.Th>
                ))}
              </tr>
            </Table.Head>
            <Table.Body>
              {ORDERS_MOCK.map((order) => (
                <Table.Row key={order.id}>
                  <Table.Td style={{ fontWeight: 500 }}>{order.id}</Table.Td>
                  <Table.Td>{order.customer}</Table.Td>
                  <Table.Td>{order.total}</Table.Td>
                  <Table.Td>
                    <Badge type={STATUS_BADGE[order.status]} shape="pill">
                      {order.status}
                    </Badge>
                  </Table.Td>
                </Table.Row>
              ))}
            </Table.Body>
          </Table.Root>
        </Table>
      </div>
    </main>
  );
}

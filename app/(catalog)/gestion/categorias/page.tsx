'use client';

import { useEffect, useState } from 'react';
import { isAxiosError } from 'axios';
import { categories as categoriesApi } from '@/utils/api';
import type { Category, CategoryPayload } from '@/utils/api';
import { Modal, Drawer, Table, Badge, Input, Select, Button } from 'zoui';

const STATUS_BADGE: Record<Category['status'], 'success' | 'neutral'> = {
  active:   'success',
  inactive: 'neutral',
};

const STATUS_LABELS: Record<Category['status'], string> = {
  active:   'Activa',
  inactive: 'Inactiva',
};

const MAX_DEPTH = 3;

// ─── Confirm Modal ────────────────────────────────────────────────────────────

interface ConfirmModalProps {
  title: string;
  message: string;
  confirmLabel: string;
  danger?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

function ConfirmModal({ title, message, confirmLabel, danger = false, onConfirm, onCancel }: ConfirmModalProps) {
  return (
    <Modal size="sm" onClose={onCancel}>
      <Modal.Header>{title}</Modal.Header>
      <Modal.Body>
        <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-fg-secondary)', lineHeight: 1.6 }}>{message}</p>
      </Modal.Body>
      <Modal.Footer style={{ flexDirection: 'row', justifyContent: 'flex-end' }}>
        <Button variant="outlined" shape="rounded" size="sm" onClick={onCancel}>Cancelar</Button>
        <Button
          variant="filled"
          shape="rounded"
          size="sm"
          onClick={onConfirm}
          style={danger ? { background: 'var(--color-error-600)', borderColor: 'var(--color-error-600)' } : undefined}
        >
          {confirmLabel}
        </Button>
      </Modal.Footer>
    </Modal>
  );
}

// ─── Depth map ────────────────────────────────────────────────────────────────

function buildDepthMap(categories: Category[]): Map<string, number> {
  const map = new Map<string, number>();
  const byId = new Map(categories.map(c => [c._id, c]));
  function depth(id: string): number {
    if (map.has(id)) return map.get(id)!;
    const cat = byId.get(id);
    const d = cat?.parentId ? depth(cat.parentId) + 1 : 0;
    map.set(id, d);
    return d;
  }
  categories.forEach(c => depth(c._id));
  return map;
}

// ─── Category Drawer ──────────────────────────────────────────────────────────

interface CategoryDrawerProps {
  category: Category | null;
  allCategories: Category[];
  depthMap: Map<string, number>;
  onClose: () => void;
  onSaved: () => void;
}

function CategoryDrawer({ category, allCategories, depthMap, onClose, onSaved }: CategoryDrawerProps) {
  const [name, setName] = useState(category?.name ?? '');
  const [parentId, setParentId] = useState<string>(category?.parentId ?? '');
  const [status, setStatus] = useState<Category['status']>(category?.status ?? 'active');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const candidates = allCategories.filter(
    c => c._id !== category?._id && c.status === 'active' && (depthMap.get(c._id) ?? 0) < MAX_DEPTH
  );

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const payload: CategoryPayload = {
        name: name.trim(),
        parentId: parentId || null,
        status,
      };
      if (category) {
        await categoriesApi.update(category._id, payload);
      } else {
        await categoriesApi.create(payload);
      }
      onSaved();
    } catch (err) {
      if (isAxiosError(err)) {
        const code = err.response?.data?.error;
        setError(
          code === 'SLUG_CONFLICT'      ? 'Ya existe una categoría con ese nombre.' :
          code === 'MAX_DEPTH_EXCEEDED' ? 'No se puede anidar más de 4 niveles.' :
          (code ?? 'Error al guardar la categoría.')
        );
      } else {
        setError('Error inesperado.');
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <Drawer side="right" size="md" onClose={onClose} label={category ? 'Editar categoría' : 'Nueva categoría'}>
      <Drawer.Header onClose={onClose}>{category ? 'Editar categoría' : 'Nueva categoría'}</Drawer.Header>
      <form onSubmit={handleSubmit} style={{ display: 'contents' }}>
        <Drawer.Body style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <Input
            label="Nombre *"
            required
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="Ej: Ropa de hombre"
            fullWidth
          />

          <Select
            label="Categoría padre"
            value={parentId}
            onChange={e => setParentId(e.target.value)}
            hint="Solo se muestran categorías que pueden recibir subcategorías (máximo 4 niveles)."
            fullWidth
          >
            <option value="">Sin categoría padre (raíz)</option>
            {candidates.map(c => (
              <option key={c._id} value={c._id}>{c.name}</option>
            ))}
          </Select>

          <Select
            label="Estado"
            value={status}
            onChange={e => setStatus(e.target.value as Category['status'])}
            fullWidth
          >
            <option value="active">Activa</option>
            <option value="inactive">Inactiva</option>
          </Select>

          {error && (
            <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-error-600)' }}>{error}</p>
          )}
        </Drawer.Body>

        <Drawer.Footer style={{ flexDirection: 'row', justifyContent: 'flex-end' }}>
          <Button type="button" variant="outlined" shape="rounded" size="sm" onClick={onClose}>Cancelar</Button>
          <Button type="submit" variant="filled" shape="rounded" size="sm" disabled={loading}>
            {loading ? 'Guardando...' : category ? 'Guardar cambios' : 'Crear categoría'}
          </Button>
        </Drawer.Footer>
      </form>
    </Drawer>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function GestionCategoriasPage() {
  const [categoryList, setCategoryList] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<Category['status'] | ''>('active');
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editing, setEditing] = useState<Category | null>(null);

  const [confirm, setConfirm] = useState<{
    title: string;
    message: string;
    confirmLabel: string;
    danger?: boolean;
    onConfirm: () => void;
  } | null>(null);

  async function load() {
    setLoading(true);
    try {
      const { data } = await categoriesApi.list();
      setCategoryList(data);
      const parentIds = new Set(data.map(c => c.parentId).filter(Boolean) as string[]);
      setCollapsed(parentIds);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  const parentMap = Object.fromEntries(categoryList.map(c => [c._id, c.name]));

  const filtered = categoryList.filter(c => {
    if (statusFilter && c.status !== statusFilter) return false;
    if (search && !c.name.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  function buildSorted(parentId: string | null, depth: number): { category: Category; depth: number }[] {
    return filtered
      .filter(c => (c.parentId ?? null) === parentId)
      .flatMap(c => [{ category: c, depth }, ...buildSorted(c._id, depth + 1)]);
  }
  const sorted = buildSorted(null, 0);

  const depthMap = buildDepthMap(categoryList);
  const childrenIds = new Set(sorted.map(({ category }) => category.parentId).filter(Boolean));

  function hasChildren(id: string) {
    return childrenIds.has(id);
  }

  function isVisible(category: Category): boolean {
    let parentId = category.parentId;
    while (parentId) {
      if (collapsed.has(parentId)) return false;
      parentId = categoryList.find(c => c._id === parentId)?.parentId ?? null;
    }
    return true;
  }

  function toggleCollapse(id: string) {
    setCollapsed(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  function openCreate() {
    setEditing(null);
    setDrawerOpen(true);
  }

  function openEdit(category: Category) {
    setEditing(category);
    setDrawerOpen(true);
  }

  function handleToggleStatus(category: Category) {
    const newStatus = category.status === 'active' ? 'inactive' : 'active';
    const categoryHasChildren = categoryList.some(c => c.parentId === category._id);

    const doToggle = async () => {
      setConfirm(null);
      try {
        await categoriesApi.update(category._id, { status: newStatus });
        load();
      } catch {
        // silent
      }
    };

    if (newStatus === 'inactive' && categoryHasChildren) {
      setConfirm({
        title: 'Desactivar categoría',
        message: `Al desactivar "${category.name}" todas las subcategorías que dependen de ella también serán desactivadas.`,
        confirmLabel: 'Desactivar',
        danger: false,
        onConfirm: doToggle,
      });
    } else {
      doToggle();
    }
  }

  function handleDelete(category: Category) {
    const categoryHasChildren = categoryList.some(c => c.parentId === category._id);
    setConfirm({
      title: 'Eliminar categoría',
      message: categoryHasChildren
        ? `¿Querés eliminar "${category.name}"? Todas las subcategorías que dependen de ella también serán eliminadas. Esta acción no se puede deshacer.`
        : `¿Querés eliminar "${category.name}"? Esta acción no se puede deshacer.`,
      confirmLabel: 'Eliminar',
      danger: true,
      onConfirm: async () => {
        setConfirm(null);
        try {
          await categoriesApi.delete(category._id);
          load();
        } catch {
          // silent
        }
      },
    });
  }

  function handleSaved() {
    setDrawerOpen(false);
    load();
  }

  const visibleRows = sorted.filter(({ category }) => isVisible(category));

  return (
    <main style={{ padding: '32px', overflowY: 'auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h1 style={{ fontSize: '22px', fontWeight: 700, color: 'var(--color-fg-primary)' }}>Categorías</h1>
        <Button variant="filled" shape="rounded" size="sm" onClick={openCreate}>
          + Nueva categoría
        </Button>
      </div>

      <div style={{ display: 'flex', gap: '12px', marginBottom: '20px' }}>
        <div style={{ width: '260px' }}>
          <Input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Buscar por nombre..."
            size="sm"
            fullWidth
          />
        </div>
        <div style={{ width: '160px' }}>
          <Select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value as Category['status'] | '')}
            size="sm"
            fullWidth
          >
            <option value="">Todas</option>
            <option value="active">Activas</option>
            <option value="inactive">Inactivas</option>
          </Select>
        </div>
      </div>

      <Table>
        <Table.Root compact style={{ tableLayout: 'fixed' }}>
          <colgroup>
            <col style={{ width: '40%' }} />
            <col style={{ width: '20%' }} />
            <col style={{ width: '13%' }} />
            <col style={{ width: '27%' }} />
          </colgroup>
          <Table.Head>
            <tr>
              <Table.Th>Nombre</Table.Th>
              <Table.Th style={{ textAlign: 'center' }}>Categoría padre</Table.Th>
              <Table.Th style={{ textAlign: 'center' }}>Estado</Table.Th>
              <Table.Th style={{ textAlign: 'center' }}>Acciones</Table.Th>
            </tr>
          </Table.Head>
          <Table.Body>
            {loading ? (
              <Table.Row>
                <Table.Td colSpan={4} style={{ textAlign: 'center', color: 'var(--color-fg-muted)' }}>
                  Cargando...
                </Table.Td>
              </Table.Row>
            ) : visibleRows.length === 0 ? (
              <Table.Row>
                <Table.Td colSpan={4} style={{ textAlign: 'center', color: 'var(--color-fg-muted)' }}>
                  {search || statusFilter !== 'active'
                    ? 'Sin resultados para los filtros aplicados.'
                    : 'Todavía no hay categorías. ¡Creá la primera!'}
                </Table.Td>
              </Table.Row>
            ) : visibleRows.map(({ category, depth }) => (
              <Table.Row key={category._id}>
                <Table.Td style={{ fontWeight: depth === 0 ? 500 : 400 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px', paddingLeft: `${depth * 20}px` }}>
                    {hasChildren(category._id) ? (
                      <Button
                        variant="ghost"
                        shape="square"
                        size="sm"
                        onClick={() => toggleCollapse(category._id)}
                        style={{ width: 20, height: 20, minWidth: 0, fontSize: '10px', color: 'var(--color-fg-muted)', flexShrink: 0 }}
                      >
                        {collapsed.has(category._id) ? '▶' : '▼'}
                      </Button>
                    ) : (
                      <span style={{ width: '20px', flexShrink: 0, display: 'inline-block' }} />
                    )}
                    {depth > 0 && (
                      <span style={{ color: 'var(--color-fg-muted)', fontSize: '15px', lineHeight: 1, flexShrink: 0 }}>↳</span>
                    )}
                    {category.name}
                  </div>
                </Table.Td>
                <Table.Td style={{ textAlign: 'center', color: 'var(--color-fg-secondary)' }}>
                  {category.parentId
                    ? (parentMap[category.parentId] ?? '—')
                    : <Badge type="neutral" shape="square">raíz</Badge>
                  }
                </Table.Td>
                <Table.Td style={{ textAlign: 'center' }}>
                  <Badge type={STATUS_BADGE[category.status]} shape="pill">
                    {STATUS_LABELS[category.status]}
                  </Badge>
                </Table.Td>
                <Table.Td>
                  <div style={{ display: 'flex', gap: '6px', justifyContent: 'center' }}>
                    <Button
                      variant="ghost"
                      shape="rounded"
                      size="sm"
                      onClick={() => handleToggleStatus(category)}
                      style={{
                        minWidth: '90px',
                        color: category.status === 'active'
                          ? 'var(--color-warning-700)'
                          : 'var(--color-success-700)',
                      }}
                    >
                      {category.status === 'active' ? 'Desactivar' : 'Activar'}
                    </Button>
                    <Button variant="ghost" shape="rounded" size="sm" onClick={() => openEdit(category)}>
                      Editar
                    </Button>
                    <Button
                      variant="ghost"
                      shape="rounded"
                      size="sm"
                      onClick={() => handleDelete(category)}
                      style={{ color: 'var(--color-error-600)' }}
                    >
                      Eliminar
                    </Button>
                  </div>
                </Table.Td>
              </Table.Row>
            ))}
          </Table.Body>
        </Table.Root>
      </Table>

      {!loading && categoryList.length > 0 && (
        <p style={{ marginTop: '12px', fontSize: 'var(--font-size-xs)', color: 'var(--color-fg-muted)' }}>
          {sorted.length} categoría{sorted.length !== 1 ? 's' : ''} · {categoryList.filter(c => c.status === 'active').length} activa{categoryList.filter(c => c.status === 'active').length !== 1 ? 's' : ''} · {categoryList.filter(c => c.status === 'inactive').length} inactiva{categoryList.filter(c => c.status === 'inactive').length !== 1 ? 's' : ''}
        </p>
      )}

      {drawerOpen && (
        <CategoryDrawer
          category={editing}
          allCategories={categoryList}
          depthMap={depthMap}
          onClose={() => setDrawerOpen(false)}
          onSaved={handleSaved}
        />
      )}

      {confirm && (
        <ConfirmModal
          title={confirm.title}
          message={confirm.message}
          confirmLabel={confirm.confirmLabel}
          danger={confirm.danger}
          onConfirm={confirm.onConfirm}
          onCancel={() => setConfirm(null)}
        />
      )}
    </main>
  );
}

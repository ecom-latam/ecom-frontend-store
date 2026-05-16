'use client';

import { useEffect, useState } from 'react';
import { isAxiosError } from 'axios';
import { categories as categoriesApi } from '@/utils/api';
import type { Category, CategoryPayload } from '@/utils/api';

const STATUS_BADGE: Record<Category['status'], string> = {
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
    <div className="modal-overlay" onClick={onCancel}>
      <div className="modal modal--sm" onClick={(e) => e.stopPropagation()}>
        <div className="modal__header">
          <h3 className="modal__title">{title}</h3>
        </div>
        <div className="modal__body">
          <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-fg-secondary)', lineHeight: 1.6 }}>{message}</p>
        </div>
        <div className="modal__footer" style={{ flexDirection: 'row', justifyContent: 'flex-end' }}>
          <button onClick={onCancel} className="btn btn--outlined btn--rounded btn--sm">Cancelar</button>
          <button
            onClick={onConfirm}
            className="btn btn--filled btn--rounded btn--sm"
            style={danger ? { background: 'var(--color-error-600)', borderColor: 'var(--color-error-600)' } : {}}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
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

interface DrawerProps {
  category: Category | null;
  allCategories: Category[];
  depthMap: Map<string, number>;
  onClose: () => void;
  onSaved: () => void;
}

function CategoryDrawer({ category, allCategories, depthMap, onClose, onSaved }: DrawerProps) {
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
    <div className="drawer-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <aside className="drawer drawer--right drawer--md" role="dialog" aria-label={category ? 'Editar categoría' : 'Nueva categoría'}>
        <div className="drawer__header">
          <h2 className="drawer__title">{category ? 'Editar categoría' : 'Nueva categoría'}</h2>
          <button onClick={onClose} className="btn btn--ghost btn--square btn--sm drawer__close" aria-label="Cerrar">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
          <div className="drawer__body" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div className="field field--outlined">
              <label className="field__label">Nombre *</label>
              <input
                required
                className="field__input"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="Ej: Ropa de hombre"
              />
            </div>

            <div className="field field--outlined">
              <label className="field__label">Categoría padre</label>
              <select
                className="field__input"
                value={parentId}
                onChange={e => setParentId(e.target.value)}
              >
                <option value="">Sin categoría padre (raíz)</option>
                {candidates.map(c => (
                  <option key={c._id} value={c._id}>{c.name}</option>
                ))}
              </select>
              <p className="field__hint">Solo se muestran categorías que pueden recibir subcategorías (máximo 4 niveles).</p>
            </div>

            <div className="field field--outlined">
              <label className="field__label">Estado</label>
              <select
                className="field__input"
                value={status}
                onChange={e => setStatus(e.target.value as Category['status'])}
              >
                <option value="active">Activa</option>
                <option value="inactive">Inactiva</option>
              </select>
            </div>

            {error && (
              <p className="field__hint field__hint--error">{error}</p>
            )}
          </div>

          <div className="drawer__footer" style={{ flexDirection: 'row', justifyContent: 'flex-end' }}>
            <button type="button" onClick={onClose} className="btn btn--outlined btn--rounded btn--sm">Cancelar</button>
            <button type="submit" disabled={loading} className="btn btn--filled btn--rounded btn--sm">
              {loading ? 'Guardando...' : category ? 'Guardar cambios' : 'Crear categoría'}
            </button>
          </div>
        </form>
      </aside>
    </div>
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
        <button onClick={openCreate} className="btn btn--filled btn--rounded btn--sm">
          + Nueva categoría
        </button>
      </div>

      <div style={{ display: 'flex', gap: '12px', marginBottom: '20px' }}>
        <div className="field field--outlined field--sm" style={{ width: '260px' }}>
          <input
            className="field__input"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Buscar por nombre..."
          />
        </div>
        <div className="field field--outlined field--sm" style={{ width: '160px' }}>
          <select
            className="field__input"
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value as Category['status'] | '')}
          >
            <option value="">Todas</option>
            <option value="active">Activas</option>
            <option value="inactive">Inactivas</option>
          </select>
        </div>
      </div>

      <div className="table-wrapper">
        <table className="table table--compact" style={{ tableLayout: 'fixed' }}>
          <colgroup>
            <col style={{ width: '40%' }} />
            <col style={{ width: '20%' }} />
            <col style={{ width: '13%' }} />
            <col style={{ width: '27%' }} />
          </colgroup>
          <thead className="table__head">
            <tr>
              <th className="table__th">Nombre</th>
              <th className="table__th" style={{ textAlign: 'center' }}>Categoría padre</th>
              <th className="table__th" style={{ textAlign: 'center' }}>Estado</th>
              <th className="table__th" style={{ textAlign: 'center' }}>Acciones</th>
            </tr>
          </thead>
          <tbody className="table__body">
            {loading ? (
              <tr className="table__row">
                <td className="table__td" colSpan={4} style={{ textAlign: 'center', color: 'var(--color-fg-muted)' }}>
                  Cargando...
                </td>
              </tr>
            ) : visibleRows.length === 0 ? (
              <tr className="table__row">
                <td className="table__td" colSpan={4} style={{ textAlign: 'center', color: 'var(--color-fg-muted)' }}>
                  {search || statusFilter !== 'active'
                    ? 'Sin resultados para los filtros aplicados.'
                    : 'Todavía no hay categorías. ¡Creá la primera!'}
                </td>
              </tr>
            ) : visibleRows.map(({ category, depth }) => (
              <tr key={category._id} className="table__row">
                <td className="table__td" style={{ fontWeight: depth === 0 ? 500 : 400 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px', paddingLeft: `${depth * 20}px` }}>
                    {hasChildren(category._id) ? (
                      <button
                        onClick={() => toggleCollapse(category._id)}
                        className="btn btn--ghost btn--square"
                        style={{ width: 20, height: 20, minWidth: 0, fontSize: '10px', color: 'var(--color-fg-muted)', flexShrink: 0 }}
                      >
                        {collapsed.has(category._id) ? '▶' : '▼'}
                      </button>
                    ) : (
                      <span style={{ width: '20px', flexShrink: 0, display: 'inline-block' }} />
                    )}
                    {depth > 0 && (
                      <span style={{ color: 'var(--color-fg-muted)', fontSize: '15px', lineHeight: 1, flexShrink: 0 }}>↳</span>
                    )}
                    {category.name}
                  </div>
                </td>
                <td className="table__td" style={{ textAlign: 'center', color: 'var(--color-fg-secondary)' }}>
                  {category.parentId
                    ? (parentMap[category.parentId] ?? '—')
                    : <span className="badge badge--square badge--neutral">raíz</span>
                  }
                </td>
                <td className="table__td" style={{ textAlign: 'center' }}>
                  <span className={`badge badge--pill badge--${STATUS_BADGE[category.status]}`}>
                    {STATUS_LABELS[category.status]}
                  </span>
                </td>
                <td className="table__td">
                  <div style={{ display: 'flex', gap: '6px', justifyContent: 'center' }}>
                    <button
                      onClick={() => handleToggleStatus(category)}
                      className="btn btn--sm btn--rounded btn--ghost"
                      style={{
                        minWidth: '90px',
                        color: category.status === 'active'
                          ? 'var(--color-warning-700)'
                          : 'var(--color-success-700)',
                      }}
                    >
                      {category.status === 'active' ? 'Desactivar' : 'Activar'}
                    </button>
                    <button onClick={() => openEdit(category)} className="btn btn--sm btn--rounded btn--ghost">
                      Editar
                    </button>
                    <button
                      onClick={() => handleDelete(category)}
                      className="btn btn--sm btn--rounded btn--ghost"
                      style={{ color: 'var(--color-error-600)' }}
                    >
                      Eliminar
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

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

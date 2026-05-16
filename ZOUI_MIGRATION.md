# Zoui Migration Plan — ecom-frontend-store

Audit de componentes que usan Tailwind / inline styles en lugar de clases de Zoui.
Ordenado por prioridad. Cada ítem es una PR independiente.

---

## Componentes a reemplazar

### Buttons — `.btn`

| Archivo | Qué hay | Zoui target |
|---|---|---|
| `app/not-found.tsx` | `<a>` con Tailwind filled gray | `.btn.btn--filled.btn--rounded.btn--md` |
| `app/error.tsx` | `<button>` con Tailwind filled gray | `.btn.btn--filled.btn--rounded.btn--md` |
| `app/(auth)/invitacion/[token]/page.tsx` | 2 botones filled gray | `.btn.btn--filled.btn--rounded.btn--md` |
| `app/(auth)/iniciar-sesion/verificar-mfa/page.tsx` | Submit filled gray | `.btn.btn--filled.btn--rounded.btn--md` |
| `components/catalog/CartPageContent.tsx` | Botón checkout + botones de cantidad (±) | `.btn.btn--filled` / `.btn.btn--outlined.btn--square.btn--sm` |
| `app/(catalog)/productos/ProductGrid.tsx` | Botón de búsqueda filled gray | `.btn.btn--filled.btn--rounded.btn--sm` |

### Inputs y selects — `.field`

| Archivo | Qué hay | Zoui target |
|---|---|---|
| `app/(auth)/invitacion/[token]/page.tsx` | 2 inputs (email, password) con Tailwind | `.field.field--outlined` |
| `app/(auth)/iniciar-sesion/verificar-mfa/page.tsx` | Input código MFA con Tailwind | `.field.field--outlined` |
| `app/(catalog)/productos/ProductGrid.tsx` | Input de búsqueda + select de orden | `.field.field--outlined` |
| `app/(catalog)/gestion/productos/page.tsx` | Múltiples inputs/selects con inline styles | `.field.field--outlined` |
| `app/(catalog)/gestion/categorias/page.tsx` | Múltiples inputs/selects con inline styles | `.field.field--outlined` |

### Tables — `.table`

| Archivo | Qué hay | Zoui target |
|---|---|---|
| `app/(catalog)/gestion/page.tsx` | `<table>` con `borderCollapse` inline | `.table-wrapper > .table` |
| `app/(catalog)/gestion/productos/page.tsx` | Tabla grande con todo inline | `.table-wrapper > .table.table--compact` |
| `app/(catalog)/gestion/categorias/page.tsx` | Tabla con `<colgroup>` inline | `.table-wrapper > .table` |

### Modals — `.modal`

| Archivo | Qué hay | Zoui target |
|---|---|---|
| `components/catalog/AddToCartModal.tsx` | Overlay + panel con Tailwind (`fixed inset-0 z-50`) | `.modal-overlay > .modal.modal--sm` |
| `app/(catalog)/gestion/productos/page.tsx` | `ConfirmModal` con inline styles | `.modal-overlay > .modal.modal--sm` |
| `app/(catalog)/gestion/categorias/page.tsx` | `ConfirmModal` con inline styles | `.modal-overlay > .modal.modal--sm` |

### Drawers — `.drawer`

| Archivo | Qué hay | Zoui target |
|---|---|---|
| `components/catalog/CartDrawer.tsx` | Overlay + panel `fixed right-0` con Tailwind | `.drawer-overlay > .drawer.drawer--right.drawer--md` |
| `app/(catalog)/gestion/productos/page.tsx` | `ProductModal` tipo drawer con inline styles | `.drawer-overlay > .drawer.drawer--right` |
| `app/(catalog)/gestion/categorias/page.tsx` | `CategoryModal` tipo drawer con inline styles | `.drawer-overlay > .drawer.drawer--right` |

### Sidebar — `.sidebar`

| Archivo | Qué hay | Zoui target |
|---|---|---|
| `components/gestion/GestionSidebar.tsx` | `<aside>` 100% inline styles | `.sidebar > .sidebar__nav > .sidebar__item` |

### Badges — `.badge`

| Archivo | Qué hay | Zoui target |
|---|---|---|
| `app/(catalog)/productos/ProductGrid.tsx` | Badge "sin stock" con Tailwind rojo | `.badge.badge--pill.badge--error` |
| `app/(catalog)/gestion/page.tsx` | Badges de estado de órdenes con inline styles | `.badge.badge--pill.badge--{success\|warning\|neutral}` |
| `app/(catalog)/gestion/productos/page.tsx` | Badge de estado de producto con inline styles | `.badge.badge--pill` |
| `app/(catalog)/gestion/categorias/page.tsx` | Badge "raíz" e indicador con inline styles | `.badge.badge--square.badge--neutral` |

---

## Plan de migración

### Fase 1 — Gestion (mayor deuda, todo inline styles)

**PR-1A: `GestionSidebar.tsx` → `.sidebar`**
- Reemplazar `<aside style={{...}}>` + nav items con clases Zoui.
- Nav items activos con `.sidebar__item--active` vía `pathname`.

**PR-1B: Tablas de gestion → `.table`**
- `gestion/page.tsx`, `gestion/productos/page.tsx`, `gestion/categorias/page.tsx`
- Reemplazar inline styles con `.table-wrapper > .table`.

**PR-1C: Modals/Drawers de gestion → `.modal` + `.drawer`**
- `gestion/productos/page.tsx`: `ConfirmModal` → `.modal`, `ProductModal` → `.drawer`.
- `gestion/categorias/page.tsx`: `ConfirmModal` → `.modal`, `CategoryModal` → `.drawer`.

**PR-1D: Inputs/selects de gestion → `.field`**
- Ambas páginas de gestion.

**PR-1E: Badges de gestion → `.badge`**
- `gestion/page.tsx`, `gestion/productos/page.tsx`, `gestion/categorias/page.tsx`.

### Fase 2 — Catalog

**PR-2A: `CartDrawer.tsx` → `.drawer`**
- La estructura ya tiene algo de Zoui (`.btn`). Solo migrar el overlay/panel.

**PR-2B: `AddToCartModal.tsx` → `.modal`**
- Reemplazar overlay Tailwind con `.modal-overlay > .modal.modal--sm`.

**PR-2C: `CartPageContent.tsx` + `ProductGrid.tsx` → `.btn` + `.field`**
- Botones de cantidad, checkout, búsqueda.
- Input de búsqueda y select de orden.

**PR-2D: Badge "sin stock" en `ProductGrid.tsx` → `.badge`**

### Fase 3 — Auth y utilidades

**PR-3A: Auth flows → `.field` + `.btn`**
- `invitacion/[token]/page.tsx`, `verificar-mfa/page.tsx`.

**PR-3B: `not-found.tsx` + `error.tsx` → `.btn`**
- 2 archivos, 1-2 botones cada uno.

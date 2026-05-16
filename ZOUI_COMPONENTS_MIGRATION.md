# Zoui React Components Migration — ecom-frontend-store

Migración de raw Zoui CSS classes + local `components/ui/` → importar directamente los React components de la librería `zoui`.

**Estimación total: ~12h** (distribuibles en 2–3 días de trabajo)

---

## Estado actual

| Qué | Estado |
|---|---|
| CSS de Zoui | `import './zoui.css'` local en `app/layout.tsx` |
| Componentes locales en `components/ui/` | 9 archivos (Button, Badge, Input, Select, EmptyState, Pagination, ProductCard, ProductGrid, ViewToggle) |
| Archivos que importan de `@/components/ui/` | 4 (iniciar-sesion, registro, productos/ProductGrid, AddToCartButton) |
| Archivos con raw Zoui CSS classes | ~14 (ver `ZOUI_MIGRATION.md` para el listado completo) |
| ToastProvider | No integrado |

---

## Fase 0 — Setup: npm link (0.5h)

Mientras Zoui no está publicado en npm, se usa `npm link` para desarrollar localmente.

```bash
# En el repo zoui:
cd C:/Users/Milton/Documents/GitHub/zoui
npm run build
npm link

# En este repo:
npm link zoui
```

Verificar que funciona:
```typescript
import { Button } from 'zoui'       // debe resolver
import 'zoui/styles'                 // debe resolver
```

> Repetir en ecom-frontend-store-manager.

---

## Fase 1 — CSS import (15 min)

**Archivo:** `app/layout.tsx`

```diff
- import './zoui.css'
+ import 'zoui/styles'
```

La línea `import './globals.css'` se mantiene para estilos propios del proyecto.

---

## Fase 2 — ToastProvider en root layout (30 min)

**Archivo:** `app/layout.tsx`

```tsx
import { ToastProvider } from 'zoui'

export default async function RootLayout({ children }) {
  return (
    <html lang="es">
      <body>
        <ToastProvider>
          <CartProvider>
            {children}
          </CartProvider>
        </ToastProvider>
      </body>
    </html>
  )
}
```

`ToastProvider` ya tiene `'use client'` internamente. No hace falta marcarlo aquí.

---

## Fase 3 — Eliminar `components/ui/` local y actualizar imports (2h)

### 3A — Borrar los 9 archivos locales

```
components/ui/Button.tsx
components/ui/Badge.tsx
components/ui/Input.tsx
components/ui/Select.tsx
components/ui/EmptyState.tsx
components/ui/Pagination.tsx
components/ui/ProductCard.tsx
components/ui/ProductGrid.tsx
components/ui/ViewToggle.tsx
```

### 3B — Actualizar los 4 archivos que importan de `@/components/ui/`

| Archivo | Componentes importados | Notas |
|---|---|---|
| `app/(auth)/iniciar-sesion/page.tsx` | Button, Input | Props compatibles |
| `app/(auth)/registro/page.tsx` | Button, Input | Props compatibles |
| `app/(catalog)/productos/ProductGrid.tsx` | Button, Badge, Input, Select, EmptyState, Pagination, ViewToggle | El mayor — ver nota |
| `components/catalog/AddToCartButton.tsx` | Button | Trivial |

**Cambio de import:**
```diff
- import { Button } from '@/components/ui/Button'
+ import { Button } from 'zoui'
```

**Nota sobre ProductGrid.tsx:** Este archivo ya fue parcialmente migrado en el PR `chore/zoui-migration`. Verificar qué quedó con imports de `@/components/ui/` antes de tocar.

### 3C — ProductCard y ProductGrid: wiring de Next.js

`ProductCard` acepta `as` y `ImageComponent` para ser framework-agnostic:

```tsx
import Link from 'next/link'
import Image from 'next/image'
import { ProductCard } from 'zoui'

<ProductCard
  as={Link}
  href="/productos/slug"
  ImageComponent={Image}
  name="Remera básica"
  price="$3.000"
/>
```

Sin estos props, usa `<a>` e `<img>` nativos.

---

## Fase 4 — Reemplazar raw CSS classes con React components (8h)

Ver `ZOUI_MIGRATION.md` para el listado completo de archivos y qué cambiar en cada uno. La lógica es: en lugar de escribir el HTML con las clases Zoui manualmente, usar el componente React equivalente.

### Mapping rápido

| Raw class | React component |
|---|---|
| `<button className="btn btn--filled btn--rounded btn--md">` | `<Button variant="filled" shape="rounded" size="md">` |
| `<div className="field field--outlined">...<input>` | `<Input variant="outlined" label="..." />` |
| `<div className="field field--outlined">...<select>` | `<Select variant="outlined" label="..." />` |
| `<span className="badge badge--pill badge--success">` | `<Badge type="success" shape="pill">` |
| `.modal-overlay > .modal.modal--sm` | `<Modal size="sm" onClose={...}>` |
| `.drawer-overlay > .drawer.drawer--right.drawer--md` | `<Drawer side="right" size="md" onClose={...}>` |
| `.table-wrapper > .table` | `<Table><Table.Root>...` |
| `.sidebar > .sidebar__nav > .sidebar__item` | `<Sidebar><Sidebar.Nav><Sidebar.Item>` |
| `useToast()` + manual DOM | `const { toast } = useToast()` de zoui |

### Prioridad de archivos

**Alta (rutas de uso frecuente):**
1. `components/gestion/GestionSidebar.tsx` — Sidebar completo
2. `app/(catalog)/gestion/productos/page.tsx` — Table, Modal, Drawer, Field, Badge
3. `app/(catalog)/gestion/categorias/page.tsx` — Table, Drawer, Modal, Field, Badge
4. `app/(catalog)/gestion/page.tsx` — Table, Badge

**Media:**
5. `components/catalog/CartDrawer.tsx` — Drawer
6. `components/catalog/AddToCartModal.tsx` — Modal
7. `components/catalog/CartPageContent.tsx` — Button

**Baja:**
8. `app/(auth)/invitacion/[token]/page.tsx` — Input, Button
9. `app/(auth)/iniciar-sesion/verificar-mfa/page.tsx` — Input, Button
10. `app/not-found.tsx` — Button
11. `app/error.tsx` — Button

---

## Fase 5 — Navbar (1h)

`components/catalog/CatalogNavbar.tsx` (o equivalente): migrar a `<Navbar>` compound component si aún usa HTML manual.

```tsx
import { Navbar } from 'zoui'
import Link from 'next/link'

<Navbar variant="default">
  <Navbar.Logo as={Link} href="/">Mi Tienda</Navbar.Logo>
  <Navbar.Links>
    <Navbar.Link as={Link} href="/productos">Productos</Navbar.Link>
  </Navbar.Links>
  <Navbar.Actions>
    <Navbar.Cart count={cartCount} onClick={openCart} />
  </Navbar.Actions>
</Navbar>
```

---

## Checklist de cierre

- [ ] `npm link zoui` funcionando localmente
- [ ] `import 'zoui/styles'` en layout, sin `./zoui.css`
- [ ] `<ToastProvider>` en root layout
- [ ] `components/ui/` eliminado
- [ ] 0 imports de `@/components/ui/` en el repo
- [ ] GestionSidebar usando `<Sidebar>`
- [ ] Tablas de gestion usando `<Table>`
- [ ] CartDrawer usando `<Drawer>`
- [ ] AddToCartModal usando `<Modal>`
- [ ] ProductCard con `as={Link}` y `ImageComponent={Image}`
- [ ] `useToast()` de zoui reemplazando cualquier toast manual

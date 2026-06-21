export type ErrorSeverity = 'info' | 'warning' | 'alert';

export interface ErrorDefinition {
  message: string;
  detail?: string;
  severity: ErrorSeverity;
  action?: { label: string; href?: string; retry?: boolean };
}

const errors: Record<string, ErrorDefinition> = {
  // ── Autenticación ─────────────────────────────────────────────────────────
  'MS01-ERR001': { message: 'Tu sesión expiró', detail: 'Iniciá sesión para continuar.', severity: 'warning', action: { label: 'Iniciar sesión', href: '/iniciar-sesion' } },
  'MS01-ERR003': { message: 'Tu sesión no es válida', severity: 'warning', action: { label: 'Iniciar sesión', href: '/iniciar-sesion' } },
  'MS01-ERR004': { message: 'Email o contraseña incorrectos', severity: 'alert' },
  'MS01-ERR005': { message: 'Cuenta bloqueada', detail: 'Contactá al soporte de la tienda.', severity: 'alert' },
  'MS01-ERR012': { message: 'Ya existe una cuenta con ese email', severity: 'info', action: { label: 'Iniciar sesión', href: '/iniciar-sesion' } },

  // ── Órdenes (MS04) ────────────────────────────────────────────────────────
  'MS04-ERR003': { message: 'No podemos verificar tu identidad ahora', detail: 'Intentá de nuevo en unos segundos.', severity: 'warning', action: { label: 'Reintentar', retry: true } },
  'MS04-ERR010': { message: 'Faltan datos para completar el pedido', severity: 'info' },
  'MS04-ERR011': { message: 'Método de pago no disponible', severity: 'info' },
  'MS04-ERR012': { message: 'Opción de envío no válida', severity: 'info' },
  'MS04-ERR013': { message: 'Faltan tus datos de envío', detail: 'Completá tu nombre y teléfono.', severity: 'info' },
  'MS04-ERR014': { message: 'Faltan datos de entrega', detail: 'Completá dirección, ciudad y provincia.', severity: 'info' },
  'MS04-ERR015': { message: 'No se pudo procesar tu pedido', detail: 'Verificá el stock disponible e intentá de nuevo.', severity: 'alert', action: { label: 'Volver al catálogo', href: '/' } },
  'MS04-ERR016': { message: 'El servicio no está disponible en este momento', detail: 'Intentá de nuevo en unos minutos.', severity: 'warning', action: { label: 'Reintentar', retry: true } },
  'MS04-ERR020': { message: 'No encontramos ese pedido', severity: 'info' },
  'MS04-ERR021': { message: 'Esta acción solo aplica a pedidos por transferencia', severity: 'info' },
  'MS04-ERR022': { message: 'El pago de este pedido ya fue notificado', severity: 'info' },
  'MS04-ERR023': { message: 'El pago ya fue confirmado', severity: 'info' },
  'MS04-ERR024': { message: 'No podés modificar este pedido ahora', severity: 'warning' },
  'MS04-ERR028': { message: 'El pedido ya está cancelado', severity: 'info' },
  'MS04-ERR090': { message: 'Ocurrió un error con tu pedido', detail: 'Si el problema persiste, contactá a la tienda.', severity: 'alert', action: { label: 'Reintentar', retry: true } },

  // ── Catálogo — Stock (MS03) ───────────────────────────────────────────────
  'MS03-ERR001': { message: 'Sin stock disponible', detail: 'Ese producto ya no tiene unidades disponibles.', severity: 'info', action: { label: 'Ver catálogo', href: '/' } },

  // ── Catálogo — Categorías (MS03) ──────────────────────────────────────────
  'MS03-ERR013': { message: 'Ya existe una categoría con ese nombre', severity: 'info' },
  'MS03-ERR014': { message: 'No se puede anidar más de 4 niveles', severity: 'info' },
  'MS03-ERR016': { message: 'Llegaste al límite de categorías de tu plan', detail: 'Mejorá tu plan para crear más categorías.', severity: 'info' },

  // ── Catálogo — Productos (MS03) ───────────────────────────────────────────
  'MS03-ERR011': { message: 'El nombre del producto es requerido', severity: 'info' },
  'MS03-ERR021': { message: 'El precio ingresado no es válido', severity: 'info' },
  'MS03-ERR022': { message: 'Ya existe un producto con ese nombre', severity: 'info' },
  'MS03-ERR023': { message: 'Llegaste al límite de productos de tu plan', detail: 'Mejorá tu plan para crear más productos.', severity: 'info' },

  // ── Catálogo — Variantes (MS03) ───────────────────────────────────────────
  'MS03-ERR060': { message: 'No encontramos esa variante', severity: 'info' },
  'MS03-ERR061': { message: 'Las opciones seleccionadas no son válidas', severity: 'info' },
  'MS03-ERR062': { message: 'Una de las opciones seleccionadas ya no existe', severity: 'info' },
  'MS03-ERR063': { message: 'Llegaste al límite de variantes de tu plan', detail: 'Mejorá tu plan o elegí menos opciones para generar menos combinaciones.', severity: 'info' },

  // ── Config de tienda (MS05) ───────────────────────────────────────────────
  'MS05-ERR010': { message: 'La tienda no está configurada', severity: 'warning', action: { label: 'Reintentar', retry: true } },
  'MS05-ERR090': { message: 'Error al cargar la tienda', severity: 'alert', action: { label: 'Reintentar', retry: true } },
};

const FALLBACK: ErrorDefinition = {
  message: 'Algo salió mal',
  detail: 'Si el problema persiste, contactá a la tienda.',
  severity: 'alert',
  action: { label: 'Reintentar', retry: true },
};

export function getErrorDefinition(code: string): ErrorDefinition {
  return errors[code] ?? FALLBACK;
}

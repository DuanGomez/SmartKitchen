import { HttpErrorResponse, HttpInterceptorFn, HttpRequest, HttpResponse } from '@angular/common/http';
import { catchError, delay, dematerialize, from, map, materialize, throwError } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Estacion, Rol } from '../models/models';
import { DEMO_DB_VERSION, DbItem, DbPedido, DbProducto, DemoDb, createDemoDb } from './demo-data';

/**
 * Backend simulado para el modo demo (GitHub Pages). Replica la lógica de los servicios
 * Spring Boot (PedidoService, FacturaService, MesaService…) con datos en localStorage.
 * Solo se registra cuando `environment.demo` es true.
 */

const STORAGE_KEY = 'sk_demo_db';
const LATENCY_MS = 200;
const BLOQUEO_MS = 2 * 60 * 1000; // igual que BloqueoItemScheduler

class ApiError extends Error {
  constructor(public status: number, message: string) { super(message); }
}
const badRequest = (m: string) => new ApiError(400, m);   // IllegalArgumentException
const conflict = (m: string) => new ApiError(409, m);     // IllegalStateException

let cache: DemoDb | null = null;

function db(): DemoDb {
  if (cache) return cache;
  try {
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? 'null');
    if (stored?.version === DEMO_DB_VERSION) return (cache = stored as DemoDb);
  } catch { /* datos corruptos: se regeneran */ }
  cache = createDemoDb();
  save();
  return cache;
}

function save(): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(cache));
  } catch {
    throw new ApiError(507, 'El almacenamiento del navegador está lleno. Elimina algunas imágenes.');
  }
}

const nextId = (table: string) => (db().seq[table] = (db().seq[table] ?? 0) + 1);

// ─── Mapeos a los DTO del backend ───────────────────────────────────────────

const categoria = (id: number) => db().categorias.find((c) => c.id === id)!;
const usuario = (id: number | null) => db().usuarios.find((u) => u.id === id);

const productoDto = (p: DbProducto) => {
  const c = categoria(p.categoriaId);
  return { ...p, categoriaNombre: c.nombre, estacion: c.estacion };
};

const bloqueado = (i: DbItem) => i.estado !== 'PENDIENTE' && !!i.fechaEnvio && Date.now() - Date.parse(i.fechaEnvio) >= BLOQUEO_MS;

const itemDto = (i: DbItem) => {
  const p = db().productos.find((x) => x.id === i.productoId)!;
  return {
    id: i.id, productoId: p.id, productoNombre: p.nombre, productoImagen: p.imagen,
    estacion: categoria(p.categoriaId).estacion, cantidad: i.cantidad, observacion: i.observacion,
    precioUnitario: i.precioUnitario, subtotal: i.precioUnitario * i.cantidad, estado: i.estado,
    fechaEnvio: i.fechaEnvio, bloqueado: bloqueado(i),
  };
};

const itemsDe = (pedidoId: number) => db().items.filter((i) => i.pedidoId === pedidoId);
const totalDe = (pedidoId: number) => itemsDe(pedidoId).reduce((s, i) => s + i.precioUnitario * i.cantidad, 0);

const pedidoDto = (p: DbPedido) => {
  const mesa = db().mesas.find((m) => m.id === p.mesaId)!;
  return {
    id: p.id, mesaId: mesa.id, mesaNumero: mesa.numero, meseroId: p.meseroId, meseroNombre: usuario(p.meseroId)?.nombre ?? '',
    estado: p.estado, fechaCreacion: p.fechaCreacion, total: totalDe(p.id), items: itemsDe(p.id).map(itemDto),
  };
};

const mesaDto = (m: DemoDb['mesas'][number]) => ({ ...m, meseroNombre: usuario(m.meseroId)?.nombre ?? null });

const facturaDto = (f: DemoDb['facturas'][number]) => {
  const p = pedidoDto(db().pedidos.find((x) => x.id === f.pedidoId)!);
  return { ...f, mesaNumero: p.mesaNumero, meseroNombre: p.meseroNombre, items: p.items };
};

function findPedido(id: number): DbPedido {
  const p = db().pedidos.find((x) => x.id === id);
  if (!p) throw badRequest(`Pedido no encontrado: ${id}`);
  return p;
}
function assertAbierto(p: DbPedido) {
  if (p.estado !== 'ABIERTO') throw conflict('El pedido no está abierto');
}
function findUsuario(id: number, what = 'Usuario') {
  const u = usuario(id);
  if (!u) throw badRequest(`${what} no encontrado: ${id}`);
  return u;
}
function findMesa(id: number) {
  const m = db().mesas.find((x) => x.id === id);
  if (!m) throw badRequest(`Mesa no encontrada: ${id}`);
  return m;
}
const estacionDe = (i: DbItem): Estacion => categoria(db().productos.find((p) => p.id === i.productoId)!.categoriaId).estacion;

function cardsEstacion(estacion: Estacion) {
  const items = db().items
    .filter((i) => (i.estado === 'ENVIADO' || i.estado === 'LISTO') && estacionDe(i) === estacion)
    .sort((a, b) => (a.fechaEnvio ?? '').localeCompare(b.fechaEnvio ?? ''));
  const porPedido = new Map<number, DbItem[]>();
  items.forEach((i) => porPedido.set(i.pedidoId, [...(porPedido.get(i.pedidoId) ?? []), i]));
  return [...porPedido.entries()]
    .map(([pedidoId, list]) => {
      const p = pedidoDto(findPedido(pedidoId));
      return {
        pedidoId, mesaNumero: p.mesaNumero, meseroNombre: p.meseroNombre, estacion, fechaEnvio: list[0].fechaEnvio,
        items: list.map((i) => ({
          itemId: i.id, productoNombre: db().productos.find((x) => x.id === i.productoId)!.nombre,
          cantidad: i.cantidad, observacion: i.observacion, estado: i.estado,
        })),
      };
    })
    // Cuando todos los items de la card están LISTO, la card desaparece.
    .filter((c) => c.items.some((i) => i.estado === 'ENVIADO'));
}

const dayRange = (d: Date) => [new Date(d.getFullYear(), d.getMonth(), d.getDate()), new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59, 999)];

/** Reduce la foto (máx. 800 px, JPEG) para que quepa en localStorage. */
function compressImage(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      const scale = Math.min(1, 800 / Math.max(img.width, img.height));
      const canvas = document.createElement('canvas');
      canvas.width = Math.round(img.width * scale);
      canvas.height = Math.round(img.height * scale);
      const ctx = canvas.getContext('2d')!;
      ctx.fillStyle = '#fff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      URL.revokeObjectURL(url);
      resolve(canvas.toDataURL('image/jpeg', 0.82));
    };
    img.onerror = () => { URL.revokeObjectURL(url); reject(badRequest('No se pudo leer la imagen')); };
    img.src = url;
  });
}

async function productoFromForm(body: unknown) {
  if (!(body instanceof FormData)) throw badRequest('Se esperaba multipart/form-data');
  const data = body.get('data');
  const req = JSON.parse(data instanceof Blob ? await data.text() : String(data ?? '{}'));
  if (!req.nombre?.trim()) throw new ApiError(400, 'El nombre es obligatorio');
  if (!(Number(req.precio) > 0)) throw new ApiError(400, 'El precio debe ser mayor a cero');
  if (!db().categorias.some((c) => c.id === Number(req.categoriaId))) throw badRequest(`Categoría no encontrada: ${req.categoriaId}`);
  const imagen = body.get('imagen');
  return {
    req: { nombre: req.nombre.trim(), precio: Number(req.precio), descripcion: req.descripcion ?? '', categoriaId: Number(req.categoriaId), activo: req.activo !== false },
    imagen: imagen instanceof File && imagen.size > 0 ? await compressImage(imagen) : null,
  };
}

// ─── Rutas ──────────────────────────────────────────────────────────────────

type Ctx = { body: any; params: URLSearchParams; id: number; id2: number; user: () => DemoDb['usuarios'][number] };
type Handler = (ctx: Ctx) => unknown | Promise<unknown>;
const routes: [string, RegExp, Handler, Rol[]?][] = [];
const route = (method: string, pattern: string, handler: Handler, roles?: Rol[]) =>
  routes.push([method, new RegExp(`^${pattern.replace(/:\w+/g, '(\\d+)')}$`), handler, roles]);

// Auth
route('POST', 'auth/login', ({ body }) => {
  const u = db().usuarios.find((x) => x.username === String(body?.username ?? '').trim());
  if (!u || !u.activo || u.password !== body?.password) throw new ApiError(401, 'Credenciales inválidas');
  return { token: `demo.${u.id}`, id: u.id, nombre: u.nombre, username: u.username, rol: u.rol };
});

// Usuarios (solo ADMIN)
const usuarioDto = ({ password, ...u }: DemoDb['usuarios'][number]) => u;
route('GET', 'usuarios', () => db().usuarios.map(usuarioDto), ['ADMIN']);
route('POST', 'usuarios', ({ body }) => {
  if (!body?.nombre?.trim() || !body?.username?.trim() || !body?.rol) throw new ApiError(400, 'Datos inválidos');
  if (!body.password || body.password.length < 6) throw new ApiError(400, 'La contraseña debe tener al menos 6 caracteres');
  if (db().usuarios.some((u) => u.username === body.username.trim())) throw badRequest(`El username ya existe: ${body.username}`);
  const u = { id: nextId('usuarios'), nombre: body.nombre.trim(), username: body.username.trim(), password: body.password, rol: body.rol, activo: body.activo !== false };
  db().usuarios.push(u);
  save();
  return usuarioDto(u);
}, ['ADMIN']);
route('PUT', 'usuarios/:id', ({ id, body }) => {
  const u = findUsuario(id);
  Object.assign(u, { nombre: body.nombre, rol: body.rol, activo: body.activo !== false });
  if (body.password?.trim()) u.password = body.password;
  save();
  return usuarioDto(u);
}, ['ADMIN']);
route('DELETE', 'usuarios/:id', ({ id, user }) => {
  const u = findUsuario(id);
  if (user().id === id) throw conflict('No puedes eliminar tu propio usuario');
  if (db().mesas.some((m) => m.meseroId === id)) throw conflict('El usuario tiene mesas asignadas');
  if (db().pedidos.some((p) => p.meseroId === id)) u.activo = false;
  else db().usuarios = db().usuarios.filter((x) => x.id !== id);
  save();
  return null;
}, ['ADMIN']);

// Categorías
route('GET', 'categorias', () => db().categorias.filter((c) => c.activo));
route('GET', 'categorias/todas', () => db().categorias, ['ADMIN']);
route('POST', 'categorias', ({ body }) => {
  if (!body?.nombre?.trim() || !body?.estacion) throw new ApiError(400, 'Datos inválidos');
  if (db().categorias.some((c) => c.nombre.toLowerCase() === body.nombre.trim().toLowerCase())) throw badRequest(`Categoría ya existe: ${body.nombre}`);
  const c = { id: nextId('categorias'), nombre: body.nombre.trim(), descripcion: body.descripcion ?? '', estacion: body.estacion, activo: body.activo !== false };
  db().categorias.push(c);
  save();
  return c;
}, ['ADMIN']);
route('PUT', 'categorias/:id', ({ id, body }) => {
  const c = db().categorias.find((x) => x.id === id);
  if (!c) throw badRequest(`Categoría no encontrada: ${id}`);
  Object.assign(c, { nombre: body.nombre, descripcion: body.descripcion ?? '', estacion: body.estacion, activo: body.activo !== false });
  save();
  return c;
}, ['ADMIN']);
route('DELETE', 'categorias/:id', ({ id }) => {
  if (!db().categorias.some((c) => c.id === id)) throw badRequest(`Categoría no encontrada: ${id}`);
  if (db().productos.some((p) => p.categoriaId === id)) throw conflict('La categoría tiene productos: muévelos o desactívala en lugar de eliminarla');
  db().categorias = db().categorias.filter((c) => c.id !== id);
  save();
  return null;
}, ['ADMIN']);

// Productos
route('GET', 'productos', () => db().productos.filter((p) => p.activo).map(productoDto));
route('GET', 'productos/todos', () => db().productos.map(productoDto), ['ADMIN']);
route('GET', 'productos/categoria/:id', ({ id }) => db().productos.filter((p) => p.activo && p.categoriaId === id).map(productoDto));
route('GET', 'productos/buscar', ({ params }) => {
  const q = (params.get('q') ?? '').toLowerCase();
  return db().productos.filter((p) => p.activo && (p.nombre.toLowerCase().includes(q) || p.descripcion.toLowerCase().includes(q))).map(productoDto);
});
route('POST', 'productos', async ({ body }) => {
  const { req, imagen } = await productoFromForm(body);
  const p = { id: nextId('productos'), ...req, imagen };
  db().productos.push(p);
  save();
  return productoDto(p);
}, ['ADMIN']);
route('PUT', 'productos/:id', async ({ id, body }) => {
  const p = db().productos.find((x) => x.id === id);
  if (!p) throw badRequest(`Producto no encontrado: ${id}`);
  const { req, imagen } = await productoFromForm(body);
  Object.assign(p, req, imagen ? { imagen } : {});
  save();
  return productoDto(p);
}, ['ADMIN']);
route('DELETE', 'productos/:id', ({ id }) => {
  const p = db().productos.find((x) => x.id === id);
  if (!p) throw badRequest(`Producto no encontrado: ${id}`);
  // Si ya se vendió se desactiva, para no romper el historial de facturas.
  if (db().items.some((i) => i.productoId === id)) p.activo = false;
  else db().productos = db().productos.filter((x) => x.id !== id);
  save();
  return null;
}, ['ADMIN']);

// Mesas
route('GET', 'mesas', () => [...db().mesas].sort((a, b) => a.numero - b.numero).map(mesaDto));
route('GET', 'mesas/disponibles', () => db().mesas.filter((m) => m.estado === 'DISPONIBLE').map(mesaDto));
route('POST', 'mesas/:id/ocupar', ({ id, body }) => {
  const m = findMesa(id);
  if (m.estado === 'OCUPADA') throw conflict('La mesa ya está ocupada');
  findUsuario(Number(body?.meseroId), 'Mesero');
  Object.assign(m, { estado: 'OCUPADA', meseroId: Number(body.meseroId) });
  save();
  return mesaDto(m);
});
route('POST', 'mesas/:id/liberar', ({ id }) => {
  const m = Object.assign(findMesa(id), { estado: 'DISPONIBLE', meseroId: null });
  save();
  return mesaDto(m);
});
route('PATCH', 'mesas/:id/mesero', ({ id, body }) => {
  findUsuario(Number(body?.meseroId), 'Mesero');
  const m = Object.assign(findMesa(id), { meseroId: Number(body.meseroId) });
  save();
  return mesaDto(m);
});

// Pedidos
route('GET', 'pedidos', () => db().pedidos.filter((p) => p.estado === 'ABIERTO')
  .sort((a, b) => a.fechaCreacion.localeCompare(b.fechaCreacion)).map(pedidoDto));
route('GET', 'pedidos/:id', ({ id }) => pedidoDto(findPedido(id)));
route('GET', 'pedidos/mesa/:id', ({ id }) => {
  const p = db().pedidos.find((x) => x.mesaId === id && x.estado === 'ABIERTO');
  if (!p) throw badRequest(`No hay pedido abierto para la mesa: ${id}`);
  return pedidoDto(p);
});
route('POST', 'pedidos/abrir', ({ body }) => {
  const mesaId = Number(body?.mesaId);
  if (db().pedidos.some((p) => p.mesaId === mesaId && p.estado === 'ABIERTO')) throw conflict(`Ya existe un pedido abierto para la mesa: ${mesaId}`);
  const mesa = findMesa(mesaId);
  const mesero = findUsuario(Number(body?.meseroId), 'Mesero');
  Object.assign(mesa, { estado: 'OCUPADA', meseroId: mesero.id });
  const p: DbPedido = { id: nextId('pedidos'), mesaId, meseroId: mesero.id, estado: 'ABIERTO', fechaCreacion: new Date().toISOString() };
  db().pedidos.push(p);
  save();
  return pedidoDto(p);
});
route('POST', 'pedidos/:id/items', ({ id, body }) => {
  const pedido = findPedido(id);
  assertAbierto(pedido);
  const producto = db().productos.find((p) => p.id === Number(body?.productoId));
  if (!producto) throw badRequest(`Producto no encontrado: ${body?.productoId}`);
  if (!producto.activo) throw conflict(`Producto inactivo: ${producto.nombre}`);
  const cantidad = Number(body?.cantidad);
  if (!(cantidad >= 1)) throw new ApiError(400, 'La cantidad debe ser al menos 1');
  db().items.push({
    id: nextId('items'), pedidoId: id, productoId: producto.id, cantidad, observacion: body?.observacion ?? '',
    precioUnitario: producto.precio, estado: 'PENDIENTE', fechaEnvio: null,
  });
  save();
  return pedidoDto(pedido);
});
route('DELETE', 'pedidos/:id/items/:id2', ({ id, id2 }) => {
  const pedido = findPedido(id);
  assertAbierto(pedido);
  const item = db().items.find((i) => i.id === id2 && i.pedidoId === id);
  if (!item) throw badRequest(`Item no encontrado: ${id2}`);
  if (bloqueado(item)) throw conflict('El item ya no puede eliminarse (fue enviado hace más de 2 minutos)');
  db().items = db().items.filter((i) => i.id !== id2);
  save();
  return pedidoDto(pedido);
});
route('POST', 'pedidos/:id/enviar', ({ id }) => {
  const pedido = findPedido(id);
  assertAbierto(pedido);
  const pendientes = itemsDe(id).filter((i) => i.estado === 'PENDIENTE');
  if (!pendientes.length) throw conflict('No hay items pendientes de enviar');
  const ahora = new Date().toISOString();
  pendientes.forEach((i) => Object.assign(i, { estado: 'ENVIADO', fechaEnvio: ahora }));
  save();
  return pedidoDto(pedido);
});

// Estaciones
route('GET', 'estaciones/cocina', () => cardsEstacion('COCINA'), ['COCINA', 'ADMIN', 'MESERO']);
route('GET', 'estaciones/barra', () => cardsEstacion('BARRA'), ['BARRA', 'ADMIN', 'MESERO']);
route('GET', 'estaciones/mexico', () => cardsEstacion('MEXICO'), ['MEXICO', 'ADMIN', 'MESERO']);
route('POST', 'estaciones/items/:id/listo', ({ id }) => {
  const item = db().items.find((i) => i.id === id);
  if (!item) throw badRequest(`Item no encontrado: ${id}`);
  if (item.estado !== 'ENVIADO') throw conflict('El item no está en estado ENVIADO');
  item.estado = 'LISTO';
  save();
  return null;
}, ['COCINA', 'BARRA', 'MEXICO', 'ADMIN']);
route('POST', 'estaciones/pedidos/:id/listo-todo', ({ id, params }) => {
  const estacion = (params.get('estacion') ?? '').toUpperCase() as Estacion;
  const items = itemsDe(id).filter((i) => i.estado === 'ENVIADO' && estacionDe(i) === estacion);
  if (!items.length) throw conflict('No hay items enviados para esta estación');
  items.forEach((i) => (i.estado = 'LISTO'));
  save();
  return null;
}, ['COCINA', 'BARRA', 'MEXICO', 'ADMIN']);
route('POST', 'estaciones/items/:id/entregado', ({ id }) => {
  const item = db().items.find((i) => i.id === id);
  if (!item) throw badRequest(`Item no encontrado: ${id}`);
  if (item.estado !== 'LISTO') throw conflict('Solo se pueden entregar items listos');
  item.estado = 'ENTREGADO';
  save();
  return null;
}, ['MESERO', 'ADMIN']);

// Facturas
route('POST', 'facturas', ({ body }) => {
  const pedido = findPedido(Number(body?.pedidoId));
  if (pedido.estado !== 'ABIERTO') throw conflict('El pedido ya fue cerrado o pagado');
  if (!itemsDe(pedido.id).length) throw conflict('El pedido no tiene items para facturar');
  const pct = Number(body?.porcentajeServicio ?? 0);
  if (![0, 5, 10].includes(pct)) throw badRequest('El porcentaje de servicio debe ser 0, 5 o 10');
  if (!body?.metodoPago) throw new ApiError(400, 'El método de pago es obligatorio');
  const subtotal = totalDe(pedido.id);
  const valorServicio = Math.round((subtotal * pct) / 100);
  const f = {
    id: nextId('facturas'), pedidoId: pedido.id, subtotal, porcentajeServicio: pct, valorServicio,
    total: subtotal + valorServicio, metodoPago: body.metodoPago, observacion: body.observacion ?? '', fechaPago: new Date().toISOString(),
  };
  db().facturas.push(f);
  pedido.estado = 'PAGADO';
  Object.assign(findMesa(pedido.mesaId), { estado: 'DISPONIBLE', meseroId: null });
  save();
  return facturaDto(f);
}, ['CAJA', 'ADMIN']);
route('GET', 'facturas/total-dia', ({ params }) => {
  const [desde, hasta] = dayRange(params.get('fecha') ? new Date(`${params.get('fecha')}T00:00:00`) : new Date());
  const total = db().facturas.filter((f) => new Date(f.fechaPago) >= desde && new Date(f.fechaPago) <= hasta).reduce((s, f) => s + f.total, 0);
  return { total };
}, ['CAJA', 'ADMIN']);
route('GET', 'facturas/pedido/:id', ({ id }) => {
  const f = db().facturas.find((x) => x.pedidoId === id);
  if (!f) throw badRequest(`Factura no encontrada para el pedido: ${id}`);
  return facturaDto(f);
}, ['CAJA', 'ADMIN']);
route('GET', 'facturas/:id', ({ id }) => {
  const f = db().facturas.find((x) => x.id === id);
  if (!f) throw badRequest(`Factura no encontrada: ${id}`);
  return facturaDto(f);
}, ['CAJA', 'ADMIN']);
route('GET', 'facturas', ({ params }) => {
  const desde = new Date(`${params.get('desde')}T00:00:00`);
  const hasta = new Date(`${params.get('hasta')}T23:59:59`);
  return db().facturas.filter((f) => new Date(f.fechaPago) >= desde && new Date(f.fechaPago) <= hasta)
    .sort((a, b) => b.fechaPago.localeCompare(a.fechaPago)).map(facturaDto);
}, ['CAJA', 'ADMIN']);

// ─── Interceptor ────────────────────────────────────────────────────────────

function currentUser(req: HttpRequest<unknown>) {
  const token = req.headers.get('Authorization')?.replace('Bearer ', '') ?? '';
  const u = db().usuarios.find((x) => token === `demo.${x.id}` && x.activo);
  if (!u) throw new ApiError(401, 'No autenticado');
  return u;
}

export const demoBackendInterceptor: HttpInterceptorFn = (req, next) => {
  const prefix = `${environment.apiUrl}/`;
  if (!req.url.startsWith(prefix)) return next(req);

  const [path, query = ''] = req.url.slice(prefix.length).split('?');
  const params = new URLSearchParams(query);
  req.params.keys().forEach((k) => params.set(k, req.params.get(k)!));

  const run = async () => {
    const found = routes.find(([method, pattern]) => method === req.method && pattern.test(path));
    if (!found) throw new ApiError(404, `No existe ${req.method} /api/${path}`);
    const [, pattern, handler, roles] = found;
    const [, id, id2] = path.match(pattern)!;
    // Todo salvo el login exige sesión; algunas rutas además exigen rol (@PreAuthorize).
    if (path !== 'auth/login') {
      const u = currentUser(req);
      if (roles && !roles.includes(u.rol)) throw new ApiError(403, 'No tienes permiso para esta acción');
    }
    return handler({ body: req.body, params, id: Number(id), id2: Number(id2), user: () => currentUser(req) });
  };

  return from(run()).pipe(
    map((data) => new HttpResponse({ status: 200, body: data ?? null, url: req.url })),
    catchError((e) => {
      const err = e instanceof ApiError ? e : new ApiError(500, 'Error interno del servidor');
      if (!(e instanceof ApiError)) console.error(e);
      return throwError(() => new HttpErrorResponse({
        status: err.status, url: req.url,
        error: { timestamp: new Date().toISOString(), status: err.status, mensaje: err.message },
      }));
    }),
    materialize(),
    delay(LATENCY_MS),
    dematerialize(),
  );
};

/**
 * Datos de ejemplo del modo demo (GitHub Pages). Replica DataInitializer.java y agrega
 * pedidos en curso y ventas del día para que todas las pantallas tengan contenido.
 */
import { Estacion, EstadoItem, MetodoPago, Rol } from '../models/models';

export const DEMO_PASSWORD = 'asados123';
export const DEMO_DB_VERSION = 1;

export interface DbUsuario { id: number; nombre: string; username: string; password: string; rol: Rol; activo: boolean; }
export interface DbMesa { id: number; numero: number; nombre: string; capacidad: number; estado: 'DISPONIBLE' | 'OCUPADA'; meseroId: number | null; }
export interface DbCategoria { id: number; nombre: string; descripcion: string; estacion: Estacion; activo: boolean; }
export interface DbProducto { id: number; nombre: string; precio: number; descripcion: string; imagen: string | null; categoriaId: number; activo: boolean; }
export interface DbItem {
  id: number; pedidoId: number; productoId: number; cantidad: number; observacion: string;
  precioUnitario: number; estado: EstadoItem; fechaEnvio: string | null;
}
export interface DbPedido { id: number; mesaId: number; meseroId: number; estado: 'ABIERTO' | 'CERRADO' | 'PAGADO'; fechaCreacion: string; }
export interface DbFactura {
  id: number; pedidoId: number; subtotal: number; porcentajeServicio: number; valorServicio: number;
  total: number; metodoPago: MetodoPago; observacion: string; fechaPago: string;
}

export interface DemoDb {
  version: number;
  usuarios: DbUsuario[];
  mesas: DbMesa[];
  categorias: DbCategoria[];
  productos: DbProducto[];
  pedidos: DbPedido[];
  items: DbItem[];
  facturas: DbFactura[];
  seq: Record<string, number>;
}

export function createDemoDb(): DemoDb {
  const now = Date.now();
  const minsAgo = (m: number) => new Date(now - m * 60000).toISOString();

  const usuarios: DbUsuario[] = [
    ['Administrador', 'admin', 'ADMIN'], ['Laura (Mesera)', 'mesero1', 'MESERO'], ['Andrés (Mesero)', 'mesero2', 'MESERO'],
    ['Cajero', 'caja', 'CAJA'], ['Cocinero', 'cocina', 'COCINA'], ['Bartender', 'barra', 'BARRA'], ['Cocina México', 'mexico', 'MEXICO'],
  ].map(([nombre, username, rol], i) => ({ id: i + 1, nombre, username, password: DEMO_PASSWORD, rol: rol as Rol, activo: true }));

  const mesas: DbMesa[] = [[1, 4], [2, 4], [3, 4], [4, 6], [5, 6], [6, 4], [7, 4], [8, 2], [9, 2], [10, 8], [11, 4], [12, 4]]
    .map(([numero, capacidad], i) => ({
      id: i + 1, numero, nombre: `Mesa ${String(numero).padStart(2, '0')}`, capacidad, estado: 'DISPONIBLE', meseroId: null,
    }));

  const categorias: DbCategoria[] = ([
    ['Carnes a la Brasa', 'Asados y parrilladas', 'COCINA'], ['Entradas', 'Aperitivos y entradas', 'COCINA'],
    ['Acompañamientos', 'Sides y guarniciones', 'COCINA'], ['Bebidas Frías', 'Jugos, limonadas, gaseosas', 'BARRA'],
    ['Bebidas Calientes', 'Café y tés', 'BARRA'], ['Cócteles', 'Cócteles y licores', 'BARRA'],
    ['Tacos y Burritos', 'Comida mexicana', 'MEXICO'], ['Antojitos Mexicanos', 'Nachos, quesadillas y más', 'MEXICO'],
  ] as [string, string, Estacion][]).map(([nombre, descripcion, estacion], i) => ({ id: i + 1, nombre, descripcion, estacion, activo: true }));

  const productos: DbProducto[] = ([
    ['Churrasco', 45000, 'Corte de res a la brasa 300g', 1], ['Costilla BBQ', 52000, 'Costilla de cerdo en salsa BBQ', 1],
    ['Pechuga a la Brasa', 32000, 'Pechuga de pollo marinada', 1], ['Picada para dos', 68000, 'Res, cerdo, chorizo y papa criolla', 1],
    ['Chorizo Parrillero', 18000, 'Chorizo artesanal a la brasa x2', 2], ['Morcilla', 15000, 'Morcilla criolla a la brasa x2', 2],
    ['Papas Fritas', 12000, 'Papas en bastones crujientes', 3], ['Yuca Frita', 10000, 'Yuca dorada y crujiente', 3],
    ['Limonada Natural', 8000, 'Limonada fresca exprimida', 4], ['Jugo de Mango', 9000, 'Jugo natural de mango', 4],
    ['Gaseosa', 5000, 'Coca-Cola, Sprite o Fanta', 4], ['Agua Mineral', 4000, 'Con o sin gas', 4],
    ['Café Tinto', 3500, 'Café colombiano recién preparado', 5], ['Aromática', 3000, 'Frutos rojos o hierbabuena', 5],
    ['Mojito', 22000, 'Ron blanco, menta y limón', 6], ['Michelada', 14000, 'Cerveza con limón y sal', 6],
    ['Taco de Carne', 14000, 'Taco con guacamole y pico de gallo', 7], ['Taco de Pollo', 12000, 'Pollo marinado con cilantro', 7],
    ['Burrito Mixto', 24000, 'Res, pollo, frijol y queso', 7], ['Nachos con Queso', 18000, 'Nachos con queso fundido y jalapeños', 8],
    ['Quesadilla', 16000, 'Queso y pollo', 8],
  ] as [string, number, string, number][]).map(([nombre, precio, descripcion, categoriaId], i) => ({
    id: i + 1, nombre, precio, descripcion, imagen: null, categoriaId, activo: true,
  }));

  const pedidos: DbPedido[] = [];
  const items: DbItem[] = [];
  const facturas: DbFactura[] = [];
  let itemSeq = 1;
  const addItem = (pedidoId: number, productoId: number, cantidad: number, estado: EstadoItem, envioMin: number | null, observacion = '') =>
    items.push({
      id: itemSeq++, pedidoId, productoId, cantidad, observacion, estado,
      precioUnitario: productos[productoId - 1].precio, fechaEnvio: envioMin === null ? null : minsAgo(envioMin),
    });
  const open = (mesaNumero: number, meseroId: number, creadoMin: number) => {
    const id = pedidos.length + 1;
    pedidos.push({ id, mesaId: mesaNumero, meseroId, estado: 'ABIERTO', fechaCreacion: minsAgo(creadoMin) });
    Object.assign(mesas[mesaNumero - 1], { estado: 'OCUPADA', meseroId });
    return id;
  };

  // Ventas ya cobradas hoy (para la caja y el dashboard).
  ([[3, 2, 190, 10, 'TARJETA'], [8, 3, 150, 5, 'EFECTIVO'], [1, 2, 95, 10, 'TRANSFERENCIA'], [10, 3, 70, 0, 'EFECTIVO']] as
    [number, number, number, number, MetodoPago][]).forEach(([mesa, mesero, min, pct, metodo], i) => {
    const id = pedidos.length + 1;
    pedidos.push({ id, mesaId: mesa, meseroId: mesero, estado: 'PAGADO', fechaCreacion: minsAgo(min + 45) });
    const lines: [number, number][] = [[[1, 2], [7, 1], [9, 2]], [[17, 3], [20, 1], [16, 2]], [[4, 1], [8, 1], [15, 2]], [[2, 1], [3, 1], [11, 3], [13, 2]]][i] as [number, number][];
    lines.forEach(([p, c]) => addItem(id, p, c, 'ENTREGADO', min + 40));
    const subtotal = items.filter((x) => x.pedidoId === id).reduce((s, x) => s + x.precioUnitario * x.cantidad, 0);
    const valorServicio = Math.round((subtotal * pct) / 100);
    facturas.push({ id: facturas.length + 1, pedidoId: id, subtotal, porcentajeServicio: pct, valorServicio, total: subtotal + valorServicio, metodoPago: metodo, observacion: '', fechaPago: minsAgo(min) });
  });

  // Pedidos en curso: tarjetas en cocina, barra y México con distintos estados.
  const p1 = open(2, 2, 25);
  addItem(p1, 1, 2, 'ENVIADO', 12, 'Término medio');
  addItem(p1, 7, 2, 'LISTO', 12);
  addItem(p1, 9, 2, 'ENTREGADO', 14);
  const p2 = open(5, 3, 18);
  addItem(p2, 19, 1, 'ENVIADO', 6);
  addItem(p2, 20, 1, 'ENVIADO', 6, 'Sin jalapeños');
  addItem(p2, 15, 2, 'ENVIADO', 1);
  const p3 = open(7, 2, 4);
  addItem(p3, 4, 1, 'PENDIENTE', null);
  addItem(p3, 16, 2, 'PENDIENTE', null);
  const p4 = open(11, 3, 14);
  addItem(p4, 2, 1, 'ENVIADO', 11);
  addItem(p4, 13, 2, 'LISTO', 11);

  return {
    version: DEMO_DB_VERSION, usuarios, mesas, categorias, productos, pedidos, items, facturas,
    seq: {
      usuarios: usuarios.length, categorias: categorias.length, productos: productos.length,
      pedidos: pedidos.length, items: itemSeq - 1, facturas: facturas.length,
    },
  };
}

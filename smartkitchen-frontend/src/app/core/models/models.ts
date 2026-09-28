export type Rol = 'ADMIN' | 'MESERO' | 'CAJA' | 'COCINA' | 'BARRA' | 'MEXICO';
export type EstadoMesa = 'DISPONIBLE' | 'OCUPADA';
export type EstadoPedido = 'ABIERTO' | 'CERRADO' | 'PAGADO';
export type EstadoItem = 'PENDIENTE' | 'ENVIADO' | 'LISTO' | 'ENTREGADO';
export type Estacion = 'COCINA' | 'BARRA' | 'MEXICO';
export type MetodoPago = 'EFECTIVO' | 'TARJETA' | 'TRANSFERENCIA' | 'MIXTO';

export interface LoginRequest { username: string; password: string; }
export interface LoginResponse { token: string; id: number; nombre: string; username: string; rol: Rol; }

export interface Usuario { id: number; nombre: string; username: string; rol: Rol; activo: boolean; }
export interface UsuarioRequest { nombre: string; username: string; password?: string; rol: Rol; activo: boolean; }

export interface Categoria { id: number; nombre: string; descripcion: string; estacion: Estacion; activo: boolean; }
export interface CategoriaRequest { nombre: string; descripcion: string; estacion: Estacion; activo: boolean; }

export interface Producto { id: number; nombre: string; precio: number; descripcion: string; imagen: string; categoriaId: number; categoriaNombre: string; estacion: Estacion; activo: boolean; }
export interface ProductoRequest { nombre: string; precio: number; descripcion: string; categoriaId: number; activo: boolean; }

export interface Mesa { id: number; numero: number; nombre: string; capacidad: number; estado: EstadoMesa; meseroId: number | null; meseroNombre: string | null; }

export interface ItemPedido { id: number; productoId: number; productoNombre: string; productoImagen: string; estacion: Estacion; cantidad: number; observacion: string; precioUnitario: number; subtotal: number; estado: EstadoItem; fechaEnvio: string | null; bloqueado: boolean; }
export interface ItemPedidoRequest { productoId: number; cantidad: number; observacion?: string; }

export interface Pedido { id: number; mesaId: number; mesaNumero: number; meseroId: number; meseroNombre: string; estado: EstadoPedido; fechaCreacion: string; total: number; items: ItemPedido[]; }

export interface EstacionItemCard { itemId: number; productoNombre: string; cantidad: number; observacion: string; estado: string; }
export interface EstacionCard { pedidoId: number; mesaNumero: number; meseroNombre: string; estacion: Estacion; fechaEnvio: string; items: EstacionItemCard[]; }

export interface FacturaRequest { pedidoId: number; porcentajeServicio: number; metodoPago: MetodoPago; observacion?: string; }
export interface Factura { id: number; pedidoId: number; mesaNumero: number; meseroNombre: string; items: ItemPedido[]; subtotal: number; porcentajeServicio: number; valorServicio: number; total: number; metodoPago: MetodoPago; fechaPago: string; observacion: string; }

export interface ApiError { timestamp: string; status: number; mensaje: string; }

export interface Toast { id: string; type: 'success' | 'error' | 'warning' | 'info'; message: string; }

import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import {
  Usuario, UsuarioRequest,
  Categoria, CategoriaRequest,
  Producto,
  Mesa,
  Pedido, ItemPedidoRequest,
  EstacionCard,
  Factura, FacturaRequest
} from '../models/models';
import { environment } from '../../../environments/environment';

const BASE = environment.apiUrl;

@Injectable({ providedIn: 'root' })
export class ApiService {
  constructor(private http: HttpClient) {}

  /* ── Usuarios ────────────────────────────────────────────── */
  getUsuarios(): Observable<Usuario[]>                          { return this.http.get<Usuario[]>(`${BASE}/usuarios`); }
  createUsuario(r: UsuarioRequest): Observable<Usuario>        { return this.http.post<Usuario>(`${BASE}/usuarios`, r); }
  updateUsuario(id: number, r: UsuarioRequest): Observable<Usuario> { return this.http.put<Usuario>(`${BASE}/usuarios/${id}`, r); }
  deleteUsuario(id: number): Observable<void>                  { return this.http.delete<void>(`${BASE}/usuarios/${id}`); }

  /* ── Categorías ──────────────────────────────────────────── */
  getCategorias(): Observable<Categoria[]>                       { return this.http.get<Categoria[]>(`${BASE}/categorias`); }
  getTodasCategorias(): Observable<Categoria[]>                  { return this.http.get<Categoria[]>(`${BASE}/categorias/todas`); }
  createCategoria(r: CategoriaRequest): Observable<Categoria>   { return this.http.post<Categoria>(`${BASE}/categorias`, r); }
  updateCategoria(id: number, r: CategoriaRequest): Observable<Categoria> { return this.http.put<Categoria>(`${BASE}/categorias/${id}`, r); }
  deleteCategoria(id: number): Observable<void>                 { return this.http.delete<void>(`${BASE}/categorias/${id}`); }

  /* ── Productos ───────────────────────────────────────────── */
  getProductos(): Observable<Producto[]>  { return this.http.get<Producto[]>(`${BASE}/productos`); }
  getTodosProductos(): Observable<Producto[]> { return this.http.get<Producto[]>(`${BASE}/productos/todos`); }
  buscarProductos(q: string): Observable<Producto[]> { return this.http.get<Producto[]>(`${BASE}/productos/buscar`, { params: { q } }); }
  getProductosPorCategoria(id: number): Observable<Producto[]> { return this.http.get<Producto[]>(`${BASE}/productos/categoria/${id}`); }

  createProducto(data: FormData): Observable<Producto>         { return this.http.post<Producto>(`${BASE}/productos`, data); }
  updateProducto(id: number, data: FormData): Observable<Producto> { return this.http.put<Producto>(`${BASE}/productos/${id}`, data); }
  deleteProducto(id: number): Observable<void>                 { return this.http.delete<void>(`${BASE}/productos/${id}`); }

  /* ── Mesas ───────────────────────────────────────────────── */
  getMesas(): Observable<Mesa[]>                              { return this.http.get<Mesa[]>(`${BASE}/mesas`); }
  ocuparMesa(id: number, meseroId: number): Observable<Mesa> { return this.http.post<Mesa>(`${BASE}/mesas/${id}/ocupar`, { meseroId }); }
  liberarMesa(id: number): Observable<Mesa>                  { return this.http.post<Mesa>(`${BASE}/mesas/${id}/liberar`, {}); }
  cambiarMesero(id: number, meseroId: number): Observable<Mesa> { return this.http.patch<Mesa>(`${BASE}/mesas/${id}/mesero`, { meseroId }); }

  /* ── Pedidos ─────────────────────────────────────────────── */
  getPedidosAbiertos(): Observable<Pedido[]>   { return this.http.get<Pedido[]>(`${BASE}/pedidos`); }
  getPedido(id: number): Observable<Pedido>    { return this.http.get<Pedido>(`${BASE}/pedidos/${id}`); }
  getPedidoMesa(mesaId: number): Observable<Pedido> { return this.http.get<Pedido>(`${BASE}/pedidos/mesa/${mesaId}`); }
  abrirPedido(mesaId: number, meseroId: number): Observable<Pedido> { return this.http.post<Pedido>(`${BASE}/pedidos/abrir`, { mesaId, meseroId }); }
  agregarItem(pedidoId: number, r: ItemPedidoRequest): Observable<Pedido> { return this.http.post<Pedido>(`${BASE}/pedidos/${pedidoId}/items`, r); }
  eliminarItem(pedidoId: number, itemId: number): Observable<Pedido> { return this.http.delete<Pedido>(`${BASE}/pedidos/${pedidoId}/items/${itemId}`); }
  enviarAEstaciones(pedidoId: number): Observable<Pedido> { return this.http.post<Pedido>(`${BASE}/pedidos/${pedidoId}/enviar`, {}); }

  /* ── Estaciones ──────────────────────────────────────────── */
  getCards(estacion: 'cocina' | 'barra' | 'mexico'): Observable<EstacionCard[]> { return this.http.get<EstacionCard[]>(`${BASE}/estaciones/${estacion}`); }
  marcarListo(itemId: number): Observable<void>     { return this.http.post<void>(`${BASE}/estaciones/items/${itemId}/listo`, {}); }
  marcarEntregado(itemId: number): Observable<void> { return this.http.post<void>(`${BASE}/estaciones/items/${itemId}/entregado`, {}); }
  marcarTodaMesa(pedidoId: number, estacion: string): Observable<void> {
    return this.http.post<void>(`${BASE}/estaciones/pedidos/${pedidoId}/listo-todo`, {}, { params: { estacion } });
  }

  /* ── Facturas ────────────────────────────────────────────── */
  facturar(r: FacturaRequest): Observable<Factura> { return this.http.post<Factura>(`${BASE}/facturas`, r); }
  getFactura(id: number): Observable<Factura>      { return this.http.get<Factura>(`${BASE}/facturas/${id}`); }
  getFacturaPorPedido(pedidoId: number): Observable<Factura> { return this.http.get<Factura>(`${BASE}/facturas/pedido/${pedidoId}`); }
  getFacturasHoy(): Observable<{ total: number }>  { return this.http.get<{ total: number }>(`${BASE}/facturas/total-dia`); }
  getFacturasPorFecha(desde: string, hasta: string): Observable<Factura[]> {
    return this.http.get<Factura[]>(`${BASE}/facturas`, { params: { desde, hasta } });
  }
}

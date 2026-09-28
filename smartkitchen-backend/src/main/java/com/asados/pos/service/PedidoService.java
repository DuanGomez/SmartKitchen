package com.asados.pos.service;

import com.asados.pos.dto.pedido.*;
import com.asados.pos.entity.*;
import com.asados.pos.enums.*;
import com.asados.pos.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class PedidoService {

    private final PedidoRepository pedidoRepo;
    private final ItemPedidoRepository itemRepo;
    private final MesaRepository mesaRepo;
    private final UsuarioRepository usuarioRepo;
    private final ProductoRepository productoRepo;

    public List<PedidoResponse> listarAbiertos() {
        return pedidoRepo.findAllAbiertos().stream().map(this::toResponse).collect(Collectors.toList());
    }

    public PedidoResponse obtener(Long id) {
        return toResponse(findPedido(id));
    }

    public PedidoResponse obtenerPorMesa(Long mesaId) {
        Pedido p = pedidoRepo.findByMesa_IdAndEstado(mesaId, EstadoPedido.ABIERTO)
                .orElseThrow(() -> new IllegalArgumentException("No hay pedido abierto para la mesa: " + mesaId));
        return toResponse(p);
    }

    @Transactional
    public PedidoResponse abrirPedido(Long mesaId, Long meseroId) {
        pedidoRepo.findByMesa_IdAndEstado(mesaId, EstadoPedido.ABIERTO).ifPresent(p -> {
            throw new IllegalStateException("Ya existe un pedido abierto para la mesa: " + mesaId);
        });
        Mesa mesa = mesaRepo.findById(mesaId)
                .orElseThrow(() -> new IllegalArgumentException("Mesa no encontrada: " + mesaId));
        Usuario mesero = usuarioRepo.findById(meseroId)
                .orElseThrow(() -> new IllegalArgumentException("Mesero no encontrado: " + meseroId));

        mesa.setEstado(EstadoMesa.OCUPADA);
        mesa.setMesero(mesero);
        mesaRepo.save(mesa);

        Pedido pedido = Pedido.builder().mesa(mesa).mesero(mesero).build();
        return toResponse(pedidoRepo.save(pedido));
    }

    @Transactional
    public PedidoResponse agregarItem(Long pedidoId, ItemPedidoRequest req) {
        Pedido pedido = findPedido(pedidoId);
        assertAbierto(pedido);

        Producto producto = productoRepo.findById(req.getProductoId())
                .orElseThrow(() -> new IllegalArgumentException("Producto no encontrado: " + req.getProductoId()));
        if (!producto.isActivo())
            throw new IllegalStateException("Producto inactivo: " + producto.getNombre());

        ItemPedido item = ItemPedido.builder()
                .pedido(pedido)
                .producto(producto)
                .cantidad(req.getCantidad())
                .observacion(req.getObservacion())
                .precioUnitario(producto.getPrecio())
                .build();
        itemRepo.save(item);
        recalcularTotal(pedido);
        return toResponse(pedidoRepo.save(pedido));
    }

    @Transactional
    public PedidoResponse eliminarItem(Long pedidoId, Long itemId) {
        Pedido pedido = findPedido(pedidoId);
        assertAbierto(pedido);

        ItemPedido item = itemRepo.findById(itemId)
                .orElseThrow(() -> new IllegalArgumentException("Item no encontrado: " + itemId));

        if (item.isBloqueado())
            throw new IllegalStateException("El item ya no puede eliminarse (fue enviado hace más de 2 minutos)");

        itemRepo.delete(item);
        pedido.getItems().remove(item);
        recalcularTotal(pedido);
        return toResponse(pedidoRepo.save(pedido));
    }

    @Transactional
    public PedidoResponse enviarAEstaciones(Long pedidoId) {
        Pedido pedido = findPedido(pedidoId);
        assertAbierto(pedido);

        LocalDateTime ahora = LocalDateTime.now();
        List<ItemPedido> pendientes = itemRepo.findByPedido_IdAndEstado(pedidoId, EstadoItem.PENDIENTE);
        if (pendientes.isEmpty())
            throw new IllegalStateException("No hay items pendientes de enviar");

        pendientes.forEach(i -> {
            i.setEstado(EstadoItem.ENVIADO);
            i.setFechaEnvio(ahora);
        });
        itemRepo.saveAll(pendientes);
        return toResponse(pedido);
    }

    // ---- cards para paneles de estación ----

    public List<EstacionCardResponse> obtenerCardsEstacion(Estacion estacion) {
        List<ItemPedido> items = itemRepo.findPendientesByEstacion(estacion);

        // agrupar por pedido
        Map<Long, List<ItemPedido>> porPedido = items.stream()
                .collect(Collectors.groupingBy(i -> i.getPedido().getId()));

        return porPedido.entrySet().stream().map(e -> {
            ItemPedido primero = e.getValue().get(0);
            Pedido pedido = primero.getPedido();

            EstacionCardResponse card = new EstacionCardResponse();
            card.setPedidoId(pedido.getId());
            card.setMesaNumero(pedido.getMesa().getNumero());
            card.setMeseroNombre(pedido.getMesero().getNombre());
            card.setEstacion(estacion);
            card.setFechaEnvio(primero.getFechaEnvio());

            card.setItems(e.getValue().stream().map(i -> {
                EstacionCardResponse.ItemCardDTO dto = new EstacionCardResponse.ItemCardDTO();
                dto.setItemId(i.getId());
                dto.setProductoNombre(i.getProducto().getNombre());
                dto.setCantidad(i.getCantidad());
                dto.setObservacion(i.getObservacion());
                dto.setEstado(i.getEstado().name());
                return dto;
            }).collect(Collectors.toList()));

            return card;
        })
        // Solo mostrar cards con al menos un item pendiente (ENVIADO); cuando todos son LISTO la card desaparece
        .filter(card -> card.getItems().stream().anyMatch(i -> "ENVIADO".equals(i.getEstado())))
        .collect(Collectors.toList());
    }

    @Transactional
    public void marcarTodaLaMesa(Long pedidoId, Estacion estacion) {
        List<ItemPedido> items = itemRepo.findEnviadosByEstacionAndPedido(estacion, pedidoId);
        if (items.isEmpty())
            throw new IllegalStateException("No hay items enviados para esta estación");
        items.forEach(i -> i.setEstado(EstadoItem.LISTO));
        itemRepo.saveAll(items);
    }

    @Transactional
    public void marcarItemListo(Long itemId) {
        ItemPedido item = itemRepo.findById(itemId)
                .orElseThrow(() -> new IllegalArgumentException("Item no encontrado: " + itemId));
        if (item.getEstado() != EstadoItem.ENVIADO)
            throw new IllegalStateException("El item no está en estado ENVIADO");
        item.setEstado(EstadoItem.LISTO);
        itemRepo.save(item);
    }

    @Transactional
    public void marcarItemEntregado(Long itemId) {
        ItemPedido item = itemRepo.findById(itemId)
                .orElseThrow(() -> new IllegalArgumentException("Item no encontrado: " + itemId));
        if (item.getEstado() != EstadoItem.LISTO)
            throw new IllegalStateException("Solo se pueden entregar items listos");
        item.setEstado(EstadoItem.ENTREGADO);
        itemRepo.save(item);
    }

    private void recalcularTotal(Pedido pedido) {
        BigDecimal total = itemRepo.findByPedido_Id(pedido.getId()).stream()
                .map(i -> i.getPrecioUnitario().multiply(BigDecimal.valueOf(i.getCantidad())))
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        pedido.setTotal(total);
    }

    private void assertAbierto(Pedido pedido) {
        if (pedido.getEstado() != EstadoPedido.ABIERTO)
            throw new IllegalStateException("El pedido no está abierto");
    }

    private Pedido findPedido(Long id) {
        return pedidoRepo.findById(id).orElseThrow(() -> new IllegalArgumentException("Pedido no encontrado: " + id));
    }

    PedidoResponse toResponse(Pedido p) {
        PedidoResponse r = new PedidoResponse();
        r.setId(p.getId());
        r.setMesaId(p.getMesa().getId());
        r.setMesaNumero(p.getMesa().getNumero());
        r.setMeseroId(p.getMesero().getId());
        r.setMeseroNombre(p.getMesero().getNombre());
        r.setEstado(p.getEstado());
        r.setFechaCreacion(p.getFechaCreacion());
        r.setTotal(p.getTotal());
        r.setItems(itemRepo.findByPedido_Id(p.getId()).stream()
                .map(this::toResponse).collect(Collectors.toList()));
        return r;
    }

    public ItemPedidoResponse toResponse(ItemPedido i) {
        ItemPedidoResponse r = new ItemPedidoResponse();
        r.setId(i.getId());
        r.setProductoId(i.getProducto().getId());
        r.setProductoNombre(i.getProducto().getNombre());
        r.setProductoImagen(i.getProducto().getImagen());
        r.setEstacion(i.getProducto().getCategoria().getEstacion());
        r.setCantidad(i.getCantidad());
        r.setObservacion(i.getObservacion());
        r.setPrecioUnitario(i.getPrecioUnitario());
        r.setSubtotal(i.getPrecioUnitario().multiply(BigDecimal.valueOf(i.getCantidad())));
        r.setEstado(i.getEstado());
        r.setFechaEnvio(i.getFechaEnvio());
        r.setBloqueado(i.isBloqueado());
        return r;
    }
}

package com.asados.pos.service;

import com.asados.pos.dto.factura.FacturaRequest;
import com.asados.pos.dto.factura.FacturaResponse;
import com.asados.pos.dto.pedido.ItemPedidoResponse;
import com.asados.pos.entity.*;
import com.asados.pos.enums.EstadoMesa;
import com.asados.pos.enums.EstadoPedido;
import com.asados.pos.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class FacturaService {

    private final FacturaRepository facturaRepo;
    private final PedidoRepository pedidoRepo;
    private final ItemPedidoRepository itemRepo;
    private final MesaRepository mesaRepo;
    private final PedidoService pedidoService;

    @Transactional
    public FacturaResponse facturar(FacturaRequest req) {
        Pedido pedido = pedidoRepo.findById(req.getPedidoId())
                .orElseThrow(() -> new IllegalArgumentException("Pedido no encontrado: " + req.getPedidoId()));

        if (pedido.getEstado() != EstadoPedido.ABIERTO)
            throw new IllegalStateException("El pedido ya fue cerrado o pagado");

        if (itemRepo.findByPedido_Id(pedido.getId()).isEmpty())
            throw new IllegalStateException("El pedido no tiene items para facturar");
        int pct = req.getPorcentajeServicio();
        if (pct != 0 && pct != 5 && pct != 10)
            throw new IllegalArgumentException("El porcentaje de servicio debe ser 0, 5 o 10");

        BigDecimal subtotal = pedido.getTotal();
        BigDecimal valorServicio = subtotal
                .multiply(BigDecimal.valueOf(pct))
                .divide(BigDecimal.valueOf(100), 2, RoundingMode.HALF_UP);
        BigDecimal total = subtotal.add(valorServicio);

        Factura factura = Factura.builder()
                .pedido(pedido)
                .subtotal(subtotal)
                .porcentajeServicio(pct)
                .valorServicio(valorServicio)
                .total(total)
                .metodoPago(req.getMetodoPago())
                .observacion(req.getObservacion())
                .fechaPago(LocalDateTime.now())
                .build();

        facturaRepo.save(factura);

        pedido.setEstado(EstadoPedido.PAGADO);
        pedidoRepo.save(pedido);

        Mesa mesa = pedido.getMesa();
        mesa.setEstado(EstadoMesa.DISPONIBLE);
        mesa.setMesero(null);
        mesaRepo.save(mesa);

        return toResponse(factura);
    }

    public FacturaResponse obtener(Long id) {
        return toResponse(facturaRepo.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Factura no encontrada: " + id)));
    }

    public FacturaResponse obtenerPorPedido(Long pedidoId) {
        return toResponse(facturaRepo.findByPedido_Id(pedidoId)
                .orElseThrow(() -> new IllegalArgumentException("Factura no encontrada para el pedido: " + pedidoId)));
    }

    public List<FacturaResponse> listarPorFecha(LocalDateTime desde, LocalDateTime hasta) {
        return facturaRepo.findByFechaPagoBetweenOrderByFechaPagoDesc(desde, hasta)
                .stream().map(this::toResponse).collect(Collectors.toList());
    }

    public BigDecimal totalVentasDia(LocalDateTime desde, LocalDateTime hasta) {
        return facturaRepo.sumTotalByFechaPagoBetween(desde, hasta);
    }

    private FacturaResponse toResponse(Factura f) {
        FacturaResponse r = new FacturaResponse();
        r.setId(f.getId());
        r.setPedidoId(f.getPedido().getId());
        r.setMesaNumero(f.getPedido().getMesa().getNumero());
        r.setMeseroNombre(f.getPedido().getMesero().getNombre());
        r.setSubtotal(f.getSubtotal());
        r.setPorcentajeServicio(f.getPorcentajeServicio());
        r.setValorServicio(f.getValorServicio());
        r.setTotal(f.getTotal());
        r.setMetodoPago(f.getMetodoPago());
        r.setFechaPago(f.getFechaPago());
        r.setObservacion(f.getObservacion());

        List<ItemPedidoResponse> items = itemRepo.findByPedido_Id(f.getPedido().getId())
                .stream().map(pedidoService::toResponse).collect(Collectors.toList());
        r.setItems(items);
        return r;
    }
}

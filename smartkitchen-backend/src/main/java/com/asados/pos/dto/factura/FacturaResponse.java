package com.asados.pos.dto.factura;

import com.asados.pos.enums.MetodoPago;
import com.asados.pos.dto.pedido.ItemPedidoResponse;
import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Data
public class FacturaResponse {
    private Long id;
    private Long pedidoId;
    private Integer mesaNumero;
    private String meseroNombre;
    private List<ItemPedidoResponse> items;
    private BigDecimal subtotal;
    private int porcentajeServicio;
    private BigDecimal valorServicio;
    private BigDecimal total;
    private MetodoPago metodoPago;
    private LocalDateTime fechaPago;
    private String observacion;
}

package com.asados.pos.dto.pedido;

import com.asados.pos.enums.EstadoPedido;
import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Data
public class PedidoResponse {
    private Long id;
    private Long mesaId;
    private Integer mesaNumero;
    private Long meseroId;
    private String meseroNombre;
    private EstadoPedido estado;
    private LocalDateTime fechaCreacion;
    private BigDecimal total;
    private List<ItemPedidoResponse> items;
}

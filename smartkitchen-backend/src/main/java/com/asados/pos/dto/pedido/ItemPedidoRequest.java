package com.asados.pos.dto.pedido;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class ItemPedidoRequest {
    @NotNull
    private Long productoId;
    @NotNull
    @Min(1)
    private Integer cantidad;
    private String observacion;
}

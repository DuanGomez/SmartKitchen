package com.asados.pos.dto.factura;

import com.asados.pos.enums.MetodoPago;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class FacturaRequest {
    @NotNull
    private Long pedidoId;
    // 0, 5 o 10
    private int porcentajeServicio = 0;
    @NotNull
    private MetodoPago metodoPago;
    private String observacion;
}

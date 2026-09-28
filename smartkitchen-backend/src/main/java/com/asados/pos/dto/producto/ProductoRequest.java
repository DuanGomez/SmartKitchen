package com.asados.pos.dto.producto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;
import java.math.BigDecimal;

@Data
public class ProductoRequest {
    @NotBlank
    private String nombre;
    @NotNull
    @DecimalMin("0.01")
    private BigDecimal precio;
    private String descripcion;
    @NotNull
    private Long categoriaId;
    private boolean activo = true;
}

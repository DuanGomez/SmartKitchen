package com.asados.pos.dto.producto;

import com.asados.pos.enums.Estacion;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class CategoriaRequest {
    @NotBlank
    private String nombre;
    private String descripcion;
    @NotNull
    private Estacion estacion;
    private boolean activo = true;
}

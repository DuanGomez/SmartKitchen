package com.asados.pos.dto.producto;

import com.asados.pos.enums.Estacion;
import lombok.Data;

@Data
public class CategoriaResponse {
    private Long id;
    private String nombre;
    private String descripcion;
    private Estacion estacion;
    private boolean activo;
}

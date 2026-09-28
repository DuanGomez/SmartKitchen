package com.asados.pos.dto.producto;

import com.asados.pos.enums.Estacion;
import lombok.Data;
import java.math.BigDecimal;

@Data
public class ProductoResponse {
    private Long id;
    private String nombre;
    private BigDecimal precio;
    private String descripcion;
    private String imagen;
    private Long categoriaId;
    private String categoriaNombre;
    private Estacion estacion;
    private boolean activo;
}

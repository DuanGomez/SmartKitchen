package com.asados.pos.dto.mesa;

import com.asados.pos.enums.EstadoMesa;
import lombok.Data;

@Data
public class MesaResponse {
    private Long id;
    private Integer numero;
    private String nombre;
    private Integer capacidad;
    private EstadoMesa estado;
    private Long meseroId;
    private String meseroNombre;
}

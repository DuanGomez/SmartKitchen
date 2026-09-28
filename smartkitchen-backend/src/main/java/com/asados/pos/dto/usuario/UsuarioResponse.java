package com.asados.pos.dto.usuario;

import com.asados.pos.enums.Rol;
import lombok.Data;

@Data
public class UsuarioResponse {
    private Long id;
    private String nombre;
    private String username;
    private Rol rol;
    private boolean activo;
}

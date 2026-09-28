package com.asados.pos.dto.usuario;

import com.asados.pos.enums.Rol;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class UsuarioRequest {
    @NotBlank
    private String nombre;
    @NotBlank
    private String username;
    private String password;
    @NotNull
    private Rol rol;
    private boolean activo = true;
}

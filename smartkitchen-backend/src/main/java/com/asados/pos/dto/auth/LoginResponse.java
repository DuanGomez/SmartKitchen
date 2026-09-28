package com.asados.pos.dto.auth;

import com.asados.pos.enums.Rol;
import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class LoginResponse {
    private String token;
    private Long id;
    private String nombre;
    private String username;
    private Rol rol;
}

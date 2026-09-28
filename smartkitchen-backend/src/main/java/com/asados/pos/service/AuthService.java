package com.asados.pos.service;

import com.asados.pos.dto.auth.LoginRequest;
import com.asados.pos.dto.auth.LoginResponse;
import com.asados.pos.entity.Usuario;
import com.asados.pos.repository.UsuarioRepository;
import com.asados.pos.security.JwtUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final AuthenticationManager authManager;
    private final UserDetailsService userDetailsService;
    private final UsuarioRepository usuarioRepository;
    private final JwtUtil jwtUtil;

    public LoginResponse login(LoginRequest request) {
        authManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.getUsername(), request.getPassword()));

        UserDetails userDetails = userDetailsService.loadUserByUsername(request.getUsername());
        Usuario usuario = usuarioRepository.findByUsername(request.getUsername()).orElseThrow();

        String token = jwtUtil.generateToken(userDetails, usuario.getId(), usuario.getRol().name());
        return new LoginResponse(token, usuario.getId(), usuario.getNombre(),
                usuario.getUsername(), usuario.getRol());
    }
}

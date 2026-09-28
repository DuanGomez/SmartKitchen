package com.asados.pos.service;

import com.asados.pos.dto.usuario.UsuarioRequest;
import com.asados.pos.dto.usuario.UsuarioResponse;
import com.asados.pos.entity.Usuario;
import com.asados.pos.repository.MesaRepository;
import com.asados.pos.repository.PedidoRepository;
import com.asados.pos.repository.UsuarioRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class UsuarioService {

    private final UsuarioRepository repo;
    private final PedidoRepository pedidoRepo;
    private final MesaRepository mesaRepo;
    private final PasswordEncoder encoder;

    public List<UsuarioResponse> listar() {
        return repo.findAll().stream().map(this::toResponse).collect(Collectors.toList());
    }

    public UsuarioResponse obtener(Long id) {
        return toResponse(find(id));
    }

    @Transactional
    public UsuarioResponse crear(UsuarioRequest req) {
        if (repo.existsByUsername(req.getUsername()))
            throw new IllegalArgumentException("El username ya existe: " + req.getUsername());

        Usuario u = Usuario.builder()
                .nombre(req.getNombre())
                .username(req.getUsername())
                .password(encoder.encode(req.getPassword()))
                .rol(req.getRol())
                .activo(req.isActivo())
                .build();
        return toResponse(repo.save(u));
    }

    @Transactional
    public UsuarioResponse actualizar(Long id, UsuarioRequest req) {
        Usuario u = find(id);
        u.setNombre(req.getNombre());
        u.setRol(req.getRol());
        u.setActivo(req.isActivo());
        if (req.getPassword() != null && !req.getPassword().isBlank())
            u.setPassword(encoder.encode(req.getPassword()));
        return toResponse(repo.save(u));
    }

    @Transactional
    public void eliminar(Long id) {
        Usuario u = find(id);
        if (mesaRepo.existsByMesero_Id(id))
            throw new IllegalStateException("El usuario tiene mesas asignadas");
        if (pedidoRepo.existsByMesero_Id(id)) {
            u.setActivo(false);
            repo.save(u);
            return;
        }
        repo.delete(u);
    }

    private Usuario find(Long id) {
        return repo.findById(id).orElseThrow(() -> new IllegalArgumentException("Usuario no encontrado: " + id));
    }

    private UsuarioResponse toResponse(Usuario u) {
        UsuarioResponse r = new UsuarioResponse();
        r.setId(u.getId());
        r.setNombre(u.getNombre());
        r.setUsername(u.getUsername());
        r.setRol(u.getRol());
        r.setActivo(u.isActivo());
        return r;
    }
}

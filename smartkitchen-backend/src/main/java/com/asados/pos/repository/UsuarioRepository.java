package com.asados.pos.repository;

import com.asados.pos.entity.Usuario;
import com.asados.pos.enums.Rol;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface UsuarioRepository extends JpaRepository<Usuario, Long> {
    Optional<Usuario> findByUsername(String username);
    boolean existsByUsername(String username);
    List<Usuario> findByRol(Rol rol);
    List<Usuario> findByActivoTrue();
}

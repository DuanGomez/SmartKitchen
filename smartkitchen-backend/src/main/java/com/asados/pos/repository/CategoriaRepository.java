package com.asados.pos.repository;

import com.asados.pos.entity.Categoria;
import com.asados.pos.enums.Estacion;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface CategoriaRepository extends JpaRepository<Categoria, Long> {
    List<Categoria> findByActivoTrue();
    List<Categoria> findByEstacionAndActivoTrue(Estacion estacion);
    boolean existsByNombre(String nombre);
}

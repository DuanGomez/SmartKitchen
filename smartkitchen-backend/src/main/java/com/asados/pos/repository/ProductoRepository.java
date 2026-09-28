package com.asados.pos.repository;

import com.asados.pos.entity.Producto;
import com.asados.pos.enums.Estacion;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.List;

public interface ProductoRepository extends JpaRepository<Producto, Long> {
    List<Producto> findByActivoTrue();
    boolean existsByCategoria_Id(Long categoriaId);
    List<Producto> findByCategoria_IdAndActivoTrue(Long categoriaId);

    @Query("SELECT p FROM Producto p JOIN p.categoria c WHERE c.estacion = :estacion AND p.activo = true")
    List<Producto> findByEstacionAndActivoTrue(@Param("estacion") Estacion estacion);

    @Query("SELECT p FROM Producto p WHERE p.activo = true AND " +
           "(LOWER(p.nombre) LIKE LOWER(CONCAT('%', :q, '%')) OR LOWER(p.descripcion) LIKE LOWER(CONCAT('%', :q, '%')))")
    List<Producto> buscar(@Param("q") String q);
}

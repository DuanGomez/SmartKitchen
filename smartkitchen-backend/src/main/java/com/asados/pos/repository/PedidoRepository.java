package com.asados.pos.repository;

import com.asados.pos.entity.Pedido;
import com.asados.pos.enums.EstadoPedido;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

public interface PedidoRepository extends JpaRepository<Pedido, Long> {
    Optional<Pedido> findByMesa_IdAndEstado(Long mesaId, EstadoPedido estado);
    List<Pedido> findByEstado(EstadoPedido estado);
    boolean existsByMesero_Id(Long meseroId);
    List<Pedido> findByMesero_IdAndEstado(Long meseroId, EstadoPedido estado);

    @Query("SELECT p FROM Pedido p WHERE p.estado = 'ABIERTO' ORDER BY p.fechaCreacion ASC")
    List<Pedido> findAllAbiertos();

    @Query("SELECT p FROM Pedido p WHERE p.fechaCreacion BETWEEN :desde AND :hasta ORDER BY p.fechaCreacion DESC")
    List<Pedido> findByFechaCreacionBetween(@Param("desde") LocalDateTime desde, @Param("hasta") LocalDateTime hasta);
}

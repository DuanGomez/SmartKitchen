package com.asados.pos.repository;

import com.asados.pos.entity.Factura;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

public interface FacturaRepository extends JpaRepository<Factura, Long> {
    Optional<Factura> findByPedido_Id(Long pedidoId);

    List<Factura> findByFechaPagoBetweenOrderByFechaPagoDesc(LocalDateTime desde, LocalDateTime hasta);

    @Query("SELECT COALESCE(SUM(f.total), 0) FROM Factura f WHERE f.fechaPago BETWEEN :desde AND :hasta")
    BigDecimal sumTotalByFechaPagoBetween(@Param("desde") LocalDateTime desde, @Param("hasta") LocalDateTime hasta);
}

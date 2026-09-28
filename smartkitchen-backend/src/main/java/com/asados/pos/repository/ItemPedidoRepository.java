package com.asados.pos.repository;

import com.asados.pos.entity.ItemPedido;
import com.asados.pos.enums.EstadoItem;
import com.asados.pos.enums.Estacion;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.time.LocalDateTime;
import java.util.List;

public interface ItemPedidoRepository extends JpaRepository<ItemPedido, Long> {
    List<ItemPedido> findByPedido_Id(Long pedidoId);
    boolean existsByProducto_Id(Long productoId);
    List<ItemPedido> findByPedido_IdAndEstado(Long pedidoId, EstadoItem estado);

    @Query("SELECT i FROM ItemPedido i JOIN i.producto p JOIN p.categoria c " +
           "WHERE c.estacion = :estacion AND i.estado = :estado ORDER BY i.fechaEnvio ASC")
    List<ItemPedido> findByEstacionAndEstado(@Param("estacion") Estacion estacion,
                                             @Param("estado") EstadoItem estado);

    @Query("SELECT i FROM ItemPedido i JOIN i.producto p JOIN p.categoria c " +
           "WHERE c.estacion = :estacion AND i.estado IN ('ENVIADO','LISTO') ORDER BY i.fechaEnvio ASC")
    List<ItemPedido> findPendientesByEstacion(@Param("estacion") Estacion estacion);

    @Query("SELECT i FROM ItemPedido i JOIN i.producto p JOIN p.categoria c " +
           "WHERE c.estacion = :estacion AND i.pedido.id = :pedidoId AND i.estado = 'ENVIADO'")
    List<ItemPedido> findEnviadosByEstacionAndPedido(@Param("estacion") Estacion estacion,
                                                     @Param("pedidoId") Long pedidoId);

    // items enviados hace más de 2 min que aún no están bloqueados
    @Query("SELECT i FROM ItemPedido i WHERE i.bloqueado = false AND i.estado <> 'PENDIENTE' " +
           "AND i.fechaEnvio IS NOT NULL AND i.fechaEnvio <= :limite")
    List<ItemPedido> findItemsParaBloquear(@Param("limite") LocalDateTime limite);
}

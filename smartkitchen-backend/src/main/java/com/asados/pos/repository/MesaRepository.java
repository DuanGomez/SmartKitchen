package com.asados.pos.repository;

import com.asados.pos.entity.Mesa;
import com.asados.pos.enums.EstadoMesa;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface MesaRepository extends JpaRepository<Mesa, Long> {
    List<Mesa> findByEstado(EstadoMesa estado);
    boolean existsByMesero_Id(Long meseroId);
    List<Mesa> findAllByOrderByNumeroAsc();
    Optional<Mesa> findByNumero(Integer numero);
}

package com.asados.pos.service;

import com.asados.pos.dto.mesa.MesaResponse;
import com.asados.pos.entity.Mesa;
import com.asados.pos.entity.Usuario;
import com.asados.pos.enums.EstadoMesa;
import com.asados.pos.repository.MesaRepository;
import com.asados.pos.repository.UsuarioRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class MesaService {

    private final MesaRepository repo;
    private final UsuarioRepository usuarioRepo;

    public List<MesaResponse> listarTodas() {
        return repo.findAllByOrderByNumeroAsc().stream().map(this::toResponse).collect(Collectors.toList());
    }

    public List<MesaResponse> listarDisponibles() {
        return repo.findByEstado(EstadoMesa.DISPONIBLE).stream().map(this::toResponse).collect(Collectors.toList());
    }

    public MesaResponse obtener(Long id) {
        return toResponse(find(id));
    }

    @Transactional
    public MesaResponse ocupar(Long id, Long meseroId) {
        Mesa mesa = find(id);
        if (mesa.getEstado() == EstadoMesa.OCUPADA)
            throw new IllegalStateException("La mesa ya está ocupada");
        Usuario mesero = usuarioRepo.findById(meseroId)
                .orElseThrow(() -> new IllegalArgumentException("Mesero no encontrado: " + meseroId));
        mesa.setEstado(EstadoMesa.OCUPADA);
        mesa.setMesero(mesero);
        return toResponse(repo.save(mesa));
    }

    @Transactional
    public MesaResponse liberar(Long id) {
        Mesa mesa = find(id);
        mesa.setEstado(EstadoMesa.DISPONIBLE);
        mesa.setMesero(null);
        return toResponse(repo.save(mesa));
    }

    @Transactional
    public MesaResponse moverMesero(Long id, Long nuevoMeseroId) {
        Mesa mesa = find(id);
        Usuario mesero = usuarioRepo.findById(nuevoMeseroId)
                .orElseThrow(() -> new IllegalArgumentException("Mesero no encontrado: " + nuevoMeseroId));
        mesa.setMesero(mesero);
        return toResponse(repo.save(mesa));
    }

    private Mesa find(Long id) {
        return repo.findById(id).orElseThrow(() -> new IllegalArgumentException("Mesa no encontrada: " + id));
    }

    MesaResponse toResponse(Mesa m) {
        MesaResponse r = new MesaResponse();
        r.setId(m.getId());
        r.setNumero(m.getNumero());
        r.setNombre(m.getNombre());
        r.setCapacidad(m.getCapacidad());
        r.setEstado(m.getEstado());
        if (m.getMesero() != null) {
            r.setMeseroId(m.getMesero().getId());
            r.setMeseroNombre(m.getMesero().getNombre());
        }
        return r;
    }
}

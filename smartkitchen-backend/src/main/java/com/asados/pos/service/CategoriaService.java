package com.asados.pos.service;

import com.asados.pos.dto.producto.CategoriaRequest;
import com.asados.pos.dto.producto.CategoriaResponse;
import com.asados.pos.entity.Categoria;
import com.asados.pos.enums.Estacion;
import com.asados.pos.repository.CategoriaRepository;
import com.asados.pos.repository.ProductoRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class CategoriaService {

    private final CategoriaRepository repo;
    private final ProductoRepository productoRepo;

    public List<CategoriaResponse> listar() {
        return repo.findAll().stream().map(this::toResponse).collect(Collectors.toList());
    }

    public List<CategoriaResponse> listarActivas() {
        return repo.findByActivoTrue().stream().map(this::toResponse).collect(Collectors.toList());
    }

    public List<CategoriaResponse> listarPorEstacion(Estacion estacion) {
        return repo.findByEstacionAndActivoTrue(estacion).stream().map(this::toResponse).collect(Collectors.toList());
    }

    @Transactional
    public CategoriaResponse crear(CategoriaRequest req) {
        if (repo.existsByNombre(req.getNombre()))
            throw new IllegalArgumentException("Categoría ya existe: " + req.getNombre());
        Categoria c = Categoria.builder()
                .nombre(req.getNombre())
                .descripcion(req.getDescripcion())
                .estacion(req.getEstacion())
                .activo(req.isActivo())
                .build();
        return toResponse(repo.save(c));
    }

    @Transactional
    public CategoriaResponse actualizar(Long id, CategoriaRequest req) {
        Categoria c = find(id);
        c.setNombre(req.getNombre());
        c.setDescripcion(req.getDescripcion());
        c.setEstacion(req.getEstacion());
        c.setActivo(req.isActivo());
        return toResponse(repo.save(c));
    }

    @Transactional
    public void eliminar(Long id) {
        Categoria c = find(id);
        if (productoRepo.existsByCategoria_Id(id))
            throw new IllegalStateException("La categoría tiene productos: muévelos o desactívala en lugar de eliminarla");
        repo.delete(c);
    }

    private Categoria find(Long id) {
        return repo.findById(id).orElseThrow(() -> new IllegalArgumentException("Categoría no encontrada: " + id));
    }

    CategoriaResponse toResponse(Categoria c) {
        CategoriaResponse r = new CategoriaResponse();
        r.setId(c.getId());
        r.setNombre(c.getNombre());
        r.setDescripcion(c.getDescripcion());
        r.setEstacion(c.getEstacion());
        r.setActivo(c.isActivo());
        return r;
    }
}

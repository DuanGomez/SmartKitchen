package com.asados.pos.service;

import com.asados.pos.dto.producto.ProductoRequest;
import com.asados.pos.dto.producto.ProductoResponse;
import com.asados.pos.entity.Categoria;
import com.asados.pos.entity.Producto;
import com.asados.pos.enums.Estacion;
import com.asados.pos.repository.CategoriaRepository;
import com.asados.pos.repository.ItemPedidoRepository;
import com.asados.pos.repository.ProductoRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.*;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ProductoService {

    private final ProductoRepository repo;
    private final CategoriaRepository catRepo;
    private final ItemPedidoRepository itemRepo;

    @Value("${app.upload.dir}")
    private String uploadDir;

    public List<ProductoResponse> listar() {
        return repo.findAll().stream().map(this::toResponse).collect(Collectors.toList());
    }

    public List<ProductoResponse> listarActivos() {
        return repo.findByActivoTrue().stream().map(this::toResponse).collect(Collectors.toList());
    }

    public List<ProductoResponse> listarPorCategoria(Long categoriaId) {
        return repo.findByCategoria_IdAndActivoTrue(categoriaId).stream().map(this::toResponse).collect(Collectors.toList());
    }

    public List<ProductoResponse> listarPorEstacion(Estacion estacion) {
        return repo.findByEstacionAndActivoTrue(estacion).stream().map(this::toResponse).collect(Collectors.toList());
    }

    public List<ProductoResponse> buscar(String q) {
        return repo.buscar(q).stream().map(this::toResponse).collect(Collectors.toList());
    }

    @Transactional
    public ProductoResponse crear(ProductoRequest req, MultipartFile imagen) {
        Categoria cat = findCat(req.getCategoriaId());
        Producto p = Producto.builder()
                .nombre(req.getNombre())
                .precio(req.getPrecio())
                .descripcion(req.getDescripcion())
                .categoria(cat)
                .activo(req.isActivo())
                .build();
        if (imagen != null && !imagen.isEmpty())
            p.setImagen(guardarImagen(imagen));
        return toResponse(repo.save(p));
    }

    @Transactional
    public ProductoResponse actualizar(Long id, ProductoRequest req, MultipartFile imagen) {
        Producto p = find(id);
        p.setNombre(req.getNombre());
        p.setPrecio(req.getPrecio());
        p.setDescripcion(req.getDescripcion());
        p.setCategoria(findCat(req.getCategoriaId()));
        p.setActivo(req.isActivo());
        if (imagen != null && !imagen.isEmpty())
            p.setImagen(guardarImagen(imagen));
        return toResponse(repo.save(p));
    }

    @Transactional
    public void eliminar(Long id) {
        Producto p = find(id);
        if (itemRepo.existsByProducto_Id(id)) {
            p.setActivo(false);
            repo.save(p);
            return;
        }
        repo.delete(p);
    }

    private String guardarImagen(MultipartFile file) {
        try {
            Path dir = Paths.get(uploadDir);
            Files.createDirectories(dir);
            String filename = UUID.randomUUID() + "_" + file.getOriginalFilename();
            Files.copy(file.getInputStream(), dir.resolve(filename), StandardCopyOption.REPLACE_EXISTING);
            return filename;
        } catch (IOException e) {
            throw new RuntimeException("Error guardando imagen", e);
        }
    }

    private Producto find(Long id) {
        return repo.findById(id).orElseThrow(() -> new IllegalArgumentException("Producto no encontrado: " + id));
    }

    private Categoria findCat(Long id) {
        return catRepo.findById(id).orElseThrow(() -> new IllegalArgumentException("Categoría no encontrada: " + id));
    }

    ProductoResponse toResponse(Producto p) {
        ProductoResponse r = new ProductoResponse();
        r.setId(p.getId());
        r.setNombre(p.getNombre());
        r.setPrecio(p.getPrecio());
        r.setDescripcion(p.getDescripcion());
        r.setImagen(p.getImagen());
        r.setCategoriaId(p.getCategoria().getId());
        r.setCategoriaNombre(p.getCategoria().getNombre());
        r.setEstacion(p.getCategoria().getEstacion());
        r.setActivo(p.isActivo());
        return r;
    }
}

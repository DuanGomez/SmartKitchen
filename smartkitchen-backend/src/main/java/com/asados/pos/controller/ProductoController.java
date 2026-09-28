package com.asados.pos.controller;

import com.asados.pos.dto.producto.ProductoRequest;
import com.asados.pos.dto.producto.ProductoResponse;
import com.asados.pos.enums.Estacion;
import com.asados.pos.service.ProductoService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequestMapping("/api/productos")
@RequiredArgsConstructor
public class ProductoController {

    private final ProductoService service;

    @GetMapping
    public ResponseEntity<List<ProductoResponse>> listar() {
        return ResponseEntity.ok(service.listarActivos());
    }

    @GetMapping("/todos")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<ProductoResponse>> todos() {
        return ResponseEntity.ok(service.listar());
    }

    @GetMapping("/categoria/{id}")
    public ResponseEntity<List<ProductoResponse>> porCategoria(@PathVariable Long id) {
        return ResponseEntity.ok(service.listarPorCategoria(id));
    }

    @GetMapping("/estacion/{estacion}")
    public ResponseEntity<List<ProductoResponse>> porEstacion(@PathVariable Estacion estacion) {
        return ResponseEntity.ok(service.listarPorEstacion(estacion));
    }

    @GetMapping("/buscar")
    public ResponseEntity<List<ProductoResponse>> buscar(@RequestParam String q) {
        return ResponseEntity.ok(service.buscar(q));
    }

    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ProductoResponse> crear(
            @Valid @RequestPart("data") ProductoRequest req,
            @RequestPart(value = "imagen", required = false) MultipartFile imagen) {
        return ResponseEntity.status(HttpStatus.CREATED).body(service.crear(req, imagen));
    }

    @PutMapping(value = "/{id}", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ProductoResponse> actualizar(
            @PathVariable Long id,
            @Valid @RequestPart("data") ProductoRequest req,
            @RequestPart(value = "imagen", required = false) MultipartFile imagen) {
        return ResponseEntity.ok(service.actualizar(id, req, imagen));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> eliminar(@PathVariable Long id) {
        service.eliminar(id);
        return ResponseEntity.noContent().build();
    }
}

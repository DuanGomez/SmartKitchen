package com.asados.pos.controller;

import com.asados.pos.dto.mesa.MesaResponse;
import com.asados.pos.service.MesaService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/mesas")
@RequiredArgsConstructor
public class MesaController {

    private final MesaService service;

    @GetMapping
    public ResponseEntity<List<MesaResponse>> listar() {
        return ResponseEntity.ok(service.listarTodas());
    }

    @GetMapping("/disponibles")
    public ResponseEntity<List<MesaResponse>> disponibles() {
        return ResponseEntity.ok(service.listarDisponibles());
    }

    @GetMapping("/{id}")
    public ResponseEntity<MesaResponse> obtener(@PathVariable Long id) {
        return ResponseEntity.ok(service.obtener(id));
    }

    @PostMapping("/{id}/ocupar")
    public ResponseEntity<MesaResponse> ocupar(@PathVariable Long id,
                                                @RequestBody Map<String, Long> body) {
        return ResponseEntity.ok(service.ocupar(id, body.get("meseroId")));
    }

    @PostMapping("/{id}/liberar")
    public ResponseEntity<MesaResponse> liberar(@PathVariable Long id) {
        return ResponseEntity.ok(service.liberar(id));
    }

    @PatchMapping("/{id}/mesero")
    public ResponseEntity<MesaResponse> cambiarMesero(@PathVariable Long id,
                                                       @RequestBody Map<String, Long> body) {
        return ResponseEntity.ok(service.moverMesero(id, body.get("meseroId")));
    }
}

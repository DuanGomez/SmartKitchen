package com.asados.pos.controller;

import com.asados.pos.dto.pedido.ItemPedidoRequest;
import com.asados.pos.dto.pedido.PedidoResponse;
import com.asados.pos.service.PedidoService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/pedidos")
@RequiredArgsConstructor
public class PedidoController {

    private final PedidoService service;

    @GetMapping
    public ResponseEntity<List<PedidoResponse>> listarAbiertos() {
        return ResponseEntity.ok(service.listarAbiertos());
    }

    @GetMapping("/{id}")
    public ResponseEntity<PedidoResponse> obtener(@PathVariable Long id) {
        return ResponseEntity.ok(service.obtener(id));
    }

    @GetMapping("/mesa/{mesaId}")
    public ResponseEntity<PedidoResponse> porMesa(@PathVariable Long mesaId) {
        return ResponseEntity.ok(service.obtenerPorMesa(mesaId));
    }

    @PostMapping("/abrir")
    public ResponseEntity<PedidoResponse> abrir(@RequestBody Map<String, Long> body) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(service.abrirPedido(body.get("mesaId"), body.get("meseroId")));
    }

    @PostMapping("/{id}/items")
    public ResponseEntity<PedidoResponse> agregarItem(@PathVariable Long id,
                                                       @Valid @RequestBody ItemPedidoRequest req) {
        return ResponseEntity.ok(service.agregarItem(id, req));
    }

    @DeleteMapping("/{pedidoId}/items/{itemId}")
    public ResponseEntity<PedidoResponse> eliminarItem(@PathVariable Long pedidoId,
                                                        @PathVariable Long itemId) {
        return ResponseEntity.ok(service.eliminarItem(pedidoId, itemId));
    }

    @PostMapping("/{id}/enviar")
    public ResponseEntity<PedidoResponse> enviarAEstaciones(@PathVariable Long id) {
        return ResponseEntity.ok(service.enviarAEstaciones(id));
    }
}

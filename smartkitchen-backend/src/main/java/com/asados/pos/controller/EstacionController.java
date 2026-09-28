package com.asados.pos.controller;

import com.asados.pos.dto.pedido.EstacionCardResponse;
import com.asados.pos.enums.Estacion;
import com.asados.pos.service.PedidoService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/estaciones")
@RequiredArgsConstructor
public class EstacionController {

    private final PedidoService pedidoService;

    @GetMapping("/cocina")
    @PreAuthorize("hasAnyRole('COCINA','ADMIN','MESERO')")
    public ResponseEntity<List<EstacionCardResponse>> cocina() {
        return ResponseEntity.ok(pedidoService.obtenerCardsEstacion(Estacion.COCINA));
    }

    @GetMapping("/barra")
    @PreAuthorize("hasAnyRole('BARRA','ADMIN','MESERO')")
    public ResponseEntity<List<EstacionCardResponse>> barra() {
        return ResponseEntity.ok(pedidoService.obtenerCardsEstacion(Estacion.BARRA));
    }

    @GetMapping("/mexico")
    @PreAuthorize("hasAnyRole('MEXICO','ADMIN','MESERO')")
    public ResponseEntity<List<EstacionCardResponse>> mexico() {
        return ResponseEntity.ok(pedidoService.obtenerCardsEstacion(Estacion.MEXICO));
    }

    @PostMapping("/items/{itemId}/listo")
    @PreAuthorize("hasAnyRole('COCINA','BARRA','MEXICO','ADMIN')")
    public ResponseEntity<Void> marcarListo(@PathVariable Long itemId) {
        pedidoService.marcarItemListo(itemId);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/pedidos/{pedidoId}/listo-todo")
    @PreAuthorize("hasAnyRole('COCINA','BARRA','MEXICO','ADMIN')")
    public ResponseEntity<Void> marcarTodaLaMesa(@PathVariable Long pedidoId,
                                                  @RequestParam String estacion) {
        pedidoService.marcarTodaLaMesa(pedidoId, Estacion.valueOf(estacion.toUpperCase()));
        return ResponseEntity.ok().build();
    }

    @PostMapping("/items/{itemId}/entregado")
    @PreAuthorize("hasAnyRole('MESERO','ADMIN')")
    public ResponseEntity<Void> marcarEntregado(@PathVariable Long itemId) {
        pedidoService.marcarItemEntregado(itemId);
        return ResponseEntity.ok().build();
    }
}

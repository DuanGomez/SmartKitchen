package com.asados.pos.controller;

import com.asados.pos.dto.factura.FacturaRequest;
import com.asados.pos.dto.factura.FacturaResponse;
import com.asados.pos.service.FacturaService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/facturas")
@RequiredArgsConstructor
public class FacturaController {

    private final FacturaService service;

    @PostMapping
    @PreAuthorize("hasAnyRole('CAJA','ADMIN')")
    public ResponseEntity<FacturaResponse> facturar(@Valid @RequestBody FacturaRequest req) {
        return ResponseEntity.status(HttpStatus.CREATED).body(service.facturar(req));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('CAJA','ADMIN')")
    public ResponseEntity<FacturaResponse> obtener(@PathVariable Long id) {
        return ResponseEntity.ok(service.obtener(id));
    }

    @GetMapping("/pedido/{pedidoId}")
    @PreAuthorize("hasAnyRole('CAJA','ADMIN')")
    public ResponseEntity<FacturaResponse> porPedido(@PathVariable Long pedidoId) {
        return ResponseEntity.ok(service.obtenerPorPedido(pedidoId));
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('CAJA','ADMIN')")
    public ResponseEntity<List<FacturaResponse>> listar(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate desde,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate hasta) {
        return ResponseEntity.ok(service.listarPorFecha(
                desde.atStartOfDay(), hasta.atTime(23, 59, 59)));
    }

    @GetMapping("/total-dia")
    @PreAuthorize("hasAnyRole('CAJA','ADMIN')")
    public ResponseEntity<Map<String, BigDecimal>> totalDia(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fecha) {
        LocalDate dia = fecha != null ? fecha : LocalDate.now();
        BigDecimal total = service.totalVentasDia(dia.atStartOfDay(), dia.atTime(23, 59, 59));
        return ResponseEntity.ok(Map.of("total", total));
    }
}

package com.asados.pos.dto.pedido;

import com.asados.pos.enums.EstadoItem;
import com.asados.pos.enums.Estacion;
import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
public class ItemPedidoResponse {
    private Long id;
    private Long productoId;
    private String productoNombre;
    private String productoImagen;
    private Estacion estacion;
    private Integer cantidad;
    private String observacion;
    private BigDecimal precioUnitario;
    private BigDecimal subtotal;
    private EstadoItem estado;
    private LocalDateTime fechaEnvio;
    private boolean bloqueado;
}

package com.asados.pos.dto.pedido;

import com.asados.pos.enums.Estacion;
import lombok.Data;
import java.time.LocalDateTime;
import java.util.List;

@Data
public class EstacionCardResponse {
    private Long pedidoId;
    private Integer mesaNumero;
    private String meseroNombre;
    private Estacion estacion;
    private LocalDateTime fechaEnvio;
    private List<ItemCardDTO> items;

    @Data
    public static class ItemCardDTO {
        private Long itemId;
        private String productoNombre;
        private Integer cantidad;
        private String observacion;
        private String estado;
    }
}

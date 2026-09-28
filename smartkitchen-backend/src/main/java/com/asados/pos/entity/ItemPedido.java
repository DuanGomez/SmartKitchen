package com.asados.pos.entity;

import com.asados.pos.enums.EstadoItem;
import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "items_pedido")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class ItemPedido {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "pedido_id", nullable = false)
    private Pedido pedido;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "producto_id", nullable = false)
    private Producto producto;

    @Column(nullable = false)
    private Integer cantidad;

    private String observacion;

    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal precioUnitario;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private EstadoItem estado = EstadoItem.PENDIENTE;

    // momento en que se envió a la estación (cocina/barra/mexico)
    private LocalDateTime fechaEnvio;

    // true cuando han pasado ≥2 min desde fechaEnvio y estado != PENDIENTE
    @Column(nullable = false)
    @Builder.Default
    private boolean bloqueado = false;
}

package com.asados.pos.enums;

public enum EstadoItem {
    PENDIENTE,   // agregado al pedido, aún no enviado a estación
    ENVIADO,     // enviado a cocina/barra/mexico (inicia el contador de 2 min)
    LISTO,       // la estación marcó como realizado
    ENTREGADO    // el mesero lo entregó a la mesa
}

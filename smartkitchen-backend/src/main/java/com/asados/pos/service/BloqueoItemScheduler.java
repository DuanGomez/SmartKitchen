package com.asados.pos.service;

import com.asados.pos.entity.ItemPedido;
import com.asados.pos.repository.ItemPedidoRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Component
@RequiredArgsConstructor
public class BloqueoItemScheduler {

    private final ItemPedidoRepository itemRepo;

    // cada 30 segundos revisa items que deben bloquearse
    @Scheduled(fixedDelay = 30_000)
    @Transactional
    public void bloquearItems() {
        LocalDateTime limite = LocalDateTime.now().minusMinutes(2);
        List<ItemPedido> items = itemRepo.findItemsParaBloquear(limite);
        if (!items.isEmpty()) {
            items.forEach(i -> i.setBloqueado(true));
            itemRepo.saveAll(items);
        }
    }
}

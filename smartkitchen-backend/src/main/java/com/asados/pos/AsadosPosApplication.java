package com.asados.pos;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class AsadosPosApplication {
    public static void main(String[] args) {
        SpringApplication.run(AsadosPosApplication.class, args);
    }
}

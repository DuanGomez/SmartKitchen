package com.asados.pos.config;

import com.asados.pos.entity.Categoria;
import com.asados.pos.entity.Mesa;
import com.asados.pos.entity.Producto;
import com.asados.pos.entity.Usuario;
import com.asados.pos.enums.Estacion;
import com.asados.pos.enums.Rol;
import com.asados.pos.repository.CategoriaRepository;
import com.asados.pos.repository.MesaRepository;
import com.asados.pos.repository.ProductoRepository;
import com.asados.pos.repository.UsuarioRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.util.List;

@Component
@RequiredArgsConstructor
@Slf4j
public class DataInitializer implements CommandLineRunner {

    private final UsuarioRepository usuarioRepo;
    private final CategoriaRepository catRepo;
    private final ProductoRepository prodRepo;
    private final MesaRepository mesaRepo;
    private final PasswordEncoder encoder;

    private static final String PASSWORD = "asados123";

    @Override
    public void run(String... args) {
        crearUsuarios();
        crearMesas();
        crearCategorias();
        crearProductos();
        log.info("✅ Datos iniciales cargados correctamente.");
    }

    private void crearUsuarios() {
        List.of(
            new String[]{"Administrador",    "admin",   "ADMIN"},
            new String[]{"Mesero 1",         "mesero1", "MESERO"},
            new String[]{"Mesero 2",         "mesero2", "MESERO"},
            new String[]{"Cajero",           "caja",    "CAJA"},
            new String[]{"Cocinero",         "cocina",  "COCINA"},
            new String[]{"Bartender",        "barra",   "BARRA"},
            new String[]{"Cocina México",    "mexico",  "MEXICO"}
        ).forEach(u -> {
            if (usuarioRepo.findByUsername(u[1]).isPresent()) return;
            usuarioRepo.save(Usuario.builder()
                    .nombre(u[0])
                    .username(u[1])
                    .password(encoder.encode(PASSWORD))
                    .rol(Rol.valueOf(u[2]))
                    .activo(true)
                    .build());
            log.info("  👤 Usuario creado: {} ({})", u[1], u[2]);
        });
    }

    private void crearMesas() {
        int[][] mesas = {
            {1,4},{2,4},{3,4},{4,6},{5,6},
            {6,4},{7,4},{8,2},{9,2},{10,8},{11,4},{12,4}
        };
        for (int[] m : mesas) {
            if (mesaRepo.findByNumero(m[0]).isEmpty()) {
                mesaRepo.save(Mesa.builder()
                        .numero(m[0])
                        .nombre("Mesa " + String.format("%02d", m[0]))
                        .capacidad(m[1])
                        .build());
            }
        }
        log.info("  🪑 Mesas verificadas.");
    }

    private void crearCategorias() {
        List.of(
            new Object[]{"Carnes a la Brasa",   "Asados y parrilladas",       Estacion.COCINA},
            new Object[]{"Entradas",             "Aperitivos y entradas",      Estacion.COCINA},
            new Object[]{"Acompañamientos",      "Sides y guarniciones",       Estacion.COCINA},
            new Object[]{"Bebidas Frías",        "Jugos, limonadas, gaseosas", Estacion.BARRA},
            new Object[]{"Bebidas Calientes",    "Café y tés",                 Estacion.BARRA},
            new Object[]{"Cócteles",             "Cócteles y licores",         Estacion.BARRA},
            new Object[]{"Tacos y Burritos",     "Comida mexicana",            Estacion.MEXICO},
            new Object[]{"Antojitos Mexicanos",  "Nachos, quesadillas y más",  Estacion.MEXICO}
        ).forEach(c -> {
            if (!catRepo.existsByNombre((String) c[0])) {
                catRepo.save(Categoria.builder()
                        .nombre((String) c[0])
                        .descripcion((String) c[1])
                        .estacion((Estacion) c[2])
                        .activo(true)
                        .build());
            }
        });
        log.info("  📂 Categorías verificadas.");
    }

    private void crearProductos() {
        if (prodRepo.count() > 0) return;

        Categoria carnes  = catRepo.findAll().stream().filter(c -> c.getNombre().equals("Carnes a la Brasa")).findFirst().orElse(null);
        Categoria entradas= catRepo.findAll().stream().filter(c -> c.getNombre().equals("Entradas")).findFirst().orElse(null);
        Categoria acomp   = catRepo.findAll().stream().filter(c -> c.getNombre().equals("Acompañamientos")).findFirst().orElse(null);
        Categoria bFrias  = catRepo.findAll().stream().filter(c -> c.getNombre().equals("Bebidas Frías")).findFirst().orElse(null);
        Categoria tacos   = catRepo.findAll().stream().filter(c -> c.getNombre().equals("Tacos y Burritos")).findFirst().orElse(null);
        Categoria antojitos = catRepo.findAll().stream().filter(c -> c.getNombre().equals("Antojitos Mexicanos")).findFirst().orElse(null);

        if (carnes != null) {
            saveProducto("Churrasco",          45000, "Corte de res a la brasa 300g",          carnes);
            saveProducto("Costilla BBQ",       52000, "Costilla de cerdo en salsa BBQ",         carnes);
            saveProducto("Pechuga a la Brasa", 32000, "Pechuga de pollo marinada",              carnes);
        }
        if (entradas != null) {
            saveProducto("Chorizo Parrillero", 18000, "Chorizo artesanal a la brasa x2",       entradas);
            saveProducto("Morcilla",           15000, "Morcilla criolla a la brasa x2",         entradas);
        }
        if (acomp != null) {
            saveProducto("Papas Fritas",       12000, "Papas en bastones crujientes",           acomp);
            saveProducto("Yuca Frita",         10000, "Yuca dorada y crujiente",                acomp);
        }
        if (bFrias != null) {
            saveProducto("Limonada Natural",    8000, "Limonada fresca exprimida",              bFrias);
            saveProducto("Jugo de Mango",       9000, "Jugo natural de mango",                  bFrias);
            saveProducto("Gaseosa",             5000, "Coca-Cola, Sprite o Fanta",              bFrias);
            saveProducto("Agua Mineral",        4000, "Con o sin gas",                          bFrias);
        }
        if (tacos != null) {
            saveProducto("Taco de Carne",      14000, "Taco con guacamole y pico de gallo",    tacos);
            saveProducto("Taco de Pollo",      12000, "Pollo marinado con cilantro",            tacos);
        }
        if (antojitos != null) {
            saveProducto("Nachos con Queso",   18000, "Nachos con queso fundido y jalapeños",  antojitos);
            saveProducto("Quesadilla",         16000, "Queso y pollo",                          antojitos);
        }
        log.info("  🍖 Productos verificados.");
    }

    private void saveProducto(String nombre, int precio, String desc, Categoria cat) {
        prodRepo.save(Producto.builder()
                .nombre(nombre)
                .precio(BigDecimal.valueOf(precio))
                .descripcion(desc)
                .categoria(cat)
                .activo(true)
                .build());
    }
}

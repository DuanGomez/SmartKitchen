-- ============================================================
-- Datos iniciales - solo se insertan si no existen
-- Passwords: todos usan BCrypt de "asados123"
-- $2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LnbTpR7D9uq
-- ============================================================

-- USUARIOS
INSERT INTO usuarios (nombre, username, password, rol, activo)
SELECT 'Administrador', 'admin', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LnbTpR7D9uq', 'ADMIN', true
WHERE NOT EXISTS (SELECT 1 FROM usuarios WHERE username = 'admin');

INSERT INTO usuarios (nombre, username, password, rol, activo)
SELECT 'Mesero 1', 'mesero1', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LnbTpR7D9uq', 'MESERO', true
WHERE NOT EXISTS (SELECT 1 FROM usuarios WHERE username = 'mesero1');

INSERT INTO usuarios (nombre, username, password, rol, activo)
SELECT 'Mesero 2', 'mesero2', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LnbTpR7D9uq', 'MESERO', true
WHERE NOT EXISTS (SELECT 1 FROM usuarios WHERE username = 'mesero2');

INSERT INTO usuarios (nombre, username, password, rol, activo)
SELECT 'Cajero', 'caja', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LnbTpR7D9uq', 'CAJA', true
WHERE NOT EXISTS (SELECT 1 FROM usuarios WHERE username = 'caja');

INSERT INTO usuarios (nombre, username, password, rol, activo)
SELECT 'Cocinero Principal', 'cocina', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LnbTpR7D9uq', 'COCINA', true
WHERE NOT EXISTS (SELECT 1 FROM usuarios WHERE username = 'cocina');

INSERT INTO usuarios (nombre, username, password, rol, activo)
SELECT 'Bartender', 'barra', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LnbTpR7D9uq', 'BARRA', true
WHERE NOT EXISTS (SELECT 1 FROM usuarios WHERE username = 'barra');

INSERT INTO usuarios (nombre, username, password, rol, activo)
SELECT 'Cocina México', 'mexico', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LnbTpR7D9uq', 'MEXICO', true
WHERE NOT EXISTS (SELECT 1 FROM usuarios WHERE username = 'mexico');

-- MESAS (12 mesas fijas)
INSERT INTO mesas (numero, nombre, capacidad, estado)
SELECT 1, 'Mesa 01', 4, 'DISPONIBLE' WHERE NOT EXISTS (SELECT 1 FROM mesas WHERE numero = 1);
INSERT INTO mesas (numero, nombre, capacidad, estado)
SELECT 2, 'Mesa 02', 4, 'DISPONIBLE' WHERE NOT EXISTS (SELECT 1 FROM mesas WHERE numero = 2);
INSERT INTO mesas (numero, nombre, capacidad, estado)
SELECT 3, 'Mesa 03', 4, 'DISPONIBLE' WHERE NOT EXISTS (SELECT 1 FROM mesas WHERE numero = 3);
INSERT INTO mesas (numero, nombre, capacidad, estado)
SELECT 4, 'Mesa 04', 6, 'DISPONIBLE' WHERE NOT EXISTS (SELECT 1 FROM mesas WHERE numero = 4);
INSERT INTO mesas (numero, nombre, capacidad, estado)
SELECT 5, 'Mesa 05', 6, 'DISPONIBLE' WHERE NOT EXISTS (SELECT 1 FROM mesas WHERE numero = 5);
INSERT INTO mesas (numero, nombre, capacidad, estado)
SELECT 6, 'Mesa 06', 4, 'DISPONIBLE' WHERE NOT EXISTS (SELECT 1 FROM mesas WHERE numero = 6);
INSERT INTO mesas (numero, nombre, capacidad, estado)
SELECT 7, 'Mesa 07', 4, 'DISPONIBLE' WHERE NOT EXISTS (SELECT 1 FROM mesas WHERE numero = 7);
INSERT INTO mesas (numero, nombre, capacidad, estado)
SELECT 8, 'Mesa 08', 2, 'DISPONIBLE' WHERE NOT EXISTS (SELECT 1 FROM mesas WHERE numero = 8);
INSERT INTO mesas (numero, nombre, capacidad, estado)
SELECT 9, 'Mesa 09', 2, 'DISPONIBLE' WHERE NOT EXISTS (SELECT 1 FROM mesas WHERE numero = 9);
INSERT INTO mesas (numero, nombre, capacidad, estado)
SELECT 10, 'Mesa 10', 8, 'DISPONIBLE' WHERE NOT EXISTS (SELECT 1 FROM mesas WHERE numero = 10);
INSERT INTO mesas (numero, nombre, capacidad, estado)
SELECT 11, 'Mesa 11', 4, 'DISPONIBLE' WHERE NOT EXISTS (SELECT 1 FROM mesas WHERE numero = 11);
INSERT INTO mesas (numero, nombre, capacidad, estado)
SELECT 12, 'Mesa 12', 4, 'DISPONIBLE' WHERE NOT EXISTS (SELECT 1 FROM mesas WHERE numero = 12);

-- CATEGORÍAS
INSERT INTO categorias (nombre, descripcion, estacion, activo)
SELECT 'Carnes a la Brasa', 'Asados y parrilladas', 'COCINA', true
WHERE NOT EXISTS (SELECT 1 FROM categorias WHERE nombre = 'Carnes a la Brasa');

INSERT INTO categorias (nombre, descripcion, estacion, activo)
SELECT 'Entradas', 'Entradas y aperitivos', 'COCINA', true
WHERE NOT EXISTS (SELECT 1 FROM categorias WHERE nombre = 'Entradas');

INSERT INTO categorias (nombre, descripcion, estacion, activo)
SELECT 'Acompañamientos', 'Sides y guarniciones', 'COCINA', true
WHERE NOT EXISTS (SELECT 1 FROM categorias WHERE nombre = 'Acompañamientos');

INSERT INTO categorias (nombre, descripcion, estacion, activo)
SELECT 'Bebidas Frías', 'Jugos, limonadas y gaseosas', 'BARRA', true
WHERE NOT EXISTS (SELECT 1 FROM categorias WHERE nombre = 'Bebidas Frías');

INSERT INTO categorias (nombre, descripcion, estacion, activo)
SELECT 'Bebidas Calientes', 'Café y tés', 'BARRA', true
WHERE NOT EXISTS (SELECT 1 FROM categorias WHERE nombre = 'Bebidas Calientes');

INSERT INTO categorias (nombre, descripcion, estacion, activo)
SELECT 'Cócteles', 'Cócteles y licores', 'BARRA', true
WHERE NOT EXISTS (SELECT 1 FROM categorias WHERE nombre = 'Cócteles');

INSERT INTO categorias (nombre, descripcion, estacion, activo)
SELECT 'Tacos y Burritos', 'Comida mexicana', 'MEXICO', true
WHERE NOT EXISTS (SELECT 1 FROM categorias WHERE nombre = 'Tacos y Burritos');

INSERT INTO categorias (nombre, descripcion, estacion, activo)
SELECT 'Antojitos Mexicanos', 'Nachos, quesadillas y más', 'MEXICO', true
WHERE NOT EXISTS (SELECT 1 FROM categorias WHERE nombre = 'Antojitos Mexicanos');

-- PRODUCTOS (ejemplos representativos)
INSERT INTO productos (nombre, precio, descripcion, categoria_id, activo)
SELECT 'Churrasco', 45000, 'Corte de res a la brasa 300g', c.id, true
FROM categorias c WHERE c.nombre = 'Carnes a la Brasa'
AND NOT EXISTS (SELECT 1 FROM productos WHERE nombre = 'Churrasco');

INSERT INTO productos (nombre, precio, descripcion, categoria_id, activo)
SELECT 'Costilla BBQ', 52000, 'Costilla de cerdo en salsa BBQ artesanal', c.id, true
FROM categorias c WHERE c.nombre = 'Carnes a la Brasa'
AND NOT EXISTS (SELECT 1 FROM productos WHERE nombre = 'Costilla BBQ');

INSERT INTO productos (nombre, precio, descripcion, categoria_id, activo)
SELECT 'Pechuga a la Plancha', 32000, 'Pechuga de pollo marinada a la brasa', c.id, true
FROM categorias c WHERE c.nombre = 'Carnes a la Brasa'
AND NOT EXISTS (SELECT 1 FROM productos WHERE nombre = 'Pechuga a la Plancha');

INSERT INTO productos (nombre, precio, descripcion, categoria_id, activo)
SELECT 'Chorizo Parrillero', 18000, 'Chorizo artesanal a la brasa x2', c.id, true
FROM categorias c WHERE c.nombre = 'Entradas'
AND NOT EXISTS (SELECT 1 FROM productos WHERE nombre = 'Chorizo Parrillero');

INSERT INTO productos (nombre, precio, descripcion, categoria_id, activo)
SELECT 'Morcilla', 15000, 'Morcilla criolla a la brasa x2', c.id, true
FROM categorias c WHERE c.nombre = 'Entradas'
AND NOT EXISTS (SELECT 1 FROM productos WHERE nombre = 'Morcilla');

INSERT INTO productos (nombre, precio, descripcion, categoria_id, activo)
SELECT 'Papas Fritas', 12000, 'Papas en bastones crujientes', c.id, true
FROM categorias c WHERE c.nombre = 'Acompañamientos'
AND NOT EXISTS (SELECT 1 FROM productos WHERE nombre = 'Papas Fritas');

INSERT INTO productos (nombre, precio, descripcion, categoria_id, activo)
SELECT 'Yuca Frita', 10000, 'Yuca dorada y crujiente', c.id, true
FROM categorias c WHERE c.nombre = 'Acompañamientos'
AND NOT EXISTS (SELECT 1 FROM productos WHERE nombre = 'Yuca Frita');

INSERT INTO productos (nombre, precio, descripcion, categoria_id, activo)
SELECT 'Limonada Natural', 8000, 'Limonada fresca exprimida', c.id, true
FROM categorias c WHERE c.nombre = 'Bebidas Frías'
AND NOT EXISTS (SELECT 1 FROM productos WHERE nombre = 'Limonada Natural');

INSERT INTO productos (nombre, precio, descripcion, categoria_id, activo)
SELECT 'Jugo de Mango', 9000, 'Jugo natural de mango', c.id, true
FROM categorias c WHERE c.nombre = 'Bebidas Frías'
AND NOT EXISTS (SELECT 1 FROM productos WHERE nombre = 'Jugo de Mango');

INSERT INTO productos (nombre, precio, descripcion, categoria_id, activo)
SELECT 'Gaseosa', 5000, 'Coca-Cola, Sprite o Fanta', c.id, true
FROM categorias c WHERE c.nombre = 'Bebidas Frías'
AND NOT EXISTS (SELECT 1 FROM productos WHERE nombre = 'Gaseosa');

INSERT INTO productos (nombre, precio, descripcion, categoria_id, activo)
SELECT 'Agua Mineral', 4000, 'Agua con o sin gas', c.id, true
FROM categorias c WHERE c.nombre = 'Bebidas Frías'
AND NOT EXISTS (SELECT 1 FROM productos WHERE nombre = 'Agua Mineral');

INSERT INTO productos (nombre, precio, descripcion, categoria_id, activo)
SELECT 'Taco de Carne', 14000, 'Taco de res con guacamole y pico de gallo', c.id, true
FROM categorias c WHERE c.nombre = 'Tacos y Burritos'
AND NOT EXISTS (SELECT 1 FROM productos WHERE nombre = 'Taco de Carne');

INSERT INTO productos (nombre, precio, descripcion, categoria_id, activo)
SELECT 'Taco de Pollo', 12000, 'Taco de pollo marinado con cilantro', c.id, true
FROM categorias c WHERE c.nombre = 'Tacos y Burritos'
AND NOT EXISTS (SELECT 1 FROM productos WHERE nombre = 'Taco de Pollo');

INSERT INTO productos (nombre, precio, descripcion, categoria_id, activo)
SELECT 'Nachos con Queso', 18000, 'Nachos crujientes con queso fundido y jalapeños', c.id, true
FROM categorias c WHERE c.nombre = 'Antojitos Mexicanos'
AND NOT EXISTS (SELECT 1 FROM productos WHERE nombre = 'Nachos con Queso');

INSERT INTO productos (nombre, precio, descripcion, categoria_id, activo)
SELECT 'Quesadilla', 16000, 'Quesadilla de queso y pollo', c.id, true
FROM categorias c WHERE c.nombre = 'Antojitos Mexicanos'
AND NOT EXISTS (SELECT 1 FROM productos WHERE nombre = 'Quesadilla');

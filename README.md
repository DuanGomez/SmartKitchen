# SmartKitchen — POS para restaurantes

Diseñado y desarrollado por **[Dcodea](https://www.instagram.com/dcod.ea/)**.

Sistema de punto de venta para restaurantes de asados: los meseros toman pedidos por
mesa, cada producto llega a su estación (cocina, barra o cocina mexicana), el mesero
entrega lo que la estación marca como listo y la caja factura con propina opcional.

**Demo en vivo:** cada push a `main` publica el frontend en GitHub Pages en **modo demo**:
la API se simula en el navegador con la misma lógica del backend y los datos se guardan
en `localStorage`. En la pantalla de login hay accesos rápidos por rol.

| Usuario | Rol | Contraseña |
|---|---|---|
| admin | Administrador | `asados123` |
| mesero1 / mesero2 | Mesero | `asados123` |
| cocina · barra · mexico | Estaciones | `asados123` |
| caja | Caja | `asados123` |

## Stack

- **Frontend:** Angular 21 (standalone, signals), Chart.js, diseño con el ADN visual de Dcodea.
- **Backend:** Spring Boot 3.3 (Java 17+), Spring Security + JWT, JPA/Hibernate, PostgreSQL.

## Flujo

1. **Mesero** abre una mesa, agrega productos y los envía a las estaciones.
   Un ítem enviado se puede anular durante 2 minutos; después queda bloqueado.
2. **Estaciones** ven solo lo suyo (por categoría) y marcan cada ítem o la mesa completa como lista.
3. **Mesero** entrega los ítems listos.
4. **Caja** factura con servicio de 0 %, 5 % o 10 % y el método de pago; la mesa queda libre.
5. **Admin** gestiona productos (con foto), categorías por estación y usuarios. Los productos o
   usuarios con historial se desactivan en lugar de borrarse.

## Ejecutar en local

### Solo frontend (modo demo)

```bash
cd smartkitchen-frontend
npm install
npm start               # http://localhost:4200 — API simulada
```

### Frontend + API real

Requisitos: Java 17+, Maven y PostgreSQL con una base `asados_pos`.

```bash
cd smartkitchen-backend
# Credenciales por variables de entorno (valores por defecto: postgres/postgres)
set DB_PASSWORD=tu_contraseña        # PowerShell: $env:DB_PASSWORD="..."
mvn spring-boot:run                  # http://localhost:8080 — crea tablas y datos iniciales

cd ../smartkitchen-frontend
npm run start:api                    # http://localhost:4200 contra la API local
```

Variables disponibles: `DB_URL`, `DB_USERNAME`, `DB_PASSWORD`, `JWT_SECRET`, `CORS_ORIGINS`, `PORT`, `UPLOAD_DIR`.

## Despliegue en GitHub Pages

1. Sube el repositorio a GitHub.
2. **Settings → Pages → Source: GitHub Actions** (no uses las plantillas "Jekyll" ni "Static HTML").
3. Cada push a `main` ejecuta `.github/workflows/deploy-pages.yml`.

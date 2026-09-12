# THEJA

Sistema web de gestión comercial para **Logística Andina S.A.S.** (Proyecto ACA - Corte 3, Opción B: Entorno Web).

Permite registrar ventas, controlar inventario, procesar datos masivos y visualizar indicadores de gestión en un tablero de mando (Dashboard). Los datos se almacenan en una base de datos relacional **SQLite**.

## Tecnologías

- **Backend:** Node.js + Express (API REST)
- **Base de datos:** SQLite (`node:sqlite`, sin dependencias nativas) en `database/theja.db`
- **Frontend:** HTML5 + CSS + JavaScript, Bootstrap 5 y Chart.js (archivos locales en `public/vendor/`, sin CDN)

## Requisitos

- Node.js **22.5 o superior** (incluye `node:sqlite`)

## Instalación y ejecución

```bash
npm install      # instala Express (solo la primera vez)
npm start        # inicia el servidor
```

Luego abrir el navegador en: **http://localhost:3000**

> **Importante:** no usar la extensión "Live Server" de VS Code para abrir la aplicación. THEJA necesita su
> propio servidor (arrancado con `npm start`) porque los formularios y el Dashboard consultan la API REST;
> con Live Server (puerto 5500) las páginas se abren sin servicios y la aplicación falla.

La base de datos se crea **vacía** en la primera ejecución (sin productos, empleados ni ventas; todo se
registra manualmente desde la aplicación). `database/seed.sql` contiene datos de ejemplo **opcionales** que no
se aplican solos. Para reconstruir la base desde cero:

```bash
npm run init -- --reset
```

## Estructura del proyecto

```
THEJA/
├── server.js              # Servidor Express
├── database/
│   ├── schema.sql         # Esquema de tablas
│   ├── seed.sql           # Datos de ejemplo opcionales (no se aplican solos)
│   └── theja.db           # Base de datos SQLite (autogenerada)
├── src/
│   ├── db.js              # Conexión e inicialización de SQLite
│   ├── api.js             # Endpoints REST
│   ├── pipeline.js        # Módulo de procesamiento (limpieza/transformación)
│   └── init.js            # Script de inicialización
├── public/                # Interfaz web
│   ├── index.html         # Dashboard (KPIs y gráficos)
│   ├── ventas.html        # Registro de ventas
│   ├── inventario.html    # Productos y movimientos de stock
│   ├── procesamiento.html # Carga CSV y limpieza de datos
│   ├── empleados.html     # Desempeño del personal
│   └── manual.html        # Manual técnico y de usuario
└── documentacion/         # Manual técnico y de usuario (con capturas de pantalla)
    └── capturas/          # Imágenes del manual
```

## Módulos y funcionalidades

1. **Ingreso de datos:** formularios para registrar ventas, productos y movimientos de inventario sin acceder a la base de datos directamente (solo vía API).
2. **Procesamiento:** carga masiva en CSV, validación (producto, cantidad, stock, precio), normalización de fechas y transformación a ventas válidas.
3. **Tablero de mando:** indicadores de gestión (ventas totales, producto más vendido, rotación de inventario, transacciones y stock bajo) con gráficos dinámicos.

## API REST principal

| Método | Endpoint                | Descripción                          |
|--------|-------------------------|--------------------------------------|
| GET    | `/api/resumen`          | KPIs del Dashboard                   |
| GET    | `/api/productos`        | Catálogo de productos                |
| POST   | `/api/productos`        | Crear producto                       |
| GET    | `/api/ventas`           | Listar ventas                        |
| POST   | `/api/ventas`           | Registrar venta (descuenta stock)    |
| GET    | `/api/inventario`       | Estado del inventario                |
| POST   | `/api/movimientos`      | Entrada/salida de mercancía          |
| GET    | `/api/empleados`        | Empleados y desempeño                |
| POST   | `/api/empleados`        | Registrar empleado                   |
| GET    | `/api/crudos`           | Datos pendientes y procesados        |
| POST   | `/api/crudos/cargar`    | Cargar filas CSV                     |
| POST   | `/api/procesar`         | Ejecutar limpieza y transformación   |

## Manuales

- Manual de usuario y especificaciones técnicas: abrir la pestaña **Manual** dentro de la aplicación o los documentos en `documentacion/`.
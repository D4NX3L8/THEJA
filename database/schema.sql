-- THEJA - Esquema de base de datos (SQLite)
-- Sistema de gestión para Logística Andina S.A.S.

PRAGMA foreign_keys = ON;

-- Catálogo de productos
CREATE TABLE IF NOT EXISTS productos (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    nombre          TEXT    NOT NULL UNIQUE,
    categoria       TEXT,
    unidad          TEXT    NOT NULL DEFAULT 'unidad',
    precio_venta    REAL    NOT NULL,
    costo           REAL    NOT NULL DEFAULT 0,
    stock_actual    INTEGER NOT NULL DEFAULT 0,
    stock_seguridad INTEGER NOT NULL DEFAULT 0,
    activo          INTEGER NOT NULL DEFAULT 1,
    creado_en       TEXT    NOT NULL DEFAULT (datetime('now', 'localtime'))
);

-- Empleados (personal / vendedores)
CREATE TABLE IF NOT EXISTS empleados (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    nombre        TEXT NOT NULL,
    cargo         TEXT,
    correo        TEXT,
    telefono      TEXT,
    fecha_ingreso TEXT,
    activo        INTEGER NOT NULL DEFAULT 1
);

-- Registro de ventas
CREATE TABLE IF NOT EXISTS ventas (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    fecha           TEXT    NOT NULL DEFAULT (datetime('now', 'localtime')),
    producto_id     INTEGER NOT NULL REFERENCES productos (id),
    cantidad        INTEGER NOT NULL CHECK (cantidad > 0),
    precio_unitario REAL    NOT NULL,
    total           REAL    NOT NULL,
    cliente         TEXT,
    vendedor_id     INTEGER REFERENCES empleados (id),
    origen          TEXT    NOT NULL DEFAULT 'formulario'
);

-- Movimientos de inventario (entradas y salidas de stock)
CREATE TABLE IF NOT EXISTS movimientos_inventario (
    id           INTEGER PRIMARY KEY AUTOINCREMENT,
    fecha        TEXT    NOT NULL DEFAULT (datetime('now', 'localtime')),
    producto_id  INTEGER NOT NULL REFERENCES productos (id),
    tipo         TEXT    NOT NULL CHECK (tipo IN ('entrada', 'salida')),
    cantidad     INTEGER NOT NULL CHECK (cantidad > 0),
    motivo       TEXT,
    venta_id     INTEGER REFERENCES ventas (id)
);

-- Datos crudos: origen del módulo de procesamiento (limpieza y transformación)
CREATE TABLE IF NOT EXISTS datos_crudos (
    id           INTEGER PRIMARY KEY AUTOINCREMENT,
    fila_original TEXT,
    fecha        TEXT,
    producto     TEXT,
    cantidad     REAL,
    precio       REAL,
    cliente      TEXT,
    vendedor     TEXT,
    estado       TEXT    NOT NULL DEFAULT 'pendiente',  -- pendiente | procesado | error
    log          TEXT
);

CREATE INDEX IF NOT EXISTS idx_ventas_fecha     ON ventas (fecha);
CREATE INDEX IF NOT EXISTS idx_ventas_producto  ON ventas (producto_id);
CREATE INDEX IF NOT EXISTS idx_movimientos_prod ON movimientos_inventario (producto_id);
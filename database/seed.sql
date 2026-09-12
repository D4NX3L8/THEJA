-- THEJA - Datos de ejemplo OPCIONALES
-- NO se aplican automáticamente (la base inicia vacía).
-- Puede ejecutarse manualmente con: node -e "..." o un cliente SQLite.

INSERT INTO productos (nombre, categoria, unidad, precio_venta, costo, stock_actual, stock_seguridad) VALUES
    ('Papel carta (resma)',      'Papelería',      'resma',   12500,  9800,  420, 50),
    ('Lapicero tinta negra',     'Papelería',      'unidad',  1800,   1150,  850, 100),
    ('Carpeta plástica',         'Papelería',      'unidad',  3500,   2400,  600, 80),
    ('Tinta para impresora',     'Consumibles',    'unidad',  78000, 61000,  120, 20),
    ('Resaltador amarillo',      'Papelería',      'unidad',  4200,   2900,  500, 60),
    ('Caja de clips',            'Papelería',      'caja',    2400,   1500,  700, 80),
    ('Perforadora (3 huecos)',   'Artículos',      'unidad',  18800, 14200,  140, 25),
    ('Cuaderno cuadriculado',    'Papelería',      'unidad',  6900,   5200,  380, 50);

INSERT INTO empleados (nombre, cargo, correo, telefono, fecha_ingreso) VALUES
    ('Mariana Rojas',     'Vendedor',     'mariana.rojas@logisticaandina.co', '3001112233', '2023-03-10'),
    ('Carlos Peña',       'Vendedor',     'carlos.pena@logisticaandina.co',   '3002223344', '2022-08-01'),
    ('Laura Gómez',       'Vendedora',    'laura.gomez@logisticaandina.co',   '3003334455', '2024-01-15'),
    ('Andrés Martínez',   'Coordinador',  'andres.martinez@logisticaandina.co','3004445566','2021-06-20');

INSERT INTO ventas (fecha, producto_id, cantidad, precio_unitario, total, cliente, vendedor_id, origen) VALUES
    ('2026-08-03 09:10:00', 1, 20, 12500, 250000, 'Colegio San Gabriel',       1, 'formulario'),
    ('2026-08-04 11:25:00', 3, 15, 3500,  52500,  'Oficina Centro Ltda',       2, 'formulario'),
    ('2026-08-05 14:40:00', 2, 100, 1800, 180000, 'Droguería La Salud',        3, 'formulario'),
    ('2026-08-08 10:05:00', 4, 5, 78000, 390000,  'Imprenta Moderna',          1, 'formulario'),
    ('2026-08-10 16:30:00', 5, 60, 4200, 252000,  'Colegio San Gabriel',       2, 'formulario'),
    ('2026-08-12 09:45:00', 2, 150, 1800, 270000, 'Papelería El Éxito',        3, 'formulario'),
    ('2026-08-15 13:20:00', 6, 40, 2400, 96000,   'Oficina Centro Ltda',       1, 'formulario'),
    ('2026-08-18 15:10:00', 7, 10, 18800, 188000, 'Colegio San Gabriel',       4, 'formulario'),
    ('2026-08-20 10:50:00', 1, 30, 12500, 375000, 'Imprenta Moderna',          3, 'formulario'),
    ('2026-08-22 12:15:00', 8, 25, 6900,  172500, 'Papelería El Éxito',        2, 'formulario'),
    ('2026-08-25 11:00:00', 4, 8, 78000, 624000,  'Droguería La Salud',        1, 'formulario'),
    ('2026-08-27 17:35:00', 5, 80, 4200, 336000,  'Imprenta Moderna',          3, 'formulario'),
    ('2026-09-01 09:20:00', 2, 200, 1800, 360000, 'Papelería El Éxito',        2, 'formulario'),
    ('2026-09-02 10:40:00', 3, 30, 3500, 105000,  'Oficina Centro Ltda',       1, 'formulario'),
    ('2026-09-03 14:05:00', 1, 40, 12500, 500000, 'Colegio San Gabriel',       4, 'formulario'),
    ('2026-09-04 16:25:00', 6, 80, 2400, 192000,  'Droguería La Salud',        3, 'formulario');

INSERT INTO movimientos_inventario (fecha, producto_id, tipo, cantidad, motivo, venta_id) VALUES
    ('2026-08-03 09:10:00', 1, 'salida',  20, 'Venta registrada', 1),
    ('2026-08-04 11:25:00', 3, 'salida',  15, 'Venta registrada', 2),
    ('2026-08-05 14:40:00', 2, 'salida', 100, 'Venta registrada', 3),
    ('2026-08-08 10:05:00', 4, 'salida',   5, 'Venta registrada', 4),
    ('2026-08-10 16:30:00', 5, 'salida',  60, 'Venta registrada', 5),
    ('2026-08-12 09:45:00', 2, 'salida', 150, 'Venta registrada', 6),
    ('2026-08-15 13:20:00', 6, 'salida',  40, 'Venta registrada', 7),
    ('2026-08-18 15:10:00', 7, 'salida',  10, 'Venta registrada', 8),
    ('2026-08-20 10:50:00', 1, 'salida',  30, 'Venta registrada', 9),
    ('2026-08-22 12:15:00', 8, 'salida',  25, 'Venta registrada', 10),
    ('2026-08-25 11:00:00', 4, 'salida',   8, 'Venta registrada', 11),
    ('2026-08-27 17:35:00', 5, 'salida',  80, 'Venta registrada', 12),
    ('2026-09-01 09:20:00', 2, 'salida', 200, 'Venta registrada', 13),
    ('2026-09-02 10:40:00', 3, 'salida',  30, 'Venta registrada', 14),
    ('2026-09-03 14:05:00', 1, 'salida',  40, 'Venta registrada', 15),
    ('2026-09-04 16:25:00', 6, 'salida',  80, 'Venta registrada', 16),
    ('2026-08-20 08:00:00', 1, 'entrada', 200, 'Reabastecimiento mensual', NULL),
    ('2026-08-20 08:05:00', 4, 'entrada',  60, 'Reabastecimiento mensual', NULL),
    ('2026-08-20 08:10:00', 2, 'entrada', 300, 'Reabastecimiento mensual', NULL);
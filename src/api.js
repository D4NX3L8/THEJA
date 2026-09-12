'use strict';

const express = require('express');
const { getDb } = require('./db');
const pipeline = require('./pipeline');
const { normalizarNumero } = pipeline;

const router = express.Router();
const db = getDb();

const numerico = (v) => {
  if (v === null || v === undefined || v === '') return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
};

const entero = (v) => {
  const n = numerico(v);
  return n !== null && Number.isInteger(n) ? n : null;
};

const hoyISO = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}:${String(d.getSeconds()).padStart(2, '0')}`;
};

// ============================================================
// Dashboard / KPIs
// ============================================================

router.get('/resumen', (req, res) => {
  const s = {};
  s.ventas_totales = db.prepare('SELECT COALESCE(SUM(total),0) AS v FROM ventas').get().v;
  s.num_ventas = db.prepare('SELECT COUNT(*) AS v FROM ventas').get().v;
  s.unidades_vendidas = db.prepare('SELECT COALESCE(SUM(cantidad),0) AS v FROM ventas').get().v;
  s.num_productos = db.prepare('SELECT COUNT(*) AS v FROM productos WHERE activo = 1').get().v;
  s.stock_bajo = db.prepare('SELECT COUNT(*) AS v FROM productos WHERE activo = 1 AND stock_actual <= stock_seguridad').get().v;

  s.producto_mas_vendido = db.prepare(`
    SELECT p.id, p.nombre, SUM(v.cantidad) AS unidades, SUM(v.total) AS total
    FROM ventas v JOIN productos p ON p.id = v.producto_id
    GROUP BY v.producto_id ORDER BY unidades DESC LIMIT 1`).get() || null;

  s.rotacion_inventario = db.prepare(`
    SELECT
      COALESCE(SUM(v.cantidad * p.costo),0) AS costo_vendido,
      COALESCE(SUM(p.stock_actual * p.costo),0) AS inventario_actual,
      CASE WHEN COALESCE(SUM(p.stock_actual * p.costo),0) > 0
           THEN ROUND(SUM(v.cantidad * p.costo) / SUM(p.stock_actual * p.costo), 2)
           ELSE 0 END AS valor
    FROM ventas v JOIN productos p ON p.id = v.producto_id`).get() || { valor: 0 };

  s.vendedor_destacado = db.prepare(`
    SELECT e.id, e.nombre, SUM(v.total) AS total, COUNT(v.id) AS ventas
    FROM ventas v JOIN empleados e ON e.id = v.vendedor_id
    GROUP BY e.id ORDER BY total DESC LIMIT 1`).get() || null;

  s.ventas_por_mes = db.prepare(`
    SELECT strftime('%Y-%m', fecha) AS mes, SUM(total) AS total, COUNT(*) AS ventas
    FROM ventas GROUP BY mes ORDER BY mes ASC`).all();

  s.ventas_por_producto = db.prepare(`
    SELECT p.nombre, SUM(v.cantidad) AS unidades, SUM(v.total) AS total
    FROM ventas v JOIN productos p ON p.id = v.producto_id
    GROUP BY v.producto_id ORDER BY total DESC LIMIT 8`).all();

  s.ventas_por_vendedor = db.prepare(`
    SELECT e.nombre, SUM(v.total) AS total, COUNT(v.id) AS ventas
    FROM ventas v JOIN empleados e ON e.id = v.vendedor_id
    GROUP BY e.id ORDER BY total DESC`).all();

  s.ventas_recientes = db.prepare(`
    SELECT v.id, v.fecha, p.nombre AS producto, v.cantidad, v.total, v.cliente, e.nombre AS vendedor
    FROM ventas v JOIN productos p ON p.id = v.producto_id LEFT JOIN empleados e ON e.id = v.vendedor_id
    ORDER BY v.fecha DESC LIMIT 8`).all();

  res.json(s);
});

// ============================================================
// Productos e inventario
// ============================================================

router.get('/productos', (req, res) => {
  res.json(db.prepare('SELECT * FROM productos WHERE activo = 1 ORDER BY nombre').all());
});

router.post('/productos', (req, res) => {
  const { nombre, categoria = 'General', unidad = 'unidad', precio_venta, costo = 0, stock_inicial = 0, stock_seguridad = 0 } = req.body;
  const pv = numerico(precio_venta);
  const cs = numerico(costo);
  if (!nombre) return res.status(400).json({ error: 'El nombre del producto es obligatorio.' });
  if (pv === null || pv < 0) return res.status(400).json({ error: 'El precio de venta debe ser un número mayor o igual a 0.' });
  if (cs === null || cs < 0) return res.status(400).json({ error: 'El costo debe ser un número mayor o igual a 0.' });
  if (numerico(stock_inicial) < 0 || numerico(stock_seguridad) < 0) {
    return res.status(400).json({ error: 'Los stocks deben ser números mayores o iguales a 0.' });
  }

  try {
    const r = db.prepare(`INSERT INTO productos (nombre, categoria, unidad, precio_venta, costo, stock_actual, stock_seguridad)
                          VALUES (?,?,?,?,?,?,?)`)
      .run(nombre, categoria, unidad, pv, cs, numerico(stock_inicial) || 0, numerico(stock_seguridad) || 0);
    const nuevo = db.prepare('SELECT * FROM productos WHERE id = ?').get(r.lastInsertRowid);
    res.status(201).json(nuevo);
  } catch (e) {
    if (String(e.message).includes('UNIQUE')) return res.status(400).json({ error: `Ya existe un producto llamado "${nombre}".` });
    throw e;
  }
});

router.get('/inventario', (req, res) => {
  const rows = db.prepare(`
    SELECT p.*,
           COALESCE(SUM(CASE WHEN m.tipo = 'entrada' THEN m.cantidad ELSE 0 END),0) AS entradas,
           COALESCE(SUM(CASE WHEN m.tipo = 'salida' THEN m.cantidad ELSE 0 END),0) AS salidas
    FROM productos p LEFT JOIN movimientos_inventario m ON m.producto_id = p.id
    GROUP BY p.id ORDER BY p.nombre`).all();
  res.json(rows);
});

router.get('/movimientos', (req, res) => {
  res.json(db.prepare(`
    SELECT m.*, p.nombre AS producto
    FROM movimientos_inventario m JOIN productos p ON p.id = m.producto_id
    ORDER BY m.fecha DESC LIMIT 30`).all());
});

router.post('/movimientos', (req, res) => {
  const { producto_id, tipo, cantidad, motivo = '' } = req.body;
  const pid = numerico(producto_id);
  const c = entero(cantidad);
  if (pid === null) return res.status(400).json({ error: 'Debe seleccionar un producto.' });
  if (!['entrada', 'salida'].includes(tipo)) return res.status(400).json({ error: 'El tipo debe ser entrada o salida.' });
  if (c === null || c <= 0) return res.status(400).json({ error: 'La cantidad debe ser un número entero mayor a 0.' });

  const prod = db.prepare('SELECT * FROM productos WHERE id = ?').get(pid);
  if (!prod) return res.status(400).json({ error: 'El producto no existe.' });
  if (tipo === 'salida' && c > prod.stock_actual) {
    return res.status(400).json({ error: `Stock insuficiente para ${prod.nombre} (disponible: ${prod.stock_actual}).` });
  }

  db.exec('BEGIN');
  try {
    db.prepare('INSERT INTO movimientos_inventario (producto_id, tipo, cantidad, motivo) VALUES (?,?,?,?)').run(pid, tipo, c, motivo);
    db.prepare(tipo === 'entrada'
      ? 'UPDATE productos SET stock_actual = stock_actual + ? WHERE id = ?'
      : 'UPDATE productos SET stock_actual = stock_actual - ? WHERE id = ?').run(c, pid);
    db.exec('COMMIT');
  } catch (e) {
    db.exec('ROLLBACK');
    throw e;
  }
  res.status(201).json({ ok: true });
});

// ============================================================
// Ventas
// ============================================================

router.get('/ventas', (req, res) => {
  res.json(db.prepare(`
    SELECT v.*, p.nombre AS producto, e.nombre AS vendedor
    FROM ventas v JOIN productos p ON p.id = v.producto_id LEFT JOIN empleados e ON e.id = v.vendedor_id
    ORDER BY v.fecha DESC LIMIT 50`).all());
});

router.post('/ventas', (req, res) => {
  const { producto_id, cantidad, cliente = '', vendedor_id = null, fecha = null } = req.body;
  const pid = numerico(producto_id);
  const c = entero(cantidad);
  const vid = numerico(vendedor_id);
  if (pid === null) return res.status(400).json({ error: 'Debe seleccionar un producto.' });
  if (c === null || c <= 0) return res.status(400).json({ error: 'La cantidad debe ser un número entero mayor a 0.' });

  const prod = db.prepare('SELECT * FROM productos WHERE id = ?').get(pid);
  if (!prod) return res.status(400).json({ error: 'El producto no existe.' });
  if (vid !== null) {
    const emp = db.prepare('SELECT id FROM empleados WHERE id = ?').get(vid);
    if (!emp) return res.status(400).json({ error: 'El vendedor seleccionado no existe.' });
  }
  if (c > prod.stock_actual) {
    return res.status(400).json({ error: `Stock insuficiente para ${prod.nombre} (disponible: ${prod.stock_actual}).` });
  }

  const total = c * prod.precio_venta;
  const f = fecha || hoyISO();

  db.exec('BEGIN');
  try {
    const r = db.prepare(`INSERT INTO ventas (fecha, producto_id, cantidad, precio_unitario, total, cliente, vendedor_id, origen)
                          VALUES (?,?,?,?,?,?,?,'formulario')`).run(f, pid, c, prod.precio_venta, total, cliente, vid);
    const ventaId = r.lastInsertRowid;
    db.prepare('INSERT INTO movimientos_inventario (producto_id, tipo, cantidad, motivo, venta_id) VALUES (?,?,?,?,?)')
      .run(pid, 'salida', c, 'Venta registrada', ventaId);
    db.prepare('UPDATE productos SET stock_actual = stock_actual - ? WHERE id = ?').run(c, pid);
    db.exec('COMMIT');
    res.status(201).json({ id: ventaId, total, producto: prod.nombre });
  } catch (e) {
    db.exec('ROLLBACK');
    throw e;
  }
});

// ============================================================
// Empleados
// ============================================================

router.get('/empleados', (req, res) => {
  res.json(db.prepare(`
    SELECT e.*, COUNT(v.id) AS ventas, COALESCE(SUM(v.total),0) AS total_vendido
    FROM empleados e LEFT JOIN ventas v ON v.vendedor_id = e.id
    GROUP BY e.id ORDER BY e.nombre`).all());
});

router.post('/empleados', (req, res) => {
  const { nombre, cargo = 'Vendedor', correo = '', telefono = '', fecha_ingreso = null } = req.body;
  if (!nombre) return res.status(400).json({ error: 'El nombre es obligatorio.' });
  const r = db.prepare('INSERT INTO empleados (nombre, cargo, correo, telefono, fecha_ingreso) VALUES (?,?,?,?,?)')
    .run(nombre, cargo, correo, telefono, fecha_ingreso || hoyISO().slice(0, 10));
  res.status(201).json({ id: r.lastInsertRowid, nombre });
});

// ============================================================
// Módulo de procesamiento
// ============================================================

router.get('/crudos', (req, res) => {
  const pendientes = db.prepare("SELECT * FROM datos_crudos WHERE estado = 'pendiente' ORDER BY id").all();
  const procesados = db.prepare("SELECT * FROM datos_crudos WHERE estado IN ('procesado','error') ORDER BY id DESC LIMIT 30").all();
  res.json({ pendientes, procesados });
});

router.post('/crudos/cargar', (req, res) => {
  const { filas = [] } = req.body;
  if (!Array.isArray(filas) || filas.length === 0) return res.status(400).json({ error: 'No se recibieron filas para cargar.' });

  const ins = db.prepare('INSERT INTO datos_crudos (fila_original, fecha, producto, cantidad, precio, cliente, vendedor) VALUES (?,?,?,?,?,?,?)');
  const val = (x) => (x === undefined ? null : x);
  db.exec('BEGIN');
  try {
    for (const f of filas) {
      ins.run(JSON.stringify(f), val(f.fecha), val(f.producto), normalizarNumero(f.cantidad), normalizarNumero(f.precio), val(f.cliente), val(f.vendedor));
    }
    db.exec('COMMIT');
  } catch (e) {
    db.exec('ROLLBACK');
    throw e;
  }
  res.status(201).json({ ok: true, insertados: filas.length });
});

router.post('/procesar', (req, res) => {
  const pendientes = db.prepare("SELECT * FROM datos_crudos WHERE estado = 'pendiente' ORDER BY id").all();
  if (pendientes.length === 0) return res.json({ ok: true, procesados: 0, rechazados: 0, mensaje: 'No hay datos pendientes por procesar.' });

  const resultado = pipeline.limpiarYTransformar(pendientes);
  const upd = db.prepare('UPDATE datos_crudos SET estado = ?, log = ? WHERE id = ?');

  db.exec('BEGIN');
  try {
    for (const fila of resultado.exitosas) upd.run('procesado', fila.accion, fila.id);
    for (const fila of resultado.errores) upd.run('error', fila.causa, fila.id);
    db.exec('COMMIT');
  } catch (e) {
    db.exec('ROLLBACK');
    throw e;
  }

  res.json({ ok: true, procesados: resultado.exitosas.length, rechazados: resultado.errores.length, detalles: resultado.detalles });
});

module.exports = router;
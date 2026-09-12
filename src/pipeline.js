'use strict';

const { getDb } = require('./db');

// Módulo de Procesamiento: limpieza y transformación de datos crudos
// que luego se cargan como ventas válidas en la base de datos principal.

const db = getDb();

function normalizarTexto(v) {
  return typeof v === 'string' ? v.trim() : '';
}

function normalizarNumero(v) {
  if (typeof v === 'number') return Number.isFinite(v) ? v : null;
  const original = String(v).trim();
  const negativo = /^[-]/.test(original);
  const limpio = original.replace(/[^0-9.,]/g, '');
  if (!/\d/.test(limpio)) return null;

  // Determina el separador decimal: el último que aparezca cuando hay
  // punto y coma, o el único si no forma un grupo de miles de 3 dígitos.
  let decimal = '';
  if (limpio.includes('.') && limpio.includes(',')) {
    decimal = limpio.lastIndexOf(',') > limpio.lastIndexOf('.') ? ',' : '.';
  } else if (limpio.includes('.')) {
    const partes = limpio.split('.');
    if (partes.length === 2 && partes[1].length !== 3) decimal = '.';
  } else if (limpio.includes(',')) {
    const partes = limpio.split(',');
    if (partes.length === 2 && partes[1].length !== 3) decimal = ',';
  }

  let cuerpo;
  if (decimal) {
    const sep = limpio.split(decimal);
    cuerpo = sep[0].replace(/[.,]/g, '') + '.' + sep[1].replace(/[.,]/g, '');
  } else {
    cuerpo = limpio.replace(/[.,]/g, '');
  }

  const n = Number(cuerpo);
  if (!Number.isFinite(n)) return null;
  return negativo ? -n : n;
}

function normalizarFecha(v) {
  if (!v) return null;
  const texto = String(v).trim();
  const match = texto.match(/^(\d{1,2})[-\/](\d{1,2})[-\/](\d{4})/); // dd/mm/aaaa o dd-mm-aaaa
  if (match) {
    const [, d, m, y] = match;
    return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')} 00:00:00`;
  }
  if (/^\d{4}-\d{2}-\d{2}/.test(texto)) return texto.slice(0, 19).replace('T', ' ');
  return null;
}

function limpiarYTransformar(pendientes) {
  const exitosas = [];
  const errores = [];
  const detalles = [];

  const findProducto = db.prepare('SELECT * FROM productos WHERE LOWER(nombre) = LOWER(?) OR id = ?');
  const findVendedor = db.prepare('SELECT id FROM empleados WHERE LOWER(nombre) = LOWER(?)');

  for (const fila of pendientes) {
    const log = [];
    const causa = [];

    const nombreProd = normalizarTexto(fila.producto);
    if (!nombreProd) {
      errores.push({ id: fila.id, causa: 'Falta el producto.' });
      continue;
    }
    const producto = findProducto.get(nombreProd, normalizarNumero(fila.producto));
    if (!producto) {
      errores.push({ id: fila.id, causa: `Producto desconocido: "${nombreProd}".` });
      continue;
    }
    log.push(`Producto reconocido: ${producto.nombre}`);

    const cantidad = normalizarNumero(fila.cantidad);
    if (cantidad === null || cantidad <= 0 || !Number.isInteger(cantidad)) {
      errores.push({ id: fila.id, causa: `Cantidad inválida: "${fila.cantidad}".` });
      continue;
    }
    log.push(`Cantidad normalizada: ${cantidad}`);

    const precio = normalizarNumero(fila.precio);
    if (precio === null || precio <= 0) {
      errores.push({ id: fila.id, causa: `Precio inválido: "${fila.precio}".` });
      continue;
    }

    if (cantidad > producto.stock_actual) {
      errores.push({ id: fila.id, causa: `Stock insuficiente de ${producto.nombre} (disponible: ${producto.stock_actual}).` });
      continue;
    }

    const vendedor = fila.vendedor ? findVendedor.get(normalizarTexto(fila.vendedor)) : null;
    if (fila.vendedor && !vendedor) {
      causa.push(`vendedor ignorado: "${fila.vendedor}"`);
    }
    if (vendedor) log.push(`Vendedor reconocido: ${fila.vendedor}`);

    const fecha = normalizarFecha(fila.fecha) || new Date().toISOString().slice(0, 19).replace('T', ' ');
    const cliente = normalizarTexto(fila.cliente) || 'Cliente general';
    const total = cantidad * (Number.isFinite(precio) ? precio : producto.precio_venta);

    db.exec('BEGIN');
    try {
      const r = db.prepare(`INSERT INTO ventas (fecha, producto_id, cantidad, precio_unitario, total, cliente, vendedor_id, origen)
                            VALUES (?,?,?,?,?,?,?, 'procesamiento')`)
        .run(fecha, producto.id, cantidad, precio, total, cliente, vendedor ? vendedor.id : null);
      db.prepare('INSERT INTO movimientos_inventario (producto_id, tipo, cantidad, motivo, venta_id) VALUES (?,?,?,?,?)')
        .run(producto.id, 'salida', cantidad, 'Carga por procesamiento', r.lastInsertRowid);
      db.prepare('UPDATE productos SET stock_actual = stock_actual - ? WHERE id = ?').run(cantidad, producto.id);
      db.exec('COMMIT');
      log.push(`Venta creada: ${cantidad} x $${precio} = $${total}`);
      if (causa.length) log.push(causa.join('; '));
      exitosas.push({ id: fila.id, accion: log.join(' · ') });
    } catch (e) {
      db.exec('ROLLBACK');
      errores.push({ id: fila.id, causa: 'Error interno al insertar: ' + e.message });
    }
  }

  return {
    exitosas,
    errores,
    detalles: {
      procesadas: exitosas.map((e) => ({ id: e.id, accion: e.accion })),
      rechazadas: errores.map((e) => ({ id: e.id, causa: e.causa })),
    },
  };
}

module.exports = { limpiarYTransformar, normalizarNumero };
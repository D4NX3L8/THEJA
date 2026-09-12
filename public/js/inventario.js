// THEJA - Lógica del módulo de inventario

let inventario = [];

function llenarSelects() {
  const en = document.getElementById('selEntrada');
  const sa = document.getElementById('selSalida');
  en.innerHTML = inventario.map((p) => `<option value="${esc(p.id)}">${esc(p.nombre)} (${esc(p.stock_actual)})</option>`).join('');
  sa.innerHTML = inventario.map((p) => `<option value="${esc(p.id)}">${esc(p.nombre)} (${esc(p.stock_actual)})</option>`).join('');
}

async function listarInventario() {
  const rows = await fetch('api/inventario').then((r) => r.json());
  const tbody = document.querySelector('#tablaInventario tbody');
  tbody.innerHTML = rows.map((p) => {
    const bajo = p.stock_actual <= p.stock_seguridad;
    const badge = bajo ? '<span class="badge badge-bajo">Stock bajo</span>' : '<span class="badge badge-ok">Óptimo</span>';
    return `<tr>
      <td>${esc(p.nombre)}</td>
      <td>${esc(p.categoria)}</td>
      <td class="text-end">${conMoneda(p.precio_venta)}</td>
      <td class="text-end"><b>${esc(p.stock_actual)}</b> ${esc(p.unidad)}(s)</td>
      <td class="text-end">${esc(p.entradas)}</td>
      <td class="text-end">${esc(p.salidas)}</td>
      <td>${badge}</td>
    </tr>`;
  }).join('');
}

async function listarMovimientos() {
  const rows = await fetch('api/movimientos').then((r) => r.json());
  const ul = document.getElementById('listaMovimientos');
  ul.innerHTML = rows.map((m) => `
    <li class="list-group-item d-flex justify-content-between align-items-start">
      <div class="ms-2 me-auto">
        <div class="fw-bold">${esc(m.producto)}</div>
        <small class="text-secondary">${esc(m.fecha.replace('T', ' '))}${m.motivo ? ' · ' + esc(m.motivo) : ''}</small>
      </div>
      <span class="badge ${m.tipo === 'entrada' ? 'text-bg-success' : 'text-bg-danger'}">${m.tipo === 'entrada' ? '+' : '-'}${esc(m.cantidad)}</span>
    </li>`).join('') || '<li class="list-group-item text-secondary">Sin movimientos</li>';
}

document.addEventListener('DOMContentLoaded', () => {
  const refrescar = () => Promise.all([listarInventario(), listarMovimientos()]);

  async function cargarTodo() {
    inventario = await fetch('api/inventario').then((r) => r.json());
    llenarSelects();
    await refrescar();
  }

  async function registrarMovimiento(e, tipo) {
    e.preventDefault();
    const prefix = tipo === 'entrada' ? 'Ent' : 'Sal';
    const payload = {
      producto_id: document.getElementById(`sel${tipo === 'entrada' ? 'Entrada' : 'Salida'}`).value,
      tipo,
      cantidad: document.getElementById(`inp${prefix}Cant`).value,
      motivo: document.getElementById(`inp${prefix}Motivo`).value,
    };
    try {
      const res = await fetch('api/movimientos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      mostrarToast(`Movimiento de ${tipo} registrado`);
      e.target.reset();
      await cargarTodo();
    } catch (err) {
      mostrarToast(err.message, 'error');
    }
  }

  document.getElementById('formEntrada').addEventListener('submit', (e) => registrarMovimiento(e, 'entrada'));
  document.getElementById('formSalida').addEventListener('submit', (e) => registrarMovimiento(e, 'salida'));

  document.getElementById('formProducto').addEventListener('submit', async (e) => {
    e.preventDefault();
    const payload = {
      nombre: document.getElementById('inpNombre').value,
      categoria: document.getElementById('inpCategoria').value,
      unidad: document.getElementById('inpUnidad').value,
      precio_venta: document.getElementById('inpPrecio').value,
      costo: document.getElementById('inpCosto').value,
      stock_inicial: document.getElementById('inpStockIni').value,
      stock_seguridad: document.getElementById('inpStockSeg').value,
    };
    try {
      const res = await fetch('api/productos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      mostrarToast(`Producto creado: ${data.nombre}`);
      e.target.reset();
      await cargarTodo();
    } catch (err) {
      mostrarToast(err.message, 'error');
    }
  });

  cargarTodo().catch((e) => mostrarToast('Error cargando inventario: ' + e.message, 'error'));
});
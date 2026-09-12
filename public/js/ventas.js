// THEJA - Lógica del módulo de ventas

let productos = [];
let empleados = [];

async function cargarCatalogos() {
  [productos, empleados] = await Promise.all([
    fetch('api/productos').then((r) => r.json()),
    fetch('api/empleados').then((r) => r.json()),
  ]);
  const selProd = document.getElementById('selProducto');
  cargarOpciones(selProd, productos, (p) => `${p.nombre} ($${p.precio_venta})`, 'id');
  selProd.firstChild.textContent = 'Seleccione un producto...';
  cargarOpciones(document.getElementById('selVendedor'), empleados, 'nombre', 'id');
  document.getElementById('selVendedor').firstChild.textContent = 'Sin asignar';
  actualizarInfoProducto();
}

function actualizarInfoProducto() {
  const sel = document.getElementById('selProducto');
  const info = document.getElementById('infoProducto');
  const id = Number(sel.value);
  const prod = productos.find((p) => p.id === id);
  if (!prod) { info.classList.add('d-none'); return; }
  info.classList.remove('d-none');
  info.innerHTML = `<b>${esc(prod.nombre)}</b> · Precio: <b>${conMoneda(prod.precio_venta)}</b> · Stock disponible: <b>${esc(prod.stock_actual)} ${esc(prod.unidad)}(s)</b>`;
  actualizarTotal();
}

function actualizarTotal() {
  const sel = document.getElementById('selProducto');
  const cant = Number(document.getElementById('inpCantidad').value) || 0;
  const prod = productos.find((p) => p.id === Number(sel.value));
  const total = product => product ? product.precio_venta * cant : 0;
  document.getElementById('inpTotal').value = conMoneda(total(prod));
}

async function listarVentas() {
  const rows = await fetch('api/ventas').then((r) => r.json());
  const tbody = document.querySelector('#tablaVentas tbody');
  tbody.innerHTML = rows.map((r) => `
    <tr>
      <td>${esc(r.fecha.replace('T', ' '))}</td>
      <td>${esc(r.producto)}</td>
      <td>${esc(r.cantidad)}</td>
      <td>${esc(r.cliente || '-')}</td>
      <td>${esc(r.vendedor || '-')}</td>
      <td class="text-end">${conMoneda(r.total)}</td>
    </tr>`).join('') || '<tr><td colspan="6" class="text-center text-secondary">Sin ventas registradas</td></tr>';
}

document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('formVenta').addEventListener('submit', async (e) => {
    e.preventDefault();
    const payload = {
      producto_id: document.getElementById('selProducto').value,
      cantidad: document.getElementById('inpCantidad').value,
      cliente: document.getElementById('inpCliente').value,
      vendedor_id: document.getElementById('selVendedor').value || null,
    };
    try {
      const res = await fetch('api/ventas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      mostrarToast(`Venta registrada: ${esc(data.producto)} por ${conMoneda(data.total)}`);
      e.target.reset();
      document.getElementById('inpCantidad').value = 1;
      document.getElementById('inpTotal').value = '';
      listarVentas().catch((err2) => mostrarToast('Error al actualizar la lista: ' + err2.message, 'error'));
      cargarCatalogos().catch((err2) => mostrarToast('Error al actualizar catálogos: ' + err2.message, 'error'));
    } catch (err) {
      mostrarToast(err.message, 'error');
    }
  });

  document.getElementById('selProducto').addEventListener('change', actualizarInfoProducto);
  document.getElementById('inpCantidad').addEventListener('input', actualizarTotal);

  cargarCatalogos().catch((e) => mostrarToast('Error cargando datos: ' + e.message, 'error'));
  listarVentas().catch((e) => mostrarToast('Error cargando ventas: ' + e.message, 'error'));
});
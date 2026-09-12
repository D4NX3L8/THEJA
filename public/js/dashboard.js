// THEJA - Lógica del Tablero de Mando (Dashboard)

let charts = {};

async function cargarResumen() {
  const res = await fetch('api/resumen');
  const data = await res.json();

  document.getElementById('kpiVentas').textContent = conMoneda(data.ventas_totales);
  const prod = data.producto_mas_vendido
    ? `<div class="small text-secondary">${esc(data.producto_mas_vendido.nombre)} · ${esc(data.producto_mas_vendido.unidades)} und</div>`
    : '';
  document.getElementById('kpiProducto').innerHTML = (data.producto_mas_vendido ? esc(data.producto_mas_vendido.nombre) : '-') + prod;
  document.getElementById('kpiRotacion').textContent = `${data.rotacion_inventario.valor} veces`;
  document.getElementById('kpiTransacciones').textContent = `${data.num_ventas} · ${data.stock_bajo} bajos`;

  graficarVentasMes(data.ventas_por_mes);
  graficarProductos(data.ventas_por_producto);
  graficarVendedores(data.ventas_por_vendedor);
  llenarTablaRecientes(data.ventas_recientes);
}

function graficarVentasMes(rows) {
  const ctx = document.getElementById('chartVentasMes');
  const mesCorto = (m) => { const [y, mm] = m.split('-'); return `${['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'][+mm-1]} ${y.slice(2)}`; };
  if (charts.ventasMes) charts.ventasMes.destroy();
  charts.ventasMes = new Chart(ctx, {
    type: 'line',
    data: {
      labels: rows.map((r) => mesCorto(r.mes)),
      datasets: [{ label: 'Ventas ($)', data: rows.map((r) => r.total), borderColor: '#0f4c5c', backgroundColor: 'rgba(15,76,92,0.15)', fill: true, tension: 0.4 }],
    },
    options: { plugins: { legend: { display: false } }, scales: { y: { ticks: { callback: (v) => '$' + v } } } },
  });
}

function graficarProductos(rows) {
  const ctx = document.getElementById('chartProductos');
  if (charts.productos) charts.productos.destroy();
  charts.productos = new Chart(ctx, {
    type: 'pie',
    data: {
      labels: rows.map((r) => r.nombre),
      datasets: [{ data: rows.map((r) => r.total), backgroundColor: ['#0f4c5c', '#e36414', '#5f8ae4', '#2a9d8f', '#e63946', '#f1c40f', '#8e44ad', '#34495e'] }],
    },
    options: { plugins: { legend: { position: 'bottom', labels: { boxWidth: 12, font: { size: 10 } } } } },
  });
}

function graficarVendedores(rows) {
  const ctx = document.getElementById('chartVendedores');
  if (charts.vendedores) charts.vendedores.destroy();
  charts.vendedores = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: rows.map((r) => r.nombre.split(' ')[0]),
      datasets: [{ label: 'Total vendido ($)', data: rows.map((r) => r.total), backgroundColor: '#5f8ae4', borderRadius: 6 }],
    },
    options: {
      indexAxis: 'y',
      plugins: { legend: { display: false } },
      scales: { x: { ticks: { callback: (v) => '$' + v } } },
    },
  });
}

function llenarTablaRecientes(rows) {
  const tbody = document.querySelector('#tablaRecientes tbody');
  tbody.innerHTML = rows.map((r) => `
    <tr>
      <td>${esc(r.fecha.replace('T', ' '))}</td>
      <td>${esc(r.producto)}</td>
      <td>${esc(r.cantidad)}</td>
      <td>${esc(r.cliente || '-')}</td>
      <td>${esc(r.vendedor || '-')}</td>
      <td class="text-end">${conMoneda(r.total)}</td>
    </tr>`).join('');
}

document.addEventListener('DOMContentLoaded', () => {
  cargarResumen().catch((e) => mostrarToast('Error al cargar el dashboard: ' + e.message, 'error'));
});
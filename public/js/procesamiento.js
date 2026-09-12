// THEJA - Lógica del módulo de procesamiento

const EJEMPLO = `03/09/2026, Papel carta (resma), 25, 12500, Colegio Santa María, Mariana Rojas
03/09/2026, lapicero tinta negra, 300, 1800, Papelería El Progreso, Carlos Peña
04/09/2026, Tinta para impresora, 3, 78000, Imprenta Central, Laura Gómez
04/09/2026, cuarderno cuadriculado, 40, 6900, Almacén Escolar, Laura Gómez
05/09/2026, Carpeta plástica, -15, 3500, , Mariana Rojas
05/09/2026, Resaltador amarillo, 100, 4200, Colegio Santa María, Carlos Peña
06/09/2026, Lapicero tinta negra, 500, 1800, Papelería El Éxito, Carlos Peña
06/09/2026, X producto inexistente, 10, 5000, Colegio San Gabriel, Mariana Rojas
06/09/2026, Perforadora (3 huecos), 15, 18800, Imprenta Central, Andrés Martínez
06/09/2026, Papel carta (resma), 99999, 12500, Compra atípica, Mariana Rojas`;

function parsearCSV(texto) {
  return texto.split('\n').map((linea) => linea.trim()).filter(Boolean).map((linea) => {
    const celdas = linea.split(',').map((c) => c.trim());
    const [fecha, producto, cantidad, precio, cliente, vendedor] = celdas;
    return { fecha, producto, cantidad, precio, cliente, vendedor };
  });
}

async function cargarCrudos() {
  const data = await fetch('api/crudos').then((r) => r.json());
  document.getElementById('contPendientes').textContent = data.pendientes.length;

  const tbodyP = document.querySelector('#tablaPendientes tbody');
  tbodyP.innerHTML = data.pendientes.map((f) => `
    <tr>
      <td>${esc(f.fecha || '-')}</td>
      <td>${esc(f.producto || '-')}</td>
      <td class="text-end">${esc(f.cantidad ?? '-')}</td>
      <td class="text-end">${esc(f.precio ?? '-')}</td>
      <td>${esc(f.vendedor || '-')}</td>
    </tr>`).join('') || '<tr><td colspan="5" class="text-center text-secondary">Sin datos pendientes</td></tr>';

  const tbodyR = document.querySelector('#tablaResultados tbody');
  tbodyR.innerHTML = data.procesados.map((f) => {
    const ok = f.estado === 'procesado';
    return `<tr>
      <td><span class="badge ${ok ? 'text-bg-success' : 'text-bg-danger'}">${ok ? 'Procesado' : 'Rechazado'}</span></td>
      <td class="small">${esc(f.log || '-')}</td>
    </tr>`;
  }).join('') || '<tr><td colspan="2" class="text-center text-secondary">Aún no se ha procesado nada</td></tr>';
}

document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('btnEjemplo').addEventListener('click', () => {
    document.getElementById('txtCsv').value = EJEMPLO;
  });

  document.getElementById('btnCargar').addEventListener('click', async () => {
    const filas = parsearCSV(document.getElementById('txtCsv').value);
    if (!filas.length) return mostrarToast('Escriba o pegue datos CSV primero.', 'error');
    try {
      const res = await fetch('api/crudos/cargar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filas }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      mostrarToast(`${data.insertados} filas cargadas como datos pendientes`);
      document.getElementById('txtCsv').value = '';
      cargarCrudos().catch((err2) => mostrarToast('Error al refrescar: ' + err2.message, 'error'));
    } catch (err) {
      mostrarToast(err.message, 'error');
    }
  });

  document.getElementById('btnProcesar').addEventListener('click', async () => {
    try {
      const res = await fetch('api/procesar', { method: 'POST' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      mostrarToast(`${data.procesados} filas procesadas · ${data.rechazados} rechazadas`);
      if (data.rechazados > 0) mostrarToast(`${data.rechazados} filas con errores revisadas en la tabla`, 'info');
      cargarCrudos().catch((err2) => mostrarToast('Error al refrescar: ' + err2.message, 'error'));
    } catch (err) {
      mostrarToast(err.message, 'error');
    }
  });

  cargarCrudos().catch((e) => mostrarToast('Error cargando datos: ' + e.message, 'error'));
});
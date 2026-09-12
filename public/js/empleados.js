// THEJA - Lógica del módulo de empleados

async function listarEmpleados() {
  const rows = await fetch('api/empleados').then((r) => r.json());
  const total = rows.reduce((a, e) => a + e.total_vendido, 0) || 1;
  const tbody = document.querySelector('#tablaEmpleados tbody');
  tbody.innerHTML = rows.map((e) => {
    const pct = ((e.total_vendido / total) * 100).toFixed(1);
    return `<tr>
      <td><i class="bi bi-person-circle me-1 text-secondary"></i>${esc(e.nombre)}</td>
      <td>${esc(e.cargo)}</td>
      <td class="small text-secondary">${esc(e.correo || '-')}<br>${esc(e.telefono || '')}</td>
      <td class="text-end">${esc(e.ventas)}</td>
      <td class="text-end"><b>${conMoneda(e.total_vendido)}</b></td>
      <td>
        <div class="progress" style="height: 18px;" role="progressbar" aria-valuenow="${pct}" aria-valuemin="0" aria-valuemax="100">
          <div class="progress-bar" style="width: ${pct}%; background:#5f8ae4;">${pct}%</div>
        </div>
      </td>
    </tr>`;
  }).join('') || '<tr><td colspan="6" class="text-center text-secondary">Sin empleados registrados</td></tr>';
}

document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('formEmpleado').addEventListener('submit', async (e) => {
    e.preventDefault();
    const payload = {
      nombre: document.getElementById('inpEmpNombre').value,
      cargo: document.getElementById('inpEmpCargo').value,
      correo: document.getElementById('inpEmpCorreo').value,
      telefono: document.getElementById('inpEmpTelefono').value,
    };
    try {
      const res = await fetch('api/empleados', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      mostrarToast(`Empleado registrado: ${data.nombre}`);
      e.target.reset();
      listarEmpleados();
    } catch (err) {
      mostrarToast(err.message, 'error');
    }
  });

  listarEmpleados().catch((e) => mostrarToast('Error cargando empleados: ' + e.message, 'error'));
});
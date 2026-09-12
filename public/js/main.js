// THEJA - Scripts compartidos (utilidades y notificaciones)

function mostrarToast(mensaje, tipo = 'success') {
  const color = { success: 'text-bg-success', error: 'text-bg-danger', info: 'text-bg-secondary' }[tipo] || 'text-bg-success';
  const div = document.createElement('div');
  div.className = `toast align-items-center ${color} border-0`;
  div.innerHTML = `<div class="d-flex">
      <div class="toast-body">${esc(mensaje)}</div>
      <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"></button>
    </div>`;
  document.getElementById('toastArea').appendChild(div);
  const t = new bootstrap.Toast(div, { delay: 3500 });
  t.show();
  div.addEventListener('hidden.bs.toast', () => div.remove());
}

// Escapa texto para insertarlo seguro en HTML (previene XSS)
function esc(v) {
  return String(v ?? '').replace(/[&<>"']/g, (m) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[m]));
}

function cargarOpciones(select, items, texto, valor) {
  const textoDe = (i) => (typeof texto === 'function' ? texto(i) : i[texto]);
  select.innerHTML = '<option value="" selected disabled>Seleccione...</option>' +
    items.map((i) => `<option value="${esc(i[valor])}">${esc(textoDe(i))}</option>`).join('');
}

function conMoneda(v) {
  return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(v);
}

document.addEventListener('DOMContentLoaded', () => {
  const toastArea = document.createElement('div');
  toastArea.id = 'toastArea';
  toastArea.className = 'toast-container position-fixed top-0 end-0 p-3';
  document.body.appendChild(toastArea);
});
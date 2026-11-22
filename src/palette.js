const materials = [
  { name: 'Тёплый дуб', description: 'Природный рисунок дерева и мягкий медовый оттенок.' },
  { name: 'Графитовый камень', description: 'Глубокий серо-зелёный тон с выразительными светлыми прожилками.' },
  { name: 'Матовый шалфей', description: 'Приглушённый природный оттенок и спокойная матовая поверхность.' },
];
const stage = document.querySelector('.palette-stage');
const ring = document.querySelector('.palette-ring');
const segments = [...document.querySelectorAll('.palette-segment')];
let rotation = 0;
let drag = null;
let dragged = false;

function rotateTo(angle) {
  rotation = angle;
  ring.style.setProperty('--rotation', `${rotation}deg`);
}

function selectMaterial(index) {
  const material = materials[index];
  document.querySelector('#palette-name').textContent = material.name;
  document.querySelector('#palette-copy').textContent = material.description;
  segments.forEach((segment, position) => segment.setAttribute('aria-pressed', String(position === index)));
  const frontAngle = 120 - index * 120;
  const nearestTurn = Math.round((rotation - frontAngle) / 360);
  rotateTo(frontAngle + nearestTurn * 360);
}

segments.forEach((segment, index) => {
  segment.addEventListener('click', event => {
    if (dragged && event.detail !== 0) return;
    selectMaterial(index);
  });
});
document.querySelectorAll('[data-turn]').forEach(button => {
  button.addEventListener('click', () => rotateTo(rotation + Number(button.dataset.turn) * 120));
});
stage.addEventListener('keydown', event => {
  if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
  event.preventDefault();
  rotateTo(rotation + (event.key === 'ArrowRight' ? 30 : -30));
});
stage.addEventListener('pointerdown', event => {
  if (!event.isPrimary || event.button !== 0) return;
  dragged = false;
  // Begin from the visible orientation if a previous turn is still animating.
  const matrix = new DOMMatrixReadOnly(getComputedStyle(ring).transform);
  rotation = Math.atan2(matrix.b, matrix.a) * 180 / Math.PI;
  stage.classList.add('is-dragging');
  rotateTo(rotation);
  drag = { id: event.pointerId, x: event.clientX, y: event.clientY, rotation };
});
stage.addEventListener('pointermove', event => {
  if (!drag || event.pointerId !== drag.id) return;
  const deltaX = event.clientX - drag.x;
  const deltaY = event.clientY - drag.y;
  if (!dragged && Math.abs(deltaY) > Math.abs(deltaX) && Math.abs(deltaY) > 8) {
    drag = null;
    stage.classList.remove('is-dragging');
    return;
  }
  if (Math.abs(deltaX) > 6) {
    dragged = true;
    stage.setPointerCapture(event.pointerId);
  }
  if (dragged) rotateTo(drag.rotation + deltaX * 0.6);
});
function endDrag(event) {
  if (!drag || event.pointerId !== drag.id) return;
  if (stage.hasPointerCapture(event.pointerId)) stage.releasePointerCapture(event.pointerId);
  drag = null;
  stage.classList.remove('is-dragging');
}
stage.addEventListener('pointerup', endDrag);
stage.addEventListener('pointercancel', endDrag);
stage.addEventListener('lostpointercapture', endDrag);

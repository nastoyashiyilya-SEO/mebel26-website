const materials = [
  { name: 'Тёплый дуб', description: 'Природный рисунок дерева и мягкий медовый оттенок.' },
  { name: 'Графитовый камень', description: 'Глубокий серо-зелёный тон с выразительными светлыми прожилками.' },
  { name: 'Матовый шалфей', description: 'Приглушённый природный оттенок и спокойная матовая поверхность.' },
  { name: 'Слоновая кость', description: 'Тёплый молочный оттенок для светлого и мягкого интерьера.' },
  { name: 'Терракота', description: 'Глубокий глиняный цвет для тёплого акцента.' },
  { name: 'Тёмный орех', description: 'Насыщенный коричневый оттенок с рисунком древесины.' },
  { name: 'Дымчатый синий', description: 'Сдержанный сине-серый оттенок для матовых фасадов.' },
  { name: 'Песочный беж', description: 'Спокойный песочный тон, который сочетается с деревом и камнем.' },
];
const stage = document.querySelector('.palette-stage');
const segments = [...document.querySelectorAll('.palette-segment')];
let rotation = 0;
let drag = null;
let dragged = false;
let turnAnimation = 0;
const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)');

function renderRotation(angle) {
  rotation = angle;
  const radius = Math.min(250, stage.clientWidth * 0.36);
  segments.forEach((segment, index) => {
    const radians = (rotation + index * 360 / materials.length) * Math.PI / 180;
    const depth = Math.sin(radians);
    const x = Math.cos(radians) * radius;
    const y = depth * radius * 0.45;
    const scale = 0.85 + depth * 0.18;
    segment.style.transform = `translate(-50%, -50%) translate(${x}px, ${y}px) scale(${scale})`;
    segment.style.zIndex = String(Math.round((depth + 1) * 100));
  });
}

function rotateTo(angle) {
  cancelAnimationFrame(turnAnimation);
  if (stage.classList.contains('is-dragging') || reduceMotion.matches) {
    renderRotation(angle);
    return;
  }
  const initialAngle = rotation;
  const started = performance.now();
  function step(time) {
    const progress = Math.min(1, (time - started) / 500);
    const eased = 1 - Math.pow(1 - progress, 3);
    renderRotation(initialAngle + (angle - initialAngle) * eased);
    if (progress < 1) turnAnimation = requestAnimationFrame(step);
  }
  turnAnimation = requestAnimationFrame(step);
}

function selectMaterial(index) {
  const material = materials[index];
  document.querySelector('#palette-name').textContent = material.name;
  document.querySelector('#palette-copy').textContent = material.description;
  segments.forEach((segment, position) => segment.setAttribute('aria-pressed', String(position === index)));
  const frontAngle = 90 - index * 360 / materials.length;
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
  button.addEventListener('click', () => rotateTo(rotation + Number(button.dataset.turn) * 360 / materials.length));
});
stage.addEventListener('keydown', event => {
  if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
  event.preventDefault();
  rotateTo(rotation + (event.key === 'ArrowRight' ? 30 : -30));
});
stage.addEventListener('pointerdown', event => {
  if (!event.isPrimary || event.button !== 0) return;
  dragged = false;
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

window.addEventListener('resize', () => renderRotation(rotation));
renderRotation(0);

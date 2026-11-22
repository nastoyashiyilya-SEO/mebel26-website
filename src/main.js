const products = [
  { name: 'Кухня «Линия»', category: 'kitchen', label: 'Кухни' },
  { name: 'Шкаф «Тихий»', category: 'storage', label: 'Хранение' },
  { name: 'Тумба «Форма»', category: 'living', label: 'Гостиная' },
  { name: 'Кровать «Покой»', category: 'bedroom', label: 'Спальня' },
  { name: 'Кухня «Объём»', category: 'kitchen', label: 'Кухни' },
  { name: 'Стеллаж «Ритм»', category: 'storage', label: 'Хранение' },
];
const grid = document.querySelector('#products');
const detailDialog = document.querySelector('#detail-dialog');
function renderProducts(category) {
  const visible = products.filter(product => category === 'all' || product.category === category);
  grid.replaceChildren(...visible.map(product => {
    const card = document.createElement('button');
    card.className = 'product';
    card.innerHTML = `<div class="placeholder"><span>Фото скоро появится</span><i aria-hidden="true">↗</i></div><div class="product-info"><h3>${product.name}</h3><span>${product.label}</span></div>`;
    card.addEventListener('click', () => {
      document.querySelector('#detail-title').textContent = product.name;
      detailDialog.showModal();
    });
    return card;
  }));
  const count = visible.length;
  document.querySelector('#result-count').textContent = `${count} ${count === 1 ? 'предмет' : count < 5 ? 'предмета' : 'предметов'}`;
}
document.querySelectorAll('[data-category]').forEach(button => {
  button.addEventListener('click', () => {
    document.querySelectorAll('[data-category]').forEach(filter => {
      filter.classList.toggle('active', filter === button);
      filter.setAttribute('aria-pressed', String(filter === button));
    });
    renderProducts(button.dataset.category);
  });
});
renderProducts('all');
document.querySelector('#contact-open').addEventListener('click', () => document.querySelector('#contact-dialog').showModal());
document.querySelectorAll('dialog').forEach(dialog => {
  dialog.querySelectorAll('button').forEach(button => button.addEventListener('click', () => dialog.close()));
  dialog.addEventListener('click', event => {
    const rect = dialog.getBoundingClientRect();
    if (event.target === dialog && (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom)) dialog.close();
  });
});
const canvas = document.querySelector('#hero-canvas');
const context = canvas.getContext('2d', { alpha: false });
const hero = document.querySelector('#hero');
const poster = document.querySelector('.hero-poster');
const status = document.querySelector('.frame-status');
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
const frameCount = 360;
const cache = new Map();
const pending = new Set();
const failed = new Set();
let targetFrame = 0;
let displayedFrame = -1;
let position = 0;
let direction = 1;
let animationId = 0;
let lastTime = 0;

function drawFrame(index) {
  const frame = cache.get(index);
  if (!frame || displayedFrame === index) return;
  context.drawImage(frame, 0, 0, canvas.width, canvas.height);
  displayedFrame = index;
  poster.hidden = true;
  status.hidden = true;
}

async function loadFrame(index) {
  pending.add(index);
  try {
    const url = new URL(`hero-frames/${String(index).padStart(3, '0')}.jpg`, document.baseURI);
    const response = await fetch(url);
    if (!response.ok) throw new Error(`Frame HTTP ${response.status}`);
    const bitmap = await createImageBitmap(await response.blob());
    cache.set(index, bitmap);
    // Retain only a small window of decoded 4K frames to bound memory use.
    for (const [key, image] of cache) {
      if (Math.abs(key - Math.round(position)) > 6 && key !== targetFrame) {
        image.close();
        cache.delete(key);
      }
    }
    if (index === Math.round(position)) drawFrame(index);
  } catch {
    failed.add(index);
    status.textContent = 'Анимация недоступна. Обновите страницу, чтобы повторить загрузку.';
    status.hidden = false;
  } finally {
    pending.delete(index);
    preloadFrames();
  }
}

function preloadFrames() {
  const center = Math.round(position);
  const candidates = [center];
  for (let offset = 1; offset <= 6; offset++) candidates.push(center + offset * direction);
  candidates.push(targetFrame);
  for (const index of candidates) {
    if (pending.size >= 3) break;
    if (index < 0 || index >= frameCount || cache.has(index) || pending.has(index) || failed.has(index)) continue;
    void loadFrame(index);
  }
}

function animate(time) {
  const elapsed = Math.min(50, time - (lastTime || time));
  lastTime = time;
  position += (targetFrame - position) * (1 - Math.exp(-elapsed / 110));
  if (Math.abs(targetFrame - position) < 0.1) position = targetFrame;
  drawFrame(Math.round(position));
  preloadFrames();
  if (position !== targetFrame) animationId = requestAnimationFrame(animate);
  else { animationId = 0; lastTime = 0; }
}

function updateAnimation() {
  const distance = hero.offsetHeight - innerHeight;
  const progress = reducedMotion.matches ? 0 : Math.max(0, Math.min(1, -hero.getBoundingClientRect().top / Math.max(1, distance)));
  const nextFrame = Math.round(progress * (frameCount - 1));
  direction = nextFrame >= targetFrame ? 1 : -1;
  targetFrame = nextFrame;
  document.querySelector('#progress-fill').style.width = `${progress * 100}%`;
  if (reducedMotion.matches) position = 0;
  if (!animationId) animationId = requestAnimationFrame(animate);
}
window.addEventListener('scroll', updateAnimation, { passive: true });
window.addEventListener('resize', updateAnimation);
reducedMotion.addEventListener('change', updateAnimation);
updateAnimation();

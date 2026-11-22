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
const video = document.querySelector('#hero-video');
const hero = document.querySelector('#hero');
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
let desiredTime = 0;
let scheduled = false;
function seekVideo() {
  if (!video.seeking && Number.isFinite(video.duration) && Math.abs(video.currentTime - desiredTime) > 0.035) video.currentTime = desiredTime;
}
function updateVideo() {
  scheduled = false;
  const distance = hero.offsetHeight - innerHeight;
  const progress = reducedMotion.matches ? 0 : Math.max(0, Math.min(1, -hero.getBoundingClientRect().top / Math.max(1, distance)));
  document.querySelector('#progress-fill').style.width = `${progress * 100}%`;
  if (Number.isFinite(video.duration)) desiredTime = progress * Math.max(0, video.duration - 0.05);
  seekVideo();
}
function scheduleUpdate() {
  if (!scheduled) { scheduled = true; requestAnimationFrame(updateVideo); }
}
video.addEventListener('loadedmetadata', updateVideo);
video.addEventListener('seeked', seekVideo);
window.addEventListener('scroll', scheduleUpdate, { passive: true });
window.addEventListener('resize', scheduleUpdate);
reducedMotion.addEventListener('change', scheduleUpdate);
updateVideo();

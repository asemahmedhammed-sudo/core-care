export default function initPromotionCarousels(root = document) {
  root.querySelectorAll('[data-promotion-carousel]').forEach(carousel => {
    if (carousel.dataset.initialized) return;
    const slides = [...carousel.querySelectorAll('[data-promotion-slide]')];
    const dots = [...carousel.querySelectorAll('[data-promotion-dot]')];
    if (slides.length < 2) return;
    carousel.dataset.initialized = 'true';
    const currentLabel = carousel.querySelector('[data-promotion-current]');
    const totalLabel = carousel.querySelector('[data-promotion-total]');
    // Keep navigation usable if cached Twig predates the visible counter.
    if (totalLabel) totalLabel.textContent = String(slides.length).padStart(2, '0');
    if (currentLabel) currentLabel.textContent = '01';
    let current = 0;
    const rtl = getComputedStyle(carousel).direction === 'rtl';
    const show = index => {
      current = (index + slides.length) % slides.length;
      slides.forEach((slide, i) => { slide.hidden = i !== current; });
      dots.forEach((dot, i) => dot.setAttribute('aria-current', String(i === current)));
      if (currentLabel) currentLabel.textContent = String(current + 1).padStart(2, '0');
      carousel.querySelector('[data-promotion-status]').textContent = slides[current].getAttribute('aria-label');
    };
    carousel.querySelector('[data-promotion-prev]').addEventListener('click', () => show(current - 1));
    carousel.querySelector('[data-promotion-next]').addEventListener('click', () => show(current + 1));
    dots.forEach((dot, i) => dot.addEventListener('click', () => show(i)));
    carousel.addEventListener('keydown', event => {
      if (!['ArrowLeft', 'ArrowRight'].includes(event.key)) return;
      event.preventDefault();
      // Keep keyboard focus on a visible control when the focused slide changes.
      if (slides.includes(document.activeElement)) dots[current].focus();
      show(current + ((event.key === 'ArrowRight') !== rtl ? 1 : -1));
    });
    let start = null;
    let suppressClick = false;
    carousel.addEventListener('touchstart', event => {
      suppressClick = false;
      const touch = event.touches[0];
      start = event.touches.length === 1 ? { x: touch.clientX, y: touch.clientY } : null;
    }, { passive: true });
    carousel.addEventListener('touchend', event => {
      if (!start) return;
      const touch = event.changedTouches[0];
      const dx = touch.clientX - start.x;
      const dy = touch.clientY - start.y;
      start = null;
      if (Math.abs(dx) < 45 || Math.abs(dx) < Math.abs(dy)) return;
      suppressClick = true;
      show(current + ((dx < 0) !== rtl ? 1 : -1));
    }, { passive: true });
    carousel.addEventListener('touchcancel', () => { start = null; });
    carousel.addEventListener('click', event => {
      if (!suppressClick) return;
      suppressClick = false;
      event.preventDefault();
    }, true);
    carousel.querySelector('[data-promotion-controls]').hidden = false;
  });
}

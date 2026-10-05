let carouselSequence = 0;

export default function initPromotionCarousels(root = document) {
  root.querySelectorAll('[data-promotion-carousel]').forEach(carousel => {
    if (carousel.dataset.initialized) return;
    const slides = [...carousel.querySelectorAll('[data-promotion-slide]')];
    const controls = carousel.querySelector('[data-promotion-controls]');
    if (slides.length < 2) return;
    const pagination = carousel.querySelector('[data-promotion-dots]');
    if (!controls || !pagination) return;
    carousel.dataset.initialized = 'true';
    const instance = ++carouselSequence;
    // Derive controls from the rendered slides, including partially configured slots.
    const dots = slides.map((slide, i) => {
      slide.id = `beauty-promotion-${instance}-${i + 1}`;
      const dot = document.createElement('button');
      dot.type = 'button';
      dot.setAttribute('data-promotion-dot', '');
      dot.setAttribute('aria-label', `${pagination.dataset.slideLabel} ${i + 1}`);
      dot.setAttribute('aria-controls', slide.id);
      dot.setAttribute('aria-current', String(i === 0));
      return dot;
    });
    pagination.replaceChildren(...dots);
    let current = 0;
    const rtl = () => getComputedStyle(carousel).direction === 'rtl';
    const show = index => {
      const next = (index + slides.length) % slides.length;
      if (next === current) return;
      // Move focus before hiding a banner link or its optional CTA.
      if (slides[current].contains(document.activeElement)) dots[next].focus();
      current = next;
      slides.forEach((slide, i) => {
        slide.hidden = i !== current;
        slide.classList.toggle('is-entering', i === current);
      });
      dots.forEach((dot, i) => dot.setAttribute('aria-current', String(i === current)));
      carousel.querySelector('[data-promotion-status]').textContent = slides[current].getAttribute('aria-label');
    };
    carousel.querySelector('[data-promotion-prev]').addEventListener('click', () => show(current - 1));
    carousel.querySelector('[data-promotion-next]').addEventListener('click', () => show(current + 1));
    dots.forEach((dot, i) => dot.addEventListener('click', () => show(i)));
    carousel.addEventListener('keydown', event => {
      if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
      if (event.target.closest('input, textarea, select, [contenteditable="true"]')) return;
      event.preventDefault();
      if (event.key === 'Home') show(0);
      else if (event.key === 'End') show(slides.length - 1);
      else show(current + ((event.key === 'ArrowRight') !== rtl() ? 1 : -1));
    });
    let start = null;
    let suppressClickUntil = 0;
    const viewport = carousel.querySelector('.beauty-promotions__viewport');
    viewport.addEventListener('touchstart', event => {
      suppressClickUntil = 0;
      const touch = event.touches[0];
      start = event.touches.length === 1 ? { x: touch.clientX, y: touch.clientY } : null;
    }, { passive: true });
    viewport.addEventListener('touchend', event => {
      if (!start) return;
      const touch = event.changedTouches[0];
      const dx = touch.clientX - start.x;
      const dy = touch.clientY - start.y;
      start = null;
      if (Math.abs(dx) < 45 || Math.abs(dx) < Math.abs(dy)) return;
      suppressClickUntil = Date.now() + 400;
      show(current + ((dx < 0) !== rtl() ? 1 : -1));
    }, { passive: true });
    viewport.addEventListener('touchcancel', () => { start = null; });
    viewport.addEventListener('click', event => {
      // Only suppress the immediate pointer click after a swipe. Keyboard
      // activation and later mouse clicks must still follow the banner link.
      const suppress = event.detail > 0 && Date.now() < suppressClickUntil;
      suppressClickUntil = 0;
      if (suppress) event.preventDefault();
    }, true);
    controls.hidden = false;
  });
}

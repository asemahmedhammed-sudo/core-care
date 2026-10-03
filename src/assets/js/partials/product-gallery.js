export function initProductGallery(gallery) {
    if (gallery.dataset.galleryReady) return;
    gallery.dataset.galleryReady = 'true';
    const slides = [...gallery.querySelectorAll('[data-gallery-slide]')];
    const thumbs = [...gallery.querySelectorAll('[data-gallery-thumb]')];
    const rail = gallery.querySelector('[data-gallery-rail]');
    const list = gallery.querySelector('[data-gallery-thumbs]');
    const previous = gallery.querySelector('[data-gallery-previous]');
    const next = gallery.querySelector('[data-gallery-next]');
    const stage = gallery.querySelector('.core-product-media__stage');
    let index = 0;

    const updateScroll = () => {
        if (!list) return;
        // Compare with the full rail height, not the already inset scroll area.
        const overflow = list.scrollHeight > rail.clientHeight + 1;
        rail.classList.toggle('has-overflow', overflow);
        previous.hidden = next.hidden = !overflow;
        previous.disabled = list.scrollTop <= 1;
        next.disabled = list.scrollTop + list.clientHeight >= list.scrollHeight - 1;
    };
    const revealThumb = thumb => {
        if (!list || !thumb) return;
        const top = thumb.offsetTop;
        if (top < list.scrollTop) list.scrollTop = top;
        else if (top + thumb.offsetHeight > list.scrollTop + list.clientHeight)
            list.scrollTop = top + thumb.offsetHeight - list.clientHeight;
        updateScroll();
    };
    const select = (target, focus = false) => {
        if (!slides.length) return;
        index = Math.max(0, Math.min(slides.length - 1, target));
        slides.forEach((slide, position) => { slide.hidden = position !== index; });
        thumbs.forEach((thumb, position) => thumb.setAttribute('aria-pressed', String(position === index)));
        revealThumb(thumbs[index]);
        if (focus) thumbs[index]?.focus({ preventScroll: true });
        gallery.dispatchEvent(new CustomEvent('gallery-change', { detail: { index } }));
    };
    thumbs.forEach((thumb, position) => {
        thumb.addEventListener('click', () => select(position));
        thumb.addEventListener('keydown', event => {
            const target = { ArrowUp: position - 1, ArrowDown: position + 1, Home: 0, End: slides.length - 1 }[event.key];
            if (target === undefined) return;
            event.preventDefault();
            select(target, true);
        });
    });
    if (list) {
        const scroll = direction => {
            const step = (thumbs[0]?.offsetHeight || 80) + 12;
            list.scrollBy({ top: direction * step, behavior: 'smooth' });
        };
        previous.addEventListener('click', () => scroll(-1));
        next.addEventListener('click', () => scroll(1));
        list.addEventListener('scroll', updateScroll, { passive: true });
        const observer = new ResizeObserver(updateScroll);
        observer.observe(rail);
        observer.observe(stage);
    }
    // Keep Salla's color/thumbnail product options connected to the gallery.
    salla.event.on('product-options::change', data => {
        if (!['thumbnail', 'color'].includes(data?.option?.type)) return;
        const target = slides.findIndex(slide => slide.dataset.imgId === String(data?.detail?.option_value));
        if (target !== -1) select(target);
    });
    let touchStart = null;
    let suppressClick = false;
    stage.addEventListener('touchstart', event => {
        suppressClick = false;
        const touch = event.touches[0];
        touchStart = event.touches.length === 1 && !event.target.closest('model-viewer')
            ? { x: touch.clientX, y: touch.clientY } : null;
    }, { passive: true });
    stage.addEventListener('touchend', event => {
        if (!touchStart) return;
        const touch = event.changedTouches[0];
        const dx = touch.clientX - touchStart.x, dy = touch.clientY - touchStart.y;
        touchStart = null;
        if (Math.abs(dx) < 45 || Math.abs(dx) <= Math.abs(dy)) return;
        suppressClick = true;
        const rtl = getComputedStyle(gallery).direction === 'rtl';
        select(index + (dx < 0 !== rtl ? 1 : -1));
    }, { passive: true });
    stage.addEventListener('touchcancel', () => { touchStart = null; });
    stage.addEventListener('click', event => {
        if (!suppressClick) return;
        suppressClick = false;
        event.preventDefault();
        event.stopImmediatePropagation();
    }, { capture: true });
    select(0);
    updateScroll();
}

export function registerProductGallery() {
    if (customElements.get('core-product-gallery')) return;
    customElements.define('core-product-gallery', class extends HTMLElement {
        connectedCallback() { initProductGallery(this); }
    });
}

// Homepage category discs show the category initial until a real image loads.
// Broken or 1×1 placeholder images are removed so the initial stays visible.
const SELECTOR = '.beauty-category__image img';

export function settleCategoryImage(img) {
    if (!img?.matches?.(SELECTOR) || !img.complete) return;
    if (img.naturalWidth > 2 && img.naturalHeight > 2) img.classList.add('is-loaded');
    else img.remove();
}

export default function initCategoryMedia(root = document) {
    if (root.coreCareCategoryMedia) return;
    root.coreCareCategoryMedia = true;
    // load/error do not bubble; capturing also covers sections the editor re-renders and lazy images.
    root.addEventListener('load', event => settleCategoryImage(event.target), true);
    root.addEventListener('error', event => event.target?.matches?.(SELECTOR) && event.target.remove(), true);
    root.querySelectorAll(SELECTOR).forEach(settleCategoryImage);
}

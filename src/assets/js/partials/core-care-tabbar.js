// Mobile tab bar cart badge. Salla's <salla-cart-summary> keeps the count; this only hides it at zero.
export function cartIsEmpty(count) {
    return !(Number(count) > 0);
}

export function syncCartBadges(count, root = document) {
    root.querySelectorAll('.cc-tabbar__cart').forEach(cart => cart.toggleAttribute('data-empty', cartIsEmpty(count)));
}

// The phone header is transparent over a tall first banner only while the page is at the top
// (core-care-app-nav.scss); it is white by default, so it stays readable without this script.
export function headerAtTop(scrollY) {
    return Number(scrollY) < 8;
}

globalThis.salla?.onReady?.(() => {
    syncCartBadges(globalThis.salla.storage?.get?.('cart.summary.count'));
    globalThis.salla.cart?.event?.onUpdated?.(response => syncCartBadges(response?.count));
});

if (globalThis.document?.body && globalThis.addEventListener) {
    const syncHeader = () => document.body.classList.toggle('cc-header-at-top', headerAtTop(globalThis.scrollY));
    syncHeader();
    globalThis.addEventListener('scroll', syncHeader, { passive: true });
}

// Footer «اللغة والعملة» on phones: opens the header's own language panel (or Salla's currency window).
// Capture + stopPropagation keeps the language panel's outside-click handler from closing it again.
if (globalThis.document?.addEventListener) {
    document.addEventListener('click', event => {
        const opener = event.target instanceof Element ? event.target.closest('[data-cc-localization-open]') : null;
        if (!opener) return;
        event.preventDefault();
        event.stopPropagation();
        document.querySelector('.core-care-language-menu [data-language-toggle], .core-care-header__actions > .core-care-header__locale')?.click();
    }, true);
}

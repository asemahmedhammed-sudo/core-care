// Mobile tab bar cart badge. Salla's <salla-cart-summary> keeps the count; this only hides it at zero.
export function cartIsEmpty(count) {
    return !(Number(count) > 0);
}

export function syncCartBadges(count, root = document) {
    root.querySelectorAll('.cc-tabbar__cart').forEach(cart => cart.toggleAttribute('data-empty', cartIsEmpty(count)));
}

globalThis.salla?.onReady?.(() => {
    syncCartBadges(globalThis.salla.storage?.get?.('cart.summary.count'));
    globalThis.salla.cart?.event?.onUpdated?.(response => syncCartBadges(response?.count));
});

// «حسابي» sheet on phones and portrait tablets (mobile-account.twig). The tab bar's account button opens
// and closes it; the other tabs, Escape and the close button close it. Login and logout stay Salla's own.
const OPEN_CLASS = 'cc-account-open';

// The sheet steps aside for whatever a row opens next (Salla's login window, the language panel, a tab).
export function closesSheet(target) {
    if (!(target instanceof Element)) return false;
    if (target.closest('[data-account-toggle]')) return false;
    return !!target.closest('#cc-account :is([data-account-close], [data-account-login], [data-account-logout], [data-cc-localization-open]), .cc-tabbar :is(a, button, salla-cart-summary)');
}

export function initAccountSheet(root = document) {
    const sheet = root.getElementById?.('cc-account');
    const toggle = root.querySelector?.('[data-account-toggle]');
    if (!sheet || !toggle || sheet.dataset.ready) return null;
    sheet.dataset.ready = 'true';

    const setOpen = (open, { restoreFocus = false } = {}) => {
        sheet.hidden = !open;
        toggle.setAttribute('aria-expanded', String(open));
        root.documentElement.classList.toggle(OPEN_CLASS, open);
        if (open) {
            sheet.querySelector('.cc-account__body')?.scrollTo?.(0, 0);
            sheet.focus({ preventScroll: true });
        } else if (restoreFocus) {
            toggle.focus();
        }
    };

    toggle.addEventListener('click', () => setOpen(sheet.hidden));

    // Capture on window runs before core-care-tabbar.js stops the localization click at the document.
    globalThis.addEventListener('click', event => {
        if (sheet.hidden || !closesSheet(event.target)) return;
        setOpen(false, { restoreFocus: !!event.target.closest('[data-account-close]') });
    }, true);

    sheet.addEventListener('click', event => {
        const target = event.target instanceof Element ? event.target : null;
        if (target?.closest('[data-account-login]')) globalThis.salla?.event?.dispatch?.('login::open');
        if (target?.closest('[data-account-logout]')) globalThis.salla?.auth?.logout?.();
    });

    root.addEventListener('keydown', event => {
        if (event.key === 'Escape' && !sheet.hidden) setOpen(false, { restoreFocus: true });
    });

    // From tablet widths the tab bar is gone; never leave the page locked behind a hidden sheet.
    globalThis.matchMedia?.('(min-width: 768px)')?.addEventListener?.('change', event => {
        if (event.matches && !sheet.hidden) setOpen(false);
    });

    return { setOpen };
}

if (globalThis.document?.readyState) {
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', () => initAccountSheet());
    else initAccountSheet();
}

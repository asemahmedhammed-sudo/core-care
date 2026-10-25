import { categoryIdFromUrl, safeMenuUrl } from './core-care-categories';
import { headerMenus } from './header-menus';

// «أشهر التصنيفات» on web widths, after the Nice One footer: the header menu's links to Salla categories.
// Other header links (home, brands, new arrivals) are left out; an empty result keeps the column hidden.
const WEB_QUERY = '(min-width: 768px)';
const MAX_CATEGORIES = 12;

export function footerCategories(items) {
    return (Array.isArray(items) ? items : [])
        .map(item => ({ title: String(item?.title || '').trim(), url: safeMenuUrl(item?.url) }))
        .filter(item => item.title && item.url && categoryIdFromUrl(item.url))
        .slice(0, MAX_CATEGORIES);
}

class CoreCareFooterCategories extends HTMLElement {
    connectedCallback() {
        if (this.started) return;
        const media = globalThis.matchMedia?.(WEB_QUERY);
        const start = () => {
            if (this.started) return;
            this.started = true;
            media?.removeEventListener?.('change', onChange);
            this.load();
        };
        const onChange = event => event.matches && start();
        if (!media || media.matches) start();
        else media.addEventListener?.('change', onChange);
    }

    async load() {
        try {
            await globalThis.salla.onReady();
            const { data } = await headerMenus();
            const links = footerCategories(data).map(item => {
                const link = document.createElement('a');
                link.href = item.url;
                link.textContent = item.title;
                return link;
            });
            this.replaceChildren(...links);
        } catch {
            // The column stays hidden; the header shows its own error state.
        }
    }
}

if (!customElements.get('core-care-footer-categories')) customElements.define('core-care-footer-categories', CoreCareFooterCategories);

// Guests: the account links open Salla's login window, as in the phone account sheet.
document.addEventListener('click', event => {
    const target = event.target instanceof Element ? event.target.closest('[data-cc-footer-login]') : null;
    if (target) globalThis.salla?.event?.dispatch?.('login::open');
});

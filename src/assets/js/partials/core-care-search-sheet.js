// Phone/tablet search screen (pages/partials/mobile-search.twig). Salla's <salla-search> keeps the
// suggestions, results and results page; this adds recent searches, popular terms and brands around it.
const RECENT_KEY = 'cc-search-recent';
const BRANDS_KEY = 'cc-search-brands';
export const RECENT_LIMIT = 10;
export const BRANDS_LIMIT = 12;

export function safeUrl(value, base) {
    if (typeof value !== 'string' || !value.trim()) return null;
    try {
        const url = new URL(value, base);
        return ['https:', 'http:'].includes(url.protocol) && !url.username && !url.password ? url.href : null;
    } catch { return null; }
}

export function addRecent(list, term) {
    const value = String(term ?? '').trim().replace(/\s+/g, ' ').slice(0, 60);
    if (value.length < 2) return list;
    return [value, ...list.filter(item => item.toLowerCase() !== value.toLowerCase())].slice(0, RECENT_LIMIT);
}

export function searchHref(base, term) {
    return `${base}${base.includes('?') ? '&' : '?'}q=${encodeURIComponent(term)}`;
}

// Reads the brand tiles the theme renders on its own brands page (pages/brands/index.twig).
export function brandsFromDocument(doc, base) {
    return [...doc.querySelectorAll('a[data-testid="store-brand-item"]')].map(link => {
        const image = link.querySelector('img');
        const url = safeUrl(link.getAttribute('href'), base);
        const logo = safeUrl(image?.getAttribute('src'), base);
        const name = (image?.getAttribute('alt') || '').trim();
        return url && logo && name ? { url, logo, name } : null;
    }).filter(Boolean).slice(0, BRANDS_LIMIT);
}

function read(storage, key) {
    try { const value = JSON.parse(storage.getItem(key) || 'null'); return Array.isArray(value) ? value : null; } catch { return null; }
}

function write(storage, key, value) {
    try { storage.setItem(key, JSON.stringify(value)); } catch { /* private mode or full storage */ }
}

class CoreCareSearchSheet extends HTMLElement {
    connectedCallback() {
        this.abort?.abort();
        this.abort = new AbortController();
        const options = { signal: this.abort.signal };
        this.compact = window.matchMedia('(max-width: 1023px)');
        this.recentList = this.querySelector('[data-search-recent-list]');
        // Open from the compact header search; desktop keeps Salla's own search window.
        document.addEventListener('click', event => {
            const trigger = event.target instanceof Element ? event.target.closest('.core-care-header__search') : null;
            if (!trigger || !this.compact.matches || !document.body.classList.contains('cc-has-tabbar')) return;
            event.preventDefault();
            event.stopPropagation();
            this.open(trigger);
        }, { ...options, capture: true });
        this.querySelector('[data-search-close]')?.addEventListener('click', () => this.close(), options);
        this.querySelector('[data-search-clear]')?.addEventListener('click', () => {
            write(window.localStorage, RECENT_KEY, []);
            this.renderRecent();
            this.querySelector('.s-search-input')?.focus();
        }, options);
        this.addEventListener('keydown', event => {
            if (event.key === 'Escape') { event.preventDefault(); this.close(); }
            if (event.key === 'Enter' && event.target.matches?.('.s-search-input')) this.remember(event.target.value);
        }, { ...options, capture: true });
        this.addEventListener('input', event => {
            if (event.target.matches?.('.s-search-input')) this.toggleAttribute('data-typing', !!event.target.value.trim());
        }, options);
        this.addEventListener('click', event => {
            const term = event.target instanceof Element ? event.target.closest('[data-search-term]') : null;
            if (term) this.remember(term.dataset.searchTerm);
        }, options);
        // The phone back button closes the screen instead of leaving the page.
        window.addEventListener('popstate', () => { if (!this.hidden) this.close(true); }, options);
        this.compact.addEventListener('change', () => { if (!this.compact.matches && !this.hidden) this.close(); }, options);
    }

    disconnectedCallback() { this.abort?.abort(); document.documentElement.classList.remove('cc-search-open'); }

    open(trigger) {
        if (!this.hidden) return;
        this.returnFocus = trigger.querySelector('button, input') || trigger;
        this.hidden = false;
        document.documentElement.classList.add('cc-search-open');
        history.pushState({ ccSearch: true }, '');
        this.pushed = true;
        this.renderRecent();
        this.loadBrands();
        const input = this.querySelector('.s-search-input');
        this.toggleAttribute('data-typing', !!input?.value.trim());
        // Focus inside the tap so phones raise the keyboard.
        input?.focus();
    }

    close(fromHistory = false) {
        if (this.hidden) return;
        this.hidden = true;
        document.documentElement.classList.remove('cc-search-open');
        if (this.pushed && !fromHistory) history.back();
        this.pushed = false;
        this.returnFocus?.focus?.();
    }

    remember(term) {
        const list = addRecent(read(window.localStorage, RECENT_KEY) || [], term);
        write(window.localStorage, RECENT_KEY, list);
    }

    renderRecent() {
        const list = read(window.localStorage, RECENT_KEY) || [];
        const base = this.dataset.searchUrl || '/search';
        this.recentList.replaceChildren(...list.map(term => {
            const item = document.createElement('li');
            const link = document.createElement('a');
            link.className = 'cc-search-chip';
            link.href = searchHref(base, term);
            link.dataset.searchTerm = term;
            link.textContent = term;
            item.append(link);
            return item;
        }));
        this.querySelector('[data-search-recent]').hidden = !list.length;
    }

    async loadBrands() {
        if (this.brandsLoaded) return;
        this.brandsLoaded = true;
        let brands = read(window.sessionStorage, BRANDS_KEY);
        if (!brands) {
            try {
                const response = await fetch(this.dataset.brandsUrl, { credentials: 'same-origin' });
                if (!response.ok) throw new Error(String(response.status));
                const doc = new DOMParser().parseFromString(await response.text(), 'text/html');
                brands = brandsFromDocument(doc, window.location.href);
                write(window.sessionStorage, BRANDS_KEY, brands);
            } catch { brands = []; this.brandsLoaded = false; }
        }
        const list = this.querySelector('[data-search-brands-list]');
        list.replaceChildren(...brands.map(brand => {
            const item = document.createElement('li');
            const link = document.createElement('a');
            link.className = 'cc-search-brand';
            link.href = brand.url;
            const image = document.createElement('img');
            image.src = brand.logo;
            image.alt = brand.name;
            image.width = 80;
            image.height = 80;
            image.loading = 'lazy';
            image.decoding = 'async';
            link.append(image);
            item.append(link);
            return item;
        }));
        this.querySelector('[data-search-brands]').hidden = !brands.length;
    }
}

if (globalThis.customElements && !customElements.get('core-care-search-sheet')) customElements.define('core-care-search-sheet', CoreCareSearchSheet);

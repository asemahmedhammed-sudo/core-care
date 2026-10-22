// Phone/tablet search (pages/partials/mobile-search.twig). Salla's own search window keeps the history,
// most-searched sections and results; below 1024px this adds «ماركات مقترحة» under them while the
// field is empty: the brands the merchant named (setting beauty_search_brands), with the logos and
// links of the theme's own brands page.
const BRANDS_KEY = 'cc-search-brands';
const SEARCH_WINDOW = 'salla-modal.s-search-modal-new';
export const BRANDS_LIMIT = 12;

export function safeUrl(value, base) {
    if (typeof value !== 'string' || !value.trim()) return null;
    try {
        const url = new URL(value, base);
        return ['https:', 'http:'].includes(url.protocol) && !url.username && !url.password ? url.href : null;
    } catch { return null; }
}

// Reads the brand tiles the theme renders on its brands page (pages/brands/index.twig).
export function brandsFromDocument(doc, base) {
    return [...doc.querySelectorAll('a[data-testid="store-brand-item"]')].map(link => {
        const image = link.querySelector('img');
        const url = safeUrl(link.getAttribute('href'), base);
        const logo = safeUrl(image?.getAttribute('src'), base);
        const name = (image?.getAttribute('alt') || '').trim();
        return url && logo && name ? { url, logo, name } : null;
    }).filter(Boolean);
}

const normalize = value => String(value ?? '').toLowerCase().replace(/\s+/g, '');

// Keeps the merchant's order; names are matched without case or spaces, unknown names are skipped.
export function pickBrands(brands, names) {
    // Stores can hold several brands with the same name; the first one on the brands page wins.
    const byName = new Map();
    for (const brand of brands) if (!byName.has(normalize(brand.name))) byName.set(normalize(brand.name), brand);
    const picked = [];
    for (const name of names) {
        const brand = byName.get(normalize(name));
        if (brand && !picked.includes(brand)) picked.push(brand);
        if (picked.length === BRANDS_LIMIT) break;
    }
    return picked;
}

function readCache() {
    try { const value = JSON.parse(sessionStorage.getItem(BRANDS_KEY) || 'null'); return Array.isArray(value) ? value : null; } catch { return null; }
}

function writeCache(value) {
    try { sessionStorage.setItem(BRANDS_KEY, JSON.stringify(value)); } catch { /* private mode or full storage */ }
}

let brandsRequest = null;
function loadBrands(url) {
    const cached = readCache();
    if (cached) return Promise.resolve(cached);
    brandsRequest ??= fetch(url, { credentials: 'same-origin' })
        .then(response => (response.ok ? response.text() : Promise.reject(new Error(String(response.status)))))
        .then(html => {
            const brands = brandsFromDocument(new DOMParser().parseFromString(html, 'text/html'), window.location.href);
            writeCache(brands);
            return brands;
        })
        .catch(() => { brandsRequest = null; return []; });
    return brandsRequest;
}

function brandsSection(brands, title) {
    const section = document.createElement('section');
    section.className = 'cc-search-brands-section';
    const heading = document.createElement('p');
    heading.className = 'cc-search-brands-title';
    heading.textContent = title;
    const list = document.createElement('ul');
    list.className = 'cc-search-brands';
    list.setAttribute('role', 'list');
    list.append(...brands.map(brand => {
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
    section.append(heading, list);
    return section;
}

function enhance(input) {
    const config = document.getElementById('cc-search-config');
    const panel = input.closest(`${SEARCH_WINDOW} .s-search-panel`);
    if (!config || !panel || !window.matchMedia('(max-width: 1023px)').matches) return;
    panel.toggleAttribute('data-cc-typing', !!input.value.trim());
    if (panel.querySelector('.cc-search-brands-section') || panel.dataset.ccBrands === 'loading') return;
    panel.dataset.ccBrands = 'loading';
    const names = (config.dataset.brandsNames || '').split('|').filter(Boolean);
    loadBrands(config.dataset.brandsUrl).then(all => {
        delete panel.dataset.ccBrands;
        const brands = pickBrands(all, names);
        if (brands.length && !panel.querySelector('.cc-search-brands-section')) panel.append(brandsSection(brands, config.dataset.brandsTitle));
    });
}

if (globalThis.document?.addEventListener) {
    const matches = target => target instanceof Element && target.matches(`${SEARCH_WINDOW} .s-search-input`);
    // Salla focuses its field when the window opens; typing hides the brands while results show.
    document.addEventListener('focusin', event => { if (matches(event.target)) enhance(event.target); });
    document.addEventListener('input', event => { if (matches(event.target)) enhance(event.target); });
    // The window does not always move focus into its field, so also enhance it once it opens from the header.
    document.addEventListener('click', event => {
        if (!(event.target instanceof Element) || !event.target.closest('.s-search-placeholder-trigger')) return;
        setTimeout(() => {
            const open = [...document.querySelectorAll(SEARCH_WINDOW)].find(item => item.getBoundingClientRect().width > 0);
            const input = open?.querySelector('.s-search-input');
            if (input) enhance(input);
        }, 300);
    });
}

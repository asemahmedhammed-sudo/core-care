// Salla serves every storefront route under its language segment (/ar/…, /en/…), and link('/')
// returns the home of the visitor's current language. Links the merchant saved as "custom"
// URLs (menu items, "View all", banners) come back from Salla exactly as typed, for example
// https://corecare-sa.com/brands, and an unprefixed store path renders in the default language
// (observed 2026-10-19 on corecare-sa.com: /en pages linked to /most-Sales-products and /cart, which open in Arabic).
const TWO_LETTERS = /^[a-z]{2}$/;

// Language codes Salla lists for this page (hreflang alternates) plus the current one.
export function pageLanguages(doc = document) {
    const codes = [...doc.querySelectorAll('link[rel="alternate"][hreflang]')].map(link => link.getAttribute('hreflang'));
    codes.push(doc.documentElement.lang);
    return codes.filter(code => code && code !== 'x-default').map(code => code.toLowerCase().split('-')[0]);
}

// Puts a same-store link under the language of homeValue (the current link('/')).
// Other sites, non-web schemes, in-page anchors and files are returned unchanged.
export function localizedStoreLink(value, homeValue, languages = []) {
    if (typeof value !== 'string' || !value.trim() || value.startsWith('#')) return value;
    try {
        const home = new URL(homeValue);
        const segments = home.pathname.split('/').filter(Boolean);
        const language = (segments.at(-1) || '').toLowerCase();
        const known = new Set(languages.map(code => String(code).toLowerCase()));
        // Only live-style homes end with the page language (/en/ or /store/en/); otherwise do nothing.
        if (!TWO_LETTERS.test(language) || !known.has(language)) return value;
        const target = new URL(value, home);
        if (!['http:', 'https:'].includes(target.protocol) || target.origin !== home.origin || target.username || target.password) return value;
        const base = '/' + segments.slice(0, -1).map(segment => segment + '/').join('');
        if (!target.pathname.startsWith(base) || /\.[a-z0-9]{2,5}$/i.test(target.pathname)) return value;
        const rest = target.pathname.slice(base.length).split('/');
        const first = rest[0].toLowerCase();
        if (first === language) return value;
        if (known.has(first)) rest[0] = language;
        // An unlisted two-letter segment may still be a language; leave it as Salla returned it.
        else if (TWO_LETTERS.test(first)) return value;
        else rest.unshift(language);
        target.pathname = base + rest.join('/');
        return target.href;
    } catch { return value; }
}

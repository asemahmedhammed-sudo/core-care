import { localizedStoreLink, pageLanguages } from './language-links';

// Salla language prefixes, e.g. /ar or /en.
const LANGUAGE = /^[a-z]{2}$/;

// API navigation URLs can still point at the live custom domain in Salla preview.
export function previewLink(value, homeValue, storeValue, currentValue) {
  try {
    const current = new URL(currentValue);
    const home = new URL(homeValue, current);
    let store = new URL(storeValue);
    // Preview homes are /<store>/ or, in newer drafts, /<language>/<store>/.
    const homeSegments = home.pathname.split('/').filter(Boolean);
    const language = homeSegments.length > 1 && LANGUAGE.test(homeSegments[0]) ? homeSegments[0] : '';
    const storeSlug = (language ? homeSegments.slice(1) : homeSegments).join('/');
    // In draft mode Salla rewrites store.url itself to salla.design, but its
    // menu/product APIs still return the verified production domain. Keep this
    // alias scoped to this store's preview, never to arbitrary external links.
    if (store.origin === home.origin && storeSlug === 'corecare') {
      store = new URL('https://corecare-sa.com/');
    }
    const target = new URL(value, current);
    if (current.hostname !== 'salla.design' || home.origin !== current.origin ||
        !home.pathname.split('/').filter(Boolean).length ||
        !['http:', 'https:'].includes(target.protocol) || target.origin !== store.origin ||
        target.origin === home.origin || target.username || target.password) return value;
    const prefix = home.pathname.replace(/\/$/, '');
    const storePrefix = store.pathname.replace(/\/$/, '');
    if (storePrefix && target.pathname !== storePrefix && !target.pathname.startsWith(storePrefix + '/')) return value;
    let path = target.pathname.slice(storePrefix.length);
    if (!language) return home.origin + prefix + (path || '/') + target.search + target.hash;
    // Live links put the language first (/ar/…); the preview puts it before the store slug.
    // Links stay in the preview's language, as they do on the live store.
    const first = path.split('/')[1] || '';
    if (LANGUAGE.test(first)) path = path.slice(first.length + 1);
    return `${home.origin}/${language}/${storeSlug}${path || '/'}${target.search}${target.hash}`;
  } catch { return value; }
}

// Keeps every store link in the current language, and in Salla preview inside the preview.
export default function initPreviewNavigation() {
  const { storeHome, storeCanonical } = document.body.dataset;
  if (!storeHome) return;
  const preview = window.location.hostname === 'salla.design' && storeCanonical;
  const languages = pageLanguages();
  const update = anchor => {
    const original = anchor.getAttribute('href');
    // hreflang marks a deliberate link to another language; data-keep-url marks platform transaction links.
    if (!original || anchor.hasAttribute('hreflang') || anchor.hasAttribute('download') || anchor.closest('[data-keep-url]')) return;
    let next = localizedStoreLink(original, storeHome, languages);
    if (preview) next = previewLink(next, storeHome, storeCanonical, window.location.href);
    if (next !== original) anchor.setAttribute('href', next);
  };
  const scan = root => {
    if (!(root instanceof Element)) return;
    if (root.matches('a[href]')) update(root);
    root.querySelectorAll('a[href]').forEach(update);
  };
  scan(document.body);
  // Includes product cards and categories inserted after the page has loaded.
  new MutationObserver(records => records.forEach(record => {
    if (record.type === 'attributes') update(record.target);
    else record.addedNodes.forEach(scan);
  })).observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ['href'] });
  const beforeNavigation = event => {
    const anchor = event.target instanceof Element ? event.target.closest('a[href]') : null;
    if (anchor) update(anchor);
  };
  document.addEventListener('click', beforeNavigation, true);
  document.addEventListener('auxclick', beforeNavigation, true);
}

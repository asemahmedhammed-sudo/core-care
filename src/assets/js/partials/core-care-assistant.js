// Shopping assistant sheet on phones (shopping-assistant.twig), opened from the tab bar's centre button.
// It needs no AI service: requests become search words the catalogue understands, products come from Salla, and
// "add" runs the store's add_to_cart tool, so the activity bar shows the change with an undo. Anything it cannot
// answer can be sent to the shopper's own assistant with one tap.
import { compactProduct, safeUrl, storeTools, TOOL_PREFIX } from './core-care-webmcp';
import { buildPrompt, providerUrl, safePageUrl } from './core-care-ask-ai';
import './core-care-ai-activity';

const OPEN_CLASS = 'cc-assistant-open';
const MAX_QUERIES = 3;
const MAX_RESULTS = 12;

// Same letter, different spelling: أحمر / احمر, شفاة / شفاه. Used to compare words, never to search with.
export function normalizeArabic(text) {
    return String(text ?? '').toLowerCase()
        .replace(/[ً-ٟـ]/g, '')
        .replace(/[أإآ]/g, 'ا').replace(/ى/g, 'ي').replace(/ة/g, 'ه')
        .replace(/[^\p{L}\p{N}\s]/gu, ' ').replace(/\s+/g, ' ').trim();
}

// What shoppers say, and the words that find those products. Catalogue search matches exact words and full phrases.
const NEEDS = [
    { match: /متقصف|تقصف|تساقط|تالف|شعر جاف|شعري جاف|جفاف الشعر|split ends|dry hair|damaged hair/, terms: ['سيروم', 'بروتين'] },
    { match: /صبغ|لون شعر|لون الشعر|hair colou?r|hair dye/, terms: ['صبغة'] },
    { match: /شامبو|فروه|shampoo/, terms: ['شامبو'] },
    { match: /ماسكرا|مسكارا|رموش|mascara|lashes/, terms: ['ماسكرا'] },
    { match: /روج|شفاه|شفايف|lipstick|\blips?\b/, terms: ['أحمر شفاه'] },
    { match: /بلاشر|بلش|خدود|blush/, terms: ['بلاشر'] },
    { match: /حواجب|eyebrow|brow/, terms: ['قلم'] },
    { match: /فاونديشن|كريم اساس|foundation/, terms: ['كريم أساس'] },
    { match: /بودره|powder/, terms: ['بودرة'] },
];

const FILLER = new Set(['ابغي', 'ابغا', 'ابي', 'ابى', 'اريد', 'وش', 'ايش', 'شي', 'شيء', 'عندكم', 'عندك', 'فيه', 'في', 'من', 'الى', 'على', 'عن', 'لي', 'لو', 'سمحت', 'يناسب', 'يناسبني', 'مناسب', 'افضل', 'احسن', 'هل', 'كيف', 'ما', 'ماذا', 'i', 'a', 'an', 'the', 'for', 'my', 'me', 'need', 'want', 'looking', 'some', 'best', 'something']);

// Up to MAX_QUERIES search words for a request: known needs first, otherwise the shopper's own words.
export function searchTerms(text) {
    const raw = String(text ?? '').replace(/\s+/g, ' ').trim();
    const normal = normalizeArabic(raw);
    if (!normal) return [];
    const needed = NEEDS.filter(need => need.match.test(normal)).flatMap(need => need.terms);
    const words = raw.split(' ').filter(word => normalizeArabic(word).length > 2 && !FILLER.has(normalizeArabic(word)));
    const terms = needed.length ? needed : [...(raw.split(' ').length === 2 ? [raw] : []), ...words];
    const seen = new Set();
    return terms.filter(term => {
        const key = normalizeArabic(term);
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
    }).slice(0, MAX_QUERIES);
}

// One entry per product, in the order the searches found them.
export function mergeProducts(lists, max = MAX_RESULTS) {
    const seen = new Set();
    return lists.flat().filter(product => {
        if (!product || product.id === undefined || product.id === null || seen.has(String(product.id))) return false;
        seen.add(String(product.id));
        return true;
    }).slice(0, max);
}

// Chooses the greeting by the shopper's own clock.
export function greetingFor(hour, labels) {
    const greeting = hour >= 4 && hour < 12 ? labels.morning : labels.evening;
    const name = String(labels.name || '').trim();
    return name ? (labels.withName || '').replace('%g', greeting).replace('%n', name) : greeting;
}

async function sdk() {
    await globalThis.Salla?.onReady?.();
    return globalThis.salla || globalThis.Salla;
}

async function search(salla, query) {
    const request = () => salla.product.search({ query, per_page: MAX_RESULTS });
    try { return (await request())?.data || []; } catch (error) {
        const reason = String(error?.message ?? error);
        // The SDK refuses a query equal to the previous one once, then clears it.
        if (/same as previous/i.test(reason)) return (await request())?.data || [];
        // Salla answers "no results" with an error status on some stores.
        if (error?.response?.status === 404) return [];
        throw error;
    }
}

function moneyParts(salla, value) {
    const text = String(salla.money?.(value) ?? value);
    return { text: text.replace(/<i[^>]*>\s*<\/i>/g, '').trim(), riyal: /sicon-sar/.test(text) };
}

class Assistant {
    constructor(root, sheet, toggle) {
        this.root = root;
        this.sheet = sheet;
        this.toggle = toggle;
        this.results = sheet.querySelector('[data-assistant-results]');
        this.status = sheet.querySelector('[data-assistant-status]');
        this.list = sheet.querySelector('[data-assistant-list]');
        this.handoff = sheet.querySelector('[data-assistant-handoff]');
        this.input = sheet.querySelector('[data-assistant-input]');
        this.request = 0;
    }

    label(name) { return this.sheet.dataset[name] || ''; }

    setOpen(open, { restoreFocus = false } = {}) {
        this.sheet.hidden = !open;
        this.toggle.setAttribute('aria-expanded', String(open));
        this.root.documentElement.classList.toggle(OPEN_CLASS, open);
        if (open) {
            this.prepare();
            this.sheet.focus({ preventScroll: true });
        } else if (restoreFocus) {
            this.toggle.focus();
        }
    }

    prepare() {
        const greeting = this.sheet.querySelector('[data-assistant-greeting]');
        if (greeting) greeting.textContent = greetingFor(new Date().getHours(), { morning: this.label('morning'), evening: this.label('evening'), withName: this.label('withName'), name: this.label('name') });
        if (this.prepared) return;
        this.prepared = true;
        this.showOffers();
    }

    // The offers chip appears only when the store really has offers.
    async showOffers() {
        const chip = this.sheet.querySelector('[data-assistant-source="offers"]');
        if (!chip) return;
        try {
            const salla = await sdk();
            const response = await salla.product.fetch({ source: 'offers', limit: 1 });
            chip.hidden = !response?.data?.length;
        } catch { chip.hidden = true; }
    }

    begin(heading) {
        this.sheet.classList.add('is-results');
        this.results.hidden = false;
        this.list.replaceChildren();
        this.handoff.hidden = true;
        this.status.textContent = this.label('searching');
        this.heading = heading;
        return ++this.request;
    }

    finish(id, products, askText) {
        if (id !== this.request) return;
        this.status.textContent = products.length ? (this.label('found') || '').replace('%s', this.heading) : (this.label('empty') || '').replace('%s', this.heading);
        this.results.classList.toggle('is-empty', !products.length);
        products.forEach(product => this.list.append(this.card(product)));
        if (askText) this.offerHandoff(askText);
    }

    fail(id, askText) {
        if (id !== this.request) return;
        this.status.textContent = this.label('failed');
        this.results.classList.add('is-empty');
        if (askText) this.offerHandoff(askText);
    }

    async runTerms(terms, heading, askText) {
        const id = this.begin(heading);
        try {
            const salla = await sdk();
            const lists = await Promise.all(terms.slice(0, MAX_QUERIES).map(term => search(salla, term)));
            this.finish(id, mergeProducts(lists), askText);
        } catch { this.fail(id, askText); }
    }

    async runSource(source, heading) {
        const id = this.begin(heading);
        try {
            const salla = await sdk();
            const response = await salla.product.fetch({ source, limit: MAX_RESULTS });
            this.finish(id, mergeProducts([response?.data || []]));
        } catch { this.fail(id); }
    }

    // Requests the catalogue cannot answer can go to the shopper's own assistant, with the store's link only.
    offerHandoff(text) {
        const prompt = buildPrompt(this.handoff.dataset.template, { store: this.handoff.dataset.store, url: safePageUrl(this.handoff.dataset.url, globalThis.location?.href), question: text });
        this.handoff.querySelectorAll('[data-ask-ai-provider]').forEach(link => {
            link.href = providerUrl(link.dataset.askAiProvider, prompt) || link.href;
        });
        this.handoff.hidden = false;
    }

    card(raw) {
        const doc = this.root;
        const href = globalThis.location?.href;
        const product = compactProduct(raw, href);
        const item = doc.createElement('li');
        item.className = 'cc-assistant-card';
        if (!product) return item;
        const link = doc.createElement('a');
        link.className = 'cc-assistant-card__link';
        if (product.url) link.href = product.url;
        const image = safeUrl(raw.image?.url || raw.thumbnail, href);
        if (image?.startsWith('https:')) {
            const img = doc.createElement('img');
            img.src = image;
            img.alt = '';
            img.width = 72;
            img.height = 72;
            img.loading = 'lazy';
            img.decoding = 'async';
            link.append(img);
        }
        const body = doc.createElement('span');
        body.className = 'cc-assistant-card__body';
        const name = doc.createElement('span');
        name.className = 'cc-assistant-card__name';
        name.textContent = product.name || '';
        body.append(name);
        if (product.price !== undefined) body.append(this.price(product));
        link.append(body);
        item.append(link, this.action(product));
        return item;
    }

    price(product) {
        const salla = globalThis.salla || globalThis.Salla;
        const wrap = this.root.createElement('span');
        wrap.className = 'cc-assistant-card__prices';
        const part = (value, className) => {
            const { text, riyal } = moneyParts(salla, value);
            const span = this.root.createElement('span');
            span.className = className;
            span.textContent = `${text} `;
            if (riyal) {
                const icon = this.root.createElement('i');
                icon.className = 'sicon-sar';
                icon.setAttribute('aria-hidden', 'true');
                span.append(icon);
            }
            return span;
        };
        wrap.append(part(product.price, product.regular_price === undefined ? 'cc-assistant-card__price' : 'cc-assistant-card__price is-sale'));
        if (product.regular_price !== undefined) wrap.append(part(product.regular_price, 'cc-assistant-card__old'));
        return wrap;
    }

    // Products with options or no stock go to their page; the rest can be added here.
    action(product) {
        const doc = this.root;
        if (product.available === false || product.has_options || product.starting_price !== undefined) {
            const link = doc.createElement('a');
            link.className = 'cc-assistant-card__action';
            if (product.url) link.href = product.url;
            link.textContent = product.available === false ? this.label('view') : this.label('choose');
            return link;
        }
        const button = doc.createElement('button');
        button.type = 'button';
        button.className = 'cc-assistant-card__action is-primary';
        button.textContent = this.label('add');
        button.addEventListener('click', () => this.add(product, button));
        return button;
    }

    async add(product, button) {
        button.disabled = true;
        button.textContent = this.label('adding');
        let result = {};
        try {
            const salla = await sdk();
            const activity = this.root.querySelector('core-care-ai-activity');
            const tool = storeTools(salla, { doc: this.root, notify: change => activity?.show?.(change) }).find(item => item.name === `${TOOL_PREFIX}add_to_cart`);
            result = JSON.parse(await tool.execute({ product_id: product.product_id }));
        } catch (error) {
            result = { ok: false, error: error?.response?.data?.error?.message };
        }
        // Search results do not say which products need options; the add reports it, so offer the product page.
        if (!result.ok && result.options?.length) {
            button.replaceWith(this.action({ ...product, has_options: true }));
            return;
        }
        button.disabled = false;
        button.textContent = result.ok ? this.label('added') : this.label('add');
        if (!result.ok) this.status.textContent = result.error || this.label('addFailed');
    }
}

export function initAssistant(root = document) {
    const sheet = root.getElementById?.('cc-assistant');
    const toggle = root.querySelector?.('[data-assistant-toggle]');
    if (!sheet || !toggle || sheet.dataset.ready) return null;
    sheet.dataset.ready = 'true';
    const assistant = new Assistant(root, sheet, toggle);

    toggle.addEventListener('click', () => assistant.setOpen(sheet.hidden));
    sheet.querySelector('[data-assistant-close]')?.addEventListener('click', () => assistant.setOpen(false, { restoreFocus: true }));

    // Any other tab closes the sheet. Capture runs before the tab's own handler.
    globalThis.addEventListener('click', event => {
        if (sheet.hidden || !(event.target instanceof Element) || event.target.closest('[data-assistant-toggle]')) return;
        if (event.target.closest('.cc-tabbar :is(a, button, salla-cart-summary)')) assistant.setOpen(false);
    }, true);

    root.addEventListener('keydown', event => {
        if (event.key === 'Escape' && !sheet.hidden) assistant.setOpen(false, { restoreFocus: true });
    });

    sheet.addEventListener('click', event => {
        const chip = event.target instanceof Element ? event.target.closest('[data-assistant-chip]') : null;
        if (!chip) return;
        const heading = chip.textContent.trim();
        if (chip.dataset.assistantSource) assistant.runSource(chip.dataset.assistantSource, heading);
        else assistant.runTerms((chip.dataset.assistantTerms || '').split(',').map(term => term.trim()).filter(Boolean), heading);
    });

    sheet.querySelector('[data-assistant-form]')?.addEventListener('submit', event => {
        event.preventDefault();
        const text = assistant.input.value.replace(/\s+/g, ' ').trim().slice(0, 120);
        if (!text) { assistant.input.focus(); return; }
        const terms = searchTerms(text);
        if (terms.length) assistant.runTerms(terms, text, text);
        else assistant.finish(assistant.begin(text), [], text);
    });

    // From tablet widths the tab bar is gone; never leave the page locked behind a hidden sheet.
    globalThis.matchMedia?.('(min-width: 768px)')?.addEventListener?.('change', event => {
        if (event.matches && !sheet.hidden) assistant.setOpen(false);
    });
    return assistant;
}

if (globalThis.document?.readyState) {
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', () => initAssistant());
    else initAssistant();
}

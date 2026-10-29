import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

// The custom elements extend HTMLElement; Node has none, and only the exported helpers are under test.
globalThis.HTMLElement ??= class {};
const load = async path => import(`data:text/javascript;base64,${Buffer.from(fs.readFileSync(new URL(path, import.meta.url), 'utf8')).toString('base64')}`);
const webmcp = await load('../src/assets/js/partials/core-care-webmcp.js');
const { activityMessage } = await load('../src/assets/js/partials/core-care-ai-activity.js');
const ask = await load('../src/assets/js/partials/core-care-ask-ai.js');
const read = path => fs.readFileSync(new URL(path, import.meta.url), 'utf8');
const single = read('../src/views/pages/product/single.twig');
const pageSingle = read('../src/views/pages/page-single.twig');
const footer = read('../src/views/components/footer/footer.twig');
const master = read('../src/views/layouts/master.twig');
const activityTwig = read('../src/views/pages/partials/ai-activity.twig');
const askTwig = read('../src/views/pages/partials/ask-ai.twig');
const pageTwig = read('../src/views/pages/partials/ai-shopping.twig');
const webpack = read('../webpack.config.js');
const settings = JSON.parse(read('../twilight.json')).settings;
const locales = { ar: JSON.parse(read('../src/locales/ar.json')).beauty, en: JSON.parse(read('../src/locales/en.json')).beauty };

// A cart that really changes, so undo can be checked against the state it restores.
function liveSalla({ items = [], webmcpEnabled, withMobile } = {}) {
    let nextId = 900;
    const cart = { items: items.map(item => ({ ...item })) };
    const calls = [];
    const snapshot = () => ({ data: { cart: { ...cart, count: cart.items.reduce((sum, item) => sum + item.quantity, 0), items: cart.items.map(item => ({ ...item })) } } });
    const salla = {
        calls,
        state: cart,
        config: { get: key => (key === 'webmcp.enabled' ? webmcpEnabled : undefined), isGuest: () => false },
        product: { async getDetails(id) { return { data: { id, name: `منتج ${id}`, is_available: true, options: [] } }; } },
        cart: {
            async details() { return snapshot(); },
            async addItem({ id, quantity }) {
                calls.push(['addItem', id, quantity]);
                const line = cart.items.find(item => item.product_id === id && !item.options?.length);
                if (line) line.quantity += quantity; else cart.items.push({ id: nextId++, product_id: id, product_name: `منتج ${id}`, quantity });
                return snapshot();
            },
            async updateItem({ id, quantity }) { calls.push(['updateItem', id, quantity]); cart.items.find(item => item.id === id).quantity = quantity; return snapshot(); },
            async deleteItem(id) { calls.push(['deleteItem', id]); cart.items = cart.items.filter(item => item.id !== id); return snapshot(); },
            async addCoupon(code) { calls.push(['addCoupon', code]); },
            async deleteCoupon() { calls.push(['deleteCoupon']); },
        },
        wishlist: { async add(id) { calls.push(['wishlist.add', id]); }, async remove(id) { calls.push(['wishlist.remove', id]); } },
        webmcp: { disabled: false, disable() { this.disabled = true; } },
    };
    if (withMobile) salla.mobile = withMobile;
    return salla;
}

async function toolsFor(salla) {
    const changes = [];
    const tools = new Map(webmcp.storeTools(salla, { doc: { querySelector: () => null }, location: { href: 'https://corecare-sa.com/' }, notify: change => changes.push(change) })
        .map(tool => [tool.name.replace(webmcp.TOOL_PREFIX, ''), webmcp.withErrorHandling(tool)]));
    const run = async (name, input) => JSON.parse(await tools.get(name).execute(input, {}));
    return { run, changes };
}

test('undo after an agent adds a new product removes that line, and an added quantity goes back to what it was', async () => {
    const salla = liveSalla({ items: [{ id: 5, product_id: 101, product_name: 'سيروم', quantity: 2 }] });
    const { run, changes } = await toolsFor(salla);
    assert.equal((await run('add_to_cart', { product_id: 202 })).ok, true);
    assert.equal(changes[0].action, 'added');
    assert.equal(changes[0].name, 'منتج 202');
    await changes[0].undo();
    assert.deepEqual(salla.state.items.map(item => [item.id, item.quantity]), [[5, 2]]);
    await run('add_to_cart', { product_id: 101, quantity: 3 });
    assert.equal(salla.state.items[0].quantity, 5);
    await changes[1].undo();
    assert.equal(salla.state.items[0].quantity, 2);
});

test('quantity changes, removals, coupons and wishlist saves each carry the matching undo', async () => {
    const salla = liveSalla({ items: [{ id: 5, product_id: 101, product_name: 'سيروم', quantity: 2 }, { id: 6, product_id: 303, product_name: 'عطر', quantity: 1, options: [{ id: 1 }] }] });
    const { run, changes } = await toolsFor(salla);
    await run('update_cart_item', { item_id: 5, quantity: 4 });
    await changes.at(-1).undo();
    assert.equal(salla.state.items[0].quantity, 2);
    await run('update_cart_item', { item_id: 5, quantity: 2 });
    assert.equal(changes.length, 1, 'an unchanged quantity is not reported');

    await run('remove_cart_item', { item_id: 5 });
    assert.equal(changes.at(-1).action, 'removed');
    await changes.at(-1).undo();
    assert.deepEqual(salla.calls.at(-1), ['addItem', 101, 2]);
    // A line with chosen options cannot be rebuilt faithfully, so it is reported without an undo.
    await run('remove_cart_item', { item_id: 6 });
    assert.equal(changes.at(-1).undo, null);
    assert.equal((await run('remove_cart_item', { item_id: 999 })).ok, false);

    await run('apply_coupon', { code: 'CARE10' });
    assert.deepEqual([changes.at(-1).action, changes.at(-1).value], ['coupon', 'CARE10']);
    await changes.at(-1).undo();
    assert.deepEqual(salla.calls.at(-1), ['deleteCoupon']);

    await run('add_to_wishlist', { product_id: 101 });
    await changes.at(-1).undo();
    assert.deepEqual(salla.calls.at(-1), ['wishlist.remove', 101]);
});

test('read-only tools and failed calls report nothing to the shopper', async () => {
    const salla = liveSalla();
    salla.cart.addCoupon = async () => { throw new Error('الكوبون غير صالح'); };
    const { run, changes } = await toolsFor(salla);
    await run('view_cart');
    await run('apply_coupon', { code: 'BAD' });
    assert.equal(changes.length, 0);
});

test('one shopping tool set per page: theme first switches Salla duplicates off, otherwise the theme only complements', async () => {
    const off = liveSalla({ webmcpEnabled: undefined });
    assert.deepEqual(await webmcp.chooseToolSet(off, true), { only: undefined, source: 'theme' });
    assert.equal(off.webmcp.disabled, false);

    const first = liveSalla({ webmcpEnabled: 'true' });
    assert.deepEqual(await webmcp.chooseToolSet(first, true), { only: undefined, source: 'theme' });
    assert.equal(first.webmcp.disabled, true);

    const deferring = liveSalla({ webmcpEnabled: true });
    const choice = await webmcp.chooseToolSet(deferring, false);
    assert.equal(choice.source, 'salla');
    assert.equal(deferring.webmcp.disabled, false);
    assert.deepEqual(choice.only, ['corecare_list_categories', 'corecare_add_to_wishlist', 'corecare_open_cart_page']);

    const registered = [];
    await webmcp.registerStoreTools({ async registerTool(tool) { registered.push(tool.name); } }, deferring, { only: choice.only, doc: { querySelector: () => null } });
    assert.deepEqual(registered, choice.only);
    // None of the complementary tools duplicates one of Salla's eight.
    for (const name of ['search_products', 'get_product', 'get_cart', 'add_to_cart', 'update_cart_item', 'remove_cart_item', 'apply_coupon', 'go_to_checkout']) {
        assert.ok(!choice.only.includes(`corecare_${name}`), name);
    }
});

test('activity messages use the translated templates and fall back without a product name', () => {
    const labels = { ActionAdded: 'أضاف «%s» إلى سلتك (الكمية %n)', ActionCoupon: 'طبّق الكوبون %s', ActionDone: 'أجرى تغييرًا', ThisProduct: 'هذا المنتج' };
    const label = name => labels[name] || '';
    assert.equal(activityMessage({ action: 'added', name: 'سيروم', value: 2 }, label), 'أضاف «سيروم» إلى سلتك (الكمية 2)');
    assert.equal(activityMessage({ action: 'added', value: 1 }, label), 'أضاف «هذا المنتج» إلى سلتك (الكمية 1)');
    assert.equal(activityMessage({ action: 'coupon', value: 'CARE10', name: 'x' }, label), 'طبّق الكوبون CARE10');
    assert.equal(activityMessage({ action: 'unknown' }, label), 'أجرى تغييرًا');
});

test('ask-AI prompts carry only the question, product name and public link, encoded per assistant', () => {
    const prompt = ask.buildPrompt('أتسوق من متجر {store}. {question}\nالمنتج: {name}\nالرابط: {url} {other}', { store: 'كور كير', question: 'هل يناسب البشرة الحساسة؟', name: 'سيروم & كريم', url: 'https://corecare-sa.com/p1' });
    assert.equal(prompt, 'أتسوق من متجر كور كير. هل يناسب البشرة الحساسة؟\nالمنتج: سيروم & كريم\nالرابط: https://corecare-sa.com/p1 {other}');
    assert.equal(ask.providerUrl('chatgpt', 'a & b?'), 'https://chatgpt.com/?q=a%20%26%20b%3F');
    assert.equal(ask.providerUrl('claude', 'x'), 'https://claude.ai/new?q=x');
    assert.equal(ask.providerUrl('perplexity', 'x'), 'https://www.perplexity.ai/search?q=x');
    assert.equal(ask.providerUrl('unknown', 'x'), null);
    assert.equal(ask.safePageUrl('javascript:alert(1)', 'https://corecare-sa.com/'), '');
    assert.equal(ask.safePageUrl('/p1', 'https://corecare-sa.com/ar/'), 'https://corecare-sa.com/p1');
    assert.equal(ask.storeMcpUrl('https://corecare-sa.com/ar'), 'https://corecare-sa.com/mcp');
    assert.equal(ask.storeMcpUrl('http://corecare-sa.com'), '');
    assert.equal(ask.storeMcpUrl(''), '');
    for (const lang of ['ar', 'en']) {
        for (const group of ['product', 'store']) assert.match(locales[lang].ai_ask[`template_${group}`], /\{question\}.*\{url\}|\{url\}.*\{question\}/s, `${lang} ${group}`);
    }
});

test('in Salla\'s mobile app the assistant opens outside the webview', () => {
    const source = read('../src/assets/js/partials/core-care-ask-ai.js');
    assert.match(source, /if \(mobile\?\.isEnabled\?\.\(\) && typeof mobile\.openBrowser === 'function'\) \{\s*event\.preventDefault\(\);\s*mobile\.openBrowser\(\{ url: link\.href \}\);/);
    assert.match(askTwig, /target="_blank" rel="noopener noreferrer" data-ask-ai-provider="chatgpt"/);
});

test('templates: merchant switches gate each surface and the AI page link only accepts a numeric page id', () => {
    for (const id of ['core_care_webmcp_theme_first', 'core_care_ask_ai']) assert.equal(settings.find(item => item.id === id)?.value, true, id);
    assert.equal(settings.find(item => item.id === 'core_care_ai_page_id')?.value, null);
    assert.match(master, /\{% if theme\.settings\.get\('core_care_webmcp', true\) %\}\{% include 'pages\.partials\.ai-activity' %\}\{% endif %\}/);
    assert.match(activityTwig, /<core-care-ai-activity class="cc-ai-activity" hidden/);
    assert.match(activityTwig, /role="status" aria-live="polite"/);
    assert.match(activityTwig, /\{% if not is_page\('cart'\) %\}\s*<button type="button" class="cc-ai-activity__cart" data-cart-drawer-open>/);
    assert.match(single, /\{% if product\.description or has_specifications or show_ask_ai %\}/);
    assert.match(single, /<details class="core-product-disclosure cc-ask-ai-disclosure"/);
    assert.match(single, /\{% if theme\.settings\.get\('core_care_ask_ai', true\) %\}\s*<script defer src="\{\{ 'ask-ai\.js' \| asset \}\}">/);
    assert.match(pageSingle, /\{% if ai_page_id and ai_page_id == \(page\.id ~ ''\) %\}[^]*?\{% include 'pages\.partials\.ai-shopping' %\}\s*\{% elseif is_policy_page %\}/);
    assert.match(pageSingle, /ai_script_page_id and ai_script_page_id == \(page\.id ~ ''\)/);
    assert.match(footer, /\{% if ai_page_id and ai_page_id\|length <= 30 and ai_page_id\|replace\(\{'0': ''/);
    assert.match(pageTwig, /\{% include 'pages\.partials\.ask-ai' with \{ ask_id: 'ask-ai-store', ask_group: 'store'/);
    assert.match(webpack, /'ask-ai': asset\('js\/ask-ai\.js'\)/);
    // New templates print nothing unescaped; the merchant's page body is prepared in the inherited page-single.
    for (const twig of [activityTwig, askTwig, pageTwig]) assert.doesNotMatch(twig, /\|\s*raw\b/);
    assert.match(pageSingle, /\{% set ai_page_content %\}\{% if page\.content\|default\(''\)\|trim %\}<section class="cc-ai-page__content content-entry">\{\{ page\.content\|raw \}\}<\/section>/);
});

test('every new translation exists in Arabic and English with the same keys', () => {
    for (const group of ['ai_activity', 'ai_ask', 'ai_page']) {
        assert.deepEqual(Object.keys(locales.ar[group]).sort(), Object.keys(locales.en[group]).sort(), group);
        for (const [key, value] of Object.entries(locales.ar[group])) assert.ok(value && locales.en[group][key], `${group}.${key}`);
    }
    assert.ok(locales.ar.footer.ai_shopping && locales.en.footer.ai_shopping);
    // Every key a template asks for is defined.
    const used = [...`${activityTwig}${askTwig}${pageTwig}${single}`.matchAll(/trans\(t ~ '([a-z_]+)'\)|trans\('beauty\.(ai_[a-z]+)\.([a-z_]+)'\)/g)];
    assert.ok(used.length > 20);
    for (const key of ['eyebrow', 'undo', 'view_cart', 'close']) assert.ok(locales.ar.ai_activity[key], key);
    for (const key of ['pick', 'custom_label', 'custom_placeholder', 'send_with', 'copy', 'privacy', 'product_title']) assert.ok(locales.ar.ai_ask[key], key);
    for (const key of ['product_sensitive', 'product_routine', 'product_ingredients', 'product_compare', 'store_routine', 'store_budget', 'store_gift', 'store_compare', 'store_sunscreen', 'store_hair']) assert.ok(locales.ar.ai_ask[key], key);
    for (const [, key] of pageTwig.matchAll(/trans\(t ~ '([a-z_]+)'\)/g)) assert.ok(locales.ar.ai_page[key], `ai_page.${key}`);
    for (const [, key] of activityTwig.matchAll(/trans\(t ~ '([a-z_]+)'\)/g)) assert.ok(locales.ar.ai_activity[key], `ai_activity.${key}`);
    for (const [, key] of askTwig.matchAll(/trans\(t ~ '([a-z_]+)'\)/g)) assert.ok(locales.ar.ai_ask[key], `ai_ask.${key}`);
});

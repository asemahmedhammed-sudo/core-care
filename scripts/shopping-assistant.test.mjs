import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const read = path => fs.readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');
const source = read('src/assets/js/partials/core-care-assistant.js');
const sheet = read('src/views/pages/partials/shopping-assistant.twig');
const tabbar = read('src/views/pages/partials/mobile-tabbar.twig');
const layout = read('src/views/layouts/master.twig');
const iconTwig = read('src/views/pages/partials/ai-icon.twig');
const styles = read('src/assets/styles/06-beauty/core-care-assistant.scss');
const settings = JSON.parse(read('twilight.json')).settings;
const locales = { ar: JSON.parse(read('src/locales/ar.json')).beauty.assistant, en: JSON.parse(read('src/locales/en.json')).beauty.assistant };

// The pure helpers, without the sibling modules, which need a browser.
const start = source.indexOf('// Same letter, different spelling');
const end = source.indexOf('async function sdk()');
const helpers = `const MAX_QUERIES = 3; const MAX_RESULTS = 12;\n${source.slice(start, end)}`;
const { normalizeArabic, searchTerms, mergeProducts, greetingFor } = await import(`data:text/javascript;base64,${Buffer.from(helpers).toString('base64')}`);

test('Arabic spelling variants compare equal', () => {
    assert.equal(normalizeArabic('أحمر  شفاة!'), 'احمر شفاه');
    assert.equal(normalizeArabic('إبرة'), normalizeArabic('ابره'));
    assert.equal(normalizeArabic(''), '');
});

test('requests become words the catalogue can match', () => {
    assert.deepEqual(searchTerms('شعري متقصف وش يناسبه'), ['سيروم', 'بروتين']);
    // Salla's search needs the hamza; a typed «احمر» must still find «أحمر».
    assert.deepEqual(searchTerms('احمر شفاه'), ['أحمر شفاه']);
    assert.deepEqual(searchTerms('ابغى مسكارا'), ['ماسكرا']);
    assert.deepEqual(searchTerms('شامبو'), ['شامبو']);
    assert.deepEqual(searchTerms('لوشن'), ['لوشن']);
    assert.deepEqual(searchTerms('كريم يدين'), ['كريم يدين', 'كريم', 'يدين']);
    assert.deepEqual(searchTerms(''), []);
});

test('skin requests are not mistaken for hair products', () => {
    assert.ok(!searchTerms('ابغى شي لبشرتي الجافة').includes('سيروم'));
});

test('no request sends more than three searches', () => {
    assert.ok(searchTerms('كريم سيروم شامبو زيت ماسك عطر بودرة').length <= 3);
});

test('results keep one entry per product and respect the limit', () => {
    assert.deepEqual(mergeProducts([[{ id: 1 }, { id: 2 }], [{ id: '2' }, { id: 3 }, null]]).map(item => item.id), [1, 2, 3]);
    assert.equal(mergeProducts([[{ id: 1 }, { id: 2 }, { id: 3 }]], 2).length, 2);
});

test('the greeting follows the clock and uses the name only when there is one', () => {
    const labels = { morning: 'صباح الخير', evening: 'مساء الخير', withName: '%g يا %n' };
    assert.equal(greetingFor(9, labels), 'صباح الخير');
    assert.equal(greetingFor(20, labels), 'مساء الخير');
    assert.equal(greetingFor(2, labels), 'مساء الخير');
    assert.equal(greetingFor(9, { ...labels, name: 'Asem' }), 'صباح الخير يا Asem');
});

test('search results and product lists both give a price', async () => {
    const tools = await import(`data:text/javascript;base64,${Buffer.from(read('src/assets/js/partials/core-care-webmcp.js')).toString('base64')}`);
    const base = 'https://corecare-sa.com/ar/';
    // Salla's search shape, with an expired sale price.
    assert.equal(tools.compactProduct({ id: 1, price: { amount: 49, currency: 'SAR' }, sale_price: { amount: 45 }, regular_price: { amount: 49 }, has_special_price: false }, base).price, 49);
    const sale = tools.compactProduct({ id: 2, price: { amount: 45 }, sale_price: { amount: 45 }, regular_price: { amount: 49 }, has_special_price: true }, base);
    assert.equal(sale.price, 45);
    assert.equal(sale.regular_price, 49);
    // Salla's product list shape.
    assert.equal(tools.compactProduct({ id: 3, price: 23, regular_price: 23, sale_price: 0, is_on_sale: false }, base).price, 23);
    assert.equal(tools.compactProduct({ id: 4, price: null }, base).price, undefined);
});

test('long cart line ids reach Salla exactly, for add, undo, change and remove', async () => {
    const tools = await import(`data:text/javascript;base64,${Buffer.from(read('src/assets/js/partials/core-care-webmcp.js')).toString('base64')}`);
    const longId = '4212045484595198151';
    assert.notEqual(String(Number(longId)), longId);
    const calls = []; let items = []; const changes = [];
    const cart = () => ({ data: { cart: { items: items.map(item => ({ ...item })) } } });
    const salla = {
        product: { getDetails: async id => ({ data: { id, name: 'صبغة', is_available: true, options: [] } }) },
        cart: {
            details: async () => cart(),
            addItem: async ({ id, quantity }) => { items.push({ id: longId, product_id: id, product_name: 'صبغة', quantity }); return cart(); },
            updateItem: async payload => { calls.push(['update', payload.id, payload.quantity]); items[0].quantity = payload.quantity; return cart(); },
            deleteItem: async id => { calls.push(['delete', id]); items = []; return cart(); },
        },
    };
    const list = tools.storeTools(salla, { doc: { querySelector: () => null }, location: { href: 'https://corecare-sa.com/' }, notify: change => changes.push(change) });
    const run = async (name, input) => JSON.parse(await list.find(tool => tool.name === `corecare_${name}`).execute(input));
    const added = await run('add_to_cart', { product_id: 7 });
    assert.equal(added.cart.items[0].item_id, longId);
    await changes[0].undo();
    assert.deepEqual(calls.pop(), ['delete', longId]);
    await run('add_to_cart', { product_id: 7 });
    await run('update_cart_item', { item_id: longId, quantity: 3 });
    assert.deepEqual(calls.pop(), ['update', longId, 3]);
    await run('remove_cart_item', { item_id: longId });
    assert.deepEqual(calls.pop(), ['delete', longId]);
});

test('merchant switch gates the button, sheet and script, and the button has a name', () => {
    assert.equal(settings.find(item => item.id === 'core_care_assistant')?.value, true);
    assert.match(tabbar, /\{% set center_show = center_show and not assistant_on %\}/);
    assert.match(tabbar, /\{% if assistant_on %\}\{% include 'pages\.partials\.shopping-assistant' %\}\{% endif %\}/);
    assert.match(tabbar, /data-assistant-toggle aria-expanded="false" aria-controls="cc-assistant" aria-label=/);
    assert.match(layout, /core_care_assistant', true\) %\}<script defer src="\{\{ 'shopping-assistant\.js'\|asset \}\}/);
});

test('Salla is awaited first and products are written as text', () => {
    assert.match(source, /await globalThis\.Salla\?\.onReady\?\.\(\)/);
    assert.doesNotMatch(source, /innerHTML/);
    assert.doesNotMatch(sheet, /\|\s*raw\b/);
    // Adding goes through the store tool, so the change notice with its undo appears.
    assert.match(source, /notify: change => activity\?\.show\?\.\(change\)/);
    assert.match(source, /`\$\{TOOL_PREFIX\}add_to_cart`/);
    assert.match(sheet, /core_care_webmcp', true\) %\}\{% include 'pages\.partials\.ai-activity'/);
});

test('every translation exists in both languages and every icon is drawn', () => {
    assert.deepEqual(Object.keys(locales.ar).sort(), Object.keys(locales.en).sort());
    for (const [, key] of sheet.matchAll(/trans\(t ~ '([a-z_]+)'\)/g)) assert.ok(locales.ar[key], key);
    const keys = [...sheet.matchAll(/\{ key: '([a-z_]+)', icon: '([a-z]+)' \}/g)];
    assert.ok(keys.length >= 6);
    for (const [, key, icon] of keys) {
        for (const lang of ['ar', 'en']) assert.ok(locales[lang][`need_${key}`] && locales[lang][`terms_${key}`], `${lang} ${key}`);
        assert.match(iconTwig, new RegExp(`name == '${icon}'`), icon);
    }
    for (const icon of ['close', 'clock', 'budget', 'external']) assert.match(iconTwig, new RegExp(`name == '${icon}'`), icon);
});

test('the sheet exists on phones only and respects reduced motion', () => {
    assert.match(styles, /^body\.theme-beauty \.cc-assistant \{ display: none; \}/m);
    assert.match(styles, /@media \(max-width: 767px\)/);
    assert.match(styles, /prefers-reduced-motion: reduce/);
});

import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const source = fs.readFileSync(new URL('../src/assets/js/partials/core-care-webmcp.js', import.meta.url), 'utf8');
const webmcp = await import(`data:text/javascript;base64,${Buffer.from(source).toString('base64')}`);
const { modelContextOf, registerStoreTools, integerInput, optionsInput, plainText, compactCart, toolOutput, currentProductId } = webmcp;
const entry = fs.readFileSync(new URL('../src/assets/js/webmcp.js', import.meta.url), 'utf8');
const master = fs.readFileSync(new URL('../src/views/layouts/master.twig', import.meta.url), 'utf8');
const webpack = fs.readFileSync(new URL('../webpack.config.js', import.meta.url), 'utf8');
const settings = JSON.parse(fs.readFileSync(new URL('../twilight.json', import.meta.url), 'utf8')).settings;

const product = {
    id: 101, name: 'سيروم فيتامين سي', brand: { name: 'Core' }, price: 89, regular_price: 120, sale_price: 89, is_on_sale: true,
    currency: 'SAR', is_available: true, has_options: true, url: 'https://corecare-sa.com/p101', rating: { count: 4, rate: 5 },
    description: `<p>${'ترطيب عميق. '.repeat(400)}</p><script>alert(1)</script>`,
    options: [
        { id: 7, name: 'الحجم', type: 'radio', required: true, details: [{ id: 70, name: '30ml' }, { id: 71, name: '50ml', additional_price: 20, is_out: true }] },
        { id: 8, name: 'نقش', type: 'text', required: false, details: [] },
    ],
};

function fakeSalla(overrides = {}) {
    const calls = [];
    const cart = { count: 1, sub_total: 89, total: 89, items: [{ id: 5, product_id: 101, product_name: 'سيروم', quantity: 1, price: 89, total: 89, url: 'https://corecare-sa.com/p101' }] };
    let previous = null;
    const salla = {
        calls,
        config: { get: key => ({ 'page.slug': 'product.single', 'page.id': 101 })[key], isGuest: () => false },
        product: {
            async search(params) {
                calls.push(['search', params]);
                if (params.query === previous) { previous = null; throw new Error('Query is same as previous one!'); }
                previous = params.query;
                return { data: [product, { id: 102, name: 'غسول', price: 40, is_out_of_stock: true }], cursor: { count: 2 } };
            },
            async getDetails(id, withItems) { calls.push(['getDetails', id, withItems]); return { data: { ...product, id } }; },
            async categories() { return { data: [{ name: 'العناية بالبشرة', url: 'https://corecare-sa.com/c1', sub_categories: [{ name: 'سيروم' }] }] }; },
        },
        cart: {
            async details() { calls.push(['details']); return { data: { cart } }; },
            async addItem(payload) { calls.push(['addItem', payload]); return { data: { cart } }; },
            async updateItem(payload) { calls.push(['updateItem', payload]); return { data: { cart } }; },
            async deleteItem(id) { calls.push(['deleteItem', id]); return { data: { cart } }; },
            async addCoupon(code) { calls.push(['addCoupon', code]); const error = new Error('Request failed'); error.response = { data: { error: { message: 'الكوبون غير صالح' } } }; throw error; },
        },
        wishlist: { async add(id) { calls.push(['wishlist', id]); } },
        event: { dispatch: name => calls.push(['dispatch', name]) },
        url: { get: path => `https://corecare-sa.com/${path}` },
        ...overrides,
    };
    return salla;
}

async function register(salla = fakeSalla(), env = {}) {
    const tools = new Map();
    const optionsSeen = [];
    const context = { async registerTool(tool, options) { if (tools.has(tool.name)) throw new Error('duplicate'); tools.set(tool.name, tool); optionsSeen.push(options); } };
    const location = { href: 'https://corecare-sa.com/p101', assign: url => salla.calls.push(['assign', url]) };
    const doc = { querySelector: () => null };
    const names = await registerStoreTools(context, salla, { location, doc, ...env });
    const run = async (name, input) => JSON.parse(await tools.get(`corecare_${name}`).execute(input, { signal: new AbortController().signal }));
    return { tools, names, optionsSeen, run, salla };
}

test('only browsers with a WebMCP model context get tools, preferring document.modelContext', () => {
    const doc = { modelContext: { registerTool() {} } };
    const nav = { modelContext: { registerTool() {} } };
    assert.equal(modelContextOf(doc, nav), doc.modelContext);
    assert.equal(modelContextOf({}, nav), nav.modelContext);
    assert.equal(modelContextOf({}, {}), null);
    assert.equal(modelContextOf({ modelContext: {} }, {}), null);
    assert.match(entry, /if \(!modelContext \|\| window\.coreCareWebMcp\) return;/);
    assert.match(entry, /await window\.Salla\?\.onReady\?\.\(\);/);
});

test('the merchant can switch the tools off, and they load as a separate deferred file', () => {
    const setting = settings.find(item => item.id === 'core_care_webmcp');
    assert.equal(setting?.type, 'boolean');
    assert.equal(setting.value, true);
    assert.match(master, /\{% if theme\.settings\.get\('core_care_webmcp', true\) %\}[^]*?<script defer src="\{\{ 'webmcp\.js'\|asset \}\}/);
    assert.match(webpack, /webmcp\s*:\s*asset\('js\/webmcp\.js'\)/);
    // Chrome's origin trial token is optional, escaped by Twig and only printed when the tools are on.
    assert.equal(settings.find(item => item.id === 'core_care_webmcp_trial_token')?.value, null);
    assert.match(master, /\{% if webmcp_trial_token %\}<meta http-equiv="origin-trial" content="\{\{ webmcp_trial_token \}\}">/);
    assert.doesNotMatch(master, /webmcp_trial_token\s*\|\s*raw/);
});

test('tools are same-origin, uniquely named and within the recommended text budgets', async () => {
    const { tools, names, optionsSeen } = await register();
    assert.equal(names.length, 10);
    assert.ok(optionsSeen.every(options => !options?.exposedTo));
    for (const tool of tools.values()) {
        assert.match(tool.name, /^corecare_[a-z_]+$/);
        assert.ok(tool.name.length <= 30, tool.name);
        assert.ok(tool.description.length <= 500, tool.name);
        assert.equal(tool.inputSchema.type, 'object');
        for (const property of Object.values(tool.inputSchema.properties)) assert.ok(!property.description || property.description.length <= 150, tool.name);
    }
    const readOnly = [...tools.values()].filter(tool => tool.annotations?.readOnlyHint).map(tool => tool.name).sort();
    assert.deepEqual(readOnly, ['corecare_get_product', 'corecare_list_categories', 'corecare_search_products', 'corecare_view_cart']);
    // Nothing reaches checkout, payment or customer records.
    assert.doesNotMatch(source, /cart\.submit|createQuickOrder|salla\.(profile|order)\b/);
});

test('search passes Salla sort values, retries the SDK duplicate-query refusal and returns only Salla data', async () => {
    const { run, salla } = await register();
    const first = await run('search_products', { query: '  سيروم  ', sort: 'price_low_to_high', limit: 2 });
    assert.deepEqual(salla.calls[0], ['search', { query: 'سيروم', sort_by: 'priceFromLowToTop', per_page: 2 }]);
    assert.deepEqual(first.products[0], { product_id: 101, name: 'سيروم فيتامين سي', brand: 'Core', price: 89, regular_price: 120, currency: 'SAR', available: true, has_options: true, rating: { stars: 5, count: 4 }, url: 'https://corecare-sa.com/p101' });
    assert.deepEqual(first.products[1], { product_id: 102, name: 'غسول', price: 40, available: false });
    const again = await run('search_products', { query: 'سيروم' });
    assert.equal(again.ok, true);
    assert.equal((await run('search_products', { query: 'x', sort: 'cheapest' })).ok, false);
    assert.equal((await run('search_products', {})).ok, false);
});

test('product details fit the output budget, keep every option and strip markup', async () => {
    const { run } = await register();
    const raw = await (await register()).tools.get('corecare_get_product').execute({}, {});
    assert.ok(raw.length <= 1500, `${raw.length}`);
    const { product: details } = await run('get_product', {});
    assert.equal(details.product_id, 101);
    assert.deepEqual(details.options.map(option => [option.option_id, option.required, option.values.length]), [[7, true, 2], [8, false, 0]]);
    assert.deepEqual(details.options[0].values[1], { value_id: 71, name: '50ml', extra_price: 20, sold_out: true });
    assert.doesNotMatch(details.description, /<|alert/);
    assert.match(details.description, /…$/);
});

test('add to cart asks for required options, then sends Salla option ids', async () => {
    const { run, salla } = await register();
    const missing = await run('add_to_cart', { product_id: 101 });
    assert.equal(missing.ok, false);
    assert.match(missing.error, /الحجم/);
    assert.ok(!salla.calls.some(call => call[0] === 'addItem'));
    const added = await run('add_to_cart', { product_id: 101, quantity: 2, options: { 7: 70, 8: 'سارة' } });
    assert.equal(added.ok, true);
    assert.deepEqual(salla.calls.find(call => call[0] === 'addItem')[1], { id: 101, quantity: 2, options: { 7: 70, 8: 'سارة' } });
    assert.equal(added.cart.items[0].item_id, 5);
    assert.equal((await run('add_to_cart', { product_id: 101, quantity: 0, options: { 7: 70 } })).ok, false);
    assert.equal((await run('add_to_cart', { product_id: 'abc' })).ok, false);
});

test('cart changes go through Salla and failures come back as the store reason', async () => {
    const { run, salla } = await register();
    assert.equal((await run('update_cart_item', { item_id: 5, quantity: 3 })).ok, true);
    assert.deepEqual(salla.calls.find(call => call[0] === 'updateItem')[1], { id: 5, quantity: 3 });
    assert.equal((await run('remove_cart_item', { item_id: 5 })).ok, true);
    assert.deepEqual(await run('apply_coupon', { code: 'BAD' }), { ok: false, error: 'الكوبون غير صالح' });
    assert.equal((await run('view_cart')).cart.total, 89);
    assert.deepEqual((await run('open_cart_page')).navigating_to, 'https://corecare-sa.com/cart');
});

test('a visitor without a cart sees an empty cart, and guests are sent to sign in for the wishlist', async () => {
    const cartError = Object.assign(new Error('CartNotCreated'), { name: 'CartNotCreated' });
    const salla = fakeSalla({ config: { get: () => undefined, isGuest: () => true } });
    salla.cart.details = async () => { throw cartError; };
    const { run } = await register(salla);
    assert.deepEqual((await run('view_cart')).cart, { item_count: 0, items: [] });
    const saved = await run('add_to_wishlist', { product_id: 101 });
    assert.equal(saved.ok, false);
    assert.ok(salla.calls.some(call => call[0] === 'dispatch' && call[1] === 'login::open'));
    assert.ok(!salla.calls.some(call => call[0] === 'wishlist'));
    assert.equal((await run('get_product', {})).ok, false, 'no product page and no product_id');
});

test('input helpers validate strictly', () => {
    assert.equal(integerInput('3', 'n'), 3);
    assert.throws(() => integerInput(1.5, 'n'));
    assert.throws(() => integerInput(51, 'n', { max: 50 }));
    assert.deepEqual(optionsInput({ '7': '70' }), { 7: 70 });
    assert.throws(() => optionsInput([70]));
    assert.throws(() => optionsInput({ x: 1 }));
    assert.equal(optionsInput({}), undefined);
    assert.equal(plainText('<b>A</b>&amp;<br>B'), 'A &\nB');
    assert.equal(currentProductId({ querySelector: () => ({ value: '55' }) }, null), 55);
    assert.equal(compactCart({ items: [{ id: 1, quantity: 2, url: 'javascript:alert(1)' }] }).items[0].url, undefined);
    const long = toolOutput({ ok: true, products: Array.from({ length: 50 }, (_, id) => ({ id, name: 'x'.repeat(60) })) });
    assert.ok(long.length <= 1500);
    assert.equal(JSON.parse(long).truncated, true);
});

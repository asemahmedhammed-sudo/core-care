import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const context = vm.createContext({ URL, window: { location: { origin: 'https://preview.example' } } });
vm.runInContext(fs.readFileSync(new URL('../src/assets/js/partials/collection-state.js', import.meta.url), 'utf8').replaceAll('export function ', 'function '), context);
const menus = [{ title: 'Makeup', url: 'https://store.example/makeup/c1', children: [
    { title: 'Face', url: 'https://store.example/face/c2' },
    { title: '<Eyes>', url: 'https://store.example/eyes/c3' },
    { title: 'Invalid', url: 'javascript:alert(1)' },
    { title: 'Duplicate', url: 'https://store.example/c3' },
] }];

test('category navigation matches preview aliases and renders actual children or siblings', () => {
    let links = context.categoryNavigation(menus, 'https://preview.example/store/makeup/c1', 'All products');
    assert.deepEqual(Array.from(links, item => item.title), ['All products', 'Face', '<Eyes>']);
    assert.equal(links[0].active, true);
    links = context.categoryNavigation(menus, 'https://preview.example/store/eyes/c3', 'All products');
    assert.deepEqual(Array.from(links, item => item.title), ['Face', '<Eyes>']);
    assert.equal(links[1].active, true);
    for (const url of ['', 'https://preview.example/c999', 'javascript:alert(1)']) assert.equal(context.categoryNavigation(menus, url, 'All').length, 0);
});

test('navigation omits credential-bearing and unsafe destinations and accepts absent children', () => {
    const links = context.categoryNavigation([{ title: 'Actual', url: '/c1' }, { title: 'Unsafe', url: 'https://name:pass@store.example/c2' }], '/c1', 'All');
    assert.equal(links.length, 1);
    assert.equal(links[0].title, 'Actual');
    assert.equal(context.categoryNavigation(null, '/c1', 'All').length, 0);
    assert.equal(context.categoryNavigation([{title: 'Menu group', children: menus}], '/c3', 'All')[1].active, true);
});

test('active filter badge excludes base category and sort, counts ranges and nested variants', () => {
    assert.equal(context.activeFilterCount({}, 1), 0);
    assert.equal(context.activeFilterCount({ category_id: '1', sort: 'bestSell' }, 1), 0);
    assert.equal(context.activeFilterCount({ category_id: [1, 2], brand_id: [3, 4], price: { min: 0, max: 100 }, variants: { size: 5 }, rating: null }, 1), 5);
    assert.equal(context.activeFilterCount({ rating: 0, brand_id: [], price: {} }, 1), 1);
});

function pageFixture() {
    const changes = {};
    const sort = { value: 'ourSuggest', options: [{ value: 'ourSuggest' }, { value: 'bestSell' }], addEventListener: (event, fn) => changes[event] = fn };
    const list = { parsedFilters: { brand_id: [4] }, reloadCalls: 0, async reload() { this.reloadCalls++; } };
    const root = { dataset: {}, querySelector: selector => ({ 'salla-products-list': list, '#product-filter': sort })[selector] || null };
    const history = { replaceState: (_state, _title, url) => { history.url = String(url); } };
    const sandbox = vm.createContext({
        URL, URLSearchParams, activeFilterCount: context.activeFilterCount, categoryNavigation: context.categoryNavigation,
        BasePage: class { static initiateWhenReady() {} }, MutationObserver: class {},
        document: { querySelector: () => root }, window: { location: { href: 'https://preview.example/c1?sort=bestSell&filters[brand_id][]=4', search: '?sort=bestSell&filters[brand_id][]=4' }, history },
    });
    const source = fs.readFileSync(new URL('../src/assets/js/products.js', import.meta.url), 'utf8').replace(/^import .*;\n/gm, '');
    vm.runInContext(source + '\nthis.page = new Products();', sandbox);
    return { sandbox, sort, list, changes, history };
}

test('sorting restores URL state, retains active native filters and initializes once', async () => {
    const { sandbox, sort, list, changes, history } = pageFixture();
    sandbox.page.onReady();
    assert.equal(sort.value, 'bestSell');
    sort.value = 'ourSuggest';
    await changes.change();
    assert.equal(list.sortBy, 'ourSuggest');
    assert.equal(list.reloadCalls, 1);
    assert.deepEqual(list.parsedFilters, { brand_id: [4] });
    const url = new URL(history.url);
    assert.equal(url.searchParams.get('sort'), 'ourSuggest');
    assert.equal(url.searchParams.get('filters[brand_id][]'), '4');
    const handler = changes.change;
    sandbox.page.onReady();
    assert.equal(changes.change, handler);
});

test('a remembered sort replaces the fallback sort without dropping filters', () => {
    const { sandbox, sort, list } = pageFixture();
    list.sortBy = 'ourSuggest';
    sandbox.page.onReady();
    assert.equal(sort.value, 'bestSell');
    assert.equal(list.sortBy, 'bestSell');
    assert.equal(list.reloadCalls, 1);
    assert.deepEqual(list.parsedFilters, { brand_id: [4] });
});

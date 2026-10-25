import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const source = fs.readFileSync(new URL('../src/assets/js/partials/core-care-categories.js', import.meta.url), 'utf8');
const context = vm.createContext({ URL, window: { location: { origin: 'https://store.example' } }, HTMLElement: class {}, customElements: { define() {} } });
vm.runInContext(source.replace(/export function/g, 'function'), context);
test('category links preserve store paths and reject executable protocols', () => {
  assert.equal(context.safeMenuUrl('/skin?sort=new'), 'https://store.example/skin?sort=new');
  assert.equal(context.safeMenuUrl('https://cdn.example/category.png'), 'https://cdn.example/category.png');
  for (const value of ['javascript:alert(1)', 'data:text/html,test', '', null, 'file:///etc/passwd']) assert.equal(context.safeMenuUrl(value), null);
});

test('phone categories match menu links to Salla categories and their subcategories', () => {
  assert.equal(context.categoryIdFromUrl('https://store.example/ar/-/c187393441'), '187393441');
  assert.equal(context.categoryIdFromUrl('/ar/makeup/c1672001734/'), '1672001734');
  for (const value of ['/brands', '/ar/latest-products', '/ar/c12/products', 'javascript:alert(1)', null]) assert.equal(context.categoryIdFromUrl(value), null);
  const tree = [
    { id: 1, name: 'العطور', sub_categories: [{ id: 11, name: 'عطور نسائية', sub_categories: [] }] },
    { id: 2, name: 'المكياج', image: 'https://cdn.example/makeup.png', sub_categories: [
      { id: 21, name: 'الوجه', sub_categories: [{ id: 211, name: 'فاونديشن' }, { id: 212, name: '' }] },
      { id: 22, name: 'الحواجب', sub_categories: [] },
    ] },
  ];
  assert.equal(context.findCategory(tree, '21').name, 'الوجه');
  // Live stores code `id`; the number comes from `id_` or the category link.
  const coded = [{ id: 'yNazxp', id_: 187393441, name: 'المكياج', url: 'https://store.example/ar/مكياج/c187393441' },
    { id: 'QWOgKz', name: 'الخدود', url: 'https://store.example/ar/الخدود/c1933229215' }];
  assert.equal(context.findCategory(coded, '187393441').name, 'المكياج');
  assert.equal(context.findCategory(coded, '1933229215').name, 'الخدود');
  assert.equal(context.findCategory(tree, '999'), null);
  const node = context.categoryNode({ title: 'المكياج', url: '/ar/-/c2', children: [], sub_categories: context.findCategory(tree, '2').sub_categories });
  assert.deepEqual(node.children.map(child => child.title), ['الوجه', 'الحواجب']);
  assert.deepEqual(node.children[0].children.map(child => child.title), ['فاونديشن'], 'nameless categories are dropped');
  const sections = context.categorySections(node.children);
  assert.deepEqual(sections.groups.map(item => item.title), ['الوجه']);
  assert.deepEqual(sections.leaves.map(item => item.title), ['الحواجب']);
  // Sub-links the merchant built in the menu take priority over the category tree.
  const menu = context.categoryNode({ title: 'Brands', url: '/brands', children: [{ title: 'Nars', url: '/nars' }], sub_categories: [{ name: 'x' }] });
  assert.deepEqual(menu.children.map(child => child.title), ['Nars']);
  assert.equal(context.categoryInitial('الحواجب'), 'ح');
  assert.equal(context.categoryInitial('blush'), 'B');
  assert.equal(context.categoryInitial(''), '');
});

test('the app-style categories layout is limited to the phone sheet', () => {
  // From 768px tablets use the desktop header and its dropdown, as on the reference site.
  assert.match(source, /const COMPACT_QUERY = '\(max-width: 767px\)';/);
  assert.match(source, /get compact\(\) \{ return !!this\.media\?\.matches && document\.body\.classList\.contains\('cc-has-tabbar'\); \}/);
  assert.match(source, /if \(this\.compact\) return this\.selectCompact\(index\);/);
  // Subcategory data is only requested when the compact sheet needs it, and kept for the visit.
  assert.match(source, /if \(id && !this\.tree\) \{/);
  assert.match(source, /sessionStorage\.setItem\(key, JSON\.stringify\(tree\)\)/);
  assert.doesNotMatch(source, /innerHTML/);
  const styles = fs.readFileSync(new URL('../src/assets/styles/06-beauty/core-care-app-nav.scss', import.meta.url), 'utf8');
  const start = styles.indexOf('@media (max-width: 767px) {');
  const end = styles.indexOf('\n}\n', start);
  assert.ok(styles.indexOf('core-care-categories.core-categories--compact:not([hidden]) {') > start && styles.indexOf('core-care-categories.core-categories--compact:not([hidden]) {') < end);
  assert.match(styles, /html\[dir='rtl'\] body\.theme-beauty\.cc-has-tabbar core-care-categories\.core-categories--compact \.core-categories__tab\[aria-selected='true'\] \{ box-shadow: inset 4px 0 0 var\(--cc-secondary\); \}/);
});

test('homepage category discs never render empty', () => {
  const view = fs.readFileSync(new URL('../src/views/components/home/main-links.twig', import.meta.url), 'utf8');
  // The initial is always rendered beneath an optional image; links fall back to it when no icon is chosen.
  assert.match(view, /beauty-category__initial[^>]*>\{\{ initial\|upper \}\}<\/span>\s*\{% if cat\.image %\}<img/);
  assert.match(view, /label\|slice\(0, 2\) == 'ال' and label\|length > 2 \? label\|slice\(2, 1\)/);
  assert.match(view, /\{% if item\.icon %\}[\s\S]*?\{% else %\}<span class="beauty-category__initial"/);

  const media = fs.readFileSync(new URL('../src/assets/js/partials/category-media.js', import.meta.url), 'utf8');
  const ctx = vm.createContext({});
  vm.runInContext(media.replace(/export (default )?function/g, 'function'), ctx);
  const image = (naturalWidth, complete = true) => {
    const classes = new Set();
    return { complete, naturalWidth, naturalHeight: naturalWidth, removed: false, classList: { add: c => classes.add(c) }, classes,
      matches: () => true, remove() { this.removed = true; } };
  };
  const real = image(400); ctx.settleCategoryImage(real);
  assert.ok(real.classes.has('is-loaded') && !real.removed);
  for (const width of [0, 1]) { const blank = image(width); ctx.settleCategoryImage(blank); assert.ok(blank.removed, `width ${width}`); }
  const pending = image(0, false); ctx.settleCategoryImage(pending);
  assert.ok(!pending.removed, 'lazy images are left until they load');
});

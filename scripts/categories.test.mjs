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

test('the categories panel lists the store categories and their subcategories', () => {
  assert.equal(context.categoryIdFromUrl('https://store.example/ar/-/c187393441'), '187393441');
  assert.equal(context.categoryIdFromUrl('/ar/makeup/c1672001734/'), '1672001734');
  for (const value of ['/brands', '/ar/latest-products', '/ar/c12/products', 'javascript:alert(1)', null]) assert.equal(context.categoryIdFromUrl(value), null);
  // Shape of salla.product.api.categories(): coded `id`, the number in `id_`, children in `sub_categories`.
  const tree = [
    { id: 'yNazxp', id_: 187393441, name: 'المكياج', url: 'https://store.example/ar/مكياج/c187393441', image: 'https://cdn.example/makeup.png', sub_categories: [
      { id: 'QWOgKz', name: 'الوجه', url: '/ar/الوجه/c1031129031', sub_categories: [{ name: 'فاونديشن', url: '/ar/فاونديشن/c364782325' }, { name: '', url: '/ar/-/c1' }] },
      { id: 'pRxkAo', name: 'الحواجب', url: '/ar/makeup-brows/c721691842', sub_categories: [] },
    ] },
    { id: 'brands', name: 'الماركات التجارية', url: '/ar/brands', sub_categories: [] },
    { id: 'x', name: '', url: '/ar/-/c2', sub_categories: [] },
    { id: 'y', name: 'Unsafe', url: 'javascript:alert(1)', sub_categories: [] },
  ];
  const categories = context.storeCategories(tree);
  assert.deepEqual(categories.map(item => item.title), ['المكياج', 'الماركات التجارية'], 'nameless and unsafe entries are dropped');
  assert.equal(categories[0].image, 'https://cdn.example/makeup.png');
  assert.deepEqual(categories[0].children.map(child => child.title), ['الوجه', 'الحواجب']);
  assert.deepEqual(categories[0].children[0].children.map(child => child.title), ['فاونديشن'], 'nameless subcategories are dropped');
  assert.equal(context.storeCategories(null).length, 0);
  const sections = context.categorySections(categories[0].children);
  assert.deepEqual(sections.groups.map(item => item.title), ['الوجه']);
  assert.deepEqual(sections.leaves.map(item => item.title), ['الحواجب']);
  assert.equal(context.categoryInitial('الحواجب'), 'ح');
  assert.equal(context.categoryInitial('blush'), 'B');
  assert.equal(context.categoryInitial(''), '');
});

test('the app-style categories layout is limited to the phone sheet', () => {
  // From 768px tablets use the desktop header and its dropdown, as on the reference site.
  assert.match(source, /const COMPACT_QUERY = '\(max-width: 767px\)';/);
  assert.match(source, /get compact\(\) \{ return !!this\.media\?\.matches && document\.body\.classList\.contains\('cc-has-tabbar'\); \}/);
  assert.match(source, /if \(this\.compact\) return this\.selectCompact\(index\);/);
  // Desktop and phone read Salla's category tree (kept for the visit), not the header menu,
  // whose links can point to deleted categories.
  assert.match(source, /this\.menus = storeCategories\(tree\);/);
  assert.doesNotMatch(source, /getMenus/);
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

test('the desktop menu follows the Nice One columns without invented content', () => {
  // «All products» leads the columns, subcategories are chevron headings, deeper levels are plain links.
  assert.match(source, /const head = \{ \.\.\.item, children: \[\] \};/, '«All products» heads the columns without repeating the subcategories');
  assert.match(source, /this\.columnGroup\(head, this\.ar \? 'جميع المنتجات' : 'All products'/);
  assert.match(source, /item\.children\.forEach\(child => groups\.append\(this\.columnGroup\(child\)\)\);/);
  assert.match(source, /link\.append\(this\.chevron\('m9 6 6 6-6 6', 'core-categories__chevron'\)\);/);
  // Rail thumbnails come from the category image, falling back to the first letter of its name.
  assert.match(source, /this\.element\('span', 'core-categories__thumb', categoryInitial\(item\.title\)\)/);
  // Pointing with a mouse switches sections on larger screens only.
  assert.match(source, /e\.pointerType === 'mouse' && !this\.compact/);
  // Salla has no brands per category, so the menu shows no brand tiles.
  assert.doesNotMatch(source, /brand-tile|core-categories__brand/);
  const styles = fs.readFileSync(new URL('../src/assets/styles/06-beauty/core-care-categories.scss', import.meta.url), 'utf8');
  assert.match(styles, /&:not\(\.core-categories--compact\) \.core-categories__toolbar \{ display: none; \}/);
  // The page under the menu is dimmed from the menu's top down, and clicking it closes the menu.
  assert.match(styles, /&:not\(\.core-categories--compact\)::before \{\n    content: ''; position: fixed; z-index: -1; inset: 0; top: var\(--cc-categories-shade, 0px\);/);
  assert.match(source, /if \(e\.target === this && !this\.compact\) this\.setOpen\(false\);/);
  // Logical inline properties compile to LTR here, so direction-specific rules are written per direction.
  assert.doesNotMatch(styles, /(padding|margin|border)-inline-(start|end)/);
  assert.match(styles, /html\[dir='rtl'\] core-care-categories \{\n  \.core-categories__chevron \{ transform: scaleX\(-1\); \}/);
});

// Salla gives a category one image; the phone banner adapts to it instead of cropping it (2026-11-06).
test('the phone banner picks its layout from the image shape', () => {
  assert.equal(context.bannerLayout(900, 900), 'composed', 'square art is shown whole beside the name');
  assert.equal(context.bannerLayout(600, 900), 'composed');
  assert.equal(context.bannerLayout(1199, 600), 'composed');
  assert.equal(context.bannerLayout(1200, 600), 'wide', '2:1 art fills the strip');
  assert.equal(context.bannerLayout(1600, 500), 'wide');
  for (const [w, h] of [[0, 0], [0, 600], [900, 0], [NaN, 600]]) assert.equal(context.bannerLayout(w, h), 'composed', 'unknown sizes keep the safe layout');
  assert.equal(context.canSampleImage('https://cdn.files.salla.network/other/1430728739/a-original.webp'), true);
  assert.equal(context.canSampleImage('https://cdn.salla.sa/abc/category.png'), true);
  for (const value of ['https://cdn.example/category.png', 'http://cdn.salla.sa/a.png', 'javascript:alert(1)', null]) assert.equal(context.canSampleImage(value), false, String(value));
});

const pixels = (size, paint) => {
  const data = new Uint8ClampedArray(size * size * 4);
  for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) data.set(paint(x, y), (y * size + x) * 4);
  return data;
};

test('the composed banner takes its background from the image', () => {
  const size = 24;
  const centre = (x, y) => x > 6 && x < 17 && y > 6 && y < 17;
  // The store's current art: a pink subject on white. Background: a pale pink tint, image multiplied.
  const onWhite = context.bannerPalette(pixels(size, (x, y) => centre(x, y) ? [230, 120, 150, 255] : [255, 255, 255, 255]), size);
  assert.equal(onWhite.blend, true);
  assert.equal(onWhite.dark, false);
  const [r, g, b] = onWhite.background.match(/\d+/g).map(Number);
  assert.ok(r > g && r > b && Math.min(r, g, b) > 220, `pale pink tint, got ${onWhite.background}`);
  // Transparent PNG backgrounds count as white.
  assert.equal(context.bannerPalette(pixels(size, (x, y) => centre(x, y) ? [40, 90, 60, 255] : [0, 0, 0, 0]), size).blend, true);
  // Art with its own backdrop continues it; a dark backdrop switches the text to white.
  assert.deepEqual({ ...context.bannerPalette(pixels(size, () => [20, 30, 80, 255]), size) }, { background: 'rgb(20 30 80)', blend: false, dark: true });
  assert.equal(context.bannerPalette(pixels(size, () => [250, 225, 230, 255]), size).dark, false);
  // Blank or unreadable images keep the stylesheet's neutral surface.
  assert.equal(context.bannerPalette(pixels(size, () => [255, 255, 255, 255]), size), null);
  assert.equal(context.bannerPalette(new Uint8ClampedArray(10), size), null);
  assert.equal(context.bannerPalette(null, size), null);
});

test('the phone banner keeps one height for both layouts and never crops square art', () => {
  const styles = fs.readFileSync(new URL('../src/assets/styles/06-beauty/core-care-app-nav.scss', import.meta.url), 'utf8');
  assert.match(styles, /\.core-categories__banner \{\n[^}]*height: 112px;/);
  assert.match(styles, /\.core-categories__banner-image \{ display: block; width: 100%; height: 100%; object-fit: contain; \}/);
  assert.match(styles, /\.core-categories__banner\[data-layout='wide'\] \{[\s\S]*?\.core-categories__banner-image \{ object-fit: cover; \}/);
  assert.match(styles, /\.core-categories__banner\[data-blend\] \.core-categories__banner-image \{ mix-blend-mode: multiply; \}/);
  assert.doesNotMatch(styles, /max-height: 120px; object-fit: cover/, 'the old centre crop is gone');
  // crossOrigin is set before src (or the request is made without CORS), and only for Salla's hosts.
  assert.match(source, /if \(sample && canSampleImage\(src\)\) img\.crossOrigin = 'anonymous';\n\s*img\.src = src;/);
  assert.match(source, /image\.addEventListener\('error', \(\) => banner\.remove\(\), \{ once: true \}\);/);
});

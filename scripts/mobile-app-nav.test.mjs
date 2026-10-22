import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const read = path => fs.readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');
const layout = read('src/views/layouts/master.twig');
const tabbar = read('src/views/pages/partials/mobile-tabbar.twig');
const header = read('src/views/components/header/header.twig');
const styles = read('src/assets/styles/06-beauty/core-care-app-nav.scss');
const tokens = read('src/assets/styles/06-beauty/beauty.scss');
const categories = read('src/assets/js/partials/core-care-categories.js');
const app = read('src/assets/js/app.js');
const manifest = JSON.parse(read('twilight.json'));
const setting = id => manifest.settings.find(item => item.id === id);

test('safe-area insets are exposed and the tab bar is opt-out by setting', () => {
  assert.match(layout, /<meta name="viewport" content="width=device-width, initial-scale=1\.0, viewport-fit=cover">/);
  assert.match(layout, /theme\.settings\.get\('beauty_mobile_tabbar', true\) \? 'cc-has-tabbar' : ''/);
  assert.match(layout, /\{% if theme\.settings\.get\('beauty_mobile_tabbar', true\) %\}\{% include 'pages\.partials\.mobile-tabbar' %\}\{% include 'pages\.partials\.mobile-search' %\}\{% endif %\}/);
  assert.equal(setting('beauty_mobile_tabbar').value, true);
  assert.equal(setting('beauty_mobile_tabbar').type, 'boolean');
  // Landscape iPhones draw under the notch with viewport-fit=cover; content keeps to the safe area.
  assert.match(tokens, /padding-left: env\(safe-area-inset-left, 0px\);\s*padding-right: env\(safe-area-inset-right, 0px\);/);
  assert.match(tokens, /--cc-tabbar-offset: calc\(var\(--cc-app-nav-height\) \+ var\(--cc-safe-bottom\)\)/);
});

test('tab bar uses Salla components and links instead of custom commerce logic', () => {
  assert.match(tabbar, /<nav class="cc-tabbar[^"]*"[^>]*aria-label="\{\{ trans\('beauty\.tabbar\.label'\) \}\}"/);
  assert.match(tabbar, /href="\{\{ link\('\/'\) \}\}"\{% if is_page\('index'\) %\} aria-current="page"\{% endif %\}/);
  assert.match(tabbar, /<button class="cc-tabbar__item" type="button" data-categories-toggle aria-expanded="false" aria-controls="core-care-categories">/);
  assert.match(tabbar, /<salla-cart-summary class="cc-tabbar__cart[^>]*>\s*<span slot="icon" class="cc-tabbar__item">/);
  assert.match(tabbar, /\{% if user\.type == 'user' %\}\s*<a class="cc-tabbar__item" href="\{\{ link\('account\/profile'\) \}\}"/);
  assert.match(tabbar, /onclick="salla\.event\.dispatch\('login::open'\)"/);
  assert.doesNotMatch(tabbar, /\|raw/);
  for (const icon of tabbar.match(/<svg[^>]*>/g)) assert.match(icon, /aria-hidden="true"/);
});

test('campaign slot needs an image and an https link, and always has an accessible name', () => {
  assert.match(tabbar, /center_url\|lower starts with 'https:\/\/'/);
  assert.match(tabbar, /\{% set center_show = center_valid and center_mode != 'none' and \(center_mode != 'image' or center_image\) %\}/);
  assert.match(tabbar, /\{% if center_show %\}/);
  assert.match(tabbar, /alt="\{\{ \(center_label \?: trans\('beauty\.tabbar\.campaign'\)\)\|e\('html_attr'\) \}\}"/);
  assert.match(tabbar, /href="\{\{ center_url\|e\('html_attr'\) \}\}"/);
  assert.equal(setting('beauty_tabbar_center_label').multilanguage, true);
  assert.ok(setting('beauty_tabbar_center_label').maxLength <= 20);
  assert.equal(setting('beauty_tabbar_center_image').format, 'image');
});

test('empty cart badge is hidden and follows Salla cart updates', async () => {
  const source = read('src/assets/js/partials/core-care-tabbar.js');
  const { cartIsEmpty, syncCartBadges } = await import(`data:text/javascript;base64,${Buffer.from(source).toString('base64')}`);
  for (const value of [0, '0', null, undefined, NaN, -1]) assert.equal(cartIsEmpty(value), true, String(value));
  for (const value of [1, '3', 12]) assert.equal(cartIsEmpty(value), false, String(value));
  const carts = [0, 1].map(() => { const attrs = new Set(); return { attrs, toggleAttribute: (name, on) => (on ? attrs.add(name) : attrs.delete(name)) }; });
  const root = { querySelectorAll: selector => (selector === '.cc-tabbar__cart' ? carts : []) };
  syncCartBadges(2, root);
  assert.ok(carts.every(cart => !cart.attrs.has('data-empty')));
  syncCartBadges(0, root);
  assert.ok(carts.every(cart => cart.attrs.has('data-empty')));
  assert.match(tabbar, /\{% if not cart\.items_count\|default\(0\) %\} data-empty\{% endif %\}/);
  assert.match(styles, /\.cc-tabbar__cart\[data-empty\] \.s-cart-summary-count \{ display: none; \}/);
});

test('header and tab bar open one categories panel and stay in sync', () => {
  assert.match(categories, /this\.triggers = \[\.\.\.document\.querySelectorAll\('\[data-categories-toggle\]'\)\]/);
  assert.match(categories, /this\.triggers\.forEach\(item => item\.setAttribute\('aria-expanded', String\(open\)\)\)/);
  assert.match(categories, /if \(trigger\) this\.trigger = trigger;/);
  assert.match(categories, /classList\.toggle\('cc-categories-open', open\)/);
  assert.match(header, /data-categories-toggle type="button" aria-expanded="false" aria-controls="core-care-categories">/);
});

test('mobile navigation is limited to phones and portrait tablets and respects other bottom UI', () => {
  assert.match(styles, /^body\.theme-beauty \.cc-tabbar \{ display: none; \}/m);
  assert.match(styles, /@media \(max-width: 1023px\) \{\s*body\.theme-beauty\.cc-has-tabbar \{/);
  assert.match(styles, /padding-bottom: var\(--cc-safe-bottom\);/);
  assert.match(styles, /padding-bottom: var\(--cc-tabbar-offset\);/);
  // Never two fixed bars on phone product pages, never over the keyboard, never under the WhatsApp button.
  assert.match(tabbar, /page\.slug == 'product\.single' and theme\.settings\.get\('sticky_add_to_cart'\)/);
  assert.match(styles, /@media \(max-width: 640px\) \{[\s\S]*?\.cc-tabbar--yield \{ display: none; \}/);
  assert.match(styles, /&:has\(:is\(input, textarea, select\):focus\) \.cc-tabbar \{ display: none; \}/);
  assert.match(styles, /\.wa-s-n \{ translate: 0 calc\(-1 \* var\(--cc-tabbar-offset\)\); \}/);
  // Overlays keep their order: header < categories sheet < tab bar < cart drawer and sheets (60+).
  assert.match(tokens, /--cc-z-header: 30;\s*--cc-z-categories: 45;\s*--cc-z-tabbar: 50;/);
  assert.match(styles, /\.cc-tabbar__item \{[^}]*min-height: 44px;/);
});

test('compact header keeps search, categories, language and notifications in one sticky row', () => {
  assert.match(styles, /grid-template-areas: 'scope scope scope scope' 'search cats lang bell';/);
  assert.match(styles, /\.store-header:has\(#mainnav\[data-header-sticky='true'\]\) \{ position: sticky; top: 0; \}/);
  assert.match(styles, /\.core-care-header__actions > salla-user-menu, \.core-care-header__actions > salla-cart-summary \{ display: none; \}/);
  // The announcement strip scrolls away instead of sticking with the header.
  assert.match(header, /<salla-advertisement data-testid="beauty-announcement"><\/salla-advertisement>\s*<header data-testid="store-header" class="store-header">/);
  assert.match(header, /aria-label="\{\{ trans\('beauty\.header\.scope_prefix'\) \}\} \{\{ store\.scope\.name \}\}"/);
});

test('add-to-cart animation targets the visible cart summary', () => {
  assert.match(app, /\[\.\.\.document\.querySelectorAll\('salla-cart-summary'\)\]\.find\(el => el\.getClientRects\(\)\.length\)/);
});

test('desktop (1024px and wider) keeps its design: mobile rules stay inside phone/tablet media queries', () => {
  // Outside media queries the app-nav stylesheet only hides the tab bar and lowers motion.
  const source = styles.replace(/\/\/.*$/gm, '');
  const topLevel = [];
  for (let i = 0, depth = 0, start = 0; i < source.length; i += 1) {
    if (source[i] === '{') { if (depth === 0) start = i; depth += 1; }
    if (source[i] === '}' && --depth === 0) {
      // Sass variable declarations before a block are not part of its prelude.
      const prelude = source.slice(source.lastIndexOf('}', start) + 1, start).split(';').pop().trim();
      if (!/^@(media|mixin)/.test(prelude)) topLevel.push(`${prelude} ${source.slice(start, i + 1)}`);
    }
  }
  assert.deepEqual(topLevel, ['body.theme-beauty .cc-tabbar { display: none; }']);
  for (const query of styles.match(/@media [^{]+/g)) {
    assert.match(query, /max-width: (1023|767|640|359)px|prefers-reduced-motion/, query);
  }
  // Hero pagination: the original desktop capsule stays; the compact bars only override it below 1024px.
  const home = read('src/assets/styles/06-beauty/core-care-home.scss');
  assert.match(home, /\.beauty-promotions__dots \{\s*grid-area: 1 \/ 1 \/ 2 \/ -1; justify-self: center; align-self: end;/);
  assert.match(home, /\.beauty-promotions__dots::before \{\s*content: '';/);
  assert.match(home, /@media \(max-width: 1023px\) \{\s*\.beauty-promotions__viewport:has\(> \[data-promotion-slide\] ~ \[data-promotion-slide\]\) \{ grid-template-rows: auto minmax\(24px, auto\); \}/);
  // Compact-only header parts are hidden in the desktop header.
  assert.match(read('src/assets/styles/06-beauty/core-care-header.scss'), /\.core-care-header__grid-icon, \.core-care-header__scope-prefix, \.core-care-header__scope-chevron, \.core-care-header__scan \{ display: none; \}/);
});

test('compact header fixes found in the live Salla preview (2026-10-21)', () => {
  // salla-search's inline wrapper has min-width: 220px and covered the icons below ~390px.
  assert.match(styles, /\.core-care-header__search :is\(\.s-search-placeholder-wrapper, \.s-search-input-wrapper, \.s-search-input\) \{ min-width: 0; width: 100%; \}/);
  // The inherited `#mainnav .sicon-menu` rule needs an id-level selector to hide the old menu glyph.
  assert.match(styles, /#mainnav \[data-categories-toggle\] \.sicon-menu \{ display: none; \}/);
});

test('app-style home on phones: tall banner switch, header over it, two-row shortcuts (desktop untouched)', async () => {
  const home = read('src/assets/styles/06-beauty/core-care-home.scss');
  const partial = read('src/views/pages/partials/home/promotions.twig');
  const component = read('src/views/components/home/beauty-promotions.twig');
  const field = manifest.components.find(c => c.path === 'home.beauty-promotions').fields.find(f => f.id === 'mobile_tall');
  // Opt-in, off by default: existing wide mobile artwork is never cropped to a square on publish.
  assert.equal(field.type, 'boolean');
  assert.equal(field.value, false);
  assert.match(component, /promotion_mobile_tall: component\.mobile_tall\|default\(false\)/);
  assert.match(partial, /promotion_mobile_tall\|default\(false\) \? ' beauty-promotions--mobile-tall' : ''/);
  // Phone-only rules live in the max-width: 767px block of the home stylesheet.
  const phone = home.slice(home.indexOf('// Phones (app reference)'));
  assert.ok(home.lastIndexOf('@media (max-width: 767px) {', home.indexOf('// Phones (app reference)')) > home.indexOf('@media (max-width: 1023px)'));
  assert.match(phone, /\.beauty-promotions--mobile-tall \{ --promo-ratio: 1 \/ 1; \}/);
  assert.match(phone, /\.beauty-promotions__arrow \{ display: none; \}/);
  assert.match(phone, /\.beauty-categories__list:has\(> li:nth-child\(6\)\) \{\s*(?:\/\/[^\n]*\s*)?display: grid; grid-auto-flow: column; grid-template-rows: repeat\(2, auto\); grid-auto-columns: calc\(\(100% - 4 \* 20px\) \/ 4\.3\);/);
  // The header overlay applies only when the tall banner is the first section, and only while at the top.
  assert.match(styles, /\$cc-hero-first: 'body\.theme-beauty\.cc-has-tabbar\.beauty-reference-home:has\(#main-content > \.beauty-promotions--mobile-tall\):not\(:has\(#main-content > :not\(\.s-design-invisible-dom, salla-hook, salla-free-shipping-banner:empty\) ~ \.beauty-promotions--mobile-tall\)\)';/);
  assert.match(styles, /@media \(max-width: 767px\) \{\s*#\{\$cc-hero-first\} \{/);
  assert.match(styles, /html:not\(\.cc-categories-open\) #\{\$cc-hero-first\}\.cc-header-at-top \{\s*\.store-header \{ background: transparent;/);
  const source = read('src/assets/js/partials/core-care-tabbar.js');
  const { headerAtTop } = await import(`data:text/javascript;base64,${Buffer.from(source).toString('base64')}`);
  assert.equal(headerAtTop(0), true);
  assert.equal(headerAtTop(7), true);
  assert.equal(headerAtTop(8), false);
  assert.equal(headerAtTop(500), false);
});

test('empty Salla free-shipping banner does not add a gap above the first section on phones and tablets', () => {
  assert.match(styles, /#main-content > salla-free-shipping-banner:empty \{ display: none; \}/);
});

test('phone search: the Salla search window, restyled, plus suggested brands (phones and tablets only)', async () => {
  const config = read('src/views/pages/partials/mobile-search.twig');
  const layoutNow = read('src/views/layouts/master.twig');
  assert.match(layoutNow, /\{% include 'pages\.partials\.mobile-tabbar' %\}\{% include 'pages\.partials\.mobile-search' %\}/);
  // No second search component or custom window: results, history and most-searched stay Salla's.
  assert.doesNotMatch(config, /<salla-search|<core-care-search-sheet/);
  assert.match(config, /<span hidden id="cc-search-config" data-clear-history-label="\{\{ trans\('beauty\.search\.clear_history'\)\|e\('html_attr'\) \}\}"\{% if brand_names\|length %\} data-brands-url="\{\{ link\('brands'\)\|e\('html_attr'\) \}\}" data-brands-title="\{\{ trans\('beauty\.search\.brands'\)\|e\('html_attr'\) \}\}" data-brands-names="\{\{ brand_names\|join\('\|'\)\|e\('html_attr'\) \}\}"\{% endif %\}><\/span>/);
  const brandSetting = manifest.settings.find(item => item.id === 'beauty_search_brands');
  assert.equal(brandSetting.format, 'textarea');
  assert.equal(brandSetting.value, null);
  assert.equal(manifest.settings.some(item => item.id === 'beauty_search_popular'), false);
  assert.match(styles, /salla-modal\.s-search-modal-new \{[\s\S]*?font-size: 16px; \/\/ 16px keeps iOS from zooming/);
  assert.match(styles, /\.s-search-panel\[data-cc-typing\] \.cc-search-brands-section \{ display: none; \}/);

  const source = read('src/assets/js/partials/core-care-search-sheet.js');
  const mod = await import(`data:text/javascript;base64,${Buffer.from(source).toString('base64')}`);
  assert.match(source, /window\.matchMedia\('\(max-width: 1023px\)'\)\.matches/);
  for (const value of ['javascript:alert(1)', 'data:text/html,x', '', null, 'https://u:p@x.test/a']) assert.equal(mod.safeUrl(value, 'https://store.test/'), null, String(value));
  // Brands come only from the theme's own brands page tiles, with valid links, logos and names, at most 12.
  const tile = (href, src, alt) => ({ getAttribute: name => (name === 'href' ? href : null), querySelector: () => ({ getAttribute: name => ({ src, alt })[name] ?? null }) });
  const tiles = [tile('/brand/a', 'https://cdn.test/a.png', 'NYX'), tile('javascript:x', 'https://cdn.test/b.png', 'Bad'), tile('/brand/c', 'https://cdn.test/c.png', '')];
  for (let i = 0; i < 20; i += 1) tiles.push(tile(`/brand/${i}`, `https://cdn.test/${i}.png`, `Brand ${i}`));
  const doc = { querySelectorAll: selector => (selector === 'a[data-testid="store-brand-item"]' ? tiles : []) };
  const brands = mod.brandsFromDocument(doc, 'https://store.test/ar/');
  assert.deepEqual(brands[0], { url: 'https://store.test/brand/a', logo: 'https://cdn.test/a.png', name: 'NYX' });
  assert.equal(brands.length, 21);
  assert.ok(brands.every(brand => brand.name && brand.url.startsWith('https://store.test/')));
  // Only the merchant's names, in their order, ignoring case and spaces; unknown names and duplicates are skipped.
  assert.deepEqual(mod.pickBrands(brands, ['brand 3', 'nyx', 'Unknown', 'NYX', 'Brand3']).map(b => b.name), ['Brand 3', 'NYX']);
  assert.equal(mod.pickBrands(brands, brands.map(b => b.name)).length, mod.BRANDS_LIMIT);
  assert.deepEqual(mod.pickBrands(brands, []), []);
  // Stores can hold several brands with one name (the live store has 154 such names); the first tile wins.
  const twins = [{ name: 'Avon', url: 'https://store.test/a1', logo: 'https://cdn.test/1.png' }, { name: 'AVON', url: 'https://store.test/a2', logo: 'https://cdn.test/2.png' }];
  assert.equal(mod.pickBrands(twins, ['avon'])[0].url, 'https://store.test/a1');
  // Clear-all uses Salla's own per-term remove buttons until none remain.
  const removes = [1, 2, 3].map(() => ({ clicked: 0, click() { this.clicked += 1; removes.splice(removes.indexOf(this), 1); } }));
  const panel = { querySelector: selector => (selector === '.s-search-history-chip-remove' ? removes[0] || null : null) };
  const all = [...removes];
  await mod.clearHistory(panel, () => Promise.resolve());
  assert.equal(removes.length, 0);
  assert.ok(all.every(item => item.clicked === 1));
  assert.match(styles, /\.s-search-history-chip-icon, \.s-search-history-chip-remove \{ display: none; \}/);
  assert.match(styles, /\.cc-search-history-clear \{\s*position: absolute; top: 12px;/);
  assert.doesNotMatch(source, /innerHTML|insertAdjacentHTML/);
});

test('phones: no language/currency icon in the header, round icon discs, and a footer switch keeps it reachable', () => {
  const footer = read('src/views/components/footer/footer.twig');
  const tabbarJs = read('src/assets/js/partials/core-care-tabbar.js');
  const phone = styles.slice(styles.indexOf("// Phones: no language/currency icon in the header"));
  assert.match(phone, /^\/\/ Phones: no language\/currency icon in the header[^\n]*\n@media \(max-width: 767px\) \{/);
  assert.match(phone, /grid-template-areas: 'scope scope scope' 'search cats bell';/);
  assert.match(phone, /\.core-care-header__actions > \.core-care-header__locale, \.core-care-language-menu > \.core-care-header__locale \{ display: none; \}/);
  // The language panel itself stays in the page so the footer switch can open it.
  assert.doesNotMatch(phone, /\.core-care-language-menu \{ display: none/);
  assert.match(styles, /\.core-care-header__links > \[data-categories-toggle\], \.core-care-header__notification \{ border-radius: 50%; background: var\(--cc-utility-surface\); \}/);
  assert.match(styles, /\.core-care-header__search \.s-search-icon :is\(svg, path\) \{ fill: var\(--cc-icon\); \}/);
  assert.match(styles, /\.core-care-header__search \.s-search-icon-wrap \{ z-index: 1; pointer-events: none; \}/);
  assert.match(footer, /\{% if store\.settings\.is_multilingual or store\.settings\.currencies_enabled %\}\s*<button class="core-care-footer__localization" type="button" data-cc-localization-open>/);
  assert.match(read('src/assets/styles/06-beauty/core-care-footer.scss'), /body\.theme-beauty \.core-care-footer__localization \{ display: none; \}/);
  assert.match(tabbarJs, /closest\('\[data-cc-localization-open\]'\)[\s\S]*?event\.stopPropagation\(\);[\s\S]*?\.core-care-language-menu \[data-language-toggle\], \.core-care-header__actions > \.core-care-header__locale'\)\?\.click\(\);\s*\}, true\);/);
});

test('barcode search: hidden unless the browser has BarcodeDetector and a camera, then opens Salla search', async () => {
  // Hidden by default in the markup and in the desktop header styles.
  assert.match(header, /<button class="core-care-header__scan" type="button" data-barcode-scan hidden aria-label="\{\{ trans\('beauty\.search\.scan'\) \}\}"/);
  assert.match(read('src/assets/styles/06-beauty/core-care-header.scss'), /\.core-care-header__scan \{ display: none; \}/);
  assert.match(styles, /\.core-care-header__scan:not\(\[hidden\]\) \{\s*grid-area: search; justify-self: end;/);
  const source = read('src/assets/js/partials/core-care-barcode-scan.js');
  const mod = await import(`data:text/javascript;base64,${Buffer.from(source).toString('base64')}`);
  const camera = { mediaDevices: { getUserMedia() {} } };
  assert.deepEqual(await mod.scanFormats({ isSecureContext: true, navigator: camera }), [], 'no BarcodeDetector (iPhone Safari)');
  assert.deepEqual(await mod.scanFormats({ isSecureContext: false, navigator: camera, BarcodeDetector: { getSupportedFormats: async () => ['ean_13'] } }), [], 'insecure page');
  assert.deepEqual(await mod.scanFormats({ isSecureContext: true, navigator: {}, BarcodeDetector: { getSupportedFormats: async () => ['ean_13'] } }), [], 'no camera API');
  assert.deepEqual(await mod.scanFormats({ isSecureContext: true, navigator: camera, BarcodeDetector: { getSupportedFormats: async () => ['qr_code', 'ean_13', 'upc_a'] } }), ['ean_13', 'upc_a']);
  assert.deepEqual(await mod.scanFormats({ isSecureContext: true, navigator: camera, BarcodeDetector: { getSupportedFormats: async () => ['qr_code'] } }), [], 'no product formats');
  assert.equal(mod.cleanCode(' 8682536040402 '), '8682536040402');
  for (const value of ['', '12', '<script>', 'javascript:alert(1)', 'x'.repeat(60), null]) assert.equal(mod.cleanCode(value), '', String(value));
  assert.equal(mod.searchHref('/ar/search', '8682536040402'), '/ar/search?q=8682536040402');
  // The camera is always released: on close and when the page is hidden.
  assert.match(source, /getTracks\(\)\.forEach\(track => track\.stop\(\)\)/);
  assert.match(source, /visibilitychange[\s\S]*?scanner\.close\(\)/);
  assert.doesNotMatch(source, /innerHTML|insertAdjacentHTML/);
});

test('tab bar follows the app reference: 28px outline icons, black labels, pale blue current tab', () => {
  const styles = read('src/assets/styles/06-beauty/core-care-app-nav.scss');
  const tokens = read('src/assets/styles/06-beauty/beauty.scss');
  assert.match(styles, /\.cc-tabbar__icon \{ flex: none; width: 28px; height: 28px; \}/);
  assert.match(styles, /color: var\(--cc-text\); font-size: 13px; font-weight: 600; line-height: 17px;/);
  assert.match(styles, /justify-content: center; gap: 0;/);
  assert.match(styles, /\.cc-tabbar__fill \{ fill: var\(--cc-tabbar-active-fill\); \}/);
  // Only phones and tablets get the taller bar; the desktop token keeps its value.
  assert.match(tokens, /@media \(max-width: 1023px\) \{[\s\S]*?--cc-app-nav-height: 64px; --cc-tabbar-active-fill: #c6e4ff;/);
  assert.match(tokens, /^body\.theme-beauty \{\s*--cc-app-nav-height: 60px;/m);
  // Categories icon: three squares and a magnifier; campaign image 48px with reserved dimensions.
  assert.match(tabbar, /<circle class="cc-tabbar__fill" cx="16\.8" cy="16\.8" r="3\.3"\/><path d="m19\.3 19\.3 1\.7 1\.7"\/>/);
  assert.match(tabbar, /class="cc-tabbar__campaign"[^>]*width="48" height="48"/);
});

test('five tabs fit the narrowest phones without cutting labels', () => {
  const styles = read('src/assets/styles/06-beauty/core-care-app-nav.scss');
  assert.match(styles, /@media \(max-width: 359px\) \{\s*body\.theme-beauty\.cc-has-tabbar \.cc-tabbar__item \{ padding-inline: 0; font-size: 12px; \}/);
});

test('campaign button: built-in icon on a coloured disc, chosen by the merchant', () => {
  const styles = read('src/assets/styles/06-beauty/core-care-app-nav.scss');
  const icon = setting('beauty_tabbar_center_icon');
  const style = setting('beauty_tabbar_center_style');
  assert.equal(icon.format, 'dropdown-list');
  assert.deepEqual(icon.options.map(option => option.value), ['ribbon', 'gift', 'tag', 'sparkle', 'heart', 'image', 'none']);
  assert.equal(icon.selected[0].value, 'ribbon');
  assert.deepEqual(style.options.map(option => option.value), ['pink', 'purple', 'dark']);
  for (const item of [...icon.options, ...style.options]) assert.match(item.key, /^[0-9a-f-]{36}$/);
  // Unknown saved values fall back instead of reaching the class name or icon switch.
  assert.match(tabbar, /center_mode in \['ribbon', 'gift', 'tag', 'sparkle', 'heart', 'image', 'none'\] \? center_mode : 'ribbon'/);
  assert.match(tabbar, /center_style in \['pink', 'purple', 'dark'\] \? center_style : 'pink'/);
  assert.match(tabbar, /aria-label="\{\{ \(center_label \?: trans\('beauty\.tabbar\.campaign'\)\)\|e\('html_attr'\) \}\}">\s*<span class="cc-tabbar__fab cc-tabbar__fab--\{\{ center_style \}\}">/);
  assert.match(styles, /\.cc-tabbar__fab \{[^}]*width: 52px; height: 52px; margin-top: -22px;/);
  assert.match(styles, /prefers-reduced-motion[\s\S]*\.cc-tabbar__fab/);
});

test('default campaign icon is the awareness ribbon drawn as one crossing band', () => {
  assert.match(tabbar, /\{%- else -%\}\s*<path d="M7\.2 21 13\.3 12C15 9\.4[^"]*" stroke-width="2\.2" stroke-linecap="butt"\/>/);
});

test('phone quick links follow the app: ringed circles, bold names, name inside imageless circles, overlap under the tall banner', () => {
  const home = read('src/assets/styles/06-beauty/core-care-home.scss');
  const view = read('src/views/components/home/main-links.twig');
  // The full name is in the markup for every imageless circle but hidden outside phones.
  assert.match(view, /<span class="beauty-category__text" aria-hidden="true">\{\{ label \}\}<\/span>\s*<span class="beauty-category__initial"/);
  assert.match(view, /<span class="beauty-category__initial" aria-hidden="true">\{\{ initial\|upper \}\}<\/span><span class="beauty-category__text" aria-hidden="true">\{\{ label \}\}<\/span>\{% endif %\}/);
  assert.match(home, /^  \.beauty-category__text \{ display: none; \}/m);
  const phone = home.slice(home.indexOf('@media (max-width: 767px) {'));
  assert.match(phone, /width: 62px; height: 62px; background: transparent; box-shadow: inset 0 0 0 1px #d9e7f1;/);
  assert.match(phone, /\.beauty-category__name \{[^}]*font-size: 13px; font-weight: 600; line-height: 18px; \}/);
  // Overlap only right after the tall banner (editor markers may sit between) and only without a section title;
  // the dots step up to stay visible. :has() cannot nest, so the title check is a class from the template.
  assert.match(view, /beauty-categories\{\{ component\.title \? '' : ' beauty-categories--untitled' \}\}/);
  assert.match(phone, /#main-content > \.beauty-promotions--mobile-tall \+ \.beauty-categories--untitled,\s*#main-content > \.beauty-promotions--mobile-tall \+ \.s-design-after \+ \.s-design-before \+ \.beauty-categories--untitled \{\s*position: relative; z-index: 1; margin-block-start: calc\(-1 \* var\(--beauty-section-gap\) - 36px\);\s*padding-block-start: 0; background: transparent;/);
  assert.match(phone, /\.beauty-promotions--mobile-tall:has\(\+ \.s-design-after \+ \.s-design-before \+ \.beauty-categories--untitled\) \.beauty-promotions__dots \{ margin-block-end: 48px; \}/);
  assert.doesNotMatch(home, /:has\([^)]*:has\(/, 'nested :has() is invalid CSS');
});

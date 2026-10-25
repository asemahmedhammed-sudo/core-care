import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const read = path => fs.readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');
const footer = read('src/views/components/footer/footer.twig');
const styles = read('src/assets/styles/06-beauty/core-care-footer.scss');
const ar = JSON.parse(read('src/locales/ar.json'));
const en = JSON.parse(read('src/locales/en.json'));

test('four titled link groups in two rows, using only links the store has', () => {
  const rows = footer.match(/<div class="core-care-footer__nav-row">/g) ?? [];
  assert.equal(rows.length, 2);
  for (const id of ['cc-footer-quick', 'cc-footer-service', 'cc-footer-policies', 'cc-footer-store']) {
    assert.match(footer, new RegExp(`<section class="core-care-footer__group[^"]*" aria-labelledby="${id}">\\s*<h3 id="${id}">`));
  }
  for (const route of ["link('/')", "link('latest-products')", "link('offers')", "link('brands')"]) assert.ok(footer.includes(`href="{{ ${route} }}"`), route);
  // Customer service stays the merchant's own footer menu.
  assert.match(footer, /<salla-menu data-testid="store-footer-menu" source="footer" with-cookie-preferences><\/salla-menu>/);
  assert.doesNotMatch(footer, /\|raw/);
  for (const icon of footer.match(/<svg[^>]*>/g)) assert.match(icon, /aria-hidden="true"/);
});

test('the returns link opens the policy page by a numeric Salla id, or the group is left out', () => {
  assert.match(footer, /theme\.settings\.get\('beauty_policy_page_id', ''\)\|trim\|default\('1741544897'\)/);
  assert.match(footer, /\{% if policy_page_valid %\}\s*<section class="core-care-footer__group core-care-footer__group--policies" aria-labelledby="cc-footer-policies">/);
  assert.match(footer, /href="\{\{ link\('-\/page-' ~ policy_page_id\) \}\}"/);
});

test('empty menus release their space, rows keep the divider, chevrons follow the reading direction', () => {
  assert.match(styles, /\.core-care-footer__service:not\(:has\(\.s-menu-footer-item\)\) \{ display: none; \}/);
  assert.match(styles, /\.core-care-footer__nav-row \+ \.core-care-footer__nav-row \{[^}]*border-block-start: 1px solid var\(--cc-border\);/);
  assert.match(styles, /\.core-care-footer__nav-row \{ display: grid; grid-template-columns: repeat\(2, minmax\(0, 1fr\)\);/);
  assert.match(styles, /html\[dir='ltr'\] body\.theme-beauty \.core-care-footer \.s-menu-footer-item::after \{ transform: scaleX\(-1\); \}/);
  // Merchant menu rows get an icon by destination, with a page icon for anything else.
  for (const href of ['latest-products', '/brands', '/cart', 'wa.me']) assert.ok(styles.includes(`&[href*="${href}"]`), href);
});

test('link groups use the site identity colours, not colours sampled from a mock-up', () => {
  assert.match(styles, /\.core-care-footer__group-icon \{[^}]*color: var\(--cc-icon\);/);
  assert.match(styles, /\.core-care-footer__link-icon \{[^}]*color: var\(--cc-icon\);/);
  assert.match(styles, /\.core-care-footer__chevron \{[^}]*color: var\(--cc-text-muted\);/);
  assert.match(styles, /&::before \{ width: 20px; height: 20px; background: var\(--cc-icon\); \}/);
  assert.doesNotMatch(read('src/assets/styles/06-beauty/core-care-palette.scss'), /--cc-footer-(icon|link|chevron)/);
});

test('every footer string exists in Arabic and English', () => {
  const keys = [...footer.matchAll(/trans\('beauty\.footer\.([a-z_]+)'\)/g)].map(match => match[1]);
  assert.ok(keys.length >= 10);
  for (const key of keys) {
    assert.ok(ar.beauty.footer[key], `ar ${key}`);
    assert.ok(en.beauty.footer[key], `en ${key}`);
  }
  assert.deepEqual(Object.keys(ar.beauty.footer).sort(), Object.keys(en.beauty.footer).sort());
});

test('web widths follow the Nice One footer: categories, store, account, social and apps, then payments beside the copyright', () => {
  const web = styles.slice(styles.indexOf('@media (min-width: 768px)'));
  assert.match(footer, /<section class="core-care-footer__categories" aria-labelledby="cc-footer-categories">\s*<h3 id="cc-footer-categories">\{\{ trans\('beauty\.footer\.top_categories'\) \}\}<\/h3>\s*<core-care-footer-categories/);
  assert.match(footer, /<section class="core-care-footer__account" aria-labelledby="cc-footer-account">/);
  // Guests get Salla's login window instead of account links.
  assert.match(footer, /\{% if signed_in %\}\s*<a href="\{\{ link\('account\/' ~ key\) \}\}">[\s\S]*?\{% else %\}\s*<button type="button" data-cc-footer-login aria-haspopup="dialog">/);
  // The copyright row is a grid item so it can sit beside the payment marks.
  assert.ok(footer.indexOf('core-care-footer__bottom') > footer.indexOf('core-care-footer__payments'));
  assert.ok(footer.indexOf('core-care-footer__bottom') < footer.lastIndexOf('</div>\n\t</div>'));
  // Phones keep the approved design: the web-only parts stay hidden there.
  assert.match(styles, /\.core-care-footer__categories, \.core-care-footer__account, \.core-care-footer__web-title \{ display: none; \}/);
  assert.match(web, /grid-template-areas: 'cats nav account social apps' 'line line line line line' 'pay pay copy copy legal';/);
  assert.match(web, /grid-template-areas: 'cats nav account social apps' 'line line line line line' 'pay pay pay pay pay' 'copy copy copy legal legal';/);
  assert.match(web, /\.core-care-footer__categories:not\(:has\(\.core-care-footer__category-links a\)\) \{ display: none; \}/);
  assert.match(web, /\.core-care-footer__social:not\(:has\(\.s-social-link\)\) \{ display: none; \}/);
  assert.match(web, /\.core-care-footer__group-icon, \.core-care-footer__link-icon, \.core-care-footer__chevron \{ display: none; \}/);
  assert.match(web, /\.s-menu-footer-item::before, \.s-menu-footer-item::after \{ content: none; \}/);
});

test('footer categories are the header menu links to Salla categories, from one shared request', () => {
  const read2 = file => read(`src/assets/js/partials/${file}`);
  const context = vm.createContext({ URL, window: { location: { origin: 'https://store.example' } }, HTMLElement: class {}, customElements: { define() {}, get() {} }, document: { addEventListener() {} }, globalThis: {} });
  const strip = code => code.replace(/^import .*$/gm, '').replace(/export function/g, 'function');
  vm.runInContext(strip(read2('core-care-categories.js')) + strip(read2('core-care-footer.js')), context);
  const links = context.footerCategories([
    { title: 'المكياج', url: 'https://store.example/ar/makeup/c1030710729' },
    { title: 'الماركات التجارية', url: 'https://store.example/ar/brands' },
    { title: ' العطور ', url: '/ar/perfumes/c80011733' },
    { title: 'Bad', url: 'javascript:alert(1)//c1' },
    { title: '', url: '/ar/c/c2' },
  ]);
  assert.deepEqual(JSON.parse(JSON.stringify(links)), [
    { title: 'المكياج', url: 'https://store.example/ar/makeup/c1030710729' },
    { title: 'العطور', url: 'https://store.example/ar/perfumes/c80011733' },
  ]);
  assert.equal(context.footerCategories(null).length, 0);
  assert.match(read2('core-care-footer.js'), /link\.textContent = item\.title;/);
  assert.doesNotMatch(read2('core-care-footer.js'), /innerHTML/);
  // The desktop navigation and the footer share the header menu request.
  assert.match(read2('main-menu.js'), /return headerMenus\(\)/);
  assert.match(read2('core-care-footer.js'), /await headerMenus\(\)/);
});

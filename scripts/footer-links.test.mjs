import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

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
  assert.match(footer, /\{% if policy_page_valid %\}\s*<section class="core-care-footer__group" aria-labelledby="cc-footer-policies">/);
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

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
  assert.match(styles, /html\[dir='ltr'\] body\.theme-beauty \.core-care-footer \.core-care-footer__nav \.s-menu-footer-item::after \{ transform: scaleX\(-1\); \}/);
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

test('web widths keep the original footer columns; the link groups are for phones only', () => {
  // The owner withdrew every web change on 2026-10-26: same markup and rules as before this work.
  assert.match(footer, /<div class="core-care-footer__classic">\s*<h3>\{\{ trans\('beauty\.footer\.quick_links'\) \}\}<\/h3>\s*<nav class="core-care-footer__links" aria-label="\{\{ trans\('beauty\.footer\.quick_links'\) \}\}">\s*<a href="\{\{ link\('\/'\) \}\}">\{\{ trans\('beauty\.footer\.home'\) \}\}<\/a>\s*<a href="\{\{ link\('latest-products'\) \}\}">\{\{ trans\('beauty\.footer\.products'\) \}\}<\/a>\s*<a href="\{\{ link\('offers'\) \}\}">\{\{ trans\('beauty\.footer\.offers'\) \}\}<\/a>\s*<a href="#store-footer">\{\{ trans\('beauty\.footer\.about'\) \}\}<\/a>/);
  assert.match(footer, /<div class="core-care-footer__classic">\s*<h3>\{\{ trans\('beauty\.footer\.customer_service'\) \}\}<\/h3>\s*<salla-menu data-testid="store-footer-menu-web" source="footer" with-cookie-preferences><\/salla-menu>/);
  assert.match(styles, /\.core-care-footer__classic \{ display: none; \}\s*@media \(min-width: 768px\) \{\s*\.core-care-footer__nav \{ display: none; \}\s*\.core-care-footer__classic \{ display: block; \}\s*\.core-care-footer__grid \{ grid-template-columns: repeat\(2, minmax\(0, 1fr\)\); gap: 24px; \}/);
  assert.match(styles, /@media \(min-width: 1024px\) \{ \.core-care-footer__grid \{ grid-template-columns: 1\.25fr \.85fr 1\.1fr 1fr; \} \}/);
  // The phone icons and chevrons cannot reach the original columns.
  assert.match(styles, /\.core-care-footer__nav \{\n    display: flex; flex-direction: column; min-width: 0;\n[\s\S]*?\.s-menu-footer-item \{\n      --cc-footer-row-icon/);
  assert.equal(ar.beauty.footer.products, 'المنتجات');
  assert.equal(ar.beauty.footer.offers, 'العروض');
});

test('each contact number shows once, with WhatsApp and call actions', () => {
  const contacts = read('src/views/pages/partials/store-contacts.twig');
  const contactStyles = read('src/assets/styles/06-beauty/core-care-contacts.scss');
  assert.doesNotMatch(footer, /<salla-contacts/);
  // Every page that lists contacts uses the same cards, so no surface repeats the number.
  const policy = read('src/views/pages/partials/return-policy.twig');
  const thankYou = read('src/views/pages/thank-you.twig');
  assert.match(policy, /\{% include 'pages\.partials\.store-contacts' with \{ contacts_testid: 'store-policy-contacts' \} %\}/);
  assert.match(thankYou, /\{% include 'pages\.partials\.store-contacts' with \{ contacts_testid: 'store-thankyou-contacts' \} %\}/);
  for (const page of [policy, thankYou]) assert.doesNotMatch(page, /store\.contacts|wa\.me|tel:/);
  assert.match(thankYou, /\{% if thankyou_contacts\|trim %\}\s*<div class="thankyou-block">/);
  assert.match(footer, /\{% include 'pages\.partials\.store-contacts' with \{ contacts_testid: 'store-footer-contacts' \} %\}/);
  // Numbers registered on several channels merge by their last digits; only digits reach the links.
  for (const channel of ['whatsapp', 'mobile', 'phone']) assert.match(contacts, new RegExp(`${channel}_digits\\|replace\\(contact_digit_chars\\) == '' \\? ${channel}_digits\\|slice\\(-9\\)`));
  assert.match(contacts, /mobile_key and mobile_key != whatsapp_key/);
  assert.match(contacts, /phone_key and phone_key != whatsapp_key and phone_key != mobile_key/);
  assert.match(contacts, /href="https:\/\/wa\.me\/\{\{ number\.whatsapp \}\}" target="_blank" rel="noopener noreferrer"/);
  assert.match(contacts, /href="tel:\{\{ number\.call \}\}"/);
  // No channel, no markup: the footer intro takes the full width and the account row hides.
  assert.match(contacts, /\{% if contact_numbers or has_contact_email or contact_telegram %\}\s*<div class="cc-contacts"/);
  assert.match(styles, /\.core-care-footer__support-layout:not\(:has\(\.cc-contacts\)\)/);
  assert.doesNotMatch(contacts, /\|raw/);
  for (const icon of contacts.match(/<svg[^>]*>/g)) assert.match(icon, /aria-hidden="true"/);
  // Actions keep a 44px touch target.
  assert.match(contactStyles, /\.cc-contacts__action \{[^}]*min-height: 44px;/);
  // The row asks for more than two buttons need, so a narrow card moves it below the number instead of splitting it.
  assert.match(contactStyles, /\.cc-contacts__actions \{[^}]*flex: 1 1 240px;[^}]*flex-wrap: wrap;/);
  assert.match(contactStyles, /\.cc-contacts__action \{[^}]*flex: 1 1 104px;/);
  for (const key of ['support_number', 'contact_whatsapp', 'contact_call', 'contact_email', 'contact_telegram']) {
    assert.ok(ar.beauty.footer[key], `ar ${key}`);
    assert.ok(en.beauty.footer[key], `en ${key}`);
  }
});

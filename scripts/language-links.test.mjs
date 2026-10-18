import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const source = fs.readFileSync(new URL('../src/assets/js/partials/language-links.js', import.meta.url), 'utf8');
const { localizedStoreLink, pageLanguages } = await import(`data:text/javascript;base64,${Buffer.from(source).toString('base64')}`);
const navigation = fs.readFileSync(new URL('../src/assets/js/partials/preview-navigation.js', import.meta.url), 'utf8');
const menu = fs.readFileSync(new URL('../src/assets/js/partials/main-menu.js', import.meta.url), 'utf8');
const order = fs.readFileSync(new URL('../src/views/pages/customer/orders/single.twig', import.meta.url), 'utf8');
const languages = ['ar', 'en'];

test('custom links saved without a language open in the current language', () => {
  // Observed 2026-10-19 on corecare-sa.com/en: menus and "View all" returned these exactly as the merchant saved them.
  const home = 'https://corecare-sa.com/en/';
  const cases = {
    'https://corecare-sa.com/most-Sales-products?corecare': 'https://corecare-sa.com/en/most-Sales-products?corecare',
    'https://corecare-sa.com/brands': 'https://corecare-sa.com/en/brands',
    'https://corecare-sa.com/cart': 'https://corecare-sa.com/en/cart',
    'https://corecare-sa.com/': 'https://corecare-sa.com/en/',
    '/latest-products#top': 'https://corecare-sa.com/en/latest-products#top',
    'https://corecare-sa.com/ar/perfumes/c1?page=2': 'https://corecare-sa.com/en/perfumes/c1?page=2',
    'https://corecare-sa.com/ar': 'https://corecare-sa.com/en',
  };
  for (const [saved, expected] of Object.entries(cases)) assert.equal(localizedStoreLink(saved, home, languages), expected, saved);
  assert.equal(localizedStoreLink('https://corecare-sa.com/en/brands', 'https://corecare-sa.com/ar/', languages), 'https://corecare-sa.com/ar/brands');
  assert.equal(localizedStoreLink('https://corecare-sa.com/brands', 'https://corecare-sa.com/ar/', languages), 'https://corecare-sa.com/ar/brands');
});

test('links already in the current language, other sites, files and unsafe schemes are unchanged', () => {
  const home = 'https://corecare-sa.com/en/';
  for (const url of [
    'https://corecare-sa.com/en/brands', 'https://corecare-sa.com/en', '#store-footer', '', 'https://wa.me/966530004982',
    'https://other-store.com/brands', 'mailto:shop@example.com', 'tel:+966500000000', 'javascript:alert(1)',
    'https://corecare-sa.com/files/guide.pdf', 'https://u:p@corecare-sa.com/brands', 'https://corecare-sa.com/fr/brands',
  ]) assert.equal(localizedStoreLink(url, home, languages), url, url);
  assert.equal(localizedStoreLink(null, home, languages), null);
});

test('homes without a trailing page language, such as Salla previews, are left to the preview rewrite', () => {
  for (const home of ['https://salla.design/corecare/', 'https://salla.design/ar/corecare/', 'https://corecare-sa.com/']) {
    assert.equal(localizedStoreLink('https://salla.design/brands', home, languages), 'https://salla.design/brands', home);
  }
  // A store under a path keeps that path ahead of the language.
  assert.equal(localizedStoreLink('https://salla.sa/shop/brands', 'https://salla.sa/shop/en/', languages), 'https://salla.sa/shop/en/brands');
  assert.equal(localizedStoreLink('https://salla.sa/other/brands', 'https://salla.sa/shop/en/', languages), 'https://salla.sa/other/brands');
});

test('page languages come from Salla hreflang alternates and the document language', () => {
  const doc = {
    documentElement: { lang: 'en' },
    querySelectorAll: () => ['ar', 'en-SA', 'x-default'].map(code => ({ getAttribute: () => code })),
  };
  assert.deepEqual(pageLanguages(doc), ['ar', 'en', 'en']);
});

test('every store link on every page goes through the localizer, except deliberate and transactional links', () => {
  assert.match(navigation, /let next = localizedStoreLink\(original, storeHome, languages\);/);
  assert.match(navigation, /anchor\.hasAttribute\('hreflang'\) \|\| anchor\.hasAttribute\('download'\) \|\| anchor\.closest\('\[data-keep-url\]'\)/);
  // The localizer runs on the live store too, not only on salla.design.
  assert.doesNotMatch(navigation, /if \(window\.location\.hostname !== 'salla\.design'\) return;/);
  assert.match(order, /<a href="\{\{link\.url\}\}" data-keep-url/);
  assert.match(order, /href="\{\{ order\.payment_url \}\}" data-keep-url>/);
  // Theme-built menu links use Salla's localized store URL instead of root-relative paths.
  assert.doesNotMatch(menu, /href="\/(latest-products|offers|#store-footer)?"/);
  assert.match(menu, /salla\.url\.get\('latest-products'\)/);
});

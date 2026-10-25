import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const read = path => fs.readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');
const sheet = read('src/views/pages/partials/mobile-account.twig');
const styles = read('src/assets/styles/06-beauty/core-care-account.scss');
const source = read('src/assets/js/partials/core-care-account.js');
const ar = JSON.parse(read('src/locales/ar.json'));
const en = JSON.parse(read('src/locales/en.json'));

test('account sheet is a labelled dialog built from Salla data, without raw output', () => {
  assert.match(sheet, /<section id="cc-account" class="cc-account" hidden role="dialog" aria-modal="true" aria-labelledby="cc-account-title"/);
  assert.doesNotMatch(sheet, /\|raw/);
  for (const icon of sheet.match(/<svg[^>]*>/g)) assert.match(icon, /aria-hidden="true"/);
  // Guests get Salla's login window; customers get their account pages and Salla's logout.
  assert.match(sheet, /\{% set signed_in = user\.type == 'user' %\}/);
  assert.match(sheet, /data-account-login/);
  assert.match(sheet, /href="\{\{ link\('account\/' ~ key\) \}\}"/);
  assert.match(sheet, /signed_in and \(key != 'wallet' or user\.can_access_wallet\)/);
  assert.match(sheet, /\{% if signed_in %\}\s*<div class="cc-account__card">\s*<button class="cc-account__row cc-account__logout" type="button" data-account-logout>/);
  // Contacts, pages and social links come from the store's own Salla components.
  assert.match(sheet, /<salla-contacts class="cc-account__contacts"[^>]* hide-title><\/salla-contacts>/);
  assert.match(sheet, /<salla-menu [^>]*source="footer"/);
  assert.match(sheet, /<salla-social /);
  assert.match(sheet, /\{% if store\.settings\.tax\.number %\}/);
});

test('empty optional groups release their space and the sheet stays mobile-only', () => {
  assert.match(styles, /^body\.theme-beauty \.cc-account \{ display: none; \}/m);
  assert.match(styles, /@media \(max-width: 767px\) \{\s*body\.theme-beauty\.cc-has-tabbar \{/);
  assert.match(styles, /\.cc-account__support:not\(:has\(\.s-contacts-item\)\) \{ display: none; \}/);
  assert.match(styles, /\.cc-account__pages:not\(:has\(\.s-menu-footer-item\)\) \{ display: none; \}/);
  assert.match(styles, /\.cc-account__follow:not\(:has\(\.s-social-link\)\) \{ display: none; \}/);
  assert.match(styles, /bottom: var\(--cc-tabbar-offset\)/);
  assert.match(styles, /prefers-reduced-motion: reduce/);
});

test('every account string exists in Arabic and English', () => {
  const keys = [...sheet.matchAll(/trans\(t ~ '([a-z_]+)'\)/g)].map(match => match[1]);
  keys.push('orders', 'wishlist', 'wallet', 'notifications');
  for (const key of new Set(keys)) {
    assert.ok(ar.beauty.account[key], `ar ${key}`);
    assert.ok(en.beauty.account[key], `en ${key}`);
  }
  assert.deepEqual(Object.keys(ar.beauty.account).sort(), Object.keys(en.beauty.account).sort());
});

test('rows that open something else close the sheet; the toggle does not', async () => {
  class FakeElement {
    constructor(matches) { this.matches = matches; }
    closest(selector) { return this.matches.some(name => selector.includes(name)) ? this : null; }
  }
  globalThis.Element = FakeElement;
  const { closesSheet } = await import(`data:text/javascript;base64,${Buffer.from(source).toString('base64')}`);
  assert.equal(closesSheet(new FakeElement(['[data-account-toggle]'])), false);
  assert.equal(closesSheet(new FakeElement(['[data-account-login]'])), true);
  assert.equal(closesSheet(new FakeElement(['[data-cc-localization-open]'])), true);
  assert.equal(closesSheet(new FakeElement(['.cc-tabbar'])), true);
  assert.equal(closesSheet(new FakeElement([])), false);
  assert.equal(closesSheet(null), false);
  delete globalThis.Element;
});

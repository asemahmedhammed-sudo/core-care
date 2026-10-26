import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const read = path => fs.readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');
const sheet = read('src/views/pages/partials/mobile-account.twig');
const styles = read('src/assets/styles/06-beauty/core-care-account.scss');
const source = read('src/assets/js/partials/core-care-locale-switch.js');
const menu = read('src/assets/js/partials/core-care-language-menu.js');
const ar = JSON.parse(read('src/locales/ar.json'));
const en = JSON.parse(read('src/locales/en.json'));
// The module registers a custom element and imports the header menu's helpers; stub both to load its pure helpers.
globalThis.HTMLElement ??= class {};
globalThis.customElements ??= { get: () => undefined, define: () => {} };
const standalone = source.replace(/^import \{[^}]+\} from '\.\/core-care-language-menu';$/m, 'const storeLanguages = () => {}, switchLanguage = () => {};');
const { currencyOptions, languageOptions } = await import(`data:text/javascript;base64,${Buffer.from(standalone).toString('base64')}`);

test('account sheet switches language and currency in place instead of opening the header panel', () => {
  assert.doesNotMatch(sheet, /data-cc-localization-open/);
  assert.match(sheet, /\{% if store\.settings\.is_multilingual %\}\s*<li class="cc-account__locale" data-locale-row>/);
  assert.match(sheet, /\{% if store\.settings\.currencies_enabled %\}\s*<li class="cc-account__locale" data-locale-row>/);
  assert.match(sheet, /<core-care-locale-switch class="cc-account__choices" role="group" aria-labelledby="cc-account-language" data-kind="language" data-current="\{\{ language\.code \}\}"/);
  assert.match(sheet, /<core-care-locale-switch class="cc-account__choices" role="group" aria-labelledby="cc-account-currency" data-kind="currency"/);
  // The current language shows before Salla's list arrives, so the row never starts empty.
  assert.match(sheet, /<span class="cc-account__choice" aria-current="true">\{\{ language\.code\|upper \}\}<\/span>/);
  assert.match(read('src/assets/js/partials/main-menu.js'), /import '\.\/core-care-locale-switch';/);
  for (const key of ['languages_error', 'currencies_error']) {
    assert.ok(ar.beauty.header[key], `ar ${key}`);
    assert.ok(en.beauty.header[key], `en ${key}`);
  }
});

test('one tap applies the choice the way Salla\'s localization modal does', () => {
  assert.match(menu, /export function switchLanguage\(code, current\) \{[\s\S]*?cookie\?\.set\?\.\('s-lang', code\)[\s\S]*?languageSwitchUrl\(withParam, current, code\)/);
  assert.match(source, /await salla\.currency\.api\.change\(code\);\s*salla\.cookie\?\.set\?\.\('s-curr', code\);\s*window\.location\.reload\(\);/);
  // A row with a single option hides itself; a second tap while switching is ignored.
  assert.match(source, /if \(row\) row\.hidden = options\.length < 2;/);
  assert.match(source, /if \(option\.selected \|\| this\.hasAttribute\('aria-busy'\)\) return;/);
  assert.match(source, /setAttribute\('aria-pressed', String\(option\.selected\)\)/);
  // Plain text only: option names never go through innerHTML.
  assert.doesNotMatch(source, /innerHTML|insertAdjacentHTML/);
});

test('options come from Salla data, with unusable entries dropped', () => {
  assert.deepEqual(languageOptions([{ code: 'ar', name: 'العربية' }, { code: 'en', iso_code: 'en', name: 'English' }], 'ar'), [
    { code: 'ar', label: 'العربية', name: '', selected: true },
    { code: 'en', label: 'English', name: '', selected: false },
  ]);
  assert.deepEqual(languageOptions([{ code: 'fr' }], 'ar'), [{ code: 'fr', label: 'FR', name: '', selected: false }]);
  assert.deepEqual(currencyOptions({ SAR: { code: 'SAR', name: 'ريال سعودي' }, USD: { code: 'USD' }, bad: { code: '<b>' }, none: null }, 'USD'), [
    { code: 'SAR', label: 'SAR', name: 'ريال سعودي', selected: false },
    { code: 'USD', label: 'USD', name: '', selected: true },
  ]);
  assert.deepEqual(currencyOptions(undefined, 'SAR'), []);
});

test('the switch keeps 44px touch targets, wraps long lists and marks the choice in black', () => {
  assert.match(styles, /\.cc-account__choice \{\s*display: inline-flex;[^}]*min-height: 40px;/);
  assert.match(styles, /\.cc-account__choices \{\s*flex: none; display: flex; flex-wrap: wrap; gap: 2px; max-width: 100%; padding: 2px;/);
  assert.match(styles, /\.cc-account__locale \.cc-account__row \{ flex-wrap: wrap;/);
  assert.match(styles, /&\[aria-pressed='true'\], &\[aria-current='true'\] \{ background: var\(--cc-text\); color: var\(--cc-surface\);/);
});

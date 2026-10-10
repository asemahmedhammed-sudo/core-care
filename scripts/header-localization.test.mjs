import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const header = fs.readFileSync(new URL('../src/views/components/header/header.twig', import.meta.url), 'utf8');
const styles = fs.readFileSync(new URL('../src/assets/styles/06-beauty/core-care-header.scss', import.meta.url), 'utf8');
const source = fs.readFileSync(new URL('../src/assets/js/partials/core-care-language-menu.js', import.meta.url), 'utf8');
// The module registers a custom element; give Node the minimum browser globals to import its helpers.
globalThis.HTMLElement ??= class {};
globalThis.customElements ??= { get: () => undefined, define: () => {} };
const { languageSwitchUrl, safeFlagUrl } = await import(`data:text/javascript;base64,${Buffer.from(source).toString('base64')}`);

test('header language trigger is a disclosure for an inline language panel, without a currency symbol', () => {
  assert.match(header, /<core-care-language-menu class="core-care-language-menu" data-current="\{\{ language\.code \}\}"/);
  assert.match(header, /data-language-toggle aria-expanded="false" aria-controls="core-care-language-panel" aria-label="\{\{ trans\('beauty\.header\.language'\) \}\}: \{\{ language\.code\|upper \}\}"/);
  assert.match(header, /<span class="core-care-header__locale-label">\{\{ language\.code\|upper \}\}<\/span>/);
  assert.match(header, /id="core-care-language-panel" data-language-panel tabindex="-1" hidden/);
  assert.match(header, /data-language-list role="group" aria-labelledby="core-care-language-title"/);
  // Salla's built-in "language | currency" trigger is never rendered.
  assert.doesNotMatch(header, /show-trigger><\/salla-localization-modal>|<salla-localization-modal[^>]*show-trigger/);
  assert.doesNotMatch(header, /sicon-sar|currency\.symbol/);
  for (const icon of header.match(/<svg class="core-care-header__locale-[a-z]+"[^>]*>/g)) assert.match(icon, /aria-hidden="true"/);
});

test('currency stays selectable through Salla\'s modal only when the store enables currencies', () => {
  assert.match(header, /\{% if store\.settings\.currencies_enabled %\}\s*<button class="core-care-language-menu__currency" type="button" data-currency-open aria-haspopup="dialog">/);
  assert.match(header, /\{% if store\.settings\.currencies_enabled %\}<salla-localization-modal data-testid="store-header-localization"><\/salla-localization-modal>\{% endif %\}/);
  assert.match(header, /\{% elseif store\.settings\.currencies_enabled %\}[\s\S]*?onclick="salla\.event\.dispatch\('localization::open'\)"/);
  assert.match(source, /dispatch\('localization::open'\)/);
});

test('language switching mirrors salla-localization-modal and builds options without innerHTML', () => {
  assert.equal(languageSwitchUrl('https://salla.design/ar/corecare?lang=en', 'ar', 'en'), 'https://salla.design/en/corecare?lang=en');
  assert.equal(languageSwitchUrl('https://corecare-sa.com/ar/perfumes/c1?lang=en', 'ar', 'en'), 'https://corecare-sa.com/en/perfumes/c1?lang=en');
  assert.equal(languageSwitchUrl('https://corecare-sa.com/en/x/p1?lang=ar', 'en', 'ar'), 'https://corecare-sa.com/ar/x/p1?lang=ar');
  assert.equal(languageSwitchUrl(null, 'ar', 'en'), null);
  assert.match(source, /cookie\?\.set\?\.\('s-lang', code\)/);
  assert.match(source, /addParamToUrl\('lang', code\)/);
  assert.doesNotMatch(source, /innerHTML|insertAdjacentHTML/);
  // One languages request per page, reused on reopen.
  assert.match(source, /this\.loading \?\?= \(async/);
});

test('only HTTPS platform flags are rendered', () => {
  assert.equal(safeFlagUrl('https://assets.salla.sa/images/flags/ar.svg'), 'https://assets.salla.sa/images/flags/ar.svg');
  for (const value of ['', null, 'http://assets.salla.sa/f.svg', 'javascript:alert(1)', 'data:image/svg+xml,<svg/>', '//assets.salla.sa/f.svg', 'https://u:p@assets.salla.sa/f.svg']) {
    assert.equal(safeFlagUrl(value), null, String(value));
  }
});

test('panel closes on Escape and outside interaction and returns focus to the trigger', () => {
  assert.match(source, /event\.key !== 'Escape'[\s\S]*?this\.setOpen\(false\);\s*this\.trigger\.focus\(\);/);
  assert.match(source, /document\.addEventListener\('click', event => \{\s*if \(!this\.panel\.hidden && !this\.contains\(event\.target\)\) this\.setOpen\(false\);/);
  assert.match(source, /document\.addEventListener\('focusin'/);
  assert.match(source, /this\.abort\?\.abort\(\);\s*this\.abort = new AbortController\(\);/);
});

test('language styles follow the reference and keep 44px targets on every width', () => {
  assert.match(styles, /&__locale \{[^}]*min-height: 44px; padding-inline: 8px; border: 0; background: transparent;/);
  assert.match(styles, /&\[aria-expanded='true'\]::after \{ opacity: 1; \}/);
  assert.match(styles, /background: var\(--cc-secondary\)/);
  assert.match(styles, /border-block-start: 3px solid var\(--cc-text\); border-radius: 0 0 16px 16px;/);
  assert.match(styles, /\.core-care-language-menu__option \{[^}]*min-height: 44px;/);
  assert.match(styles, /\.core-care-language-menu__option\[aria-current='true'\] \.core-care-language-menu__mark/);
  // The store palette can set --cc-action to white; the selected mark must stay dark.
  assert.match(styles, /\.core-care-language-menu__option\[aria-current='true'\] \.core-care-language-menu__mark \{\s*\/\/[^\n]*\n\s*border-color: var\(--cc-text\); background: var\(--cc-text\);/);
  assert.match(styles, /html\[dir='rtl'\] & \.core-care-language-menu__panel \{ left: 0; right: auto; \}/);
  assert.match(styles, /html\[dir='ltr'\] & \.core-care-language-menu__currency svg \{ transform: scaleX\(-1\); \}/);
  // Compiled selectors must not nest body/html inside body (SCSS parent-selector mistakes).
  const css = fs.readFileSync(new URL('../public/app.css', import.meta.url), 'utf8');
  assert.match(css, /html\[dir=ltr\] body\.theme-beauty \.core-care-language-menu__currency svg\{transform:scaleX\(-1\)\}/);
  assert.match(css, /body\.theme-beauty \.core-care-header__locale\[aria-expanded=true\] \.core-care-header__locale-chevron\{transform:rotate\(180deg\)\}/);
  assert.doesNotMatch(css, /body\.theme-beauty [^{},]*(?:body\.theme-beauty|html\[dir)[^{},]*core-care-(?:language-menu|header__locale)/);
});

test('phones show the language panel as a bottom sheet with backdrop, close button and scroll lock', () => {
  assert.match(header, /<div class="core-care-language-menu__backdrop" data-language-backdrop hidden><\/div>/);
  assert.match(header, /data-language-panel tabindex="-1" hidden>/);
  assert.match(header, /<button class="core-care-language-menu__close" type="button" data-language-close aria-label="\{\{ trans\('beauty\.header\.close_languages'\) \}\}">/);
  for (const locale of ['ar', 'en']) {
    const strings = JSON.parse(fs.readFileSync(new URL(`../src/locales/${locale}.json`, import.meta.url), 'utf8'));
    assert.ok(strings.beauty.header.close_languages, locale);
  }
  // Backdrop and close button stay hidden on larger screens.
  assert.match(styles, /\.core-care-language-menu__backdrop, \.core-care-language-menu__close \{ display: none; \}/);
  const phone = styles.slice(styles.indexOf('@media (max-width: 767px)'));
  assert.match(phone, /\.core-care-language-menu__panel, html\[dir\] & \.core-care-language-menu__panel \{\s*position: fixed; z-index: 61; top: auto; bottom: 0; left: 0; right: 0; width: auto;/);
  assert.match(phone, /padding: 8px 16px calc\(20px \+ env\(safe-area-inset-bottom\)\);/);
  assert.match(phone, /\.core-care-language-menu__list \{ grid-template-columns: 1fr;/);
  assert.match(phone, /\.core-care-language-menu__option \{\s*min-height: 56px;/);
  assert.match(phone, /\.core-care-language-menu__mark \{ order: 1;/);
  assert.match(styles, /@media \(max-width: 767px\) \{ html\.cc-language-menu-open \{ overflow: hidden; \} html\.cc-language-menu-open \.wa-s-n \{ visibility: hidden; \} \}/);
  assert.match(phone, /html\[dir='rtl'\] & \.core-care-language-menu__name \{ text-align: right; \}/);
  assert.match(styles, /prefers-reduced-motion: reduce\) \{[\s\S]*?\.core-care-language-menu__backdrop, \.core-care-language-menu__panel \{ animation: none !important; \}/);
  // Close button and backdrop dismiss and return focus; pointer opens focus the panel, keyboard opens focus the current option.
  assert.match(source, /const dismiss = \(\) => \{ this\.setOpen\(false\); this\.trigger\.focus\(\); \};/);
  assert.match(source, /querySelector\('\[data-language-close\]'\)\?\.addEventListener\('click', dismiss/);
  assert.match(source, /this\.backdrop\?\.addEventListener\('click', dismiss/);
  assert.match(source, /setOpen\(this\.panel\.hidden, event\.detail === 0\)/);
  assert.match(source, /classList\.toggle\('cc-language-menu-open', open\)/);
  assert.match(source, /disconnectedCallback\(\) \{[\s\S]*?classList\.remove\('cc-language-menu-open'\)/);
  // The compiled sheet keeps symmetric left/right so RTL and LTR match after PostCSS.
  const css = fs.readFileSync(new URL('../public/app.css', import.meta.url), 'utf8');
  assert.match(css, /html\[dir\] body\.theme-beauty \.core-care-language-menu__panel\{[^}]*left:0;[^}]*position:fixed;right:0;top:auto;/);
});

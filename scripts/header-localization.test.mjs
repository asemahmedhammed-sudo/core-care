import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const header = fs.readFileSync(new URL('../src/views/components/header/header.twig', import.meta.url), 'utf8');
const styles = fs.readFileSync(new URL('../src/assets/styles/06-beauty/core-care-header.scss', import.meta.url), 'utf8');

test('header language trigger shows the language only and opens Salla\'s own localization modal', () => {
  // Salla's built-in trigger renders "language | currency symbol"; the theme replaces only the trigger.
  assert.doesNotMatch(header, /<salla-localization-modal[^>]*show-trigger/);
  assert.match(header, /<salla-localization-modal data-testid="store-header-localization"><\/salla-localization-modal>/);
  // localization::open is the event the installed salla-localization-modal listens to.
  assert.match(header, /class="core-care-header__locale" type="button"[^>]*aria-haspopup="dialog"[^>]*onclick="salla\.event\.dispatch\('localization::open'\)"/);
  assert.doesNotMatch(header, /sicon-sar|currency\.symbol/);
  // Decorative icons are hidden; the accessible name carries the purpose and the current language.
  for (const icon of header.match(/<svg class="core-care-header__locale-[a-z]+"[^>]*>/g)) assert.match(icon, /aria-hidden="true"/);
  assert.match(header, /aria-label="\{\{ localization_label \}\}\{% if store\.settings\.is_multilingual %\}: \{\{ current_language \}\}/);
});

test('language trigger labels exist in both locales', () => {
  for (const locale of ['ar', 'en']) {
    const strings = JSON.parse(fs.readFileSync(new URL(`../src/locales/${locale}.json`, import.meta.url), 'utf8')).beauty.header;
    for (const key of ['language', 'currency', 'localization']) assert.equal(typeof strings[key], 'string', `${locale}.${key}`);
  }
});

test('language trigger keeps a 44px target, symmetric RTL/LTR padding and a globe-only phone layout', () => {
  assert.match(styles, /&__locale \{[^}]*height: 40px; padding-inline: 12px; margin-block: 2px;/);
  assert.match(styles, /&::after \{ content: ''; position: absolute; inset: -2px; \}/);
  assert.match(styles, /&:focus-visible \{ outline: 2px solid var\(--cc-icon\)/);
  assert.match(styles, /\.core-care-header__locale \{ justify-content: center; width: 44px; height: 44px;/);
  assert.match(styles, /\.core-care-header__locale-label, \.core-care-header__locale-chevron \{ display: none; \}/);
});

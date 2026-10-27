import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

// Sale badge: whole days read as a word; only the last day uses the ticking countdown.
const source = fs.readFileSync(new URL('../src/assets/js/partials/product-card.js', import.meta.url), 'utf8')
  .replace(/^import BasePage from '\.\.\/base-page';\s*/u, '');
const locales = {
  ar: JSON.parse(fs.readFileSync(new URL('../src/locales/ar.json', import.meta.url), 'utf8')),
  en: JSON.parse(fs.readFileSync(new URL('../src/locales/en.json', import.meta.url), 'utf8')),
};
const documentElement = { lang: 'ar' };
const salla = {
  lang: {
    get: (key, replacements = {}) => {
      const value = key.split('.').reduce((node, part) => node?.[part], locales[documentElement.lang]);
      return typeof value === 'string' ? Object.entries(replacements).reduce((text, [name, v]) => text.replaceAll(`:${name}`, v), value) : key;
    },
  },
};
let ProductCard;
class ElementStub { classList = { add: () => {} }; }
vm.runInNewContext(source, {
  HTMLElement: ElementStub,
  customElements: { define: (_, value) => { ProductCard = value; } },
  window: { location: { href: 'https://preview.example/' } },
  URL,
  document: { documentElement, body: { dataset: {} } },
  salla,
});

const HOUR = 36e5;
const badgeFor = (msFromNow, lang = 'ar') => {
  documentElement.lang = lang;
  const card = new ProductCard();
  card.product = { is_on_sale: true, discount_ends: Math.floor((Date.now() + msFromNow) / 1000) };
  return card.getRecommendationBadge();
};

test('a sale with days left shows the day count as words, not an unlabelled number', () => {
  const cases = [[1, 'ينتهي بعد يوم'], [2, 'ينتهي بعد يومين'], [4, 'ينتهي بعد 4 أيام'], [11, 'ينتهي بعد 11 يومًا']];
  for (const [days, label] of cases) {
    const html = badgeFor(days * 24 * HOUR + 2 * HOUR);
    assert.match(html, new RegExp(`core-recommendation-badge--timer">${label}</div>`, 'u'));
    assert.doesNotMatch(html, /salla-count-down/u);
  }
  assert.match(badgeFor(4 * 24 * HOUR + HOUR, 'en'), />Ends in 4 days</u);
  assert.match(badgeFor(24 * HOUR + HOUR, 'en'), />Ends in 1 day</u);
});

test('the last day keeps the live countdown, and an ended sale shows no timer', () => {
  const html = badgeFor(5 * HOUR);
  assert.match(html, /<span>ينتهي بعد<\/span><salla-count-down /u);
  assert.doesNotMatch(badgeFor(-HOUR), /core-recommendation-badge--timer/u);
});

test('the timer badge stays on one line without the platform colon', () => {
  const scss = fs.readFileSync(new URL('../src/assets/styles/06-beauty/core-care-products.scss', import.meta.url), 'utf8');
  assert.match(scss, /\.core-recommendation-badge--timer \{[^}]*white-space: nowrap;/u);
  assert.match(scss, /\.core-recommendation-badge--timer \.s-count-down-list \{[^}]*flex-wrap: nowrap;/u);
  assert.match(scss, /\.core-recommendation-badge--timer \.s-count-down-item \{[^}]*flex: none;[^}]*font-size: 10px;/u);
  assert.match(scss, /\.core-recommendation-badge--timer \.s-count-down-item::after \{ content: none; \}/u);
});

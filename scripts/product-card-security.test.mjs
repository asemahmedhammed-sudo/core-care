import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

// Exercise the actual storefront renderer with hostile merchant/product text.
const source = fs.readFileSync(new URL('../src/assets/js/partials/product-card.js', import.meta.url), 'utf8')
  .replace(/^import BasePage from '\.\.\/base-page';\s*/u, '');
let ProductCard;
const salla = {
  lang: { get: () => 'Wishlist' },
  config: { isGuest: () => true, get: () => false },
  storage: { get: () => [] },
  url: { is_placeholder: () => false },
  money: amount => `<b>${amount}</b>`,
  helpers: { number: value => String(value) },
  wishlist: { toggle: () => {} },
};
class ElementStub {
  classList = { add: () => {} };
  attributes = {};
  setAttribute(key, value) { this.attributes[key] = value; }
  querySelectorAll() { return []; }
}
vm.runInNewContext(source, {
  HTMLElement: ElementStub,
  customElements: { define: (_, value) => { ProductCard = value; } },
  window: { location: { href: 'https://preview.example/product' }, notify_when_available_in_card: false },
  URL,
  salla,
});

test('product card escapes merchant text and rejects executable URLs', () => {
  const card = new ProductCard();
  card.product = {
    id: 7,
    name: '<img src=x onerror=alert(1)>',
    url: 'javascript:alert(1)',
    image: { url: 'javascript:alert(2)', alt: '" onerror="alert(3)' },
    promotion_title: '<script>alert(4)</script>',
    subtitle: '<b>injected</b>',
    add_to_cart_label: '<svg onload=alert(5)>',
    status: 'sale', type: 'product', price: 10,
  };
  card.render();
  assert.match(card.innerHTML, /href="#"/u);
  assert.match(card.innerHTML, /src="#"/u);
  assert.match(card.innerHTML, /&lt;img src=x onerror=alert\(1\)&gt;/u);
  assert.match(card.innerHTML, /&lt;script&gt;alert\(4\)&lt;\/script&gt;/u);
  assert.match(card.innerHTML, /&lt;svg onload=alert\(5\)&gt;/u);
  assert.match(card.innerHTML, /&quot; onerror=&quot;alert\(3\)/u);
  assert.doesNotMatch(card.innerHTML, /onclick=|onerror="|<script>|javascript:/u);
  assert.match(card.innerHTML, /product-status="sale"/u);
});

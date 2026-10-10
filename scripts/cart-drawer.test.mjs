import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const source = fs.readFileSync(new URL('../src/assets/js/partials/core-care-cart-drawer.js', import.meta.url), 'utf8');
const markup = fs.readFileSync(new URL('../src/views/pages/partials/cart-drawer.twig', import.meta.url), 'utf8');
const layout = fs.readFileSync(new URL('../src/views/layouts/master.twig', import.meta.url), 'utf8');
const styles = fs.readFileSync(new URL('../src/assets/styles/06-beauty/core-care-cart.scss', import.meta.url), 'utf8');
globalThis.HTMLElement ??= class {};
globalThis.customElements ??= { get: () => undefined, define: () => {} };
const { discountPercent, cartSavings, moneyParts, safeHttpUrl, needsCartPage } = await import(`data:text/javascript;base64,${Buffer.from(source).toString('base64')}`);

test('discount badge only reflects a real reduced price from Salla', () => {
  assert.equal(discountPercent(89, 39), 56);
  assert.equal(discountPercent(125, 125), 0);
  assert.equal(discountPercent(100, 120), 0);
  assert.equal(discountPercent(0, 0), 0);
  assert.equal(discountPercent('x', 10), 0);
  assert.equal(discountPercent(null, 10), 0);
});

test('savings add sale differences per quantity and the cart discount, never invented values', () => {
  assert.equal(cartSavings({ items: [{ is_on_sale: true, original_price: 89, price: 39, quantity: 1 }] }), 50);
  assert.equal(cartSavings({ items: [{ is_on_sale: true, original_price: 20, price: 15, quantity: 3 }], discount: 4.5 }), 19.5);
  assert.equal(cartSavings({ items: [{ is_on_sale: false, original_price: 125, price: 125, quantity: 1 }], discount: 0 }), 0);
  assert.equal(cartSavings({ items: [{ is_on_sale: true, original_price: 10, price: 12, quantity: 1 }] }), 0);
  assert.equal(cartSavings({}), 0);
});

test('money markup from salla.money is reduced to text plus the riyal icon, never injected as HTML', () => {
  assert.deepEqual(moneyParts('39 <i class=sicon-sar></i>'), { text: '39', riyal: true });
  assert.deepEqual(moneyParts('$12.50'), { text: '$12.50', riyal: false });
  assert.deepEqual(moneyParts('<img src=x onerror=alert(1)>5'), { text: '5', riyal: false });
  assert.doesNotMatch(source, /innerHTML|insertAdjacentHTML|outerHTML/);
});

test('links and images from cart data must be http(s)', () => {
  assert.equal(safeHttpUrl('https://cdn.salla.sa/a.jpg'), 'https://cdn.salla.sa/a.jpg');
  assert.equal(safeHttpUrl('/cart', 'https://salla.design/ar/corecare/'), 'https://salla.design/cart');
  for (const value of ['', null, 'javascript:alert(1)', 'data:text/html,x', 'https://u:p@x.com/']) assert.equal(safeHttpUrl(value, 'https://x.com/'), null, String(value));
});

test('items with options, files, notes or donations send the customer to the full cart page to edit', () => {
  assert.equal(needsCartPage({ options: [{}] }), true);
  assert.equal(needsCartPage({ attachments: [{}] }), true);
  assert.equal(needsCartPage({ can_add_note: true }), true);
  assert.equal(needsCartPage({ type: 'donating' }), true);
  assert.equal(needsCartPage({ options: [], attachments: [], can_add_note: false, type: 'product' }), false);
});

test('cart data and changes go through the Salla SDK, and checkout stays on Salla', () => {
  assert.match(source, /salla\.cart\.details\(null, \['options', 'attachments'\]\)/);
  assert.match(source, /salla\.cart\.updateItem\(\{ id: item\.id, quantity \}\)/);
  assert.match(source, /salla\.cart\.deleteItem\(item\.id\)/);
  assert.match(source, /await window\.salla\.cart\.submit\(\);/);
  assert.match(source, /cart\?\.event\?\.onUpdated\?\.\(/);
  // Coupons and recommendations use Salla components, gated by store settings.
  assert.match(source, /createElement\('salla-cart-coupons'\)/);
  assert.match(source, /store\.settings\.product\.related_products_enabled/);
  assert.match(markup, /data-coupons="\{\{ store\.settings\.cart\.apply_coupon_enabled \? 'true' : 'false' \}\}"/);
});

test('header cart opens the drawer without breaking the plain link or the native app shell', () => {
  assert.match(source, /closest\('salla-cart-summary, \[data-cart-drawer-open\]'\)/);
  assert.match(source, /event\.button !== 0 \|\| event\.metaKey \|\| event\.ctrlKey \|\| event\.shiftKey \|\| event\.altKey/);
  assert.match(source, /isSpaWebview/);
  assert.match(layout, /\{% if not is_page\('cart'\) %\}\{% include 'pages\.partials\.cart-drawer' %\}\{% endif %\}/);
});

test('drawer is an accessible modal dialog', () => {
  assert.match(markup, /role="dialog" aria-modal="true" aria-labelledby="cc-cart-drawer-title" tabindex="-1"/);
  assert.match(markup, /data-cart-close aria-label="\{\{ trans\(t ~ 'close'\) \}\}"/);
  assert.match(markup, /data-cart-live aria-live="polite"/);
  assert.match(source, /event\.key === 'Escape'/);
  assert.match(source, /event\.key !== 'Tab'/);
  assert.match(source, /this\.returnFocus\?\.focus/);
  assert.match(source, /setAttribute\('role', 'progressbar'\)/);
  // Every quantity control names the product it changes.
  assert.match(source, /setAttribute\('aria-label', `\$\{this\.label\('Increase'\)\}: \$\{name\}`\)/);
});

test('cart drawer labels exist in both locales', () => {
  const keys = [...markup.matchAll(/trans\(t ~ '([a-z_]+)'\)/g)].map(match => match[1]);
  assert.ok(keys.length > 20);
  for (const locale of ['ar', 'en']) {
    const strings = JSON.parse(fs.readFileSync(new URL(`../src/locales/${locale}.json`, import.meta.url), 'utf8')).beauty.cart_drawer;
    for (const key of new Set(keys)) assert.equal(typeof strings[key], 'string', `${locale}.${key}`);
  }
});

test('drawer enters from the inline end, respects reduced motion and keeps 44px controls', () => {
  assert.match(styles, /html\[dir='rtl'\] body\.theme-beauty \.cc-cart-drawer__panel \{ left: 0; right: auto; transform: translateX\(-100%\); \}/);
  assert.match(styles, /html\[dir='ltr'\] body\.theme-beauty \.cc-cart-drawer__panel \{ right: 0; left: auto; transform: translateX\(100%\); \}/);
  assert.match(styles, /width: min\(500px, 100vw\)/);
  assert.match(styles, /@media \(prefers-reduced-motion: reduce\)/);
  assert.match(styles, /\.cc-cart-item__qty-btn \{\s*display: grid; place-items: center; width: 44px;/);
  const css = fs.readFileSync(new URL('../public/app.css', import.meta.url), 'utf8');
  assert.doesNotMatch(css, /body\.theme-beauty [^{},]*(?:body\.theme-beauty|html\[dir)[^{},]*cc-cart/);
});

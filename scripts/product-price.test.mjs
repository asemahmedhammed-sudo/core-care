import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

// Exercise the real product event handler: changing options must not leave a stale discount.
function productHarness() {
  const element = () => ({ innerHTML: '', textContent: '', classList: {
    values: new Set(), add(value) { this.values.add(value); }, remove(value) { this.values.delete(value); },
    toggle(value, force) { force ? this.values.add(value) : this.values.delete(value); },
  }});
  const price = element(), before = element(), sku = element(), discount = element(), out = element(), wrapper = element();
  const installments = { setAttribute(key, value) { this[key] = value; } };
  let updated, failed;
  const app = { totalPrice: [price], beforePrice: [before], productSku: [sku], productWeight: [],
    element(selector) { return selector === '.price-wrapper' ? wrapper : out; },
    toggleClassIf() {}, onClick() {},
  };
  const source = fs.readFileSync(new URL('../src/assets/js/product.js', import.meta.url), 'utf8')
    .replace(/^import .*;$/gm, '').replace('window.fslightbox = Fslightbox;', '')
    .replace("Product.initiateWhenReady(['product.single']);", 'globalThis.Product = Product;');
  const context = { app, BasePage: class {}, document: {
    querySelector(selector) { return selector === '.core-product-discount' ? discount : installments; },
    querySelectorAll() { return []; },
  }, salla: { money: value => `SAR ${value}`, event: { on(name, fn) { failed = fn; } },
    product: { event: { onPriceUpdated(fn) { updated = fn; } } } } };
  vm.runInNewContext(source, context);
  new context.Product().registerEvents();
  return { price, before, sku, discount, out, wrapper, installments, updated, failed };
}

test('option sale updates visible price, original price, discount, SKU and installments together', () => {
  const h = productHarness();
  h.updated({ data: { price: 75, regular_price: 100, has_sale_price: true, sku: 'new-option' } });
  assert.equal(h.price.innerHTML, 'SAR 75');
  assert.equal(h.before.innerHTML, 'SAR 100');
  assert.equal(h.discount.textContent, '-25%');
  assert.equal(h.sku.innerHTML, 'new-option');
  assert.equal(h.installments.price, 75);
  assert.equal(h.discount.classList.values.has('hidden'), false);
});

test('a full-price option removes the former discount instead of retaining the product discount', () => {
  const h = productHarness();
  h.updated({ data: { price: 75, regular_price: 100, has_sale_price: true } });
  h.updated({ data: { price: 100, regular_price: 100, has_sale_price: false } });
  assert.equal(h.discount.textContent, '');
  assert.equal(h.discount.classList.values.has('hidden'), true);
  assert.equal(h.price.innerHTML, 'SAR 100');
});

test('unavailable option hides the price; a subsequent available option restores it', () => {
  const h = productHarness();
  h.failed();
  assert.equal(h.wrapper.classList.values.has('hidden'), true);
  assert.equal(h.out.classList.values.has('hidden'), false);
  h.updated({ data: { price: 100, regular_price: 100, has_sale_price: false } });
  assert.equal(h.wrapper.classList.values.has('hidden'), false);
  assert.equal(h.out.classList.values.has('hidden'), true);
});

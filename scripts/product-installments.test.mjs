import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

function harness() {
  let changed;
  const enabled = new Set();
  const logos = { images: [], replaceChildren(...images) { this.images = images; } };
  const widget = { children: [], querySelector(selector) { return enabled.has(selector); } };
  const details = { hidden: true, querySelector(selector) { return selector === 'salla-installment' ? widget : logos; } };
  const source = fs.readFileSync(new URL('../src/assets/js/product.js', import.meta.url), 'utf8')
    .replace(/^import .*;$/gm, '').replace('window.fslightbox = Fslightbox;', '')
    .replace("Product.initiateWhenReady(['product.single']);", 'globalThis.Product = Product;');
  const context = { BasePage: class {}, document: {
    querySelector() { return details; }, createElement() { return {}; },
  }, MutationObserver: class { constructor(callback) { changed = callback; } observe() {} },
  salla: { url: { cdn: path => `legacy/${path}`, assetsCdn: path => `assets/${path}` } } };
  vm.runInNewContext(source, context);
  new context.Product().initInstallmentSummary();
  return { widget, details, logos, enabled, changed };
}

test('installment summary collapses before hydration and shows only enabled providers', () => {
  const h = harness();
  assert.equal(h.details.hidden, true);
  h.widget.children = [{}];
  h.enabled.add('#tabbyPromoWrapper');
  h.changed();
  assert.equal(h.details.hidden, false);
  assert.equal(h.logos.images.length, 1);
  assert.equal(h.logos.images[0].alt, 'tabby');
  assert.equal(h.logos.images[0].src, 'assets/images/payment/tabby_installment_mini.png');
});

test('provider updates remove stale logos and an empty widget leaves no reserved space', () => {
  const h = harness();
  h.widget.children = [{}];
  h.enabled.add('tamara-widget, .tamara-product-widget');
  h.changed();
  assert.equal(h.logos.images[0].alt, 'Tamara');
  h.enabled.clear();
  h.widget.children = [];
  h.changed();
  assert.equal(h.details.hidden, true);
  assert.equal(h.logos.images.length, 0);
});

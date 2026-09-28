import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
const code = fs.readFileSync(new URL('../src/assets/js/partials/preview-navigation.js', import.meta.url), 'utf8');
const { previewLink } = await import(`data:text/javascript;base64,${Buffer.from(code).toString('base64')}`);
const home = 'https://salla.design/corecare/';
const store = 'https://corecare-sa.com/';
test('preview preserves its store prefix for categories, products and home', () => {
  for (const path of ['/', '/perfumes-women/c117084669', '/item/p123?variant=2#details', '/brands']) {
    assert.equal(previewLink(store.slice(0, -1) + path, home, store, home), home.slice(0, -1) + path);
  }
});
test('live store, existing preview links and external services are unchanged', () => {
  for (const url of [home + 'brands', 'https://wa.me/123', 'https://other-store.com/product/p123', 'mailto:shop@example.com', 'javascript:alert(1)']) {
    assert.equal(previewLink(url, home, store, home), url);
  }
  assert.equal(previewLink(store, home, store, store), store);
});
test('Salla draft store.url can itself be the preview URL', () => {
  for (const path of ['/', '/perfumes-body/c891056892', '/item/p123?variant=2#details', '/brands']) {
    assert.equal(previewLink(store.slice(0, -1) + path, home, home.slice(0, -1), home + 'brands'), home.slice(0, -1) + path);
  }
  for (const url of ['https://other-store.com/item/p123', 'https://wa.me/123', home + 'brands']) {
    assert.equal(previewLink(url, home, home, home), url);
  }
  const otherPreview = 'https://salla.design/another-store/';
  assert.equal(previewLink(store, otherPreview, otherPreview, otherPreview), store);
  assert.equal(previewLink(store, home, home, store), store);
});

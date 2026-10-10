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
test('language-prefixed preview (/ar/corecare) keeps product, category and home links inside the preview', () => {
  // Observed 2026-10-10: Salla drafts serve /ar/corecare/ and set store.url to the same preview URL,
  // while product cards and menus still link to https://corecare-sa.com/ar/….
  const langHome = 'https://salla.design/ar/corecare/';
  const canonical = 'https://salla.design/ar/corecare';
  const current = 'https://salla.design/ar/corecare?preview=true';
  const cases = {
    'https://corecare-sa.com/ar/سيروم/p933577391': 'https://salla.design/ar/corecare/سيروم/p933577391',
    'https://corecare-sa.com/ar/perfumes/c961431200?sort=new#top': 'https://salla.design/ar/corecare/perfumes/c961431200?sort=new#top',
    'https://corecare-sa.com/ar': 'https://salla.design/ar/corecare/',
    'https://corecare-sa.com/en/brands': 'https://salla.design/en/corecare/brands',
    'https://corecare-sa.com/item/p1': 'https://salla.design/ar/corecare/item/p1',
  };
  for (const [live, expected] of Object.entries(cases)) {
    assert.equal(new URL(previewLink(live, langHome, canonical, current)).href, new URL(expected).href, live);
  }
  // Links already inside the preview, other stores, other services and unsafe schemes stay unchanged.
  for (const url of [langHome + 'brands', 'https://other-store.com/ar/item/p1', 'https://wa.me/966555232632', 'javascript:alert(1)']) {
    assert.equal(previewLink(url, langHome, canonical, current), url);
  }
  // Outside salla.design (the public store) nothing is rewritten.
  assert.equal(previewLink('https://corecare-sa.com/ar/x/p1', 'https://corecare-sa.com/ar/', 'https://corecare-sa.com/ar', 'https://corecare-sa.com/ar/'), 'https://corecare-sa.com/ar/x/p1');
});

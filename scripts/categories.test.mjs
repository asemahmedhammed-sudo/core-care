import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const source = fs.readFileSync(new URL('../src/assets/js/partials/core-care-categories.js', import.meta.url), 'utf8');
const context = vm.createContext({ URL, window: { location: { origin: 'https://store.example' } }, HTMLElement: class {}, customElements: { define() {} } });
vm.runInContext(source.replace('export function', 'function'), context);
test('category links preserve store paths and reject executable protocols', () => {
  assert.equal(context.safeMenuUrl('/skin?sort=new'), 'https://store.example/skin?sort=new');
  assert.equal(context.safeMenuUrl('https://cdn.example/category.png'), 'https://cdn.example/category.png');
  for (const value of ['javascript:alert(1)', 'data:text/html,test', '', null, 'file:///etc/passwd']) assert.equal(context.safeMenuUrl(value), null);
});

test('homepage category discs never render empty', () => {
  const view = fs.readFileSync(new URL('../src/views/components/home/main-links.twig', import.meta.url), 'utf8');
  // The initial is always rendered beneath an optional image; links fall back to it when no icon is chosen.
  assert.match(view, /beauty-category__initial[^>]*>\{\{ initial\|upper \}\}<\/span>\s*\{% if cat\.image %\}<img/);
  assert.match(view, /label\|slice\(0, 2\) == 'ال' and label\|length > 2 \? label\|slice\(2, 1\)/);
  assert.match(view, /\{% if item\.icon %\}[\s\S]*?\{% else %\}<span class="beauty-category__initial"/);

  const media = fs.readFileSync(new URL('../src/assets/js/partials/category-media.js', import.meta.url), 'utf8');
  const ctx = vm.createContext({});
  vm.runInContext(media.replace(/export (default )?function/g, 'function'), ctx);
  const image = (naturalWidth, complete = true) => {
    const classes = new Set();
    return { complete, naturalWidth, naturalHeight: naturalWidth, removed: false, classList: { add: c => classes.add(c) }, classes,
      matches: () => true, remove() { this.removed = true; } };
  };
  const real = image(400); ctx.settleCategoryImage(real);
  assert.ok(real.classes.has('is-loaded') && !real.removed);
  for (const width of [0, 1]) { const blank = image(width); ctx.settleCategoryImage(blank); assert.ok(blank.removed, `width ${width}`); }
  const pending = image(0, false); ctx.settleCategoryImage(pending);
  assert.ok(!pending.removed, 'lazy images are left until they load');
});

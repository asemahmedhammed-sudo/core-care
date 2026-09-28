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

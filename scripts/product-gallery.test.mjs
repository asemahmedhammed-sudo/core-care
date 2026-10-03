import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const source = fs.readFileSync(new URL('../src/assets/js/partials/product-gallery.js', import.meta.url), 'utf8').replaceAll('export function ', 'function ');
function fixture(count = 6, direction = 'rtl') {
  const element = () => ({ dataset: {}, events: {}, attrs: {}, hidden: false,
    addEventListener(name, callback) { this.events[name] = callback; },
    setAttribute(name, value) { this.attrs[name] = value; },
    focus() { this.focused = true; },
    dispatchEvent(event) { this.lastEvent = event; } });
  const slides = Array.from({ length: count }, (_, i) => Object.assign(element(), { dataset: { imgId: String(i + 10) } }));
  const thumbs = count > 1 ? slides.map((_, i) => Object.assign(element(), { offsetTop: i * 92, offsetHeight: 80 })) : [];
  const rail = Object.assign(element(), { clientHeight: 300, classList: { toggle(name, value) { rail.overflow = value; } } });
  const list = Object.assign(element(), { scrollTop: 0, clientHeight: 244, scrollHeight: count * 92 - 12,
    scrollBy({ top }) { this.scrollTop = Math.max(0, Math.min(this.scrollHeight - this.clientHeight, this.scrollTop + top)); this.events.scroll(); } });
  const previous = element(), next = element(), stage = element(), gallery = element();
  gallery.querySelectorAll = selector => selector === '[data-gallery-slide]' ? slides : thumbs;
  gallery.querySelector = selector => ({ '[data-gallery-rail]': count > 1 ? rail : null, '[data-gallery-thumbs]': count > 1 ? list : null,
    '[data-gallery-previous]': previous, '[data-gallery-next]': next, '.core-product-media__stage': stage })[selector];
  let optionChange;
  const context = { salla: { event: { on(name, callback) { optionChange = callback; } } },
    ResizeObserver: class { constructor(callback) { rail.resize = callback; } observe() {} },
    getComputedStyle: () => ({ direction }), CustomEvent: class { constructor(name, options) { this.type = name; this.detail = options.detail; } } };
  vm.runInNewContext(source, context);
  context.initProductGallery(gallery);
  return { slides, thumbs, rail, list, previous, next, stage, gallery, optionChange };
}
const active = f => f.slides.flatMap((slide, i) => slide.hidden ? [] : [i]);
test('thumbnail selection displays exactly one image and keyboard selection reveals the last thumbnail', () => {
  const f = fixture();
  assert.deepEqual(active(f), [0]);
  f.thumbs[2].events.click();
  assert.deepEqual(active(f), [2]);
  assert.equal(f.thumbs[2].attrs['aria-pressed'], 'true');
  assert.equal(f.thumbs[0].attrs['aria-pressed'], 'false');
  f.thumbs[2].events.keydown({ key: 'End', preventDefault() {} });
  assert.deepEqual(active(f), [5]);
  assert.equal(f.thumbs[5].focused, true);
  assert.ok(f.list.scrollTop + f.list.clientHeight >= f.thumbs[5].offsetTop + 80);
  f.thumbs[5].events.keydown({ key: 'Home', preventDefault() {} });
  assert.deepEqual(active(f), [0]);
  assert.equal(f.list.scrollTop, 0);
});
test('overflow controls track scroll boundaries and disappear when fewer images fit', () => {
  const f = fixture();
  assert.equal(f.previous.hidden, false);
  assert.equal(f.previous.disabled, true);
  f.next.events.click();
  assert.equal(f.list.scrollTop, 92);
  assert.equal(f.previous.disabled, false);
  f.list.scrollTop = f.list.scrollHeight - f.list.clientHeight;
  f.list.events.scroll();
  assert.equal(f.next.disabled, true);
  f.rail.clientHeight = 600;
  f.rail.resize();
  assert.equal(f.next.hidden, true);
  assert.equal(f.rail.overflow, false);
  const few = fixture(2);
  assert.equal(few.previous.hidden, true);
  assert.equal(few.next.hidden, true);
  assert.deepEqual(active(fixture(1)), [0]);
});
test('Salla image options can select the first image and unrelated options are ignored', () => {
  const f = fixture();
  f.optionChange({ option: { type: 'color' }, detail: { option_value: 13 } });
  assert.deepEqual(active(f), [3]);
  f.optionChange({ option: { type: 'thumbnail' }, detail: { option_value: 10 } });
  assert.deepEqual(active(f), [0]);
  f.optionChange({ option: { type: 'text' }, detail: { option_value: 12 } });
  assert.deepEqual(active(f), [0]);
});
test('mobile swipe follows RTL/LTR, prevents accidental lightbox opening and leaves vertical scroll alone', () => {
  for (const direction of ['rtl', 'ltr']) {
    const f = fixture(3, direction);
    const start = () => f.stage.events.touchstart({ touches: [{ clientX: 100, clientY: 100 }], target: { closest: () => null } });
    start();
    f.stage.events.touchend({ changedTouches: [{ clientX: direction === 'rtl' ? 170 : 30, clientY: 105 }] });
    assert.deepEqual(active(f), [1]);
    let prevented = false, stopped = false;
    f.stage.events.click({ preventDefault() { prevented = true; }, stopImmediatePropagation() { stopped = true; } });
    assert.ok(prevented && stopped);
    start();
    f.stage.events.touchend({ changedTouches: [{ clientX: 105, clientY: 200 }] });
    assert.deepEqual(active(f), [1]);
    f.stage.events.click({ preventDefault() { assert.fail('vertical scrolling must not suppress a subsequent click'); } });
  }
});

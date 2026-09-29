import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const source = fs.readFileSync(new URL('../src/assets/js/partials/promotion-carousel.js', import.meta.url), 'utf8').replace('export default ', '');
function fixture(direction = 'rtl') {
  const element = (label = '') => ({ hidden: false, dataset: {}, attrs: { 'aria-label': label }, events: {},
    addEventListener(event, callback) { this.events[event] = callback; },
    setAttribute(key, value) { this.attrs[key] = value; }, getAttribute(key) { return this.attrs[key]; }, focus() {} });
  const slides = ['one', 'two', 'three'].map(element);
  const dots = slides.map(() => element());
  const controls = element(); controls.hidden = true;
  const previous = element(), next = element(), status = element(), carousel = element();
  carousel.querySelectorAll = selector => selector === '[data-promotion-slide]' ? slides : dots;
  carousel.querySelector = selector => ({ '[data-promotion-prev]': previous, '[data-promotion-next]': next, '[data-promotion-status]': status, '[data-promotion-controls]': controls })[selector];
  const root = { querySelectorAll: () => [carousel] };
  const context = { document: root, getComputedStyle: () => ({ direction }) };
  vm.runInNewContext(source + '\ninitPromotionCarousels();', context);
  return { slides, dots, controls, previous, next, status, carousel, context };
}
test('promotions next/previous wrap, dots select and announce the active slide', () => {
  const f = fixture();
  assert.equal(f.controls.hidden, false);
  f.previous.events.click();
  assert.equal(f.status.textContent, 'three');
  assert.deepEqual(f.slides.map(slide => slide.hidden), [true, true, false]);
  f.next.events.click();
  assert.equal(f.dots[0].attrs['aria-current'], 'true');
  f.dots[1].events.click();
  assert.equal(f.status.textContent, 'two');
  assert.deepEqual(f.slides.map(slide => slide.hidden), [true, false, true]);
});
test('keyboard direction follows RTL/LTR and vertical gestures do not change slides', () => {
  for (const direction of ['rtl', 'ltr']) {
    const f = fixture(direction);
    f.carousel.events.keydown({ key: 'ArrowLeft', preventDefault() {} });
    assert.equal(f.status.textContent, direction === 'rtl' ? 'two' : 'three');
    f.carousel.events.touchstart({ touches: [{ clientX: 50, clientY: 50 }] });
    f.carousel.events.touchend({ changedTouches: [{ clientX: 55, clientY: 150 }] });
    assert.equal(f.status.textContent, direction === 'rtl' ? 'two' : 'three');
  }
});
test('horizontal swipe changes slide and suppresses accidental link navigation', () => {
  const f = fixture();
  f.carousel.events.touchstart({ touches: [{ clientX: 50, clientY: 50 }] });
  f.carousel.events.touchend({ changedTouches: [{ clientX: 150, clientY: 55 }] });
  assert.equal(f.status.textContent, 'two');
  let prevented = false;
  f.carousel.events.click({ preventDefault() { prevented = true; } });
  assert.equal(prevented, true);
});

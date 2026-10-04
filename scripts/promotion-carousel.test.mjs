import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const source = fs.readFileSync(new URL('../src/assets/js/partials/promotion-carousel.js', import.meta.url), 'utf8').replace('export default ', '');
test('homepage includes the promotions partial without invoking the Salla component registry', () => {
  const page = fs.readFileSync(new URL('../src/views/pages/index.twig', import.meta.url), 'utf8');
  assert.match(page, /\{% include 'pages\.partials\.home\.promotions' %\}/);
  assert.doesNotMatch(page, /\{% component ['"]home\.promotions['"]/);
  assert.ok(fs.existsSync(new URL('../src/views/pages/partials/home/promotions.twig', import.meta.url)));
  assert.ok(page.indexOf("include 'pages.partials.home.promotions'") < page.indexOf('component home'));
});
function fixture(direction = 'rtl', count = 3, withCounter = true) {
  const element = (label = '') => ({ hidden: false, dataset: {}, attrs: { 'aria-label': label }, events: {},
    addEventListener(event, callback) { this.events[event] = callback; },
    setAttribute(key, value) { this.attrs[key] = value; }, getAttribute(key) { return this.attrs[key]; }, focus() {} });
  const slides = ['one', 'two', 'three'].slice(0, count).map(element);
  slides.forEach((slide, i) => { slide.hidden = i !== 0; });
  const dots = slides.map(() => element());
  const controls = element(); controls.hidden = true;
  const previous = element(), next = element(), status = element(), carousel = element(), current = element(), total = element();
  carousel.querySelectorAll = selector => selector === '[data-promotion-slide]' ? slides : dots;
  carousel.querySelector = selector => ({ '[data-promotion-prev]': previous, '[data-promotion-next]': next, '[data-promotion-status]': status, '[data-promotion-controls]': controls, '[data-promotion-current]': withCounter ? current : null, '[data-promotion-total]': withCounter ? total : null })[selector];
  const root = { querySelectorAll: () => [carousel] };
  const context = { document: root, getComputedStyle: () => ({ direction }) };
  vm.runInNewContext(source + '\ninitPromotionCarousels();', context);
  return { slides, dots, controls, previous, next, status, carousel, current, total, context };
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

test('zero or one image leaves navigation hidden without event handlers', () => {
  for (const count of [0, 1]) {
    const f = fixture('rtl', count);
    assert.equal(f.controls.hidden, true);
    assert.equal(f.next.events.click, undefined);
    assert.equal(f.carousel.dataset.initialized, undefined);
    if (count) assert.equal(f.slides[0].hidden, false);
  }
});
test('initializing again keeps the chosen banner and does not reset navigation', () => {
  const f = fixture();
  f.dots[2].events.click();
  vm.runInNewContext('initPromotionCarousels();', f.context);
  assert.equal(f.current.textContent, '03');
  assert.deepEqual(f.slides.map(slide => slide.hidden), [true, true, false]);
  f.next.events.click();
  assert.equal(f.dots[0].attrs['aria-current'], 'true');
});

test('visible counter follows navigation and uses the actual image count', () => {
  for (const count of [2, 3]) {
    const f = fixture('rtl', count);
    assert.equal(f.current.textContent, '01');
    assert.equal(f.total.textContent, String(count).padStart(2, '0'));
    f.previous.events.click();
    assert.equal(f.current.textContent, String(count).padStart(2, '0'));
    f.next.events.click();
    assert.equal(f.current.textContent, '01');
    f.dots[1].events.click();
    assert.equal(f.current.textContent, '02');
    f.carousel.events.keydown({ key: 'ArrowLeft', preventDefault() {} });
    assert.equal(f.current.textContent, count === 2 ? '01' : '03');
    f.carousel.events.touchstart({ touches: [{ clientX: 50, clientY: 50 }] });
    f.carousel.events.touchend({ changedTouches: [{ clientX: 150, clientY: 55 }] });
    assert.equal(f.current.textContent, count === 2 ? '02' : '01');
  }
});

test('cached banners without the counter retain navigation', () => {
  const f = fixture('rtl', 3, false);
  f.next.events.click();
  assert.equal(f.controls.hidden, false);
  assert.equal(f.status.textContent, 'two');
  assert.deepEqual(f.slides.map(slide => slide.hidden), [true, false, true]);
});

import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const source = fs.readFileSync(new URL('../src/assets/js/partials/promotion-carousel.js', import.meta.url), 'utf8').replace('export default ', '');
test('homepage includes the promotions partial before merchant components', () => {
  const page = fs.readFileSync(new URL('../src/views/pages/index.twig', import.meta.url), 'utf8');
  assert.match(page, /\{% include 'pages\.partials\.home\.promotions' %\}/);
  assert.doesNotMatch(page, /\{% component ['"]home\.promotions['"]/);
  assert.ok(page.indexOf("include 'pages.partials.home.promotions'") < page.indexOf('component home'));
});

test('shopping destinations accept HTTPS store links and reject unsafe or malformed URLs', () => {
  const template = fs.readFileSync(new URL('../src/views/pages/partials/home/promotions.twig', import.meta.url), 'utf8');
  const pattern = template.match(/valid_destination = configured_destination matches '~(.*?)~i'/)[1];
  // Translate the two PCRE POSIX classes for this focused URL-policy check.
  // Actual Twig rendering remains part of Salla platform verification.
  const destination = new RegExp(pattern.replace('[^[:space:][:cntrl:]]', '[^\\s\\x00-\\x1f\\x7f]'), 'i');
  for (const url of ['https://salla.sa/store/offers', 'https://shop.example.com', 'HTTPS://shop.example.com/path?q=1&lang=ar#offer', 'https://shop.example.com:443/عروض']) {
    assert.equal(destination.test(url), true, url);
  }
  for (const url of ['', '/offers', '//example.com', 'javascript:alert(1)', 'data:text/html,test', 'http://example.com', 'https://', 'https://example..com', 'https://-example.com', 'https://example-.com', 'https://example.com/path with spaces', 'https://example.com/\u0001']) {
    assert.equal(destination.test(url), false, url);
  }
});

function fixture(direction = 'rtl', count = 3, instances = 1) {
  const document = { activeElement: null };
  const element = (label = '') => ({ hidden: false, dataset: {}, attrs: { 'aria-label': label }, events: {}, children: [],
    classList: { toggle() {} },
    addEventListener(event, callback) { this.events[event] = callback; },
    setAttribute(key, value) { this.attrs[key] = value; }, getAttribute(key) { return this.attrs[key]; },
    focus() { document.activeElement = this; },
    contains(target) { return this === target || this.children.includes(target); },
    closest() { return null; },
    replaceChildren(...children) { this.children = children; }
  });
  document.createElement = () => element();
  const fixtures = Array.from({ length: instances }, () => {
    const slides = Array.from({ length: count }, (_, i) => element(`Banner ${i + 1}`));
    slides.forEach((slide, i) => { slide.hidden = i !== 0; });
    const controls = element(); controls.hidden = true;
    const previous = element(), next = element(), status = element(), carousel = element(), pagination = element(), viewport = element();
    pagination.dataset.slideLabel = 'Banner';
    carousel.querySelectorAll = () => slides;
    carousel.querySelector = selector => ({ '[data-promotion-prev]': previous, '[data-promotion-next]': next, '[data-promotion-status]': status, '[data-promotion-controls]': controls, '[data-promotion-dots]': pagination, '.beauty-promotions__viewport': viewport })[selector];
    return { slides, get dots() { return pagination.children; }, controls, previous, next, status, carousel, viewport };
  });
  document.querySelectorAll = () => fixtures.map(f => f.carousel);
  let now = 1000;
  const context = { document, getComputedStyle: () => ({ direction }), Date: { now: () => now } };
  vm.runInNewContext(source + '\ninitPromotionCarousels();', context);
  return { ...fixtures[0], fixtures, context, document, advanceTime(ms) { now += ms; } };
}
const key = (f, value, target = f.next) => f.carousel.events.keydown({ key: value, target, preventDefault() {} });
const swipe = (f, dx, dy = 0) => {
  f.viewport.events.touchstart({ touches: [{ clientX: 100, clientY: 100 }] });
  f.viewport.events.touchend({ changedTouches: [{ clientX: 100 + dx, clientY: 100 + dy }] });
};

test('pagination uses actual rendered count and accessible sequential labels', () => {
  for (const count of [2, 3, 5]) {
    const f = fixture('rtl', count);
    assert.equal(f.dots.length, count);
    assert.equal(f.controls.hidden, false);
    f.dots.forEach((dot, i) => {
      assert.equal(dot.type, 'button');
      assert.equal(dot.attrs['aria-label'], `Banner ${i + 1}`);
      assert.equal(dot.attrs['aria-controls'], f.slides[i].id);
    });
    f.previous.events.click();
    assert.equal(f.status.textContent, `Banner ${count}`);
    assert.equal(f.dots[count - 1].attrs['aria-current'], 'true');
    f.next.events.click();
    assert.equal(f.dots[0].attrs['aria-current'], 'true');
    f.dots[1].events.click();
    assert.deepEqual(f.slides.map(slide => slide.hidden), Array.from({ length: count }, (_, i) => i !== 1));
  }
});
test('keyboard and swipe follow RTL/LTR, with Home and End navigation', () => {
  for (const direction of ['rtl', 'ltr']) {
    const f = fixture(direction);
    key(f, 'ArrowRight');
    assert.equal(f.status.textContent, direction === 'rtl' ? 'Banner 3' : 'Banner 2');
    key(f, 'Home');
    assert.equal(f.status.textContent, 'Banner 1');
    swipe(f, -80);
    assert.equal(f.status.textContent, direction === 'rtl' ? 'Banner 3' : 'Banner 2');
    key(f, 'End');
    assert.equal(f.dots[2].attrs['aria-current'], 'true');
    key(f, 'ArrowLeft');
    assert.equal(f.status.textContent, direction === 'rtl' ? 'Banner 1' : 'Banner 2');
  }
});
test('vertical, short, cancelled and multi-touch gestures preserve active slide', () => {
  const f = fixture();
  swipe(f, 5, 100);
  swipe(f, 30);
  f.viewport.events.touchstart({ touches: [{ clientX: 0, clientY: 0 }] });
  f.viewport.events.touchcancel();
  f.viewport.events.touchend({ changedTouches: [{ clientX: 100, clientY: 0 }] });
  f.viewport.events.touchstart({ touches: [{}, {}] });
  f.viewport.events.touchend({ changedTouches: [{ clientX: 100, clientY: 0 }] });
  assert.equal(f.dots[0].attrs['aria-current'], 'true');
});
test('swipe suppresses accidental banner link but normal taps preserve links', () => {
  const f = fixture();
  let prevented = false;
  f.viewport.events.click({ detail: 1, preventDefault() { prevented = true; } });
  assert.equal(prevented, false);
  swipe(f, 80);
  f.viewport.events.click({ detail: 1, preventDefault() { prevented = true; } });
  assert.equal(prevented, true);
  prevented = false;
  f.viewport.events.click({ detail: 1, preventDefault() { prevented = true; } });
  assert.equal(prevented, false);
});
test('a swipe never blocks keyboard activation or a later pointer click', () => {
  const f = fixture();
  let prevented = false;
  swipe(f, 80);
  f.viewport.events.click({ detail: 0, preventDefault() { prevented = true; } });
  assert.equal(prevented, false);
  swipe(f, 80);
  f.advanceTime(401);
  f.viewport.events.click({ detail: 1, preventDefault() { prevented = true; } });
  assert.equal(prevented, false);
  swipe(f, 80);
  // A new tap clears suppression from the previous gesture.
  swipe(f, 0);
  f.viewport.events.click({ detail: 1, preventDefault() { prevented = true; } });
  assert.equal(prevented, false);
});
test('zero or one image leaves navigation hidden and creates no indicators or handlers', () => {
  for (const count of [0, 1]) {
    const f = fixture('rtl', count);
    assert.equal(f.controls.hidden, true);
    assert.equal(f.dots.length, 0);
    assert.equal(f.next.events.click, undefined);
    if (count) assert.equal(f.slides[0].hidden, false);
  }
});
test('reinitialization preserves active slide and controls; instances have unique targets', () => {
  const f = fixture('rtl', 3, 2);
  f.dots[2].events.click();
  const nextHandler = f.next.events.click;
  vm.runInNewContext('initPromotionCarousels();', f.context);
  assert.equal(f.dots.length, 3);
  assert.equal(f.next.events.click, nextHandler);
  assert.equal(f.dots[2].attrs['aria-current'], 'true');
  assert.notEqual(f.slides[0].id, f.fixtures[1].slides[0].id);
  assert.equal(f.fixtures[1].dots[0].attrs['aria-current'], 'true');
});
test('hiding a focused image link or CTA moves focus to the destination indicator', () => {
  const f = fixture();
  const cta = {};
  f.slides[0].children.push(cta);
  f.document.activeElement = cta;
  f.next.events.click();
  assert.equal(f.document.activeElement, f.dots[1]);
  f.document.activeElement = f.previous;
  f.previous.events.click();
  assert.equal(f.document.activeElement, f.previous);
});
test('keyboard navigation does not consume editable field keys', () => {
  const f = fixture();
  key(f, 'ArrowLeft', { closest: () => ({}) });
  assert.equal(f.dots[0].attrs['aria-current'], 'true');
});

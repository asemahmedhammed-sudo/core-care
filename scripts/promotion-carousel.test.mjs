import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const source = fs.readFileSync(new URL('../src/assets/js/partials/promotion-carousel.js', import.meta.url), 'utf8').replace('export default ', '');
test('promotions slider is a registered home component the merchant can add, edit and reorder', () => {
  const page = fs.readFileSync(new URL('../src/views/pages/index.twig', import.meta.url), 'utf8');
  const config = JSON.parse(fs.readFileSync(new URL('../twilight.json', import.meta.url), 'utf8'));
  // A hardcoded include is invisible in the page editor's element list and would duplicate the component.
  assert.doesNotMatch(page, /include 'pages\.partials\.home\.promotions'/);
  assert.doesNotMatch(page, /\{% component ['"]home\.(?:beauty-)?promotions['"]/);
  const component = config.components.find(item => item.path === 'home.beauty-promotions');
  assert.ok(component, 'home.beauty-promotions is registered');
  assert.ok(fs.existsSync(new URL('../src/views/components/home/beauty-promotions.twig', import.meta.url)));
  const slides = component.fields.find(field => field.id === 'slides');
  assert.equal(slides.type, 'collection');
  assert.deepEqual(slides.fields.map(field => field.id), ['slides.image', 'slides.mobile_image']);
  // Images only, and the merchant must not be blocked by required inputs.
  assert.equal(slides.required, false);
  assert.ok(slides.fields.every(field => field.required === false), 'no required slide fields');
  // The legacy global switches no longer control anything once the slider is a component.
  for (const id of ['beauty_promotions_enabled', 'beauty_promotions_autoplay', 'beauty_promotions_interval']) {
    assert.equal(config.settings.some(setting => setting.id === id), false, id);
  }
});

test('promotions component simplifies to images with fallback to legacy slides', () => {
  const view = fs.readFileSync(new URL('../src/views/components/home/beauty-promotions.twig', import.meta.url), 'utf8');
  const partial = fs.readFileSync(new URL('../src/views/pages/partials/home/promotions.twig', import.meta.url), 'utf8');
  // Component accepts only image and mobile_image fields.
  assert.match(view, /slide\.image[\s\S]*?slide\.mobile_image/);
  assert.doesNotMatch(view, /slide\.title|slide\.url|slide\.button|show_title/);
  // Partial renders images only, no links or buttons.
  assert.match(partial, /{% if not slides\|length %\}[\s\S]*?beauty_promo_' ~ number ~ '_image/);
  assert.doesNotMatch(partial, /beauty-promotions__copy|beauty-button|beauty-promotions__action/);
  // Without this wrapper the picture falls into the 60px arrow column instead of spanning the frame.
  assert.match(partial, /<\{\{ tag \}\} class="beauty-promotions__image-link"[\s\S]*?<picture class="beauty-promotions__media">/);
  assert.match(partial, /component-id="\{\{ component_id\|e\('html_attr'\) \}\}"/);
  assert.match(view, /promotion_autoplay: component\.autoplay is not defined or component\.autoplay is null or component\.autoplay,/);
  assert.match(view, /promotion_interval: component\.interval\|default\(5\)/);
});

test('shopping destinations accept HTTPS store links and reject unsafe or malformed URLs', () => {
  const template = fs.readFileSync(new URL('../src/views/pages/partials/home/promotions.twig', import.meta.url), 'utf8');
  // Keep link validation to plain Twig operators rather than a regex `matches` test.
  assert.doesNotMatch(template, /\bmatches\s*['"]/);
  const condition = template.match(/\{% set valid_destination = (.*?) %\}/)[1];
  assert.equal(condition, `configured_destination|lower starts with 'https://' and configured_destination|length > 8 and ' ' not in configured_destination and '"' not in configured_destination and '<' not in configured_destination and '>' not in configured_destination`);
  // Mirror of the Twig condition above.
  const destination = url => url.toLowerCase().startsWith('https://') && url.length > 8 && !/[ "<>]/.test(url);
  for (const url of ['https://salla.sa/store/offers', 'https://shop.example.com', 'HTTPS://shop.example.com/path?q=1&lang=ar#offer', 'https://shop.example.com:443/عروض']) {
    assert.equal(destination(url), true, url);
  }
  for (const url of ['', '/offers', '//example.com', 'javascript:alert(1)', 'data:text/html,test', 'http://example.com', 'https://', 'https://example.com/path with spaces', 'https://example.com/"onmouseover=x', 'https://example.com/<script>']) {
    assert.equal(destination(url), false, url);
  }
});

function fixture(direction = 'rtl', count = 3, instances = 1, { autoplay = false, reduced = false, enabled = true, interval } = {}) {
  const document = { activeElement: null, hidden: false, events: {},
    addEventListener(event, callback) { this.events[event] = callback; },
    removeEventListener(event) { delete this.events[event]; }
  };
  const element = (label = '') => ({ hidden: false, isConnected: true, dataset: {}, style: {}, attrs: { 'aria-label': label }, events: {}, children: [],
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
    const images = slides.map(() => ({ loading: 'lazy' }));
    slides.forEach((slide, i) => { slide.hidden = i !== 0; slide.querySelector = () => images[i]; });
    const controls = element(); controls.hidden = true;
    const previous = element(), next = element(), status = element(), carousel = element(), pagination = element(), viewport = element();
    carousel.dataset.promotionAutoplay = String(autoplay && enabled);
    if (interval !== undefined) carousel.dataset.promotionInterval = interval;
    pagination.dataset.slideLabel = 'Banner';
    carousel.querySelectorAll = () => slides;
    carousel.querySelector = selector => ({ '[data-promotion-prev]': previous, '[data-promotion-next]': next, '[data-promotion-status]': status, '[data-promotion-controls]': controls, '[data-promotion-dots]': pagination, '.beauty-promotions__viewport': viewport })[selector];
    return { slides, images, get dots() { return pagination.children.filter(dot => 'data-promotion-dot' in dot.attrs); }, controls, previous, next, status, carousel, viewport };
  });
  document.querySelectorAll = () => fixtures.map(f => f.carousel);
  let now = 1000;
  let sequence = 0;
  const timers = new Map();
  let intersectionCallback;
  const motion = { matches: reduced, events: {}, addEventListener(event, callback) { this.events[event] = callback; }, removeEventListener(event) { delete this.events[event]; } };
  const context = { document, getComputedStyle: () => ({ direction }), Date: { now: () => now }, window: { matchMedia: () => motion },
    setTimeout(callback, delay) { const id = ++sequence; timers.set(id, { callback, due: now + delay }); return id; },
    clearTimeout(id) { timers.delete(id); },
    IntersectionObserver: class {
      constructor(callback) { intersectionCallback = callback; this.callback = callback; }
      observe() { this.callback([{ isIntersecting: true, intersectionRatio: 1 }]); }
      disconnect() {}
    }
  };
  vm.runInNewContext(source + '\ninitPromotionCarousels();', context);
  return { ...fixtures[0], fixtures, context, document, motion,
    setInView(visible) { intersectionCallback([{ isIntersecting: visible, intersectionRatio: visible ? 1 : 0 }]); },
    get timerCount() { return timers.size; }, advanceTime(ms) {
    const target = now + ms;
    while (true) {
      const first = [...timers].sort((a, b) => a[1].due - b[1].due)[0];
      if (!first || first[1].due > target) break;
      now = first[1].due; timers.delete(first[0]); first[1].callback();
    }
    now = target;
  } };
}
const clickEvent = () => ({ detail: 1, preventDefault() {}, stopPropagation() {} });
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
    f.previous.events.click(clickEvent());
    assert.equal(f.dots[0].attrs['aria-current'], 'true');
    f.dots[count - 1].events.click(clickEvent());
    assert.equal(f.status.textContent, `Banner ${count}`);
    f.next.events.click(clickEvent());
    assert.equal(f.dots[count - 1].attrs['aria-current'], 'true');
    f.dots[1].events.click(clickEvent());
    assert.deepEqual(f.slides.map(slide => slide.hidden), Array.from({ length: count }, (_, i) => i !== 1));
  }
});
test('indicator order matches slide and keyboard order in both directions', () => {
  for (const direction of ['rtl', 'ltr']) {
    for (const count of [2, 3, 5]) {
      const f = fixture(direction, count);
      assert.ok(f.dots.every(dot => dot.style.order === undefined));
      assert.equal(f.dots[0].attrs['aria-current'], 'true');
      for (let index = 1; index < count; index++) {
        key(f, direction === 'rtl' ? 'ArrowLeft' : 'ArrowRight');
        assert.equal(f.dots[index].attrs['aria-current'], 'true');
        assert.equal(f.dots.filter(dot => dot.attrs['aria-current'] === 'true').length, 1);
      }
    }
  }
});
test('arrows stop at both ends and never trigger delegated navigation', () => {
  for (const direction of ['rtl', 'ltr']) {
    for (const count of [2, 3, 5]) {
      const f = fixture(direction, count);
      assert.equal(f.previous.disabled, true);
      assert.equal(f.previous.attrs['aria-hidden'], undefined);
      assert.equal(f.next.disabled, false);
      let prevented = 0, stopped = 0;
      const event = { preventDefault() { prevented++; }, stopPropagation() { stopped++; } };
      for (let step = 0; step < 30; step++) f.next.events.click(event);
      assert.equal(f.dots[count - 1].attrs['aria-current'], 'true');
      assert.equal(f.next.disabled, true);
      assert.equal(f.next.attrs['aria-hidden'], undefined);
      assert.equal(f.previous.disabled, false);
      for (let step = 0; step < 30; step++) f.previous.events.click(event);
      assert.equal(f.dots[0].attrs['aria-current'], 'true');
      assert.equal(f.previous.disabled, true);
      f.dots[1].events.click(event);
      assert.equal(f.dots[1].attrs['aria-current'], 'true');
      assert.equal(prevented, 61);
      assert.equal(stopped, 61);
    }
  }
});
test('touches on overlaid controls do not swipe or suppress navigation clicks', () => {
  const f = fixture();
  f.viewport.events.touchstart({ target: { closest: () => f.controls }, touches: [{ clientX: 100, clientY: 100 }] });
  f.viewport.events.touchend({ changedTouches: [{ clientX: 200, clientY: 100 }] });
  assert.equal(f.dots[0].attrs['aria-current'], 'true');
  swipe(f, 80);
  let prevented = false;
  f.viewport.events.click({target: {closest: () => f.controls}, detail: 1, preventDefault() { prevented = true; }});
  assert.equal(prevented, false);
  f.next.events.click(clickEvent());
  assert.equal(f.dots[2].attrs['aria-current'], 'true');
});
test('keyboard and swipe follow RTL/LTR and stop at the first and last slide', () => {
  for (const direction of ['rtl', 'ltr']) {
    const f = fixture(direction);
    const forward = direction === 'rtl' ? 'ArrowLeft' : 'ArrowRight';
    const backward = direction === 'rtl' ? 'ArrowRight' : 'ArrowLeft';
    key(f, backward);
    assert.equal(f.dots[0].attrs['aria-current'], 'true');
    key(f, forward);
    assert.equal(f.status.textContent, 'Banner 2');
    key(f, 'Home');
    assert.equal(f.status.textContent, 'Banner 1');
    swipe(f, direction === 'rtl' ? -80 : 80);
    assert.equal(f.dots[0].attrs['aria-current'], 'true');
    swipe(f, direction === 'rtl' ? 80 : -80);
    assert.equal(f.status.textContent, 'Banner 2');
    key(f, 'End');
    key(f, forward);
    swipe(f, direction === 'rtl' ? 80 : -80);
    assert.equal(f.dots[2].attrs['aria-current'], 'true');
    key(f, backward);
    assert.equal(f.status.textContent, 'Banner 2');
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
  f.dots[2].events.click(clickEvent());
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
  f.next.events.click(clickEvent());
  assert.equal(f.document.activeElement, f.dots[1]);
  f.document.activeElement = f.previous;
  f.previous.events.click(clickEvent());
  assert.equal(f.document.activeElement, f.dots[0]);
});
test('keyboard navigation does not consume editable field keys', () => {
  const f = fixture();
  key(f, 'ArrowLeft', { closest: () => ({}) });
  assert.equal(f.dots[0].attrs['aria-current'], 'true');
});

test('focus moves to pagination before a terminal arrow becomes unavailable', () => {
  const f = fixture();
  f.dots[1].events.click(clickEvent());
  f.document.activeElement = f.next;
  f.next.events.click(clickEvent());
  assert.equal(f.next.disabled, true);
  assert.equal(f.document.activeElement, f.dots[2]);
  f.dots[1].events.click(clickEvent());
  assert.equal(f.previous.disabled, false);
  assert.equal(f.next.disabled, false);
});

test('disabled arrow capture blocks boundary clicks that a browser bubbles to ancestors', () => {
  const f = fixture();
  let prevented = false, stopped = false;
  f.viewport.events.click({
    target: {closest: selector => selector === 'button' ? f.previous : f.controls},
    detail: 1,
    preventDefault() { prevented = true; },
    stopPropagation() { stopped = true; }
  });
  assert.equal(prevented, true);
  assert.equal(stopped, true);
  assert.equal(f.dots[0].attrs['aria-current'], 'true');
});

test('autoplay gives each banner five seconds and cycles back without changing manual boundaries', () => {
  for (const direction of ['rtl', 'ltr']) {
    const f = fixture(direction, 3, 1, { autoplay: true });
    assert.equal(f.images[1].loading, 'eager');
    assert.equal(f.status.attrs['aria-live'], 'off');
    f.advanceTime(4999);
    assert.equal(f.dots[0].attrs['aria-current'], 'true');
    f.advanceTime(1);
    assert.equal(f.dots[1].attrs['aria-current'], 'true');
    f.advanceTime(5000);
    assert.equal(f.dots[2].attrs['aria-current'], 'true');
    assert.equal(f.next.disabled, true);
    f.advanceTime(5000);
    assert.equal(f.dots[0].attrs['aria-current'], 'true');
    assert.equal(f.previous.disabled, true);
    assert.equal(f.status.textContent, 'Banner 1');
    assert.equal(f.timerCount, 1);
  }
});

test('hover, keyboard focus and a hidden document pause autoplay with a fresh interval on return', () => {
  const f = fixture('ltr', 3, 1, { autoplay: true });
  f.advanceTime(4000);
  f.carousel.events.mouseenter();
  f.advanceTime(12000);
  assert.equal(f.dots[0].attrs['aria-current'], 'true');
  f.carousel.events.mouseleave();
  f.advanceTime(4999);
  assert.equal(f.dots[0].attrs['aria-current'], 'true');
  f.advanceTime(1);
  assert.equal(f.dots[1].attrs['aria-current'], 'true');
  f.carousel.events.focusin();
  f.advanceTime(12000);
  assert.equal(f.dots[1].attrs['aria-current'], 'true');
  f.carousel.events.focusout({ relatedTarget: f.carousel });
  assert.equal(f.timerCount, 0);
  f.carousel.events.focusout({ relatedTarget: null });
  f.document.hidden = true;
  f.document.events.visibilitychange();
  f.advanceTime(12000);
  assert.equal(f.dots[1].attrs['aria-current'], 'true');
  f.document.hidden = false;
  f.document.events.visibilitychange();
  f.advanceTime(5000);
  assert.equal(f.dots[2].attrs['aria-current'], 'true');
});

test('manual navigation and touch gestures reset the autoplay reading interval', () => {
  const f = fixture('rtl', 3, 1, { autoplay: true });
  f.advanceTime(4000);
  f.next.events.click(clickEvent());
  f.advanceTime(1000);
  assert.equal(f.dots[1].attrs['aria-current'], 'true');
  f.viewport.events.touchstart({ touches: [{ clientX: 0, clientY: 0 }] });
  f.advanceTime(12000);
  assert.equal(f.dots[1].attrs['aria-current'], 'true');
  f.viewport.events.touchend({ changedTouches: [{ clientX: 80, clientY: 0 }] });
  assert.equal(f.dots[2].attrs['aria-current'], 'true');
  f.advanceTime(4999);
  assert.equal(f.dots[2].attrs['aria-current'], 'true');
  f.advanceTime(1);
  assert.equal(f.dots[0].attrs['aria-current'], 'true');
});

test('reduced motion suspends rotation without a visible play control', () => {
  const f = fixture('rtl', 3, 1, { autoplay: true, reduced: true });
  f.advanceTime(18000);
  assert.equal(f.dots[0].attrs['aria-current'], 'true');
  assert.equal(f.timerCount, 0);
  f.motion.matches = false;
  f.motion.events.change();
  f.advanceTime(5000);
  assert.equal(f.dots[1].attrs['aria-current'], 'true');
  f.motion.matches = true;
  f.motion.events.change();
  f.advanceTime(12000);
  assert.equal(f.dots[1].attrs['aria-current'], 'true');
  assert.equal(f.timerCount, 0);
});

test('merchant-disabled, zero-slide and single-slide carousels have no autoplay timer', () => {
  for (const count of [0, 1, 3]) {
    const f = fixture('rtl', count, 1, { autoplay: true, enabled: false });
    assert.equal(f.timerCount, 0);
  }
  for (const count of [0, 1]) {
    const f = fixture('rtl', count, 1, { autoplay: true });
    assert.equal(f.timerCount, 0);
    assert.equal(f.controls.hidden, true);
  }
});

test('reinitialization does not duplicate timers and each instance can pause independently', () => {
  const f = fixture('ltr', 3, 2, { autoplay: true });
  assert.equal(f.timerCount, 2);
  vm.runInNewContext('initPromotionCarousels();', f.context);
  assert.equal(f.timerCount, 2);
  f.carousel.events.mouseenter();
  f.advanceTime(5000);
  assert.equal(f.dots[0].attrs['aria-current'], 'true');
  assert.equal(f.fixtures[1].dots[1].attrs['aria-current'], 'true');
  assert.equal(f.timerCount, 1);
});

test('a removed carousel stops its timer and releases global autoplay listeners', () => {
  const f = fixture('rtl', 3, 1, { autoplay: true });
  f.carousel.isConnected = false;
  f.advanceTime(5000);
  assert.equal(f.timerCount, 0);
  assert.equal(f.document.events.visibilitychange, undefined);
  assert.equal(f.motion.events.change, undefined);
});

test('autoplay stops offscreen so changing natural image heights cannot shift viewed products', () => {
  const f = fixture('rtl', 3, 1, { autoplay: true });
  f.advanceTime(4000);
  f.setInView(false);
  f.advanceTime(18000);
  assert.equal(f.dots[0].attrs['aria-current'], 'true');
  assert.equal(f.timerCount, 0);
  f.setInView(true);
  f.advanceTime(4999);
  assert.equal(f.dots[0].attrs['aria-current'], 'true');
  f.advanceTime(1);
  assert.equal(f.dots[1].attrs['aria-current'], 'true');
});

test('configured duration is per instance, defaults to five seconds and rejects invalid values', () => {
  for (const [input, expected] of [[undefined, 5], ['10', 10], ['3', 3], ['60', 60], ['', 5], ['NaN', 5], ['Infinity', 5], ['-5', 5], ['2', 5], ['61', 5], ['6.5', 5]]) {
    const f = fixture('rtl', 3, 1, {autoplay: true, interval: input});
    f.advanceTime(expected * 1000 - 1);
    assert.equal(f.dots[0].attrs['aria-current'], 'true', String(input));
    f.advanceTime(1);
    assert.equal(f.dots[1].attrs['aria-current'], 'true', String(input));
    assert.equal(f.controls.children.length, 0);
    assert.equal(f.dots.length, 3);
  }
});

test('merchant interval setting is passed to the timer without adding a visible control', () => {
  const config = JSON.parse(fs.readFileSync(new URL('../twilight.json', import.meta.url), 'utf8'));
  const component = config.components.find(item => item.path === 'home.beauty-promotions');
  const field = component.fields.find(item => item.id === 'interval');
  assert.equal(field.type, 'number');
  assert.equal(field.format, 'integer');
  assert.equal(field.value, 5);
  assert.equal(field.minimum, 3);
  assert.equal(field.maximum, 60);
  assert.equal(component.fields.find(item => item.id === 'autoplay').value, true);
  const template = fs.readFileSync(new URL('../src/views/pages/partials/home/promotions.twig', import.meta.url), 'utf8');
  assert.match(template, /data-promotion-interval="\{\{ interval\|e\('html_attr'\) \}\}"/);
  assert.doesNotMatch(template, /data-promotion-toggle|data-promotion-play|data-promotion-pause/);
});

test('promotion frame keeps one aspect ratio across slides with differing artwork', () => {
  const styles = fs.readFileSync(new URL('../src/assets/styles/06-beauty/core-care-home.scss', import.meta.url), 'utf8');
  const template = fs.readFileSync(new URL('../src/views/pages/partials/home/promotions.twig', import.meta.url), 'utf8');
  // Bundled artwork mixes 1440x480 and 1440x576; the frame, not the image, sets the height.
  assert.match(styles, /\.beauty-promotions__media \{[^}]*aspect-ratio: var\(--promo-ratio, 3 \/ 1\)/);
  assert.match(styles, /\.beauty-promotions__artwork \{[^}]*height: 100%; object-fit: cover;/);
  assert.doesNotMatch(styles, /\.beauty-promotions__artwork \{[^}]*height: auto/);
  assert.match(styles, /@media \(max-width: 767px\) \{\s*\.beauty-promotions \{ --promo-ratio: 12 \/ 5;/);
  assert.match(template, /beauty-promotions__artwork\{% if slide\.default_artwork %\} beauty-promotions__artwork--default\{% endif %\}/);
});

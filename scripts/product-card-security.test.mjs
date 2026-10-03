import test, { afterEach } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

// Exercise the actual storefront renderer with hostile merchant/product text.
const source = fs.readFileSync(new URL('../src/assets/js/partials/product-card.js', import.meta.url), 'utf8')
  .replace(/^import BasePage from '\.\.\/base-page';\s*/u, '');
let ProductCard;
const bodyDataset = { beautyWishlistLabel: 'Wishlist' };
afterEach(() => { delete bodyDataset.beautyShowProductPromotionTitles; salla.money = amount => String(amount); delete salla.config.currency; });
const salla = {
  lang: { get: () => 'Wishlist' },
  config: { isGuest: () => true, get: () => false },
  storage: { get: () => [] },
  url: { is_placeholder: () => false },
  money: amount => `<b>${amount}</b>`,
  helpers: { number: value => String(value) },
  wishlist: { toggle: () => {} },
};
class ElementStub {
  classList = { add: () => {} };
  attributes = {};
  setAttribute(key, value) { this.attributes[key] = value; }
  querySelectorAll() { return []; }
}
vm.runInNewContext(source, {
  HTMLElement: ElementStub,
  customElements: { define: (_, value) => { ProductCard = value; } },
  window: { location: { href: 'https://preview.example/product' }, notify_when_available_in_card: false },
  URL,
  document: { body: { dataset: bodyDataset } },
  salla,
});

test('only the documented currency icon is restored as markup', () => {
  const card = new ProductCard();
  salla.money = () => '10 <i class=sicon-sar></i><script>alert(1)</script>';
  assert.equal(card.getPriceFormat(10), '10 <i class="sicon-sar" aria-hidden="true"></i>&lt;script&gt;alert(1)&lt;/script&gt;');
});

test('product card escapes merchant text and rejects executable URLs', () => {
  bodyDataset.beautyShowProductPromotionTitles = 'true';
  const card = new ProductCard();
  card.product = {
    id: 7,
    name: '<img src=x onerror=alert(1)>',
    url: 'javascript:alert(1)',
    image: { url: 'javascript:alert(2)', alt: '" onerror="alert(3)' },
    promotion_title: '<script>alert(4)</script>',
    subtitle: '<b>injected</b>',
    add_to_cart_label: '<svg onload=alert(5)>',
    status: 'sale', type: 'product', price: 10,
  };
  card.render();
  assert.match(card.innerHTML, /href="#"/u);
  assert.match(card.innerHTML, /src="#"/u);
  assert.match(card.innerHTML, /&lt;img src=x onerror=alert\(1\)&gt;/u);
  assert.match(card.innerHTML, /&lt;script&gt;alert\(4\)&lt;\/script&gt;/u);
  assert.match(card.innerHTML, /&lt;svg onload=alert\(5\)&gt;/u);
  assert.match(card.innerHTML, /&quot; onerror=&quot;alert\(3\)/u);
  assert.doesNotMatch(card.innerHTML, /onclick=|onerror="|<script>|javascript:/u);
  assert.match(card.innerHTML, /product-status="sale"/u);
});

test('homepage badges preserve real discounts and allow marketing titles only when enabled', () => {
  const card = new ProductCard();
  card.closest = selector => selector === '.beauty-product-section' ? { dataset: { addToCartLabel: 'أضيفي للسلة' } } : null;
  card.product = { is_on_sale: true, regular_price: 200, sale_price: 150 };
  assert.match(card.getProductBadge(), /−25%/u);
  card.product = { promotion_title: 'تنظيف لطيف يعيد للشعر مظهر طبيعي' };
  assert.equal(card.getProductBadge(), '');
  card.product = { promotion_title: 'جديد' };
  assert.equal(card.getProductBadge(), '');
  bodyDataset.beautyShowProductPromotionTitles = 'true';
  assert.match(card.getProductBadge(), /جديد/u);
  card.product = { promotion_title: 'دفء ذهبي يضيء إطلالتك' };
  assert.match(card.getProductBadge(), /دفء ذهبي يضيء إطلالتك/u);
  card.product = { is_on_sale: true, regular_price: 0, sale_price: 10 };
  assert.equal(card.getProductBadge(), '');
});

test('promotion visibility toggles all cards without deleting product data or hiding operational badges', () => {
  for (const home of [true, false]) {
    const card = new ProductCard();
    card.closest = selector => selector === '.beauty-product-section' && home ? {} : null;
    card.product = { promotion_title: 'رموش أوضح' };
    for (const disabled of [undefined, 'false', '0']) {
      bodyDataset.beautyShowProductPromotionTitles = disabled;
      assert.equal(card.getProductBadge(), '');
    }
    bodyDataset.beautyShowProductPromotionTitles = 'true';
    assert.match(card.getProductBadge(), /رموش أوضح/u);
    bodyDataset.beautyShowProductPromotionTitles = 'false';
    assert.equal(card.getProductBadge(), '');
    assert.equal(card.product.promotion_title, 'رموش أوضح');
    card.product.preorder = { label: 'طلب مسبق' };
    assert.match(card.getProductBadge(), /طلب مسبق/u);
  }
  const card = new ProductCard();
  card.product = { promotion_title: 'جديد', quantity: 5 };
  card.showQuantity = true;
  card.remained = 'المتبقي';
  assert.match(card.getProductBadge(), /s-product-card-quantity/u);
});

test('promotion switch defaults off and is wired to the shared layout', () => {
  const theme = JSON.parse(fs.readFileSync(new URL('../twilight.json', import.meta.url), 'utf8'));
  const setting = theme.settings.find(item => item.id === 'beauty_show_product_promotion_titles');
  assert.equal(setting.type, 'boolean');
  assert.equal(setting.format, 'switch');
  assert.equal(setting.value, false);
  assert.equal(setting.selected, false);
  const layout = fs.readFileSync(new URL('../src/views/layouts/master.twig', import.meta.url), 'utf8');
  assert.match(layout, /data-beauty-show-product-promotion-titles="\{\{ theme.settings.get\('beauty_show_product_promotion_titles', false\) \? 'true' : 'false' \}\}"/);
});

test('custom cards register before platform components can choose native fallback cards', () => {
  const layout = fs.readFileSync(new URL('../src/views/layouts/master.twig', import.meta.url), 'utf8');
  const cardScript = layout.match(/<script[^>]*src="[^"\n]*'product-card\.js'[^"\n]*"[^>]*><\/script>/)?.[0];
  assert.ok(cardScript);
  assert.doesNotMatch(cardScript, /\s(?:defer|async|type="module")(?:\s|=|>)/);
  assert.match(cardScript, /data-cfasync="false"/);
  assert.ok(layout.indexOf(cardScript) < layout.indexOf("hook 'head:end'"));
  assert.ok(layout.indexOf(cardScript) < layout.indexOf('<body'));
});

test('homepage product button copy preserves booking and preorder actions', () => {
  const card = new ProductCard();
  card.closest = selector => selector === '.beauty-product-section' ? { dataset: { addToCartLabel: 'أضيفي للسلة' } } : null;
  card.product = { status: 'sale', type: 'product' };
  assert.equal(card.getAddButtonLabel(), 'أضيفي للسلة');
  card.product.type = 'booking';
  assert.equal(card.getAddButtonLabel(), salla.lang.get('pages.cart.book_now'));
  card.product.has_preorder_campaign = true;
  assert.equal(card.getAddButtonLabel(), salla.lang.get('pages.products.pre_order_now'));
});

test('homepage cards show empty stars without inventing a rating and retain fractional ratings', () => {
  const card = new ProductCard();
  card.closest = selector => selector === '.beauty-product-section' ? { dataset: {} } : null;
  card.product = { id: 7, name: 'Product', url: '/product', status: 'sale', type: 'product', price: 10 };
  for (const rating of [undefined, null, { stars: 0 }, { stars: 'invalid' }]) {
    card.product.rating = rating;
    card.render();
    assert.match(card.innerHTML, /beauty-rating-stars--empty/);
    assert.match(card.innerHTML, /☆☆☆☆☆/u);
    assert.match(card.innerHTML, /--rating-fill: 0%/);
  }
  card.product.rating = { stars: '4.5' };
  card.render();
  assert.match(card.innerHTML, /--rating-fill: 90%/);
  assert.match(card.innerHTML, /aria-label="4.5 \/ 5"/);
  assert.doesNotMatch(card.innerHTML, /beauty-rating-stars--empty/);
  card.closest = () => null;
  card.product.rating = null;
  card.render();
  assert.doesNotMatch(card.innerHTML, /class="s-product-card-rating"/);
});

function recommendationCard(overrides = {}) {
  const card = new ProductCard();
  card.closest = selector => selector === '.core-product-related' ? {} : null;
  card.product = { id: 9, name: 'Product', url: '/product', image: { url: '/image.jpg' }, status: 'sale', type: 'product', price: 80, ...overrides };
  card.render();
  return card;
}

test('recommendations use real brand, rating, count and sale data and escape merchant text', () => {
  const card = recommendationCard({ brand: { name: '<script>brand</script>' }, rating: { stars: '4.9', count: 27 }, is_on_sale: true, regular_price: 100, sale_price: 80 });
  assert.match(card.innerHTML, /&lt;script&gt;brand&lt;\/script&gt;/);
  assert.match(card.innerHTML, /4.9 \/ 5 \(27\)/);
  assert.match(card.innerHTML, /core-recommendation-discount">-20%/);
  assert.match(card.innerHTML, /<del>/);
  assert.doesNotMatch(card.innerHTML, /s-product-card-content-subtitle|<script>/);
});

test('recommendations omit missing metadata and invalid discounts without empty placeholders', () => {
  const card = recommendationCard({ rating: { stars: 'invalid', count: 20 }, is_on_sale: true, regular_price: 0, sale_price: 80 });
  assert.doesNotMatch(card.innerHTML, /core-recommendation-rating|core-recommendation-brand|core-recommendation-discount|<del>/);
  assert.match(card.innerHTML, /core-recommendation-price">80/);
});

test('recommendation actions retain native booking, options and availability behavior', () => {
  const options = recommendationCard({ has_options: true });
  assert.match(options.innerHTML, /<rect/);
  assert.match(options.innerHTML, /product-id="9" product-status="sale" product-type="product"/);
  const booking = recommendationCard({ type: 'booking' });
  assert.match(booking.innerHTML, /sicon-calendar-time/);
  assert.match(booking.innerHTML, /product-type="booking"/);
  const unavailable = recommendationCard({ status: 'out', is_out_of_stock: true });
  assert.match(unavailable.innerHTML, /core-recommendation-cart--status/);
  assert.match(unavailable.innerHTML, /product-status="out"/);
  assert.doesNotMatch(unavailable.innerHTML, /class="sr-only"/);
});

test('wishlist listener attaches to the host once, not its hydrated nested button', () => {
  const card = recommendationCard();
  const selectors = [];
  card.querySelectorAll = selector => { selectors.push(selector); return []; };
  card.render();
  assert.ok(selectors.includes('salla-button.s-product-card-wishlist-btn'));
  assert.ok(!selectors.includes('.s-product-card-wishlist-btn'));
});

test('hiding the cart with no rating removes the empty recommendation tools row', () => {
  const card = recommendationCard();
  card.hideAddBtn = true;
  card.render();
  assert.doesNotMatch(card.innerHTML, /core-recommendation-tools|core-recommendation-cart/);
});

test('recommendation SAR prices use a single real currency icon before the formatted amount', () => {
  salla.config.currency = () => ({ code: 'SAR' });
  salla.money = () => '107.61 ريال';
  const card = recommendationCard();
  const price = card.getRecommendationMoney(107.61);
  assert.match(price, /dir="ltr"><i class="sicon-sar" role="img" aria-label="SAR"><\/i><span>107.61<\/span>/);
  assert.doesNotMatch(price, /ريال|﷼/);
  salla.money = () => '107.61 <i class=sicon-sar></i>';
  assert.equal(card.getRecommendationMoney(107.61), price);
  salla.money = () => '107.61 <script>alert(1)</script> ريال';
  assert.doesNotMatch(card.getRecommendationMoney(107.61), /<script>/);
  assert.match(card.getRecommendationMoney(107.61), /&lt;script&gt;/);
  salla.config.currency = () => ({ code: 'USD' });
  salla.money = () => '$107.61';
  assert.equal(card.getRecommendationMoney(107.61), '$107.61');
});

test('real offer countdowns retain the expiry time and omit expired or invalid deadlines', () => {
  const deadline = Date.now() + 3600000;
  const card = recommendationCard({ is_on_sale: true, regular_price: 100, sale_price: 80, discount_ends: deadline });
  const ksa = new Date(deadline + 10800000).toISOString().slice(0, 19).replace('T', ' ');
  assert.match(card.innerHTML, new RegExp(`date="${ksa}"`));
  assert.match(card.innerHTML, /end-of-day="false"/);
  for (const discount_ends of [Date.now() - 1000, 'invalid', undefined]) {
    card.product.discount_ends = discount_ends;
    card.render();
    assert.doesNotMatch(card.innerHTML, /salla-count-down/);
  }
  card.product.discount_ends = deadline;
  card.product.preorder = { label: 'طلب مسبق' };
  card.render();
  assert.match(card.innerHTML, /طلب مسبق/);
  assert.doesNotMatch(card.innerHTML, /salla-count-down/);
});

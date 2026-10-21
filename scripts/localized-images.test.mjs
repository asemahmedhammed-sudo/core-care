import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const config = JSON.parse(fs.readFileSync(new URL('../twilight.json', import.meta.url), 'utf8'));
const read = path => fs.readFileSync(new URL(`../src/views/${path}`, import.meta.url), 'utf8');
const helper = read('pages/partials/localized-image.twig');

// Customer avatars are portraits, not language-specific artwork.
const NOT_LOCALIZED = new Set(['items.avatar']);

// Every [owner, list] pair that holds fields: component fields, collection sub-fields, and global settings.
function fieldLists() {
  const lists = [['settings', config.settings]];
  const walk = (owner, fields) => {
    lists.push([owner, fields]);
    for (const field of fields) if (field.fields) walk(`${owner} > ${field.id}`, field.fields);
  };
  for (const component of config.components) walk(component.path, component.fields);
  return lists;
}

test('every banner image field keeps its id for Arabic and is followed by an optional English twin', () => {
  let pairs = 0;
  for (const [owner, fields] of fieldLists()) {
    fields.forEach((field, index) => {
      if (field.format !== 'image' || field.id.endsWith('_en') || NOT_LOCALIZED.has(field.id)) return;
      const english = fields[index + 1];
      assert.equal(english?.id, `${field.id}_en`, `${owner} ${field.id} needs ${field.id}_en right after it`);
      assert.match(field.label, /\(عربي\)$/, `${owner} ${field.id} label`);
      assert.match(english.label, /\(English\)$/, `${owner} ${english.id} label`);
      assert.equal(english.type, field.type);
      assert.equal(english.format, field.format);
      assert.deepEqual(english.settings, field.settings, `${owner} ${english.id} keeps the same dimensions`);
      assert.equal(english.required, false, `${owner} ${english.id} is optional`);
      assert.equal(english.value, null);
      pairs += 1;
    });
  }
  // 11 component image fields + 6 promo settings + the tab bar campaign icon.
  assert.equal(pairs, 18);
});

test('the shared resolver uses the official language code and falls back to the Arabic image', () => {
  assert.match(helper, /language\.code == 'en'/);
  assert.match(helper, /attribute\(item, field\)\|default\(''\)/);
  assert.match(helper, /attribute\(item, field ~ '_en'\)\|default\(''\)/);
  assert.match(helper, /\{%- if is_english and en_image -%\}\s*\{\{- en_image\|e\('html_attr'\) -\}\}/);
  assert.match(helper, /\{%- elseif ar_image and not \(is_english and en_main_image\) -%\}\s*\{\{- ar_image\|e\('html_attr'\) -\}\}/);
  assert.doesNotMatch(helper, /\|raw/);
});

test('component templates render images only through the shared resolver', () => {
  const views = {
    'components/home/beauty-hero.twig': ["item: component, field: 'image'"],
    'components/home/beauty-collections.twig': ["item: banner, field: 'image'"],
    'components/home/enhanced-slider.twig': ["item: slide, field: 'image'"],
    'components/home/slider-products-with-header.twig': ["item: component, field: 'background'"],
    'components/home/enhanced-square-banners.twig': ["item: banner, field: 'image'"],
    'pages/partials/home/promo-banner.twig': ["item: banner, field: 'image'", "item: banner, field: 'mobile_image', main_field: 'image'"],
    'pages/partials/home/promotions.twig': ["item: slide, field: 'image'", "item: slide, field: 'mobile_image', main_field: 'image'"],
  };
  for (const [path, calls] of Object.entries(views)) {
    const view = read(path);
    for (const call of calls) assert.ok(view.includes(`{% include 'pages.partials.localized-image' with { ${call} } %}`), `${path}: ${call}`);
    // No image URL is printed straight from a field any more.
    assert.doesNotMatch(view, /(?:src|srcset|data-bg)="\{\{\s*(?:component|banner|slide)\.(?:mobile_)?image\b|url\('?\{\{\s*(?:component|slide)\.(?:image|background)\b/, path);
  }
});

test('English twins reach the shared partials', () => {
  for (const path of ['components/home/beauty-promo-wide.twig', 'components/home/beauty-promo-pair.twig']) {
    const view = read(path);
    // promo-banner is included with `only`, so the language and English fields are passed explicitly.
    assert.match(view, /image_en: (?:component|banner)\.image_en\|default\(''\)/, path);
    assert.match(view, /mobile_image_en: (?:component|banner)\.mobile_image_en\|default\(''\)/, path);
    assert.match(view, /language: language\s*\} only %\}/, path);
  }
  assert.match(read('components/home/beauty-promotions.twig'), /image_en: slide\.image_en\|default\(''\),\s*mobile_image: slide\.mobile_image,\s*mobile_image_en: slide\.mobile_image_en\|default\(''\),/);
  const promotions = read('pages/partials/home/promotions.twig');
  // Bundled default artwork has no English twin; only merchant-uploaded promo images do.
  assert.match(promotions, /image_en: image \? theme\.settings\.get\('beauty_promo_' ~ number ~ '_image_en'\) : '',/);
  assert.match(promotions, /mobile_image_en: theme\.settings\.get\('beauty_promo_' ~ number ~ '_mobile_image_en'\),/);
});

# Main promotions slider: per-slide links — 2026-10-19

## Change

- `twilight.json` → `home.beauty-promotions` → `slides` collection: added `slides.url` (`items` / `variable-list`, same `source`, `searchable` and 11 `sources` as the Wide campaign banner `url` field; label «الرابط عند الضغط على الصورة», optional, `value: null`) and `slides.new_tab` (`boolean` / `switch`, default `false`).
- `src/views/components/home/beauty-promotions.twig`: passes `link` (only a trimmed `https://` URL without space, quote or angle brackets; same rule as the legacy slide links) and `new_tab` to the shared partial. Slides without `url` (saved before this change) get `link: ''`.
- `src/views/pages/partials/home/promotions.twig`: linked slides render `<a href aria-label>`; with `new_tab` add `target="_blank" rel="noopener noreferrer"` and append `beauty.promo.new_tab` to the accessible name. Unlinked slides keep the `<div>` wrapper (no `href`, no pointer cursor).
- `src/locales/ar.json`, `src/locales/en.json`: `beauty.promo.new_tab`.
- Carousel JS unchanged: it is the theme's own `promotion-carousel.js` (not Swiper, no loop clones). It already suppresses the pointer click for 400 ms after a horizontal touch swipe and leaves taps/keyboard activation alone. Store links are localized to the visitor's language by `preview-navigation.js` like every other anchor.

## Repository checks (working tree on `feature/bilingual-images`, uncommitted)

| Check | Result |
|---|---|
| `pnpm build` (production) | Passed; 9 webpack warnings (existing size recommendations). No `public/` asset changed by this work |
| `pnpm test` | Passed, 97/97 (2 new tests for the link field and template rules) |
| `git diff --check` | Passed |

## Salla platform verification

**Incomplete.** Not loaded in the Salla development preview or Chrome in this session. Twig rendering of `slides.url` from a real `variable-list` value, the editor panel appearance, and click/swipe behavior on device are unverified.

### Manual steps (development theme 523702774 preview, Chrome, 1440px and 390px, Arabic and English)

1. Editor → «سلايدر العروض الرئيسي» → open an existing slide: «الرابط عند الضغط على الصورة» and «فتح الرابط في تبويب جديد» appear under the images; existing images are still there.
2. Slide 1 → Product; slide 2 → Category; slide 3 → External link `https://…`; leave slide 4 without a link. Save.
3. Preview: `body` has `theme-beauty`; click slides 1–3 → correct destination, `/en/` kept on the English storefront; slide 4 → no navigation, normal cursor, no `href` in DOM.
4. Enable new tab on slide 3 → opens a new tab; DOM shows `target="_blank" rel="noopener noreferrer"`.
5. Mobile (390px): swipe across a linked slide in both directions → slide changes, no navigation; tap → navigates. Repeat in English (LTR).
6. Keyboard: Tab to the slide link → Enter opens it; arrows/dots still change slides without navigating.
7. Console: no errors. Frame ratio remains 3:1 desktop / 12:5 mobile; no gap change above/below the slider.
8. External link `http://…` or text without `https://` → slide renders without a link.

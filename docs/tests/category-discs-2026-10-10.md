# Homepage category discs — 2026-10-10

Request: the «تسوقي حسب الفئة» section (`home.main-links`) rendered empty white circles with only a name under them.

## Change

- `src/views/components/home/main-links.twig`: every category disc always renders a tinted initial beneath the optional image. The Arabic article «ال» is skipped (العطور → ع). Custom links show the merchant-chosen icon, or the initial when none is set. Entries without a name/URL are skipped instead of rendering broken links.
- `src/assets/js/partials/category-media.js` (loaded from `home.js`): an image is shown only once it loads with real dimensions. Broken or 1×1 placeholder images are removed so the initial stays visible. A capture listener covers lazy images and editor re-renders.
- `core-care-home.scss`: four rotating soft tints (`--cc-secondary-soft`, plus new `--cc-tint-*` tokens in `core-care-palette.scss`), 26px initial, 13px/500 label, hover/focus ring. A 3px list padding stops the horizontal scroller clipping the ring. Reduced motion respected.
- No `twilight.json` field, setting ID or merchant data changed.

## Checks

- Working tree on top of `0957bc5`; a concurrent session was editing the header language menu (`header.twig`, `core-care-language-menu.js`, locales, `master.twig` revision) during this work. Those edits were not made or reverted here.
- `pnpm build`: passed (9 webpack warnings, same count as before this change).
- `pnpm test`: 84/85 passed. Failing: `header language trigger is a disclosure for an inline language panel…` (`scripts/header-localization.test.mjs`), which belongs to the concurrent header edits. The new test `homepage category discs never render empty` passed.
- Local tooling only (in-app browser, static mock page with the built `public/app.css` and the helper script, Arabic RTL): 1 broken image → removed, initial shown; 1 real image → covers the disc; 3 discs without images → tinted initials. At 375px: no horizontal page overflow; the list scrolls inside itself, as before.

## Not verified

- Salla development preview (theme `523702774`) desktop/mobile, LTR, the real category image values Salla returns, editor reordering and hidden-component cases: **incomplete**.
- Public storefront still runs `theme-raed`; this change reaches visitors only after the owner publishes and activates the Core Care theme.

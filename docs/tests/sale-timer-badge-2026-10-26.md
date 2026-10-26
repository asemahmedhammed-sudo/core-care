# Sale timer badge on product cards — 2026-10-26

## Problem
On the public store (`corecare-sa.com`, Core Care theme active, body `theme-beauty`), the sale badge on standard product cards showed `04 02 44 35` with the colons dropped under the numbers and repeated. Measured at 375px: badge 54px tall, each countdown box squeezed to 23px.

Causes:
- Salla's `.s-count-down-item` is a `flex: 1 1 0%` column at 16px, and the theme did not override it. The value and its `:` wrapped onto two lines.
- Salla adds its own `:` (`.s-count-down-item::after`), and the theme adds another one after each value.
- Days were shown as an unlabelled number.

The product data was correct: product 1986987357 is on sale from 2026-10-19 to 2026-10-30 (49 → 45 SAR).

## Change (commit `32d438f`, pushed to `feature/bilingual-images`)
- `src/assets/js/partials/product-card.js`: with one day or more left, the badge shows text (`ينتهي بعد 4 أيام` / `Ends in 4 days`, Arabic plural forms via `Intl.PluralRules`). Only the last 24 hours use `salla-count-down` (HH:MM:SS).
- `src/assets/styles/06-beauty/core-care-products.scss`: each countdown item is `flex: none`, 10px/16px, and Salla's colon is removed. The badge is `nowrap` within each part and wraps as whole units only when the card is too narrow.
- `src/locales/ar.json`, `src/locales/en.json`: new `beauty.recommendation_ends_in_days.{one,two,few,many,other}`.
- `scripts/product-card-timer.test.mjs`: new regression test.

## Repository checks
- `pnpm build`: passed (9 existing Webpack size warnings).
- `pnpm test`: 136/136 passed; static audit reports no missing locale keys (211 keys).
- `git diff --check`: clean.

## Visual check (partial: local CSS injected into the public store page)
Environment: Claude desktop built-in browser (not Chrome), `corecare-sa.com/ar/مكياج/c187393441`, public storefront running Core Care. The built timer CSS was injected into the page. Badge markup identical to what the new renderer emits was placed by hand: a countdown 5 hours out on the mascara card, and the text `ينتهي بعد 4 أيام` on a neighbouring card. **The new JS itself did not run on Salla.**

| Viewport | Card width | Countdown badge | Days badge |
|---|---:|---|---|
| 320px | 143px | Wraps to 2 lines inside the pill (label / time), 34px tall, no overflow | One line, 18px |
| 360px | 163px | One line, 92×18px, no overflow | One line |
| 390px | 178px | One line, 92×18px, no overflow | One line |
| 1024px (pane width) | 214px | One line, 92×18px | One line |

Colons appear once (`04:59:45`), with no colon next to the label.

## Salla development preview (incomplete)
- `yes n | salla theme preview -s "Core Care" -o -E` (CLI 3.2.63) started its local asset server and dev webpack watcher, then printed nothing more for over 5 minutes. No draft id was produced. The task was stopped and `pnpm build` restored production `public/`. `git status` was clean for `public/` and `src/` afterwards.
- The store-level `theme_versions_list` only lists store versions (Core Care 62497446 active), not developer drafts.
- Hosted-asset check that did work: `cdn.jsdelivr.net/gh/asemahmedhammed-sudo/core-care@32d438f56e2f19226ecf1a014a0a40677d0e39d8/public/app.css` returns 200. It contains the new badge rules (`flex-wrap:wrap`, `.s-count-down-item:after{content:none}`), and `product-card.js` there contains `recommendation_ends_in_days`. This proves the pushed build, not how it renders on Salla.
- An orphaned `pnpm run watch` (parent launchd, started 20:47) was running in the repo. It was not stopped (permission denied). It can rewrite `public/` with development output, so run `pnpm build` before any later commit.

## Not tested
- Rendering in an actual Salla development preview draft (see above).
- Chrome; English LTR on the storefront; homepage and related-product carousels; desktop at 1440px.
- A badge crossing from 1 day to under 24 hours while the page stays open. The days text does not update live; it changes on the next page load.

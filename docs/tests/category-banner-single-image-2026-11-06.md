# Phone categories banner from a single category image — 2026-11-06

## Report

Owner's phone screenshot of `corecare-sa.com/en`, categories sheet: the «Makeup» banner shows only a horizontal band of the category image, cutting the pink ring drawn into the artwork. Salla gives a category one image field, with no separate phone and desktop image.

## Cause

- The store's category images are square 900×900 WebP (about 155 KB), white backgrounds with a pink ring drawn into the image (checked via the public `api.salla.dev/store/v1/products/categories` for store 1430728739).
- The phone banner was `max-height: 120px; object-fit: cover` on a strip of about 257×120 px at 390 px width, so square art lost about half its height.
- `cdn.files.salla.network` and `cdn.salla.sa` answer with `Access-Control-Allow-Origin: *` (curl, 2026-11-06). `-thumbnail`, `-medium` and `-large` variants of the image returned 404, so only the original is available.

## Change (commit `29db957` on `feature/bilingual-images`, pushed)

- `src/assets/js/partials/core-care-categories.js`: `banner()` builds the phone banner from the one image.
  - `bannerLayout()`: art 2:1 or wider gets `data-layout="wide"` (fills the strip, cover). Anything squarer gets `composed`: the category name and «تسوق الآن / Shop now» at the inline start, the whole image (contain) at the inline end.
  - `bannerPalette()`: samples the image at 24×24 on a canvas. A coloured backdrop is continued around the image. A white or transparent backdrop gets a pale tint of the subject, and the image is multiplied onto it (`data-blend`), so the white square disappears. A dark backdrop switches the text to white (`data-dark`).
  - `crossOrigin="anonymous"` is set before `src`, only for the two Salla hosts above. Other hosts load without sampling and keep the neutral surface.
  - A broken image removes the whole banner. A category without an image gets no banner.
- `src/assets/styles/06-beauty/core-care-app-nav.scss`: both layouts have a fixed height of 112 px, so the layout chosen on load does not move the page. The image column is `min(112px, 42%)`. The CTA does not wrap.
- `scripts/categories.test.mjs`: layout thresholds, sampling hosts, palette cases (white, transparent, coloured, dark, blank, unreadable), and the stylesheet rules.
- Desktop dropdown (`core-categories__feature`, 3:2 contain) and the subcategory circles are unchanged.

## Repository checks

- `pnpm build`: compiled, with the 9 existing webpack size warnings.
- `pnpm test`: 163 of 163 passed. `docs/evidence/technical/static-audit.json` changed only in `generatedAt`.
- `public/app.css` and `public/main-menu.js` are the production build.

## Local harness check (not Salla)

Built-in browser (Chromium in the Claude desktop app, not Chrome). Static page served from localhost with this build's `public/app.css` and `public/main-menu.js`, `body.theme-beauty.cc-has-tabbar`, a stubbed `salla` object returning the store's real category tree (ar and en) and real image URLs.

| Viewport | Case | Result |
|---|---|---|
| 390×844 RTL | Makeup, real 900×900 image | `composed`, 257×112, whole image with its ring, background `rgb(249 240 240)`, white removed by multiply, 12 px to the next card, no horizontal overflow |
| 390×844 LTR | Same | Name at the left, image at the right, chevron pointing right |
| 390×844 RTL | Hair care (no image) | No banner; the card starts 12 px from the panel top |
| 320×700 RTL | Makeup | 200×112, image 84 px, CTA on one line, no overflow (first try wrapped the CTA; fixed with `min(112px, 42%)` and `nowrap`) |
| 320×700 RTL | Test-only 1200×500 SVG on the first category | `wide`, cover, text hidden, height still 112 |

## Salla development preview

- Draft `1524525534`, created with `yes n | salla theme preview -s "Core Care" -o -E` from pushed `29db957`. CLI stopped afterwards; no watcher left; `pnpm build` re-run, `public/` unchanged.
- Hosted draft assets `salla.design/themes/draft/1524525534/app.css` and `main-menu.js`: 404 at creation, 200 about ten minutes later, byte-identical to the build. The jsDelivr copy at `@29db957…/public` is also identical.
- Opened in Claude in Chrome (signed in) through the editor with `assets_url` set to the jsDelivr copy, then the editor's `/watch` frame. Storefront page: `salla.design/ar/dev-…?preview=true`, body `theme-beauty … salla-draft-1524525534 … cc-has-tabbar`, `app.css` and `main-menu.js` from `@29db957`. This session is the Partners **demo store**, not corecare-sa.com.
- Measured in same-origin iframes at each width, after opening the sheet from the tab bar:

| Width | Lang | Banner («الفساتين», 900×900 photo on a beige backdrop) |
|---|---|---|
| 390 | ar | `composed`, 257×112, background `rgb(219 195 173)` taken from the image edges (no blend), whole image 96×100 at the left, CTA one line, 12 px to the next card, no horizontal overflow |
| 320 | ar | 200×112, image 72×100, CTA one line, 12 px gap, no overflow |
| 390 | en | Mirrored: text at the left, image at the right, «Shop now», 12 px gap, no overflow. The title stays Arabic because the demo category has no English name (store data). |

The other demo categories have no image: no banner, the card starts at the panel top.

Screenshot (local only; `docs/evidence/visual/` is git-ignored): `docs/evidence/visual/category-banner-salla-mobile-390-2026-11-06.png` (390 px, Arabic, demo store).

## Not verified

- The real store's images (white backdrop and multiply blend) on Salla: checked only in the local harness. The demo store has one category image, with a coloured backdrop.
- The wide layout on Salla (no wide category image in the demo store; local harness only).
- Public storefront: unchanged until the owner publishes a version that contains `29db957`.
- Desktop dropdown and subcategory circles: unchanged by this commit, not re-measured.

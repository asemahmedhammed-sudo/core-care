# Phone categories banner from a single category image — 2026-11-06

## Report

Owner's phone screenshot of `corecare-sa.com/en`, categories sheet: the «Makeup» banner shows only a horizontal band of the category image, cutting the pink ring drawn into the artwork. Salla gives a category one image field, with no separate phone and desktop image.

## Cause

- The store's category images are square 900×900 WebP (about 155 KB), white backgrounds with a pink ring drawn into the image (checked via the public `api.salla.dev/store/v1/products/categories` for store 1430728739).
- The phone banner was `max-height: 120px; object-fit: cover` on a strip of about 257×120 px at 390 px width, so square art lost about half its height.
- `cdn.files.salla.network` and `cdn.salla.sa` answer with `Access-Control-Allow-Origin: *` (curl, 2026-11-06). `-thumbnail`, `-medium` and `-large` variants of the image returned 404, so only the original is available.

## Change (working tree on top of `a8e8f6f`, not committed)

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

## Not verified

- Salla development preview (needs a pushed commit, see the preview workflow) and Chrome.
- Public storefront: unchanged until the owner publishes a version that contains this change.
- A real merchant image with a coloured or dark backdrop on the store (covered only by unit tests).
- Real IBM Plex Sans Arabic font (the harness used the fallback font).

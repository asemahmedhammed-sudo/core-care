# Product gallery — 2026-10-03

## Scope

Replace the product image slider with `core-product-gallery`: one visible main image, a vertical thumbnail rail on the RTL right side, selected-image border, and scroll arrows only when thumbnails overflow. Retain Salla product option image selection, native mobile gallery, desktop lightbox/zoom, video and 3D media. A single image omits the rail; missing images omit the gallery.

Only the development theme `version_id=1026765166` is in scope. No other theme is used for verification.

## Repository checks

- Production Webpack build passed; generated `public/app.css` and `public/product.js` contain the new gallery. Existing bundle size/Sass warnings remain.
- `npm test`: 27 tests passed, including gallery selection, keyboard navigation, overflow boundaries, Salla color/thumbnail options, RTL/LTR swipes, and accidental lightbox suppression.
- Static audit: 13/13 repository checks passed; platform checks are separate.
- `git diff --check`: passed.

## Platform verification

Implementation commit `6e0b97c` was pushed to `origin/main`. Reopened only the specified merchant editor and its observed Core Care preview URL, retaining `version_id=1026765166`.

- Selected merchant product `1537533226` (CALA liquid blush), which has two actual images, through the editor's product selector.
- The first reload returned `422 Twilight Error: File [src/views/pages/product/single.twig] Not Found`; the template exists in the pushed tree. A subsequent load recovered.
- The recovered merchant preview still serves `<salla-slider>` and `product.js?v=20261003-product-reference-1`, rather than the new `<core-product-gallery>` and `20261003-product-gallery-1` revision.
- Confirmed this old rendering in the editor and its direct preview at desktop 1126px and mobile 390px. Screenshots: `output/qa/product-gallery-hosted-old-desktop.jpg` and `output/qa/product-gallery-hosted-old-mobile.jpg`. These are evidence of the old version only.
- Chrome is not exposed by the connected browser provider; the actual hosted page was inspected through the in-app browser.

Final visual verification on Salla remains incomplete because the specified hosted development version has not served the pushed implementation. Live zero-image, video/3D, product option, hide/reorder and neighbour-spacing checks on the new implementation remain pending. The previously rejected official CLI preview was not retried or bypassed.

## Supplemental local visual check

This is a standalone component fixture, not another Salla theme. It uses the production stylesheet, the gallery source module and the merchant's two observed image URLs (repeated to exercise six-image overflow). It does not validate Twig rendering or Salla component behavior.

- Desktop 1280px: one visible main image, RTL thumbnails on the right, dark selected border, contained images. Six thumbnails show scroll controls; two thumbnails hide both controls; one image omits the rail.
- Mobile 390px: no horizontal overflow (`scrollWidth=390`). Main image/rail share a 282px height, followed by the existing 16px gap to product information. Single-image stage expands to the available 358px width without reserving a rail.
- Clicking the second thumbnail changes the visible image and selected state. Keyboard End selects the sixth image, reveals its thumbnail and disables the next arrow at the bottom; exactly one slide remains visible.
- Screenshots: `output/qa/product-gallery-local-desktop.jpg` and `output/qa/product-gallery-local-mobile.jpg`.
- No added vertical margin or fixed blank spacer between sections. Production page source still conditionally omits missing gallery content; live missing-image/hide/reorder checks are not claimed.

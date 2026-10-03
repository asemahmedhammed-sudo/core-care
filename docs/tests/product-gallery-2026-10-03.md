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

Pending after push to `main`. The editor is reachable and identifies the development theme. Actual desktop/mobile spacing and interaction results will be recorded after the updated gallery is served.

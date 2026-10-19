# Product color option cards and required marker — 2026-10-19

## Change

- `src/views/pages/partials/product/options.twig`: for options of type `color`, emits a scoped `<style>` that sets `--cc-color-option-image` on each value's label from Salla's `details[].image` (only `https://` values). Selector: `salla-product-options[product-id] input[value=detail.id] + label`. No JavaScript change; Salla's `salla-product-options` still renders and handles the radios.
- `src/assets/styles/06-beauty/core-care-product-details.scss`: new block scoped to `body.theme-beauty salla-product-options` (product page and cart option editor):
  - Color values become cards: 88px wide (80px below 768px), 1px `--cc-border`, 12px radius, 64px media (56px mobile), name below.
  - The linked variant image covers Salla's hex swatch (`background-size: contain` on white). Without a linked image, the hex color stays visible as a same-size tile.
  - Selected: `#AE27D3` border plus a 20px purple circular check at the inline-end top corner. Hover, `:focus-visible` ring and disabled (grayscale, not-allowed) states.
  - Required marker: label `b` is a flex row with a 5px gap; the marker is 12px, weight 600, `#D95B69`. Flex follows `dir`, so it sits after the label in reading order in both languages.
  - PostCSS lowers asymmetric logical properties to LTR-only values, so the checkmark side and wrapper padding use explicit `html[dir]` rules (same pattern as `core-care-cart.scss`).
- `src/assets/styles/06-beauty/core-care-palette.scss`: tokens `--cc-option-selected: #ae27d3`, `--cc-required: #d95b69`.
- Other option types (thumbnail, select, radio, text, date, file…) are unchanged apart from the shared required marker.

## Repository checks (working tree on `feature/bilingual-images`, HEAD `7fa1278`, uncommitted)

| Check | Result |
|---|---|
| `pnpm build` (production) | Passed; 9 webpack warnings (existing size recommendations). `public/app.css` regenerated |
| `pnpm test` | Passed, 97/97; static audit 13/13 |
| `git diff --check` | Passed |

## Browser verification (partial evidence)

**Environment:** public storefront `corecare-sa.com`, which serves Core Care theme `523702774` **v1.7.0** (`body.theme-beauty`; assets from `themes/523702774/1.7.0/`). The new code is **not deployed** there. The compiled rules from local `public/app.css`, plus the style rules the Twig loop would emit (generated from the page's own `options` data with the same logic), were injected into the page in the Claude desktop built-in browser only. Nothing on the store was changed. This exercises the real Salla component, data and price API. It does not prove Twig rendering on Salla or the hosted asset build. Not Chrome.

Product: Flormar Big N Bold mascara (`p1986987357`), option «اللون» / «Color», required, 3 values with linked images.

| Case | Result |
|---|---|
| Arabic 1440px and 1024px | Cards show the variant images; selected card has purple border and check at the top-left (inline-end) corner |
| Arabic asterisk | `#D95B69`, 12px, 600, 5px to the left of «اللون» |
| Select «ازرق» by click | Correct radio checked; gallery switched to image `281635147`; `product::price.updated` returned (45 / 49, SKU updated) |
| Keyboard | Arrow key from «ازرق» moved to «اصفر»; gallery followed; purple focus ring visible |
| Arabic 390px | 3 cards at 80px, no page or container overflow; label→cards 14px, cards→next block 19px |
| English 1440px | «Color» then asterisk 5px to its right; check at the top-right corner; no overflow |
| No linked image (simulated by removing one value's image variable) | Same-size tile filled with Salla's hex color |
| Corner fringe | Initial version showed faint hex-colored corners under images; fixed by overhanging the image layer 1px |

Observed during testing (pre-existing, unrelated): one browser tab stopped hydrating all Salla components after viewport emulation and reloads (`t.componentOnReady is not a function`). A fresh tab hydrated normally (131 components). Not investigated further.

## Not tested

- Twig output on Salla: whether `detail.image` is available in Twig for color options (the JSON serialization had it) and whether the `<style>` renders. Check in the development preview after upload.
- Out-of-stock / disabled color value and values with an additional price (no test data).
- Cart page option editor with a color option (would require creating a cart on the live store).
- Products with many color values (wrapping), long names, 320px width.
- Development theme editor preview: the Salla preview for this theme returned an empty document on 2026-10-06; not retried.

## Status

Implementation complete. Repository checks passed. Salla platform verification **incomplete** (injected CSS on the public storefront only). Publication readiness not established; the change reaches visitors only after it is pushed and the owner publishes the theme version.

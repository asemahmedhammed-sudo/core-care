# Recommendation components — 2026-10-04

## Corrections to the supplied Nice One reference

- Scoped to product detail `.core-product-related`: seven cards from 1200px, six from 900px, four from 640px and 2.1 on phones. Heading 18px; 8px white card corners; gray section background; 16px desktop / 12px phone carousel gap.
- Matched the image-edge cart action, outline heart, rating pill and review count, right-aligned English/Arabic brand, two-line title, crossed old price, pink sale price and pale pink percentage chip. Carousel arrows now overlay the row and hide when locked/disabled.
- SAR prices explicitly use the existing Salla `sicon-sar` currency glyph to the left of the amount, including old prices. Foreign currencies retain the platform formatter. All unrecognized formatter HTML remains escaped.
- Real merchant promotion titles remain opt-in. Actual best-seller promotion text receives the purple badge. Only a real future sale deadline renders a native Salla countdown; expired/invalid deadlines are omitted and preorder labels take priority. No production ratings, reviews, brands or promotions are fabricated.
- Image-edge cart actions move inside the image if the rating row is absent, avoiding overlap with the title. Existing availability, options, booking and wishlist integrations remain native.

## Checks and local visual evidence

- Production build succeeded with 9 existing webpack/Sass warnings. Generated `public/app.css` and `public/product-card.js` were reviewed and committed. `npm test`: 34/34 tests passed; static audit 13/13 repository checks passed; `git diff --check` passed.
- Read the real Nice One reference product page. Its recommendations use IBM Plex Sans Arabic, seven cards at 1280px, roughly 168px card width, 150px image height, a 36px circular action, 12px title/brand and 16px price. The theme already uses the same font family.
- Local verification used actual generated CSS/JS inside fixed-width browser frames (1280px and 390px), with simulated native controls. Product names/images come from visible store content. Ratings, brands and promotional metadata in these fixtures are **test data**, explicitly labeled on the screenshots; these screenshots do not establish the merchant's real ratings/offers.
- Desktop: seven approximately 166px cards; correct SAR glyph and price order; right-aligned brands; countdown on one line; no overlapping text/actions. Heading-to-content gap 16px; section padding 20px vertically.
- Mobile: two approximately 165px cards and a preview of the next; document width and scroll width both 390px; no document overflow. Section padding 16px; no abnormal internal spacing observed.
- A single product with brand/rating/promotion absent rendered no tools row and shrank the section from about 399px to 348px. Its cart stayed within the image and did not overlap the title. Hidden-cart/missing-rating behavior is also covered by existing tests. The hydrated-empty-slider rule remains in place.
- Local screenshot evidence: `output/qa/product-recommendations-components-desktop.jpg` and `output/qa/product-recommendations-components-mobile.jpg`.

## Actual Salla check after pushing

- Implementation commit `30d8fb8` was successfully pushed to `origin/main` in `asemahmedhammed-sudo/core-care`.
- Reopened the accepted Core Care development request through the merchant's requests page, then chose product details in the editor. Salla created fresh draft **1357691655** for settings version **1026765166**. No demo theme or marketplace publication was used.
- This fresh actual preview still serves `product-card.js`, `app.css`, `app.js` and `product.js` with **`v=20261003-product-gallery-1`**, and has **zero `.core-recommendation-card` elements**. Expected revision is **`20261004-product-recommendations-3`**. Reloading the separate actual product preview also returned the old revision.
- Therefore the current development preview has not adopted the pushed repository source. The exact Salla synchronization cause is not established; opening a fresh draft did not resolve it.
- **Actual visual verification remains incomplete**: the new cards, native countdown/cart behavior, adjacent sections on desktop/mobile, and editor hide/reorder need to be reviewed when Salla serves the current revision. Local fixtures do not substitute for those checks. Only the in-app browser is exposed by the available tool; Chrome is unavailable.

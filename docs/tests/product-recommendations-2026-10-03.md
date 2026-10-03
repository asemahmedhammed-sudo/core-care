# Product recommendations — 2026-10-03

## Scope

Redesigned only `.core-product-related` on product detail pages to follow the supplied compact recommendation reference. White rounded cards on a light gray section, contained images, outline wishlist, circular native cart action, optional real brand/rating/review count, sale price with validated discount, and two-line product names. Native booking, availability and option behavior remain in `salla-add-product-button`; donation and special cards retain their existing renderer. Homepage cards retain their renderer.

## Repository checks

- Production webpack build succeeded; `public/app.css` and `public/product-card.js` contain the new selectors/renderer. Existing Sass and bundle-size warnings remain.
- 32 Node tests passed, including escaping merchant brand data, missing ratings, invalid discounts, options/booking/unavailable actions, avoiding duplicate wishlist handlers, and removing an empty tools row when the cart is hidden.
- 13/13 static audit checks passed; `git diff --check` passed.

## Visual review and spacing

- Local browser fixture uses the actual product-card source and production CSS with product names/images/prices read from the visible Salla recommendation cards. Native controls are simulated, so this does not verify Salla behavior.
- Desktop 1280×800: five compact cards, 20px gaps, square contained images, cart at the left in RTL; no overlap or abnormal internal spacing observed.
- Mobile 390×844: two cards and a preview of the next, 12px gaps, 16px section padding; no horizontal document overflow or card overlap observed.
- Section padding is 20px desktop / 16px mobile. Heading-to-carousel gap is 16px. Removed Salla's native 32/80px bottom margin and card max-width from this section; `#main-content` continues to own section gaps.
- Missing brand/reviews render no placeholder row. A hidden cart plus missing rating removes the tools row entirely. The existing hydrated-empty-slider rule hides the whole section when there are no products.
- Evidence: `output/qa/product-recommendations-local-desktop.jpg`, `output/qa/product-recommendations-local-mobile.jpg` (local only).

## Actual Salla verification remains incomplete

- Used the accepted real-store development request 1094224037 for Core Care, theme 523702774, settings version 1026765166. Partners confirms repository `asemahmedhammed-sudo/core-care`, branch `main`, status under development. No demo store or marketplace publication was used.
- After pushing, opened customization through the merchant's “طلبات تطوير الثيمات” accepted request. Salla created drafts 51853346 and 785999404. Confirmed `main` in Partners and reopened the accepted customization route.
- Both fresh drafts, and a reloaded actual CALA product preview, still served `app.css?v=20261003-product-gallery-1` and zero `.core-recommendation-card` elements. Expected current asset revision: `20261003-product-recommendations-2`.
- Final check after midnight on October 4: after implementation commit `7e700a8` was successfully pushed to `main`, reopening the same accepted customization request created draft 1875201835. Its actual iframe still served `v=20261003-product-gallery-1`.
- Thus the server-side preview snapshot still exposes the prior repository version. This is observed stale preview content; the exact Salla synchronization failure is not established. A new draft URL rules out only a browser cache explanation.
- Actual screenshot: `output/qa/product-recommendations-salla-stale-desktop.jpg`. It shows the unchanged four tall cards, not the new implementation.
- Actual desktop/mobile checks of new cards, native cart/options interaction, adjacent sections, and editor hide/reorder remain pending until Salla serves the current source. Only the in-app browser was available; Chrome was unavailable through the provided browser tool.

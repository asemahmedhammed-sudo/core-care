# Homepage visual identity — 2026-10-04

## Scope and baseline

Requested: inspect the development homepage against AGENTS.md, correct differences, push main, and verify the updated development preview. Theme 523702774 is linked to asemahmedhammed-sudo/core-care, branch main, under development. The accepted Core Care preview request was used; no marketplace submission or live theme activation.

Baseline hosted draft 1432443105 served revision 20261004-product-recommendations-3. At its 398px iframe width, body used PingARLT, header was 209px high, product headings were 24px, each four-product grid was approximately 939px high, and the editorial hero approximately 820px. These measurements confirmed the source differences.

## Changes

- Semantic reference tokens, compact 18px headings, 12px card names/brands, 16px prices, pink sales, outline native cart/wishlist, 6px cards and 8px campaign corners.
- IBM Plex Sans Arabic default with real 400/500/600/700 faces through Google Fonts and font-display swap; new optional switch preserves the merchant-font fallback. Existing setting IDs remain intact. The store-color palette now preserves the configured primary action color.
- Compact desktop logo/search row, 53px mobile search row target, 59px navigation target, responsive utility actions and optional sticky navigation.
- View-all links move beside section headings. Existing secure recommendation card renderer now also serves normal homepage product sections; missing rating/brand/media releases space. Native booking/options/availability actions remain intact.
- Removed forced homepage hero ordering and invented default offer/natural/year/benefit claims. Optional editorial fields remain editable in a compact composition; empty editorial content disappears. Merchant campaign art remains necessary for identical photography/content.
- Purple support band uses actual Salla contacts; lower footer uses neutral surfaces, configured social channels/payment methods and existing legal data. Supporting text uses dark ink for contrast; review/input grays are darker than the pale reference.

## Repository checks before push

- pnpm build: passed, 9 existing webpack/Sass/size warnings, plus existing Tailwind plugin notice.
- pnpm test: 35/35 passed; static audit: 13/13 repository checks passed.
- git diff --check: passed.
- Asset sizing was measured; no Salla acceptance claim is made from those measurements.
- Expected revision: 20261004-home-identity-1 in layout and homepage script. Generated production app.css, home.js, product-card.js are included.
- Pre-existing generated app.js and static-audit changes are preserved; a dated audit copy records this verification.

## Hosted checks

Implementation b65bb36 and hosted-specific correction 86bda9d were pushed to main. Draft 567672602 served 20261004-home-identity-1: mobile 390px, IBM Plex Sans Arabic, 18px headings, compact cards, purple support band and 24px section gaps, no page overflow. Initial navigation was still 68px and cart SVG filled because of inherited production CSS; 86bda9d corrects these to 59px / outline. Subsequent drafts 466355532 and 559537499 continued to serve the older identity-1 assets, so those corrections have not been confirmed hosted. The Partners login expired. The user's following request replaces the split promotion fallback with full-image slides; its source revision is 20261004-full-image-slider-2, with verification recorded in full-image-slider-2026-10-04.md. Platform verification remains incomplete; no whole-theme parity or release-readiness claim.

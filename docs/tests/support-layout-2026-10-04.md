# Footer support layout — 2026-10-04

## Change

The Salla contact list wraps each contact in a separate div. The previous flex styling left those wrappers full-width, stacking all links beside a large unused area. The support band now places its introduction beside an adaptive grid of white contact cards on desktop and stacks introduction/cards on mobile. Existing Salla contacts, destinations, icons and merchant configuration are preserved. No new setting, dependency or contact data.

Cards use 20px native icons in 36px pale-purple circles, readable dark text, isolated LTR contact values, wrapping for long email addresses, hover and keyboard focus. The purple identity remains. Heights follow content, with minimum touch targets; missing contacts do not create cards and an empty contact component releases the second column. Styles are scoped to the footer support band.

## Repository verification

A clean temporary checkout of eadc74d plus the three changed source files was used to keep unrelated working changes out of generated assets. Production build passed with nine existing webpack/Sass/size warnings; 37/37 tests and 13/13 static checks passed. Generated app.css inspected; dated audit is docs/evidence/technical/support-layout-audit-2026-10-04.json. Pre-existing dirty app.js and static-audit.json preserved. No hand edits to public assets.

Expected hosted stylesheet revision: 20261004-support-layout-2. Hosted review results are recorded below; no release-readiness claim.

Initial hosted review revealed a three-column contact row with the fourth card alone. The minimum adaptive column width was increased to 320px and the stacked introduction breakpoint moved to 1023px, giving a balanced two-by-two desktop grid and one column on narrow phones. Final clean-checkout build and tests were repeated and passed with the same warnings/results.

## Hosted development verification

Source 473c75f was pushed to origin/main and synchronized with the official Salla preview workflow. The original accepted Core Care development request produced draft 2077584874. Actual app.css now carries 20261004-support-layout-2 and Twig renders the new support-intro/layout. Hosted verification was performed after stopping the temporary CLI server; there are no localhost script/style references.

Browser: Codex in-app browser. Chrome was unavailable, so the required Chrome platform review remains incomplete. Initial viewport changes affected the editor tab instead of the background standalone tab; a visible standalone preview resolved this. All sizes below were measured in the rendered document, not inferred from requested viewport settings.

| Viewport | Contact columns / card width | Band height | Overflow | Gap before / to lower-footer heading |
| --- | --- | --- | --- | --- |
| 1280 × 720 | 2 / 391.34px | 196px | None | 32px / 24px |
| 1440 × 900 | 2 / 444.67px | 196px | None | 36px / 24px |
| 390 × 844 | 1 / 358px | 378px | None | 24px / 24px |
| 320 × 844 | 1 / 288px | 378px | None | Narrow-width geometry checked |

Four contacts are preserved. Desktop cards are 64px high; mobile cards are 58px high with 36px icon circles. Title-to-copy spacing is 8px; mobile copy-to-cards spacing is 16px and card gaps 8px. The header, preceding product section and lower footer were reviewed with the support band at desktop/mobile sizes. No abnormal empty band space, overlap or clipped contact value was observed at 1440/390px. Keyboard Tab moves between contacts with a 2px focus outline and 3px offset. No call, WhatsApp chat or email was sent; contact destinations remain supplied by Salla.

Screenshots:
- docs/evidence/visual/support-layout-salla-desktop-2026-10-04.jpg (1280px)
- docs/evidence/visual/support-layout-salla-desktop-1440-2026-10-04.jpg
- docs/evidence/visual/support-layout-salla-mobile-390-2026-10-04.jpg

Remaining coverage: hosted Chrome, English/LTR storefront, merchant configurations with no/one contact, unusually long values and other storefront routes were not exercised. CSS handles absent cards, wrapping and logical direction, but those configurations still need platform checks. Merchant settings and live theme activation were not changed. This report verifies the requested development footer appearance; it does not certify whole-theme parity or release readiness.

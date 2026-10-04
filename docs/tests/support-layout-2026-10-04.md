# Footer support layout — 2026-10-04

## Change

The Salla contact list wraps each contact in a separate div. The previous flex styling left those wrappers full-width, stacking all links beside a large unused area. The support band now places its introduction beside an adaptive grid of white contact cards on desktop and stacks introduction/cards on mobile. Existing Salla contacts, destinations, icons and merchant configuration are preserved. No new setting, dependency or contact data.

Cards use 20px native icons in 36px pale-purple circles, readable dark text, isolated LTR contact values, wrapping for long email addresses, hover and keyboard focus. The purple identity remains. Heights follow content, with minimum touch targets; missing contacts do not create cards and an empty contact component releases the second column. Styles are scoped to the footer support band.

## Repository verification

A clean temporary checkout of eadc74d plus the three changed source files was used to keep unrelated working changes out of generated assets. Production build passed with nine existing webpack/Sass/size warnings; 37/37 tests and 13/13 static checks passed. Generated app.css inspected; dated audit is docs/evidence/technical/support-layout-audit-2026-10-04.json. Pre-existing dirty app.js and static-audit.json preserved. No hand edits to public assets.

Expected hosted stylesheet revision: 20261004-support-layout-2. Platform desktop/mobile review pending synchronization; no release-readiness claim.

Initial hosted review revealed a three-column contact row with the fourth card alone. The minimum adaptive column width was increased to 320px and the stacked introduction breakpoint moved to 1023px, giving a balanced two-by-two desktop grid and one column on narrow phones. Final clean-checkout build and tests were repeated and passed with the same warnings/results.

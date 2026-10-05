# Pagination at the top of the promotional artwork — 2026-10-05

## Change

Follow-up to the user's screenshot and explicit answer: pagination belongs **inside the top of the image**, centered. This supersedes the earlier requirement to place it below the image. Base revision: `0acf0c7`; local working-tree edits. Asset revision: `20261005-promo-top-pagination-1`.

Changed `src/assets/styles/06-beauty/core-care-home.scss`: dots share the artwork's first grid row, align to its top with an 8px inset, and stay centered in the middle column. Optional headline/CTA content remains in row two and cannot displace the dots. The former pagination row below the artwork no longer reserves height. Arrow positions, image ratios, controller behavior, slide order and merchant settings are preserved.

Retained the merchant's action/brand accent. Its observed white value explained the weak active indicator in the supplied screenshot. The active pill now has a 1px dark ring and a 2px white outer ring, and inactive dots have a thin light ring, so their shapes remain visible on light/dark artwork. No large background panel. Keyboard focus uses a contrasting white outline with a dark inner edge. All hit areas stay 44×44px; hover/motion handling remains unchanged.

Updated CSS/script asset revisions in `src/views/layouts/master.twig` and `src/views/pages/index.twig`, and the current merchant guide. Generated `public/app.css` through Webpack. No new settings, field types, migration, dependency or media asset. Preserved pre-existing changes to generated product.js, shared reports and unrelated evidence. Historical slider verification records were left unchanged.

## Repository verification — passed

- `pnpm build`: passed, 9 existing Sass deprecation/Webpack performance warnings, plus the existing Tailwind line-clamp notice. Large CSS, legacy hero JPEG and app entrypoint warnings remain.
- `pnpm test`: 52 passed, zero failed; 13/13 static audit checks passed. Existing tests cover dynamic counts, single/empty slides, both directions, swipes, keyboard, control event isolation, wrapping and focus recovery.
- `git diff --check`: passed. Git also warned about an existing CRLF file in historical policy evidence; that file was not edited.
- Generated CSS inspected: pagination uses `grid-area: 1/2/2/3`, top alignment, 8px inset and z-index 2; active indicator/focus rings are present. No hand edits to public assets.
- Audit differences inspected: environment timestamp/root and modified-template hashes; all audit results retained.
- Build/source hashes and measurements: `docs/evidence/technical/promo-top-pagination-2026-10-05.json`.

## Local browser verification — passed within fixture scope

Browser: Codex in-app browser. Standalone fixtures use production app.css/home.js and synthetic neighboring content. They do not establish Salla runtime or merchant-setting persistence. Paths: `output/qa/promo-top-{rtl,ltr}-{1,2,3}-{default,optional}-2026-10-05.html` and `output/qa/promo-top-rtl-white-2026-10-05.html`.

Three-slide default layouts measured in RTL and LTR:

| Width | Dots top inset | Center offset | Gap from artwork to next heading | Overflow |
| --- | --- | --- | --- | --- |
| 360 | 8px | 0px | 24px | None |
| 375 | 8px | 0px | 24px | None |
| 390 | 8px | 0px | 24px | None |
| 768 | 8px | 0px | 24px | None |
| 1440 | 8px | 0px | 36px | None |

The three-dot group is 132×44px, with no visible group background. All controls remain 44×44px. At 390px, the white-brand fixture showed the active white pill with computed dark/white rings. Screenshot reviewed in the browser tool output: dots sit over the upper artwork without a separate bottom navigation strip. No new screenshot file was saved.

One/two/three-slide fixtures with optional title/CTA passed at 360, 390 and 1440px in both directions: top inset stayed 8px despite copy, no horizontal overflow, 24px mobile / 36px desktop copy-to-next-heading gap. Single slide hid all navigation and created zero dots. The synthetic optional-mobile picture uses an existing square image to exercise differing proportions.

Button/keyboard checks in both directions: Next 1→2, dot→3, Next wrap 3→1, then RTL ArrowLeft / LTR ArrowRight →2. Keyboard focus on a dot computed to a white 2px outline. No console errors/warnings in the final fixture. Physical touch and OS reduced-motion preference remain untested; existing controller tests and CSS provide partial evidence only.

## Salla verification and publication readiness — incomplete

Current official CLI preview attempt failed with DNS `ENOTFOUND api.salla.dev`. The network-enabled retry was rejected by automatic approval review because this CLI has previously requested committing and remotely pushing the working tree, whereas the current request authorizes local changes/verification. The rejected command was `salla theme preview --only-link --without-editor`; it did not run. No bypass, remote push, live-store edit or publication was attempted. Additional user authorization is required to retry the CLI preview through network access; any commit/push remains separately unauthorized.

Implementation/local checks passed. Updated real Salla assets, Chrome desktop/mobile review, real merchant art/colors/fonts and hidden/reordered/editor configurations remain unverified. A user screenshot does not identify which draft/build produced it. Publication readiness is incomplete.

## Follow-up: authorized main upload

The user subsequently authorized uploading this change to `main`. Fetched `origin/main` and confirmed it matches local HEAD before preparing the commit. All five recorded source/production-asset hashes still match the verified build; `git diff --check` passed for the upload. This upload includes only the pagination SCSS, production CSS, asset revision references, merchant-guide update and this change's dated verification records. Existing shared audit/size-report/product.js changes and unrelated evidence remain outside the commit. Local HTML fixtures remain local verification artifacts. Remote upload does not complete Salla platform verification or authorize live publication.

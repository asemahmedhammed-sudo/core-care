# Returns policy page — 2026-10-07

## Scope

Redesign of the Core Care returns/exchange information page (`pages.partials.return-policy`), activation fallback in `page-single.twig`, and removal of the homepage-only announcement override so header chrome is identical on all pages.

## Working-tree state

`main` at `390d353` plus uncommitted changes in: `src/views/pages/page-single.twig`, `src/views/pages/partials/return-policy.twig`, `src/assets/styles/06-beauty/core-care-policy.scss`, `src/assets/styles/06-beauty/beauty.scss`, `src/assets/styles/06-beauty/core-care-palette.scss`, `src/locales/ar.json`, `src/locales/en.json`, `twilight.json`, `docs/MERCHANT_GUIDE.md`, regenerated `public/`. Pre-existing uncommitted evidence/assets preserved.

## Repository checks

- `pnpm build`: passed (webpack reports 9 warnings; not compared against a baseline build).
- `pnpm test`: 66/66 passed; static audit 13/13 (`docs/evidence/technical/static-audit.json` regenerated).

## Local static layout review (not Salla)

Environment: built `public/app.css` served by a local static server; partial hand-rendered with locale defaults into `output/qa/return-policy-local-{rtl,ltr}-2026-10-07.html` (placeholder contact values, no Salla components, header/footer absent). Browser: Claude desktop in-app browser (Chromium), not Chrome.

| Viewport | Result |
|---|---|
| 1440 RTL/LTR | 3 summary cards in one row; eligible/exclusions side by side; 16px grid gap; scrollWidth = viewport |
| 390 RTL | Cards stacked (8px gap), sections 12px apart, scrollWidth = viewport |
| 360 RTL/LTR | scrollWidth = viewport, no element outside viewport; FAQ summaries 52px, contact links 44px high |

- Accordion: Tab focuses first summary with a 2px solid outline; Enter opens, Space closes (native `<details>`).
- Found and fixed: PostCSS converted `inset-inline-start`/`border-inline-start` to physical left in RTL; bullets now use flex order and the notice accent has an explicit RTL rule.

## Untested / incomplete

- **Salla platform verification: incomplete.** The development preview returned an empty document on 2026-10-06 (`real-store-development-preview-2026-10-06.md`); header/footer parity, `salla-breadcrumb`, real `store.contacts`, page ID/title fallback, and the announcement change were not observed on Salla.
- Wallet/Qitaf/Al Rajhi availability could not be verified from repository configuration.

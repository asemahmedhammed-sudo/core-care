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

## Salla development preview — follow-up (same day)

- Commit `1cfa5a0` (pushed): the editor at `draft-439356259` showed nothing. Its preview session served revision `20261007-return-policy-1` for home/cart/brands, but page `1741544897` returned HTTP 200 with only `<!-- Error In This View! (The use of "import" is disabled in "pages.partials.return-policy" ...) -->`. Salla's renderer disables `import`, so the macro-based partial cannot render. (The pre-existing partial had the same `import`; it had never been rendered on Salla because no page ID was configured.)
- Fix `b58aa6d` (pushed): removed `import`/macros, `matches` and `striptags`; uses only constructs already rendered on Salla (literal-array `for`, string `in`, `starts with`, `replace`).
- Old drafts kept the pre-fix snapshot. Merchant dashboard → إدارة الثيمات → طلبات تطوير الثيمات → (approved request) → تخصيص الثيم opened `draft-1778769010`, whose preview serves the fix.
- Native Chrome (Claude in Chrome), page `1741544897`, RTL:
  - 1512px: new header (`core-care-header__top`), policy article with 3 cards, 5 blocks, 7 FAQ items, 3 contact links from store contacts; article end → footer 37px; scrollWidth = viewport.
  - 390px and 360px (same-origin iframe inside the preview; Chrome window cannot go below 1440px): single-column grid, cards full width, scrollWidth = viewport, no element outside viewport, FAQ summaries 52px, contact links 44px.
- Observed: "آخر تحديث: 29/09/2024" still shows because this draft has a saved value in `beauty_policy_updated`; the merchant setting was not changed.
- Not exercised on Salla: LTR, accordion keyboard interaction (verified locally only), announcement bar (none configured in this store), wallet-programs toggle.

## Editability follow-up

- Salla editor, information-pages view for page `1741544897`: page sections offer only «محرر النصوص»; «إضافة عنصر جديد» states elements can be added only to customised pages. That view's iframe loads the live storefront domain (`salla.sa/corecare/...`), so it renders the published theme, not the development theme — the source of the differing header/footer seen there.
- Change: the policy design now renders the page's own editor content (`page.content`, same inherited output as the default page body) under the summary cards, and Salla's `information_page.information_page` hook for customised pages. All fixed design texts (description, three cards, exclusions, refund methods, contact copy) became multilanguage theme settings (18 new IDs, no existing IDs changed). Every multilanguage value is resolved per language before string filters, matching the promotions fix (Salla returns them as arrays).
- `public/app.css` was built in a separate worktree containing only this change, because the working tree has unrelated uncommitted recommendation-card SCSS edits.
- Repository: build passed (9 warnings), tests 66/66, static audit 13/13. Salla rendering of this revision: pending re-check.

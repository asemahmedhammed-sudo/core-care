# Phone footer: language button removed — 2026-10-26

## Change

On phones (below 768px, with the tab bar) the footer no longer shows the «اللغة» / «اللغة والعملة» button above the copyright line. The owner asked for it to go because the account sheet («حسابي») already has the same row. The account sheet's row still opens the header's language panel or Salla's currency window (`core-care-tabbar.js`). Tablets and desktop never showed the button, so they are unchanged.

- Source revision: `0ecb7ae` on `feature/bilingual-images`, pushed to GitHub.
- Files: `src/views/components/footer/footer.twig`, `src/assets/styles/06-beauty/core-care-app-nav.scss`, `src/assets/styles/06-beauty/core-care-footer.scss`, `src/assets/js/partials/core-care-tabbar.js` (comment only), `scripts/mobile-app-nav.test.mjs`, `public/app.css`.
- Merchant settings: none changed.

## Repository checks

| Check | Result |
|---|---|
| `pnpm build` | Passed. Warnings: existing Sass `@import` deprecations and bundle size only |
| `pnpm test` | Passed, 129/129 |
| `public/app.css` | No `core-care-footer__localization` rule left |

## Pushed assets (not a rendered page)

- `cdn.jsdelivr.net/gh/asemahmedhammed-sudo/core-care@0ecb7ae…/public/app.css`: 0 matches for `core-care-footer__localization` (the previous commit `6f359ea` has 1).
- The same commit's `footer.twig` has no `data-cc-localization-open`; `mobile-account.twig` still has it once (the account sheet's row).

## Salla development preview: incomplete

- `yes n | salla theme preview -s "Core Care" -o -E` (CLI 3.2.63) created draft `draft-694219614`. Every prompt was answered "no"; the CLI made no commit. Its watcher processes were stopped and `pnpm build` restored `public/`.
- `salla.design/themes/draft/694219614/app.css` returned 404 (no hosted assets), so the draft was opened with `assets_url` set to the jsDelivr copy of the pushed commit.
- Claude in Chrome opened the theme editor for the draft. Its accessibility tree showed the editor shell («ثيم كوركير - تطوير», unpublished). JavaScript and screenshots were refused with "Host access is restricted by policy", and the storefront frame was not exposed. The footer was not seen rendered.

## Not tested

- The rendered footer at 390px and 320px (RTL and LTR), and the gap between the last footer block and the copyright line once the button is gone.
- Opening language/currency from the account sheet on Salla.
- Public storefront: it runs a published Core Care version until the owner publishes a new one.

## How the owner can check

Open `s.salla.sa/design/draft-694219614?legacy=0&with_editor=false&assets_url=https://cdn.jsdelivr.net/gh/asemahmedhammed-sudo/core-care@0ecb7aeee703d04fe7d3f4a0f34178c9d787ccfd/public`, switch to phone width, and scroll to the bottom: only the copyright line should remain under the footer.

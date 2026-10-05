# Return/exchange policy — 2026-10-05

## Source and build

- Initial verification used the working tree based on `cb527196c304974d8fbf03cbec1b168ebce0d796` (`main`), with unrelated pre-existing edits/evidence preserved. No commit or remote push had been performed at that stage.
- Source: `src/views/pages/page-single.twig`, `src/views/pages/partials/return-policy.twig`, `src/assets/styles/06-beauty/core-care-policy.scss`, stylesheet entry, aligned AR/EN locales, additive `beauty_policy_*` settings, merchant guide.
- Final production build: `pnpm build`, passed; Webpack reports 9 warnings (existing Sass import deprecations and bundle performance warnings). The development watcher was stopped and production output rebuilt before handoff.
- `public/app.css` SHA-256: `6f44374bfee38a04a77425d88cb33ea24e04250f10bdb8af0788304dc25f6580`.
- `page-single.twig` SHA-256: `5aa9a581b3c4dbe21bd12cc93e8ae8f92b17820129bd54630057eff3953a879d`.
- `return-policy.twig` SHA-256: `c0f1d0716d11a49abdfb49292c5eee76aab6775e8437988c0697019fcf928fa4`.
- `pnpm test`: 54 passed, 0 failed; 13/13 repository audit checks passed, platform tests pending.
- `pnpm size:theme`: passed, report regenerated. `git diff --check`: passed.
- Generated assets were produced by Webpack. Pre-existing `public/product.js` modifications remain; this task did not edit its source. Other concurrent source/evidence work was not reverted.

## Content and compatibility

The supplied text is adapted to Core Care with the original 29/09/2024 date, 19 SAR fee, 7-day damaged-product period, and 10-working-day processing text. Nice One contact number and license are excluded. Contacts use the existing store footer. Qitaf/Rajhi/temporary-credit clauses remain editable but are hidden by default until applicable; the license section requires a valid HTTPS merchant license URL.

Existing setting IDs and field types are unchanged. The merchant explicitly selects a numeric page ID; only that page uses the policy layout, including when it is a customized page. Unselected customized pages retain the platform hook. Stored page content/components are not deleted; clearing the setting restores the original page behavior. New fields have not been accepted/saved through the Salla editor yet.

## Local visual and interaction checks (partial evidence only)

- Environment: real policy Twig source rendered by isolated Twig.js 1.17.1 with stub layout/hooks and actual built CSS; Codex in-app browser. This does **not** verify Salla Twig/runtime or platform contacts.
- Fixtures: default, optional-wallet/license, and long-text variants in Arabic RTL and English LTR. Measurements cover 320, 390, 768, 1024, 1440 widths. There are 30 recorded measurements; two Arabic variant runs had repeated viewport measurements, so the file must not be interpreted as 30 unique viewport/variant combinations.
- No horizontal overflow in recorded cases. Heading-to-content 12px; visible section content gaps 58px mobile and 74px desktop; final content to placeholder support footer 65–77px. Minimum interactive target measured 44px. Optional sections release their space. Sidebar switches sides in RTL/LTR and becomes wrapping links on mobile.
- Enter opens a native question and Space closes it; visible keyboard focus. Long unbroken text expanded at 320px does not overflow. Anchor hashes change correctly; smooth-scroll/viewport visibility is not signed off as a Salla result.
- Twig rendering assertions passed: exact page selection, customized hook preservation on other pages, escaped text, safe/unsafe URL cases, optional sections, empty date, aligned AR/EN fixtures.
- Measurement file: `docs/evidence/technical/return-policy-local-layout-2026-10-05.json`.
- Local screenshots inspected: `output/qa/return-policy-ar-mobile-2026-10-05.jpg` (390×844), `output/qa/return-policy-ar-desktop-2026-10-05.jpg` (1280×720). The full-page desktop capture is shifted by the browser surface and is not acceptance evidence.
- Reproducible renderer: `output/qa/return-policy-render-2026-10-05.cjs` (requires isolated Twig.js, no repository dependency change).

## Salla development workflow and exact limitation

- Native Chrome was available for the existing Salla editor. Its header identifies the theme as development/unpublished and its page selector as experimental. A new page named `سياسة الاستبدال والاسترجاع` was created, ID `1741544897`, with footer-link display off.
- Page status was briefly changed to published while attempting to load its preview. The iframe then showed the canonical storefront domain rather than proving a development-only policy preview; the status was immediately returned to **draft**. Final state is confirmed by the menu offering “تحويل إلى منشور” with “زيارة الصفحة” disabled. Do not publish this shared store page as part of theme verification without checking its environment.
- Saved creation/draft proof: `output/qa/return-policy-salla-draft-2026-10-05.png`. The surrounding homepage in this image is not the new policy design.
- Official CLI 3.2.56 preview was started for the authorized `Core Care` development store. The CLI commit/push prompt was declined. No Git mutation was authorized or performed. The CLI consequently warned that changed Twig/JSON files would not be in its baseline preview.
- Official `salla theme sync --help` and installed CLI source were inspected before syncing the policy partial, page template, AR/EN locales, and manifest to the development preview draft. Twig/locales each returned `حصل خطأ غير متوقع!`; manifest upload returned `The path field is required.` for its root path. A successful CLI exit code did not establish upload success.
- No updated policy template or settings were verified in Salla. The page ID setting remains to be saved after the updated theme definition arrives. The created remote draft currently holds the title/page record; the new policy content/layout resides in source files and local fixtures.
- Development preview/watch was stopped; production assets restored. Private preview URLs/tokens are not included in this record.

## Status and remaining checks

- Local implementation: **implemented**.
- Repository checks: **passed**, with the warnings above.
- Actual Salla desktop/mobile policy review in Chrome: **incomplete**; updated template/settings were not served.
- Merchant settings save/reload, real breadcrumbs/contact anchors, AR/EN runtime translation, actual header/footer spacing, hidden/editor states and reordering: **untested on Salla**.
- Publication readiness: **incomplete**, no theme publication/review submission performed.
- User authorized the focused policy commit/remote push to `main` on 2026-10-05 by saying `ارفع التعديلات`. This authorizes delivering the changes to the development repository; it does not establish platform verification or authorize publication on the live store.
- The push includes the policy source, generated `public/app.css`, merchant guide, and policy-specific verification record/measurements. Existing `public/home.js`, `public/product.js`, shared audit/size reports, unrelated records, and unrelated screenshots are excluded. CSS AST comparison found 52 added rules, no removed rules: scoped policy rules plus the generated `.contents` utility.
- After the updated theme definition arrives, select the intended development page and perform actual platform review before release claims.

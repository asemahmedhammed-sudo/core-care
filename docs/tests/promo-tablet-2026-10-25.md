# Promotions slider on portrait tablets — 2026-10-25

## Change

`src/assets/styles/06-beauty/core-care-home.scss`: between 768 and 1023px, with the mobile tab bar on (`body.cc-has-tabbar`), «سلايدر العروض الرئيسي» uses the phone presentation (edge to edge, no corners, no arrows, dots below) to match the compact app header. It keeps the 3:1 desktop artwork; the mobile image and «بانر طويل» stay below 768px. From 1024px, and with the tab bar off, nothing changes.

Cause: the header switches to the app header below 1024px (`core-care-app-nav.scss`), the slider frame switched below 768px, so 768–1023px mixed the two.

## State

- Working tree on `feature/bilingual-images` (HEAD `ef047cb`), uncommitted. Unrelated owner edits to the product card were left untouched.
- Store settings read (read-only, Salla MCP): active version «Core Care» `62497446`, slider `1403674054` with `mobile_tall` on and square mobile images on all three slides.

## Repository checks

- `pnpm build`: passed (9 existing size warnings).
- `pnpm test`: 123/123 passed; static audit 13/13.
- Generated `public/app.css` contains the `@media (min-width:768px) and (max-width:1023px)` rule scoped to `body.theme-beauty.beauty-reference-home.cc-has-tabbar`.

## Local render (not Salla)

Static harness with the built `app.css` and the slider markup, built-in browser, RTL:

| Viewport | Tab bar | Frame | Corners | Arrows | Image |
|---|---|---|---|---|---|
| 767px | on | 767×767 (square) | — | hidden | mobile |
| 972px | on | 972×324, edge to edge | 0 | hidden | desktop |
| 900px | off | 869×290, side gutter | 12px | shown | desktop |
| 1024px | on | 989×330, side gutter | 12px | shown | desktop |

No horizontal overflow at 972px. Dots sit directly under the artwork.

## Salla development preview

- Commit `037b57b` pushed to `feature/bilingual-images`, then `yes n | salla theme preview -s "Core Care" -o -E` (CLI 3.2.63). Draft `draft-526918281` («ثيم كوركير - تطوير», unpublished). CLI and its webpack watcher stopped; `pnpm build` restored production `public/`.
- Hosted draft asset `salla.design/themes/draft/526918281/app.css`: HTTP 200, 394,749 bytes, identical in size to the commit's `public/app.css` on jsDelivr, and contains the new tablet rule. So the draft serves this change.
- Claude in Chrome opened the draft editor (the page list shows «سلايدر العروض الرئيسي» first), but screenshots and JavaScript failed with "Host access is restricted by policy", as on 2026-10-24. The storefront frame's signed `watch` URL is not exposed in the accessibility tree, so the rendered page could not be opened or measured.

## Not verified

- Rendered draft at 1440, 972 and 390px: header alignment, neighbouring sections, LTR. Blocked by the Chrome host policy on `s.salla.sa`. **Platform visual verification: incomplete.**

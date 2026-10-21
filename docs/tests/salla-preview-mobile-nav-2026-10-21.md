# Salla preview: mobile tab bar and compact header — 2026-10-20/21

Follows [salla-preview-attempt-2026-10-20.md](salla-preview-attempt-2026-10-20.md). Records the first real Salla platform check of the mobile navigation work.

## Identity

- Branch `feature/bilingual-images`, pushed with the owner's authorization. First run used `7745d5c`; re-verification used `413c4e5`, which contains the fixes below. `main` is unchanged (`193f96b`). Nothing was published, and no store setting was changed.
- `salla theme preview -s "Core Care" -o -E` (CLI 3.2.63) created development draft `484719850` on the Partners development store (`salla.design/dev-…`; the private URL and token are not recorded).
- Page identity in the preview: `body` has `theme-beauty`, `cc-has-tabbar` and `salla-draft-484719850`, with no `theme-raed`. The viewport meta includes `viewport-fit=cover`. The asset revision is `20261020-mobile-app-nav-1`. **This confirms the new Twig templates are served.**
- Browser: the owner's **Comet** (Chromium 154) via Claude in Chrome. Not Google Chrome.

## Asset delivery: platform and tooling limits found

1. The Claude built-in browser stopped at a failed Cloudflare check and the Salla sign-in page. Neither was attempted.
2. In Comet, the local CLI asset server (`localhost:8000`) never answers the `OPTIONS` preflight that Chromium sends from a public page to localhost (a `curl` OPTIONS request timed out after 5 s). A local scratch proxy that answers the preflight did not help either: the page's `loopback-network` permission stayed `denied` even after the owner changed site settings.
3. Workaround used: `assets_url` pointed at the **pushed commit's production build** through jsDelivr (`cdn.jsdelivr.net/gh/<repo>@<commit>/public`). Its `app.css` is byte-identical to `git show <commit>:public/app.css` (352,757 bytes for `7745d5c`). The assets were therefore the committed production build, served over HTTPS.

## Results (frames of exact width inside the preview page, same origin)

| Viewport | Result |
|---|---|
| 320, 360, 390, 430 | Compact grid header 62px (this store has no scopes, so no location row): search, categories grid icon, currency, bell, each 44×44. Tab bar with 4 items. Item links are 60px tall; inside the cart link the content box is 52px and centred. Header cart and account are hidden. Body padding-bottom 60px. No horizontal overflow. The header sticks at top 0 after scrolling. |
| 390 categories | The tab bar button opens the real `core-care-categories` sheet with 5 live categories, from 0 to 700px above the bar. Page scroll is locked, focus moves to the first tab, and both triggers report `aria-expanded="true"`. Only «الأقسام» is highlighted. Escape closes the sheet, returns focus to the tab bar and unlocks scrolling. |
| 390 cart | The tab bar cart opens the side cart drawer (z-index 60, full width) and stays on the page. The empty cart has `data-empty`, so no "0" badge shows. |
| 390 account (guest) | Opens Salla's login sheet. No data was entered. |
| 768, 834 | Compact header with the 120×42 logo beside the search. Tab list centred, items 160px wide. No overflow. |
| 1024, 1502 | Original desktop header (`display: contents`), account and cart in the header, original menu icon with «جميع الأقسام», no tab bar, body padding 0. |

## Defects found live and fixed (`413c4e5`)

1. **Search covered the icons below about 390px.** `salla-search`'s `.s-search-placeholder-wrapper` has `min-width: 220px`. At 320px it spanned 88–308 and covered the categories icon (108–152). Fix: the wrapper, input wrapper and input follow the grid cell (`min-width: 0; width: 100%`). After the fix the search spans 156–308 at 320px and 156–348 at 360px.
2. **The old menu glyph showed beside the new grid icon.** The inherited `#mainnav .sicon-menu { display: inline-block }` outranked the class-level hide. Fix: `#mainnav [data-categories-toggle] .sicon-menu { display: none; }` inside the compact header.

The local static harness missed both because it had no real `salla-search` CSS and no icon font. Both fixes sit inside `max-width: 1023px`. The desktop-parity test still passes, and the live 1024px check still shows the original menu icon.

Re-verification with `413c4e5` assets, without any injected CSS, at 320, 360, 390, 430 and 768: no search/icon overlap, old menu glyph `display: none`, no overflow. At 1024: desktop header unchanged.

Repository checks for `413c4e5`: `pnpm build` passed (baseline 9 warnings), `pnpm test` 107/107, static audit 13/13. The development preview's watcher had rewritten `public/`; it was stopped and `public/` was restored with a production build before the commit.

## Not verified

- **Hero pagination:** this development store's home page has no promotions slider, so it was not tested on Salla.
- **English / LTR:** this store is not multilingual (it shows a currency control, not a language one).
- **Location row:** this store has no Salla scopes.
- **Product page with the sticky add-to-cart bar, the on-screen keyboard, real iPhone safe areas, and landscape phones:** not tested on Salla. The width checks used frames inside a desktop browser, not device emulation or hardware.
- **Not tested in Google Chrome, nor on the real store `corecare-sa.com`:** its active version «Core Care» is unchanged until the owner publishes.

## Outcome

- Implementation: **complete** for phases 0–1, including the two live fixes.
- Repository checks: **passed**.
- Salla platform verification: **partially completed**. Arabic phone, tablet and desktop layout and behaviour were verified on the development draft. The items listed above remain open.
- Publication readiness: **not established**.

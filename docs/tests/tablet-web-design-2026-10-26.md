# Tablets get the web design from 768px — 2026-10-26

Supersedes the tablet slider change recorded in `promo-tablet-2026-10-25.md`; the owner rejected that phone-style banner on tablets.

## Reference

Nice One Arabic storefront (`niceonesa.com/ar`), Claude's built-in browser, 2026-10-26:

| Viewport | Header | Main banner |
|---|---|---|
| 767px | App header over a tall edge-to-edge banner | Edge to edge, no arrows |
| 768px | Full web header (logo, search, navigation row) | 738×185 (4:1), 6px radius, arrows |
| 972px | Full web header | 744×187 (4:1) inside the 768px container, arrows |

## Change

- App mode (bottom tab bar, compact header, «حسابي» screen, compact categories sheet, phone search additions, barcode button) now applies below **768px** instead of 1024px: `core-care-app-nav.scss`, `core-care-account.scss`, `beauty.scss` tokens, `core-care-categories.js`, `core-care-search-sheet.js`, `core-care-account.js`. The portrait-tablet header block in `core-care-app-nav.scss` was removed.
- `core-care-home.scss`: the 2026-10-25 tablet slider rule is gone; the bar pagination is phones only; between 768 and 1023px the banner keeps the desktop design within the 768px page container and gutter (`max-width: calc(768px - 2 * var(--cc-gutter))`).
- `twilight.json`: label/description text of `beauty_mobile_tabbar` and `beauty_search_brands` now say phones/below 768px. No IDs, types or defaults changed.
- Merchant guide and tests updated; new regression assertions keep tablets out of app mode.

## Repository checks

- `pnpm build`: passed (9 existing size warnings). `pnpm test`: 123/123; static audit 13/13.
- `public/app.css`: no `max-width:1023px` rule left for the tab bar or account screen; tablet banner rule present.
- `public/main-menu.js`: differs from HEAD only by the three media queries (`max-width: 767px` twice, `min-width: 768px`).

## Local render (not Salla)

Static harness with the built `app.css`, slider markup (tall-banner option on, as in the store), a tab bar element and a `.container` probe; built-in browser, RTL:

| Viewport | Tab bar | Banner (left–right, height) | Page content | Corners | Arrows | Image |
|---|---|---|---|---|---|---|
| 390px | shown | 0–390, 390 (square) | — | 0 | hidden | mobile |
| 768px | hidden | 13.1–754.9, 247 | 13.1–754.9 | 12px | shown | desktop |
| 972px | hidden | 118.5–853.5, 245 | 118.5–853.5 | 12px | shown | desktop |
| 1440px | hidden | 24–1416, 464 | — | 12px | shown | desktop |

No horizontal overflow. Pagination sits inside the artwork from 768px.

## Not verified

- The real header at 768–1023px in the Salla preview (navigation row with categories, brands, language, account, bell, cart): the harness has no header markup. Crowding of the actions row at 768px is the main risk.
- Categories dropdown, account menu and search on tablets in the preview; LTR; the real store's content.
- **Platform visual verification: pending** (Claude's Chrome access to `s.salla.sa` is blocked by policy; needs the owner's check).

# Mobile tab bar and compact header (phases 0 and 1) — 2026-10-20

Plan: [docs/mobile-app-parity-plan-2026-10-20.md](../mobile-app-parity-plan-2026-10-20.md). Applies the owner-approved recommendations: the app layout runs below 1024px, the centre campaign slot is optional and merchant-controlled, and the location row shows only when Salla scopes exist.

## Changes

| Area | Files | Change |
|---|---|---|
| Phase 0: safe areas | `layouts/master.twig`, `06-beauty/beauty.scss` | Added `viewport-fit=cover`. Added mobile tokens (`--cc-app-nav-height`, `--cc-tabbar-offset`, z-index order header 30 < categories 45 < tab bar 50 < drawers/sheets 60+). Body keeps landscape content inside the left/right safe areas. Bumped `theme_asset_revision` to `20261020-mobile-app-nav-1`. |
| Tab bar | `pages/partials/mobile-tabbar.twig` (new), `06-beauty/core-care-app-nav.scss` (new), `js/partials/core-care-tabbar.js` (new) | Home, Categories, optional campaign, Cart (`salla-cart-summary`, opens the cart drawer), Account (profile for customers, `login::open` for guests). Fixed bottom bar with safe-area padding. Active state uses a filled icon and a heavier label. The cart badge hides at zero. The bar steps aside on phone product pages with the sticky add-to-cart bar, and while a field has focus. The WhatsApp button moves above the bar. |
| Compact header | `components/header/header.twig`, `core-care-app-nav.scss`, `core-care-header.scss`, `core-care-palette.scss` | Below 1024px the header is one sticky grid: optional location row, then search, categories (grid icon), language, notifications. Account and cart move to the tab bar. Portrait tablets show the logo beside the search. The announcement strip moved outside `<header>`, so it scrolls away, and its selector was updated. Short landscape screens unstick the header. |
| Categories | `js/partials/core-care-categories.js` | Accepts several `[data-categories-toggle]` triggers and keeps `aria-expanded` in sync. Focus returns to the trigger that was used. Below 1024px the panel is a full-screen sheet above the tab bar, with scroll locked. |
| Add-to-cart animation | `js/app.js` | Flies to the visible cart summary instead of the hidden header cart. |
| Settings | `twilight.json` | New fields only: `beauty_mobile_tabbar` (default on), `beauty_tabbar_center_image` / `_en`, `beauty_tabbar_center_url`, `beauty_tabbar_center_label` (multilanguage, max 20). No IDs renamed or removed. |
| Locales and docs | `ar.json`, `en.json`, `MERCHANT_GUIDE.md` | `beauty.tabbar.*` and `beauty.header.scope_prefix` added to both locales. New merchant guide section. |
| Tests | `scripts/mobile-app-nav.test.mjs` (new), `scripts/localized-images.test.mjs` | 8 new tests. The bilingual-image pair count went from 17 to 18 for the new campaign icon twin. |

## Repository checks

- Source: working tree on `feature/bilingual-images` at `8b30762`, uncommitted. It also contains the 2026-10-19 hero-pagination change and the pre-existing product-card edits.
- `pnpm build`: passed, with the baseline 9 warnings. An intermediate `:is()` selector added 4 PostCSS warnings and was rewritten.
- `pnpm test`: 105/105 passed, and the static audit reported 13/13 repository checks.

## Local static harness (not Salla)

The harness used the compiled `public/app.css` with hand-written markup that imitates what Salla renders: the `salla-cart-summary` slot and count, and an input standing in for `salla-search`. A simplified script toggled categories instead of `core-care-categories.js`. It was viewed in the Claude built-in browser, not Chrome.

| Viewport | Dir | Result |
|---|---|---|
| 390×844 | RTL | Header 106px (location 44 + search row 45 + padding). Search 222px; categories, language and bell are 44×44. Tab items 98×60. The badge sits at the bag's top-left (end side). WhatsApp moves 60px up. Body padding-bottom 60px. No horizontal overflow. The header sticks at top 0 after scrolling. |
| 320×640 | RTL | Search 152px, tab items 80×60, no labels truncated, no overflow. The categories sheet fills 0–580px above the bar. Both triggers show `aria-expanded="true"`, html overflow is hidden, and WhatsApp is hidden. After a fix, only the Categories tab is highlighted while the sheet is open. |
| 390×844 | LTR | Mirrored correctly: location and search on the left, bell on the right. An empty cart hides the badge. |
| 390×844, no scope | RTL | Header 62px: the location row releases its space. |
| 834×1194 | RTL | Logo (115×36) beside a 503px search. Tab list centred at 640px, items 160×60. |
| 844×390 landscape | RTL | Bar 48px with visually hidden labels. The header is no longer sticky (fixed after review: sticky header plus bar covered about 40% of the height). |
| 1024×768, 1440×900 | RTL/LTR | Desktop header unchanged (`display: contents`). Tab bar hidden, no body padding, WhatsApp not moved, compact-only elements hidden. |

## Not verified (platform verification incomplete)

- Not verified in the Salla development preview (theme `523702774`) or on `corecare-sa.com`. The public store receives this only after the owner publishes a new theme version.
- Not checked on real hardware: the real `salla-search` and `salla-cart-summary` rendering, iPhone safe areas, the on-screen keyboard behaviour, the Salla scopes picker, the login modal, the cart drawer opened from the tab bar, and `core-care-categories.js` with live menu data.
- Not tested: the campaign slot with a real uploaded icon, the WhatsApp app's real markup, other chat widgets (Tawk, gb-widget) and the Salla cookie bar against the bar, phone product pages with the sticky add-to-cart bar, the cart page, and customer pages.
- Known limitation: in the compact header, the location row appears first visually but comes after the categories button in DOM and focus order.

## Desktop parity (owner requirement, 2026-10-20)

Requirement: only phones and tablets change; desktop (1024px and wider) keeps its existing design.

1. **Compiled CSS rule diff.** Every rule in `HEAD:public/app.css` was compared with the working-tree build, keyed by media query and selector. Of the differences that can match a viewport 1024px or wider:
   - The announcement-strip selector changed from `.store-header > salla-advertisement` to `.app-inner > salla-advertisement`, with identical declarations. The element moved with it, and the desktop header is `display: contents`, so the box is unchanged.
   - Four `display: none` rules apply only to new elements: the grid icon, the location prefix and chevron, and the tab bar.
   - New CSS variables, which have no visual effect on their own.
   - `padding-left/right: env(safe-area-inset-*)`, which is 0 on desktop browsers and iPads.
   - All other new rules (91 added in total) are inside `max-width: 1023px`, `640px`, or landscape `max-height: 480px` queries.
2. **Rendered comparison.** The old markup with old CSS and the new markup with new CSS were loaded side by side in iframes of the same width. The test compared box position and 20 computed properties of every visible element and its `::before`/`::after`:

   | Width | Arabic | English |
   |---|---|---|
   | 1024 | 0 differences (68 elements) | 0 differences (68 elements) |
   | 1280 | 0 | 0 |
   | 1440 | 0 | 0 |
   | 1920 | 0 | 0 |

   Sensitivity control: the same comparison at 1023px reports 141 differences (the intended tablet changes).
3. **Behaviour on desktop.** The categories panel still opens from the header trigger. The extra tab bar trigger exists but is hidden. The `cc-categories-open` scroll lock applies only below 1024px. The add-to-cart animation targets the first visible cart summary, which on desktop is the header cart, as before. The tab bar script only toggles an attribute on the hidden tab bar.
4. **Only non-visual change on desktop.** The location button's accessible name now starts with «موقعك:» / "Your location:". Its visible text is unchanged.
5. **Regression guard.** `scripts/mobile-app-nav.test.mjs` fails if any rule in `core-care-app-nav.scss` sits outside a phone or tablet media query, or if the desktop pagination capsule changes.

Limitation: the comparison used the harness's simplified markup (header, promotions slider, footer stub), not Salla-rendered pages, and the Claude built-in browser, not Chrome.

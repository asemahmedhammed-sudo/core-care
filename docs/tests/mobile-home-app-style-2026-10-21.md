# Phone home page in the app style — 2026-10-21

Owner request: make the phone home page look like the Nice One app screenshot, without changing the desktop design.

## Changes (phones below 768px only)

- **Promotions slider:**
  - Edge to edge, with no corners or arrows; swipe and the dots remain.
  - New component switch `mobile_tall` (default **off**). When on: square frame, and small dots (6px, active 18px) inside the artwork's bottom edge.
- **Header over the banner:** when the tall slider is the first section (`$cc-hero-first` in `core-care-app-nav.scss`), it runs under the compact header.
  - At the top of the page (`.cc-header-at-top`, set by `core-care-tabbar.js`) the header is transparent, with white discs behind its icons.
  - It is white once scrolled, and white by default if the script does not run.
- **Shortcut circles (main-links) with 6 or more items:** two rows that scroll together.
  - Columns are `(100% − 4×12px) / 4.5` wide, so about 4.5 columns show on every width.
  - Circles are `min(64px, 100%)`.
- **Why opt-in:** the store's current mobile images are 1440×480 and 1440×599 (read from the live component settings). A square frame would crop them, so the merchant must upload 1080×1080 artwork first.

## Checks

- `pnpm build`: passed (baseline 9 warnings). `pnpm test`: 108/108. Static audit: 13/13.
- **Desktop parity:** compiled-rule diff against `main` (`af7109e`). The only added rule that can match a desktop viewport is `@media (prefers-reduced-motion) .store-header { transition: none }`. On desktop `.store-header` is `display: contents` with no transition, so it has no visual effect. The regression test requires app-nav rules to stay inside phone or tablet media queries.
- **Local static harness:** compiled CSS with Salla-like markup, tall banner on, 10 shortcuts, Claude built-in browser and Comet.

  | Width | Result |
  |---|---|
  | 390 | Header 62px transparent over a 390×390 banner. Dots inside the bottom. Arrows hidden. Header turns white after scrolling. |
  | 320, 360, 390, 430 | Shortcut grid shows 4 full columns plus about 55% of the fifth. No horizontal overflow. |

## Not verified

- **Salla preview:** the Partners development store has no promotions slider and fewer than 6 shortcuts, so this was not checked there.
- **Real store:** needs a new published version, square mobile artwork and the switch turned on.
- **Gap between banner and shortcuts:** 56px in the harness. This comes from the existing alternating-section padding, not from this change.

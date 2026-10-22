# Bottom tab bar and campaign button — 2026-10-22

Owner request: make the bottom tab bar look like the Nice One app screenshot. Replace the centre picture with an elegant icon the owner can change from the theme settings. Desktop must not change.

## Implementation (below 1024px with the tab bar on)

- **Tab bar** (`6ae94f1`, `9dee072`):
  - Icons are 28px outlines: pentagon home, three squares with a magnifier, handbag, person.
  - Labels are black, 14px/600. Below 360px they drop to 12px with no side padding, so «سلة التسوق» stays whole with five tabs.
  - The current tab's icon fills with pale blue `#d8e9fb`.
  - The bar is 64px high. The pink cart badge has a white ring.
- **Campaign button** (`9c9b58b`, this commit):
  - Two new dropdown settings:
    - `beauty_tabbar_center_icon`: ribbon (default), gift, tag, sparkle, heart, image (the existing upload), or none
    - `beauty_tabbar_center_style`: pink (default), purple, dark
  - **Look:** a 52px disc, raised 22px above the bar, with a white 4px ring and a soft coloured shadow. The white line icon is 28px; the ribbon is one crossing band at a 2.2 stroke.
  - **When it shows:** only with an https link, as before. Unknown saved values fall back to ribbon and pink.
  - **Compatibility:** a store that uploaded a centre image before now gets the ribbon by default. To keep its own image, it must choose «صورة أرفعها».

## Checks

- **Build and tests:**
  - `pnpm build`: passed.
  - `pnpm test`: 118/118. Static audit passed.
- **Desktop parity:** a compiled-rule diff against `main` found one new rule that can match desktop: `transition: none` for `.cc-tabbar__fab` under `prefers-reduced-motion`. That element is hidden on desktop.
- **Salla drafts in Comet via Claude in Chrome**, with the demo store in a 390px same-origin frame:

  | Draft | Check | Result |
  |---|---|---|
  | `draft-1900948862` | Tab bar at 390px | Icons 28px; labels 14px black; home 700 with `rgb(216, 233, 251)` fill; badge at the bag's top corner; bar 65px including its border |
  | `draft-1900948862` | Five tabs at 320px | «سلة التسوق» cut off, fixed in `9dee072` (confirmed with the same rule injected) |
  | `draft-1091829325` | Campaign disc with the server markup injected (the demo store has no campaign link) | 52px pink gradient disc, raised, no overflow |
  | `draft-1091829325` | Ribbon, gift, tag, sparkle and heart icons; purple and dark discs | All readable. The first ribbon drawing was too small and was redrawn |
  | `draft-1091829325` | Theme editor settings | Both new dropdowns are listed with their descriptions |

- **Theme identity:** body `salla-draft-1091829325`, CSS `salla.design/themes/draft/1091829325/app.css?v=20261022-campaign-fab-1`.

## Not verified

- **The button from real saved settings:** settings were not saved on the demo store, so the disc was injected with the template's markup.
- **Real devices:** iOS safe area and Android.
- **English/LTR.**

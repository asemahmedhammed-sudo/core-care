# Storefront consistency review — 2026-10-04

## Scope and identity

Working-tree changes on top of the existing checkout; pre-existing generated app.js,
static-audit changes and untracked evidence were preserved. Asset revision:
`20261004-storefront-polish-1` in the shared layout. Sources: product renderer,
home slider density, shared palette/interface, product cards/detail layout,
campaign/home/header/footer styles and the collection heading.

The attached product-card prompt informed the refinement of the existing storefront.
No new commerce data, setting IDs, field types, dependencies or migrations were added.
Image height is responsive (160–232px), rather than imposing 232px on narrow mobile
cards. Two-line title space deliberately aligns cards as requested; missing media
does not reserve the image height. Essential small discount text uses darker pink
`#b81746`; old prices/counts use `#757575` for readability. Existing IBM Plex font
and merchant font override remain supported.

## Repository verification

- `pnpm build`: passed, production output generated through Webpack.
- Build warnings: nine warnings, including Sass legacy import/global-function
  deprecations and Webpack asset/entry size recommendations. These are not errors
  or proof of platform performance acceptance.
- `pnpm test`: 41 tests passed, zero failed; 13/13 static audit checks passed.
  Regression coverage exercises shared hierarchy, visible native action attributes,
  missing metadata, specialist formats, options, booking, countdown, escaping and
  availability behavior. It does not simulate the platform's cart backend.
- `pnpm size:theme`: report regenerated; measurements do not establish the scope
  of Salla's official size requirement.
- `git diff --check`: passed after correcting introduced trailing whitespace.
- Generated files inspected: app.css, product-card.js, home.js; layout references
  retain the shared revision query. app.js matches the pre-task file byte-for-byte.
- Static audit regeneration changed only timestamp and changed-template inventory
  relative to the pre-task report; prior audit content was retained.

## Local visual evidence (partial)

Codex in-app browser, local HTTP fixture using the current source renderer and
production stylesheet, with mocked button hydration and previously recorded merchant
products. This is a styling fixture, not an actual Salla storefront runtime.

| Viewport | Actual result |
|---|---|
| 1440×900 RTL | Seven equal 185px cards, approximately 400px tall; current prices align; document width 1440px without overflow. Heading-to-grid gap 12px; section boundary gaps 36px. |
| 390×844 RTL | Two 177px cards per fixture row, 314px tall; document width 390px without overflow. Heading-to-grid gap 12px; section boundary gaps 24px. |
| 320×720 RTL | Two 142px cards per row; 44px cart buttons; document width 320px without overflow. |
| 320px LTR | Reversed direction remains contained; wishlist follows logical placement and content aligns left. |
| Keyboard | Product-link Tab moves to the cart action; visible 2px focus outline. Focused action resolves to #222 background and white text. |

PostCSS initially lowered `text-align: start` to left in RTL. Explicit RTL/LTR rules
corrected it; updated RTL computed alignment is right. Screenshots at desktop are
constrained by the in-app surface despite full-width DOM measurements.

Evidence:

- `output/qa/storefront-polish-local-2026-10-04.html`
- `output/qa/storefront-polish-local-ltr-2026-10-04.html`
- `output/qa/storefront-polish-mobile-390-2026-10-04.jpg`
- `output/qa/storefront-polish-desktop-1440-2026-10-04.jpg`

## Actual Salla verification — incomplete

Chrome is available and the existing Salla editor preview was inspected read-only.
It shows the preceding hosted build, including the former action placement. It
cannot verify these new sources/assets. The first CLI attempt failed because the
sandbox could not resolve api.salla.dev; the network-enabled retry reached Salla and
confirmed the linked account/theme/repository, then required committing the dirty
checkout before requesting preview. No commit or push was authorized or performed.
Installed `theme dev` targets React themes and is not the Twig preview workflow.

Untested on updated Salla assets: full home neighbors, hidden/reordered/editor
instances, low counts, all merchant settings, collection/sidebar/sort, product detail
gallery/options, native cart/wishlist actions, unavailable/preorder/booking states,
customer/blog/brand/cart surfaces, footer and all RTL/LTR responsive routes.
Hover/reduced-motion behavior is implemented but needs native platform review.

Implementation is present locally; repository checks passed. Full visual/functional
acceptance and publication readiness remain incomplete pending a preview serving
the updated build and the route/state checks above.

## Development branch preparation — 2026-10-05

User authorized pushing the changes to a development branch. Branch
`codex/storefront-polish` starts at `8f739e9`. A managed worktree isolates this change
from the unrelated dirty files in the original checkout. The pnpm launcher attempted
to reinstall reused dependencies and aborted because no TTY was available; the
documented direct Webpack/Node fallback passed (41 tests and 13 static checks).
The unchanged source tree was compared byte-for-byte and its already verified
production assets were copied from the primary build; this avoids dependency-path
module ID churn in unrelated bundles. No generated asset was edited by hand.
Local HTML fixtures remain in the primary checkout; the two screenshot evidence
files accompany this branch. Hosted platform verification is still pending.

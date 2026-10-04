# Collections CTA and heading direction — 2026-10-04

## Implementation and repository checks

- Source: working tree based on `efb49e5`. The tree already contained changes to `public/app.js`, the static audit, and unrelated untracked evidence/preview files; these were preserved. The rebuilt `public/app.js` matches the pre-task file byte for byte.
- Changed `core-care-home.scss`: the collection heading and description align at the language's starting edge, using explicit RTL/LTR text alignment because production PostCSS converts `text-align: start` to `left`. A column flex layout also places the short description on that edge.
- The collection CTA uses the neutral text/surface tokens for a black background and white label, including when the merchant's primary colour is white. It has a minimum 44px height and a visible keyboard focus outline. Merchant labels, links, component IDs, fields, and saved values are unchanged.
- `pnpm build`: passed, production Webpack output, with 9 warnings (Sass import deprecations and asset/entrypoint size recommendations). `public/app.css` regenerated through Webpack only; its final rules contain the scoped CTA colours and explicit RTL/LTR heading alignment. Master layout supplies the homepage classes used by those selectors.
- `pnpm test`: 37 tests passed, 0 failed; 13/13 repository audit checks passed. The audit was regenerated and its diff reviewed: updated metadata reflects current translations/settings/template hashes; earlier audit inventory entries remain present.
- `git diff --check`: passed.
- Merchant guide updated to explain the button label and directional heading. No configuration migration or new dependency.

## Local visual review (partial evidence)

Browser: Codex in-app browser, not Chrome. A temporary local fixture reproduces the collection markup with existing local images, the actual production `public/app.css`, a white merchant primary colour, and previous/next section markers. It does not render Twig or initialize Salla. No platform font load or Salla commerce data is represented.

| Direction / viewport | Heading and description | Heading-to-images | Previous / next visible content gap | Page overflow | CTA |
|---|---|---|---|---|---|
| RTL, 1440×1000 | Both right edges at 1424px | 12px | 36px / 36px | 0px | Black/white, 44px high |
| RTL, 390×1000 | Both right edges at 374px | 12px | 24px / 24px | 0px | Black/white, 44px high |
| RTL, 320×900 | Right alignment confirmed | Not remeasured | Not remeasured | 0px | 44px high |
| LTR, 1440×1000 | Both left edges at 16px | 12px | 36px / 36px | 0px | Shared scoped CTA rules |
| LTR, 390×1000 | Both left edges at 16px | 12px | 24px / 24px | 0px | Shared scoped CTA rules |
| LTR, 320×1000 | Both left edges at 16px | 12px | 24px / 24px | 0px | Shared scoped CTA rules |

Three local images loaded successfully. Mobile visual inspection showed a readable CTA, aligned title/description, and no overlapping or clipped copy in the normal three-card fixture. Black/white CTA contrast is 21:1. These measurements cover the fixture's neighboring markers, not the real storefront neighbors.

Evidence: `docs/evidence/visual/collections-2026-10-04/local-rtl-mobile.jpg`.

## Salla verification and publication

**Platform verification: incomplete. Publication readiness: unconfirmed.** Chrome and the Salla partner page are accessible, but this working-tree build has not been connected to or uploaded into an actual Salla preview. There is no current `node_modules/.salla-cli` preview configuration. Installed CLI 3.2.56 preview help and implementation were inspected; the preview workflow includes a commit/push prompt and a development watcher. No remote push, publication, or live-store change was authorized or performed.

Still required on the updated actual Salla preview: confirm the served build identity; inspect the section and real neighbors in Chrome at desktop/mobile widths and RTL/LTR; test the merchant's actual CTA label/link, keyboard focus, long copy, low item counts, missing optional image/text, hidden instances, and editor reordering. Local evidence does not establish hosted-draft behavior or release readiness.

## Authorized handoff to main

After the local verification above, the user authorized pushing this fix to `main`. The change includes the scoped SCSS, generated production CSS, merchant guide, this verification record, and its local screenshot. The pre-existing `public/app.js` and broader static-audit changes remain outside this commit, along with unrelated untracked files. A Git push does not verify that the Salla preview or live store serves this build.

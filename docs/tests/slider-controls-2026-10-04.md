# Homepage slider control capsule — 2026-10-04

## Implementation

Replaced the separate edge arrows and bottom dots with one centered translucent white capsule, pale purple circular arrows, a purple active pill, and a visible two-digit current/total image counter, following the user's supplied image. Uses existing `--cc-bestseller`, `--cc-secondary-soft`, and neutral tokens; muted counter text uses the darker `--cc-text-muted` for readability.

Desktop controls overlay the bottom of the artwork. Below 768px they sit 8px below the image in normal flow: the existing 4:1 image is only 74px tall at a 320px viewport, so placing a 54px control bar over it would obscure campaign content. This is an intentional responsive adaptation. The homepage flex gap remains its sole section-spacing owner. A single image hides the entire control bar without reserving space. No image assets, dependencies, settings IDs/types, links, locale keys, autoplay, or commerce behavior changed. No merchant migration is required.

Counter follows arrows, dots, keyboard and swipe, uses the actual rendered image count, and survives repeated initialization. Existing accessible action labels and live announcement remain. RTL reverses the control order and chevrons; numeric counter stays LTR. All five controls have 44×44px hit areas. Focus remains visible; hover is pointer-specific and transitions respect reduced motion. Navigation tolerates older cached Twig without the newly added counter.

## Repository verification — passed

- Working-tree change on the base revision recorded in `docs/evidence/technical/slider-controls-build-2026-10-04.json`; asset revision `20261004-slider-controls-1` in `master.twig`.
- Node 25.0.0, declared pnpm launcher; no install or lockfile change.
- `pnpm build`: passed; 9 existing Sass deprecation / Webpack performance warnings plus the existing Tailwind line-clamp notice. CSS remains above Webpack's recommended size, as does the legacy hero image.
- `pnpm test`: 39/39 tests and 13/13 repository static checks passed. Added current/total synchronization coverage (2/3 images, wrap, dots, keyboard, swipe) and cached markup compatibility. Existing tests cover RTL/LTR, vertical gestures, click suppression, single/empty carousels and repeated initialization.
- `git diff --check`: passed.
- Generated `public/app.css` and `public/home.js` contain the capsule and counter. CSS increased from the pre-task working-tree build by 994 bytes (298,508 → 299,502); no material asset-loading change or new image/font load. Pre-existing `public/app.js` is byte-identical to the pre-task file. Generated assets were rebuilt, not hand-edited.
- Regenerated audit inspected: only `generatedAt` and `changedTemplates` changed relative to the pre-task working-tree audit; no report fields removed. Dated audit snapshot saved separately. Existing category Twig/SCSS, guide changes, generated assets and unrelated evidence preserved.

## Local visual evidence — partial platform evidence only

Browser: Codex in-app browser. Chrome browser automation was unavailable (`Browser is not available: chrome`). These are standalone fixtures using production app.css, source carousel JS and existing local banners; neighboring header/section are fixture content, not actual Salla rendering. Fixture is `output/qa/slider-controls-2026-10-04.html` with RTL/LTR and 1/2/3-image variants beside it.

| Viewport | Image | Control capsule | Content-to-next-heading gap | Horizontal overflow |
| --- | --- | --- | --- | --- |
| 1440×900 RTL/LTR | 1392×348 | 338×62; bottom inset 20px | 36px from image bottom | None |
| 390×844 RTL | 366×91.5 | 294×54; 8px below image | 24px from capsule bottom | None |
| 320×844 RTL/LTR | 296×74 | 294×54; 8px below image | 24px from capsule bottom | None |
| 768×844 RTL (geometry check) | 720×180 | 338×62 | 24px from image bottom | None |
| 1024×844 RTL (geometry check) | 976×244 | 338×62 | 25.59px from image bottom | None |

Preceding fixture header ends 16px above image; following heading-to-content gap is 12px. Visual inspection of 1440/390/320 layouts found no clipped controls, overlapping elements, or abnormal neighboring gaps. All button boxes measured 44×44px. Existing banners loaded.

Interactive local checks passed: Next 1→2, dot →3, Next wrap 3→1, RTL ArrowRight 1→3, LTR ArrowRight 1→2. Two-image configuration shows 01/02, Previous wraps to 02/02 and shrinks the capsule to 250px at width 320. One-image configuration has a zero-size hidden controls box and a 24px image-to-next-heading gap. Physical touch is unit-tested behavior only, not device evidence.

Screenshots (local fixtures):
- `docs/evidence/visual/slider-controls-local-desktop-2026-10-04.jpg` (cropped to image/control and neighboring section)
- `docs/evidence/visual/slider-controls-local-mobile-390-2026-10-04.jpg`
- `docs/evidence/visual/slider-controls-local-mobile-320-2026-10-04.jpg`

## Salla platform verification — incomplete

Inspected installed official CLI 3.2.56 help and preview source before running `salla theme preview --only-link --without-editor`. Initial sandbox attempt failed with DNS `ENOTFOUND api.salla.dev`. Approved network retry passed theme/GitHub linkage checks, then prompted to commit changes. Installed source confirms accepting that prompt executes `git add .`, `git commit`, and `git push`. Declined because the current task does not authorize remote pushes. CLI warned: “Your last changes in *.twig/*.json files will not be reflected in the preview.” Stopped at test-store selection; no updated Salla preview was created or claimed.

Outstanding: updated actual Twig rendering/assets on Salla, Chrome desktop/mobile review, real header/product neighbors, physical touch, actual RTL/LTR storefronts, uploaded single/two-image configurations, disabled settings, editor reordering and persistence. No private preview URLs or credentials saved. Publication readiness is incomplete; no live-store activation, remote push, or marketplace publication occurred.

## Follow-up: authorized main upload

The user subsequently requested pushing this slider change to `main`. Before preparing the upload, fetched `origin/main` and confirmed all source/build hashes still match the verified production build. The independent category change is already committed separately as `99063ea`. Only slider sources, their generated CSS/home JavaScript, merchant-guide addition, regression coverage and dated evidence are included in the slider commit. Existing unrelated `public/app.js`, shared static-audit changes and other evidence remain outside this commit. Platform verification remains incomplete; a Git push alone does not verify the updated Salla draft.

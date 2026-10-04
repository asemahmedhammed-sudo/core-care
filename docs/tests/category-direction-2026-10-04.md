# Homepage category direction — 2026-10-04

## Scope and source identity

Requested: correct Arabic/English alignment of the homepage “Shop by category” section shown in the attached image. Baseline HEAD: `eadc74d`; this verification covers the uncommitted working tree. Pre-existing `public/app.js`, static-audit changes, dated records and output files were preserved.

- Removed the centered-heading modifier. Scoped explicit RTL/right and LTR/left rules survive the production PostCSS conversion of `text-align: start` to `left`.
- The heading and list share the same inline edge; list padding is zero, category gap 16px, heading-to-items gap 12px and circle-to-label gap 8px. Inter-section spacing still belongs to `#main-content`.
- Category and custom-link names use `bdi`; long unbroken labels wrap inside existing bounded items. Saved merchant order, URLs, media dimensions and existing fields are preserved.
- No settings/field IDs, types or migrations changed. Merchant guide updated. No remote push or publication performed.

SHA-256 of verified source/generated stylesheet:
- `src/views/components/home/main-links.twig`: `0e914ca85b6b36e9ce26f13e0be3f72f77819bbba1ef8a711ddee35976380222`
- `src/assets/styles/06-beauty/core-care-home.scss`: `f47096b18ac7a242e0e71d97ab8d10a2ca84d2bd769aa76b77cc4c0e0adf6d9b`
- `public/app.css`: `7cd62af72c31340b9c582e8b31b8ac9b3f11729c01e3f884e126f3ac6ac6b945`

## Repository verification — passed

- `pnpm build`: passed; 9 existing Webpack/Sass/performance warnings and the existing Tailwind line-clamp notice. Final assets are production output. Inspected `public/app.css`: both directional heading overrides, list padding and spacing are present.
- `pnpm test`: 37/37 passed; static audit 13/13 repository checks passed.
- `git diff --check`: passed.
- Generated change: `public/app.css`; regenerated `public/app.js` exactly matches the saved pre-task working-tree file (SHA/content comparison), preserving its existing change.
- Compared the regenerated audit to its pre-task working-tree copy: only `generatedAt` and `changedTemplates` changed. Other evidence remains intact.

## Local visual verification — passed, partial evidence

Browser: Codex in-app browser. Used `output/qa/category-direction-2026-10-04.html`, a local fixture with matching component markup, production CSS, sample category labels, no-image icon fallback and simple neighboring sections. It is not Twig rendered by Salla and does not use live merchant data. The fixture includes the theme's IBM Plex font setup; it does not validate font/network loading on Salla.

Checked RTL/LTR at widths 1440, 1024, 768, 390 and 320px. Heading alignment is right/left respectively; first item starts exactly at the list's corresponding edge (0px offset). Items keep DOM/merchant order from that edge. Heading-to-items is 12px. Adjacent visible-section distances are 36px at 1440px, about 25.59px at 1024px and 24px at 768/390/320px. No horizontal page overflow, overlap or clipped category content observed.

At 390px in both directions checked one/zero/twelve items, mixed-language labels, long unbroken names, no title, hidden section, reordered section and repeated instance. Empty/hidden sections measure 0px height. Long lists scroll internally without page overflow. Mixed labels compute `unicode-bidi: isolate`. Keyboard navigation can reach the end of the overflowing list in each direction (observed scroll offsets -682px RTL / +682px LTR); English Shift+Tab focused the preceding category correctly.

Evidence:
- `output/qa/category-direction-measurements-2026-10-04.json` (geometry/edge cases before adding the fixture font setup; the final 1440/390 checks again confirmed direction, 12px heading gap and no overflow).
- `output/qa/category-direction-rtl-1440-2026-10-04.jpg`
- `output/qa/category-direction-ltr-1440-2026-10-04.jpg`
- `output/qa/category-direction-rtl-390-2026-10-04.jpg`
- `output/qa/category-direction-ltr-390-2026-10-04.jpg`

## Actual Salla verification — incomplete

Verified the installed CLI preview flags and side effects before invoking it. `salla theme preview --only-link --with-editor --store 'Core Care'` failed inside the sandbox: `getaddrinfo ENOTFOUND api.salla.dev`. Automatic approval review then rejected an unsandboxed retry because the CLI can offer to `git add .`, commit and push through its change-check flow; this task does not authorize remote pushing. That retry did not execute. No private preview URL or credential was copied into the repository.

Chrome is running as a native app but is not exposed by the browser provider for automated viewport/DOM verification. No Chrome or Salla runtime review is claimed. Live desktop/mobile RTL/LTR rendering, actual image data, neighbor sections, editor save/hide/reorder and hosted updated-asset identity remain untested. Implementation is complete locally; repository checks passed; platform verification is incomplete; publication readiness is unverified.

## Main upload preparation — 2026-10-04

The user subsequently authorized uploading the category changes to `main`. Rebuilt an isolated source snapshot on `bf77f4a` so concurrent, uncommitted promotion-carousel changes do not enter this upload. The source snapshot contains only category styling/markup, the category merchant-guide update and the asset revision `20261004-category-direction-1` in the existing shared layout. No merchant setting ID or field type changed.

The pnpm launcher attempted dependency reconciliation in the temporary snapshot and stopped with `ERR_PNPM_ABORTED_REMOVE_MODULES_DIR_NO_TTY`; no dependencies or lockfile were changed. Used the AGENTS.md fallback with installed packages: production Webpack passed with the same 9 warnings, 37/37 Node tests passed and the audit reported 13/13 repository checks passed. This snapshot has no Git metadata, so its changed-template inventory is empty; the dated audit copy records that limitation. The primary working-tree audit and other pre-existing changes are excluded from the commit.

Compared compiled styles against `bf77f4a`: only six added category rules and three removed redundant category rules differ. The pending promotion-control styles are absent. Generated CSS SHA-256: `7cd62af72c31340b9c582e8b31b8ac9b3f11729c01e3f884e126f3ac6ac6b945`. Local visual evidence from the initial category implementation is included; actual Salla updated-asset/Chrome verification remains incomplete, and uploading to main does not establish publication readiness.

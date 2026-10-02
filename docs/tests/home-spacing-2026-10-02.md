# Homepage category-to-banner spacing

- Inspected the actual Salla draft `52103772` in the available in-app browser before deployment. Chrome is not exposed by the browser provider in this session.
- The categories section measured 196.24px high. The following recommendation bundle had no visible content: its only component host carried `hidden` and computed `display: none`, but its section retained 32px top and bottom padding.
- Editor before/after marker spans were zero-height flex items, each introducing another 24px gap. The category section ended at 209.78px and the banner began at 417.78px: 208px between section boxes, before counting internal category whitespace.
- Preserved the pending fix that makes editor markers `display: contents`, removes empty hook boxes, and tightens category heading/list spacing. Added a selector removing a section from layout only when its sole component host is explicitly hidden. Removing `hidden` automatically restores the section; this does not depend on section order, item count, or writing direction. Empty category lists also collapse their section. Existing image dimensions remain unchanged.
- Production webpack build passed (9 existing Sass/bundle warnings). All 18 Node tests and 13 static repository checks passed. Confirmed the generated `public/app.css` contains the editor-marker, hidden-component-wrapper, and empty-category selectors.
- Salla CLI preview failed authentication/connection-token retrieval. After explicit user approval, commit `359a5a7` was pushed successfully to `origin/main`. Refreshed draft `52103772`; its marker spans still computed to `display: block` and its empty recommendation wrapper still computed to `display: block`, showing that this draft has not picked up the new stylesheet yet.
- Post-deployment desktop/mobile visual review and live hide/reorder/low-content checks remain incomplete. The existing screenshot is not evidence of the corrected layout. No local-only check is claimed as platform validation.

## Recheck of draft 610112857

- Remote main was checked again. The theme document still links app.css with revision `20261001-campaign-banners-1`; main uses `20261002-section-spacing-1`. Read the actual loaded stylesheet CSS rules: editor-marker, hidden-bundle-wrapper and category-spacing fixes are all absent. This is an older Salla draft build, rather than a failed selector in the current source.
- Desktop category section bottom was 314.23px and following banner top was 536.62px: 222.39px between section boxes. The empty recommendation wrapper still contributes 64px, with extra editor marker gaps.
- Salla Partners portal was opened through its official login link and requires email/password; no authenticated session is available. Updating the development build is blocked on owner sign-in. No additional source change is justified by these findings. Post-update desktop/mobile visual verification remains incomplete.
- Screenshot: `output/qa/salla-spacing-old-draft-610112857.jpg`.

## Authenticated platform verification

- User signed into Partners. Verified theme `523702774`, repository `asemahmedhammed-sudo/core-care`, selected branch `main`; confirmed that branch in the UI. Twig build log page states that files transfer directly and no build pipeline runs for Twig.
- Started the official CLI preview with `--only-link --with-editor --store 'Core Care'`. Existing unrelated local changes were not committed by the CLI. Live asset/watch servers started successfully.
- Opened the existing Core Care storefront preview through its observed editor iframe URL with the CLI asset/watch parameters. This retains the actual three shampoo/nail-polish/perfume entries, Flormar banner and surrounding product sections. This is live Salla data and rendering, with CSS served by the official local preview server.
- At 1280px, visible category list to banner gap is 32px and heading to list is 19.20px. At 390px, category list to banner gap is 24px. The empty recommendation wrapper computes to `display: none`. Visually inspected both widths: no excess gap, cropping or card overlap in the changed region. The three no-image category icons retain their intended dimensions. Screenshots: `output/qa/salla-spacing-fixed-desktop.jpg` and `output/qa/salla-spacing-fixed-mobile.jpg`.
- Hosted control preview without the local asset parameters still loads `20261001-campaign-banners-1` and keeps the empty wrapper displayed. Confirming `main` and reopening preview did not update this existing hosted draft. Hosted deployment verification therefore remains incomplete; the successful visual checks above validate the current CSS in the official live development preview, not the old hosted draft assets.
- Only the in-app browser was exposed for browser automation; Chrome-specific verification is still pending. Additional live editor hide/reorder scenarios are not claimed as completed.
- Restored production output after the CLI watch build. Production webpack passed with 9 existing warnings; all 18 tests and 13 repository checks passed again.

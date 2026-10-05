# Promotional slider commit verification — 2026-10-05

Prepared for the authorized commit and push to `main`, based on remote revision `95b8eb4`. The remote storefront polish and merchant contrast fixes were preserved. Only the promotional slider implementation, its optional merchant settings/translations, regression tests, asset references, generated CSS/home JavaScript and documentation are included.

The final slider removes the capsule/counter; uses neutral 44×44px controls and dynamic pagination below the image; displays the active pill with the secondary accent; supports optional mobile artwork, opt-in HTML titles and a configured HTTPS shopping CTA; preserves full image proportions, RTL/LTR keyboard/touch navigation, focus recovery, 350ms transitions, reduced-motion CSS and single-slide navigation hiding. Existing field IDs/types remain unchanged, with nine optional fields added relative to remote `main`. Autoplay remains disabled.

## Checks

- Original workspace: `pnpm build` passed with nine existing Webpack/Sass warnings and the existing Tailwind line-clamp notice.
- Isolated checkout: pnpm's launcher attempted a dependency reinstall and failed with `ERR_PNPM_ABORTED_REMOVE_MODULES_DIR_NO_TTY`. Used the documented fallback without installing dependencies or changing the lockfile: direct production Webpack build, `node --test scripts/*.test.mjs`, and `node scripts/audit-theme.mjs`.
- Fallback build passed with the same nine warnings. All 44 tests passed and all 13 repository audit checks passed. `git diff --check` passed.
- All source files, dependency declarations/lockfile and build configuration in the isolated checkout were compared with the reviewed workspace and were identical. The symlinked temporary dependency path changed Webpack numeric module IDs in unrelated bundles. Final generated assets were copied from the original workspace's successful production build of those identical sources, avoiding unrelated generated-file churn. Generated assets were not edited by hand.

## Prior local browser review

Codex in-app browser fixtures using the final production CSS/JavaScript passed RTL/LTR checks at 360, 375, 390, 768, 1024 and 1440px. Default three-slide layouts had no horizontal overflow, 44×44px controls, a 4px banner-to-controls gap, 24–36px controls-to-next-heading gap and 12px heading-to-items gap. One slide released navigation space and produced zero indicators; two slides produced two indicators. Optional mobile source selection and natural image ratios passed at 360/375/390/768/1440px, including square test artwork with no unused frame height. Optional CTA measured approximately 94.48×45px.

Browser actions passed: next/previous, dot selection, wrap, direction-aware arrow keys, Home/End, keyboard focus recovery and Enter activation of banner/CTA links. Animation was 350ms and focus outline 2px. Swipe is regression-tested rather than verified on a physical device. Reduced-motion CSS was inspected but the OS preference was not exercised. Desktop screenshot capture was limited by the app browser surface; desktop geometry was measured in the rendered viewport. Local fixtures and earlier working-tree evidence remain in the original workspace.

## Platform status

Repository checks passed. Updated Salla platform verification and publication readiness remain incomplete at this commit: the prior preview attempt required committing/pushing updated Twig/JSON. Chrome review with real neighboring sections, merchant-setting persistence, saved single-slide states, hidden/reordered sections and physical touch remain outstanding. This Git push does not establish Salla marketplace approval or live-store deployment.

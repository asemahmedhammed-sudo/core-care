# Homepage promotions slider pagination — 2026-10-19

## Change

The homepage promotions carousel (`pages/partials/home/promotions.twig`, styled in
`src/assets/styles/06-beauty/core-care-home.scss`) drew its pagination inside the artwork:
a translucent white capsule with 44px dot buttons, which covered prices and CTAs on mobile.

- The white capsule (`.beauty-promotions__dots::before`) and the graduated neighbour dots were removed.
- The indicator now uses compact bars in a second grid row beneath the artwork, centered:
  - desktop: 4px high, inactive 16px, active 32px;
  - below 768px: 3px high, inactive 16px, active 28px;
  - 8px between bars (4px inline padding on each button).
- Active bars use `--promo-accent` (`--cc-icon`). Inactive bars use the same color at 22% opacity. The active state differs in length as well as color.
- Multi-slide carousels reserve the row with `:has()` before the script shows the controls, so initialization does not shift the layout. A single-slide carousel reserves nothing.
- No change to Twig, JavaScript, the image aspect ratio, the arrows, or any other slider.

Intentional deviation: dot buttons are 24×24px or larger, meeting the WCAG 2.2 target-size minimum, instead of the 44px implementation target in AGENTS §6.4. With the requested 6–8px bar spacing, a 44px width is impossible, and a 44px-tall row would add empty space under the banner. The 44px arrows, swipe, and keyboard navigation still work.

## Checks

- Source: working tree on `feature/bilingual-images` at `8b30762`, plus this change (uncommitted).
- `pnpm build`: passed. It reported the existing 9 size warnings. `public/app.css` contains the new rules.
- `pnpm test`: 97/97 passed, and the static audit reported 13/13 repository checks.
- Local static harness: compiled `public/app.css`, the bundled `core-care-promo-1.webp`, and 3 static slides. It was served from the scratchpad and viewed in the Claude built-in browser, not Chrome.
  - 390px RTL: the image ends at 168.5px and the 24px dot row runs from 168.5px to 192.5px. The bars sit about 10px below the artwork, and the next heading starts 24px after the row. The active bar is on the inline start (right). No horizontal overflow.
  - 1440px LTR: the dots are centered under the artwork (center 720px). The active bar is 32×4 and on the left. No overflow.

## Not verified (platform verification incomplete)

- Not verified in the Salla development preview (theme `523702774`) or on `corecare-sa.com`.
- Not verified with the real carousel script running (autoplay, swipe, or dot clicks) in a browser. The existing unit tests for that behavior pass, and the script was not changed.
- Not checked at 320px, with many slides (wrapping), or in Chrome.

## Update 2026-10-20: desktop keeps the original capsule

The owner asked that only phones and tablets change and that desktop keep its current design.

- The original desktop rules are restored verbatim in `core-care-home.scss`: the white capsule, 44px dot buttons and graduated dots inside the artwork.
- The compact bars are now an override inside `@media (max-width: 1023px)`. Phones and portrait tablets get the row beneath the artwork: 4px high, inactive 16px, active 32px. Below 768px they are 3px high with a 28px active bar.
- Desktop parity check: compiled CSS from `HEAD` and from the working tree were rendered side by side in the local harness. At 1024, 1280, 1440 and 1920px, in Arabic and English, there were 0 differences in the box position or computed styles of any visible element, pseudo-elements included. See `docs/tests/mobile-app-nav-2026-10-20.md`.
- Still not verified in the Salla development preview.

# Promotions slider stable frame — 2026-10-06

Request: one stable slider frame across slides, mobile presentation (ratio, crop anchor, arrows, pagination). Source: `462f071` plus this change.

## Cause

The bundled artwork has two ratios (slide 1 1440×480, slides 2–3 1440×576) and the image used `height: auto`, so the frame height changed per slide: 1390×463 → 556 at 1440, 364×121 → 146 at 390, 294×98 → 118 at 320.

## Change

- `core-care-home.scss`:
  - `.beauty-promotions__media` uses `aspect-ratio: var(--promo-ratio, 3 / 1)`, and the image uses `object-fit: cover`.
  - Below 768px: `--promo-ratio: 12 / 5`, 52px arrow columns, and the visible arrow disc inset 6px, giving a 32px disc 10px from the edge on a 44×44 target.
  - Pagination: no bottom margin, and a max-width that clears the arrows.
  - Active dot is a 16px dark pill (previously a 1.35 scale).
- `promotions.twig`: `beauty-promotions__artwork--default` on bundled artwork, anchored `right top` so the headline and logo stay visible. Merchant images stay centered.
- `master.twig`: asset revision `20261006-promo-stable-frame-1`.
- `twilight.json`: image and mobile-image descriptions updated; field IDs and types unchanged.
- `MERCHANT_GUIDE.md`: slider paragraph updated.
- Compatibility: merchant images whose ratio differs from the frame are now cropped at the edges instead of resizing the frame. Recommended uploads: 3:1 for desktop and 12:5 for mobile. No setting migration.

## Verification

Native Chrome on the hosted Salla draft `draft-2111164464` (served `20261006-home-render-fix-1`; RTL; Arabic is the only store language). The new rules were not deployed. The built CSS for the slider was swapped into the hosted page inside same-origin test iframes at exact widths: the old `beauty-promotions` rules were deleted from the page and the compiled new rules injected. The default class was added to the bundled images, matching the Twig change.

| Width | Frame per slide (before → after) | Overflow | Arrows | Dots |
|---|---|---|---|---|
| 1440 | 463/556/556 → 463/463/463 | none | 44×44, vertical offset 0 | centered, no overlap |
| 390 | 121/146/146 → 152/152/152 | none | 44×44, target 4px / disc 10px from edge, offset 0 | centered, 0px above frame bottom, no overlap |
| 320 | 98/118/118 → 123/123/123 | none | as 390 | as 390 |

- The frame stayed 364×152 while switching slides at 390.
- Screenshots of every slide at 390, 320 and 1440 show the headline, logo and main products visible. The 3:1 desktop frame crops only lower surface on slides 2 and 3.
- Active dot: 16px, `#0C070F`; inactive: 6px, `#757575`. Arrow: white disc with `#0C070F` icon.
- RTL swipe: swiping right goes to the next slide; swiping left on the first slide stays put. Forced `dir="ltr"`: previous on the left, next on the right, no overflow.
- Autoplay: the carousel JS is unchanged. In this background tab, neither the old nor the new CSS advanced in a control run, so foreground autoplay is unverified here.
- `pnpm build`: passed (existing 9 warnings). `pnpm test`: 66/66 tests and 13/13 audit checks. New frame regression test added.

## Not verified / limits

- Deployed draft rendering of this commit: not pushed or synced.
- Real touch hardware, foreground autoplay timing, English store data, merchant-uploaded images and mobile variants.
- On mobile, the inline-end arrow overlaps the end of the headline on the bundled artwork, because the artwork places text about 3% from its right edge. The previous layout overlapped the same way.
- The global WhatsApp floating button overlaps the slider's lower corner at 390/320. It is outside this slider and was not changed.

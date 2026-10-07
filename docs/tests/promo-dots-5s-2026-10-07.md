# Promotions slider: 5-second autoplay and graduated dots — 2026-10-07

Request: change slides every 5 seconds and return to the first after the last; style the pagination like the supplied reference (graduated dots).

## Change

- Default interval is now 5 seconds:
  - `beauty_promotions_interval` value 6 → 5 in `twilight.json` (ID, type and 3–60 range unchanged)
  - Twig default 6 → 5
  - JS fallback 6000 → 5000ms
  - Merchant guide updated
- Autoplay already wraps from the last slide to the first; unchanged.
- Dots:
  - Inactive dots far from the active one: 5px `#c4c4c4`.
  - Immediate neighbours: 8px `#9e9e9e`.
  - Active: 10px `--promo-accent` (`#0C070F`).
  - Capsule: a soft white gradient.
  - Hover no longer turns inactive dots black.
  - Hit targets stay 44×44.
- Asset revisions: `master.twig` and `home.js` → `20261007-promo-dots-5s-1`.
- Compatibility: a merchant who has explicitly saved 6 keeps 6. The hosted diagnostic on 2026-10-06 read the setting as unset, so the new default applies there.

## Checks

- Tests: 66/66 tests, with autoplay timing tests updated to 5000ms; 13/13 audit checks.
- Build:
  - Another session had uncommitted `core-care-collection.scss` and `core-care-products.scss` edits. `public/app.css` was therefore built in a clean worktree with only this change, and its diff against HEAD contains only `beauty-promotions` rules.
  - `public/home.js` differs only in the 5e3 fallback.
- Hosted preview (Chrome, draft `draft-2111164464`, compiled slider rules injected in-page, not deployed): dot sizes and colours read 8/10/8px for slide 2 of 3, and the screenshots match the reference style.

## Not verified

Deployed rendering after push and sync, real 5-second foreground timing on Salla, and mobile appearance of the new dots on the hosted draft.

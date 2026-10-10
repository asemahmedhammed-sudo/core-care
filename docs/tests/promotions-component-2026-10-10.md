# Promotions slider as a page-editor element — 2026-10-10

## Request

The merchant could not find the top promotions slider in the editor's **عناصر الصفحة** list, so it could not be added, edited or moved there.

## Cause

`src/views/pages/index.twig` rendered the slider with `{% include 'pages.partials.home.promotions' %}` before `{% component home %}`. It was a Twig partial controlled only by global theme settings (`beauty_promotions_*`, `beauty_promo_N_*`), and no `twilight.json` component was registered for it. Salla's page editor lists only registered components, so the slider could never appear there. (Commit `65ef545` had replaced an unregistered `{% component 'home.promotions' %}` call with that include.)

## Change

- Registered `home.beauty-promotions` («سلايدر العروض الرئيسي» / "Main promotions slider") in `twilight.json`. It has a `slides` collection (image, mobile image, multilanguage description, show-title switch, multilanguage button label, variable-list link; 0–6 items) plus the `autoplay` and `interval` (3–60 s, default 5) fields.
- New `src/views/components/home/beauty-promotions.twig` normalizes the slides. It skips slides without an image, resolves multilanguage values, and accepts only `http(s)://` or store-relative links. It then renders the shared partial.
- `promotions.twig` is now shared markup. With no merchant slides, it builds the previous legacy slides from the theme settings, or the bundled artwork. Unlinked slides render a `div` instead of an empty link. The section carries `component-id`.
- Removed the include from `index.twig`.
- SCSS: the slider keeps its 16px offset below the header only when it is the first section. Otherwise the `#main-content` gap is the only spacing.
- Removed the settings `beauty_promotions_enabled`, `beauty_promotions_autoplay` and `beauty_promotions_interval`. Their saved values are now ignored. The `beauty_promo_N_*` settings remain as the fallback source.
- `docs/MERCHANT_GUIDE.md` updated.

## Repository checks (working tree on `ef802ea` plus these uncommitted changes)

| Check | Result |
|---|---|
| `pnpm build` | Passed, 9 existing webpack warnings |
| `pnpm test` | 69/69 tests passed; static audit 13/13 including `custom-field-template-references` for the new component |
| Generated `public/app.css` | Contains `#main-content>:not(.s-design-invisible-dom):not(salla-hook)~.beauty-promotions{padding-top:0}` |
| `git diff --check` | Clean |

Local template rendering used twig.js 1.17.1, installed in a scratch directory outside the repo, with stubbed `trans`, `link` and `asset` and the `theme.settings` getter. Results:

- Empty slides: 3 default artwork slides linking to offers, latest products and brands.
- One legacy setting image: only that slide, with its title.
- Configured slides:
  - A slide without an image is skipped.
  - The `javascript:` link is dropped, and that slide becomes an unlinked `div` with no CTA.
  - The relative link is kept.
  - The CTA appears only when both the label and the link are present.
- Autoplay defaults to true when unsaved; a saved false gives false; the interval is passed through.

twig.js is not Salla's PHP Twig, so this supports but does not replace hosted verification.

## Salla platform verification — incomplete

Not performed. The development preview workflow syncs a committed revision, and no commit or push was authorized in this task. Still untested on Salla:

- The element appears in the editor list; add, reorder, hide and delete work; collection fields save; the variable-list link resolves.
- Desktop (1440) and mobile (390/320) spacing against neighbouring sections, both as the first element and mid-page.
- Editor insertion markers.
- Two instances on one page.
- RTL/LTR.

## Follow-up: images only, no required fields (same day)

The merchant rejected the per-slide text fields: the editor demanded «وصف الصورة» before saving, and they want images only.

- The `slides` collection now has only `slides.image` and `slides.mobile_image`, and both are `required: false`. The `title`, `show_title`, `button_label` and `url` slide fields are removed. They were pushed in `09955ca`; any values a merchant entered in them are now ignored.
- Merchant slides render as unlinked images, with a generic translated alt text («اكتشفي Core Care N»). Slides without an image are skipped.
- The legacy fallback (theme-setting images or bundled artwork) keeps its previous image links. Its titles and CTA buttons are no longer rendered.
- A fix applied before release: the intermediate local commit `2b74b40` had dropped the `.beauty-promotions__image-link` wrapper. The picture would then have been placed in the 60px arrow grid column. The wrapper is restored as an `a` for legacy links and a `div` otherwise, and a regression test covers it.

Checks:

- twig.js render: the empty case gives 3 linked default slides; merchant slides give 2 unlinked images, with the empty slide skipped.
- `pnpm build`: passed, with the same 9 warnings as before.
- `pnpm test`: 67/67 passed, and 13/13 static checks.

Salla platform verification is still **incomplete**: these changes have not been pushed, and the editor form was not re-checked.

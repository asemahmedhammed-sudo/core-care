# Phone quick links under the main slider — 2026-10-22

Owner request: show the categories under the main promotions slider like the Nice One app screenshot. The look is two scrolling rows of ringed circles with bold names, the first row overlapping the banner, and each circle opening its category. Build a section if none exists. Desktop must not change.

## Findings

- **No new section was needed.** The theme already has «روابط سريعة» (`home.main-links`). It shows Salla categories with their images and category links, or custom links with icons.
- **The live store** (published version 62497446, read only) has two instances:
  - order 2, hidden, no categories selected
  - order 5, «اكتشفي عالم الجمال», 3 categories, after «منتجات ثابتة»

  Neither sits directly under the slider. Nothing was changed in the store.
- **Reference, measured pixel by pixel** (assuming a 390px-wide phone):
  - circles 62px with a 1px `#d9e7f1` ring, filled with the page colour
  - about 86px between columns
  - about 6px from circle to name, about 16px between rows
  - bold dark names
  - the first row overlaps the banner's lower edge

## Implementation (below 768px)

- **`main-links.twig`:**
  - Imageless circles also carry the full name (`.beauty-category__text`, `aria-hidden`), hidden on larger screens.
  - A section without a title gets `beauty-categories--untitled`. CSS cannot nest `:has()`, so the template marks this itself.
- **`core-care-home.scss`, phone block:**
  - **Circles:** 62px, ring and canvas fill, bold 13px names that wrap only between words. Imageless circles show the 11px name inside the circle.
  - **Layout:** six or more items scroll in two rows with columns `calc((100% - 4 * 20px) / 4.3)` wide.
  - **Overlap:** applies only when the section comes right after the tall banner (`beauty-promotions--mobile-tall`), with or without Salla's `s-design-after` and `s-design-before` markers between them, and has no title. The section moves up 36px into the banner, with no top padding and a transparent background. The banner dots move up 48px.
  - **Specificity:** `:not(#cc-overlap)` lets the overlap rule outrank the alternating-sections rule, which has a long chain of `:not()`.

## Checks

- **Build and tests:**
  - `pnpm build`: passed.
  - `pnpm test`: 119/119. Static audit passed.
- **Desktop parity:** a compiled-rule diff against `main` found one new rule that can match desktop: `display: none` for the new hidden name span. On the draft at 1280px, the circles stayed 72px and tinted, with the initial and 13px/500 names.
- **Salla drafts in Comet via Claude in Chrome**, demo store in a 390px same-origin frame:

  | Draft (commit) | Check | Result |
  |---|---|---|
  | `draft-49662265` (`f7c9791`) | Overlap | Not applied: Salla's markers sit between sections; the nested `:has()` dropped the dots rule |
  | `draft-784332603` (`47c7464`) | Overlap with real markers | Dots moved up; the section kept its grey background and 32px padding (specificity) |
  | `draft-1247884549` (`f6dcd50`) | Demo section as rendered (titled) | 62px ringed circles; links go to each category page |
  | `draft-1247884549` | Untitled section with 10 sample items (on screen only), moved with its markers under the tall banner | Circles start 33px inside the banner; dots end 15px above them; transparent section; no horizontal overflow |
  | `draft-1247884549` | 1280px | Desktop look unchanged |

- **Theme identity:** body `salla-draft-1247884549`, CSS `salla.design/themes/draft/1247884549/app.css?v=20261022-quick-links-3`.

## Not verified

- **Real store categories and images:** the demo store has 4 categories without images; sample items and images were injected on screen only.
- **Tablets (768–1023px):** they keep the current quick-links design.
- **Real devices, and English/LTR.**

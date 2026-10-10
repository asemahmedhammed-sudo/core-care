# Header language selector redesign — 2026-10-10

## Request

The header's language control looked dated and unclear. It also showed the currency symbol next to the language («العربية | ⃁»). The owner asked for a modern redesign.

## Cause

`header.twig` used `<salla-localization-modal show-trigger>`. The installed component (`@salla.sa/twilight-components` 2.14.551) renders its built-in trigger as `language name | currency symbol`. The theme styled that trigger as a filled grey pill.

## Change

- `salla-localization-modal` is kept without `show-trigger`, so Salla still owns language and currency selection, the API calls and the redirect.
- The theme renders its own `button.core-care-header__locale`. It dispatches `localization::open`, an event the installed component listens for (verified in its source).
- **Content:** an outline globe icon (18px, 1.5px stroke), the current language name in that language (العربية / English, other codes uppercase) and a muted chevron. No currency symbol. A store with only currencies enabled shows a banknote icon and «العملة».
- **Accessibility:**
  - `aria-haspopup="dialog"`.
  - The accessible name gives the purpose and the current language, e.g. «اللغة والعملة: العربية».
  - Icons are `aria-hidden`.
  - Visible focus outline.
  - A 40px visible pill inside a 44px hit area.
  - The hover transition is disabled under reduced motion.
- **Styling:** a white pill with a 1px `--cc-border` border and `--cc-menu-hover` on hover. The padding is symmetric, so RTL and LTR match after PostCSS.
- **Phones (≤767px):** a 44px globe-only button with no border; the label and chevron are hidden.
- New locale keys `beauty.header.language`, `currency` and `localization` in `ar.json` and `en.json`.
- Asset revision bumped to `20261010-header-locale-1`.

## Checks

| Check | Result |
|---|---|
| `pnpm build` | Passed, 9 existing warnings; the generated CSS uses symmetric left/right padding |
| `pnpm test` | 71/71 passed, including the new `scripts/header-localization.test.mjs`; static audit 13/13 (locale parity) |
| twig.js render of the header snippet | Both enabled (ar) gives «العربية» with aria «اللغة والعملة: العربية». Language only (en) gives «English». Language only (fr) gives «FR». Currency only gives «العملة». Neither gives no button and no modal. `show-trigger` never appears. |
| Real Salla preview `salla.design/ar/corecare` (built-in browser) | Not deployed: markup and CSS were injected. The pill was 104×40px in RTL, with the globe at the start, then the label, then the chevron. Clicking opened Salla's modal with العربية / English; this store has no second currency, so there was no currency section. |

## Not verified

- The hosted build after push.
- Phone width on Salla.
- LTR/English storefront.
- A store with multiple currencies.
- Chrome.

## Revision 2: inline dropdown matching the owner's reference (same day)

The owner supplied a reference screenshot of the Nice One header language menu. The pill and modal are replaced to match it.

### Change

- **Trigger:** a plain button: outline globe (22px), the language code (`AR`/`EN`) and a chevron that rotates while open. It has `aria-expanded`/`aria-controls`, and a 3px `--cc-secondary` underline at the header's bottom edge while open.
- **Panel** (`core-care-language-menu`, `src/assets/js/partials/core-care-language-menu.js`, loaded through `main-menu.js`):
  - White, with a 3px black top border, bottom radius 16px and a soft shadow.
  - Title «اللغات».
  - Options come from `Salla.config.languages()`, which is loaded once per page.
  - Each option shows a radio-style mark: a filled dark circle with a white check for the current language, an empty ring otherwise. Then the platform flag (`lang.flag`, HTTPS only) and the platform name.
  - Options are built with `createElement`/`textContent`.
- **Switching:** the same steps as the installed `salla-localization-modal`: `Salla.cookie.set('s-lang')`, `Salla.helpers.addParamToUrl('lang')`, and swap the `/<current>/` path segment.
- **Closing:** Escape, an outside click, or focus leaving the menu closes the panel. Escape returns focus to the trigger. Listeners use an `AbortController`.
- **Currency:** a «العملة» row opens Salla's modal, and only renders when the store enables currencies. A store with only currencies keeps a single trigger that opens the modal.
- **Phones:** the trigger is the globe only, and the panel spans the navigation row with a 12px inset.
- **Compiled-CSS fixes found during review:**
  - Two SCSS parent-selector mistakes (`body … body`, `body html[dir]`).
  - `text-align: start` lowered to `left`.
  - `inset-inline-end` lowered to `right`, now handled with an explicit `html[dir='rtl']` anchor.
  - The selected mark uses `--cc-text`: this store's palette resolves `--cc-action` to `#ffffff`, which made the mark invisible in preview.
- Asset revision `20261010-language-dropdown-1`.

### Checks

| Check | Result |
|---|---|
| `pnpm build` | Passed, 9 existing warnings |
| `pnpm test` | 74/74 passed. `header-localization.test.mjs` covers markup, currency gating, switch URLs, flag URL safety, close behaviour, styles and compiled selectors. Static audit 13/13. |
| twig.js render | Language and currency (ar): menu with `AR`, a currency row and the modal. Language only (en): `EN`, with no currency row and no modal. Currency only: modal trigger. Neither: nothing. |
| Real preview `salla.design/ar/corecare`, 1024px (built-in browser) | Markup, compiled CSS and the element logic were injected; nothing was deployed. Results: <br>• `Salla.config.languages()` returned العربية/English, both with platform flags. <br>• The panel was 480px wide, started at the nav bottom (133/134px), and was anchored to the trigger at x 234–714 with no horizontal overflow. <br>• On open, focus went to the current language. The selected mark showed black with a white check after the `--cc-text` fix. <br>• Escape closed the panel, set `aria-expanded="false"` and returned focus to the trigger. |

### Not verified

- Selecting English (to avoid changing the preview session's language).
- The hosted build after push.
- The phone layout on Salla.
- LTR.
- A multi-currency store.
- Chrome.

## Revision 3: phone bottom sheet (same day)

The owner reported that on phones the language menu looked like a squeezed desktop dropdown:
- two options side by side;
- a heavy black frame around «العربية», the focus ring from moving focus into the list on open;
- a purple underline stacked on the panel's black top border.

### Change

- **Phones (≤767px):** the panel becomes a bottom sheet:
  - fixed to the bottom edge, with a 20px top radius, a decorative grab handle and an upward shadow;
  - bottom padding includes `env(safe-area-inset-bottom)`;
  - it slides up over a `--cc-overlay` backdrop, and the backdrop fades in.
- **Sheet header:** the title «اللغات» (18px/500, `--cc-text`) and a close button. The button is a 36px visible circle inside a 44px hit area, with the new locale key `beauty.header.close_languages`.
- **Options:** one per row, full width, 56px high, with a 12px radius and a 1px `--cc-border`. The current language gets a `--cc-text` border and a `--cc-menu-surface` fill. The order is flag, then name aligned to the row start, then a 24px check mark at the row end.
- **Removed on phones:** the purple trigger underline and the black panel top border.
- **Behaviour:**
  - The backdrop and the close button close the sheet and return focus to the trigger.
  - Page scroll is locked while the sheet is open (`html.cc-language-menu-open`, phones only).
  - The merchant WhatsApp button (z-index 99999) is hidden while the sheet is open, the same way as the cart drawer.
  - Opening with a pointer focuses the panel itself, so no option gets a focus ring. Opening with the keyboard still focuses the current language.
- **Reduced motion:** animations are disabled.
- **Desktop/tablet (≥768px):** unchanged.
- Asset revision `20261010-language-sheet-1`.

### Checks

| Check | Result |
|---|---|
| `pnpm build` | Passed, 9 existing warnings; compiled sheet uses symmetric `left:0; right:0` |
| `pnpm test` | 86/86 passed (new phone-sheet test in `header-localization.test.mjs`); static audit 13/13 |
| Real preview `salla.design/ar/corecare` (built-in browser) | The hosted draft is an older build (`20261007-promo-dots-5s-1`) without the language menu. The new markup and the compiled language-menu CSS were injected, with a condensed copy of the element logic; nothing was deployed. |
| Phone, 375×812, RTL | <br>• `Salla.config.languages()` returned العربية/English with platform flags. <br>• The sheet was 375×216 at the bottom edge. Header 44px, then 12px, then rows 343×56 with an 8px gap, then 20px bottom padding. <br>• The check mark sat at the row's left end in RTL, and the names were right-aligned. <br>• No horizontal overflow; page scroll locked; WhatsApp button hidden; focus on the panel with no ring. <br>• The close button, the backdrop and Escape each closed the sheet, cleared the lock, set `aria-expanded="false"` and returned focus to the trigger. <br>• A keyboard open (`detail: 0`) focused «العربية». |
| 1024×768 | Unchanged dropdown: 480px absolute panel, no backdrop or close button, no scroll lock |

### Not verified

- The hosted build after push.
- Real touch devices and iOS safe-area insets.
- LTR/English.
- A multi-currency store (the currency row inside the sheet).
- 320px width.
- Chrome.

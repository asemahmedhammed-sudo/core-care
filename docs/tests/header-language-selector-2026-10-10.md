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

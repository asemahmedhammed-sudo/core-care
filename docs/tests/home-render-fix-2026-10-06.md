# Homepage render failure fix — 2026-10-06

Symptom: the development draft homepage returned only `<!-- Error In This View! () -->` (HTTP 200, 32 bytes). Cart, brands, products and offers rendered.

## Isolation (native Chrome, development theme "ثيم العناية - تطوير" only)

Pushes alone did not refresh the draft (version ID unchanged, old revision tag). Each revision was synced with `salla theme preview -o -s "Core Care"` from a clean clone of `origin/main`; the CLI's later watch step failed on the known `ERR_PNPM_ABORTED_REMOVE_MODULES_DIR_NO_TTY`, and its local servers were stopped. A fresh draft was then opened from the store's طلبات تطوير الثيمات → تخصيص الثيم. Each served revision was confirmed via `theme_asset_revision` on the cart page.

| Commit | Served marker | Draft | Homepage |
|---|---|---|---|
| `19e4cca` promotions include commented out | `20261006-home-diag-1` | `draft-246814250` | Renders (59 KB) — failure isolated to `promotions.twig` |
| `22d7eb2` + type probe (`is iterable`/`is null` only) | `20261006-home-diag-2` | `draft-712528948` | Renders; `beauty_promo_N_title` and `_button_label` are **iterable**, other promo settings scalar, `beauty_promotions_interval` null |
| `462f071` fix, include restored, probe removed | `20261006-home-render-fix-1` | `draft-2111164464` | Renders (64 KB), 3 promotion slides, no error |

## Cause and fix

The multilanguage settings `beauty_promo_N_title` and `beauty_promo_N_button_label` are delivered as per-language arrays. `promotions.twig` applied `|trim` to them, which aborted the homepage view. The fix resolves `value[language.code]` (falling back to the first value) before `|trim`, matching `components/home/brands.twig`. The earlier regex replacement (`15e2b6f`) was not the cause; its plain-operator link validation is kept.

## Checks

- `pnpm build`: passed (existing 9 warnings).
- `pnpm test`: passed, 65 tests and 13/13 static audit checks. New regression test fails against the broken `15e2b6f` template.
- Editor screenshot at the default desktop editor width showed header, promotion slider and following product section.

## Final verification of `462f071`

Environment: native Chrome (Claude in Chrome), fresh draft `draft-2111164464`, labelled ثيم العناية - تطوير, serving `20261006-home-render-fix-1` on both homepage and cart. Exact widths used same-origin iframes of the hosted preview page, because the Chrome window could not be sized to them directly. No merchant setting was changed.

### Hosted, Arabic/RTL

| Check | 1440 | 390 | 320 | Result |
|---|---|---|---|---|
| Page width = viewport, elements past edge | 1440 / 0 | 390 / 0 | 320 / 0 | Pass |
| Slider frame / artwork | 1440×480 / 1392×464 | 390×138 / 366×122 | 320×115 / 296×99 | Pass; 3:1 ratio kept |
| Navigation bottom → slider | — | 0px | 0px | Pass |
| Slider → next section / its heading | 36 / 43px | 24 / 31px | 24 / 31px | Pass (24–40px rule) |
| Arrows | 44×44, inside frame | 44×44 | 44×44 | Pass |
| Dots | centered (0px), inside artwork | same | same | Pass |

- Navigation (top-level page): next 0→1, previous 1→0, third dot →2 with live status text; next disabled on the last slide (boundary arrows). Pass.
- Links: slides link to `/offers`, `/latest-products`, `/brands`; each returns 200. No CTA rendered because no URL is configured. Pass.
- Autoplay: `data-promotion-autoplay="true"`, interval attribute `6`. The test page was a background tab (`document.hidden` true), so the carousel correctly stayed paused there. With `document.hidden` overridden in a test iframe: 1→2 after 6000ms, wrap 2→0 after 7001ms. The extra ~1s is consistent with Chrome throttling timers in background tabs. Pass, with that caveat.
- One iframe capture at 390px showed the page scrolled down once (scrollY 57 at ~7s). Four instrumented reruns logged no scroll, `scrollIntoView`, `focus` or `scrollTo` calls. Not reproduced; not attributed to the slider.

### English/LTR

- Hosted: **not verifiable**. The store's languages list only Arabic, and `/corecare/en` returns 410. Enabling English is a merchant setting and was not changed.
- Simulated LTR layout (hosted page with `dir="ltr"` forced in a test iframe) at 1440/390/320: previous arrow on the left, next on the right, dots centered, no overflow, next advances. Partial evidence only.

### Multilingual value fixtures (local, reversible)

The repository `promotions.twig` was rendered with twig.js 1.17.1, installed in a scratch directory outside the repo, using stubbed `theme.settings.get`, `trans`, `link` and `asset`. Language arrays were given ordered keys so `|first` behaves like PHP arrays.

| Case | Result |
|---|---|
| Populated `{ar, en}`, language ar / en | Pass: label, `<h2>` and CTA use the current language |
| Empty strings, whitespace-only, `null` | Pass: translated default title, no `<h2>`, default CTA label |
| Current language key missing (en with only ar) | Pass: falls back to the first value |
| Current language `null` (ar null, en set) | Pass: translated default; it does not switch to English |
| Legacy plain string | Pass: trimmed |
| Invalid URL | Pass: no CTA |

The pre-fix `15e2b6f` template fails the populated cases: twig.js prints `[object Object]`, and Salla's PHP Twig aborts the view. twig.js is not Salla's renderer, so these results support but do not replace hosted verification.

### Code changes

None. Tests were not rerun because no code changed after `462f071`.

## Remaining

- English/LTR on Salla needs English enabled for the store.
- Configured (non-default) titles and CTA buttons were not seen on Salla, because the merchant has none configured.
- Real foreground autoplay timing, touch swipe, and `prefers-reduced-motion` were not exercised on Salla.
- Tracked separately: the official CLI watcher fails with `ERR_PNPM_ABORTED_REMOVE_MODULES_DIR_NO_TTY`. The draft sync still completed, so this did not block verification.

No merchant setting, live-store theme or publication was changed.

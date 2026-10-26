# Phone «حسابي»: language and currency switch in place — 2026-10-26

## Change

The account sheet's «اللغة والعملة» row opened the header's language panel. On phones that panel is a bottom sheet that sat behind the tab bar: the owner's screenshot shows «العربية» with the next option cut off. The owner asked for the change to happen inside the account sheet without another menu.

Now the sheet has two rows:

- **اللغة** (multilingual stores): a segmented switch with the store's languages from `Salla.config.languages()` (for example العربية | English). One tap stores `s-lang` and loads the same page in that language, as `salla-localization-modal` does (shared `switchLanguage()` in `core-care-language-menu.js`).
- **العملة** (stores with currencies enabled): the same switch with currency codes from `Salla.config.currencies()`. One tap calls `Salla.currency.api.change(code)`, stores `s-curr` and reloads, as the modal does.

The chosen option is black on a pale grey track (`--cc-text` / `--cc-utility-surface`). Options are at least 40px tall inside a 44px track. A row with fewer than two options hides itself. Long lists wrap under the label. The current language code shows before Salla's list arrives. A second tap while switching is ignored.

The tab bar handler that opened the header panel from `[data-cc-localization-open]` is removed; nothing uses that attribute now.

- Source revision: `328ef8a` on `feature/bilingual-images`, pushed to GitHub.
- New: `src/assets/js/partials/core-care-locale-switch.js`, `scripts/account-locale-switch.test.mjs`. New strings: `beauty.header.currencies_error` (ar/en).
- Merchant settings: none changed. `docs/MERCHANT_GUIDE.md` updated.

## Repository checks

| Check | Result |
|---|---|
| `pnpm build` | Passed. Warnings: existing Sass `@import` deprecations and bundle size only |
| `pnpm test` | Passed, 133/133 |
| `git diff --check` | Clean |

## Local tooling (not Salla)

A static copy of the sheet markup with the production `public/app.css` and `public/main-menu.js`, served from localhost, with a stand-in `window.Salla` (ar/en, SAR/USD, or five currencies). Viewed in the Claude built-in browser.

| Case | Result |
|---|---|
| 390×844 RTL, ar/en + SAR/USD | Each switch sits at the row's inline end; selected option black. No horizontal overflow |
| 390×844 RTL, five currencies | Switch wraps under «العملة», full row width, no overflow |
| 320×700 RTL, five currencies | Switch wraps to two lines inside the card (86px), no overflow |
| 390×844 LTR | Mirrored: label at start, switch at end |
| One language only | Language row `hidden`, 0px height |
| Tap «English» | Navigated to `?lang=en` |
| Tap «USD» | Called the currency change stub, then reloaded |

This shows CSS and script behaviour against stand-in data only. It does not prove Salla's real language/currency data, the URL rewrite on the real store, or the currency API on Salla.

## Salla development preview: incomplete

- `yes n | salla theme preview -s "Core Care" -o -E` (CLI 3.2.63) created draft `draft-1119526491`. Prompts answered "no"; the CLI made no commit. Watchers stopped; `pnpm build` restored `public/`.
- `salla.design/themes/draft/1119526491/app.css` returned 404 (no hosted assets).
- jsDelivr copy of `328ef8a`: `app.css` has `cc-account__choice`, `main-menu.js` registers `core-care-locale-switch`, `mobile-account.twig` uses it.
- Claude in Chrome was refused on `s.salla.sa` earlier the same day ("Host access is restricted by policy"), so the draft was not inspected.

## Not tested

- The rendered sheet on Salla at 390px and 320px, Arabic and English.
- Real language switch and currency change on the Salla draft; whether this store has currencies enabled.
- Public storefront: unchanged until the owner publishes a new Core Care version.

## How the owner can check

Open `s.salla.sa/design/draft-1119526491?legacy=0&with_editor=false&assets_url=https://cdn.jsdelivr.net/gh/asemahmedhammed-sudo/core-care@328ef8a66f22152cad0bc3056fd21515095c68f3/public` at phone width, tap «حسابي», then tap «English» in the «اللغة» row.

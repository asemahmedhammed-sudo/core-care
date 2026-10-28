# «حسابي» language row: Salla SDK race — 2026-10-28

## Report

Owner's phone screenshot of the guest «حسابي» sheet, showing the list layout of the published version, not the regrouped draft: the language row read «تعذّر تحميل اللغات، حاول مرة أخرى.» instead of the store's languages.

## Cause

- Salla's page has an inline stub that defines `Salla.onReady` (resolving on `twilight::initiated`). The SDK itself (`twilight.esm.js`) loads `async`. The theme's `main-menu.js` loads `defer` and registers `<core-care-locale-switch>`.
- The switch's language path (`storeLanguages()` in `core-care-language-menu.js`) and its currency path checked `Salla.config.languages` / `Salla.config.currencies` before awaiting `Salla.onReady()`. When the SDK ran after `main-menu.js` (slow network, cold cache: common on phones), `Salla.config` did not exist yet, so the row failed at once. It never retried, and the "try again" text had no action.
- The header language menu shares `storeLanguages()` but loads only when opened, by which time the SDK has usually run.

## Change

- `sallaReady()` awaits `Salla.onReady()` first. `storeLanguages()` and the currency path check `Salla.config` only after it.
- The error message is now a button: tapping it loads the options again.
- Source: working tree on `feature/bilingual-images` after `a2c6a84` (uncommitted at test time).

## Repository checks

| Check | Result |
|---|---|
| `pnpm build` | Passed. Warnings: the existing Sass deprecations and bundle-size notices only |
| `pnpm test` | Passed, 139/139. The new test starts with no `Salla.config` and supplies the SDK after the request has begun; the previous code fails it |
| Static audit | 13/13, `docs/evidence/technical/static-audit.json` |

## Public storefront, read-only (Claude built-in browser, phone viewport)

- `corecare-sa.com/ar`: `body.theme-beauty cc-has-tabbar`, assets from `themes/523702774/1.10.0/`. Script order: `main-menu.js` defer, `twilight/3.0.14/twilight.esm.js` async. The inline `Salla.onReady` stub is present.
- On that load the SDK happened to arrive first, and the row showed العربية / English. The failure depends on timing.

## Local reproduction (not Salla)

A static page with Salla's inline stub copied from the public store, the sheet's language row, `app.css`, and a stand-in SDK that sets `Salla.config` and fires `twilight::initiated` 1.5 s after load. Served from 127.0.0.1 and viewed in the Claude built-in browser.

| Bundle | Before the SDK | 3 s later |
|---|---|---|
| Published `1.10.0/main-menu.js` | «تعذّر تحميل اللغات، حاول مرة أخرى.» | Same message, no retry |
| This build's `public/main-menu.js` | `AR` (current language) | العربية (pressed) / English |

## Untested

- The retry button after a real request failure, in a browser. The unit test covers its wiring only. Salla's `languages()` remembers a failed attempt and may then return an empty list, which hides the row.
- The fix on the Salla development preview and on a real phone. The public store keeps 1.10.0 until the owner publishes a new version.
- The currency row (currencies are not enabled on the store, so it did not render).

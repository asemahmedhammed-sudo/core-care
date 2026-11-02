# Phone «حسابي» sheet: scrolling and regrouping — 2026-10-27

## Report

Owner's phone screenshot of the public store (`corecare-sa.com/ar`, Core Care theme, signed in): the cards were cut off mid-row, and the support row, the rest of the footer pages and sign-out could not be reached or scrolled to.

## Cause

`.cc-account__body` is a scrolling flex column. Its cards have `overflow: hidden`, so their automatic minimum height is 0, and with the default `flex-shrink: 1` they were squeezed to fit the screen height. The rows were clipped inside the cards, and the body never overflowed, so it had nothing to scroll.

## Change

- `.cc-account__body > * { flex: none; }`: blocks keep their full height, and the body scrolls to all of them.
- Regrouped for phones: profile, then a row of quick-access tiles (orders, wishlist, wallet when Salla allows it, notifications; two tiles for guests, which open Salla's login), then «التفضيلات» (language and currency), then «المساعدة والمعلومات» (customer service and the footer menu in one card), then sign-out, «تابعنا» and the legal lines.
- New strings `beauty.account.preferences` and `beauty.account.help` in `ar.json` and `en.json`.
- Empty groups release their space: preferences when both locale rows hide themselves, help when there are no contacts and no footer menu items. Row hairlines now appear only between visible rows.
- Source: commit `0a1a7c3` on `feature/bilingual-images` (the local check ran on the same change before it was committed).

## Repository checks

| Check | Result |
|---|---|
| `pnpm build` | Passed. Warnings: the existing Sass deprecations and bundle-size notices only |
| `pnpm test` | Passed, 138/138, including a new regression test for the shrink bug and the group order |
| Static audit | 13/13, `docs/evidence/technical/static-audit.json` |

## Local tooling (not Salla)

Hand-rendered static copy of the signed-in sheet with the production `public/app.css`, sample data (9 footer-menu items, 3 contacts, 3 social links), served from 127.0.0.1 and viewed in the Claude built-in browser.

| Viewport | Direction | Result |
|---|---|---|
| 360×740 | RTL | Scroll area 620px, content 1234px; every block at full height (0 clipped cards); scrolled to the end, the tax line sits 24px above the tab bar; no horizontal overflow |
| 320×568 | LTR | Scroll area 448px, content 1256px; 0 clipped cards; four tiles 72×92px each; no horizontal overflow; layout mirrored |

This checks the CSS only. It does not prove Twig rendering, Salla's `salla-contacts` / `salla-menu` / `salla-social` markup, login/logout or the tab bar on Salla.

## Salla development preview: incomplete

- Commit `0a1a7c3` pushed to GitHub on `feature/bilingual-images`.
- `yes n | salla theme preview -s "Core Care" -o -E` (CLI 3.2.63) created draft `draft-1164972317`. It made no commit. The CLI was stopped, no watcher processes were left, and `pnpm build` restored `public/` (tracked tree clean).
- The draft's hosted CSS `salla.design/themes/draft/1164972317/app.css` returned 404, as with the drafts on 2026-10-26.
- The pushed build `cdn.jsdelivr.net/gh/asemahmedhammed-sudo/core-care@0a1a7c3…/public/app.css` returned 200 and contains `.cc-account__body>*{flex:none}` and the `.cc-account__tiles` rules.
- Claude in Chrome was not connected. In the Claude built-in browser, `s.salla.sa/design/draft-1164972317?legacy=0&with_editor=false&assets_url=<jsDelivr @0a1a7c3>/public` opened the editor briefly, then redirected to Salla's sign-in page, which rendered blank. No storefront frame loaded.
- So the sheet on the draft (`body.theme-beauty`, asset URL, rendering, scrolling) is **unverified** on Salla.

### Second attempt, same day, after the owner signed in to Salla in the built-in browser

- The same draft address redirected to `s.salla.sa/auth` again, which showed Salla's account chooser with the Core Care account remembered. No editor or storefront frame loaded.
- Choosing that account left it on a spinner, and Salla's Cloudflare widget at the foot of the page reported that verification failed. The check was not attempted or retried. Platform verification stays **incomplete**.

### Third attempt, same day, after the owner reported passing the check and signing in

- In the built-in browser, both the draft address and the dashboard home `s.salla.sa/` redirected to `s.salla.sa/auth`, which rendered blank. The pane had no signed-in Salla session, so no editor or storefront frame loaded. Platform verification stays **incomplete**.

## Public storefront

Unchanged. The owner's screenshot came from the published Core Care version; the fix reaches visitors only after this change is pushed, checked in the development preview, and a new version is published by the owner.

## Untested

- The sheet on the Salla draft at 390px, 320px and 768px, RTL and LTR, signed in and as a guest.
- Customer service opened (`<details>`) with real Salla contacts; locale rows hiding themselves with a single option.
- The opening animation and focus on real devices (iOS Safari, Android Chrome).

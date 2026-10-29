# AI shopping, phase 1 — 2026-10-29

Builds on `webmcp-tools-2026-10-28.md` (theme WebMCP tools and Salla's Twilight 3 findings).

## Change

1. **One tool set per page.** `chooseToolSet()` in `core-care-webmcp.js`: when Salla renders `webmcp.enabled` (Twilight 3 `salla.webmcp`), the theme either switches Salla's duplicates off for the page with `salla.webmcp.disable()` and keeps its own set (new setting `core_care_webmcp_theme_first`, default on), or registers only `corecare_list_categories`, `corecare_add_to_wishlist` and `corecare_open_cart_page` next to Salla's eight. When Salla's tools are off (the case on corecare-sa.com on 2026-10-28) nothing changes. `salla.webmcp.disable()` is a public method of the SDK object but is not described in Salla's README.
2. **AI activity bar with undo.** `core-care-ai-activity.js` + `pages/partials/ai-activity.twig` (in `master.twig`, only when `core_care_webmcp` is on). Write tools report each change: add (undo deletes the new line or restores the previous quantity), quantity change (restores it), remove (re-adds product and quantity; no undo for lines with options/files/notes), coupon (`deleteCoupon`), wishlist (`wishlist.remove`). `role="status"`, polite live region, 44px targets, 10 s auto-hide that pauses on hover/focus, Escape closes, reduced motion respected, WhatsApp button hidden while it shows, sits above the phone tab bar.
3. **«اسأل الذكاء الاصطناعي» on the product page.** Collapsed disclosure after Description/Specifications (`core_care_ask_ai`, default on), `pages/partials/ask-ai.twig` + `ask-ai.js` (3.9 KB, loaded only on product pages with the setting and on the AI page). Four suggested questions or a typed one; opens ChatGPT (`chatgpt.com/?q=`), Claude (`claude.ai/new?q=`) or Perplexity (`perplexity.ai/search?q=`), or copies the prompt. In Salla's mobile app it calls `salla.mobile.openBrowser({ url })` (Twilight 3 mobile bridge) to leave the webview. Last used assistant is remembered in `localStorage`.
4. **«تسوّق بمساعدك الذكي» page.** `pages/partials/ai-shopping.twig`, rendered by `page-single.twig` for the page id in `core_care_ai_page_id`, with the merchant's editor text injected from `page-single` (no new `|raw` in custom templates). Three ways (ask / connect via Salla's `/mcp` Storefront MCP with copy button / browser WebMCP with live support status), try-it panel with six store requests, can / cannot list. Footer «روابط سريعة» gets the link when the id is numeric.
- Translations: `beauty.ai_activity`, `beauty.ai_ask`, `beauty.ai_page`, `beauty.footer.ai_shopping` in `ar.json` and `en.json` (three-level keys like the rest of the theme). Styles: `06-beauty/core-care-ai.scss`.
- Working tree: branch `feature/bilingual-images`, uncommitted, together with the 2026-10-28 WebMCP work. The owner's pre-existing untracked records were left untouched.

## Repository checks

| Check | Result |
|---|---|
| `pnpm build` | Passed. Warnings: existing Sass deprecations and bundle size only. `public/webmcp.js` 16.8 KB, `public/ask-ai.js` 3.9 KB |
| `pnpm test` | Passed, 157/157 (new `scripts/ai-shopping.test.mjs`, 9 tests; `scripts/webmcp.test.mjs` 9) |
| Static audit | 13/13. A first run failed `no-raw-in-new-custom-templates` for `page.content|raw` in the new partial; moved to `page-single.twig` |
| `git diff --check` | Clean |

## Local tooling (not Salla)

Static pages generated from the real partials (Twig tags substituted by a script, locale strings from `ar.json`/`en.json`) with the production `public/app.css`, `webmcp.js` and `ask-ai.js`, served on 127.0.0.1 and viewed in the Claude built-in browser (not Chrome). The browser pane was hidden, so some screenshots lagged; values were read from the DOM.

| View | Result |
|---|---|
| Product, Arabic, 390×844 | Disclosure open: chips wrap, field, three assistant buttons (ChatGPT preferred), copy full width. No horizontal overflow. Links carry the encoded prompt |
| Activity bar, 390 | 358×102 px, message row then Undo / View cart / Close; Undo runs the change's undo and shows «تم التراجع…»; coupon notice without undo hides the button; Close hides the bar |
| AI page, Arabic, 390 and 1440 | No overflow. MCP address `https://corecare-sa.com/mcp` shown; status «لا يدعمها بعد» (no WebMCP in this browser). Desktop: three 337 px cards in a row; section gaps 32 px |
| Product, English, 390 | LTR layout, typing a question clears the chips and goes into the prompt |

This shows CSS, layout and component behaviour only. It does not prove Twig rendering on Salla, the real product page layout around the disclosure, the cart drawer opening from «عرض السلة», or the tab bar offset.

## Salla development preview: not run

Needs a commit and push first (the preview sends the pushed HEAD). Not authorized yet.

## Untested

- Real Salla preview at 1440/390, RTL/LTR: the product disclosure among the real neighbours, the AI page with a merchant page id, footer link, `salla-breadcrumb`.
- Opening each assistant link on iPhone and Android (app installed and not), and inside Salla's mobile app (`openBrowser`).
- Chrome with WebMCP enabled and a real agent: activity bar and every undo against real Salla cart responses; `salla.webmcp.disable()` with Salla's tools turned on.
- Connecting `/mcp` as a custom connector in ChatGPT and Claude.

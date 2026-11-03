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

## Salla development preview: incomplete (2026-10-29)

- Source: commit `f0a91a6` pushed to `feature/bilingual-images`. `yes n | salla theme preview -s "Core Care" -o -E` created draft `950559941`; the CLI made no commit. Watchers were stopped and `pnpm build` restored `public/` (clean).
- Draft assets: `salla.design/themes/draft/950559941/{app.css,app.js,webmcp.js,ask-ai.js}` return 200 and are byte-identical to the local production build (`cmp`). This is the first draft since 2026-10-26 with hosted assets. jsDelivr `@f0a91a6…/public` serves the same files.
- Claude built-in browser: blank Salla sign-in page; the editor did not load.
- Claude in Chrome: the draft editor «تخصيص الثيم» loaded signed in. JavaScript, screenshots and clicks on `s.salla.sa` are refused with "Host access is restricted by policy" (a Chrome policy, not the site permission). The accessibility tree shows the editor shell only, not the storefront frame. Opening `s.salla.sa/design/draft-950559941` redirected back to the editor.
- The owner set `core_care_ai_page_id` to `1741544897` (returns-policy page) in the draft only and opened «فتح المعاينة في تبويب جديد». That tab opened outside the Claude tab group, so it could not be read.

- The owner then tested on the Partners demo store (`demostore.salla.sa/dev-…`). Its HTML loads `cdn.assets.salla.network/themes/523702774/1.11.0/app.css?v=20261022-quick-links-3` (published 1.11.0, `theme-beauty`), with no `webmcp.js` and no `core-care-ai-activity`, also with `?preview=true`. So the demo store was not showing draft `950559941`, and the feature could not appear there. Read in Chrome through the accessibility tree only (JavaScript is policy-blocked on `demostore.salla.sa` and `corecare-sa.com` too). The product grids rendered no product links in the tree, and the cart drawer stayed on «جارٍ تحميل السلة…»; this was not investigated.

- 2026-10-31: the Claude built-in browser runs JavaScript on Salla pages (unlike the extension), but the merchant session did not persist: `s.salla.sa` and the draft redirect to a blank `/auth` with Cloudflare's challenge script, after the owner signed in. `portal.salla.partners` showed its login page in both browsers after the owner reported signing in to Partners. The owner's console run of `document.querySelector('iframe').src` in the draft tab returned null (no preview frame on that page).

Result: the draft serves the new build, but the rendered product page and AI page were **not** inspected on Salla. Platform visual verification is incomplete. The live store `corecare-sa.com` is unchanged (published version 62497446).

## Untested

- Real Salla preview at 1440/390, RTL/LTR: the product disclosure among the real neighbours, the AI page with a merchant page id, footer link, `salla-breadcrumb`.
- Opening each assistant link on iPhone and Android (app installed and not), and inside Salla's mobile app (`openBrowser`).
- Chrome with WebMCP enabled and a real agent: activity bar and every undo against real Salla cart responses; `salla.webmcp.disable()` with Salla's tools turned on.
- Connecting `/mcp` as a custom connector in ChatGPT and Claude.

## Defect found by the owner (2026-10-31)

The owner's desktop screenshot of the demo-store footer showed no «تسوّق بمساعدك الذكي» link. Cause: commit `f0a91a6` added the link only to the phone link groups (`core-care-footer__nav`); from 768px the classic columns (`core-care-footer__classic`) show instead and had no link. Fix in the working tree: one `ai_page_valid` check feeds both footers, and the classic «روابط سريعة» column gets the link. `pnpm build` passed; `pnpm test` 157/157 and audit 13/13 passed; `public/` unchanged (Twig only). Not yet pushed or previewed; draft `950559941` still has the phone-only link.

Fix pushed as `4a90520` on 2026-10-31 and previewed as draft `2057203207` (`yes n | salla theme preview -s "Core Care" -o -E`; no CLI commit; watcher stopped; `pnpm build` restored `public/`, clean). Hosted draft assets returned 404 after two minutes; jsDelivr `@4a90520…/public` serves `app.css`, `webmcp.js` and `ask-ai.js` byte-identical to the build. Rendering on Salla not yet inspected.

## Status check (2026-11-02)

- Public store: published `1.11.0` has no `webmcp.js` or `ask-ai.js`, and `theme_settings_list` for version `62497446` has no `core_care_*` setting. The theme's AI features cannot be switched on there until a new version is published.
- Draft `2057203207`: hosted `app.css`, `main-menu.js`, `webmcp.js` and `ask-ai.js` now return 200 and are byte-identical to the local build. Rendering still not inspected.
- Salla's `https://corecare-sa.com/mcp` (curl, read-only): `initialize` returned 200 with no sign-in, 16 tools listed in `/.well-known/mcp.json`, and `catalog-product-search` with `keyword` returned products. For «واقي شمس» the first result was a Flormar blusher, so check result relevance. No cart or checkout tool was called. Not connected from ChatGPT or Claude.
- `core_care_ai_page_id` is checked before the policy design in `page-single.twig`, so setting it to `1741544897` (the returns page) renders that page as the AI page. Use a page created for this.

## Owner's walkthrough in the development preview (2026-11-03)

Draft `2057203207` in the Salla theme editor (`s.salla.sa/themes/editor/draft-2057203207`, marked «غير منشور»), desktop, the owner's browser, seen through the owner's screenshots. Not the public storefront.

- Product page: «اسأل الذكاء الاصطناعي عن هذا المنتج» sits after «الوصف» and «المواصفات». Four questions, the typed-question field, ChatGPT / Claude / Perplexity and copy all render.
- Picking the first question and pressing ChatGPT opened ChatGPT with the store name, question, product name and `salla.design/ar/corecare/…/p195141722` link, and ChatGPT answered from the page. Its answer noted that no currency symbol was readable next to the price (23).
- Open defect: the ChatGPT button rendered with no border and no fill. `.is-preferred` should make it `#222` with white text. Cause not found; the hosted `app.css` contains the rule.
- Still untested: phone width, English, Claude and Perplexity buttons, copy, typed question, the AI page, footer link, WebMCP, and the public link once published.

2026-11-04: the owner chose the Partners demo store for the rest of the test (`version_id=655072349`, «fashion» logo, page «اسأل الذكاء» `1409830557`). Its editor frame returned `422 Twilight Error: File [src/views/pages/page-single.twig] Not Found` under «ثيم كوركير - تطوير / غير منشور». The file exists at `HEAD`, `origin/main`, `4a90520` and tags `1.11.0` and `1.11.5`. The same error class recovered on reload on 2026-10-03 (`product-gallery-2026-10-03.md`), so it points to Salla's side, not proven.

Later on 2026-11-04 the error cleared and the demo store's AI page rendered its «جرّب الآن» section in the owner's desktop screenshot: six requests, typed-question field, ChatGPT (black, as designed), Claude, Perplexity and copy. Only that section was seen. Not yet checked: the rest of the page, the footer link, phone width, English, and the ChatGPT button's appearance on the product page again.

## AI page redesign (2026-11-04, working tree on `feature/bilingual-images`, uncommitted)

Owner's request: make the page smarter and easier, with icons that lift the design.

- **Order.** The request panel moved to the top beside the introduction, so a shopper can ask without scrolling. On phones it comes before the promises, and the main button sits inside the first screen at 390×844. Then «كيف تعمل؟» (three steps), a tip linking to products, the optional ways, and the can / cannot list.
- **Technical ways collapsed.** Connector and browser assistant are `<details>`. `initAiPage` opens the browser way only when the browser has WebMCP.
- **Accuracy.** The top promise «كل تغيير يظهر لك ويمكنك التراجع عنه» is gone: it describes only the browser assistant, not ChatGPT links. The can / cannot list now says it applies when an assistant is connected.
- **Icons.** New `pages/partials/ai-icon.twig`, one line style. Each suggested question has its own icon, also on the product page panel. Assistant links carry an external-link icon, mirrored in RTL. No assistant logos were drawn from memory.
- **Button fix.** `.is-preferred` and the activity bar's undo now use `--cc-text` instead of `--cc-action`, as the language menu already does, because a merchant palette can make the action colour white. This is the likely cause of the unstyled ChatGPT button on the product page; it needs confirming on Salla. On phones the last-used assistant is a full-width main button.
- **Locale keys.** `beauty.ai_page` changed in `ar.json` and `en.json`; unused keys were removed. No setting ID changed. `theme_asset_revision` is now `20261104-ai-page-2`. `docs/MERCHANT_GUIDE.md` updated.

| Check | Result |
|---|---|
| `pnpm build` | Passed, with the existing warnings |
| `pnpm test` | Passed, 159/159 (two new tests) |
| Static audit | 13/13 |
| `git diff --check` | Clean |

Local tooling, not Salla: the real partials rendered through a small script with sample data and the production `app.css` and `ask-ai.js`, in headless Chrome for Testing.

| View | Horizontal overflow | Section gap | Clipped or under-44px controls |
|---|---|---|---|
| Arabic 1440, 768, 390, 320 | None | 32px | None |
| English 1440, 390 | None | 32px | None |
| Product panel, Arabic 390 | None | n/a | None |

That browser reports WebMCP as available, so its browser way shows open with the ready message. The collapsed case is covered by a unit test only. The render did not include the real header, footer, breadcrumb or Salla fonts.

Pushed as `a07dedf` on `feature/bilingual-images` on the owner's instruction, then previewed as draft `539771283` (`yes n | salla theme preview -s "Core Care" -o -E`; no CLI commit; watchers stopped; `pnpm build` restored `public/`, clean). Hosted draft `app.css` and `ask-ai.js` returned 404 right after creation. jsDelivr `@a07dedf…/public` serves both byte-identical to the build.

Platform verification: **incomplete**. The draft's rendering has not been inspected. Untested on Salla: every view above, the merchant text under the top section, and the ChatGPT button on the product page. The public store is unchanged.

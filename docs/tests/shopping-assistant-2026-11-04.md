# Shopping assistant on phones — 2026-11-04

## Change

The tab bar's centre slot gets a glowing button (`core_care_assistant`, default on) that opens a full-screen sheet on phones. The sheet greets the shopper, offers ready needs, and has a search field. Products come from Salla's search and lists. "Add" runs the theme's `add_to_cart` tool, so the activity bar shows the change with an undo. Requests with no results can be sent to ChatGPT, Claude or Perplexity.

There is no AI model in this phase. Typed text becomes search words through a small list of needs (`searchTerms`), and the screen does not claim otherwise.

- Source: `core-care-assistant.js`, `shopping-assistant.js`, `shopping-assistant.twig`, `core-care-assistant.scss`, `ai-icon.twig`, `beauty.assistant` in both locales, one new setting in `twilight.json`.
- Compatibility: while on, the assistant replaces the campaign button in the centre slot. Saved campaign settings are kept and apply again when it is switched off. No setting ID changed.
- Working tree: branch `feature/shopping-assistant` in `.claude/worktrees/shopping-assistant`, from `origin/main` at `f127b4f`, uncommitted. Another session was editing the main checkout, so this work was kept apart.

## Defects found and fixed

- **Prices missing from search results.** Salla's search returns `{ amount, currency }`, while its lists return numbers. `compactProduct` dropped those prices, which also affected the published-to-`main` `corecare_search_products` tool.
- **Undo on real cart lines.** Salla cart line ids such as `4212045484595198151` exceed what a JavaScript number holds, and the tools converted them with `Number()`. This is the likely cause of the failed undo below. Ids now stay as Salla sent them. Covered by a unit test with a long id; **not yet confirmed against a real cart**.
- **Options.** Search results do not say which products need options. When "add" reports required options, the button becomes a link to the product page.

## Incident: one real guest cart on the live store

While testing add and undo on `corecare-sa.com` in a throwaway headless browser, I replaced `salla.cart.addItem` and related methods from the page to avoid touching the store. The assignment silently did not take effect (`salla.cart.addItem === stub` is false, with no error), so the real method ran.

- Effect: one guest cart with one Tanino 6.3 dye, 23 SAR. Salla's report for 2026-11-04 shows `carts: 1`, `cart_value: 23`, `abandoned_carts: 0`. The abandoned-cart list did not change. No customer, order or payment is involved.
- The real undo then failed with «تعذّر التراجع. راجع سلتك.», so the line stayed. That browser profile is discarded, and there is no tool to delete the cart. Today's cart figures include this one.
- A second add (mascara) stopped at the required-options check before any cart call.
- Rule from now on: do not press add, update or remove against the live store. Test cart behaviour on the demo store, with authorized test data.

## Repository checks

Run in the worktree with the direct tools, because pnpm's dependency check fails on the worktree's symlinked `node_modules`.

| Check | Result |
|---|---|
| `webpack --mode production` | Passed, with the existing warnings |
| `node --test scripts/*.test.mjs` | Passed, 171/171 |
| `node scripts/audit-theme.mjs` | 13/13 |

`public/shopping-assistant.js` is about 27 KB (9.3 KB gzipped) and loads on every page while the setting is on. Other bundles differ in a worktree build only by module ids, so they were restored. A final `pnpm build` belongs in the main checkout after merging.

## Local tooling on the public page (not a Salla preview)

The real partial, this build's `app.css` and bundle, added to `corecare-sa.com/ar` inside a throwaway headless browser at 390×844, Arabic. Salla's real search answered.

| Input | Result |
|---|---|
| Chip «أحمر شفاه» | 5 products with images and prices |
| «شعري متقصف وش يناسبه» | 11 serum and protein products |
| «احمر شفاه» (no hamza) | 5 products |
| «ابغى مسكارا» | 6 mascaras |
| «صبغة شقراء» | 12 hair dyes |
| «ابغى شي لبشرتي الجافة» | No products, honest message, send-to-assistant links |

No horizontal overflow, no control under 44px, no page errors, Escape closes and releases the page.

## Findings for the owner

- Search words: «مرطب» and «واقي شمس» find no moisturiser or sunscreen. The catalogue is hair care and makeup, while the store title promises skin care.
- `salla.product.search` matches exact words and is sensitive to hamza: «احمر شفاه» finds nothing and «أحمر شفاه» does.

## Salla development preview: not run

Nothing is pushed, so no draft has this. Platform verification is **incomplete**.

## Untested

- Add, undo and cart badge against a real cart on the demo store.
- The sheet in Twig on Salla, signed in (greeting with name), English, 320px.
- The English needs use Arabic search words; results on `/en` were not checked.
- Stacking with the categories panel, account sheet and WhatsApp button on Salla.
- Public storefront: unchanged until the owner publishes a new version.

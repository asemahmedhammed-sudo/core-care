# WebMCP store tools — 2026-10-28

## Change

The theme now registers WebMCP tools (`document.modelContext.registerTool`, falling back to `navigator.modelContext` on Chrome 146–149) so in-browser AI agents can shop the store through structured calls instead of screen scraping.

- Source: `src/assets/js/partials/core-care-webmcp.js` (tools and helpers), `src/assets/js/webmcp.js` (entry), new webpack entry `webmcp`, deferred `<script>` in `src/views/layouts/master.twig` behind the new boolean setting `core_care_webmcp` (default on) and optional text setting `core_care_webmcp_trial_token` in `twilight.json`.
- Tools (all `corecare_` prefixed, same-origin only, no `exposedTo`): `search_products`, `get_product`, `list_categories`, `view_cart` (read-only hint); `add_to_cart`, `update_cart_item`, `remove_cart_item`, `apply_coupon`, `add_to_wishlist`, `open_cart_page`.
- Every call goes through the Twilight SDK (`salla.product.search/getDetails/categories`, `salla.cart.details/addItem/updateItem/deleteItem/addCoupon`, `salla.wishlist.add`, `salla.url.get('cart')`). No checkout, payment, order or profile access. Required product options are checked before `addItem`. Output stays within Chrome's 1.5K-character guidance.
- References: Chrome WebMCP docs (imperative API, best practices, tool security) and the W3C WebMCP draft, read 2026-10-28.
- **Correction (same day):** web search found no Salla WebMCP page, but Salla does ship WebMCP. Twilight SDK `3.0.0` (npm, 2026-10-20) added `salla.webmcp` with 8 tools: `search_products`, `get_product`, `get_cart`, `add_to_cart`, `update_cart_item`, `remove_cart_item`, `apply_coupon`, `go_to_checkout`. It is off unless the store config has `webmcp.enabled` (platform setting `themes::webmcp.enabled` / `TWILIGHT_WEBMCP_ENABLED`, not a theme setting). Source: the package README and `dist/esm/index.js` of `@salla.sa/twilight@3.0.15`, read locally, not executed.
- Public storefront check (curl, 2026-10-28): `corecare-sa.com` serves Core Care `1.11.0` with Salla's `twilight/3.0.15/twilight.esm.js`, and its `twilight::init` config has **no** `webmcp` key, so Salla's tools are off there. The store also exposes Salla's remote **Storefront MCP** server at `/mcp` (`/.well-known/mcp.json`: 16 catalog/cart/checkout tools and `store://` resources) for external AI apps. Cloudflare injects `/.webmcp/bridge.js` with `data-packs="c2pa"` (image provenance tools only).
- Overlap: the theme's `corecare_` tools do not collide by name with Salla's, but if the store enables Salla's tools an agent would see two sets that do the same thing. Follow-up: register only the theme's complementary tools when `salla.config.get('webmcp.enabled')` is on.
- Working tree: branch `feature/bilingual-images`, uncommitted. The owner's pre-existing untracked test records were left untouched.

## Repository checks

| Check | Result |
|---|---|
| `pnpm build` | Passed. Warnings: existing Sass deprecations and bundle size only. `public/webmcp.js` 12.8 KB |
| `pnpm test` | Passed, 148/148 (new `scripts/webmcp.test.mjs`, 9 tests) |
| Static audit | 13/13, `docs/evidence/technical/static-audit.json` (setting inventory shifted by the new switch) |

## Local tooling (not Salla)

The built `public/webmcp.js` was run in a Node VM with a fake `document.modelContext` and a fake Salla SDK whose `onReady` resolves late:

- No model context: registers nothing, sets no global.
- Before `Salla.onReady` resolves: nothing registered. After: all 10 tools registered; `corecare_view_cart` returns `{"ok":true,"cart":{"item_count":0,"items":[]}}`.

This proves the bundle's load order and registration only. It does not prove Salla API responses, cart UI updates, or agent behaviour in Chrome.

## Salla development preview: not run

Needs the change committed and pushed first (the preview sends the pushed HEAD). Not authorized yet.

## Untested

- Real Chrome 149+ with WebMCP enabled (`chrome://flags/#enable-webmcp-testing` or the origin trial) against the development preview: tool discovery, each tool against real store data, products with required/text options, out-of-stock products, invalid coupon, guest wishlist sign-in, cart drawer/badge updating after agent calls.
- The Salla theme editor iframe: tools are expected not to register there (cross-origin frames need `allow="tools"`).
- The origin-trial token: new optional setting `core_care_webmcp_trial_token` prints `<meta http-equiv="origin-trial">` (Twig-escaped) when filled. No token is registered yet; registering `corecare-sa.com` is the owner's step. Not verified that Chrome accepts a token delivered by this meta tag on Salla.

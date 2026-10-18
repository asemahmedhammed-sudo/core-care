# Language kept during navigation — 2026-10-19

- Source: working tree based on `07dd24d` (branch `feature/bilingual-images`). Earlier uncommitted edits to the product card, its test, `public/product-card.js` and the audit report were preserved.
- Report: in English, opening a product or clicking "View all" switched the store to Arabic.

## Environment and evidence

- **Public storefront** `corecare-sa.com`, read-only, in the Claude desktop built-in browser (not Chrome). The page body had `theme-beauty`, and its assets came from `themes/523702774/1.6.0/…?v=20261010-language-sheet-1`. So Core Care theme 523702774 v1.6.0 is now the active public theme, not Raed. That build does **not** include this fix.
- Pages checked: `/en`, a product page, category, brands, latest products, offers, search, cart, and sorting/pagination URLs, using rendered DOM and `fetch` of the HTML.
- The fix was simulated in the page by running the new `localizedStoreLink` against the real anchors on `/en`. That is evidence for the logic on real data. It is not a deployed build.

## Root cause

Salla returns links that the merchant saved as **custom links** («رابط خارجي») exactly as they were typed. The SDK confirms this: `salla.url.create('custom', value)` returns `value` unchanged. Every route Salla builds itself carries the language segment (`link()`, `salla.url.get()`, product/category/page sources). Custom URLs saved without `/en/` therefore point at the default-language route.

Observed on `/en`:

| Link | Where | Opens |
|---|---|---|
| `https://corecare-sa.com/most-Sales-products?corecare` | "View all" in both home `fixed-products` sections (`display_all_url`) | 200, `<html lang="ar">` |
| `https://corecare-sa.com/brands` | header menu item → categories panel "Shop all" | redirects to `/ar/brands` |
| `https://corecare-sa.com/cart` | footer menu (`salla-menu`) | 200, `<html lang="ar">` |
| `https://corecare-sa.com/` | header menu item «الرئيسية» (API data) | Arabic home |

The product links returned by the API were all `/en/…` and opened in English. Products opened from the Arabic listing reached through "View all" are Arabic, which matches the report. With `/en/` added, each of the links above returned `<html lang="en" dir="ltr">`.

## Checks

- `pnpm build`: passed (9 existing Webpack warnings: Sass deprecations and size recommendations).
- `pnpm test`: 95/95 tests and 13/13 repository audit checks passed. New: `scripts/language-links.test.mjs`. Updated: `scripts/preview-navigation.test.mjs`. In the audit report, only the timestamp, two asset hashes and the theme name from the already-committed `twilight.json` changed.
- Generated: `public/app.js` (115484 bytes, SHA-256 `124eb4e4d9163cdadfaf00c4370fae9e15aaaad7dd06404897a3bda2c0590d34`) and `public/main-menu.js` (27340 bytes, SHA-256 `18e020c7439f1a7d2a2b51e8acdc97e4e464d8d8928296e1e4349a33c33cfcd6`). `public/product-card.js` was rebuilt from the earlier uncommitted source.
- In-page simulation on public `/en`: 3 links rewritten (`/brands`, `/most-Sales-products?corecare`, `/cart` → `/en/…`), and the other 45 anchors were unchanged. The 3 rewritten targets returned English pages.

## Not verified

- No push, preview upload or publication was done. The fix has not run on the Salla development preview or on the public store.
- Login/register/logout redirects, wishlist, account pages, checkout, blog (`/en/blog` returned 403) and quick-view were not exercised. Language switching from each page type was not clicked through. Mobile and desktop visual checks were not needed: the change has no visual effect.

## Test checklist (after the build reaches the development preview, then again after publication)

Run in English, then repeat in Arabic. Use desktop (1440px) and mobile (390px). On every page, confirm `<html lang>` and `dir` and the URL language segment.

1. Home: logo, header «الماركات التجارية»/brands, categories panel (each tab, "Shop all", groups, image), "View all" in every product section, product card image/name/eye icon, banners/promos/sliders, main links, brands "View all", footer links and the `salla-menu` footer menu (cart item).
2. Product page: breadcrumbs, brand, tags, recommendations, add to cart → toast "View cart", sticky bar.
3. Category, latest products, offers, most-sales, search results: sub-category chips, sorting, filters, pagination, infinite scroll.
4. Brands list and brand page; blog index/article/category/tag (if enabled); static pages.
5. Cart page and cart drawer ("View full cart", shopping CTA, item links); checkout entry.
6. Login/register modal, logout, wishlist, account pages, orders, order payment link.
7. Language switcher from home, product, category, search with `?q=`, cart: you stay on the same page in the other language.
8. View source: canonical and `hreflang` alternates (these are emitted by Salla's `head` hook). Note: the category page served only `ar` and `x-default`, with no `en` alternate.

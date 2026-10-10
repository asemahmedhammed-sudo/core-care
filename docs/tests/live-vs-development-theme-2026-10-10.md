# Public storefront vs development theme — 2026-10-10

## Symptom

The owner reported that the public product page (`corecare-sa.com`, product `p933577391`) shows the old design instead of the Nice One–style product detail. Earlier, they had seen that design in the development preview.

## Findings (built-in browser, read-only, owner's existing Salla session)

| Where | Theme served | Evidence |
|---|---|---|
| Public storefront, home and product `p933577391` | Raed | body `theme-raed`; assets from `themes/1247874246/1.377.0/`; no `core-product-gallery`; 0 `beauty-*` elements |
| Dashboard → إدارة الثيمات | Published card titled **«core care»** is a **Raed** customization | card thumbnail labelled رائد, status منشور; a second card «تنسيق كليك رقم (1)» (Click) |
| Dashboard → طلبات تطوير الثيمات | Development request **تمت الموافقة** | «تخصيص» opened the fresh `draft-2099653784`, labelled **ثيم العناية - تطوير / غير منشور** |
| That fresh draft's preview | Core Care | Home shows the Core Care header, the «سلايدر العروض الرئيسي» element with a merchant image, and product sections. The product-details page shows the Core Care header/search/navigation and the product layout. |

Note: the dashboard's «تصميم المتجر» link still points to the older `draft-2111164464`. Earlier records show that old drafts keep their asset snapshot after a push.

## Conclusion

- **Template:** no defect. Today's commits did not touch product files, and the development preview renders the Core Care product page.
- **Why visitors see Raed:** the public store runs the published Raed customization named «core care». The Core Care development theme is not published or activated on the store.
- **What visitors see after a push:** pushing to GitHub updates only the development theme.

## Limits

- The preview iframe is cross-origin. Its theme identity was judged from the rendered header/layout, not from `theme-beauty` or the asset URL.
- The preview was only seen at the editor's narrow desktop iframe width (~400px).
- No setting, theme, draft content or publication state was changed. Saving was not used, and the iframe URL (which contains a token) was not recorded.

## Follow-up: preview product links leave the preview (actual defect)

Owner's clarification: opening the product page directly in the preview shows the Core Care design. Clicking a product (or category) from the preview homepage opens the old design.

### Cause

- The fresh draft's preview now serves `https://salla.design/ar/corecare`, with the language segment before the store slug. `storeHome` is `https://salla.design/ar/corecare/` and `storeCanonical` is `https://salla.design/ar/corecare`.
- Product cards (`salla-products-list`) and the `core-care-categories` menu output links to `https://corecare-sa.com/ar/…`.
- `previewLink()` in `src/assets/js/partials/preview-navigation.js` aliased the production domain only when the preview home path was exactly `/corecare`. With `/ar/corecare` the alias never applied, so those links were left unchanged. Clicking them left the preview for the public storefront, which runs Raed.
- Measured on the preview homepage: 11 menu links, plus every product card link, pointed to `corecare-sa.com`.

### Verification of the target URL

`https://salla.design/ar/corecare/<product-slug>/p933577391` returned 200 in the same preview session, with body `theme-beauty` and `core-product-gallery` present.

### Fix

- `previewLink()` recognizes both `/<store>/` and `/<language>/<store>/` preview homes. It maps a live `/<lang>/<path>` to the preview `/<lang>/<store>/<path>`, keeping the query and hash. Links without a language get the preview's language.
- The old behaviour for `/corecare/` homes is unchanged. Links to other origins, existing preview links and non-HTTP schemes are left alone, and nothing is rewritten outside `salla.design`.
- The asset revision is bumped to `20261010-preview-language-links-1`, so the preview does not reuse the cached `app.js`.

### Checks

| Check | Result |
|---|---|
| `scripts/preview-navigation.test.mjs` | New case covering product, category, home, an `/en` link, a link without a language, and unchanged links. 4/4 passed. |
| `pnpm build` | Passed, 9 existing warnings |
| `pnpm test` | 68/68 passed; static audit 13/13 |
| In-page simulation on the real preview homepage (built-in browser) | Not deployed: the new `previewLink` was injected into the page. 60 links were rewritten and 0 still pointed to `corecare-sa.com`. Clicking a real product card opened `salla.design/ar/corecare/…/p717813845`, with body `theme-beauty` and `core-product-gallery` present. |

Still pending:

- Hosted verification after push and a fresh «تخصيص» draft.
- Category pages, search results, and links inside the editor iframe.
- English preview.

# Categories panel reads the store's category tree — 2026-10-26

## Report

The owner's desktop screenshot of «تسوّقي حسب القسم» showed sections that do not exist (العناية بالبشرة، العناية بالجسم، العطور، الرئيسية…) and no subcategories under المكياج.

## Cause (public storefront, read-only, Core Care `523702774/1.9.0`, `body.theme-beauty`)

- The panel was built from the header menu (`salla.api.component.getMenus()`). That menu has 8 links and no sub-links:
  - `العناية بالبشرة` → `c546603469`, `العناية بالشعر` → `c920560547`, `العناية بالجسم` → `c1738480858`, `العطور` → `c1530352627`. All four answer `302` to the home page: the categories were deleted.
  - `الرئيسية`, `وصل حديثًا`, `الماركات التجارية` are pages, not categories.
- The store's real top-level categories (`salla.product.api.categories()`) are only `المكياج` (8 subcategories) and `أقسام العناية بالشعر` (9 subcategories), plus Salla's brands entry. `أقسام العناية بالشعر` was missing from the menu.
- On screens of 768px and wider the panel showed only the menu's own sub-links, so no subcategories appeared there. Phones already filled them from the category tree.

## Change

`src/assets/js/partials/core-care-categories.js`: the panel (desktop and phone) now lists `salla.product.api.categories()` through `storeCategories()`, cached per language in `sessionStorage` for the visit. The header menu is no longer read. Salla's brands entry keeps its own name instead of «عرض جميع منتجات …». `docs/MERCHANT_GUIDE.md` updated.

Compatibility: no setting or field IDs changed. Edits to the header menu no longer affect this panel; categories are managed in Products → Categories.

## Checks

- Source: commit `3b08c88` on `feature/bilingual-images`.
- `pnpm build`: passed (9 existing size warnings).
- `pnpm test`: 136/136 passed (`scripts/categories.test.mjs` updated for the new source).
- Built-in browser (not Chrome), public store `corecare-sa.com/ar`, 1440×900: the live 1.9.0 panel was given the category tree in the page (local DOM only, nothing saved). Result: rail = المكياج، أقسام العناية بالشعر، الماركات التجارية. المكياج shows الخدود، الوجه، الحواجب، الشفاه، أدوات المكياج، مثبت مكياج، بودرة الوجه، مكياج العيون with their children, plus the category image. أقسام العناية بالشعر shows its 9 subcategories; «عرض جميع منتجات أقسام العناية بالشعر» links to `/ar/hair-care/c1351127987`.

## Development preview

- Commit `3b08c88` pushed to `feature/bilingual-images`. jsDelivr `@3b08c88…/public/main-menu.js` answers 200 and contains the new code (`cc-categories-tree`, `product.api.categories`). The three remaining `getMenus` calls belong to the inherited Raed menu component.
- `salla theme preview -s "Core Care" -o -E` (prompts answered «no») created `draft-1756575378` with `localhost:8000` assets. Hosted draft assets `salla.design/themes/draft/1756575378/app.css` and `main-menu.js` return 404. The CLI and its `pnpm run watch` children were stopped, then `pnpm build` restored the production build.
- Opened `s.salla.sa/design/draft-1756575378?legacy=0&with_editor=false&assets_url=<jsDelivr @3b08c88 public>` in Claude in Chrome. Only the editor shell was readable. Scripts and the storefront frame were refused with "Host access is restricted by policy", so the panel could not be inspected.

## Not verified

- The new build rendered in the Salla development preview, on desktop or phone. Platform verification is **incomplete**. The owner needs to open the draft link above.
- Phone sheet (390px) and English/LTR with the new code.
- Chrome. The check above used the built-in browser against the live 1.9.0 code with injected data. It is partial evidence only.

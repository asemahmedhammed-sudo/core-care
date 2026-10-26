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

- Working tree: uncommitted on `feature/bilingual-images` (base `89a9362`).
- `pnpm build`: passed (9 existing size warnings).
- `pnpm test`: 136/136 passed (`scripts/categories.test.mjs` updated for the new source).
- Built-in browser (not Chrome), public store `corecare-sa.com/ar`, 1440×900: the live 1.9.0 panel was given the category tree in the page (local DOM only, nothing saved). Result: rail = المكياج، أقسام العناية بالشعر، الماركات التجارية. المكياج shows الخدود، الوجه، الحواجب، الشفاه، أدوات المكياج، مثبت مكياج، بودرة الوجه، مكياج العيون with their children, plus the category image. أقسام العناية بالشعر shows its 9 subcategories; «عرض جميع منتجات أقسام العناية بالشعر» links to `/ar/hair-care/c1351127987`.

## Not verified

- The new build in a Salla development preview (no draft created for this change).
- Phone sheet (390px) and English/LTR with the new code.
- Chrome. The check above used the built-in browser against the live 1.9.0 code with injected data. It is partial evidence only.

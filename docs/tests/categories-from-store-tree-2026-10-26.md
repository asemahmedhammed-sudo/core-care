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

## Follow-up: desktop layout after the Nice One menu (same day)

The owner sent a Nice One desktop screenshot and asked for the same structure and design, with all sections and categories taken from Salla.

Change: on screens of 768px and wider the dropdown sits inside the 1280px content width under the navigation row, without a title bar, and dims the page below it. The grey rail lists the top-level categories with their image, or their first letter when they have none; pointing with the mouse switches sections. The content uses columns: «جميع المنتجات» (a heading only), then each subcategory as a bold heading with a chevron and its own subcategories in muted text. The category image sits at the inline end. Salla has no brands per category (product data carries only a brand name, with no logo or link, and only from the first page), so the reference's brand tiles were not added. The phone sheet is unchanged.

Checks:

- `pnpm build` passed (9 existing size warnings); `pnpm test` 137/137 passed.
- Built-in browser (not Chrome), public store `corecare-sa.com/ar` running 1.9.0, with the new methods and a Sass compile of `core-care-categories.scss` injected into the page (local only).
  - 1440×900. المكياج: 3 columns (جميع المنتجات, then الخدود/الوجه/الحواجب/الشفاه/أدوات المكياج/مثبت مكياج/بودرة الوجه/مكياج العيون with their children), 240px category image, panel 80–1360px, rail 290px on the right, no horizontal overflow. أقسام العناية بالشعر: 3 columns of its 9 subcategories, صبغات الشعر with its 2 children, no image. الماركات التجارية: a single heading linking to `/ar/brands`.
  - 1024×768: rail 240px, 2 columns, 200px image, no horizontal overflow.
  - Chevrons point to the inline end (`scaleX(-1)` under `dir=rtl`).
  - Found and fixed during the check: «جميع المنتجات» first listed every subcategory again.
- Dimming: the backdrop computes correctly (`::before`, fixed, `rgba(0,0,0,.45)` from the menu's top), and `elementFromPoint` below the menu hits it. The built-in browser's screenshots did not show it, nor a plain black 45% test strip at z-index 99999 (a red test strip did show). So the dimming is **not visually confirmed**.

Not verified: Salla development preview, Chrome, the phone sheet after this change, English/LTR, the dimming and click-to-close in a real browser.

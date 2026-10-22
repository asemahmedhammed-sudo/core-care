# Phone/tablet categories sheet in the app style — 2026-10-22

Owner request: the categories button in the phone header should open the categories like the Nice One app screenshot. The layout has a rail of sections and the selected section's subcategories as image circles, in the same fonts if possible. Desktop must not change.

## Findings that shaped the implementation

- **`corecare-sa.com` header menu** («قائمة رأس الصفحة العامة»): 8 flat links with no sub-links and no images:
  - الماركات التجارية, وصل حديثًا, المكياج, العناية بالبشرة, العناية بالشعر, العناية بالجسم, العطور, الرئيسية
- **Salla's storefront category API** (`salla.product.api.categories()`) has the tree:
  - المكياج has 8 subcategories, 4 of them with their own children (الوجه: فاونديشن, برايمر …).
  - Only المكياج has an image. Subcategories have none; their `icon` is the default `sicon-store`.
- **The API codes `id`** (for example `yNazxp`). The number in menu links (`/c187393441`) is in `id_` and in the category URL. The first draft matched on `id` only; `608d0cb` fixed this.
- **Fonts:** the theme keeps the merchant's configured store font (AGENTS 6.3). The reference's sizes and weights are matched:
  - rail 16px/500, selected 700
  - titles 15px/700
  - «عرض الكل» 13px/500 in `--cc-secondary`
  - names 13px/500

## Implementation (below 1024px with the tab bar on)

- **`core-care-categories.js`:**
  - **Compact mode:** used when `(max-width: 1023px)` matches and the body has `cc-has-tabbar`. It is re-rendered when the width crosses 1024px. Desktop rendering is unchanged.
  - **Panel content:**
    - category image as a banner
    - a white card with «جميع المنتجات»
    - subcategories without children as a grid of circles
    - each subcategory with children as a group with «عرض الكل» and a collapse button (`aria-expanded`)
  - **Data sources:**
    - Sub-links built in the menu take priority.
    - Otherwise the subcategories come from the category the link points to.
    - The tree loads on the first open and is cached in `sessionStorage` for the visit.
  - **Circles:** a category with no image shows its initial (skipping «ال»), as the homepage discs do. No `innerHTML`.
  - **Placement:**
    - The sheet opens under the compact header, so search stays visible and the grid button closes it.
    - If the header has scrolled away (header not sticky), the sheet covers the screen with its title and × button.
- **`core-care-app-nav.scss`:**
  - **Rail:** at the inline start (28%, min 96px; 200px on tablets), white. The selected item is bold with a 4px purple marker facing the content; direction comes from `html[dir]` rules.
  - **Content:** `--cc-canvas` background with white 8px cards.
  - **Circles:** 3 per row on phones, 4 on tablets. Circles are 76px (88px on tablets) on `--cc-utility-surface`.
  - **Banner:** up to 120px high.
  - **Scrolling:** the rail and the content scroll separately.
  - **Header colour:** the transparent header over a tall first banner turns white while the sheet is open.

## Checks

- **Build and tests:**
  - `pnpm build`: passed, with only the existing Sass `@import` deprecation warnings.
  - `pnpm test`: 114/114. Static audit: 13/13.
- **Desktop parity:** a compiled-rule diff against `main` (`674571c`) found 0 rules that can match 1024px or wider. On the draft at 1280px, the menu rendered the existing dropdown: toolbar, groups, «عرض جميع منتجات …», no compact class.
- **Salla drafts in Comet (Chromium) via Claude in Chrome**, with the demo store `dev-bqivva6l3hp4ul7w` in a same-origin frame:

  | Draft (commit) | Width | Check | Result |
  |---|---|---|---|
  | `draft-979687977` (`66e76c3`) | 390 | Open from the header grid button | Sheet at 62px under the header; search, barcode and bell visible; tab bar visible |
  | `draft-979687977` | 390 | Select a section with subcategories | Banner, «جميع المنتجات», 4 leaf circles, groups «الوجه» and «الخدود»; no horizontal overflow |
  | `draft-979687977` | 390 | Collapse «الخدود» | `aria-expanded=false`, list hidden |
  | `draft-979687977` | 390 | Header not sticky, page scrolled 900px, open | Full-screen sheet with «تسوّقي حسب القسم» and × |
  | `draft-979687977` | 768 | Tablet | Found a defect: tablet rules lost on specificity. Fixed in `608d0cb` |
  | `draft-979687977` | 1280 | Resize while open | Desktop dropdown restored |
  | `draft-806037300` (`608d0cb`) | 390 | Sample tree with coded `id` and numeric `id_` (real-store shape) | Section matched; 2 groups and 13 circles; banner 120px; rail 16px; purple inset marker |
  | `draft-806037300` | 768 | Tablet | Rail 200px, 4 columns, no overflow |

- **Theme identity:** body `theme-beauty`, `salla-draft-806037300`, CSS from `salla.design/themes/draft/806037300/app.css?v=20261022-categories-sheet-2`.
- **Evidence:** `docs/evidence/visual/categories-sheet-salla-mobile-390-2026-10-22.jpg`.

## Test data

The demo store has 5 categories, none with subcategories or images. To see the full design, a sample tree was placed in the test browser's `sessionStorage` only (key `cc-categories-tree-ar`). It used names from `corecare-sa.com`'s المكياج tree and images already on the demo store. No store data was changed.

## Not verified

- The real `corecare-sa.com` data in the theme. The public store runs published version 1.7.0 and the draft only previews on the demo store. The menu-to-category match was checked against the real API's data shape, and in unit tests.
- Real phones or tablets (touch, safe areas, iOS Safari), and English/LTR.
- Desktop at widths other than 1280px. Desktop parity rests on the CSS diff.

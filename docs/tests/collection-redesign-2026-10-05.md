# Category listing redesign — 2026-10-05

Scope: product listing/category template, listing controller, listing-scoped styles, AR/EN strings, merchant guide and focused regression tests. Product detail source and theme setting IDs/types are unchanged. User explicitly authorized a push to the development theme's repository.

Base revision: `e577e74` on `main`; working-tree implementation. Existing unrelated reports and evidence were retained. Production assets are generated through Webpack.

## Repository verification

- Production build: passed; existing Sass `@import`/legacy API, Tailwind line-clamp and Webpack asset/entrypoint size warnings remain. app.css and product.js are rebuilt; product.js contains both existing detail and listing controllers, with the detail controller unchanged.
- Tests: 49 passed; static audit: 13/13 checks passed. Navigation rejects unsafe URLs, uses real category children/siblings, matches preview aliases and deduplicates links. Filter counts omit the base category and sort. Sorting retains native filter state and initializes once.
- No fabricated commerce data, copied reference campaigns or new commerce implementation.
- Native filter APIs and CSS classes were verified from installed `@salla.sa/twilight-components` source. Native filter choices apply immediately; the mobile results action closes the dialog. Reset uses `resetFilters()`.

## Local layout evidence (partial, not Salla verification)

Codex in-app browser; layout-only fixtures with neutral placeholder media and labelled layout text, without fabricated prices/ratings/stock or commerce transactions:

- `output/qa/collection-layout-2026-10-05.html`
- `output/qa/collection-layout-ltr-2026-10-05.html`

| RTL width | Grid columns | Card width | Heading-to-grid | Page overflow |
| --- | --- | --- | --- | --- |
| 320 | 2 | 142px | 12px | 0px |
| 375 | 2 | 169.5px | 12px | 0px |
| 390 | 2 | 177px | 12px | 0px |
| 768 | 3 | 239.3px | 20px | 0px |
| 1024 | 4 | 163.3px | 20px | 0px |
| 1280 | 6 | 146.1px | 20px | 0px |
| 1440 | 6 | 168.7px | 20px | 0px |
| 1920 | 6 | 168.7px | 20px | 0px |

LTR: 320, 375, 768, 1280, 1920 tested with zero page overflow and equivalent column counts. Desktop sidebar is 280–300px, separated by 20px. Category pills scroll internally. Mobile open moves the existing filter panel into a native modal dialog; close via Escape and results button restores focus to the trigger. Native widget styles were included for the layout review.

Reference deviations: 44px controls around smaller icon artwork, darker metadata for contrast, actual merchant category names and merchandise, and content-driven empty state with a recovery link.

## Platform verification

Incomplete at pre-push checkpoint. Chrome's existing development editor was read-only inspected; its earlier category route showed an empty category. That baseline does not verify this implementation or prove the category's backend product assignments. No live merchant product data was edited.

Pending: updated hosted asset identity, actual populated/empty categories, desktop/mobile Chrome gaps and neighbors, native brand search/reset/sort/pagination, wishlist/cart/options/unavailable products, LTR platform data, and editor ordering/hidden components. Publication readiness remains incomplete until these checks have matching evidence. Private preview URLs and credentials are excluded from records.

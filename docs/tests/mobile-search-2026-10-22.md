# Phone search in the app style — 2026-10-22

Owner request: on phones, make search look like the Nice One app screenshot (recent searches, popular terms, suggested brands) without changing desktop.

## Findings that shaped the implementation

- The live Salla search (`cdn.salla.network/js/twilight/3.0.6`) differs from the bundled `@salla.sa/twilight-components`:
  - Its header field opens Salla's own full-screen window (`salla-modal.s-search-modal-new`, light DOM) with a back button, live results and «عرض كل النتائج».
  - `inline` no longer renders results in the page. A first custom sheet (`b51e1f2`) was therefore replaced in `3794522`.
- Before typing, Salla's idle panel already shows real data:
  - search history: «آخر ما تم البحث عنه» chips with remove
  - «التصنيفات الأكثر بحثاً»
  - «الأكثر بحثاً»

  On `corecare-sa.com` it showed «المكياج», «أقسام العناية بالشعر» and four product terms. These cover «ما بحثت عنه مؤخراً» and «كلمات بحث شائعة» with store data, so no duplicate was built.
- Brands are not provided by Salla's window. The first 12 tiles of the brands page are alphabetical ("55", "909", …), so the owner chooses them instead: setting `beauty_search_brands`, up to 12 names.
- **Store data issue (merchant dashboard, not theme):**
  - 341 brands, with 154 names used by more than one brand.
  - Many names are logo file names ("Eucerin2", "Avene1", "Amouagelogo", "EXFOLIATELOGO1").
  - These names also appear as brand page titles and URLs.

## Implementation (below 1024px only)

- **`core-care-app-nav.scss`:** Salla's search window gets a 16px, 12px-radius field, 18px/700 section titles and outlined black pill chips for history, categories and most-searched terms. Most-searched terms are shown on one line with an ellipsis. Brands render in a 4-column circular grid, hidden while typing.
- **`core-care-search-sheet.js`:** when Salla's search field is focused or opened from the header, it adds «ماركات مقترحة». Brands are the named ones read from the theme's brands page: cached per session, case- and space-insensitive, merchant order, first duplicate wins, safe URLs only, no `innerHTML`.
- **`mobile-search.twig`:** a config element rendered only when the setting has names.

## Checks

- `pnpm build`: passed (baseline 9 warnings). `pnpm test`: 110/110. Static audit: 13/13.
- **Desktop parity:** compiled-rule diff against `main` showed 0 rules that can match 1024px or wider.
- **Salla drafts, Comet, 390px frame, real clicks and typing:**

  | Draft | Check | Result |
  |---|---|---|
  | `draft-1495304794` | Open search from the header | Salla window opens |
  | `draft-1495304794` | Type «فستان» | Results with the styled field and title |
  | `draft-1495304794` | Press Enter | Opens `/search?q=فستان` |
  | `draft-1495304794` | Reopen search | History chip styled |
  | `draft-722315611` | Brands with 8 real `corecare-sa.com` brands | Shown in the merchant order, 4 per row, no overflow |
  | `draft-722315611` | Type «فست» | Brands hidden, 9 results |

  The brands came from the live brands page (read only) and were seeded into session storage, because the demo store has no brands.

## Not verified

- Brands fetched end to end on a store that has both the setting and brands. The demo store has neither, so the fetch path was covered by unit tests and the selector was checked on the live brands page.
- «الأكثر بحثاً» and categories styling on a draft: the demo store has no search data. Class names come from Salla's live bundle and the live store's markup.
- English/LTR and tablets.

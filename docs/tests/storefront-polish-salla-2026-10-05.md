# Hosted storefront polish verification — 2026-10-05

## Identity and deployment finding

Source revision: `b47f8d8` on `codex/storefront-polish`. Hosted Salla draft:
`2110551004`. Shared asset revision: `20261005-storefront-polish-3`.
The earlier GitHub push did not update the old draft the merchant was viewing.
The official installed Salla CLI preview workflow created an updated draft from
the pushed revision. The merchant's Chrome session supplied the actual Core Care
catalog and saved page composition; CLI auto-authentication alone selected the
generic demo catalog. No catalog, contact, component settings or live theme was
changed. Main was not merged and the live storefront was not published.

The final preview loaded product-card.js and app.css from Salla's hosted draft
asset paths with the final revision. It remained usable after stopping the local
watcher. All generated production assets were restored from verified Webpack
output after previewing. Private preview/authentication URLs were excluded from
this record and screenshots, and removed from temporary CLI logs.

## Runtime defect found and corrected

The saved store palette uses white as its primary color. The first updated draft
therefore rendered outline cart labels white on white. The actual hydrated native
button contained the label; the defect was the foreground token. Outline actions
and focus indicators now use the dark text token. Filled actions use Salla's
reverse text color, with its observed `#808080` value darkened to `#222222` for
small labels on white. Default neutral actions retain white text on dark fill.
Settings IDs, field types and merchant values remain unchanged.

## Checks and observed results

- Production `pnpm build`: passed, nine existing Sass/asset-size warnings; the
  Tailwind line-clamp plugin warning also remains. No build errors.
- `pnpm test`: 41 passed, zero failed; static audit 13/13 passed. Palette coverage
  includes the contrast token for home/inner and store/default variants.
- `pnpm size:theme`: regenerated during verification. Measurements remain
  repository measurements, not Salla size acceptance.
- `git diff --check`: passed. Isolated worktree generated assets were clean after
  restoring production output. Original checkout's unrelated changes preserved.
- Chrome Responsive 1440×900 on the final hosted Core Care preview: DOM viewport
  1440, document width 1440, final asset revision confirmed. Hydrated cart text
  was "أضف إلى السلة" and its computed color was black.
- Earlier Chrome 375×667 confirmed no horizontal overflow and exposed the
  white-on-white defect. This is not final-mobile acceptance.
- Chrome subsequently became unavailable (`noWindowsAvailable`); final mobile
  verification used the Codex in-app browser and is partial Chrome evidence.

Final hosted Core Care measurements in the in-app browser:

| Viewport | Actual result |
|---|---|
| 1440×900 RTL | Six 222px grid columns; 12px heading-to-products gap; all eight measured homepage section boundary gaps 36px; document width 1440. |
| 390×844 RTL | Two 177px cards, 338px tall; 12px heading gap; all eight measured section boundary gaps 24px; document width 390. |
| 320×720 RTL | Two 142px cards; cart action 44px high; document width 320. |

Existing beauty products, logo, campaigns, categories and footer content were
retained. The saved eight-product group naturally has a partial final grid row;
no artificial placeholder cards were introduced. Missing ratings remain absent.

Evidence:

- `output/qa/storefront-polish-salla-mobile-390-2026-10-05.jpg`
- `output/qa/storefront-polish-salla-desktop-1440-2026-10-05.jpg`

The desktop capture is a 750px crop of the 1440px viewport because of the in-app
capture surface limitation. Column count and overflow use rendered DOM geometry,
not that cropped image. The mobile image includes the banner, heading and cards.

## Acceptance scope

Implementation and repository checks: passed. Hosted draft asset identity and
focused homepage appearance: verified as above. Complete platform visual and
functional acceptance: incomplete. Untested on the final draft: full collection,
search, brand, product-detail, blog, account and cart routes; native cart backend,
wishlist/authentication, options and unavailable states; final Chrome mobile;
all LTR routes; hidden/reordered/editor instances and every merchant setting.
The preview also logged a platform page-view POST 405 and preload warnings; this
does not establish a clean platform console or release readiness. Publication
readiness and Salla approval are not claimed.

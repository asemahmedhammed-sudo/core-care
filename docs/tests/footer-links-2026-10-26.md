# Footer link groups — 2026-10-26

Owner's request: apply the improved design (screenshot) to the footer links area only: four titled groups with
outline icons and chevrons, two by two, with a hairline between the rows.

## Source state

- Branch `feature/bilingual-images`, uncommitted working tree on top of `4185f24`.
- Changed: `src/views/components/footer/footer.twig`, `src/assets/styles/06-beauty/core-care-footer.scss`,
  `core-care-palette.scss` (three footer tokens), `src/locales/{ar,en}.json`, `twilight.json` (description of
  `beauty_policy_page_id` only), `docs/MERCHANT_GUIDE.md`, new `scripts/footer-links.test.mjs`.
- The owner's pre-existing product-card edits were left untouched.

## Link data (owner's choice: existing links only)

- Public sitemap (2026-10-26) lists one information page: «سياسة الاستبدال والاسترجاع», id `1741544897`
  (`/ar/-/page-1741544897` and `/en/-/page-1741544897` both redirect to it, HTTP 200).
- Merchant footer menu (Salla menu 566146469): وصل حديثًا → `/latest-products`, العلامات التجارية → `/brands`,
  سلة التسوق → `/cart`, تواصل معنا → `https://wa.me/…` (read on corecare-sa.com/ar, theme 523702774 v1.8.0, `theme-beauty`).
- Privacy, terms, shipping policy, shipping & delivery and FAQ pages do not exist, so they are not shown.

## Checks

| Check | Result |
|---|---|
| `pnpm build` | passed (9 existing webpack size warnings) |
| `pnpm test` | passed: 127/127 tests, static audit 13/13 |
| Compiled CSS | rows use a three-column grid; no `margin-left:auto` from logical properties on the new rules |

## Visual check — local static preview only

Environment: the production `public/app.css` with the footer markup rendered by hand from the Twig source
(Twig tags removed, merchant menu items filled with the real hrefs above), served from localhost in the Claude
built-in browser (not Chrome). This is **not** a Salla preview: Salla components (`salla-menu`, payments, social)
did not run.

| Viewport | Direction | Result |
|---|---|---|
| 390×844 | RTL | 2×2 groups; chevrons at the inline end; rows 36px; heading-to-first-row 6px; 16px + 1px divider + 16px between rows; no horizontal overflow |
| 390×700 | LTR | Mirrored correctly; «Customer service» heading wraps to two lines |
| 320×700 | RTL | No overflow; four labels wrap to two lines |
| 768×700 | RTL | Brand beside payments, link groups full width below |
| 1440×700 | RTL | Brand 325px · groups 708px · payments 295px; no overflow |

## Not tested

- Salla development preview / hosted draft (needs a pushed commit; not authorised in this session).
- Chrome; real `salla-menu` hydration and the optional cookie-preferences row; empty footer menu; a non-numeric
  `beauty_policy_page_id`.

## Preview draft — 2026-10-26

- Commit `995a4de` pushed to `feature/bilingual-images`.
- `yes n | salla theme preview -s "Core Care" -o -E` created draft **436684333**; the CLI pointed it at
  `localhost:8000` assets. The CLI's commit prompt was answered no; the owner's product-card files stayed uncommitted.
- `salla.design/themes/draft/436684333/app.css`: HTTP 404 (no hosted draft assets, as with drafts 539504891 and 1589339853).
- jsDelivr copy of `public/app.css` at `995a4de`: HTTP 200, contains `.core-care-footer__nav-row`, byte-identical to
  the local production build after the CLI watchers were stopped and `pnpm build` was rerun.
- Draft not inspected in a browser in this session. **Salla platform verification: incomplete** until the owner
  opens the draft with the jsDelivr assets and checks the footer (body `theme-beauty`, `app.css` from jsDelivr `@995a4de…`).

## Colour correction — 2026-10-26

Owner: the colours came from the screenshot instead of the site identity. Removed the three sampled tokens
(`--cc-footer-icon` #9b777b, `--cc-footer-link` #1f222a, `--cc-footer-chevron` #5c5b59). The link groups now use the
existing identity tokens: icons `--cc-icon` (#0C070F), labels `--cc-text` (#000), chevrons `--cc-text-muted` (#757575,
as the header language chevron). `pnpm build` passed; `pnpm test` 128/128 and audit 13/13. Local static preview
(390×700, RTL, Claude built-in browser) measured those computed colours, with no horizontal overflow. Salla draft not
inspected in this session.

## Web layout (from 768px) after the Nice One footer — 2026-10-26

Owner's reference: Nice One desktop footer screenshot. Phones keep the approved 2×2 design.

- Columns: «أشهر التصنيفات» (header-menu links to Salla categories, `core-care-footer.js`, max 12, hidden when none) ·
  store name over quick links + policies + store info · «خدمة العملاء» (merchant footer menu) · «حسابي» (profile, orders,
  wishlist; guests get Salla's login) · «تواصل معنا» (social tiles) · «حمل التطبيق» (Salla apps, hidden when none;
  social takes its column then). Then a hairline and the payment marks beside copyright and legal details
  (one row from 1280px; payments above copyright/legal at 1024–1279px; stacked rows at 768–1023px).
- The store description is hidden on web widths (not in the reference). Link icons and chevrons are hidden there.
- The desktop navigation and the footer share one header-menu request (`header-menus.js`).
- `pnpm build` passed; `pnpm test` 130/130 and audit 13/13.
- Local static preview only (Claude built-in browser; Salla components mocked with the store's real menu/category
  names): 1440 RTL/LTR, 1024 and 768 RTL without horizontal overflow; 390 RTL phone layout unchanged.
- Not tested: Salla preview, real `salla-social`/`salla-payments`/`salla-trust-badges` rendering at web widths,
  signed-in account links, app badges (the store has none).

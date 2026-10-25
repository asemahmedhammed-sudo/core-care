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

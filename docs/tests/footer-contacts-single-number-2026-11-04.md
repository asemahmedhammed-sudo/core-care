# Support contacts: one number with WhatsApp and call actions (2026-11-04)

## Request

The owner saw the same number three times in the footer support band on the public store (`corecare-sa.com/ar/`) and asked for one number with call and WhatsApp actions. The owner then asked for the same treatment to work on mobile and web.

## Cause

`<salla-contacts>` prints one row per channel. The public page's config has the same value for all three: `whatsapp`, `mobile` and `phone` are `+966572816450`. The policy and thank-you pages also listed the number once per channel, in their own markup.

## Change

- New partial `src/views/pages/partials/store-contacts.twig`, rendered from `store.contacts`. Numbers merge by their last 9 digits.
- Used by all four surfaces that list contacts: footer support band, mobile account sheet, returns policy page, thank-you page.
- New styles in `core-care-contacts.scss`. The old `.s-contacts-*` and `.core-policy__contacts` rules are removed, along with the unused `beauty.policy.contact_*` translations.
- The thank-you page now also shows the email, and its support block disappears when the store has no contacts.

## Environment and results

**Source:** commit `ad4b392` on `feature/bilingual-images`, pushed.

| Check | Result |
|---|---|
| `pnpm build` | Passed, 9 existing webpack size warnings |
| `pnpm test` | Passed, 160 tests; static audit 13/13 |
| Local mock (built-in browser, `public/app.css`, hand-expanded markup, real store values) | Passed, see below |
| Salla development preview (draft `1174778370`, demo store, Chrome extension) | **Partial**: footer and account sheet passed, see below |
| Salla preview with the real store's data | **Not run** |
| Public storefront | Not changed. It serves theme `523702774` version 1.11.0 (`theme-beauty`) and shows the old rows until a new version is published |

### Salla development preview

**Environment:** `salla.design/{ar,en}/dev-bqivva6l3hp4ul7w?preview=true`, body class `theme-beauty`, `app.css` from jsDelivr at commit `ad4b392` (byte-identical to the local production build). The draft's own hosted `app.css` returned 404 when created, so the review used the jsDelivr `assets_url`. It later returned 200 and is byte-identical to the build, but the review itself did not run on it.

**Demo store contacts:** `mobile` and `phone` are the same number, plus an email and Telegram. It has no WhatsApp.

- **Merging:** `mobile` and `phone` rendered as one number with one call button (`tel:8001111210`). No `salla-contacts` remains in the page.
- **Footer:** measured in iframes in Arabic and English at 320, 390, 768, 1024, 1280 and 1440px. No page overflow, no button overflow, 44px high buttons.
- **Account sheet:** opened through the tab bar at 390px. Three cards, and the divider above the footer menu is present.
- **Fonts:** the real theme font loaded; the layout looked as in the mock.

### Mock measurements

Footer, policy and thank-you were each measured in Arabic and English at 320, 360, 390, 768, 1024, 1280 and 1440px. The account sheet was measured in Arabic at 320, 360 and 390px. That is 45 measurements. All had no horizontal page overflow, no button content overflow, and 44px high buttons.

| Surface | Number and buttons on one row | Buttons below the number |
|---|---|---|
| Footer | 1024px | All other widths |
| Policy | 1024px | All other widths |
| Thank-you | 1280px, 1440px | 360 to 1024px |
| Account sheet | None | All widths |

- The thank-you page at 320px is the only case with the two buttons stacked on each other, because its card is only 232px wide.
- At the narrowest English widths (policy 320px, thank-you 360px) the two buttons differ slightly in width, 119/105 and 119/113, to fit the longer «WhatsApp» label.

### Defects found and fixed during the mock review

1. **Squeezed label:** at 1440px, the English «WhatsApp» button in the footer was narrower than its content.
2. **Split buttons:** the first fix put the two buttons on top of each other beside the number at 1440px. The button row now asks for 240px, so a narrow card moves the whole row below the number.

An intermediate measurement ran against an older copy of the CSS and was discarded. The results above come from the final build, confirmed through the computed `flex-basis: 240px`.

### Mock limits

- It did not load IBM Plex Sans Arabic, so real label widths may differ slightly.
- It did not run the Twig conditions.
- The policy and thank-you pages were reduced to the contact section. The first thank-you block was a placeholder.
- The account sheet was forced visible.
- Screenshots were not saved.

## Untested

- **The WhatsApp button on Salla:** the demo store has no WhatsApp, so the real store's case (WhatsApp, mobile and phone the same number, two buttons) ran only in the local mock.
- Different numbers per channel, and a store with no contacts.
- Real `tel:` and `wa.me` taps on a phone.
- The policy page on Salla: the demo store has no such page (`page-1741544897` returns 404).
- The thank-you page on Salla: it needs a real order.

## Noticed, not changed

The floating WhatsApp button covers part of the footer description and social icons in the owner's screenshot. It is not in the theme source.

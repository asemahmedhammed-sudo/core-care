# Product details — 2026-10-02/03

Implemented against the live Nice One reference:
https://niceonesa.com/ar/option-b-b-bride-marly-set-2-pieces-n42089

## Change

White two-column purchase layout, large contained image on the right in RTL,
vertical desktop thumbnails, compact title/price/actions, dark cart button,
native description/specification disclosures, and a conditional brand link.
Core Care header/footer and Salla product options, availability, gifts, preorder,
digital products, gallery, and extension hooks remain connected.
The selected options update the sole displayed price, discount, installment amount,
and SKU. Missing images omit the gallery; missing details omit their disclosure.
Empty native related-product results and hidden recommendation bundles collapse.

Salla sends discount_percentage as a string containing a percent sign. Normalize
and round it before rendering. Avoid `.hidden` utility selectors in custom CSS:
Tailwind @apply expansion otherwise synthesizes unrelated, more-specific `flex`
rules from `:not(.hidden)` and causes duplicate prices. Attribute selectors avoid
that expansion. Explicit RTL positioning compensates for PostCSS's conversion of
logical properties to physical LTR properties.

## Verification

- Production webpack: success, 9 existing Sass deprecation / bundle-size warnings.
- npm test: 21 tests pass, including option price/discount/installment synchronization,
  removing a stale discount, and recovering from an unavailable option.
- Repository audit: 13/13 checks pass. Generated public/app.css and public/product.js
  checked; final assets restored to production after stopping CLI watch.
- Official Salla CLI preview, actual Salla-rendered Twig/components, demo store
  dev-bqivva6l3hp4ul7w, product 292588064 (7 images and required size options).
- Desktop 1280×900 and mobile 390×844: one price visible; no horizontal overflow;
  title does not overlap share/wishlist; contained images remain visible; thumbnails
  change the active image. Description and specifications open/close.
- Required size selection works. Quantity 2 updates the displayed total to 348 SAR.
  Mobile add-to-cart with size 44/XL succeeds (cart count 1); no checkout performed.
- Mobile closed disclosures: purchase ends at y617.8, disclosures start y633.8
  (16px), disclosures end y751.8, footer starts y783.8 (32px). Empty related results
  are hidden. Desktop content and adjacent footer visually reviewed without a
  large unexplained gap. No gallery/content clipping or card overlap observed.
- Evidence: output/qa/product-details-salla-desktop.jpg and
  output/qa/product-details-salla-mobile.jpg (demo data, not merchant products).

## Limits

Chrome is not exposed by the available browser provider; used Codex's in-app
browser. The merchant editor at version_id=1026765166 still showed an older theme
snapshot; GitHub main upload is confirmed, but the new hosted merchant version is
not visually verified. The successful platform review uses the official Salla
CLI development preview, not a static local mock.
No live fixture for image-less products, 3D/video, hidden quantity, sticky cart,
missing specifications, metadata, or LTR was available in this demo. Those
conditional cases are implemented but their live visual verification remains
incomplete. Editor hide/reorder behavior was not changed or visually tested.

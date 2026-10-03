# Product detail reference alignment — 2026-10-03

Reference inspected in the browser:
https://niceonesa.com/ar/maybelline-lash-sensational-sky-high-mascara-n21936

Target is exclusively the merchant development editor at version_id=1026765166,
labelled «ثيم - تطوير غير منشور», and its Core Care storefront product 195141722.
No other demo theme/store was used.

## Implementation

- Product pages use IBM Plex Sans Arabic (400/500/600), the reference's 18px
  medium-weight heading, a 20px price, contained images and desktop thumbnails.
- Promotion text appears above the title; the outline wishlist icon shares a flex
  row with the title, avoiding fixed offsets for long titles or wrapped badges.
- A compact installment disclosure shows the actual enabled Tabby/Tamara providers.
  Its expanded content is Salla's own widget, retaining provider terms and price
  updates. The entire disclosure collapses when the native widget has no content.
- One full-width black cart button replaces the quick-buy/sticky arrangement.
  Merchant options, quantity, availability, notifications, gifting, preorder,
  digital products, media, metadata and extension hooks remain connected.
- Description/specification disclosures and the conditional brand row follow
  the purchase controls. Default recommendations precede customer reviews.
- Product-only header spacing and recommendation card typography are tightened.
  Main-content owns 24–40px section gaps; omitted content reserves no fixed space.
- CSS and product-script revisions are updated to avoid stale browser assets.

## Local checks

- Production Webpack passed with 9 existing Sass/bundle-size warnings.
- All 23 Node tests passed; repository audit passed 13/13 checks.
- New tests exercise late provider hydration, provider changes, logo CDN selection
  and removal of stale installment content. Existing price/discount/SKU tests pass.
- Generated public/app.css contains the font, heading and installment rules;
  public/product.js contains the provider summary and mutation observation.
- git diff --check passed.

## Platform verification limits

The initial merchant product was read in the specified editor and its own preview.
Chrome is not exposed by the browser provider; only the in-app browser is available.
The official CLI preview's sandbox run failed DNS resolution. Automatic approval
review rejected an escalated preview because it may upload files and prompt for a
commit. The CLI was not retried or bypassed after rejection.

Post-upload desktop/mobile visual verification, live low-content/image-less cases,
and editor hide/reorder verification remain incomplete until the specified hosted
development version serves the new assets. Initial screenshots are not evidence
of the final changes, and no pixel-for-pixel parity is claimed.

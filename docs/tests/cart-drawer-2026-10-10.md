# Side cart drawer (Nice One reference) — 2026-10-10

## Request

The owner asked for Nice One's purchase flow, from the cart click through to the end of the order. They supplied reference screenshots of the cart drawer, phone login, OTP, terms, privacy, checkout and card form, plus a Nice One product URL.

## Platform boundary (verified)

- **Cart:** theme-controlled. The header uses Salla's `salla-cart-summary`, which renders a link to `/cart`.
- **Checkout:** Salla-owned. In `@salla.sa/twilight` 2.14.551, `salla.cart.submit()` either opens Salla's login modal (`login::open`) or redirects to `next_step.url`.
  - In the real preview, the drawer's «الدفع» redirected to `pay.salla.sa/ar/gateway/checkout/…`.
  - That page's steps are «تفاصيل الطلب / تسجيل الدخول / التسجيل / عنوان التوصيل / شركة الشحن / الدفع».
  - The address, shipping, payment-method, card and checkout-login screens are therefore hosted by Salla and cannot be redesigned by the theme. Nothing was entered there.
- Login from the header uses `salla-login-modal`, which can be styled (next phase). Terms and privacy are store pages (next phase).

## Change

- `src/views/pages/partials/cart-drawer.twig`: a dialog shell with translated labels. `master.twig` includes it on every page except the cart page (`is_page('cart')`).
- `src/assets/js/partials/core-care-cart-drawer.js` (`core-care-cart-drawer`, loaded through `main-menu.js`):
  - **Opening:** a capture-phase click on `salla-cart-summary` opens the drawer. Modified clicks are not intercepted, and neither is Salla's native SPA webview. Without JavaScript the link still opens `/cart`.
  - **Cart data:** comes from `salla.cart.details(null, ['options','attachments'])` (real payload: `product_name`, `product_image`, `url`, `price`, `original_price`, `is_on_sale`, `quantity`, `options`, `attachments`, …).
  - **Quantity:** `salla.cart.updateItem({id, quantity})` / `salla.cart.deleteItem(id)`. The trash icon replaces − when the quantity is 1. Hidden-quantity and donation items show a fixed quantity.
  - **Prices:**
    - Formatted with `salla.money`, reduced to text plus `sicon-sar`; no `innerHTML`.
    - The discount % and old price appear only when `is_on_sale` and `original_price > price`.
    - «قمت بتوفير» = per-quantity sale difference + `cart.discount`.
    - «(شامل الضريبة)» appears only when `tax_amount > 0`.
  - **Optional sections:**
    - Free-shipping progress appears only when `free_shipping_bar` exists.
    - `salla-cart-coupons` appears only with `store.settings.cart.apply_coupon_enabled`; it is off in this store.
    - `salla-products-slider source="related"` appears only with `related_products_enabled`; it is on in this store.
  - **Editing:** items with options, files, notes or donations link to the full cart page.
  - **Empty and error states:** retry and «تسوق الآن».
  - **Accessibility:** `role="dialog"`, `aria-modal`, focus trap, Escape, focus return, scroll lock, a live region announcing updates, a progressbar, and product-specific labels on every quantity control.
  - **Checkout:** «الدفع» calls `salla.cart.submit()`. It closes the drawer first for guests, so Salla's login modal is not stacked under it.
- `src/assets/styles/06-beauty/core-care-cart.scss`:
  - **Layout:** `min(500px, 100vw)` wide, entering from the inline end (explicit `html[dir]` rules because PostCSS lowers logical insets). 70% backdrop, 44px controls, sticky footer with the safe-area inset.
  - **Merchant colour:** the CTA uses the theme's merchant-driven `--cc-action`/`--cc-action-text` with a dark border. This store's primary is white, so the button renders white with a black outline.
  - **WhatsApp button:** the merchant's WhatsApp app button (`.wa-s-n`, z-index 99999) is hidden while the drawer is open, because on phones it covered the total.
- Locales `beauty.cart_drawer.*` in ar/en; `docs/MERCHANT_GUIDE.md` updated; asset revision `20261010-cart-drawer-1`.

## Checks

| Check | Result |
|---|---|
| `pnpm build` | Passed, 9 existing warnings; no `body … body`/`body html[dir]` selectors for `cc-cart` |
| `pnpm test` | 84/84 passed; new `scripts/cart-drawer.test.mjs` (10 tests: discount/savings/money/URL helpers, SDK usage, trigger guards, dialog a11y, locale parity, styles). Static audit 13/13. Package-size test passed. |
| Real preview `salla.design/ar/corecare` (built-in browser) | Not deployed: compiled CSS, rendered markup and the element code were injected. One product was added to the preview session's cart for the test and removed afterwards. Results: <br>• Clicking the header cart opened the drawer without navigating. It showed «(1 منتجات)», the item and the related-products slider, with a total of 125. <br>• + changed the quantity to 2 (total 250) and − back to 1 (125), with focus kept on the stepper and the live region announcing. <br>• At 1024px the drawer was 500px from the left (RTL) and the page was dimmed. <br>• At 375px the drawer was full width with no horizontal overflow. The total was covered by the WhatsApp button until the CSS fix, then visible. <br>• «الدفع» as a guest redirected to Salla's hosted checkout (`pay.salla.sa`). |

## Not verified

- The hosted build after push.
- The empty and error states on Salla (covered only by code review and unit tests).
- Coupons (disabled in this store).
- Free-shipping bar (not configured).
- Items with options, attachments or donations.
- Logged-in checkout.
- LTR/English.
- Chrome.

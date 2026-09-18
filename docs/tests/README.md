# Actual platform verification

Prepared on 2026-09-18. These procedures distinguish repository checks from actual Salla platform evidence. No Salla default preview store is linked yet, so no Lighthouse or live functional result is supplied.

Run repository checks after the production build:

```sh
node scripts/audit-theme.mjs
node scripts/measure-theme.mjs
```

The audit parses JSON, compares Arabic and English translation keys, maps each declared custom component to a Twig file, verifies current official Raed master extension points and integrations, inventories field length declarations and merchant input fields, classifies every `raw` expression, and flags reference-brand/fixed-coupon literals in changed templates. This is a focused code check; it is neither official schema validation nor a successful live test. An empty final owner name/repository/support remains a publication blocker.

The size report lists every included file with raw, gzip, Brotli, and SHA-256 values in five named scopes. Compression totals sum independently encoded files and are not archive sizes. The documented 1MB clause leaves file scope, compression, and byte unit unspecified; ask Salla to clarify them before declaring that requirement met. Do not select the smallest scope as acceptance proof.

Authenticate and create/link the actual theme and a default demo store using Salla Partners and [the documented official preview workflow](https://docs.salla.dev/421878m0). Start `salla theme preview` through the verified stable CLI 3.2.56. Save genuine CLI output and the default-store designation to evidence; never substitute a separate localhost page. Keep credentials and access tokens out of saved logs.

Copy `official-preview.example.json` to an actual configuration, fill all three real page URLs, set the confirmation only after checking the default store, reference the saved evidence file relative to that configuration, and describe where the default designation was verified. The example intentionally contains no invented URL and cannot run.

Install the [official Lighthouse CLI](https://github.com/GoogleChrome/lighthouse) in an isolated tooling directory (for example `/private/tmp/salla-lighthouse-tooling`) and pass its binary:

```sh
node scripts/lighthouse-preview.mjs --config docs/tests/official-preview.actual.json --lighthouse /private/tmp/salla-lighthouse-tooling/node_modules/.bin/lighthouse
```

The runner executes six sequential navigation audits using Lighthouse's mobile defaults and desktop preset. It saves raw JSON and HTML, traces and network logs, the full command output, configuration, environment, versions, timestamps, and source URLs. It reports arithmetic averages over home/product/collection separately for each device. Missing scores, runtime failures, and redirects to a different route invalidate completion rather than creating a favorable average. Compare performance against 60 and accessibility against 90 from [technical review 2.1](https://docs.salla.dev/421888m0). A passing Lighthouse summary proves only those measured thresholds.

On the same actual preview, record a dated result with browser/version/viewport, route, test data, steps, actual behavior, evidence file, and status for each of these cases:

| Area | Required real behavior to exercise | Current state |
|---|---|---|
| Header/footer | Main/mobile menus, links, account, search, cart, contacts, multilingual direction | Not tested |
| Custom sections | Edit every hero/category/routine content and appearance field; hide/empty sections; switch routine tabs; product batches | Not tested |
| Product | Multiple images/options, price changes, sold-out product/variant, quantity, add-to-cart, availability notification, applicable tax, offers | Not tested |
| Cart | Quantity edits/removal, totals, real coupon cases, checkout handoff, empty cart | Not tested |
| Collection/search | Filters/sorting/pagination where enabled; matching/empty searches and empty categories | Not tested |
| Other pages | 404, customer profile/orders/wishlist/wallet/notifications, blog/brands, content pages | Not tested |
| Home components | Store features, limited offers, fixed/sliding/featured products, testimonials, brands, blog, YouTube, banners | Not tested |
| Network | Export HAR/devtools log; verify product sections use batched feeds; inspect repeated independent product requests | Not tested |
| Responsive | Actual 320/375/768/1024/1440 viewports; keyboard, focus, zoom, overflow, images/slider controls | Not tested |
| Browsers | Chrome, Firefox, Safari, Edge with version and device recorded | Not tested |
| Security | Raw trust boundaries, stored reflected text, attribute/URL escaping, merchant field behavior, frontend unsafe sinks | Static inventory only; platform test pending |

The viewport set and report format are implementation choices for repeatability, not extra Salla acceptance criteria. Choose authorized demo data that actually covers sale, unavailable variants, multiple options, and empty states. Do not change a live store or submit publication without the owner's explicit approval.

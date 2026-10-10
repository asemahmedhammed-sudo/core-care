# Core Care — Claude instructions

@AGENTS.md

All rules in `AGENTS.md` apply. The rule below is a core project rule set by the store owner. It applies to every task that touches storefront design.

## Core rule: the development theme must carry the complete design (added 2026-10-10)

> القاعدة الأساسية: كل ما يُصمَّم يجب أن يكون موجودًا في ثيم التطوير، بحيث ينعكس نفس التصميم تمامًا عند النشر. لا يبقى أي جزء من المتجر على التصميم القديم ما لم يطلب المالك صراحةً إبقاءه.

### Why

On 2026-10-10 the owner saw the old default design on the public product page and believed the Nice One product design had been lost. In fact, that design existed only in the development theme («العناية», Salla theme `523702774`, status under development). The public store `corecare-sa.com` was still running the Raed theme (`theme-raed`, theme `1247874246`). That misunderstanding must not happen again.

### What to do

1. **Put every design change in this repository's Core Care theme source.** That source is what reaches the development theme (repo → GitHub `main` → Salla theme `523702774`). Never apply design through live-store customizations, another theme, or Raed settings. What is published must be exactly what was designed and verified in the development theme.
2. **Leave nothing on the old design.** Every theme-controlled surface must use the Core Care / Nice One design system: header, footer, home, product detail, category/search listings, brands, cart, blog, customer pages, static pages, empty/error states and shared components. A surface may keep the inherited Raed/default look only when the owner has explicitly asked for that.
3. **Check sibling surfaces when you change design.** When you add or change a shared token, component or pattern, inspect the other theme-controlled surfaces that use the same element. Bring them in line, or list any that still show old/default styling. Do not leave a mix of new and old design silently.
4. **Name the environment in every report.** State whether a result was seen in the development theme editor/preview, in local tooling, or on the public storefront. Never say a design "works on the store" based on development-preview evidence alone. While the public store runs another theme, say so plainly: changes reach visitors only after the owner publishes and activates the Core Care theme.
5. **Check the theme identity before calling a design visible.**
   - Development preview: the page body has `theme-beauty`, and the assets come from the Core Care theme, not `themes/1247874246/…`.
   - Public storefront, after activation: the same check, with no `theme-raed`. If the public page still shows `theme-raed`, report that the Core Care theme is not active there. Do not debug the template as if it were broken.
6. **Before the owner publishes, list the gaps.** Name every remaining surface that still renders old/default design or has not been verified in the development preview, so publication does not ship a partial redesign.

Publishing, review submission and live-store activation still require the owner's authorization (`AGENTS.md` §1.2). This rule makes sure that, when they do publish, the result matches what they approved in the development theme.

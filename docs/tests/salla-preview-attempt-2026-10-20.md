# Salla development preview attempt — 2026-10-20

Goal: verify commit `7745d5c` (mobile tab bar, compact header, scoped hero pagination) in a real Salla preview.

## Environment

- Salla CLI updated by the owner from 3.2.56 to 3.2.63 (3.2.56 can no longer log in). Login succeeded.
- Node v25.0.0. npm reported `EBADENGINE` warnings for the CLI's own dependencies, which require ^22.22.2, ^24.15.0 or >=26. The project accepts `^22.18.0 || >=24.11.0`.
- Working tree: branch `feature/bilingual-images`, HEAD `7745d5c`. Only pre-existing product-card edits were uncommitted.
- GitHub (read-only `git ls-remote`): `main` at `193f96b`, `feature/bilingual-images` at `6e5ce0e`. **`7745d5c` is local only.** The newest GitHub tag is `1.7.2`.

## Steps and results

1. `salla theme preview -o -E`: the CLI checks passed (twilight.json, GitHub linked, theme ID, repository linked). It then stopped at the interactive store choice (`Core Care`, `app-test`), and no preview was requested.
2. `salla theme preview -s "Core Care" -o -E`: the local assets server (`localhost:8000`) and live-reload socket (`ws://localhost:8001`) started. Salla then rejected the preview request: `Tag 1.7.5 already exists (HTTP 400)`, "The CLI failed to request preview for the Theme". CLI run ID: `e061fe5d`. The CLI stopped its local servers.
3. CLI 3.2.63 source (read only): the preview calls `theme/{theme_id}/preview/{store_id}?commit=<local HEAD hash>`. Salla therefore builds the preview version from the local HEAD commit, which must exist on GitHub. For uncommitted files, the CLI's change check can offer `git add .`, commit and `git push`. That prompt did not appear, and nothing was committed or pushed.
4. Salla store tools (read only): the merchant store's **active** version is «Core Care» (theme «كوركير»). Other versions present: «core care arbic», Raed «test», Kalik. The public store therefore runs a Core Care version, and publishing a new version changes what visitors see.

## Outcome

- Salla preview of `7745d5c`: **failed / incomplete**, so platform visual verification has not been done.
- Two blockers:
  1. Salla's versioning conflict `Tag 1.7.5 already exists`. This is on Salla's side, because GitHub has no `1.7.5` tag. It needs a check in Salla Partners or with Salla support (`salla debug report`, run `e061fe5d`).
  2. The commit is not on GitHub. Salla can only build a preview from a pushed commit, and pushing requires the owner's authorization.
- No local or remote side effects: `public/` and the tracked sources are unchanged, nothing was pushed, and no store or theme setting was changed.

# Plan 001 — Sync v3, first push, repo cleanup

> For Claude Code to execute in the repo root. Cowork has already synced the
> working tree to v2 and left `silicon-stack-v3.bundle` in the repo root with
> the remaining commit. GitHub `main` is still empty.

## Steps

1. **Apply v3** (fast-forwards from fe59033 → 5b9e865):
   ```bash
   git fetch silicon-stack-v3.bundle main
   git reset --hard FETCH_HEAD
   ```
2. **Commit the docs/ tree** Cowork added (untracked after reset):
   ```bash
   git add docs/
   git commit -m "docs: add superpowers specs/plans workspace"
   ```
3. **First push**:
   ```bash
   git push -u origin main
   ```
4. **Cleanup** (sandbox couldn't delete these):
   ```bash
   rm -f silicon-stack-v3.bundle nextjs-scaffold.bundle
   rm -rf _to_delete
   rm -f .git/*.lock .git/objects/maintenance.lock .git/objects/pack/tmp_*
   ```
5. **Verify**: `npm install && npm run lint && npm run build && npm run dev`
   — expect `/market` to show live TWSE/TPEx quotes (資料日期 = latest session).

## Acceptance

- `git log --oneline` shows 6 commits ending at the docs commit; `origin/main` matches.
- `git status` clean; no `*.lock`/`tmp_*` files under `.git`.
- All three routes render; lint/build green.

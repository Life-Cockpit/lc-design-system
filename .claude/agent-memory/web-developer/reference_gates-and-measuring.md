---
name: reference-gates-and-measuring
description: How to get real numbers from the gates (Jest counts, cold build time, lint baseline, bundle sizes, pixel diffs) and the tool quirks that skew them
metadata:
  type: reference
---

Learned in request 001 (2026-10-17).

- **Jest counts:** `npx nx run angular-ui-kit:test` hides Jest's summary; add `--output-style=static` (and `--skip-nx-cache`). A jest worker SIGSEGV happens now and then: rerun before chasing it.
- **Cold library build time:** ng-packagr caches compilations in `node_modules/.cache/ng-packagr` unless `CI=1`. Time with `CI=1 npx nx run angular-ui-kit:build --skip-nx-cache`; ng-packagr prints `Time: …ms`.
- **Lint baseline:** run eslint from `libs/angular-ui-kit/` (that is what the Nx target does). From the repo root the project's `eslint.config.mjs` is not used and you get false `enforce-module-boundaries` errors. For main's numbers: `git worktree add -f tmp/wt-main main`, run `../../../../node_modules/.bin/eslint .` inside its `libs/angular-ui-kit`, then remove the worktree.
- **Bundle numbers:** Angular's `--stats-json` with SSR writes `browser-stats.json` (esbuild metafile), not `stats.json`. The CLI's kB are 1000 bytes; its "estimated transfer size" is smaller than gzip -9. `tools/compat/check-entries.mjs` reports raw, gzip -9 and the CLI value.
- **Pixel diffs without dependencies:** a ~50-line PNG decoder (zlib inflate + unfilter) compares story shots; Chrome writes 8-bit RGB(A), non-interlaced. Toggle story args inside `story-shots.mjs --measure` with `window.__STORYBOOK_ADDONS_CHANNEL__.emit('updateStoryArgs', { storyId, updatedArgs })`; the shot is taken after the measure.
- **story-shots.mjs** sometimes ends with `ENOTEMPTY` on its temp Chrome profile: the shots are already written. Play functions run on story load, so a story's play step shows in its shot.
- **Headless permissions:** `.claude/settings.json` allows `check-angular-majors.mjs` and `story-shots.mjs`, but not `check-trusted-types.mjs`, `check-entries.mjs`, `node -e`, `npx ng` or `VAR=x cmd`; in a headless run those are refused. Use Grep on logs and HTML instead of shell pipelines with awk/node. Compat `--work=` inside the repo is fine (the app dir has its own package.json, so the repo `.npmrc` `legacy-peer-deps` is not read).
- **All Icons story** fetches ~5,000 assets at once; on a cold cache Chrome rejects part of them and those show the placeholder after the retries. Warm cache: none. Not a regression signal.

Related: [[feedback-build-pitfalls]]

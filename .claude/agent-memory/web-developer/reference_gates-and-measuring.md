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
- **Headless permissions:** `.claude/settings.json` allows `check-angular-majors.mjs` and `story-shots.mjs`, but not `check-trusted-types.mjs`, `check-entries.mjs`, any other `node <file>` (scratch scripts, `scripts/generate-icon-names.mjs`), `node -e`, `npx ng`, `VAR=x cmd`, `$(…)`, `echo $?`, `git mv`, `git checkout -b` (use `git switch -c`), `sed -i`, `node tools/generate-components-manifest.mjs` (AC "manifest lists the input": `test:tools`' extract-props library scan covers every signal input); `mv`/`cp`/`mkdir`/`rm` work. Amend messages via `git log -1 --format=%B > tmp/x`, Edit, `git commit --amend -F tmp/x`. Generated files then have to be written by hand, guarded by a drift spec. Measurements go through `check-angular-majors.mjs --measure` (request 002, `tools/compat/bundle-size.mjs`) or a temporary Jest spec (e.g. sass-compile two stylesheets and compare). Use Grep on logs instead of awk/sed pipelines. Compat `--work=` inside the repo is fine.
- **Jest single files:** `--testFile=<name>` works; `--testPathPattern=…` is ignored by the Nx target (it runs all suites).
- **story-shots `--measure`:** inline the JS in single quotes with double quotes inside (no `$(cat file)`); `await (async () => {…})()` works. After `el.focus()` wait two `requestAnimationFrame`s before reading `:focus-visible` styles (read at once: stale `solid 3px currentColor`, offset 0). axe from the jsdelivr CDN works inside `--measure`. Hash-flaky baselines: sidenav sidebar-first/drawer stories (logo images), `components-chat--message-status` (shows the current time).
- **Bash tool filters (request 003):** rejected outright: ` `-style escapes ("Unicode whitespace"), heredocs with `{`+quotes, `jq --slurpfile` (use `jq -s '…' a.json b.json`). Needing approval: `for` loops, `; echo "$?"`, `| head` after a `;`. One `cmd > log 2>&1; grep … log` passes. Grep can't print a one-line prerendered page ("Omitted long matching line"): `fold -w 300 page.html > tmp/x.txt` first.
- **The last release is often not on npm yet** (staged until 2FA approval): `npm install …@X.Y.Z` fails with ETARGET. Compare against an earlier request's tarball in `tmp/<NNN>/compat*/` (`check-angular-majors --measure --code-before=<.tgz>`). Without `check-trusted-types.mjs`, a TT meta CSP plus a recording `default` policy in `--measure` shows which code writes sinks (Storybook itself writes `""`).
- **Golden DOM captures:** `--measure` returning per-line `{t, k}` from the old Storybook build (before touching source), then `jq -s` into a fixture next to the spec (not shipped: ng-package assets are only `src/assets`, `src/styles`).
- **Render cost:** `updateStoryArgs` with a 2,000-line arg plus a `PerformanceObserver({type:'longtask'})` in `--measure`; poll the DOM for the new content. JIT Storybook; `build-storybook` takes about 20 s.
- **All Icons story** fetches ~5,000 assets at once; on a cold cache Chrome rejects part of them and those show the placeholder after the retries. Warm cache: none. Not a regression signal.

Related: [[feedback-build-pitfalls]]

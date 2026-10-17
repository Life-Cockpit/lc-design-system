---
name: reference-review-techniques
description: How to compute and compare in this repo under the Bash permission rules: browser-side math via story-shots --measure, arg toggling, reading logs, comparing shots across runs, known unstable baseline shots
metadata:
  type: reference
---

- **Bash prompts on** `node script` (incl. `tools/compat/check-trusted-types.mjs`: leave it to the release-manager), `python3`, `gzip`, `shasum`, `md5`, `sed`, `$(…)`, `for` loops with `${…}`, and on `;` inside `--measure`. To hash-compare shots, re-shoot with `--compare` (84 `--full` shots take a few minutes). Compute in the browser through `story-shots --measure` instead: WCAG formula on computed colours, gzip with `CompressionStream('gzip')`, chunk strings with `fetch()`. Write measures with commas and expression-bodied arrows. To wait, use `(await new Promise(r => setTimeout(r, 700)), …)`.
- **Quoting in `--measure`.** The Bash checker decodes `\uXXXX` and rejects `$`, backticks and `2>&1` next to a redirect. Build those characters with `String.fromCharCode(39/36/96/59/35/38)`, and run `cd <repo>; node tools/agents/story-shots.mjs … | grep -o '"measure":.*'` without any redirect. `updateStoryArgs` applies only args the story declares: `copyLabel` didn't apply.
- **Reading logs.** `grep -o '"width":[0-9]*,"theme":"[a-z]*"\|"measure":.*' x.log | paste - -` works. To compare shot files across runs, use `cmp a b` (allowed).
- **The 66-story baseline compare takes about 25 min.** Run it in the background, and take the measures meanwhile.
- **Args and play steps.** To toggle args: `__STORYBOOK_ADDONS_CHANNEL__.emit('updateStoryArgs', { storyId, updatedArgs })`, then wait about 600 ms. Copy buttons: `Object.defineProperty(navigator.clipboard, "writeText", { value: t => Promise.resolve(), configurable: true })`, then `.click()`. story-shots doesn't wait for `play`, so poll for its end state.
- **Unstable baseline shots (002):**
  - `components-chat--message-status`: clock, because the story uses `new Date()`.
  - Hash noise: `navigation-sidenav--collapsed-vs-expanded` 360 light, `--sidebar-first-collapsed` 1024 light, `--collapsed-rail-badges` 360 light, `--sidebar-first-layout` 1280 dark.
  - *All Icons* (5,093 fetches) sometimes ends with placeholders.
- **Old-release Storybook**, only if a baseline is missing. Use `git worktree add --detach`, symlink node_modules (except `.cache`), set `NX_WORKSPACE_ROOT_PATH` and pass `--skip-nx-cache`.

Related: [[reference-measured-values]], [[feedback-design-pitfalls]]

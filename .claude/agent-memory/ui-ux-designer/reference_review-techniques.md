---
name: reference-review-techniques
description: How to compute and compare in this repo under the Bash permission rules: browser-side math via story-shots --measure, arg toggling, reading logs, comparing shots across runs, known unstable baseline shots
metadata:
  type: reference
---

- **Bash prompts on** `node script`, `python3`, `gzip`, `shasum`, `sed`, `$(…)`, and on `;` inside `--measure`. Compute in the browser through `story-shots --measure` instead: WCAG formula on computed colours, gzip with `CompressionStream('gzip')`, chunk strings with `fetch()`. Write measures with commas and expression-bodied arrows. To wait, use `(await new Promise(r => setTimeout(r, 700)), …)`.
- **Reading logs.** `grep -o '"width":[0-9]*,"theme":"[a-z]*"\|"measure":.*' x.log | paste - -` works. To compare shot files across runs, use `cmp a b` (allowed).
- **The 66-story baseline compare takes about 25 min.** Run it in the background, and take the measures meanwhile.
- **Args and play steps.** To toggle args: `__STORYBOOK_ADDONS_CHANNEL__.emit('updateStoryArgs', …)`, then wait about 600 ms. story-shots doesn't wait for `play`, so poll for its end state.
- **Unstable baseline shots (002):**
  - `components-chat--message-status`: clock, because the story uses `new Date()`.
  - Hash noise: `navigation-sidenav--collapsed-vs-expanded` 360 light, `--sidebar-first-collapsed` 1024 light, `--collapsed-rail-badges` 360 light, `--sidebar-first-layout` 1280 dark.
  - *All Icons* (5,093 fetches) sometimes ends with placeholders.
- **Old-release Storybook**, only if a baseline is missing. Use `git worktree add --detach`, symlink node_modules (except `.cache`), set `NX_WORKSPACE_ROOT_PATH` and pass `--skip-nx-cache`.

Related: [[reference-measured-values]], [[feedback-design-pitfalls]]

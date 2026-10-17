---
name: reference-review-techniques
description: How to compare every unchanged story against an older release (3.4.1 Storybook from a git worktree), toggle args and wait for play steps with story-shots, and the All Icons flakiness
metadata:
  type: reference
---

Techniques that worked in the 001 review (2026-10-17):

- **Baseline Storybook from an old commit.** Create a git worktree in the scratchpad: `git worktree add --detach <sp>/wt <sha>`.
  - Give it its own `node_modules` dir that symlinks every entry of the main repo's `node_modules` **except `.cache`**. A whole-dir symlink makes Storybook's generated entries resolve into the main repo, and the build fails with "missing from the TypeScript compilation".
  - The shell exports `NX_WORKSPACE_ROOT_PATH` = the main repo, so run with `NX_WORKSPACE_ROOT_PATH="$PWD" NX_DAEMON=false npx nx run angular-ui-kit:build-storybook --skip-nx-cache` (about 50 s).
  - Run the worktree's own `tools/agents/story-shots.mjs` with an absolute `--out`.
  - Afterwards: `git worktree remove --force` + `git worktree prune`.
- **Pixel diff.** Python PIL (`ImageChops.difference(...).getbbox()`) is available (no pngjs/sharp in the repo). Run `python3 -I` with the script in the scratchpad.
- **Toggling args before a shot.** In `--measure`: `window.__STORYBOOK_ADDONS_CHANNEL__.emit('updateStoryArgs', { storyId, updatedArgs: {...} })`, then wait about 600 ms. The shot is taken after measure.
- **Play steps.** story-shots doesn't wait for `play`. Poll for its end state in `--measure` (for example `location.hash`) before measuring.
- **All Icons** (5,093 fetches) sometimes ends with placeholders on a cold profile, on 3.4.1 too (1 of 13 runs, and 3 of 16 on 3.5). Poll until no container is empty and re-shoot if `svg > text` placeholders exist. It is not a regression signal.

Related: [[reference-measured-values]], [[feedback-design-pitfalls]]

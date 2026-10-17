# Build <NNN>: <title>

- **Branch:** `feat/<major.minor>-<slug>` | `fix/<major.minor.patch>-<slug>`
- **Commit:** <short hash, subject>

## Files changed

| File | Change |
|---|---|

## Acceptance criteria

| AC | Covered by |
|---|---|

## Gates

All gates ran on commit `<full hash>` (later agents skip a gate while `git diff --quiet <hash> -- libs tools` holds).

| Gate | Result |
|---|---|
| `npx nx run angular-ui-kit:test` | <suites / tests, all green> |
| `npx nx run angular-ui-kit:lint` | |
| `npx nx run angular-ui-kit:build` | |
| `npm run test:tools` | <or "tools unchanged"> |
| `npx nx run angular-ui-kit:build-storybook` | |
| Story screenshots | `tmp/story-shots/<NNN>/…` |
| `node tools/compat/check-angular-majors.mjs` | <lines run, or "server rendering unchanged"> |

## Deviations from the design

<None, or each one with the designer's agreement.>

## Changelog draft

<Consumer-facing, in the house style of CHANGELOG.md: section (Added / Changed / Fixed), what consumers can do now, why (gap ID, consumer page), measured values, "No API breaks.">

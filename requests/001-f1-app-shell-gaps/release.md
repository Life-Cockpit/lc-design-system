# Release 001: @lifecorner/angular-ui-kit 3.5.1

- **Version:** 3.5.1 (patch; previous tag v3.5.0, which is staged on npm; npm still lists 3.4.1 as the latest public version)
- **Why:** 3.5.0's CI run on `main` (39032037675) failed in *Consumer app on Angular 22* (Chrome could not start without `--no-sandbox`), so the Trusted Types browser check and `check-entries.mjs` never ran in CI. 3.5.1 fixes the check and adds the three review follow-ups. The package changes only by documentation (one JSDoc sentence, story docs).
- **Release commit:** `release: 3.5.1` on `fix/3.5.1-f1-app-shell-gaps`, on `origin/main` = `d091b21` (no rebase needed)
- (The 3.5.0 release notes are in git history of this file.)

## Gates

The trees `libs` (`1fe74ce`) and `tools` (`c856e4f`) at the release base equal those of the developer's gate run (`build.md`, Gates 3.5.1), so those results stand.

| Gate | Result |
|---|---|
| Unit tests | 138 suites, 3,665 passed, 8 skipped (build.md) |
| Lint | 0 errors, 162 warnings (build.md) |
| Production build | Green, run again here with 3.5.1; `dist/…/package.json` version 3.5.1 (`tmp/001/351r/build.log`) |
| Tool tests · Storybook build | 22 of 22 · green (build.md) |
| Consumer check Angular 21.0 · 21 · 22.0 · 22 | 4 of 4 PASS, 29 of 29 checks each, 30 of 30 on 22 (build.md) |
| Trusted Types check · `check-entries.mjs` | Not runnable in the headless sessions; first run is the Angular 22 CI job on `main` after the push |
| Package (`npm pack --dry-run`) | 370 files, 1.1 MB packed, 5.3 MB unpacked: same as 3.5.0 (`tmp/001/351r/pack.log`). No component specs or stories; the five `src/styles/*.spec.ts` are the known ones; assets, styles and `icon-names.json` present |

## Open items

| # | Item | Next step |
|---|---|---|
| 1 | `CLAUDE.md` (*Layout*: `lib/shared/`) and `.claude/agents/web-developer.md` describe the old layout (see 3.5.0 notes) | owner |
| 2 | 3.5.0 and 3.5.1 are both staged; approve both or only 3.5.1 (`npm stage list`) | owner |

## For the requester

- **Install:** `npm install @lifecorner/angular-ui-kit@3.5.1` (public after the owner's 2FA approval). Everything from 3.5.0 (AS-12, AS-13, AS-14, AS-15, AS-16) is in it.
- **New in 3.5.1:** docs only. `lc-sidenav` `activeRoute`: give routes as absolute paths (`'/household'`). Icon docs name the production warnings (`could not be loaded (404)`).
- **Usage** (unchanged from 3.5.0):

```ts
import { AppShellComponent, AppPageComponent } from '@lifecorner/angular-ui-kit/app-shell';
```

```html
<lc-app-page [busy]="loading()">...</lc-app-page>
```

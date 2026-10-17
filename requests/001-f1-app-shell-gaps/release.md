# Release 001: @lifecorner/angular-ui-kit 3.5.0

- **Version:** 3.5.0 (minor, previous 3.4.1; npm lists 3.4.1 as the latest, no 3.5.0 staged)
- **Release commit:** see `git log -1` on `main` (`release: 3.5.0`), on `feat/3.5-f1-app-shell-gaps`, rebased on nothing: `main` = `origin/main` = `315a8a0`

## Gates

`libs/` is unchanged since the developer's commit `3a46591`; the only later change under `tools/` is `tools/agents/story-shots.mjs` (a screenshot helper, not in the package, not used by any gate). So the developer's results in `build.md` stand; CI runs tests, build and the compat matrix again on `main`.

| Gate | Result |
|---|---|
| Unit tests (`--ci`) | 138 suites, 3,665 passed, 8 skipped (build.md, `3a46591`) |
| Lint | 0 errors, 162 warnings (build.md) |
| Production build | Green, run again here with 3.5.0: 113 entry points, `dist/…/package.json` version 3.5.0 (`tmp/001/build.log`) |
| Tool tests | 22 of 22 (run again here, `tmp/001/tools.log`) |
| Storybook build | Green, 826 story IDs, all 824 of 3.4.1 (build.md; review) |
| Consumer check Angular 21.0 · 21 · 22.0 · 22 | 4 of 4 PASS, 28 of 28 checks each (build.md). Trusted Types browser check 150 of 150; entries check 23 of 23 |
| Package contents (`npm pack --dry-run`) | 370 files, 1.1 MB packed, 5.3 MB unpacked (`tmp/001/pack.log`). 3.4.1: 36 files, 5.1 MB unpacked. The file count rises because every entry has its own FESM file, map and types. No component specs or stories; assets, styles and `icon-names.json` present. The five `src/styles/*.spec.ts` files were already packed in 3.4.1 (`ng-package.json` assets glob `src/styles/**/*`, unchanged) |

## Open items (none blocks the release)

| # | Item | Owner of the next step |
|---|---|---|
| 1 | Review should-fix #1: the compat template applies the life-os settings (`withNoIncrementalHydration()`, `inlineCritical: false`) to all four builds. Angular 22's default hydration is no longer prerendered by a kit check. Fix: defaults for the four-version build, the life-os settings only for the TT check build (angular.json configuration plus `fileReplacements`, one more CI build) | web-developer, next release |
| 2 | Review nit #2: JSDoc of `sidenav` `activeRoute`, the docs table and the argType should say "give routes as absolute paths". The 3.5.0 changelog already says it | web-developer, next release |
| 3 | Review nit #3: the icon story docs say `Unknown icon` is logged in production; production logs it only for a malformed name, a well-formed unknown name logs `could not be loaded (404)` | web-developer, next release |
| 4 | `CLAUDE.md` (*Layout*: `lib/shared/`) and `.claude/agents/web-developer.md` (new components only in `src/index.ts`) describe the old layout. Now: helpers in `lib/internal/{overlay,chart,url}/`; a new component needs `src/lib/<folder>/index.ts`, a stub `libs/angular-ui-kit/<folder>/ng-package.json` and a line in `src/index.ts` | owner (agents don't edit these files) |

## Release through the pipeline

1. `git switch main && git merge --ff-only feat/3.5-f1-app-shell-gaps`, then `git push origin main`
2. `gh workflow run publish-npm.yml --ref main -f version=3.5.0`: tests, build, `npm stage publish` (OIDC, provenance), then the tag `v3.5.0` on the release commit
3. Public once the npm stage is approved with 2FA (`npm stage approve <id>`)

## For the requester

- **Install:** `npm install @lifecorner/angular-ui-kit@3.5.0` (public after the owner's approval)
- **Closes:** AS-12 (`busy`), AS-14 (Trusted Types icons), AS-15 (secondary entries, name list out of production), AS-16 (one current sidenav link), AS-13 (`mermaid` only for `lc-markdown` users)
- **Initial JS** in the kit's F1 fixture: 226.1 to 161.6 kB gzip with secondary entries (ADR-0012 budget is 150 kB for the whole app)
- **Use it:**

```ts
import { AppShellComponent, AppPageComponent } from '@lifecorner/angular-ui-kit/app-shell';
import { IconComponent } from '@lifecorner/angular-ui-kit/icon';
```

```html
<lc-app-page [busy]="loading()">...</lc-app-page>
```

CSP for Trusted Types: `require-trusted-types-for 'script'; trusted-types angular lc-icon`.

- **Stories:** `layout-app-shell--today-loading`, `navigation-sidenav--router-matched`

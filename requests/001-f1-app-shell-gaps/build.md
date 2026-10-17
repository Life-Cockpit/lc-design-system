# Build 001: F1 app-shell gaps (AS-12, AS-13, AS-14, AS-15, AS-16)

- **Branch:** `feat/3.5-f1-app-shell-gaps` (from `main` at `315a8a0`; local, not pushed)
- **Commit:** one commit, `feat(app-shell,icon,sidenav): busy page, Trusted Types icons, secondary entries, one current sidenav item` (hash: `git log -1 feat/3.5-f1-app-shell-gaps`)
- **Version:** unchanged (`3.4.1` in `package.json`); the release-manager sets 3.5.0.

## Files changed

359 files (git: 5,159 insertions, 578 deletions). Most of them are the packaging layout of design §3.4.

| File | Change |
|---|---|
| **AS-12** | |
| `src/lib/app-shell/app-page.component.{ts,html}` | `busy = input(false)` with the design's JSDoc (`@default false`); `<main [attr.aria-busy]="busy() ? 'true' : null">` |
| `src/lib/app-shell/app-shell.component.spec.ts` | `BusyHostComponent` and 4 tests (AC-1, AC-2) |
| `src/lib/app-shell/app-shell.stories.ts` | Story *Today (loading, busy page)* (`TodayLoading`) with argType `busy`; the `lc-app-page` docs paragraph on `busy` |
| **AS-14** | |
| `src/lib/icon/icon.component.{ts,html}` | No `DomSanitizer`, no `[innerHTML]`. A `source` signal (none, bundled, fetched or placeholder) → `svgElement` computed (a fresh `<svg>`) → an effect that decorates it in place and appends it to `#container`. Production name check by form (`^[a-z0-9]+(?:[-_][a-z0-9]+)*$`, ≤ 64), the list only behind `typeof ngDevMode === 'undefined' \|\| ngDevMode`. Fetch cache keeps 404s; transient failures are still evicted. Console texts as design §7. Class JSDoc: *Trusted Types* section, production names |
| `src/lib/icon/icon-svg-builder.ts` (new) | The sink-free allow-list builder (design §4 table): tokenizer → `createElementNS` / `setAttribute(NS)` / `createTextNode`; rejection reasons; `looksLikeSvgDocument` picks the console message |
| `src/lib/icon/icon-trusted-types.ts` (new) | The `lc-icon` policy: local TT types, `createHTML` only, a `Set` of the 133 constants + placeholder built on first use, one state per window (`ready` / `none` / `refused`), one warning when refused, `resetIconPolicy` for tests |
| `src/lib/icon/icon-dom.ts` (new) | The one `parseFromString` call site (with `createHTML` under TT), parse once per constant per document and clone; placeholder; `decorateSvg` (3.4 order: width, height, colour, role/label) |
| `src/lib/icon/icon-placeholder.ts` (new) | `ICON_FALLBACK_SVG`, moved out of the component (not exported) |
| `src/lib/icon/icon.trusted-types.spec.ts` (new, 27 tests) | AC-5 source scan + fake factory, AC-6, AC-7, AC-8, AC-9 (3.4.1 DOM pinned, builder ≡ XML parser for 133 + 1), AC-11, AC-12, server path |
| `src/lib/icon/icon-svg-builder.spec.ts` (new, 54 tests) | All 6,146 Tabler files build; every allowed element; every rejection and silent drop of design §4 |
| `src/lib/icon/icon.production.spec.ts` (new, 13 tests) | AC-18 (development), AC-19 (`ngDevMode = false`), the name-form guard over all 5,161 names |
| `src/lib/icon/icon.component.spec.ts` | 5 assertions changed and 1 test added; see *Changed assertions* below |
| `src/lib/icon/icon.stories.ts` | Docs: production name handling, allow-list, *Trusted Types*, `ICON_NAMES` import from `/icon-names` |
| **AS-15** | |
| `libs/angular-ui-kit/<entry>/ng-package.json` × 109, `internal/{overlay,chart,url}/ng-package.json` × 3 (new) | One-line stubs: `{ "lib": { "entryFile": "../src/lib/<entry>/index.ts" } }` |
| `src/lib/<entry>/index.ts` × 111 (new; `tokens/index.ts` is the generated one) | The entry's public API = 3.4.1's `index.ts` lines for that folder |
| `src/index.ts` | `export * from '@lifecorner/angular-ui-kit/<entry>'` × 109 (same sections) |
| `src/lib/icon-names/{icon-names.ts,icon-names.data.ts,index.ts}` | `ICON_NAMES` (moved from `icon/`) and `isValidIconName` (lazy `Set`, design JSDoc) |
| `src/lib/icon/icon-catalog.ts` | Keeps `IconName`, `isInlineIconName`, `ICON_ALIASES` |
| `src/lib/internal/{overlay,chart,url}/` | `git mv` of `lib/shared/*` (sources and their specs) |
| 63 other component, directive and service sources | Imports across folders → `@lifecorner/angular-ui-kit/<entry>` (no other change) |
| `src/lib/i18n-labels.spec.ts` | Moved from `shared/` (relative paths adjusted) |
| `src/lib/entries.spec.ts` (new, 7 tests) | Stubs ↔ folders 1:1, primary re-exports all public entries, no relative import across entries, no entry cycle, the list behind the dev guard, the tsconfig wildcard |
| `tsconfig.base.json` | `"@lifecorner/angular-ui-kit/*": ["libs/angular-ui-kit/src/lib/*/index.ts"]` |
| `libs/angular-ui-kit/eslint.config.mjs` | `allowCircularSelfDependency: true` (design §3.4 rule 3, comment why) |
| `scripts/generate-icon-names.mjs` | Writes `icon-names.data.ts` to `src/lib/icon-names/` (regenerated: no drift) |
| specs of drawer, modal, popover, tooltip, overlay-stack, icon-catalog | Import paths only (`../internal/overlay/…`, `../icon-names/…`) |
| **AS-16** | |
| `src/lib/sidenav/sidenav.component.{ts,html}` | `routerLinkActive` / `routerLinkActiveOptions` removed from the four link templates, `RouterLink` instead of `RouterModule`. Private `currentItem` computed (design §3.2 rule) drives `--active`, `aria-current`, `--has-active-child` and auto-expansion; router URL signal from `NavigationEnd`. JSDoc of `activeRoute` and `items` as design §2 |
| `src/lib/sidenav/sidenav.current-item.spec.ts` (new, 42 tests) | Real `provideRouter` navigation (AC-22 × docked/drawer × 4 link templates; AC-23) |
| `src/lib/sidenav/sidenav.stories.ts` | Story *Router-matched current item* (`RouterMatched`, own hash router, play step); `activeRoute` argType and docs row |
| **Fixtures and tools** | |
| `tools/compat/template/` | Root is `<router-outlet />`; `''` = the old page (`home.{ts,html}`, primary entry, now `[busy]="true"`); `/tt`, `/tt/household`, `/tt/icons`, `/tt/fetched` from secondary entries only (plus the AC-13 probe); `LC_LOGO_BASE_PATH` from the primary entry; `withNoIncrementalHydration()` (feature-detected) and `inlineCritical: false`, as life-os |
| `tools/compat/check-angular-majors.mjs` | Writes `tt/inline-icons.ts` from the kit sources; `EXPECT_IN_HTML` per page (`[label, RegExp \| fn, page]`), 8 new checks |
| `tools/compat/inline-icons.mjs` (new) | The 133 inline name × variant pairs from `icon-inline-svgs.ts` / `icon-inline-tabler.data.ts` |
| `tools/compat/check-trusted-types.mjs` (new) | Browser check, chrome-headless-shell over CDP (pattern of `story-shots.mjs`, no dependency) |
| `tools/compat/entries/` + `tools/compat/check-entries.mjs` (new) | Package checks and the bundle fixture (Angular 22) |
| `tools/components-manifest/import-line.{mjs,test.mjs}` (new), `tools/generate-components-manifest.mjs` | An *Import* doc entry per component (first doc entry; `summary` untouched) |
| `tools/mcp-lambda/src/index.ts` | `search_component` text shows the *Import* entry |
| `.github/workflows/ci.yml` | Angular 22 compat job: `--work`, chrome-headless-shell, `check-trusted-types.mjs`, `check-entries.mjs` |
| **Docs** | |
| `src/docs/getting-started.mdx` | *Use components* with secondary entries + exceptions table, *mermaid*, *Provide HttpClient* note, new *Content Security Policy* section |
| `README.md`, `libs/angular-ui-kit/README.md` | One paragraph each on the entries |

## Acceptance criteria

| AC | Covered by |
|---|---|
| AC-1 | `app-shell.component.spec.ts` (`reflectComponentType` input `busy`, `isSignal`, default `false`, JSDoc `@default false`); MCP manifest: `layout-app-shell` → `AppPageComponent.busy`, **1179 inputs** (1178 + 1) |
| AC-2 | Same spec: `aria-busy="true"` when true; no attribute when unset or false; true → false → true, `innerHTML` equal to the idle page except the one attribute |
| AC-3 | `EXPECT_IN_HTML` *app page busy (AS-12)* on `index.html` and *tt: page busy before JS* on `tt/index.html`; *app page aside* green — Angular 21.0 / 21 / 22.0 / 22 |
| AC-4 | Story `layout-app-shell--today-loading`, argType `busy` (`table.defaultValue.summary: 'false'`); measured at 360 / 1024 / 1280: `main` x 0 / 240 / 240, padding 24 / 48 / 56, content 312 / 688 / 880, gap 24 / 40 / 40, skeleton boxes exactly §3.1; `busy` → `false` through the Storybook channel: **pixel-identical** shots (6 of 6). Docs in the story, the JSDoc and the component docs |
| AC-5 | `icon.trusted-types.spec.ts`: source scan (comments stripped) finds none of the sinks or `DomSanitizer`; `parseFromString(` only in `icon-dom.ts`; with the fake factory every parse gets a `FakeTrustedHTML`, never a string |
| AC-6 | Same spec: 0 policies with no icon; 50 instances (10 names × both variants × all 5 sizes) + a fetched icon → exactly one `createPolicy('lc-icon', …)` with keys `['createHTML']`, no other kit policy; refused → still one call, one warning |
| AC-7 | Same spec: all 133 constants + placeholder return themselves (`bundledIconSvgs().size === 134`); `TypeError` for Tabler's `anchor.svg`, a constant + `' '`, `<svg onload>`, `<img onerror>`, `''` |
| AC-8 | Same spec: `aria-label` keeps `"><img src=x onerror=alert(1)>` literally, 0 `img`; a hostile colour reaches only `style.color` |
| AC-9 | 3.4.1's jsdom DOM captured from the 3.4.1 sources and pinned (4 cases, `className`, `style`, `innerHTML` byte-equal); same DOM with and without the policy; builder ≡ XML parser (XMLSerializer and `outerHTML`) for 133 + 1; in place re-decoration. Story shots: `components-icon--{default,sizes,unknown-name-fallback}` 360 light **pixel-identical** to the baseline; attribute order measured in Chrome `xmlns fill viewBox stroke-width stroke width=24px height=24px role=img style=color: currentcolor;` (= design §2) |
| AC-10 | `check-trusted-types.mjs` run 1 (`… trusted-types angular lc-icon`), 1280 and 360 px: (a) 133 inline name × variant each 1 `<svg>`; (b) every F1 element with a box, member menu, modal, confirm dialog, toast and (360) drawer opened; (c) **0** `securitypolicyviolation`, **0** console/Log lines matching life-os's pattern on all 4 pages; (d) 0 NG05xx, every `lc-icon` 1 `<svg>` after hydration and after the overlays |
| AC-11 | Run 2 (`trusted-types angular`): 0 uncaught exceptions, F1 elements present, every bundled icon is the placeholder (`rect,text`) with its `aria-label`, exactly **1** console warning naming `lc-icon` and `trusted-types` and **1** `trusted-types` violation per page load |
| AC-12 | Unit: builder table (54 tests), 3.4.1 fetch tests green, 404 kept, transient eviction, crafted `<svg onload>` dropped with the design's message, no `createHTML` and no parse for fetched text. Browser `/tt/fetched` in both runs: `anchor` 1 `<svg>` with 3 paths, `lc-typo-icon` (served `index.html`) and `lc-crafted` (served `<svg onload="window.__pwned=1">`) placeholders, `window.__pwned === undefined`, one warning each |
| AC-13 | Browser: `/tt/icons` renders `IconComponent` from the primary entry and from `/icon`, `data-same-class="true"` (same class), 0 violations (a second policy would throw); `check-entries.mjs`: `createPolicy` only in `fesm2022/lifecorner-angular-ui-kit-icon.mjs` |
| AC-14 | `check-entries.mjs` against `npm pack @lifecorner/angular-ui-kit@3.4.1`: **497 of 497** primary exports keep name and kind (TypeScript checker), 0 added, 0 removed, 0 changed; primary FESM, its types, `src/assets`, `src/styles` and the 5 non-entry `exports` unchanged |
| AC-15 | Same script: **112 subpaths** (109 public, 3 internal) with `types` + `default`; all resolve in TypeScript and import in Node (after `@angular/compiler`); each public symbol in exactly one public entry, together exactly the primary's 497; `entries.spec.ts` stub correspondence |
| AC-16 | Same script: each of **246** kit sources in exactly one `.mjs.map`; 0 entry cycles. Browser: `ToastService` from the primary entry shows its toast in the `/toast` outlet, `ThemeService` from the primary entry switches `lc-header`'s theme button, `LC_LOGO_BASE_PATH` from the primary entry reaches `lc-logo` from `/logo` (also `EXPECT_IN_HTML`) |
| AC-17 | `check-entries.mjs` fixture: no module of the 9 lazy-only entries (code-block, input, internal/chart, internal/url, line-chart, markdown, modal, select, table) in an initial chunk, all in a lazy chunk; initial chunks hold 19 entries, all from the shell's closure. Numbers below |
| AC-18 | Same fixture: `abacus-off` in 0 emitted `.js`/`.mjs` files (browser and server) in production; present in the development build; present when the app imports `isValidIconName`. Unit: dev warns, `strict` throws |
| AC-19 | `icon.production.spec.ts` (`ngDevMode = false`): `beaker` → 1 request, empty 24 × 24 container while loading, then placeholder, 1 warning `could not be loaded (404)`, a second instance sends nothing; `text/html` → placeholder, no HTML nodes, 1 non-SVG warning; malformed names (`../x`, `Foo Bar`, 65 chars, `x-`, `ß`) → 0 requests, 1 warning; no `strict` throw |
| AC-20 | Compat 21.0 / 21 / 22.0 / 22 **all PASS**, 28 prerender checks each (20 existing + 8 new); Jest 3,665 ≥ 3,517 passed; Storybook **826 IDs ⊇ the 824** of 3.4.1; manifest same 112 components, props +1 (`busy`), no summary changed |
| AC-21 | Manifest: 109 of 112 entries have an *Import* doc entry (the 3 without are the design-token pages), e.g. `import { AppShellComponent, AppPageComponent } from '@lifecorner/angular-ui-kit/app-shell';`; getting-started and both READMEs |
| AC-22 | `sidenav.current-item.spec.ts`: real router, `activeRoute` bound to the URL as life-os does (`/` before the first navigation), docked and drawer × simple items, group children, section children, section grandchildren × the four navigation sequences: exactly one `a[aria-current="page"]`, the `activeRoute` one. The same spec run against the 3.4.1 sidenav: **24 of 42 fail**, including *first navigation to /* for simple items — the life-os bug |
| AC-23 | Same spec: look ⇔ announcement for every link in every state; `activeRoute` wins over the router; empty `activeRoute`: `/` current with `aria-current`, deepest match, prefix fallback, `/` never a prefix, query/fragment ignored, group opens. Story shots: the 7 sidenav stories and 3 app-shell stories at 360/1280 light/dark all show exactly one current link, painted = announced, colours of design §5 (light ink rgb(20, 79, 91) on rgb(224, 241, 244), dark rgb(163, 213, 223) on rgba(32, 132, 151, .24)); the 13 baseline shots of these stories are **pixel-identical** |
| AC-24 | `EXPECT_IN_HTML` *tt: one current sidenav link* (the `/tt` link, with `--active`); browser: still one after hydration, after `/tt → /tt/household` and back |
| AC-25 | `bottom-nav` template, styles, logic and spec untouched, its tests green. **Deviation:** `bottom-nav.component.ts` changes its two import specifiers to package paths and the folder gets its `index.ts` (see below) |
| AC-26 | `check-entries.mjs`: fixture without `mermaid` installed and without `externalDependencies` builds and prerenders `/` and `/reports` in production and development |
| AC-27 | Story `components-markdown--mermaid-support` renders its diagram (1 Mermaid `svg`); markdown Jest suites green; getting-started *mermaid* says what needs it |
| AC-28 | Changelog draft below (the release-manager writes `CHANGELOG.md`) |

## Gates

| Gate | Result |
|---|---|
| `npx nx run angular-ui-kit:test` | **138 suites, 3,665 passed, 8 skipped (3,673)**; baseline on `main`: 133 suites, 3,517 passed, 8 skipped (3,525). Three consecutive full runs green. A Jest worker SIGSEGV (a suite "failed to run", different suite each time) appeared twice in about ten runs, once before any component change; it is the worker, not a test |
| `npx nx run angular-ui-kit:lint` | **0 errors, 162 warnings** (`main`: 0 errors, 166 warnings) |
| `npx nx run angular-ui-kit:build` | Green, **113 entry points** (primary + 112). Cold (`CI=1`, no ng-packagr cache): ng-packagr **9.4 s**, 12.3 s wall; `main`: 3.2 s, 4.6 s wall. FESM folder 4.6 MB (was 4.1 MB, now 113 files with source maps). `npm pack`: 370 files, 1.0 MB packed; the nested `<entry>/package.json` files are not packed |
| `npm run test:tools` | **22 of 22** pass (18 before + 4 for the import line) |
| `npx nx run angular-ui-kit:build-storybook` | Green, 20 s wall; **826 story IDs**, all 824 of 3.4.1 present, new: `layout-app-shell--today-loading`, `navigation-sidenav--router-matched` |
| Story screenshots | `tmp/story-shots/001/` — see below |
| `node tools/compat/check-angular-majors.mjs` | All four: **21.0 (21.0.9), 21 (21.2.25), 22.0 (22.0.8), 22 (22.2.3) PASS**, 28 of 28 prerender checks each, 1:44 min for the four. Log: `tmp/001-build/compat-all.log` |
| `node tools/compat/check-trusted-types.mjs --app=…/app-22` | **150 of 150** checks, both CSPs, 1280 and 360 px. Log: `tmp/001-build/tt-final.log` |
| `node tools/compat/check-entries.mjs` | **23 of 23** checks, 58 s. Log: `tmp/001-build/entries-final.log` |

### Bundle numbers (AC-17, AC-18)

The fixture `tools/compat/entries` (Angular 22.2, production): an eager shell with the F1 set and a lazy `/reports` route (`lc-line-chart`, `lc-table`, `lc-markdown`, `lc-modal`). Initial JS = all initial chunks (Angular included). kB = 1,000 bytes, gzip level 9, *CLI* = the build's own "Initial total" estimated transfer size. The kit share is its minified bytes in the initial chunks (esbuild metafile).

| Build | Initial raw | Initial gzip | CLI transfer | Kit share (raw) |
|---|---|---|---|---|
| 3.4.1, primary entry | 839.0 kB | 226.1 kB | 192.28 kB | 485.4 kB |
| 3.5.0, primary entry | 581.9 kB | 160.8 kB | 138.02 kB | 277.5 kB |
| 3.5.0, secondary entries | 581.9 kB | 161.6 kB | 137.95 kB | 277.5 kB |

- Secondary entries against 3.4.1: **−257.1 kB raw (−30.6 %), −64.5 kB gzip (−28.5 %), −54.3 kB CLI transfer (−28.3 %)**; the kit's share −207.9 kB raw (−42.8 %). The app and Angular are the same in all three builds, so the difference is the kit's.
- The primary entry of 3.5.0 gives the same split with esbuild (Angular's application builder): it only re-exports the entries, and each entry is its own module. The secondary entries are still what the docs recommend; other bundlers were not measured.
- The name list: an app that imports `isValidIconName` itself gets **+69.8 kB raw, +19.8 kB gzip** (+16.6 kB CLI) back. 3.4.1's initial chunk contained it; 3.5.0's production build contains it nowhere.

### Screenshots (`tmp/story-shots/001/`)

- New: `layout-app-shell--today-loading--{360,1024,1280}-{light,dark}.png`; `navigation-sidenav--router-matched--{360,1280}-{light,dark}.png` (after the play step: *Mitglieder* current).
- Unchanged, at 360 and 1280, light and dark: `navigation-sidenav--{docked,drawer-mode,with-nested-items,with-groups-and-actions,transparent-on-the-page,collapsed-icon-rail}`, `layout-app-shell--{today-desktop,today-phone,content-page}` (+ `today-desktop--1024-light`), `components-icon--{default,sizes,solid,custom-colors,unknown-name-fallback,inline-set,all-icons}`, `components-markdown--mermaid-support--1280-light`.
- Pixel comparison with `tmp/story-shots/001/baseline/`: **17 of 17 identical** (PNG decoded, RGB compared).
- `busy` → `false`: `tmp/001-build/busy-false/` is pixel-identical to the `busy` shots (6 of 6).
- *All Icons* fetches 5,093 assets at once. On a cold cache Chrome rejected part of them in the first run and those icons showed the placeholder after the retries; the reruns (warm cache) show 0 placeholders and 0 pending at all four widths × themes.

### Changed assertions (AC-9, AC-12; none weakened)

In `icon.component.spec.ts`:

1. *should fetch SVG content*, *should update SVG when name/variant changes*, *does not warn when the name is cleared*: they read the internal `svgContent()` (a `SafeHtml` string). It no longer exists, because the `<svg>` is a real element now (AC-9 allows this). They now assert the DOM instead: one `<svg>` with a `path`, a new element with a `circle` after the change, and an empty container.
2. *ignores a slow response …* and the name/variant tests found the fetched icon by `svg[data-icon="…"]`. The allow-list drops `data-*` (design §4), so they tell the icons apart by their shape (`circle` against `path`), with the same strength.
3. *does not cache a failed load — the next instance retries the asset* used a 404. Design §4 now keeps a 404 in the cache. The test now pins eviction for a transient failure (3 attempts, then a new instance requests again), and a new test pins that a 404 is kept (*keeps a 404 in the cache …*).

Also changed: `icon-catalog.spec.ts` imports `ICON_NAMES` and `isValidIconName` from `../icon-names/icon-names` (same assertions).

## Deviations from the design

1. **AC-25 "0 changed files under `lib/bottom-nav/`".** Design §3.4 rule 1 requires package-path imports across folders, and every folder needs its `index.ts`. So `bottom-nav.component.ts` changes `../icon/icon.component` and `../badge/badge.component` to `@lifecorner/angular-ui-kit/icon` and `/badge`, and `bottom-nav/index.ts` is new. Its template, styles, logic and spec are untouched and its tests green. *Needs the designer's agreement* (the rule and the AC contradict each other; this follows the rule).
2. **Router-matched story:** the play step ends with `blur()` on the clicked link, so the canvas shows the current item's plain look instead of the click's focus ring. Not in the design.
3. **Compat fixture under the life-os CSP:** Angular 22's default incremental hydration writes an inline event-replay script, and critical-CSS inlining writes an inline `<script>`; `script-src 'self'` blocks both. As in life-os, the fixture uses `withNoIncrementalHydration()` (looked up on the namespace, because Angular 21.0 doesn't have it) and `optimization.styles.inlineCritical: false`. This applies to all four compat builds and touches no kit code. The CSP was not weakened, and no kit violation is exempted.
4. **AC-17 "the kit's initial JS, raw and gzip":** the metafile gives the kit's raw bytes, but gzip can't be split per module. The table reports the initial total raw, gzip and CLI per build, plus the kit's raw share; the before/after difference is the kit's alone (same app, same Angular).

Not deviations, but worth knowing:

- `lc-icon` renders a `<div>`, so an `lc-icon` inside a `<p>` breaks hydration of prerendered HTML (NG0502: the HTML parser closes the `<p>`). It was the same in 3.4.1. The fixture uses `<div>` wrappers.
- `CLAUDE.md` (*Layout*: "Shared helpers are in `lib/shared/`") and `.claude/agents/web-developer.md` ("export new components … in `src/index.ts`") describe the old layout. Agents don't edit them, so the owner should update them: helpers are in `lib/internal/<x>/`, and a new component needs `src/lib/<folder>/index.ts`, a stub `libs/angular-ui-kit/<folder>/ng-package.json` and one line in `src/index.ts` (`entries.spec.ts` fails otherwise).

## Changelog draft

```markdown
## [3.5.0] - 2026-10-XX

Four gaps that block life-os feature F1 (the LifeCorner app: sign-in, Today,
household, settings), from the app-shell concept's gap register (§7.1): a busy
page, icons under Trusted Types, secondary entry points with a smaller initial
bundle, and one current item in the side navigation. Plus `mermaid` only for
the apps that use `lc-markdown`. No API breaks: every export of 3.4.1 stays,
with the same name and kind, in `@lifecorner/angular-ui-kit`.

### Added

- **Secondary entry points** (AS-15, AS-13; life-os ADR-0012 budget of
  150 kB gzip initial JS). Every component folder is its own entry,
  `@lifecorner/angular-ui-kit/<folder>`: 109 public entries, for example
  `import { IconComponent } from '@lifecorner/angular-ui-kit/icon'` or
  `import { AppShellComponent, AppPageComponent } from '@lifecorner/angular-ui-kit/app-shell'`.
  Each entry is a separate module, so an app bundles only what it imports and
  a lazy route takes the kit parts only it uses into its own chunk. Measured
  with an Angular 22 fixture (an F1 shell eager, charts, table, markdown and
  modal on a lazy route): initial JS **839.0 → 581.9 kB raw, 226.1 → 161.6 kB
  gzip** (Angular CLI estimate 192.3 → 138.0 kB), the kit's part
  485.4 → 277.5 kB raw. `@lifecorner/angular-ui-kit` keeps working and
  re-exports every entry (with esbuild it splits the same way). Every
  component's documentation and the MCP's `get-documentation` show its import
  line; *Installation* lists the entries whose name isn't the selector's
  (`lc-app-page` → `app-shell`, `a[lcButton]` → `button`, `ToastService` →
  `toast`, …).
- **`@lifecorner/angular-ui-kit/icon-names`**: `ICON_NAMES` and
  `isValidIconName` (also still exported by the primary entry).
- **`lc-app-page` `busy`** (AS-12, life-os Today): `aria-busy="true"` on the
  page's `<main>` while a skeleton stands in for the content, no attribute
  while `false` (default). No visual change. Screen readers may hold back
  changes inside a busy region, so an announced loading status belongs outside
  `<main>`. Story *Layout / App Shell / Today (loading, busy page)*.

### Changed

- **`lc-icon` works under Trusted Types** (AS-14; every life-os page with an
  icon). Bundled icons go through one policy, **`lc-icon`**, created on the
  first icon render, that accepts only the kit's own SVG strings; there is no
  `bypassSecurityTrustHtml` and no `[innerHTML]` any more, so icons don't need
  `angular#unsafe-bypass`. Checked in Chromium under
  `require-trusted-types-for 'script'; trusted-types angular lc-icon`: 0
  violations on the F1 pages and all 133 inline icons. If the CSP refuses the
  policy, bundled icons show the placeholder (with their size, colour and
  label) and the console says so once. The DOM is the same as in 3.4.1.
- **Fetched icons are rebuilt from an allow-list** (AS-14): basic shapes
  (`g`, `path`, `circle`, `ellipse`, `line`, `polyline`, `polygon`, `rect`,
  `text`) with paint and geometry attributes, node by node, without an HTML or
  XML parser. Scripts, event handlers, references (`href`, `url(…)`), a
  DOCTYPE, files over 32 KB or anything malformed drop the icon (placeholder
  and one warning naming the reason); `data-*`, `style`, `id` and similar are
  dropped silently. All 6,146 Tabler icons pass.
- **Unknown icon names in production** (AS-15): production builds no longer
  ship the ~5,000 names (19.8 kB gzip). They check a name by its form, request
  a well-formed unknown name **once per page**, and show the placeholder with
  one warning when the answer isn't an icon (404 included). Development builds
  check the list as before and never request an unknown name; `strict` still
  throws there.
- **A 404 for an icon is cached** for the page: a later instance of the same
  missing name sends no second request. Transient failures are still retried
  and evicted.
- **Prerendered icons carry their size, colour and accessibility attributes**
  (3.4.1 prerendered the bare SVG).

### Fixed

- **`lc-sidenav` marks exactly one link as current** (AS-16; life-os Today and
  household, WCAG 1.3.1 and 4.1.2). Angular's `routerLinkActive` removed
  `aria-current` after each navigation, so the start page (`/`) looked current
  but was never announced. The look and `aria-current="page"` now come from one
  rule: with `activeRoute` set, the first link whose `route` equals it; without
  it, the link matching the router URL's path, otherwise the longest route the
  path starts with (`/` only on `/`). Changed edge cases: a router-matched link
  other than `activeRoute` no longer looks current; with `activeRoute` empty
  and several matches only the deepest one is current, and now announced.
  Story *Navigation / Sidenav / Router-matched current item*.

### Compatibility

- No API breaks. All 497 exports of 3.4.1's primary entry keep their name and
  kind, `fesm2022/lifecorner-angular-ui-kit.mjs` and its types keep their
  paths, and so do `./styles`, `./styles/*`, `./icon-names.json` and the
  assets. Peer range unchanged (`^21.0.0 || ^22.0.0`). Checked on Angular
  21.0, 21, 22.0 and 22 (build and prerender), with imports from the primary
  entry and from secondary entries.
- `mermaid` (optional peer) is now needed only by the `markdown`, `chat` and
  `document-viewer` entries and by the primary entry. An app that imports
  neither builds without `mermaid` and without `externalDependencies`.
- `@lifecorner/angular-ui-kit/internal/*` is the kit's own and has no semver
  guarantee.

### Migration

- If your app enforces Trusted Types, add **`lc-icon`** to `trusted-types`,
  for example `trusted-types angular lc-icon`. With two copies of the kit on
  one page, the second needs `'allow-duplicates'`. `lc-markdown`,
  `lc-code-block`, `lc-log-viewer`, `lc-rich-text-editor` and
  `lc-document-viewer` still need `angular#unsafe-bypass`.
- Optional: import from the secondary entries (`@lifecorner/angular-ui-kit/<folder>`).
```

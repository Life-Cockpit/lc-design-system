# Review 001: F1 app-shell gaps (AS-12, AS-13, AS-14, AS-15, AS-16)

## Round 1 — 2026-10-17, commit 3a46591

**Screenshots and measurements:** `tmp/story-shots/001/r1/`.

- **New stories.** `layout-app-shell--today-loading` at 360 · 1024 · 1280, light · dark, full page, with `today-loading.jsonl`. The same six shots with `busy` set to `false` are in `busy-false/`. `navigation-sidenav--router-matched` at 360 · 1024 · 1280, light · dark, with `router-matched.jsonl`.
- **Unchanged stories, against a real 3.4.1 build.** I built Storybook from `315a8a0` in a scratch worktree, so every unchanged story could be compared, not only the 17 baseline shots. The shots are in `base341/` (3.4.1) and `new/` (3a46591), the pixel diff in `diff-unchanged.txt`. The comparison covers:
  - all 17 earlier sidenav stories (every link template changed);
  - all 8 icon stories;
  - all 6 bottom-nav stories (AC-25);
  - the 3 earlier app-shell stories.

  That is 33 stories at 360 · 1024 · 1280, light · dark, plus *All Icons* at 360 · 1280, light · dark.
- **Storybook build.** Green. It has 826 story IDs: all 824 of 3.4.1 plus `layout-app-shell--today-loading` and `navigation-sidenav--router-matched`.
- **Jest, run by me.** The sidenav, app-shell and bottom-nav suites: 6 suites, 168 tests, all green. The icon suites: 5 suites, 213 tests, all green.

**Result:** 202 of 202 unchanged shots are pixel-identical to 3.4.1, decoded RGB with zero differing pixels. Toggling `busy` changes no pixel (6 of 6). In every sidenav and app-shell story (22 stories at 1280 px), exactly one link is current, and the painted link and the announced link match (0 mismatches).

| AC | Result | Evidence |
|---|---|---|
| AC-1 | pass | `app-page.component.ts`: `readonly busy = input(false)`, with the design's JSDoc and `@default false`. Unit tests in `app-shell.component.spec.ts`, green in my run. Manifest: 1,179 inputs (1,178 + `busy`), per build.md |
| AC-2 | pass | The template binds `[attr.aria-busy]="busy() ? 'true' : null"`. Measured with `busy` true: `aria-busy="true"` in all 6 shots. With `busy` false (set through the Storybook channel), `<main>` has only `class` and `id`: no `aria-busy`, not `"false"`. The unit tests cover the toggle and an otherwise identical DOM |
| AC-3 | pass | build.md: `EXPECT_IN_HTML` *app page busy (AS-12)* and *tt: page busy before JS* pass on Angular 21.0 / 21 / 22.0 / 22 (`tmp/001-build/compat-all.log`), and *app page aside* is still green |
| AC-4 | pass | The story `layout-app-shell--today-loading` has argType `busy` with `table.defaultValue.summary` `'false'`. `<main>`: x 0 / 240 / 240 and width 360 / 784 / 1040; padding 24·24·16 / 48·48·32 / 56·56·32; content x 24 / 288 / 320 and width 312 / 688 / 880; gap 24 / 40 / 40. That is the box the *Today* story has without an aside. The skeleton matches §3.1: at 360 px 140.4×17, 218.4×42, 156×42, two 34 px circles at x 24 / 54 (4 px overlap), 93.6×20 at x 100, 312×96 r 24, 3 × 98.7×74 r 18 with an 8 px gap; at 1280 px 396 / 616 / 440 / 264 / 880 / 3 × 288. There is no page aside; the only `<aside>` is the sidenav. The JSDoc and the story docs say what `aria-busy` does and where an announced status belongs. Light and dark looked at, all 6 |
| AC-5 | pass | My own scan of `lib/icon/*.ts` and `.html` (without specs and stories): no `bypassSecurityTrust`, no `DomSanitizer`, no `innerHTML`, `outerHTML`, `insertAdjacentHTML`, `createContextualFragment` or `setHTMLUnsafe`. `parseFromString` occurs once (`icon-dom.ts:37`), and under Trusted Types it gets `policy.createHTML(markup)`. The unit test with the fake factory is in `icon.trusted-types.spec.ts` |
| AC-6 | pass | `icon-trusted-types.ts`: the policy is created lazily per window, with `createHTML` as its only rule, and on refusal the state becomes `refused` with no retry. The unit tests (one `createPolicy` across 50 instances, keys `['createHTML']`) are green |
| AC-7 | pass | `createHTML` returns the input only when it is in the set of the 133 constants plus the placeholder, and otherwise throws a `TypeError`. The rejection cases are covered by unit tests |
| AC-8 | pass | `decorateSvg` sets the label with `setAttribute` and the colour with `style.color`, and nothing else. A unit test covers the hostile label |
| AC-9 | pass | All 8 icon stories at 360 / 1024 / 1280, light and dark (46 shots), are pixel-identical to the 3.4.1 build. *All Icons* has 5,093 fetched icons rebuilt by the allow-list builder. build.md covered only 3 icon shots at 360 px light; this closes that gap. The 3.4.1 DOM is pinned in jsdom (build.md) |
| AC-10 | pass | `tmp/001-build/tt-final.log`: 150 of 150 checks pass under exactly the CSP of design §9 (checked in `check-trusted-types.mjs:54-58`). The script has no violation allow-list |
| AC-11 | pass | Same log, run 2: placeholders keep their labels, exactly 1 warning naming `lc-icon` and `trusted-types`, exactly 1 `trusted-types` violation and 0 uncaught exceptions per page |
| AC-12 | pass | The fetch code keeps 3.4.1's retry (`count: 2`, 200·n ms, no retry on 404) and adds the 404 cache. `/tt/fetched` passes in both runs (`anchor` with 3 paths, the fallback and the crafted SVG show placeholders, `__pwned` is never set). See note 2 on *All Icons* flakiness |
| AC-13 | pass | build.md and `entries-final.log`: `createPolicy` appears only in `fesm2022/lifecorner-angular-ui-kit-icon.mjs`. `/tt/icons` renders the primary entry's and `/icon`'s `IconComponent` as the same class with 0 violations |
| AC-14 | pass | `entries-final.log`: all 497 of 497 primary exports keep their name and kind, and the paths are unchanged |
| AC-15 | pass | 112 subpaths with `types` + `default`; each public symbol is in exactly one entry. This matches the design §3.4 table |
| AC-16 | pass | 246 sources, each in exactly one source map; 0 cycles; the singletons are shared (browser check) |
| AC-17 | pass | No module of the 9 lazy-only entries is in an initial chunk. Initial JS goes from 839.0 to 581.9 kB raw and from 226.1 to 161.6 kB gzip. I accept deviation 4: gzip can't be split per module, and the before/after difference with the same app is the kit's alone |
| AC-18 | pass | `abacus-off` appears in 0 production files, and in the development build and when the app imports `isValidIconName`. The list costs +19.8 kB gzip. The `ngDevMode` guard is in `icon.component.ts` |
| AC-19 | pass | `icon.production.spec.ts` (`ngDevMode = false`), green in my run: 1 request, a 24 × 24 container while loading, the placeholder, 1 warning, and no second request |
| AC-20 | pass | Compat 4 of 4 PASS (28 checks each); Jest 3,665 ≥ 3,517 tests; 826 story IDs ⊇ the 824 of 3.4.1 (my own diff of `index.json`); the manifest has the same 112 components. See should-fix #1 on what the compat build now covers |
| AC-21 | pass | `getting-started.mdx`: secondary entries first, with the exceptions table, *mermaid* and *Content Security Policy*. `import-line.mjs` adds an *Import* doc entry per component. Both READMEs are updated |
| AC-22 | pass | `sidenav.current-item.spec.ts` uses a real router: 42 tests, docked and drawer, all four link templates, all four sequences. Green in my run |
| AC-23 | pass | `router-matched.jsonl` (no `activeRoute`, hash `#/household/members`): only *Mitglieder* has `aria-current="page"` and `--active`. Its pill is 48 px high, radius 9999 px, 16 px / 600. The other links are 16 px / 500 with no attribute. Light: ink rgb(20, 79, 91) on rgb(224, 241, 244), **7.85:1**; the other links rgb(75, 85, 99) on #fff, **7.56:1**. Dark: rgb(163, 213, 223) on rgba(32, 132, 151, .24) over #0a121b (= rgb(15, 45, 57)), **9.03:1**; the other links rgb(196, 210, 217) on #0a121b, **12.17:1**. All four computed with the WCAG formula. The current item looks the same as in 3.4.1 in every story (198 shots identical) |
| AC-24 | pass | build.md: `EXPECT_IN_HTML` *tt: one current sidenav link*. The browser check finds one current link after hydration and after `/tt → /tt/household → /tt` |
| AC-25 | pass (deviation agreed) | The bottom-nav diff is exactly the two import specifiers (`../icon/…`, `../badge/…` → `@lifecorner/angular-ui-kit/icon`, `/badge`) plus the new `index.ts`. Template, styles, logic and spec are untouched. Its Jest tests are green, and the 6 bottom-nav stories × 6 shots are pixel-identical to 3.4.1. The design's verification line was wrong; it is corrected in `design.md` (change note R1.1) |
| AC-26 | pass | `entries-final.log`: the fixture builds and prerenders without `mermaid` and without `externalDependencies`, in production and development |
| AC-27 | pass | build.md: *Mermaid Support* renders 1 diagram, and the markdown Jest suites are green. Getting-started states what the primary entry requires |
| AC-28 | pass (draft) | build.md has a changelog draft with *Added*, *Changed*, *Fixed*, *Compatibility* and *Migration*, the measured values, and "no API breaks". The release-manager writes the final text (see the notes for the release) |

### The developer's deviations

1. **AC-25, the bottom-nav import lines: agreed.** AC-16 forces the package-path imports (a relative import across entries fails with TS6059, and with it the duplicate-module guard). The `index.ts` is part of the entry layout. AC-25 protects the bottom-nav's behaviour, look and tests, and all three are unchanged (diff, Jest, 36 identical shots). The contradiction was in my design (§3.4 rules 1 and 4 against §9's "0 changed files"). `design.md` §9 is corrected.
2. **`blur()` at the end of the router-matched play step: agreed.** The scripted click leaves a `:focus-visible` ring that a mouse click doesn't, and the story is about the current look. The links' focus ring is untouched: `sidenav.component.scss` is not in the diff. Recorded in `design.md` §8.
3. **The life-os CSP settings in the compat fixture: agreed for the Trusted Types check, with one change requested as should-fix #1.**
   - The CSP is exactly the design's, and the check has no violation allow-list.
   - Angular 22 really does enable incremental hydration by default (`withIncrementalHydration` is deprecated since 22.0; `@angular/platform-browser` 22.2.2 types). Mirroring life-os was the design's instruction for exactly this case.
   - But the settings now apply to the whole template, so the four-version prerender build no longer represents a default consumer (AC-20).
4. **AC-17 reports the total initial gzip: agreed** (see the AC table).

### Findings

| # | Severity | Where | Expected | Actual |
|---|---|---|---|---|
| 1 | should-fix | `tools/compat/template/src/app/app.config.ts`, `tools/compat/template/angular.json` (design §9, fixtures 2, change note R1.3) | The four-version prerender build (Angular 21.0 / 21 / 22.0 / 22) keeps Angular's defaults: `provideClientHydration()` and critical-CSS inlining, as for every existing consumer (AC-20). `withNoIncrementalHydration()` and `inlineCritical: false` apply only to the Angular 22 build that `check-trusted-types.mjs` serves, for example through an angular.json configuration `csp` with a `fileReplacements` entry for `app.config.ts`, built once more in the CI job | The life-os settings apply to every compat build. The checks pass, but Angular 22's default hydration (incremental, with the inline event-dispatch script) is no longer built or prerendered by any kit check. Low risk for this release, which is why this is not a must-fix; it can be done in a follow-up |
| 2 | nit | `sidenav.component.ts`, JSDoc of `activeRoute`, and the `activeRoute` row in the docs table and argType in `sidenav.stories.ts` (design §2 and §3.2, change note R1.4) | One added sentence: "Routes are compared as written, so give them as absolute paths (`'/household'`)." | Not stated. With `activeRoute` empty, a relative `route` (`'settings'`) never matches the router path, while 3.4.1's `routerLinkActive` painted it. `NavigationItem.route` documents absolute paths, and no known consumer uses relative ones (kit stories and life-os; lc-platform ships its own sidenav), so only the docs need the sentence |
| 3 | nit | `icon.stories.ts`, docs, the paragraph before *SPA-safe loading* | The production sentence should name the warning production actually logs: production logs `Unknown icon` only for a malformed name; a well-formed unknown name gets the `could not be loaded (404)` or non-SVG warning | It still says an unknown name "logs `[lc-icon] Unknown icon "…"` (once per name, in development **and** production)". For a well-formed unknown name in production that is the wrong message (it is right for development and for malformed names). Someone searching production logs for `Unknown icon` would miss it |

**Notes, not findings:**

1. *All Icons* (5,093 fetched icons at once) sometimes ends with placeholders on a cold browser profile. In alternating runs, 3.5 showed 321, 11 and 42 placeholders in 3 of 16 runs, and 3.4.1 showed 1,078 in 1 of 13. The retry code is unchanged, so this is the story-shots test server under load, not a regression. Once every icon had loaded, both builds were pixel-identical at 360 and 1280, light and dark.
2. `CLAUDE.md` (*Layout*: `lib/shared/`) and `.claude/agents/web-developer.md` (new components only in `src/index.ts`) describe the old layout, as build.md says. A new component now needs `src/lib/<folder>/index.ts`, a stub `libs/angular-ui-kit/<folder>/ng-package.json` and one line in `src/index.ts`. Agents don't edit those files, so the release-manager should pass this on to the owner.

**Verdict:** approved. There is no must-fix. Should-fix #1 and nits #2 and #3 stay open and are listed for the release.

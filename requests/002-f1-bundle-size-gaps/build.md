# Build 002: F1 bundle-size and link-cue gaps

- **Branch:** `feat/3.6-f1-bundle-size-gaps` (from `main` 079fae5; 3.5.1 + minor)
- **Commit:** the branch's one commit, feat(icon,sidenav,button): tree-shakable icons, a lazy side navigation, an underlined inline link (gates ran on `10aab3d`; amended with this file and `log.md` only)

## Files changed

| File | Change |
|---|---|
| `lib/icons/` (new entry), `icons/ng-package.json` | 133 `ICON_*` plain-object constants + `BUNDLED_ICONS` (`icons.data.ts`, hand-written to the generator's format; `icons.spec.ts` checks every string against the 3.5.1 maps) |
| `lib/internal/icon-set/` (new internal entry) | the 3.5.1 maps, moved (`git` rename) from `lib/icon/`; local variant type (no entry cycle) |
| `lib/icon/` | `icon-registry.ts` (`provideLcIcons`, `LcIconDefinition/Options/Fallback`, `ɵprovideKitIcons`), `icon-set-loader.ts` (one `import()`, retry after failure), `icon-inline-index.data.ts` (keys only), lookup, component (`pending`, `PendingTasks`, warnings), policy admission (offered + allow-list), stories ×3 |
| 31 kit components | `viewProviders: [ɵprovideKitIcons([...])]` for the glyphs they render themselves |
| `lib/sidenav-placeholder/` (new entry) + `lib/internal/navigation/` (new) | component, spec, stories ×4; current-item rules moved out of `lc-sidenav` unchanged |
| `lib/sidenav/_sidenav-docked.scss`, `sidenav.component.{scss,ts}` | box rules as verbatim mixins included in place (compiled CSS byte-identical to main, checked with a temporary sass spec), `-boxes` subsets for the placeholder |
| `lib/button/button.component.scss`, stories ×2 | `.btn.btn-inline` underline + hook (AS-19) |
| `src/index.ts`, READMEs, `src/docs/bundle-size.mdx`, `app-shell.stories.ts` ×2 | exports, docs, lazy-nav stories |
| `scripts/generate-icon-names.mjs` | writes the moved Tabler map, the constants and the key index |
| `tools/compat/` | `bundle/` fixture + `bundle-size.mjs` (`check-angular-majors --measure`), `probe-36.ts` + 3 `EXPECT_IN_HTML`, `inline-icons.mjs` path, `check-entries` count 116, `check-trusted-types` waits for the lazy set |
| specs | new: `icons`, `kit-icons`, `icon.registry`, `icon.set-failure`, `sidenav-placeholder`; changed: see Gates |

## Acceptance criteria

| AC | Covered by |
|---|---|
| AC-1 | `check-angular-majors --measure`: 3.5.1 137.28 → 25 registered 129.00 kB gzip (**−8.27 kB**); robot path in no initial chunk (it was in 3.5.1's) |
| AC-2 | icon specs' assertions unchanged (setup registers `BUNDLED_ICONS`); `icon.registry.spec` (sync, aliases, scopes); prerender check `registered glyph` |
| AC-3 | `kit-icons.spec`: source scan (every inline literal registered, no unused registration, 15 documented non-icon literals) + 25 render cases with `unregistered: 'placeholder'`; docs table |
| AC-4 | TT and production specs unchanged in assertions; +4 cases: registered glyph via `createHTML`, crafted string → builder rejects, placeholder, `createHTML` throws, no CSP/TT console text |
| AC-5 | `icon.registry.spec` (placeholder, 1 warning, no HTTP, no `loadIconSet`, strict throws in dev, warns in prod); story `unregistered-name` at 360: home/sun/anchor all 24×24 |
| AC-6 | exhaustive test over all `ICON_NAMES` × 2 variants vs the 3.5.1 algorithm (0 differences); B = 127.08 kB with the set in a lazy chunk; prerender of 133 inline icons unchanged (`tt: every inline icon prerendered`); hydration keeps the server `<svg>` while pending (spec) |
| AC-7 | `bundle-size--docs`, 3 icon stories, JSDoc `@default` on every new input/option; `test:tools` 22/22 |
| AC-8 | C 129.00 → D 122.94 kB gzip (**−6.06 kB**, incl. ~7.5 kB raw of Angular's own `@defer` runtime); `lc-sidenav` code in no initial chunk of D |
| AC-9 | lazy stories at 1024/1280/1440/1920 × light/dark: rail, rows and `<main>` identical before/after, CLS 0 (one run 0.0001 from the buffered load); placeholder vs sidenav (expanded, collapsed, transparent, sections): every box equal except the section-title width (84 vs 90.9 px, same 28 px height); spec compares DOM/classes in 8 states; prerender check |
| AC-10 | `sidenav.*.spec.ts` assertions unchanged (setup of `app-shell.spec` inlines the partial); 18 sidenav stories = baseline by hash, except hash-flaky logo/drawer shots (set changes between runs; visually identical) |
| AC-11 | spec: `aria-hidden` + `inert`, 0 focusables, 0 landmarks, no text; `lc-sidenav` keeps nav/`aria-current`; DE story: labels end with an ellipsis as before |
| AC-12 | compat Angular 22 PASS (33 HTML checks incl. 3 new); no new dependency, peer range unchanged; 21.x runs in CI |
| AC-13–15 | `button.styles.spec` +4; story measure at 360/1280: link `underline` 1 px, offset 2.4 px, paragraph `none`; EN 72 px / DE 96 px with and without the line; link colours rgb(26,106,121) / rgb(163,213,223) as 3.5.1 |
| AC-16 | changelog draft below |

## Gates

All gates ran on commit `10aab3dfc48c2fcdf2eea778373a424b10b6ecbf` (only the unrelated local `tools/infra/cdk-outputs.json` differs in `libs tools`).

| Gate | Result |
|---|---|
| `npx nx run angular-ui-kit:test` | 143 suites, 3744 passed, 8 skipped (one rerun after the known worker SIGSEGV) |
| `npx nx run angular-ui-kit:lint` | 0 errors, 162 warnings, none in new files |
| `npx nx run angular-ui-kit:build` | green; `icon` FESM 32 kB (was 81 kB raw), `icons` 73 kB, `internal/icon-set` 61 kB |
| `npm run test:tools` | 22/22 |
| `npx nx run angular-ui-kit:build-storybook` | green |
| Story screenshots | `tmp/story-shots/002/build/` (13 new/changed stories × 3 widths × 2 themes, 66 baseline stories: 384/396 identical, rest flaky or clock); measures in `tmp/story-shots/002/measure-*` |
| `node tools/compat/check-angular-majors.mjs --only=22 --measure` | PASS (`tmp/002/compat-final.log`) |

Changed assertions: `entries.spec.ts` counts 109/3 → 111/5 entries (the four new entries). Setup only: icon specs (imports from `internal/icon-set`/`icons`, `provideLcIcons(BUNDLED_ICONS)`), `sidenav.app-shell.spec` (reads the stylesheet with the partial inlined). Not run here (headless permissions), run in CI: `check-entries.mjs`, `check-trusted-types.mjs`, Angular 21.

## Deviations from the design (for the designer)

1. Kit-internal glyphs are **31**, not 26: the scan adds `dots` (bottom-nav `moreIcon`), `mail` (email-input's `envelope`), `logout` (header profile menu), `key`, `settings` (tree-view file types). Docs table lists them.
2. The placeholder uses `-boxes` subsets of the partial's mixed mixins (only box/surface declarations, each checked against `lc-sidenav`'s compiled CSS) — with the full mixins AC-8 measured 5.46 kB.
3. `--border-radius-sm` is 10 px in DS 2.0 (design: "4 px"), so the 20 px icon shapes are circles. Kept the named token.
4. With the hook at `none`, hover shows the 2 px line, not 3.5.1's auto thickness.

## Changelog draft

### Added
- **Tree-shakable icons** (AS-17, life-os F1 app shell §7.1): `provideLcIcons([ICON_HOME, …], { unregistered })` from `@lifecorner/angular-ui-kit/icon` and one constant per glyph in the new entry `@lifecorner/angular-ui-kit/icons` (`ICON_*`, `_SOLID`, `BUNDLED_ICONS`). Registered glyphs render synchronously, also prerendered; only they and the kit's own (31, documented) are bundled. F1 shell, Angular 22: −8.27 kB gzip initial JS with 25 glyphs registered; an app that registers nothing is already −10.2 kB (the set loads lazily on first use).
- **`lc-sidenav-placeholder`** (AS-18): inert skeleton with the docked sidenav's boxes for `@defer (on viewport)`; phones never load `lc-sidenav`. −6.06 kB gzip initial JS (incl. Angular's `@defer` runtime), CLS 0 at 1024–1920 px. Docs: **Bundle Size**.
- `--lc-btn-inline-text-decoration` (default `underline`).

### Fixed
- **Inline links are underlined at rest** (AS-19, WCAG 1.4.1, axe `link-in-text-block`): `lc-button`/`a[lcButton]` with `inline`; 1 px line, thicker on hover; no change to line height (360 px, EN/DE) or contrast (6.21:1 / 11.78:1). Set the hook to `none` outside running text.

### Compatibility / Migration
- No API breaks; peer range and dependencies unchanged; defaults render as 3.5.1 (inline icons a moment later in a client-only render).
- Tests asserting an unregistered inline glyph right after `detectChanges()`: register `BUNDLED_ICONS` or `await fixture.whenStable()`.
- A Trusted Types CSP keeps `trusted-types … lc-icon`; the lazy set is a normal script chunk (`script-src 'self'`).

# Build 004: lc-code-block scroll region

- **Branch:** `feat/3.7-code-block-scroll-region`
- **Commit:** the branch's one commit, feat(code-block): make the scroll body a named, focusable region; add wrap (gates ran on `2bf9f34`; amended with this file and `log.md` only)

## Files changed

| File | Change |
|---|---|
| `code-block/code-block.component.ts` | Inputs `regionLabel` (`string \| undefined`, `@default undefined`) and `wrap` (`@default false`) after `showHeader`; `regionName` computed; `code-block--wrap` only when `wrap`; class JSDoc keyboard line |
| `code-block/code-block.component.html` | Body opening tag only: `[attr.tabindex]`, `[attr.role]`, `[attr.aria-label]`, all `null` with `wrap` |
| `code-block/code-block.component.scss` | `@use mixins`; body `mix.focus-ring($offset: -4px)`, focus-only radius (`0 0 r r`, `r` with `:first-child`), forced-colors `Highlight`; `.code-block__pre { overflow: visible }`; `.code-block--wrap .code-block__line-content` |
| `code-block/code-block.region.spec.ts` | New: 17 tests (AC-1, AC-2, AC-5/6 compiled CSS, AC-7, AC-8 pin) |
| `code-block/code-block.stories.ts` | `LONG_COMMAND` (240) / `WRAP_COMMAND` (400); stories LongCommand, LongCommandGerman, Wrapped; argTypes with description + default for all six; component description line |
| `tools/compat/template/src/app/tt/tt-code.ts` | `tt-code-ts` gets `regionLabel="Beispielcode"` |
| `tools/compat/check-angular-majors.mjs` | `codeBlockRegions` in `EXPECT_IN_HTML` (`tt/code`) |

## Acceptance criteria

| AC | Covered by |
|---|---|
| AC-1 | `region.spec` AC-1 (3): attributes, tab stops in DOM order = [copy, body], focus; header hidden → body only stop |
| AC-2 | `region.spec` AC-2 (6): filename, language only, `regionLabel` first, header hidden, `''` falls through, input change |
| AC-3 | axe in `--measure` (`tmp/004/shots-new.log`), both LongCommand stories, 360/1280, light/dark: only `landmark-one-main`, `page-has-heading-one`, `region` (`.code-block__language`); no `scrollable-region-focusable`. Full review run is the designer's (design §9) |
| AC-4 | measured: body `scrollWidth` 1780 > `clientWidth` 326 (360) / 1246 (1280); pre `overflow-x: visible`; `scrollLeft = 100` sticks on the body; `activeElement === body`, `:focus-visible` true |
| AC-5 | measured after focus + 2 frames: `solid 2px`, offset `-4px`, `rgb(32,132,151)` light / `rgb(132,199,212)` dark, radius `0 0 11px 11px` (`tmp/004/shots-focus.log`); compiled-CSS tests: outline not box-shadow, `Highlight` in forced colors, no radius at rest |
| AC-6 | measured, Wrapped: line 2 length 400, `scrollWidth = clientWidth` 326/326 (360), 1246/1246 (1280), Δtop number vs text 0, `pre-wrap` / `anywhere`, 13 rows at 360; CSS test |
| AC-7 | `region.spec` AC-7 (2): no `tabindex`/`role`/`aria-label`, root `code-block code-block--bash code-block--wrap`, copy button the only stop |
| AC-8 | `code-block.component.spec.ts` and `code-block.rendering.spec.ts` unedited and green; `region.spec` pins the body's attributes and line markup; `--compare=tmp/story-shots/004/baseline`: 84/84 identical |
| AC-9 | compat 22: `ok tt: code-block body is a named, focusable region (AS-21)` (ts `Beispielcode`, html `html`, bash `bash`) |
| AC-10 | 3 stories + argTypes; `npm run test:tools` 22/22 (its library scan reports every signal input, the two new ones included). The manifest generator (`node tools/generate-components-manifest.mjs`) needs a permission I don't have; deploy-docs runs it |
| AC-11 | Changelog draft below |

## Gates

All gates ran on commit `2bf9f341577ba051b7fd50deb330b1e4c5b27c7f` (lint, build, Storybook, shots and compat on the identical tree just before the commit). Logs in `tmp/004/`.

| Gate | Result |
|---|---|
| `npx nx run angular-ui-kit:test` | 145/145 suites, 3797 passed, 8 skipped (3805); +1 suite, +17 tests. An earlier run lost `slider.component.spec.ts` to the known worker SIGSEGV; the rerun was green |
| `npx nx run angular-ui-kit:lint` | 0 errors, 162 warnings (same as 3.6.1), none in `code-block/` |
| `npx nx run angular-ui-kit:build` | green, 8.1 s |
| `npm run test:tools` | 22/22 |
| `npx nx run angular-ui-kit:build-storybook` | green |
| Story screenshots | new: `tmp/story-shots/004/build/` (3 stories × 360/1280 × light/dark, LongCommand shots focused); compare: `tmp/story-shots/004/compare/` 84/84 identical to baseline |
| `node tools/compat/check-angular-majors.mjs --only=22` | PASS, Angular 22.2.3, every `EXPECT_IN_HTML` line ok, csp build ok |

## Deviations from the design

None. LongCommand also sets the EN copy labels of design §7 ("Copy command", "Command copied").

## Changelog draft

```markdown
## [3.7.0] - <date>

`lc-code-block`'s scrolling body is keyboard-reachable (life-os account
settings, AS-21). No API breaks.

### Added

- **`regionLabel` on `lc-code-block`** (AS-21): the accessible name of the code
  region. Unset or empty, the block uses `filename`, then `language`. Set a
  short, localised name that is unique on the page ("Befehl für Claude Code").
- **`wrap` on `lc-code-block`**: long lines wrap (`pre-wrap`, breaking anywhere
  if needed) instead of scrolling. A 400-character command fits 360 px (13 rows);
  the line number stays on the first row. A wrapped body is no tab stop.

### Fixed

- **A long line scrolls with the keyboard** (AS-21, WCAG 2.1.1). On the life-os
  account-settings page (state B) a long `claude mcp add …` command scrolled
  sideways with nothing focusable in it, and axe reported
  `scrollable-region-focusable` (serious). The body is now the block's only
  scroller and a tab stop after the copy button, with `role="region"` and a
  name, already in prerendered HTML; ←/→ scroll it. Focused, it shows an inset
  2 px `--color-primary-500` ring: 4.14:1 (light) and 9.56:1 (dark) on the
  block's `#0c1722`, `Highlight` in forced colors.

### Compatibility

- No API breaks. Both inputs are optional; with defaults every line, colour,
  header and copy button render as in 3.6.1 (84 of 84 screenshots identical).
- Each block without `wrap` adds one tab stop and one named landmark, also the
  blocks inside `lc-markdown` and `lc-document-viewer` (named by language).
  Two blocks with the same fallback name (two `bash` blocks) share a landmark
  name: set a unique `regionLabel`.
- `.code-block__pre` no longer scrolls (`overflow: visible`); the global `pre`
  rule had made it the scroller. Style `.code-block__body` if you styled the
  scrollbar.
```

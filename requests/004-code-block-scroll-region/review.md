# Review 004: lc-code-block scroll region

## Round 1 — 2026-10-17, commit 373e0b8

The gates ran on 2bf9f34 (`git diff --quiet 2bf9f34 373e0b8 -- libs tools` holds). The Storybook build is current, because story-shots accepted it.

Screenshots: `tmp/story-shots/004/r1/` (3 new stories, 360 · 1024 · 1280, light · dark; LongCommand is focused, and scrolled by 600 px at 1024), `r1-focus-noheader/` (NoHeader focused, 360 dark), `r1-axe/` (axe on the 5 embedding stories, 360 light). I opened 7 shots.

| AC | Result | Evidence |
|---|---|---|
| AC-1 | pass | Body `tabindex="0"`, `role="region"`; tab stops in DOM order are `[code-block__copy, code-block__body]` in all 12 LongCommand shots; `region.spec` AC-1 (3 tests) |
| AC-2 | pass | Names "Command for Claude Code" / "Befehl für Claude Code"; NoHeader falls back to "typescript", markdown to "bash"/"typescript", document-viewer to "greeting.component.ts"; `region.spec` AC-2 (6 tests) |
| AC-3 | pass | axe 4.10.2 on both LongCommand stories × 360/1024/1280 × light/dark: only `landmark-one-main`, `page-has-heading-one` and `region` (`.code-block__language`). No `scrollable-region-focusable` and no `landmark-unique`, also not in the markdown, document-viewer or timeline stories |
| AC-4 | pass | 360: body `scrollWidth` 1780 > `clientWidth` 326 (990 at 1024, 1246 at 1280); `scrollLeft = 100` holds on the body; the pre has `overflow-x: visible` and its `scrollLeft` stays 0; after focus `activeElement === body` and `:focus-visible` is true |
| AC-5 | pass | Focused: `2px solid`, offset `-4px`, radius `0 0 11px 11px` (NoHeader: `11px`); rgb(32,132,151) on rgb(12,23,34) is **4.14:1** (light), rgb(132,199,212) is **9.56:1** (dark), computed in the browser. At rest the outline is `none` and the radius 0. Shots at 360 light and dark, 1024 scrolled, NoHeader: the ring is visible on all four sides with a 2 px gap inside the border, and the text scrolls under it. In forced colors the stylesheet has `.code-block__body:focus-visible { outline-color: highlight }` |
| AC-6 | pass | Wrapped, line 2 is 400 characters. `scrollWidth`/`clientWidth`: 326/326 at 360, 990/990 at 1024, 1246/1246 at 1280. Rows: 13 at 360, 4 at 1024, 4 at 1280. Δtop between number and first row is 0; the number box is x 33 w 40 and the rows start at x 73; `pre-wrap`/`anywhere` |
| AC-7 | pass | Wrapped: `tabindex`, `role` and `aria-label` are all null; the root class is `code-block code-block--bash code-block--wrap`; the only tab stop is the copy button. Copy at 1024 copies 442 characters, which equals the source |
| AC-8 | pass | `diff -rq baseline compare` finds no difference (84/84); both existing spec files are unedited (build.md) |
| AC-9 | pass | `compat-22.log`: "ok tt: code-block body is a named, focusable region (AS-21)" |
| AC-10 | pass | All 3 story IDs exist. All 6 argTypes have a `description` and a `table.defaultValue`, and `regionLabel` shows "filename, then language". The JSDoc has `@default`. The manifest extractor is AST-based (`extract-props.mjs`), and `test:tools` passes 22/22 |
| AC-11 | pass | The changelog draft in build.md names AS-21, the account-settings page (state B) and "No API breaks", and mentions the tab stop, the landmark and the `regionLabel` advice |

API vs design §2: names, types, defaults, order (after `showHeader`), `regionName` fallback with `||`, and the class only with `wrap` all match. German header: "Kopieren" is 105.6×44 and leaves a 143 px gap to "terminal" at 360.

### Findings

| # | Severity | Where | Expected | Actual |
|---|---|---|---|---|
| 1 | nit (design error, fixed) | design.md §3, Wrapped at 1280 | 3 rows, pitch 13.475 | 4 rows, pitch 13.47. Corrected in design.md with a change note; no code change |

Not a finding, by design (§4, AC-8): logical lines in wrap mode sit 26.95 px apart, while continuation rows are 13.47 px apart. The trailing space of a wrapped row hangs up to 3.3 px into the pre padding; it is invisible and causes no scroll (`scrollWidth = clientWidth`).

**Verdict:** approved

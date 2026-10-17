# Review 002: F1 bundle-size and link-cue gaps

## Round 1 — 2026-10-17, commit f6f3ca8

Shots and measurement logs: `tmp/story-shots/002/r1/` (developer's Storybook build, not stale).

- **Unchanged stories** (`unchanged/`, 66 baseline stories × 360 · 1024 · 1280 × light · dark, 700 ms wait): 386 / 396 identical. The 10 others:
  - 6 × `components-chat--message-status`: clock. The story stamps `new Date()` (measured times 17:46–17:51); its 4 icons render (0 empty, 0 placeholders).
  - `navigation-sidenav--collapsed-rail-badges` 360 light and `--sidebar-first-layout` 1280 dark: identical on a rerun on their own (`rerun-*.log`).
  - `navigation-sidenav--collapsed-vs-expanded` 360 light: three runs gave three different files (baseline, `build/`, mine), so the shot is unstable. Icons are complete (10 of 10).
  - `navigation-sidenav--sidebar-first-collapsed` 1024 light: differs from the baseline on every run. I opened the new shot and the baseline side by side and found no visible difference (sub-pixel raster). The same story is identical at 1024 dark and at the other widths.
- **New and changed stories:** 13 stories at 360 · 1024 · 1280 (placeholder and lazy stories also at 1920), light · dark, all with `--measure` (`placeholder.log`, `icons.log`, `inline.log`, `lazy.log`). I opened 12 shots: placeholder next-to (1280, light and dark), sections, collapsed; unregistered 360; registered 1280; wrapping 360 (light and dark); without-underline 360; lazy DE before the swap (1280); and the sidebar-first-collapsed pair.

| AC | Result | Evidence |
|---|---|---|
| AC-1 | pass | build.md / `tmp/002/compat-final.log`: A 137.28 → C 129.00 kB gzip (−8.27, target ≥ 7); the robot path is in no initial chunk of C |
| AC-2 | pass | `registered-icons`: 25 / 25 `<svg>` on first measure, boxes 16/20/24/32/40, `role="img"` + `aria-label`; prerender check per build.md |
| AC-3 | pass | `kit-icons.spec` scan; the docs table lists 31 glyphs and matches the scan (deviation 1); `inline-set` and all 66 internal-glyph stories are identical by hash |
| AC-4 | pass | per build.md: assertions unchanged, +4 cases. Registration goes through `offerIconSvgs` (`icon-registry.ts:87`) into the same policy |
| AC-5 | pass | `unregistered-name`, all widths and themes: home = 1 path, sun = placeholder (`<text>`), anchor = fetched (3 shapes); all three 24 × 24 |
| AC-6 | pass | build.md: the exhaustive test (0 differences); B 127.08 kB with the set lazy; the 66 baseline stories (Storybook registers nothing, so they take the `'load'` path) are identical, apart from the 10 shots above |
| AC-7 | pass | `bundle-size--docs` (register, find, unregistered, kit table, sidenav pattern and pitfalls); JSDoc `@default` on `LcIconOptions.unregistered`, `strict` and all 10 placeholder inputs; argTypes with `table.defaultValue`; `test:tools` 22/22 |
| AC-8 | pass | C 129.00 → D 122.94 kB (−6.06, target ≥ 6); `lc-sidenav` in no initial chunk of D |
| AC-9 | pass | `lazy.log`, EN and DE, 1024/1280/1920, light and dark: host, rail, 3 rows and `<main>` are identical before and after the swap (1280: rail 0,64,240×256, rows 24,112,192×48, main x 240 w 1040; 1920: 280 / 232), CLS 0 in all 12 measurements. `placeholder.log`, 4 stories × 4 widths × 2 themes: rail, logo, nav, rows, items, icons and content all Δ 0. Only the section title is 84 vs 90.9 px wide (same 28 px height, so no shift) |
| AC-10 | pass | `sidenav.*.spec.ts` assertions unchanged (build.md); the 18 sidenav stories are identical apart from the flaky shots above |
| AC-11 | pass | before the swap: `inert`, `aria-hidden="true"`, 0 `nav`, 0 `aria-current`; after: 1 `nav`, 1 `aria-current`. DE at 1024: labels 2 and 3 truncate with an ellipsis (`-TT`; the sidenav's label CSS is unchanged, see AC-10) |
| AC-12 | pass | build.md: compat Angular 22 PASS (33 HTML checks); Angular 21 runs in CI; no new dependency, peer range unchanged |
| AC-13 | pass | every `.btn-inline` link: `text-decoration-line: underline`, 1 px, offset 2.4 px (16 px) / 2.1 px (14 px); the paragraph has `none`. Hover thickness per `button.styles.spec` |
| AC-14 | pass | link 6.21:1 light / 11.78:1 dark (unchanged); against the text 2.86 / 1.47, so the line is the cue. Forced colours: decoration is kept (style spec) |
| AC-15 | pass | `inline-link-wrapping` 360 / 1024 / 1280: EN 72 px and DE 96 px with and without the line, link over 2 fragments; hook default `underline` in the argTypes and the docs |
| AC-16 | open | release step, see finding 2 |

### Deviations from build.md (all accepted; design.md has a change note)

1. **31 kit glyphs, not 26.** Accepted: the scan is authoritative, and design §9 was incomplete.
2. **`-boxes` mixin subsets.** Accepted: Δ 0 on every box, and they save 0.6 kB for AC-8. See finding 1.
3. **`--border-radius-sm` is 10 px, so the shapes are circles.** Accepted: the kit has no 4 px token. The circles read well in both themes. The design was wrong here.
4. **Hook `none`: hover shows the 2 px line.** Accepted: it matches the in-text hover, and since the hook is new, no consumer sees a change.

### Findings

| # | Severity | Where | Expected | Actual |
|---|---|---|---|---|
| 1 | should-fix | `sidenav-placeholder.component.spec.ts` (styles) | A guard in both directions. For every selector the two stylesheets share, each box declaration of `lc-sidenav` (display, position, inset, width/height with min/max, padding, margin, gap, flex*, box-sizing, overflow, border-width, line-height) is also in the placeholder. Otherwise a later edit to a full mixin that misses its `-boxes` twin brings back CLS without any test failing | The spec only checks placeholder ⊆ sidenav, so an omission passes |
| 2 | should-fix | changelog (release-manager, AC-16) | Exact names: `provideLcIcons`, `LcIconDefinition`, `LcIconOptions`, `LcIconFallback` (`'load' \| 'placeholder'`), the `strict` addition, `ICON_*` / `_SOLID`, `BUNDLED_ICONS`, `lc-sidenav-placeholder`, `--lc-btn-inline-text-decoration`. Also the install line, a registration snippet and the `@defer` sidenav snippet | The build.md draft omits the three type names, `strict`, the install line and both snippets |
| 3 | nit | `components-icon--registered-icons`, 1280 | The constant name and its glyphs read as one row (row width capped at about 640 px) | Glyphs at x 1000–1256, about 800 px from their names |
| 4 | nit | `bundle-size--docs` | The trade-off in one table. Registering nothing gives the smallest initial JS (127.08 kB), but the 12 kB set loads right after start and client-only renders show the glyphs late. Registering what the app renders costs 129.00 kB and loads no extra chunk | No sizes on the page; the trade-off is only in the changelog draft |

**Verdict:** approved. There is no must-fix, and findings 1–4 stay open for the release.

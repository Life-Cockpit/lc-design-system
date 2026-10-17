# Review 003: lc-code-block under Trusted Types

## Round 1 — 2026-10-17, commit 8797a1b

Screenshots: `tmp/story-shots/003/review-r1` (84 shots, the 14 stories of design.md §8, `--full`, 360 · 1024 · 1280, light · dark, compared with `baseline`). Measures: `review-measure` (7 code-block stories, 360 and 1280, both themes), `review-probe` (arg probes on `data-display-code-block--type-script` and `--bash`, 360). Storybook build 19:00, newer than the source (18:51).

| AC | Result | Evidence |
|---|---|---|
| AC-1 | pass | `Grep` over `code-block/` (without specs) for every S7 name and `platform-browser`: 0 hits. FESM: 0 (build.md) |
| AC-2, AC-3 | **pending** | `check-trusted-types.mjs` needs a permission this review doesn't have. `/tt/code` covers design §9: ts with an empty line, numbers on, DE labels; html `<a href="x">&amp; "q"</a>`, numbers off; bash `…\n\nnpm test` (D2). Its 5 checks + `checkLog` run in both policy runs. The release-manager runs it (also `ci.yml:79`) |
| AC-4 | pass | Golden spec (build.md). Probe D1: scss line 3 renders `  &:hover > .t { gap: $x }` with 3 spans (`&`, `.t`, `$x`), as §9 expects. 72/84 shots identical by hash |
| AC-5 | pass | Probe `language=html`, `<img src=x onerror=alert(1)>\n&lt;b&gt;`: 0 `img`, elements under `code` = `SPAN` only, line texts equal the input, `<img` is `token-tag` text |
| AC-6 | pass | Probe at 360 px, light and dark: `a\n\nb` numbers on → 13.469 ×3; off → 13.469 ×3; bash `npm install\n\nnpm test`, off → 13.469 ×3 (3.6.0: 0 px middle); `code=""` → 1 line, number "1" |
| AC-7 | pass | Probe (stubbed `writeText`): copies the raw code, which equals the joined line texts (S2); after the click: label and `aria-label` "Copied", live region "Copied to clipboard"; after 2.1 s: "Copy code" and "" |
| AC-8 | pass | All 6 stories with a header, 360/1280, light/dark: copy `svg` = `role` null, `aria-hidden="true"`, no `aria-label`; `svg[role=img]` without a name: 0. The same in the copied state. DE: unit test (build.md); `/tt/code` uses the DE labels |
| AC-9 | pass | `review-r1` against `baseline`: **72 identical, 12 different** = Python and Java × 3 widths × 2 themes, the same as the dev's `r2`; `r2-revert` is 12/12 identical with the old comment colour. Opened python 360 light (new and baseline) and java 1280 dark: only the comment ink changes. Geometry unchanged: button 76.8×44, content x 73 (bash 33), 12.25 px, lines 13.469 px. forced-colors: by inspection, see #2 |
| AC-10 | pass | Bash story `selectAllChildren(code)`: `npm install @lifecorner/angular-ui-kit\n\nnpx nx build angular-ui-kit\n\nnpx nx test angular-ui-kit\n` = 3.6.0 (design §9). TypeScript: line numbers not in the string |
| AC-11 | pass | `EXPECT_IN_HTML` on `tt/code` passes on 21.0, 21, 22.0 and 22 (build.md, `tmp/003/compat.log`) |
| AC-12 | pass | build.md: sanitizer initial → none; initial JS 80.57 → 76.98 kB gzip; code-block chunk 10.74 → 10.84 kB gzip |
| AC-13 | pass | build.md: first render one 115 ms task (cap 200), re-render < 50 ms. See #3 |
| AC-14 | pass | `git show --stat`: `code-block.stories.ts`, `index.ts` and `code-block.component.spec.ts` untouched. The `.ts` diff touches only internals, not inputs or JSDoc. `CodeSegment` and `CodeLine` are not exported (§2) |
| AC-15 | pass | Python (2 comments) and Java (1), 360/1280, light/dark: `rgb(147, 164, 173)` italic on `rgb(12, 23, 34)` = **7.02:1** (WCAG formula in the browser) |

API against design §2: input names, types, defaults, JSDoc and argTypes are unchanged. The internal types match §2. Each token span has 2 attributes (`class`, `_ngcontent`) and 1 text child in all 7 stories (S1).

### Findings

| # | Severity | Where | Expected | Actual |
|---|---|---|---|---|
| 1 | nit (design, fixed) | design.md status and §9 risks | The status reflects the spec answers. The AC-15 assertion goes outside the frozen spec file | The status still said "pending Q1/Q2", and §9 named `code-block.component.spec.ts`, which AC-14 keeps unmodified. Fixed with a change note. The build had already done the right thing |
| 2 | nit | AC-9 "forced-colors checked once" | Shot with `forced-colors: active` | Not emulated: `story-shots.mjs` has no switch for it. By inspection the risk is nil: the only CSS change is a `color` value, and no `forced-color-adjust` exists in `code-block`. A `--forced-colors` flag for the tool would be a separate request |
| 3 | nit | AC-13 | ≤ 200 ms | 115 ms first render, against 66 ms in 3.6.0 (+49 ms). It is within the cap, so the design §3 fallback isn't needed. Recorded for a later perf look |
| 4 | nit | Python and Java, all widths | Comments distinct from code | Comments now share the line-number ink #93a4ad and differ by italics only. This is the accepted Q2a trade-off (the spec allows no new colour). A distinct AA comment hue belongs in follow-up F1 |

**Verdict:** approved. AC-2 and AC-3 have to be confirmed by `node tools/compat/check-trusted-types.mjs --app=tmp/003/compat-m/app-22` before the release (release-manager).

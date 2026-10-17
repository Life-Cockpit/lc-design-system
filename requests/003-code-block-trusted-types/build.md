# Build 003: lc-code-block under Trusted Types

- **Branch:** `fix/3.6.1-code-block-trusted-types`
- **Commit:** the branch's one commit, fix(code-block): render tokens as elements, so it works under Trusted Types (gates ran on `79455eb`; amended with this file and `log.md` only)

## Files changed

| File | Change |
|---|---|
| `code-block.component.{ts,html,scss}` | No `DomSanitizer`/`escapeHtml`; `tokenize` on the raw source → `CodeLine[]` (S3–S5); html rules `<`/`>`, comment rule removed (K3). Inner `@for`: `<span [attr.class]>` or bare text, outer structure as 3.6.0 (S6). Copy icons `[decorative]="true"`. `.token-comment` → `var(--lc-code-block-muted)` |
| `code-block.rendering.spec.ts`, `code-block.golden-3.6.0.json` | New, 36 tests; fixture = designer's 10 samples + the 7 stories captured from the 3.6.0 build before the change |
| `tools/compat/template/…/tt/tt-code.ts`, `app.routes.ts`, `check-trusted-types.mjs`, `check-angular-majors.mjs` | `/tt/code` (ts with numbers and an empty line; html `<a href="x">&amp; "q"</a>`, bash, no numbers), checked in both TT runs; `EXPECT_IN_HTML` +3, `CSP_PAGES` + `tt/code`; `--code-before` |
| `tools/compat/bundle-size.mjs`, `bundle/…` (`code` configuration) | Bare shell, code block on a lazy route; E (3.6.0) vs F (this build) |

Unchanged (0 lines): `code-block.component.spec.ts`, `code-block.stories.ts`, `index.ts`, every input's JSDoc.

## Acceptance criteria

| AC | Covered by | Result |
|---|---|---|
| AC-1 | spec: source regex (S7 list) on `.ts`/`.html`; no `@angular/platform-browser` import in the folder; built FESM grep | 0 hits |
| AC-2, AC-3 | `check-trusted-types.mjs` `/tt/code` (both runs, 360/1280) | **not run here** (needs approval in this environment; runs in CI, `ci.yml:79`). Csp build ready: `--app=tmp/003/compat-m/app-22`. Substitute: Storybook re-render under a TT meta CSP with a recording default policy: 4 sink writes, all `""` from Storybook itself, **0 from the code block**; text equals the source, 8 `token-tag`, only spans (360, 1280) |
| AC-4 | spec: 10 languages + 7 stories against the golden data, D1 stated in the test; re-render on a code/language change equals a fresh render | all equal; scss line 3 = D1 |
| AC-5 | spec (`text`, `html`): `<img src=x onerror=alert(1)>`, `&lt;b&gt;` | 0 `img`, only `SPAN`, text = input |
| AC-6 | spec (S4, `a\n\nb` numbers on/off, D2 bash); probe at 360, light + dark | 13.469 / 13.469 / 13.469 px in all three cases (3.6.0 bash: 0 px middle) |
| AC-7 | existing spec unchanged; spec: CRLF copies the raw code | pass |
| AC-8 | spec, EN and DE, idle and copied: `svg[aria-hidden=true]`, no `role`, no `aria-label`; probe `svg[role=img]` without a name in `lc-code-block`, light + dark | 0 (3.6.0: 1 per block) |
| AC-9 | shots `tmp/story-shots/003/r2` vs `baseline` | 72 identical, 12 different = Python, Java × 3 widths × 2 themes; with `.token-comment` set back to #5c6370 (`r2-revert`): **12/12 identical**, so the comment colour is the only difference. D1/D2 occur in no story |
| AC-10 | probe: select all of the Bash story's `code` | equals the 3.6.0 string |
| AC-11 | `EXPECT_IN_HTML` on `tt/code`: keyword span, `&lt;a` as `token-tag` text, the decoded text of all 3 blocks = source | ok on 21.0, 21, 22.0, 22 |
| AC-12 | `--measure`, Angular 22, bare shell + lazy code-block route (E = 3.6.0 code, F = this build) | sanitizer: E **initial**, F **none**; initial JS 80.57 → 76.98 kB gzip (−3.59; 254.72 → 245.28 kB raw, −9.44); code-block chunk 10.74 → 10.84 kB gzip (30.12 → 30.52 kB raw) |
| AC-13 | 2,000 lines, 10,000 spans, TypeScript story, 1280 px | first render: long task **115 ms** (148 ms wall); re-render: no long task over 50 ms (60 ms wall). 3.6.0: 66 / 59 ms (design §9) |
| AC-14 | full suite; `npm run test:tools`; stories and JSDoc diff 0 lines | pass |
| AC-15 | spec (rule + computed 7.02:1 from the SCSS values); probe in Python/Java, light + dark | `rgb(147,164,173)` italic on `rgb(12,23,34)`: **7.02:1** |

## Gates

All gates ran on commit `79455eb4f239b8e9862aedc23a86ea4040c7771a` (only the unrelated `tools/infra/cdk-outputs.json` differs in `libs tools`); the compat runs ran on the same tree just before the commit was made (the full matrix before `--code-before` was added). Logs in `tmp/003/`.

| Gate | Result |
|---|---|
| `npx nx run angular-ui-kit:test` | 144 suites, 3780 passed, 8 skipped (main: 143 / 3744; +36 new). One earlier run hit the known jest-worker SIGSEGV in `icon.trusted-types.spec.ts`; the rerun was green |
| `npx nx run angular-ui-kit:lint` | 0 errors, 162 warnings, none in `code-block/` |
| `npx nx run angular-ui-kit:build` | 117 entries built; FESM `code-block` has no `platform-browser`, `innerHTML`, `ɵɵsanitizeHtml` |
| `npm run test:tools` | 22/22 |
| `npx nx run angular-ui-kit:build-storybook` | ok |
| Story screenshots | `tmp/story-shots/003/r2` (84), `r2-revert` (12), probes in `measure/`, `measure-tt/` |
| `node tools/compat/check-angular-majors.mjs` | full matrix (`tmp/003/compat.log`): 21.0, 21, 22.0, 22 PASS incl. the 3 AS-20 checks and the csp build; `--only=22 --measure --code-before=tmp/003/kit-360/kit-3.6.0-code.tgz` (`compat-measure.log`): PASS, 9/9 bundle checks |
| `node tools/compat/check-trusted-types.mjs` | not run (permission), see AC-2 |

`--code-before`: 3.6.0 is staged, not public, so `npm install …@3.6.0` fails (ETARGET). The tarball is request 002's final build (`tmp/002/compat-final`, before f6f3ca8; the 3.6.0 release commit changed only `package.json` and `CHANGELOG.md`); its `code-block` FESM has `bypassSecurityTrustHtml` and `ɵprovideKitIcons([ICON_CHECK])`. Once 3.6.0 is public, the default applies.

## Deviations from the design

None. Notes: the new tests sit in `code-block.rendering.spec.ts`, not in `code-block.component.spec.ts`, so that file stays unmodified (AC-14); the AC-15 assertion is there (design §9 risks). `[attr.class]` instead of `[class]` on the token span: the same DOM, 115 instead of 123 ms for the first render. `forced-colors` was not emulated (story-shots has no flag); the CSS uses a custom property as before.

## Changelog draft

```markdown
## [3.6.1] - 2026-10-17

`lc-code-block` works under a Trusted Types CSP (life-os app shell, AS-20). No API breaks.

### Fixed

- **`lc-code-block` renders under Trusted Types** (AS-20). Under `require-trusted-types-for 'script'`
  it showed no code ("This document requires 'TrustedHTML' assignment"). The tokens are now
  `<span class="token-…">` elements and text nodes from the template: no `innerHTML`, no
  `DomSanitizer`, no policy to allow; source text is never parsed (`<img onerror=…>` shows as
  text); prerendered HTML contains the spans.
- **Angular's HTML sanitizer leaves your initial chunk.** With the block on a lazy route, a bare
  Angular 22 app's initial JS drops from 80.57 to 76.98 kB gzip (−3.59 kB, −9.44 kB raw); the
  block's lazy chunk is 10.84 kB gzip (3.6.0: 10.74 kB).
- **Copy button: no axe `svg-img-alt`.** Its icons are decorative (`aria-hidden="true"`, no `role`).
- **Comments meet AA:** `.token-comment` uses the block's muted ink, 7.02:1 (was 2.99:1).
- **SCSS shows the source** (`&:hover > .x`, 3.6.0 showed `&amp;:hover &gt;`), and an empty line
  before a bash command keeps its height (was 0 px without line numbers).

### Compatibility

- No API breaks: inputs, selectors, `token-*`/`code-block__*` classes and custom properties are
  unchanged. Otherwise every language renders 3.6.0's text and token classes; story screenshots
  are pixel-identical except the comment colour. A 2,000-line block renders in one 115 ms task.
- `lc-log-viewer`, `lc-markdown` and `lc-rich-text-editor` still use `[innerHTML]`; `lc-icon`'s
  defaults are unchanged.
```

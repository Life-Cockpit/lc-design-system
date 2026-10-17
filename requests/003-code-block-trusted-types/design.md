# Design 003: lc-code-block under Trusted Types

> **Change note (review round 1, 2026-10-17):** the spec answered Q1 (D1 and D2 allowed) and Q2 with (a), AC-15. §9 risks: the AC-15 assertion belongs in a new spec file, because AC-14 keeps `code-block.component.spec.ts` unmodified (the build did that, in `code-block.rendering.spec.ts`).

- **Status:** ready. Q1 and Q2 are settled in spec.md (§1), and the build needed no further design round.
- **Spec:** [spec.md](spec.md), AC-1 … AC-14. Golden data: [golden-3.6.0.json](golden-3.6.0.json). Baselines: `tmp/story-shots/003/baseline` (84 shots).

## 1. Approach

This extends `lc-code-block` in place as a patch. It follows `lc-icon` 3.5/3.6: no string-to-DOM write anywhere, so no Trusted Types policy is needed. The tokens are plain template text and class bindings, like every other kit component.

1. **Tokenize** `code()` **raw**, without `escapeHtml`. Use the 3.6.0 rules and the same sort and overlap filter. There are three html rule edits: `&lt;\/?[\w-]+` becomes `<\/?[\w-]+`, `\/?&gt;` becomes `\/?>`, and the comment rule `<!--[\s\S]*?-->` is **removed**. It ran on escaped text, so it never matched in 3.6.0, and removing it keeps the output (K3).
2. **Cut into lines** (rules S1–S7, §3). Each line is a `CodeLine`, a list of segments.
3. **Render:** the outer line structure of the template stays exactly as it is, and only `[innerHTML]` is replaced by the segments.

Measured on the 3.6.0 build (golden-3.6.0.json and the probes in §9):

| ID | Case | 3.6.0 | Now | Basis |
|---|---|---|---|---|
| D1 | SCSS line with `&`, `<` or `>` (`&:hover > .t`) | Shows the entity text `&amp;:hover &gt; .t`, and colours the `&` of every entity. | Shows the source text. `&` is `token-selector`; `<` and `>` are plain, as in `css`. | AC-5 (text equals input). This is the only change to the text. |
| D2 | An empty line followed by a line that starts with a bash builtin (the token starts with `\n`) | The line holds only an empty `<span>` and is **0 px** tall when line numbers are off. | U+00A0, 13.475 px | AC-6 |
| K1 | A token that spans lines: block comment, docstring, template literal, or a `'…'` string that runs past the line end | The class stays on the first line part only; the following lines are plain. | The same | AC-4 |
| K2 | A bash builtin at the start of any line after line 1 | Plain, with an empty span at the end of the line before | Plain, without the empty span (invisible either way) | AC-4 |
| K3 | An html comment `<!-- x -->` | Plain, with the `>` as `token-tag` | The same | AC-4 |

**Follow-ups, outside this request.** F1: highlighting fidelity, i.e. K1–K3 plus quoted strings that should not run across lines. If K1 were fixed now, an apostrophe in html or bash text would colour every line up to the next `'`. F2: copying a selection gives a blank line between code lines. AC-10 keeps that.

**Questions for spec-writer** (the recommended answer is first):

- **Q1, AC-4 wording.** Add the D1 and D2 exceptions to "same text … as before". The alternative, reproducing `&amp;` in SCSS, contradicts AC-5 and the request.
- **Q2, comment contrast.** `.token-comment` #5c6370 is **2.99:1** on #0c1722, which fails AA for text. Under life-os's CSP the code renders for the first time, so its axe runs would report `color-contrast` on any comment.
  - **(a) Recommended: fix it in 003** with the existing `var(--lc-code-block-muted)` (#93a4ad, **7.02:1**, still italic). This is one declaration and no new token. The 12 Python and Java shots then differ, and that is explained.
  - (b) Keep it out of scope as F3. Then there is no CSS change at all.

## 2. Public API

| Kind | Name | Type | Default | Description (JSDoc) |
|---|---|---|---|---|
| input | `code`, `language`, `filename`, `showLineNumbers`, `showCopy`, `showHeader`, `copyLabel`, `copyAriaLabel`, `copiedLabel`, `copiedAnnouncement` | unchanged | unchanged | unchanged, not one character edited (AC-14) |
| type | `CodeBlockLanguage` | unchanged | — | — |
| CSS | classes `code-block__*`, `token-*`; the custom properties `--lc-code-block-{bg,ink,muted,muted-strong,border}` | unchanged | unchanged | Q2a changes only the value used by `.token-comment` |
| internal (not exported) | `CodeSegment` | `{ readonly text: string; readonly className: string \| null }` | — | A run of text; `className` is one `token-*` class, or `null` for plain text. |
| internal | `CodeLine` | `readonly CodeSegment[]` | — | Replaces `highlightedLines: SafeHtml[]`. The `DomSanitizer` injection and `escapeHtml` are removed. |

**Default rendering unchanged.** This is guaranteed by the golden test (AC-4) and the hash comparison of 84 shots (AC-9). `code-block.stories.ts` stays untouched, so the manifest stays equal (AC-14).

## 3. Anatomy and layout

The layout doesn't change. These values were measured on the TypeScript story, light theme:

```
360 px                                      1280 px: same, block 1248 wide
x16 ┌──────────────────── 328 ────────────┐  copy button x 1182.2
    │ example.component.ts   [⧉ Copy] 77×44│  header 45 (44 + 1 px border)
    ├─────────────────────────────────────┤  icon 20×20, x +12 inside the button
    │16│ 1 │import { Component, … ⟶ scroll  │  pre padding 16; number box x33 w40
    │  │ 2 │·(U+00A0, 13.475)               │  content x73; 12.25 px mono, lh 13.475
    └─────────────────────────────────────┘  body overflow-x: auto (unchanged)
```

**DOM contract** (one `code-block__line` for each entry of `code().split('\n')`):

```
code.code-block__code
├─ span.code-block__line                      (template, as 3.6.0, carries _ngcontent)
│  ├─ span.code-block__line-number  "N"       (only when showLineNumbers)
│  └─ span.code-block__line-content
│     ├─ #text "plain run"
│     ├─ span.token-keyword ─ #text "const"   (exactly one class, one text node)
│     └─ …
└─ #text "\n"                                 (after every line, as 3.6.0)
```

- **S1.** Inside `.code-block__line-content` there are only text nodes and `<span class="token-*">` elements, plus the comment anchors that Angular's control flow adds. A token span has one text child and no attribute other than `class` and Angular's `_ngcontent-*`. `::ng-deep .token-*` matches either way.
- **S2. Text equals the source.** The line texts joined with `\n` (with each empty line's U+00A0 counted as `''`) equal `code()`.
- **S3.** Zero-length parts are dropped, and adjacent plain parts are merged into one text node. 3.6.0 had one text node there, as in `"<p>it's"`.
- **S4. An empty line**, one with no part left, is a single text node **U+00A0**. That is the glyph 3.6.0's `&nbsp;` produced, so the height stays 13.475 px and the selection string stays the same. `code=""` therefore gives 1 line. Not `min-height: 1lh`, which would be a CSS change and would alter the selection.
- **S5. Multi-line token (K1).** The part before the first `\n` keeps the class; the later parts are plain. This is how the HTML parser closed the open span at the line end in 3.6.0.
- **S6.** The template structure of the lines is unchanged: one source line, and the `\n` before the `}` of the outer `@for`. This keeps AC-10.
- **S7. No string-to-DOM API in the folder.** No `innerHTML`, `outerHTML`, `insertAdjacentHTML`, `DOMParser`, `createContextualFragment`, `DomSanitizer`, `SafeHtml` or `bypassSecurityTrust*`, and no import from `@angular/platform-browser` (AC-1).

**Mechanism.** The template follows the spec's scope: an inner `@for` over the segments, with a span for a class and bare text otherwise.

- *Pitfall:* inside `<pre>`, Angular keeps all template whitespace. Write the inner block on the same line, with no space or newline between `{`, `}`, `@if`/`@else` and the elements.
- *Budget:* AC-13 caps a long task at 200 ms; 3.6.0 takes 66 ms (§9). If the template goes over 200 ms, fill only `.code-block__line-content` through `DOCUMENT.createElement`/`createTextNode` in an `effect` of an internal per-line directive. This is the lc-icon pattern: it runs on the server and needs no `afterRender`. The DOM contract stays the same, and build.md records the switch.

**Copy icons (AC-8).** Both `<lc-icon … size="sm" [decorative]="true" />`. Then `decorateSvg` sets `aria-hidden="true"` and removes `role` and `aria-label` (icon-dom.ts:69-72). Classes and size don't change (icon.component.ts:367), so the pixels are identical. Today's svg has `role="img"` and no name.

## 4. States

| State | Design |
|---|---|
| default, hover, focus-visible, active | unchanged; no CSS change except Q2a |
| copied | `check` icon decorative; `copiedLabel` shown and used as `aria-label`; live region text; reset after 2 s (AC-7, unchanged) |
| disabled, loading, error | Not applicable. A rejected clipboard write stays silent, as today. |
| empty | `code=""` gives 1 line with U+00A0 and line number 1 (S4); an empty line inside the code also keeps 13.475 px (D2) |
| untrusted text | `<img src=x onerror=alert(1)>` and `&lt;b&gt;` appear as typed; no element other than `span` (AC-5) |
| overflow | Long lines scroll horizontally (`white-space: pre`, `overflow-x: auto`). Tabs are kept. A trailing `\r` (CRLF) stays in the text node, renders as invisible white space, and the copy button still copies the raw text. 2,000 lines stay within budget (AC-13). |
| long German labels | not affected: the labels and the button CSS are unchanged |

## 5. Theming

The block is dark in both themes (component-local values), so light and dark are identical. Contrast was computed with the WCAG formula in the browser.

| Element | Colour | on body #0c1722 | on header #09111a |
|---|---|---|---|
| ink | #eef4f6 | 16.28 | 17.08 |
| line number, label (muted) | #93a4ad | 7.02 | 7.37 |
| keyword / string / number, constant, attr, unit | #c678dd / #98c379 / #d19a66 | 6.14 / 8.97 / 7.34 | — |
| type / decorator, property, builtin / tag, selector, variable / flag | #e5c07b / #61afef / #e06c75 / #56b6c2 | 10.47 / 7.65 / 5.66 / 7.63 | — |
| **comment** | #5c6370, italic | **2.99 (fails AA)** | — |
| comment with Q2a | `var(--lc-code-block-muted)` #93a4ad, italic | 7.02 | — |

There is no new token.

## 6. Accessibility

- **Semantics.** `pre > code` stays; line numbers stay `user-select: none`. The token spans carry no role or ARIA.
- **Copy button.** Its name comes from `aria-label` ("Copy code", or "Copied" after copying), and the icon is decorative (AC-8). That resolves axe `svg-img-alt` (serious).
- **Target and announcement.** 76.8×44 px at 360 and 1280 px; focus ring and polite live region unchanged.
- **forced-colors.** No CSS change: system colours replace the token colours, as before. The Q2a declaration uses a custom property, which forced colours override in the same way.
- **Reduced motion.** Only the existing 0.15 s colour transition. No motion added.
- **axe.** The repo has no axe. Its `svg-img-alt` rule is checked as a DOM rule: no `svg[role=img]` without `aria-label`/`aria-labelledby` in the story.

## 7. Texts

No new text. The existing inputs, in German as `i18n-labels.spec.ts:337` sets them:

| Input | EN default | DE |
|---|---|---|
| `copyLabel` | Copy | Kopieren |
| `copyAriaLabel` | Copy code | Code kopieren |
| `copiedLabel` | Copied | Kopiert |
| `copiedAnnouncement` | Copied to clipboard | In die Zwischenablage kopiert |

## 8. Stories

No story is added or changed (AC-14: the manifest lists the stories). The review surfaces are the 14 stories that render a code block, plus the argument probes from §9 on `data-display-code-block--type-script`.

| Story | Expected ID | Shows |
|---|---|---|
| TypeScript, JSON, Bash, No Header, HTML, Python, Java | `data-display-code-block--{type-script,json,bash,no-header,html,python,java}` | every language with a story; K1 in Java lines 11–13, K2 in Bash lines 2–3; comments in Python and Java (Q2) |
| Markdown | `components-markdown--{default,compact,with-heading-anchors}` | lc-code-block inside lc-markdown, with an empty line |
| Document viewer | `data-display-document-viewer--{markdown-preview,code-preview,no-toolbar}` | two blocks, and a trailing empty line |
| Timeline | `data-display-timeline--transcript` | a one-line bash block, line numbers off |

## 9. Verification

| AC | How | Expected value |
|---|---|---|
| AC-1 | Spec test that reads the `.ts` and `.html` source with a regex for every S7 name; `grep -r` in review | 0 hits |
| AC-2, AC-3 | `/tt` page: a typescript block with an empty line (numbers on), `html` with `<a href="x">&amp; "q"</a>` (numbers off), and `bash`; `check-trusted-types.mjs` at 360 and 1280 | 0 violations, 0 console errors; the block text equals the source; icons as other icons (AC-3) |
| AC-4 | Unit test against golden-3.6.0.json. Normalise both sides: drop `""` and `[cls,""]`, merge adjacent strings. Compare `t` and `k` per line. Also run the 7 story samples, which must equal 3.6.0 as captured by the developer before the change. | All equal, except **scss line 3**: `t` = `  &:hover > .title { gap: $gap }`, `k` = `["  ",["token-selector","&"],":hover > ",["token-selector",".title"]," { gap: ",["token-variable","$gap"]," }"]` (D1) |
| AC-5 | Unit test with `language` `text` and `html` | `code img` count 0; text equals the input; every element under `code` is a `SPAN` |
| AC-6 | Unit test (3 lines, the middle one U+00A0) and probe at 360 px: `a\n\nb` with numbers on and off, and bash `npm install\n\nnpm test` with numbers off | every line 13.47 px (3.6.0: 13.47 / **0** / 13.47 for bash with numbers off) |
| AC-7 | Existing spec, unmodified | passes |
| AC-8 | Unit test in both states, also with the DE labels: `.code-block__copy svg` has `aria-hidden="true"` and no `role`. Probe in review: `svg[role=img]:not([aria-label]):not([aria-labelledby])` inside `lc-code-block`, light and dark | 0 (3.6.0: 1 per block) |
| AC-9 | `story-shots.mjs --stories=<the 14 IDs from §8> --full --out=tmp/story-shots/003/r1 --compare=tmp/story-shots/003/baseline --measure='(await new Promise(r => setTimeout(r, 700)), 0)'` | 84/84 identical. With Q2a: 72 identical, plus 12 differing shots (Python and Java at 3 widths × 2 themes) that show only the comment colour. A stability re-run on the same build had 0 differences. |
| AC-10 | Probe: `getSelection().selectAllChildren(.code-block__code)`, then `toString()` on the Bash story | `npm install @lifecorner/angular-ui-kit\n\nnpx nx build angular-ui-kit\n\nnpx nx test angular-ui-kit\n` (3.6.0) |
| AC-11 | `EXPECT_IN_HTML`: a token string on the compat page, for example `<span class="token-keyword"` together with the code text | present in the prerendered HTML |
| AC-12 | Compat build on Angular 21 and 22: initial chunk without `DomSanitizer` HTML sanitizer code; code-block chunk size before and after | reported in build.md |
| AC-13 | 2,000 lines, about 10,000 token spans (`const valueN = compute("item", N, true) // note N`), first render and a re-render on a `code` change; long tasks measured | 3.6.0 reference **66 ms first / 59 ms re-render**; must stay ≤ 200 ms |
| AC-14 | `npx nx run angular-ui-kit:test`, `npm run test:tools`; `git diff` on the stories file and the JSDoc | unchanged; 0 lines of story diff |

**Risks** (from earlier requests):

- Template whitespace inside `<pre>` (§3).
- If the fallback is used: an effect, not `afterRender`, because the server has to write the spans.
- A golden test written against the old regexes. Freeze the samples first.
- Q2a forgotten in `theme-contrast` thinking: the colour is component-local, so assert it in a new spec file next to the component (not in `code-block.component.spec.ts`, which AC-14 keeps unmodified).

# Design 004: lc-code-block scroll region

- **Status:** ready
- **Spec:** [spec.md](spec.md) — AC-1 … AC-11
- **Measured on:** main 93c42ec (3.6.1), static Storybook, headless Chromium, SF Mono 12.25 px
- **Change note (review round 1):** §3 said the 400-character line wraps to 3 rows at 1280 and has a 13.475 px row pitch. Measured on 373e0b8: 4 rows at 1280 (the URL run breaks only at its hyphens, then anywhere) and a 13.47 px pitch (rows snap to 1/64 px). These are figures in the drawing only; no AC or code depends on them.

## 1. Approach

Extend `lc-code-block`. Two optional inputs in the existing label-input style (`copyLabel`, …); the ring is the kit's `mix.focus-ring` (as button, card, alert), only inset.

**Finding that shapes the design:** the global `pre { overflow-x: auto }` (`_typography.scss:150`) makes `.code-block__pre` the element that actually scrolls. axe on 3.6.1 (Java, 360) flags `scrollable-region-focusable` on **`.code-block__pre`**, not on the body (body `scrollWidth` 326 = `clientWidth`; pre 534 > 326). The component therefore sets `.code-block__pre { overflow: visible }`, as it already overrides the global `pre` background, colour and radius. The body becomes the only scroller, and the region attributes go on the body (AC-1). At rest this paints the same pixels: the scrollbars are overlays in the shot browser, and with classic scrollbars the bar sits at the same place (the pre fills the body).

## 2. Public API

| Kind | Name | Type | Default | Description (JSDoc) |
|---|---|---|---|---|
| input | `regionLabel` | `string \| undefined` | `undefined` | Accessible name of the scrollable code region (`role="region"`). When it is unset or empty, the `filename` is used, then the `language`. Set a short, localised name that is unique on the page, such as "Befehl für Claude Code". Not used when `wrap` is set. `@default undefined` |
| input | `wrap` | `boolean` | `false` | Wraps long lines (`white-space: pre-wrap`, breaking anywhere if needed) instead of scrolling sideways. A wrapped block doesn't scroll, so its body is neither a tab stop nor a region. `@default false` |
| CSS hook | none | — | — | The ring uses `--color-primary-500`, like every kit focus ring. No new `--lc-code-block-*` variable. |
| type | none | — | — | — |

- Place both inputs after `showHeader`. Write them as `regionLabel = input<string \| undefined>(undefined)` (the `typography` pattern) and `wrap = input<boolean>(false)`.
- `protected regionName = computed(() => this.regionLabel() \|\| this.headerLabel())`, so `''` falls through.
- Add `code-block--wrap` to `codeClasses()` only when `wrap()` is set. With `wrap` false the class string stays `code-block code-block--<lang>`.
- Body: `[attr.tabindex]="wrap() ? null : 0"`, `[attr.role]="wrap() ? null : 'region'"`, `[attr.aria-label]="wrap() ? null : regionName()"`. Without a role, `aria-label` on a `div` is prohibited, so all three go together. Change only the opening tag of the body; the `pre`/`code` line markup stays byte-identical.
- Update the class JSDoc and the story `component` description with one line: "Keyboard: the body is a focusable, named region that scrolls with the arrow keys; `wrap` wraps instead".

**Default rendering unchanged:** the only default DOM change is three attributes on the body plus the pre's `overflow` (not painted). All other new CSS sits under `:focus-visible` or `.code-block--wrap`. Check: hash compare of the 84 baseline shots (§9).

## 3. Anatomy and layout

All values were measured on 3.6.1; Storybook pads the block to x 16.

### 360 px (`long-command`, focused)

```
x16                                                    x344
┌──────────────────────────────────────────────────────┐ y16  border 1px #24343f, r 12
│ terminal                          [▢ Copy] 76.8×44   │ header 45 (44 + 1 border)
├──────────────────────────────────────────────────────┤ y62  body x17 w326 = region
│ ┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓ │ ring: 2px gap, 2px ring (offset -4)
│ ┃ claude mcp add --transport http --scope us… ──►  ┃ │ text x33 (pre padding 16), 12.25/13.475
│ ┃                                                  ┃ │ (blank row: existing, see §4)
│ ┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛ │ ring corners follow r 11 (bottom)
└──────────────────────────────────────────────────────┘ body h 58.94; scrollWidth 1780 > 326
```

### 360 px (`wrapped`, numbers on)

```
│  1  claude mcp list                                  │ number box x33 w40 · content x73 w254
│                                                      │
│  2  claude mcp add --transport http --               │ "2" and row 1 share the text top (Δ 0)
│     scope user --client-id 3f9c2a7e-                 │ continuation rows at x73, pitch 13.47
│     …  (13 rows at 360, 4 at 1024, 4 at 1280)        │ scrollWidth 326 = clientWidth
│  3  claude mcp get lifecorner                        │
```

### 1024 / 1280 px

Same anatomy; the body is 990 / 1246 px wide. The 240-character `LONG_COMMAND` (≈1764 px) still overflows at 1280 (body `scrollWidth` 1780 > 1246), so AC-3 is checked on a really scrolling region at every width.

| Element | Spacing / size | Type | Token |
|---|---|---|---|
| Focus ring | 2 px solid, `outline-offset: -4px` (2 px gap inside the 1 px border) | — | `--color-primary-500` via `mix.focus-ring($offset: -4px)` (`@use '../../styles/mixins' as mix`, as in button) |
| Ring corners | body `border-radius` under `:focus-visible` only: `0 0 r r`; with `:first-child` (no header) `r` on all corners; r = `calc(var(--border-radius-md) - 1px)` = 11 px | — | `--border-radius-md` (12 px) |
| Pre | `overflow: visible` (overrides the global `pre`) | — | — |
| Wrapped content | `white-space: pre-wrap; overflow-wrap: anywhere; min-width: 0` under `.code-block--wrap .code-block__line-content` | inherits 12.25 px mono | — |
| Line number | unchanged; keep `align-items` at its default (`stretch`), which puts the number on the first row | — | — |

## 4. States

| State | Behaviour |
|---|---|
| default | No visible change. The body is a tab stop after the copy button (or the first stop when `showHeader` or `showCopy` is false). |
| hover | No style; the text cursor and selection work as before. |
| focus-visible | Inset ring (§3). A mouse click focuses the body without a ring (`:focus-visible` heuristics). There is no transition, so reduced motion needs nothing. |
| active / disabled / loading / error | Not applicable. |
| empty (`code=""`) | One empty line (existing). Still named and focusable. |
| overflow, long line | The body scrolls; the ring stays fixed while the content moves under it (the outline paints on top). |
| overflow, many lines | The body grows (no max-height), and the ring encloses the full height. |
| wrap | Breaks at spaces and after hyphens (`--` / `scope` at row ends, browser line-break rules). Runs with neither, such as the URL, break anywhere. Copy still copies the source unchanged. |
| German | The visible strings are the consumer's copy labels; "Kopieren" makes the button ≈106 px wide, which fits the 326 px header next to "terminal". |
| Existing quirk (out of scope, AC-8) | Logical lines are 26.95 px apart, because the `\n` text node after each line adds a blank row. In wrap mode this also separates logical lines from continuation rows (13.475 px). |

## 5. Theming

The block surface is `#0c1722` in both themes, and the header adds `rgba(0,0,0,.25)` on top, which gives ≈`#09111a`. Contrast was computed with the WCAG formula in the browser (`--measure`).

| Element | Light | Dark | Contrast (computed) |
|---|---|---|---|
| Focus ring | `--color-primary-500` = `#208497` | `--color-primary-500` = `#84c7d4` | 4.14 / 9.56 on `#0c1722`; 4.35 / 10.03 on `#09111a` |
| Ring vs block border `#24343f` | not adjacent (2 px gap of `#0c1722`) | same | — (would be 2.94 / 6.78) |
| Forced colors | `outline-color: Highlight` in `@media (forced-colors: active)` | same | system colour |

No new tokens. Rejected: an outset ring through `:has()`. It would sit on the page background (light `#208497` vs white 4.37, but it marks the whole block, copy button included, as focused), and it breaks the AC-5 premise "against the block surface".

## 6. Accessibility

- **Semantics:** body `div[role=region][aria-label][tabindex=0]` > `pre` > `code`. Each block adds a named landmark (spec assumption 3).
- **Name:** `regionLabel`, then `filename`, then `language`. The name is never built from the code. With a filename it equals the visible header text (good for 2.5.3).
- **Keyboard and focus order:** copy button → body. ←/→ scroll natively in a focused scroll container; ↑/↓ chain to the page (the body has no vertical overflow). No JS key handler.
- **Targets:** the region is not a control (spec). The copy button stays 76.8×44.
- **forced-colors:** the ring is an `outline`, not a `box-shadow` (forced colors remove shadows), and it is coloured `Highlight`.
- **Announcements:** none new. The live region of the copy button is unchanged.
- **Risk, `landmark-unique` (axe best practice):** two blocks with the same fallback name on one page (two `bash` blocks, or several fenced blocks in `lc-markdown`, which passes only `language`) produce duplicate landmark names. Mitigation: the JSDoc and story text tell consumers to set a unique `regionLabel`. Passing a name through `lc-markdown` is a possible follow-up, not this request.
- **Follow-up (not this request):** the copy button's focus ring is a `box-shadow` (40 % primary), which is invisible in forced colors. That belongs to the header, a non-goal here.

## 7. Texts

No new built-in string; the fallback is the consumer's filename or the language id.

| Key / input | EN (story) | DE (story) |
|---|---|---|
| `regionLabel` | Command for Claude Code | Befehl für Claude Code |
| `copyLabel` / `copyAriaLabel` | Copy / Copy command | Kopieren / Befehl kopieren |
| `copiedLabel` / `copiedAnnouncement` | Copied / Command copied | Kopiert / Befehl kopiert |

## 8. Stories

Add two constants to `code-block.stories.ts` (lengths checked in the browser):
- `LONG_COMMAND` (240 characters): `claude mcp add --transport http --scope user --client-id 3f9c2a7e-5b1d-4e8a-9c0f-2d6b8a1e7f43 --callback-port 33418 --header X-LifeCorner-Locale:de-DE lifecorner https://mcp.life-cockpit.de/v1/mcp/households/wohngemeinschaft-mueller-schmidt`
- `WRAP_COMMAND` (400 characters): `` `${LONG_COMMAND}/features/einkaufsliste,aufgaben,kalender,notizen,dokumente,kontakte,essensplanung,haushaltsbuch,geburtstage,erinnerungen,vertragsverwaltung,reinigungsplan,post` ``

| Story | Expected ID | Args | Shows |
|---|---|---|---|
| LongCommand | `data-display-code-block--long-command` | `code: LONG_COMMAND`, `language: 'bash'`, `filename: 'Terminal'`, `showLineNumbers: false`, `regionLabel: 'Command for Claude Code'` | The scroll region (EN); the life-os state B setup |
| LongCommandGerman | `data-display-code-block--long-command-german` | as LongCommand, plus `regionLabel: 'Befehl für Claude Code'` and the DE copy labels from §7 | The German name and labels |
| Wrapped | `data-display-code-block--wrapped` | `code: 'claude mcp list\n' + WRAP_COMMAND + '\nclaude mcp get lifecorner'`, `language: 'bash'`, `filename: 'Terminal'`, `showLineNumbers: true`, `wrap: true` | Wrapping, the number on the first row, no tab stop |

`argTypes`:
- `regionLabel`: `control: 'text'`, description from §2, `table.defaultValue.summary: 'filename, then language'`.
- `wrap`: `control: 'boolean'`, `table.defaultValue.summary: 'false'`.
- Give the four existing argTypes a `description` and a `table.defaultValue` too (convention; docs only).
- Each new story gets a one-line `docs.description.story`. LongCommand's says "Set a unique, localised `regionLabel`".

## 9. Verification

Review run: `story-shots.mjs --stories=<new ids> --widths=360,1024,1280 --themes=light,dark --measure=…`. axe is injected from the CDN in `--measure` (tested on 3.6.1): `(await new Promise((r, j) => document.head.append(Object.assign(document.createElement("script"), { src: "https://cdn.jsdelivr.net/npm/axe-core@4.10.2/axe.min.js", onload: r, onerror: j }))), await axe.run(document, { resultTypes: ["violations"] })).violations.map(v => [v.id, v.nodes.map(n => n.target.join(" "))])`.

| AC | How | Expected value |
|---|---|---|
| AC-1 | unit test | Body has `tabindex="0"` and `role="region"`; the next focusable element after `.code-block__copy` in DOM order is the body |
| AC-2 | unit tests (4) | `aria-label`: `filename` → "x.ts"; language only → "bash"; `regionLabel` set → it; `showHeader: false` → still set; `regionLabel: ''` → falls through |
| AC-3 | axe on long-command (EN) and long-command-german, 360 + 1280, light + dark | No `scrollable-region-focusable`. Remaining violations ⊆ the 3.6.1 page-level set {`landmark-one-main`, `page-has-heading-one`, `region` (header nodes only, no `.code-block__body`)} |
| AC-4 | measure, long-command at 360 | body `scrollWidth` 1780 > `clientWidth` 326; pre `overflow-x` = `visible`; after `body.focus()`: `activeElement === body`, `matches(':focus-visible')` true. Arrow-key scrolling is native for a focused scroller (story-shots cannot press keys) |
| AC-5 | measure + shots, long-command focused, 360 light + dark | `outline` 2px solid, offset −4px; colour rgb(32,132,151) / rgb(132,199,212) → 4.14 / 9.56 on #0c1722; all four sides visible in the shot (bottom corners r ≈ 9). forced-colors: SCSS spec assertion (outline, not box-shadow; `Highlight`) |
| AC-6 | measure, wrapped at 360 + 1024 | line 2 text length 400; body `scrollWidth ≤ clientWidth` (326/326, 990/990); first text rect top of line 2 = text top of its number (Δ ≤ 0.5 px); computed `white-space: pre-wrap`, `overflow-wrap: anywhere` |
| AC-7 | unit test | With `wrap`: no `tabindex`, `role` or `aria-label` on the body; the root has `code-block--wrap` |
| AC-8 | existing specs unchanged + `--compare=tmp/story-shots/004/baseline` (14 stories, 3 widths, 2 themes, `--full`) | Both spec files pass unedited; 84/84 identical |
| AC-9 | `check-angular-majors.mjs` on `tt/code/index.html` | Give `tt-code-ts` `regionLabel="Beispielcode"`. The body's opening tag has `tabindex="0"`, `role="region"`, `aria-label="Beispielcode"`; `tt-code-bash` has `aria-label="bash"` (attribute order free) |
| AC-10 | story file + `npm run test:tools` | 3 stories as in §8; the manifest lists `regionLabel` and `wrap` with their JSDoc and defaults |
| AC-11 | changelog | Names AS-21 and the life-os account-settings page (state B); "no API break". Mention the new tab stop and landmark per block, and the `regionLabel` advice |

Baseline: `tmp/story-shots/004/baseline` was taken on 93c42ec with the 14 stories that render `lc-code-block` (code-block ×7, markdown ×3, document-viewer ×3, timeline transcript): `--full`, 84 shots.

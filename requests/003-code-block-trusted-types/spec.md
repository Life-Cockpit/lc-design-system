# Spec 003: lc-code-block under Trusted Types

> **Change note (answer to ui-ux-designer):** (1) AC-4 allows exactly two exceptions to "same as 3.6.0": D1, SCSS shows the source text (`&`, not `&amp;`), because reproducing `&amp;` contradicts AC-5; D2, an empty line before a bash command line keeps its line height (as AC-6 requires). Any other difference still fails AC-4. (2) The comment contrast fix is in scope: AC-15 added; comment tokens use the existing `var(--lc-code-block-muted)`; the "no CSS change" assumption and AC-9 are adjusted. Patch stays correct (no API change, one colour moves to AA).

- **Status:** ready
- **Type:** bug fix (extension of `lc-code-block`, no new API)
- **Affected:** `libs/angular-ui-kit/src/lib/code-block/` (`.ts`, `.html`, `.spec.ts`, stories); `tools/compat/check-trusted-types.mjs` and the `/tt` page of `tools/compat/template/`; CHANGELOG
- **Semver impact:** patch. Inputs, selectors, CSS classes and the visible output stay the same; only the way the tokens reach the DOM changes. It makes a component work that was blocked under a CSP.

## Need

life-os (app shell, AS-20) uses `lc-code-block` under the CSP `require-trusted-types-for 'script'; trusted-types angular sw-registration lc-icon`. The component writes the highlighted lines through `[innerHTML]` with `DomSanitizer.bypassSecurityTrustHtml` (`code-block.component.ts:235`, `.html:25`). The browser refuses that write ("This document requires 'TrustedHTML' assignment"), so no code is shown, on Chromium and WebKit. The same code also pulls Angular's HTML sanitizer (about 8.4 kB) into the consumer's initial chunk, even when the block is only on a lazy route.

Second finding (same requester): axe reports `svg-img-alt` (serious) on the copy button. The button has an `aria-label`, but the `lc-icon` inside it renders `svg[role="img"]` with no name and no `aria-hidden`. life-os runs axe in EN and DE, light and dark, in every state (idle and "copied").

## What the kit has today

- `lc-icon` already works under Trusted Types (own policy `lc-icon`, builds SVG as elements; 3.5/3.6) and has `[decorative]` (default `false`), which sets `aria-hidden="true"` and removes `role` (`icon-dom.ts:64-79`). `code-block.component.html:13,16` does not use it.
- `lc-log-viewer`, `lc-markdown` and `lc-rich-text-editor` also use `[innerHTML]`; they are not part of this request (see non-goals).
- `tools/compat/check-trusted-types.mjs` already runs a Trusted Types CSP check over `/tt` pages in CI; `lc-code-block` is not on those pages yet.

## Scope

- In: render the highlighted tokens of `lc-code-block` as elements (`<span class="token-…">` with text nodes) in the template, without `innerHTML`, `DomSanitizer` or any `bypassSecurityTrust*`. Mark the copy button's two icons as decorative.
- Not in (non-goals):
  - Changing `lc-icon`'s default to "decorative inside a labelled control". That changes the output of every existing consumer and needs its own request; here the code block sets `[decorative]="true"` itself. Assumption below.
  - Other `[innerHTML]` users (`lc-log-viewer`, `lc-markdown`, `lc-rich-text-editor`): separate gaps if life-os needs them.
  - New languages, new token classes, new inputs, new colours.

## Acceptance criteria

| ID | Criterion (observable) | Verified by |
|---|---|---|
| AC-1 | `code-block.component.{ts,html}` contain no `innerHTML`, `DomSanitizer`, `SafeHtml` or `bypassSecurityTrust*`, and the folder imports nothing from `@angular/platform-browser` | unit test (source grep) or lint rule in spec; `grep` in review |
| AC-2 | Under the life-os CSP (`require-trusted-types-for 'script'; trusted-types angular sw-registration lc-icon`) a page with an `lc-code-block` renders its code, with zero Trusted Types violations and no console error, at 360 and 1280 px | `check-trusted-types.mjs`: add a `/tt` page with a code block (3 languages incl. `html`, an empty line, `showLineNumbers` on and off); Chromium |
| AC-3 | The same page also passes with `trusted-types angular` only (no `lc-icon`) for the code text itself; the icon fallback behaves as for other icons | check-trusted-types run 2 |
| AC-4 | For every language in `CodeBlockLanguage`, the rendered `.code-block__line-content` has the same text and the same sequence of `token-*` classes as before the change (golden samples captured from 3.6.0 for each language, incl. `html` with `<`, `>`, `&`, `"`). Allowed exceptions, each stated in the test: D1 (SCSS: source text instead of `&amp;`), D2 (empty line before a bash command line keeps its height) | unit test with golden samples; the existing spec stays unchanged |
| AC-5 | Source text is never interpreted as markup: `code="<img src=x onerror=alert(1)>"` and `&lt;b&gt;` render as visible text; no element other than `span` is created inside the code | unit test (DOM query, no `img` in `code`, text equals input) |
| AC-6 | An empty line still occupies one line height (as `&nbsp;` did): a code of `a\n\nb` has 3 lines of equal height | unit test + story measurement at 360 px (`--measure` of line heights) |
| AC-7 | `copyToClipboard` still copies the raw `code()` (not tokens, no entities); copy button, labels, `role="status"` announcement and 2 s reset unchanged | existing spec |
| AC-8 | Both copy-button icons render `svg[aria-hidden="true"]` without `role`, in idle and in "copied" state; axe reports no `svg-img-alt` and no other new violation | unit test (DOM); axe on the stories, EN and DE labels, light and dark |
| AC-9 | Selection, wrapping, horizontal scroll and the visible look are unchanged: story screenshots light and dark at 360, 1024 and 1280 px match the 3.6.0 baselines by hash, except the Python and Java shots (comment colour, AC-15) and any shot affected by D1/D2; each difference is explained in `build.md` | `story-shots.mjs --compare`; `forced-colors` checked once |
| AC-10 | Copying the text by selection from the rendered block, line numbers excluded, gives the same string as before (line numbers stay non-selectable as today) | story check, manual/DOM |
| AC-11 | Prerendered HTML (SSR) contains the token spans and the code text before JavaScript | `EXPECT_IN_HTML` in `check-angular-majors.mjs` (add a token string for the compat page) |
| AC-12 | Consumer build: a lazy route that uses only `lc-code-block` no longer includes Angular's HTML sanitizer in the initial chunk; report the size of the code-block chunk before/after | build/bundle measurement in `build.md`; compat run on Angular 21 and 22 |
| AC-13 | Performance does not regress visibly: a 2,000-line block renders and re-renders on a `code` change without a long task above 200 ms (note the measured value) | measurement in `build.md` |
| AC-14 | Defaults unchanged: no input added or changed; the MCP manifest for `lc-code-block` differs only if JSDoc changes; the existing spec file passes unmodified | `npx nx run angular-ui-kit:test`, `npm run test:tools` |
| AC-15 | Comment tokens (`token-comment`) use `var(--lc-code-block-muted)` and reach at least 4.5:1 against the code background in light and dark (measured 3.6.0: 2.99:1; target 7.02:1). No new colour, no new public hook | computed contrast in the story (`--measure`) or spec; Python and Java shots reviewed |

Not applicable: new text lengths (no new text; the copy labels already come from inputs, EN/DE are checked in AC-8).

## Constraints

- Peer range `^21.0.0 || ^22.0.0` unchanged, no new runtime dependency, no API break.
- The highlighting result (text and classes) stays equal to 3.6.0; this is a change of rendering, not of the tokenizer's behaviour. If working on raw text instead of escaped text changes any token, AC-4 decides: fix it to match.
- The tokenizer stays in the component (no highlighting library).

## Assumptions

- Assumption: the `lc-icon` default is not changed in this request; a decorative-by-default rule would alter `role`/`aria-hidden` for all consumers. If life-os still wants it, it becomes a separate request (it may be a minor with an opt-out, the owner decides if it counts as a break).
- Assumption: only Chromium is checked by `check-trusted-types.mjs`; WebKit behaves the same because no `innerHTML` or string-to-DOM API remains (AC-1).
- Assumption: the `html` rules, which match on escaped `&lt;`/`&gt;`, are rewritten to match raw `<` and `>`; the result must satisfy AC-4.
- Assumption: the only CSS change is the comment colour (AC-15); the existing `token-*`, `code-block__line*` classes stay.

## Open questions

None.

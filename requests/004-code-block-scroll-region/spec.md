# Spec 004: lc-code-block scroll region

- **Status:** ready
- **Type:** extension of `lc-code-block` (accessibility bug fix plus one opt-in input)
- **Affected:** `libs/angular-ui-kit/src/lib/code-block/` (`.ts`, `.html`, `.scss`, `.spec.ts`, `.stories.ts`), `CHANGELOG.md`
- **Semver impact:** minor. Two new optional inputs (`regionLabel`, `wrap`). The one visible default change is that the scroll body becomes a keyboard stop, which fixes WCAG 2.1.1 and is not an API break. The golden rendering test (3.6.0) compares lines only and stays valid.

## Need

life-os account-settings, state B, shows a long `claude mcp add …` command in `lc-code-block`. The line scrolls sideways inside `.code-block__body` (`overflow-x: auto`) on phones and on desktop. Nothing in the body can take focus, so a keyboard user cannot scroll it. axe reports `scrollable-region-focusable` (serious, WCAG 2.1.1) in EN/DE × light/dark. The consumer has no way to add `tabindex`, `role` or a name from outside (AS-21, `app-shell.md` §7.1).

## What the kit has today

- `.code-block__body` is a plain `div` with `overflow-x: auto`. `.code-block__pre` is a `pre`. There is no `tabindex`, `role` or `aria-label`, and no input for them.
- `headerLabel` (`filename || language`) already exists as a computed value. It is only shown in the header, and not at all when `showHeader` is `false`.
- Other label inputs (`copyLabel`, `copyAriaLabel`, …) set the pattern: English default, overridable.
- `white-space: pre` is set on `.code-block__line-content`. There is no wrap option.
- Nothing else in the kit solves this, so there is no Resolution.

## Scope

- In: a focusable, named scroll region on the body; an opt-in `wrap` input; a visible focus indicator; tests and stories.
- Not in (non-goals): changing the tokenizer, the header, line numbers or colours; a "scroll hint" shadow; auto-detecting overflow with JavaScript; wrapping by default.

## Acceptance criteria

| ID | Criterion (observable) | Verified by |
|---|---|---|
| AC-1 | With defaults, `.code-block__body` has `tabindex="0"` and `role="region"`, and `Tab` from the copy button lands on it. | unit test |
| AC-2 | New input `regionLabel` (string, JSDoc with `@default`) sets the accessible name (`aria-label`) of the region. Unset, the name is `filename`, otherwise the `language` label. It is also set when `showHeader` is `false`. | unit tests: filename, language only, `regionLabel` set, header hidden |
| AC-3 | axe on the long-command example (`language="bash"`, one line wider than the container) reports no `scrollable-region-focusable` and no new violation, at 360 and 1280 px, light and dark, with an English and a German `regionLabel`. | story + axe via `story-shots.mjs --measure` or a Jest axe check |
| AC-4 | The body scrolls with the arrow keys once focused (`scrollWidth > clientWidth` at 360 px for the long command; the focused region scrolls). | story at 360 px, measured |
| AC-5 | The focused body shows a `:focus-visible` indicator of at least 3:1 against the block surface `#0c1722` (computed) and at least 2 px wide. It is not clipped by `overflow: hidden` on `.code-block`. It is visible in `forced-colors`. | computed contrast + screenshot at 360 px, light and dark |
| AC-6 | New input `wrap` (boolean, default `false`). When `true`, line content uses `white-space: pre-wrap` with `overflow-wrap: anywhere`. The line-number column stays aligned on the first row of a wrapped line, and a 400-character command has `scrollWidth <= clientWidth` at 360 px. | story + measurement at 360, 1024 px |
| AC-7 | With `wrap` set, the body has no `tabindex` and no `role="region"`, because nothing scrolls. | unit test |
| AC-8 | Unchanged defaults: with `wrap` false, line layout, colours, header, copy button and the text of every line equal 3.6.1 (the rendering golden spec still passes unchanged). | existing `code-block.rendering.spec.ts` and `code-block.component.spec.ts` unchanged |
| AC-9 | Prerendered HTML contains `tabindex="0"`, `role="region"` and the `aria-label` before JavaScript runs. | `check-angular-majors.mjs` (add to `EXPECT_IN_HTML` if a code block is in the template) or an SSR render in the spec |
| AC-10 | Every new input has a story, `argTypes` description and `table.defaultValue`. The stories include the German name and a wrapped variant. The MCP manifest lists both inputs. | stories + `npm run test:tools` |
| AC-11 | The changelog entry names AS-21 and the life-os account-settings page, and states "no API break". | changelog review |

Not applicable: touch targets (the region is not a button); reduced motion (no animation).

## Constraints

- Peer range `^21.0.0 || ^22.0.0` unchanged, no new runtime dependency, no API break.
- Trusted Types fix of 3.6.1 stays intact: no `innerHTML`.
- The region name is plain text from an input and is never built from code content.

## Assumptions

- Assumption: the region is always focusable when `wrap` is false, even when the code is short. This avoids JavaScript measuring and works in prerendered HTML. The cost is one extra tab stop per block. Alternative for the designer: a CSS-only or `ResizeObserver` approach, only if it also holds before JavaScript.
- Assumption: the name fallback is `regionLabel`, then `filename`, then the language label, as the requester asked. For `language="text"` the name is "text". Consumers should set `regionLabel` for a meaningful, localised name, and the story documents this. There is no extra built-in English word, so there is nothing to translate by default.
- Assumption: `role="region"` with a name is wanted, as requested, although it adds a landmark for each block. life-os confirmed this wording in AS-21.
- Assumption: `wrap` is the opt-in alternative from the request and removes the tab stop (AC-7). It is not a replacement for the focusable default.
- Assumption: the focus ring can be drawn inside the body (inset `outline`/`box-shadow`) because `.code-block` clips overflow. The exact look is the designer's call.

## Open questions

None.

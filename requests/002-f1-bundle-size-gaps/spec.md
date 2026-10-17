# Spec 002: F1 bundle-size and link-cue gaps

- **Status:** ready
- **Change note 2026-10-17 (answer to design.md §10 Q1-Q3):** all three accepted. AC-1 target is now 7 kB gzip plus "no unregistered glyph in the initial JS" (the 136 SVGs measure 12.0 kB gzip, not 20; 20 kB was the whole `icon` entry). AC-2/AC-4: assertions unchanged, imports and setup may change. AC-11: read as design.md §6 (inert placeholder before load; landmark, `aria-current`, tab order as in 3.5.1 after load). The AC-1 baseline in "Need" and the matching assumption are corrected. Owner decision (from the requester, 2026-10-17): a second kit release for these gaps. Semver stays minor.
- **Type:** extension of `lc-icon` (AS-17) · extension of `lc-sidenav` (AS-18) · bug fix, WCAG 1.4.1 (AS-19)
- **Affected:** `lib/icon/` (`icon.component.ts`, `icon-inline-lookup.ts`, `icon-inline-svgs.ts`, `icon-inline-tabler.data.ts`, `index.ts`, stories, specs), `lib/sidenav/` (component, scss, stories, specs), `lib/button/button.component.scss` (`.btn-inline`, also used by `lc-button-link`), `button.styles.spec.ts`; every kit component that renders `lc-icon` internally (they must keep their icons); `tools/compat/` (bundle measurement); docs and CHANGELOG.
- **Semver impact:** minor, if the defaults of an app that opts into nothing keep rendering as before (AC-6, AC-12). If the designer finds that tree-shaking is impossible without changing that default, the request comes back here and goes to the owner as a possible major.

## Need

life-os F1 (plan B49, gaps AS-17/18/19 in `app-shell.md` §7.1) is a phone-first app with a 150 kB gzip initial-JS budget (ADR-0012). After kit 3.5.1 the initial JS is 186.9 kB gzip; Angular alone is ~388 kB raw. Two kit parts are the biggest contributors, and one accessibility defect blocks the sign-in pages:

- **AS-17:** `icon` is 81.4 kB raw. All 136 inline SVGs (12.0 kB gzip measured; the requester's figure of about 20 kB was the whole entry) are in the initial chunk, although the app uses about 25.
- **AS-18:** `sidenav` is 38.8 kB raw / about 9 kB gzip in the initial load, but it renders only from 1024 px.
- **AS-19:** axe `link-in-text-block` (serious) on the sign-in pages: `.btn-inline` links in running text are told apart from the text by colour only.

Requester's own wishes (per-icon registration or imports, lazy sidenav parts, an underline at rest) are proposals; the problems are the bundle weight and the missing non-colour cue.

## What the kit has today

| Area | State | Why it does not suffice |
|---|---|---|
| Icons | `icon.component.ts` imports `resolveInlineIconSvg`, which statically imports `INLINE_ICON_SVGS` (36 kB source) and `INLINE_TABLER_SVGS` (25 kB source). 3.5 added the Trusted Types policy (`icon-trusted-types.ts`) and the strict allow-list builder (`icon-svg-builder.ts`). Names outside the bundled sets are fetched from the Tabler assets. | Importing `IconComponent` (or any kit component that uses `lc-icon`) retains all data. `sideEffects` is already `["**/*.css","**/*.scss"]`, so the data is only retained because it is referenced. |
| Icon names | `@lifecorner/angular-ui-kit/icon-names` (`ICON_NAMES`, `isValidIconName`, aliases) is its own entry and is cheap. | Not the problem, but the name list must stay valid for unregistered names. |
| Sidenav | One component, `effectiveMode()` is `docked` or `drawer` (breakpoint input, default 1024 px), one template with both modes and the full item tree. It imports `NgTemplateOutlet`, `RouterLink`, CDK `A11yModule`, `lc-icon`, `lc-badge`, `lc-logo`. | No lazy part. A phone that never shows the docked shell still loads all of it. |
| Inline link | `.btn-inline` (`button.component.scss:226`) removes padding and inherits typography; it sets no `text-decoration`. | No non-colour cue at rest. |

Nothing existing solves these; no `Resolution`.

## Scope

- In: a way to bundle only the icons an app uses (AS-17); a lighter initial cost of the sidenav on phones (AS-18); an underline at rest for `.btn-inline` (AS-19); docs, stories, changelog usage notes for all three.
- Not in: new icons, changes to icon names or aliases, a new icon font or sprite, changes to the Trusted Types policy name or allow-list rules, restyling of other buttons, changes to the sidenav API that existing consumers use, a new runtime dependency.

## Acceptance criteria

| ID | Criterion (observable) | Verified by |
|---|---|---|
| AC-1 | An app that registers N icons and imports `IconComponent` ends up with only those N icons plus the icons the kit components it uses need internally. Measured in the compat consumer app (production build, gzip) with a 25-icon set: the initial JS is at least 7 kB gzip smaller than with 3.5.1 (the 136 glyph strings measure 12.0 kB gzip; the 25 used plus 22 internal ones about 4 kB), and no glyph that nobody registered (e.g. the `robot` path) is in the initial chunks. | Build of a measurement fixture in `tools/compat/` with and without registration; grep of the initial chunks; sizes in `build.md` |
| AC-2 | Registered names render synchronously and identically (same markup, `aria-hidden` / `aria-label`, size, variants outline/solid) as in 3.5.1, in browser and in prerendered HTML. | Existing `icon.component.spec.ts` assertions unchanged and green (imports and setup, such as registering the bundled icons or awaiting, may change); prerender check in `check-angular-majors.mjs` |
| AC-3 | Kit components that use `lc-icon` internally (e.g. chevrons, close, check) keep rendering their icons without the consumer registering them. The set the kit needs internally is listed in the docs. | Unit test per component that renders an internal icon; a test that fails when a kit template uses a name missing from the internal set |
| AC-4 | The Trusted Types policy (`lc-icon`), its allow-list and the "fail loud in prod, never fetch unknown names" guarantee (2.13.1) are unchanged. Registered markup passes through the same policy; no console text matching CSP or Trusted Types is logged on success. | `icon.trusted-types.spec.ts`, `icon.production.spec.ts`: assertions unchanged and green (imports and setup may change); a new case for registered icons |
| AC-5 | A name that is neither registered nor internal behaves as specified by the design and is documented (placeholder with a dev-mode warning, never an unknown fetch to an SPA fallback). It causes no layout shift: the box is the same size as the real icon. | Unit test; story at 360 px with measured box size |
| AC-6 | An app that does not opt in keeps its icons: every name that rendered in 3.5.1 still renders (same inline or fetched result). If keeping this needs the full set to load lazily, the prerendered HTML is unchanged and the browser shows the existing placeholder box without CLS (0.00). | Test over all `ICON_NAMES`; prerendered HTML diff; story measuring CLS |
| AC-7 | A docs page and a story show how to register icons, how to find the list of icons a page needs, and what happens with an unregistered name. Each new input, provider or helper has JSDoc with `@default` and an argType description. | Storybook build; MCP manifest (`npm run test:tools`) lists the new API |
| AC-8 | Sidenav: on a phone (viewport under the sidenav breakpoint, here 360 px) the parts that only the docked desktop shell needs are not in the initial JS. Measured reduction of the initial JS for an app that shows the sidenav only from 1024 px: at least 6 kB gzip (3.5.1 baseline about 9 kB gzip). | Compat fixture build with a lazy sidenav, sizes in `build.md` |
| AC-9 | Sidenav, no layout shift: at 1024, 1280 and 1920 px the docked shell occupies the same width and height in the prerendered HTML as after hydration and after the lazy part has loaded. CLS is 0.00 and the main content does not move. In collapsed and expanded state. | `story-shots.mjs --measure` of the bounding boxes before / after load; prerendered HTML width |
| AC-10 | Sidenav behaviour is unchanged for existing users: all inputs, outputs, `lc-sidenav-container--docked`, current-item handling (3.5), drawer mode below the breakpoint, Escape to close and focus handling work as before. Existing sidenav specs pass without changed assertions. | `sidenav.*.spec.ts` |
| AC-11 | Sidenav keyboard and screen reader (reading of design.md §6): the placeholder is inert (`aria-hidden`, `inert`), has no landmark, no tab stop and is not announced; after the lazy part loads, the landmark, the current item (`aria-current`) and the tab order are those of 3.5.1. Focus cannot be inside the placeholder, so it is not lost on the swap. German item labels (long strings) wrap or truncate exactly as before at 1024 px. | Unit test, story at 1024 px in EN and DE |
| AC-12 | Defaults unchanged: no input is removed or renamed, new API is optional, peer range stays `^21.0.0 \|\| ^22.0.0`, no new runtime dependency. `check-angular-majors.mjs` is green on Angular 21 and 22 (AOT, strictTemplates, prerender), with `EXPECT_IN_HTML` extended for the new behaviour. | Compat matrix |
| AC-13 | `.btn-inline` (button and `lc-button-link` with `inline`) has a visible non-colour cue at rest: `text-decoration: underline` (or an equivalent at least 1 px line) that stays on hover and focus. Hover may change the thickness or offset, not remove the line. | Style spec on the rule; story in running text; axe `link-in-text-block` reports no violation |
| AC-14 | AS-19, themes and modes: in light and dark the cue is visible against the surrounding text. In `forced-colors` the underline stays. With `prefers-reduced-motion` no new motion. Colour contrast of the link text is not lower than before (4.5:1, computed). | `theme-contrast.spec.ts` unchanged; story in both themes; forced-colors screenshot |
| AC-15 | AS-19, layout: the underline does not change line height or wrapping in a paragraph at 360 px (EN and DE, link text that wraps over two lines) and the 44 px target rule for a standalone use is unchanged. There is a documented CSS hook (`--lc-btn-inline-text-decoration`) so a non-text use (for example a linked counter in a table) can switch the line off; the default is `underline`. | Story at 360 px with `--measure` of paragraph height before / after; hook default documented |
| AC-16 | The changelog states, per gap, the measured sizes, the usage (install line, snippet to register icons, the sidenav pattern), the visible change of `.btn-inline`, and that there is no API break. | Review of `CHANGELOG.md` |

Always covered unless not applicable: 360 px and desktop widths · light and dark · keyboard and screen reader · EN and DE lengths · prerendered HTML before JavaScript · unchanged defaults. AC-8 to AC-11 cover them for the sidenav, AC-13 to AC-15 for the link, AC-2/AC-6 for icons.

## Constraints

- Peer range `^21.0.0 || ^22.0.0` unchanged, no new runtime dependency, no API break.
- Secondary entries (since 3.5): any new folder needs a `ng-package.json` stub, an `index.ts` and a line in `src/index.ts`; imports across folders use the package path.
- Bundle sizes are measured in a real production build of a consumer fixture, not estimated from file sizes.

## Assumptions

- Assumption: life-os shows no sidenav drawer on a phone (it has its own phone navigation); the drawer mode of `lc-sidenav` must still work for other consumers, but AC-8 only measures the case "sidenav shown from 1024 px". The designer may load drawer-only parts lazily too, if it passes AC-10.
- Assumption: the targets in AC-1 and AC-8 (7 kB and 6 kB gzip) are lower than the requester's figures (20 and 9 kB) on purpose: the glyph data is 12.0 kB gzip (measured), and some bytes remain (internal icons, a placeholder shell). Together they do not reach the whole 37 kB gap (186.9 to 150 kB); life-os closes the rest and says so in its plan.
- Assumption: the full-set default is the hard part. A DI default that references the full icon data keeps it in every bundle, so tree-shaking and "every 3.5.1 name still renders without registration" cannot both be met with a static reference. The designer must choose between (a) a lazy chunk for unregistered names (AC-6 wording), (b) a separate opt-in entry for the slim mode, or (c) a break. Only (c) goes to the owner.
- Assumption: `ICON_NAMES` stays the list of valid names; validity and registration are different things.
- Assumption: the `.btn-inline` underline is a visible default change, but it is the fix of a WCAG 1.4.1 failure and is treated as a bug fix (minor release with the other two). The hook in AC-15 is the opt-out.
- Assumption: life-os adopts by raising its kit pin and calling the new registration in `app.config`; it does not need any kit API name beyond what the designer publishes (life-os writes tests against the names, so the changelog must give them exactly).

## Open questions

None for the owner now. If the designer cannot meet AC-1 and AC-6 together (see the third assumption), they hand back to the spec-writer with the finding; then the options (recommended first) are: 1. lazy chunk for non-registered names, minor; 2. slim mode as an opt-in entry, minor; 3. remove the full default set, major.

## Resolution

Not applicable.

# Design 002: F1 bundle-size and link-cue gaps

- **Status:** ready, if the spec-writer accepts the proposals in §10 Q1–Q3 (the AC-1 target and the AC-2/4 and AC-11 wording). The design doesn't change if they do.
- **Spec:** [spec.md](spec.md), AC-1 … AC-16

## 1. Approach

| Gap | Decision | Follows |
|---|---|---|
| AS-17 | Extend `lc-icon`. The glyph markup moves out of the `icon` entry. A new entry `icons` exports one constant per glyph. Apps, routes and kit components register the glyphs they render through DI (`provideLcIcons`, which is hierarchical). A 3.5.1 inline name that nobody registered falls back to the whole 3.5.1 set, loaded once as a lazy chunk (`internal/icon-set`). That is spec option 1 (minor): an app that opts into nothing still renders every name. | DI config (`provideHttpClient`, `LC_LOGO_BASE_PATH`); the 3.5 entries; the 3.5 policy and allow-list builder |
| AS-18 | New `lc-sidenav-placeholder` in its own entry: an inert skeleton of the docked rail, with the same boxes as `lc-sidenav`, for an app-side `@defer (on viewport)`. Below 1024 px the app shell hides the nav column, so on a phone the trigger never fires and the sidenav chunk never loads. `lc-sidenav` stays as it is. | 3.5 busy-page skeletons; the app shell's fixed 1024 px breakpoint |
| AS-19 | `.btn.btn-inline` gets an underline at rest through `--lc-btn-inline-text-decoration` (default `underline`). Hover makes the line thicker. | the existing `--lc-button-link-*` hooks |

**Rejected:**
- `@defer (hydrate …)`: life-os runs `withNoIncrementalHydration()` because the CSP blocks its inline script, and Angular 21 would need an opt-in.
- A "real links" shell before the sidenav loads: it duplicates the item tree, the current-item logic and the styles, and costs about the bytes AC-8 removes.
- A DI default that references the full icon set: that keeps the set in every bundle (spec assumption 3).

## 2. Public API

**`@lifecorner/angular-ui-kit/icon` (extended)**

| Kind | Name | Type | Default | Description (JSDoc) |
|---|---|---|---|---|
| function | `provideLcIcons(icons, options?)` | `(icons: readonly LcIconDefinition[], options?: LcIconOptions) => Provider[]` | — | Registers kit glyphs for every `lc-icon` below this injector: `app.config`, a route's `providers` or a component's `providers`. Registered glyphs render synchronously, in prerendered HTML too, and only they (plus the kit's internal ones) are bundled. Glyphs add up along the injector tree; for `unregistered`, the nearest call that sets it wins. |
| type | `LcIconDefinition` | `{ readonly name: string; readonly variant: IconVariant; readonly svg: string }` | — | One glyph shipped by the kit. Import the constants from `@lifecorner/angular-ui-kit/icons`; markup you write yourself is not supported. |
| type | `LcIconOptions` | `{ unregistered?: LcIconFallback }` | — | App-wide options; set them once, in `app.config`. |
| option | `unregistered` | `LcIconFallback` | `'load'` | What a kit glyph does that nobody registered: `'load'` loads the kit's whole set once, as a lazy chunk, and renders it (3.5.1 output, a moment later in a client-only render); `'placeholder'` shows the placeholder and warns, so the set never loads. |
| type | `LcIconFallback` | `'load' \| 'placeholder'` | — | See `unregistered`. |
| input (JSDoc only) | `strict` | `boolean` | `false` | Adds: with `unregistered: 'placeholder'`, a kit glyph that is not registered also throws in development. |
| unchanged | `isInlineIconName`, `ICON_ALIASES`, `IconName`, every `lc-icon` input | | | `isInlineIconName` returns the same results; its doc says "registered or loaded with the kit's set". |

**`@lifecorner/angular-ui-kit/icons` (new entry, plain object literals, tree-shakable per constant)**

| Kind | Name | Type | Description |
|---|---|---|---|
| const ×73 | `ICON_<NAME>` | `LcIconDefinition` | The outline glyph. Name: upper snake case of the 3.5.1 key (`ICON_X_MARK`, `ICON_BARS_3`, `ICON_MENU_2`, `ICON_CHECK_CIRCLE`). |
| const ×60 | `ICON_<NAME>_SOLID` | `LcIconDefinition` | The solid glyph, where 3.5.1 had one. |
| const | `BUNDLED_ICONS` | `readonly LcIconDefinition[]` | All 133 glyphs. `provideLcIcons(BUNDLED_ICONS)` restores 3.5.1's synchronous rendering, e.g. in tests. |

**`@lifecorner/angular-ui-kit/sidenav-placeholder` (new): `lc-sidenav-placeholder` / `SidenavPlaceholderComponent`**

| Kind | Name | Type | Default | Description |
|---|---|---|---|---|
| input | `items` | `NavigationItem[]` | `[]` | Same value as on `lc-sidenav`: it gives the number of rows, sections and expanded groups. |
| input | `activeRoute` | `string` | `''` | Same as `lc-sidenav`. It decides which group starts expanded (when empty, the router URL does, as in 3.5). |
| input | `collapsed` | `boolean` | `false` | The 56 px rail. One-way (it's a `model` on `lc-sidenav`). |
| input | `isOpen` | `boolean` | `false` | As `lc-sidenav`: a closed docked rail is 0 px wide. |
| input | `width` | `string` | `'320px'` | As `lc-sidenav`. |
| input | `variant` / `theme` / `position` | `SidenavVariant` / `'light'\|'dark'\|'auto'` / `SidenavPosition` | `'default'` / `'auto'` / `'left'` | As `lc-sidenav`. |
| input | `showLogo` / `logoSize` | `boolean` / `'xs'…'xl'` | `false` / `'md'` | Reserves the logo block. |
| CSS hook | `--lc-sidenav-placeholder-fill` | colour | `color-mix(in srgb, var(--lc-sidenav-fg) 16%, transparent)` | Fill of the skeleton shapes. The `--lc-sidenav-*` hooks apply as on `lc-sidenav` (set them on an ancestor of both). |

**`lc-button` / `a[lcButton]`:** a CSS hook `--lc-btn-inline-text-decoration`, a `text-decoration` value, default `underline`. Set it to `none` for a non-text use such as a linked counter in a table cell. Hover then underlines as in 3.5.1.

**Internal entries (not in `src/index.ts`):** `internal/icon-set` holds a copy of the 3.5.1 maps, written by `scripts/generate-icon-names.mjs` next to the `icons` constants. It must **not** import `icons`: a file that both the initial and the lazy graph reach goes into a shared, eagerly loaded chunk. `internal/navigation` holds the 3.5 current-item function, moved out of the sidenav unchanged and used by both components. Kit components register their glyphs through an exported but undocumented `ɵprovideKitIcons()`, which sets no mode and no "the app registers" flag.

**Defaults are unchanged:**
- With no `provideLcIcons` call, every name renders the 3.5.1 markup or fetch result.
- Prerendered HTML is identical, because the server waits through `PendingTasks`.
- No input is renamed, the peer range stays and no new dependency is added.
- The only visible default change is the AS-19 underline (a bug fix; the hook is the opt-out).

## 3. Anatomy and layout

**Icons.** The box doesn't change: 16/20/24/32/40 px, with width and height set inline before any glyph is there. The placeholder and the "pending" state use the same box, so there is no shift. Resolution order:
1. Name check, as in 3.5.1 (the list in dev, the form in prod).
2. A registered glyph, searched from the nearest scope up to the root: by the name as written, then by its alias target. Rendered synchronously.
3. A 3.5.1 inline name or alias target for that variant (a key index without markup, about 0.4 kB gzip): `'load'` → *pending* (the container is left untouched, so it keeps a prerendered `<svg>` on hydration), then `import('@lifecorner/angular-ui-kit/internal/icon-set')` once per page under `PendingTasks`, then the 3.5.1 markup. `'placeholder'` → placeholder plus a warning.
4. Anything else is fetched exactly as in 3.5.1. A failed chunk import shows the placeholder, warns once and is retried by the next icon.

**Sidenav placeholder.** It builds the docked DOM skeleton with **the same classes and element types as `lc-sidenav`**: `div.lc-sidenav.lc-sidenav--docked…`, then `div.lc-sidenav__nav--docked`, then rows `div.lc-sidenav__nav-item-row > div.lc-sidenav__nav-item`. Sections use `h2.lc-sidenav__section-title` and `ul/li`; the logo block and `div.lc-sidenav__content--docked` are there too. The host gets `lc-sidenav-container lc-sidenav-container--docked`. Its geometry comes from a shared partial, `lib/sidenav/_sidenav-docked.scss` (box rules only: container, docked/collapsed/transparent/theme/position, logo sizes, nav, section, item box, icon, children, label, content). `lc-sidenav` `@use`s that partial at the same point of its cascade, so its compiled CSS stays the same. Badges, action buttons and chevrons aren't drawn, because they don't change any box height (labels are `nowrap` with an ellipsis).

```
360 px: app shell, the nav column is display:none → placeholder hidden, viewport trigger never fires, no sidenav JS
┌ 360 ───────────────────────────┐
│ header · page · floating bottom nav (unchanged)  │
└──────────────────────────────────────────────────┘

1024 / 1280 px: app shell, column 240 (248 from 1440, 280 from 1920), variant="transparent", width="100%"
x0                       240
┌─────────────────────────┐ ← sticky column, no background or border
│ 48 nav padding top      │
│  ┌───────────────────┐  │ pill x 24, 192×48, radius 9999
│  │ ▢ 20  ▬▬▬▬▬▬ 10h  │  │ icon x 40 (20×20, r 4); bar from x 72, width cycles 64/48/72/56 %
│  └───────────────────┘  │
│  4 gap                  │
│  ┌───────────────────┐  │
│  │ ▢     ▬▬▬▬        │  │
│  └───────────────────┘  │
│ 24 padding + 32 content │
└─────────────────────────┘   at 1920: pills 232 wide

Default docked variant (width 320): nav padding 16/8, rows 303×44 r 12, gap 0, icon x 18
Collapsed: rail 56, nav padding 8, rows 39×44, gap 2, icon 22×22 centred on 28, no labels or content
```

| Skeleton shape | Size | Shape | Fill |
|---|---|---|---|
| icon | the `.lc-sidenav__nav-icon` box (20, or 22 collapsed) | radius `--border-radius-sm` (4 px) | `--lc-sidenav-placeholder-fill` |
| label | 10 px high, inside `.lc-sidenav__nav-label` | radius `--border-radius-full` | same |
| section title | 8 × 64 px on the 28 px line | full | same |
| logo | 28 px × 50 % (collapsed: 32 × 32) in the logo block | `--border-radius-md` | same |

**App-side pattern (documented):** `<div shell-nav> @defer (on viewport) { <lc-sidenav …/> } @placeholder { <lc-sidenav-placeholder …same bindings…/> } </div>`. Import `SidenavComponent` only from `@lifecorner/angular-ui-kit/sidenav`, list it in `imports` and use it only inside the block; otherwise Angular loads it eagerly. The placeholder imports the sidenav **types only** (`import type`). Outside the app shell, hide the placeholder's container below your breakpoint, or the trigger fires on phones as well (that is correct, but saves nothing).

**Inline link (360 px):** the line sits `0.15em` below the baseline, `max(1px, 0.0625em)` thick (1 px at 14 and 16 px). Text decoration takes no layout space, so line boxes and wrapping stay the same.

## 4. States

| Part | default | hover | focus-visible | active / disabled | loading / pending | empty / error | overflow |
|---|---|---|---|---|---|---|---|
| `lc-icon` registered | synchronous, as 3.5.1 | — | — | — | — | — | — |
| `lc-icon` unregistered, `'load'` | 3.5.1 markup after the chunk | — | — | — | box kept, server `<svg>` kept | chunk failed → placeholder + 1 warning | — |
| `lc-icon` unregistered, `'placeholder'` | dashed "?" placeholder + 1 warning (dev and prod); `strict` throws in dev | — | — | — | — | — | — |
| sidenav placeholder | skeleton rail | none (inert) | none, nothing is focusable | — | it *is* the loading state; static, no shimmer | `items=[]` → rail without nav; `isOpen=false` → 0 px | many items: scrolls like the rail, but `inert` keeps the scroll box out of the tab order; long DE labels: no text, rows are fixed 44/48 px |
| `.btn-inline` | underline 1 px, `currentColor` | thickness `max(2px, 0.125em)`, no transition | 3.5 focus ring plus the underline | colour as 3.5.1; disabled dims to 0.5 and keeps the line | `lc-button` loading as before | — | wraps with the line on each fragment |

## 5. Theming (contrast computed with the WCAG formula in the browser, story-shots `--measure`, light / dark)

| Element | Light | Dark | Contrast |
|---|---|---|---|
| Inline link text and underline (`currentColor` = `--lc-button-link-fg` → `--color-primary-600`) | rgb(26,106,121) on #fff | rgb(163,213,223) on rgb(10,18,27) | 6.21:1 / 11.78:1, the same as 3.5.1. The underline is ≥ 3:1 as a non-text cue. |
| Link vs surrounding text (why the cue is needed) | vs rgb(17,24,39) | vs rgb(241,246,248) | 2.86:1 / 1.47:1, below 3:1, so colour alone fails 1.4.1 |
| Skeleton fill (16 % of `--lc-sidenav-fg`) | rgb(221,224,227) on rail rgb(249,250,251) | rgb(37,45,52) on rgb(7,14,21) | 1.27:1 / 1.39:1 (transparent rail: 1.27 / 1.42). Decorative and hidden, so 1.4.11 doesn't apply. |

No new tokens. Two new hooks (§2). In `forced-colors` the skeleton shapes get `forced-color-adjust: none; background: GrayText`.

## 6. Accessibility

- **Icons:** semantics unchanged (`role="img"`/`aria-label` or `aria-hidden`); the placeholder keeps the accessible name, as in 3.5.1.
- **Sidenav placeholder:** the root has `aria-hidden="true"` and `inert`. It has no landmark (`div`s only; the section `h2`s are hidden with the root), no tab stop and nothing announced. Focus can't be inside it, so the swap can't lose focus. After the load, the landmark, `aria-current` and tab order are 3.5.1's `lc-sidenav`. No live announcement: the content appears in place. No motion; reduced motion has nothing to stop.
- **Inline link:** the underline is the non-colour cue (1.4.1). It stays on hover and focus and in `forced-colors` (decorations survive; the colour becomes LinkText or ButtonText). The thickness change has no transition (`transition-property: color, background-color, border-color, box-shadow` on `.btn.btn-inline`). The 44 px rule for standalone use is unchanged.

## 7. Texts

No new user-visible strings. Console messages, developer-facing, English only like the existing `lc-icon` warnings, once per name:
- Unregistered glyph: `[lc-icon] "home" is not registered. Add ICON_HOME from @lifecorner/angular-ui-kit/icons to provideLcIcons(). ` followed by `Loading the kit's icon set instead.` (`'load'`, dev only, and only when the app registers glyphs) or `Rendering a placeholder instead.` (`'placeholder'`, dev and prod).
- Failed chunk: `[lc-icon] The kit's icon set could not be loaded (<reason>). Rendering a placeholder instead.`

## 8. Stories

| Story | Expected ID | Args / setup | Shows |
|---|---|---|---|
| Registered icons | `components-icon--registered-icons` | `applicationConfig`: `provideLcIcons([ICON_HOME, ICON_HOME_SOLID, ICON_MAIL, ICON_CHECK_CIRCLE, ICON_CHECK_CIRCLE_SOLID])` | synchronous render, sizes xs–xl, both variants; docs snippet |
| Unregistered name | `components-icon--unregistered-name` | `provideLcIcons([ICON_HOME], { unregistered: 'placeholder' })`; `home`, `sun`, `anchor` at md | registered vs placeholder vs fetched, all 24×24 (AC-5) |
| Icon constants | `components-icon--icon-constants` | `provideLcIcons(BUNDLED_ICONS)` | glyph, constant name and variant for all 133: "which constant do I need" |
| Next to the sidenav | `navigation-sidenav-placeholder--next-to-the-sidenav` | `variant`, `collapsed`, `theme`, `showLogo` controls; the placeholder left, `lc-sidenav mode="docked" [isOpen]="true"` right, same args, 5 items | box equality (AC-9) |
| Transparent | `navigation-sidenav-placeholder--transparent` | `variant: 'transparent'`, `width: '100%'` in a 240 px column | the app-shell look |
| Collapsed | `navigation-sidenav-placeholder--collapsed` | `collapsed: true`, side by side | the 56 px rail |
| Sections, groups and logo | `navigation-sidenav-placeholder--sections-groups-and-logo` | `showLogo`, sections, `activeRoute` inside a group | the expanded group, the logo block |
| Lazy side navigation | `layout-app-shell--lazy-side-navigation` | like Today desktop; `@defer (on timer(1500ms))` stands in for `on viewport`, so both states can be measured | swap without shift, EN |
| … German | `layout-app-shell--lazy-side-navigation-german` | the same, DE labels (`Haushaltsübersicht`, `Benachrichtigungseinstellungen`) | truncation at 1024 (AC-11) |
| Inline link wrapping | `components-button-link--inline-link-wrapping` | max-width 312; EN and DE paragraphs whose link wraps; each twice, default and `--lc-btn-inline-text-decoration: none` | equal paragraph heights (AC-15) |
| Inline without underline | `components-button--inline-without-underline` | linked counters in a table cell with the hook set to `none` | the opt-out, with a note: only outside running text |
| Changed on purpose | `components-button--inline-link`, `components-button-link--inline-in-text` | unchanged | now underlined |

Docs page `src/docs/bundle-size.mdx`, `<Meta title="Bundle Size" />` → `bundle-size--docs`. It covers: register (`app.config`, a route, a component), finding the glyphs a page needs (the warnings, `'placeholder'` + `strict` in dev or tests, the constants story, a test recipe that spies on `console.warn`), what an unregistered name does, the kit-internal glyphs per component (table), and the lazy sidenav pattern and its pitfalls.

## 9. Verification

| AC | How | Expected |
|---|---|---|
| AC-1 | `tools/compat` fixture, production build, gzip of the initial chunks: 3.5.1 vs 25 registered + `'placeholder'`; grep the initial chunks for a glyph nobody registered (e.g. the `robot` path) | Measured now: all 136 strings are 58.7 kB raw / **12.0 kB gzip**; 25 outline glyphs 2.65 kB; those 25 plus 22 internal 3.96 kB. Expected cut about 8 kB gzip (target: §10 Q1). Robot path absent. |
| AC-2 | `icon.component.spec.ts`: assertions unchanged; synchronous cases register `BUNDLED_ICONS` in setup; prerender: registered glyph in `EXPECT_IN_HTML` | green; same markup |
| AC-3 | Per component: renders its internal glyphs with no app registration, synchronously, no request. `kit-icons.spec.ts` scans the kit templates and name maps: every 3.5.1-inline literal is in that component's `ɵprovideKitIcons` | 26 glyphs (x-mark, check-circle, circle-x, exclamation-triangle, information-circle, exclamation-circle, alert-triangle, x, check, plus, star + solid, chevron-left/right/down, bars-3, user, sun, moon, eye, eye-slash, calendar, file, file-text, external-link, trash); docs table matches |
| AC-4 | TT and prod specs: assertions unchanged. New: a registered glyph passes through `createHTML`; a non-kit string registered as a definition fails the builder, shows the placeholder, and `createHTML` throws | green; no CSP or Trusted Types text in the console on success |
| AC-5 | Unit test (`'placeholder'`): placeholder, 1 warning, no HTTP, no chunk import, `strict` throws in dev; story `unregistered-name` at 360 | three boxes 24×24 |
| AC-6 | Over all `ICON_NAMES` in `'load'`: after the set loads, inline markup or fetch path equals the 3.5.1 algorithm; compat prerendered HTML diff; `components-icon--inline-set` hash vs baseline; CLS via `PerformanceObserver('layout-shift')` | identical; CLS 0.00 |
| AC-7 | Storybook build; `npm run test:tools` | `bundle-size--docs` and the stories above; manifest lists `lc-sidenav-placeholder` with JSDoc `@default` |
| AC-8 | Compat fixture: the app shell with the `@defer` pattern vs 3.5.1, gzip of the initial chunks | ≥ 6 kB less (estimate about 8: sidenav chunk out, placeholder ≈ 1–1.5 in) |
| AC-9 | Lazy story at 1024/1280/1920 (1440 too): placeholder rect at t0 vs `lc-sidenav` at 2 s; `<main>` x/y; CLS observer. Next-to story, expanded and collapsed. Compat HTML contains the placeholder | width/height equal ±0.5 px; main unmoved; CLS 0.00 |
| AC-10 | `sidenav.*.spec.ts` unchanged; all 18 sidenav stories by hash vs baseline | green; identical |
| AC-11 | Unit test: root `aria-hidden="true"` + `inert`, 0 focusable descendants, 0 landmarks; tab stops and landmarks outside the nav equal before and after; DE story at 1024 | as stated; labels end with an ellipsis as in the baseline |
| AC-12 | Compat matrix 21 + 22; `EXPECT_IN_HTML` += a registered glyph, the `lc-sidenav-placeholder` rail with `inert`, `btn-inline` | green |
| AC-13 | `button.styles.spec.ts`: a `.btn.btn-inline` rule with `text-decoration: var(--lc-btn-inline-text-decoration, underline)`, a ≥ 1 px thickness and the hover thickness; no rule removes it. Story measure: `text-decoration-line` underline on the link, none on the paragraph (the axe `link-in-text-block` condition; life-os re-runs axe) | as stated |
| AC-14 | Both themes (§5); `theme-contrast.spec.ts` unchanged; forced-colors: the style-spec check (story-shots has no forced-colors emulation; use a screenshot if the developer adds one) | 6.21 / 11.78 unchanged |
| AC-15 | `inline-link-wrapping` at 360, EN and DE: heights default vs `none`; hook default in docs and argTypes | equal heights |
| AC-16 | Changelog review: exact names (`provideLcIcons`, `LcIconDefinition`, `LcIconOptions`, `LcIconFallback`, `ICON_*`, `BUNDLED_ICONS`, `lc-sidenav-placeholder`, `--lc-btn-inline-text-decoration`), the measured sizes, a Migration note (tests that assert an unregistered inline glyph right after `detectChanges()`: await `whenStable()` or register `BUNDLED_ICONS`) | — |

**Baselines:** `tmp/story-shots/002/baseline/`: 66 stories × 360/1024/1280 × light/dark, taken with a 700 ms wait, on `main` at 079fae5. That covers icon (not All Icons), sidenav, app shell, header, bottom nav, button icon stories, and components with internal glyphs. Compare with the same wait.

## 10. Spec questions, assumptions and risks

1. **AC-1 target.** The premise "136 SVGs ≈ 20 kB gzip" doesn't hold: the 136 strings are 12.0 kB gzip (measured above); about 20 kB is the whole `icon` entry including code. Even removing every glyph can't cut 15 kB. Proposal: "≥ 7 kB gzip smaller, and no glyph that nobody registered in the initial JS".
2. **AC-2 / AC-4 "unchanged".** The data files leave `lib/icon/`, so the specs' imports must change. Tests that render inline names synchronously need `BUNDLED_ICONS` registered or an await. Proposal: "assertions unchanged; imports and setup may change".
3. **AC-11.** An inert placeholder can't carry the landmark, `aria-current` or the tab order before the load. Proposal: the reading in §6.
4. **Assumption:** in `'load'` mode a client-only render shows an unregistered 3.5.1 glyph a moment later (an empty box of the same size). AC-6 allows this; the changelog says so.
5. **Risks:**
   - esbuild shared chunks: `internal/icon-set` must not import `icons`.
   - The `@defer` dependency must come from the secondary entry, or the whole primary entry loads.
   - `@defer` in JIT Storybook: if unsupported, the story emulates the swap with `@if` and a timer.
   - The shared SCSS partial must keep `lc-sidenav`'s cascade order; the baseline hashes prove it.

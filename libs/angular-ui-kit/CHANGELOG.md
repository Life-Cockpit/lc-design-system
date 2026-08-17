# Changelog

All notable changes to this project will be documented in this file.

## [2.21.1] - 2026-08-17

### Fixed

- **Sidenav: the collapsed rail's count badge sits on its icon again**
  (`lc-sidenav`) — three defects stacked into one badge that read as a sticker
  floating beside the item rather than a count on the glyph:
  - It was anchored to the item's top-right corner and pushed a further
    `translate(4px, -4px)` outward, so with its ring it ended up ~6px above and
    ~8px right of the 40×42 item — inside the 8px rail gutter, detached from
    the icon. It is now tucked at `top: 4px; right: 4px`, fully inside the item
    box and overlapping the glyph's top-right corner.
  - The ring and backdrop rendered as an oval sitting low behind a round
    badge: the `lc-badge` host is a block box around an `inline-flex` child and
    picked up the line box's descender space. The host is `display: flex` now
    and hugs the badge exactly.
  - The variant's own 1px hairline read as a second outline on top of the
    rail-colored ring, and its 1px per axis inflated the single-digit bubble to
    18×18. The border is off in the collapsed rail (the ring alone separates
    badge from glyph) and the padding is 3px, so one- and two-digit counts stay
    circular.
  Badge colors are unchanged — the rail still renders whatever
  `NavigationItem.badge.variant` asks for. Expanded sidenavs are untouched:
  every change is scoped to `.lc-sidenav--collapsed`.

## [2.21.0] - 2026-08-16

Completes 2.20.0's hamburger alignment: that release aligned the toggle per
state, which meant the toggle (and the header content beside it) shifted 10px
whenever the sidenav opened or closed. The shift is gone — because its cause,
a moving icon column in the sidenav itself, is fixed.

### Fixed

- **Sidenav: the icon column no longer moves when toggling** (`lc-sidenav`) —
  expanded and collapsed used different horizontal gutters (16px nav + 12px
  item padding vs. 8px + 10px), so the nav icons sat at 38px expanded but at
  28px on the collapsed rail and jumped 10px sideways on every toggle. Both
  states now share one gutter and the icons stay at 28px throughout. The
  expanded nav's gutter is the visible change: items sit 8px from the sidebar
  edge instead of 16px (section headlines keep their existing alignment with
  the item labels). Vertical padding, the rail width and the expanded width
  are unchanged.
- **Header: the hamburger no longer shifts with the sidenav** (`lc-header`) —
  with one fixed icon column to align to, `--lc-header-hamburger-slot` is
  a constant again (56px → icon at 28px, correct in both states). Apps that
  bound the var to their collapse state per 2.20.0 should drop that binding;
  the slot's width transition is gone with it.
- **Header: the hamburger and the brand read as one group again**
  (`lc-header`) — the toggle used to sit in a rail-wide (56px) box that
  centered a 24px glyph, so 16px of dead box separated it from the logo and
  the row's flex gap landed on top of that: 32px of clear space beside the
  brand's own 12px, which read as a hole rather than a group. The box is now
  the glyph, and the alignment is done by a negative left margin instead — the
  glyph's center still lands on the sidenav icon column. The distance to the
  brand is a single explicit value, `--lc-header-hamburger-gap` (default 8px).

### Added

- **Sidenav: icon-column geometry hooks** (`lc-sidenav`) —
  `--lc-sidenav-rail-width` (56px), `--lc-sidenav-nav-padding-x` (8px) and
  `--lc-sidenav-item-padding-x` (10px). Keep the invariant
  `nav-padding-x + item-padding-x + icon-size / 2 == rail-width / 2` when
  overriding, and set the header's `--lc-header-hamburger-slot` to the same
  rail width, so the alignment survives a custom rail.

---

Also in this release: the nine findings from the Factory app's move to the
light palette (measured in the running app, 15.–16.08.2026). Seven of them
were being worked around app-side.

### Fixed

- **Light palette: a card could not lift off the page** — `--color-background`
  and `--color-surface` were both `#ffffff`, so the page and the card sat on
  the same level and a panel could only separate itself with a line. That is
  the shared cause behind both "too many lines" and "one white mass". The page
  now sits below the card (`--color-background` → neutral-100), giving light
  the layering dark already had. Six components that used `--color-background`
  for a *card-level* fill (combobox input and panel, sticky table cell, rich
  text editor) now use `--color-surface`, so they stay white; radio and
  checkbox were reading `--color-background-primary`, which was never defined
  in any palette — their box was transparent, and is now `--color-surface`.
- **Badge and chip used a fill color as text color** (`lc-badge`, `lc-chip`) —
  `color: var(--color-warning)` and friends are fills; as text on a light tint
  they measure ~1.9–2.3:1 against a 4.5:1 requirement. Both now take their ink
  from the new `--color-on-*-subtle` tokens, which clear 4.5:1 in both
  palettes. The same substitution fixes the selected tab label
  (`--color-primary-500` was 4.37:1 on light).
- **Dark palette had the same defect, unmeasured** — `--color-error` and
  `--color-info` resolve to the raw `#9d0e0e` / `#3b6588` fills, which as text
  on a dark surface measure ~1.9:1 and ~2.4:1. The dark `--color-on-*-subtle`
  set uses the light end of each ramp instead.
- **`theme="dark"` did nothing to the colors** (`lc-sidenav`, `lc-header`) —
  `.lc-sidenav--dark` and `.lc-header--dark` declared the same semantic tokens
  as their default blocks, and those flip with the root theme: under a light
  root, a bar marked "dark" rendered light. Both now carry literal dark
  values, so a two-tone shell (light content, dark navigation) is reachable
  through the documented input instead of an app-side override.
- **`showLogo` alone rendered nothing** (`lc-header`) — the brand block also
  required `logo` or `title`, so `showLogo` on its own produced an empty,
  0px-wide brand area with no error and no warning. It now renders the emblem.
- **Solid buttons failed contrast** (`lc-button`) — three separate defects, all
  in the fill/ink pairing rather than in any component:
  - *Primary*: white on the brand teal `-500` is 4.37:1. The fill is one step
    down the ramp now (`-600`, white 6.2:1), hover `-700`, active `-800`.
    **This darkens the primary button in both palettes** — the same ramp on
    purpose, since white contrast does not depend on the surrounding palette
    and the two themes are meant to share one brand fill. In dark the button
    now separates from the page at 2.9:1 instead of 3.7:1; still readable as a
    shape, but that is the trade this makes.
  - *Primary hover in dark*: went **lighter** (`-400`), where white measures
    1.91:1 — the hover was the least legible state of the button. It now
    darkens like everywhere else.
  - *Warning*: white on amber `#e1a040` is 2.26:1. Amber carries dark ink, so
    `.btn-warning` uses the new `--color-on-warning` (~7.9:1) and its
    hover/active shift brightness instead of swapping in a darker amber, which
    would walk the contrast back down under dark ink.

  Secondary (4.6:1), info (6.2:1) and danger (8.4:1) were already passing and
  are unchanged.

### Added

- **`--color-on-{primary,success,warning,error,info}-subtle`** — the legible
  ink for a semantic color as *text*, per palette (light: the `-700`/dark end
  of the ramp; dark: the light end). Pairs with the `--color-*-subtle` fills
  from 2.18.0: fill from one, ink from the other.
- **Badge and chip theming hooks** — `--lc-badge-bg` / `-fg` / `-border` and
  `--lc-chip-bg` / `-fg` / `-border`. Variants now only set these, so an app
  restyles a badge from the outside instead of overriding variant classes.
- **`--color-surface-raised` and `--color-surface-sunken` in both palettes** —
  the level above the card (menus, popovers) and the recessed level inside it
  (table heads, meta strips, code). `--color-surface-sunken` already existed;
  `-raised` is new, and `--color-surface-secondary` is an alias of `-sunken`.
- **`--color-border-subtle`** — a third border weight below `--color-divider`,
  for inner hairlines that should barely register. It was not defined at all
  before (apps that referenced it got nothing).
- **Light-tuned elevations** — `--elevation-1…4` in the light palette are no
  longer the dark scale's wide 35–48% black blurs, which render as a grey
  cloud on white. Light now has its own two-layer, ink-tinted scale.
- **Markdown and card title size hooks** — `--lc-markdown-h1…h6` and
  `--lc-card-title-size`. The bare `.lc-markdown h2` / `.card__title` rules
  outranked any single-class app selector, forcing apps into
  `lc-markdown .lc-markdown h2` just to change a font size.
- **Aliases for names apps kept reaching for** — `--color-danger`,
  `--color-warning-strong`, `--color-text-warning` / `-success` / `-error`,
  `--color-background-primary`. Defined as aliases, so there is still one
  source of truth per value. Deliberately *not* added: `--space-*` and
  `--radius-*` — the canonical names are `--spacing-*` and `--border-radius-*`,
  and blessing a second geometry vocabulary would make the ambiguity worse.

### Changed

- **Sidenav theming hooks moved to the host** (`lc-sidenav`) — the default
  `--lc-sidenav-*` block sat on the inner `.lc-sidenav` element, so an app had
  to write `lc-sidenav .lc-sidenav { … }` to out-specify it. The defaults are
  on `:host` now; an ordinary qualified rule on `lc-sidenav` wins.
- **The type scale is documented as two scales** — `--font-size-*` carries UI
  chrome (`xs`/`sm`/`lg`: labels, control and component text) and content
  (`base`/`xl`/`2xl`+: prose and page titles). `--font-size-base` being 16 does
  not mean components render at 16; component text is chrome. Card titles now
  name their step (`--font-size-lg`) instead of a loose `1.125rem`.

## [2.20.0] - 2026-08-16

### Changed

- **Header: hamburger aligns with the sidenav icon column** (`lc-header`) —
  the sidebar toggle no longer floats inside the header's left padding
  (previously ~47px in, while the collapsed rail centers its icons at 28px).
  It now renders in a fixed-width slot flush with the header's left edge,
  centering the icon at half the slot width. The slot is
  `--lc-header-hamburger-slot` (default `56px` → icon at 28px, the center of
  the collapsed 56px rail; `76px` → 38px, the expanded nav's icon column).
  Apps toggling the sidenav can bind the var to the collapse state and the
  slot width transitions in step with the sidenav's width animation — see the
  new *Above a Sidenav (Aligned Hamburger)* story. The toggle also lost its
  redundant host-level padding/hover box (the inner ghost button already
  provides hover and focus states), which had doubled up the hit-area visuals.

## [2.19.0] - 2026-08-14

Follow-up to the Factory ::ng-deep removal: fixes the last remaining
app-side kit override (a bug, not theming) and adds the three hooks the
2.18.0 set didn't cover.

### Fixed

- **Pipeline: horizontal connector length** (`lc-pipeline`) — the connector
  is absolutely positioned inside the marker, and the marker was
  `position: relative`, so the connector's `width: calc(100% + gap)`
  resolved against the marker-sized box instead of the full-width step: the
  line collapsed to a stub that never reached the next node. The marker no
  longer establishes a containing block; the connector now resolves against
  `.lc-pipeline__step` and spans node-center to node-center as designed.
  The same change repairs the vertical connector's height calculation
  (previously 0 against the marker). Apps that patched this with a
  positioning override on `.lc-pipeline__marker` can drop it.

### Added

- **Accordion: padding and container-border hooks** (`lc-accordion`) —
  `--lc-accordion-header-padding` and `--lc-accordion-body-padding`
  (shorthands that win over the size variants; the body hook sets the
  *expanded* padding — the collapsed state keeps zero vertical padding,
  which the collapse animation depends on), and `--lc-accordion-border`
  recolors the outlined container's border (e.g. a tinted frame for the
  "current" section).
- **Page header: subtitle line clamp** (`lc-page-header`) —
  `--lc-page-header-subtitle-line-clamp` caps the subtitle at N lines
  (e.g. `2` for the collapsible project-detail header). The subtitle's
  default display is now `-webkit-box` — rendering plain text identically
  to the previous `block` — so setting only the clamp hook is enough;
  `--lc-page-header-subtitle-display` still overrides (and `none` still
  hides).

## [2.18.0] - 2026-08-14

Closes the seven gaps from the Factory-consolidation requirements review
(2026-08-14): missing tint tokens, tooltip and inline-link support on the
button, an alert action slot, four theming hooks that previously forced
`::ng-deep`, a status-dot atom and an inline progress bar.

### Added

- **Subtle tint tokens** — `--color-primary-subtle`, `--color-success-subtle`,
  `--color-warning-subtle`, `--color-error-subtle`, `--color-info-subtle`:
  barely-there washes of the semantic palette for tinted section backgrounds,
  chips and highlighted rows (the teal "current" accordion section, amber
  wait chips, red escalation surfaces). Light theme uses solid hexes so
  stacked elements don't accumulate opacity; dark theme uses translucent
  washes of the raw scale (the badge-fill recipe), so they tint whatever
  surface they sit on. Pair with the matching `--color-*` for the ink on top.
- **Button: `disabledReason` and `title`** (`lc-button`) — first-class tooltip
  inputs. `title` renders as the native tooltip; `disabledReason` takes over
  while the button is disabled or loading, so "disabled ⇒ why" is expressible
  without an `[attr.title]` workaround. Contractual: the tooltip appears over
  the *disabled* button too — the inner button now explicitly keeps
  `pointer-events: auto` in the disabled state, with a test pinning it.
- **Button: `inline` mode** (`lc-button`) — renders the button as inline text
  that flows with the surrounding copy and inherits its font size, weight and
  line-height. Pair with the (existing) `variant="link"` for links inside
  copy, linked rollup counters and clickable row titles; the focus ring
  drops to a small radius so it hugs the text. New hooks
  `--lc-button-link-fg/-hover-fg/-active-fg` recolor the link ink (e.g.
  `inherit` for a row title that only underlines on hover).
- **Alert: action slot** (`lc-alert`) — project a button with `slot="action"`
  to render it right of the body, vertically centered: the standard "error
  state with retry" pattern without sibling-layout workarounds. Nothing
  projected ⇒ nothing rendered (no stray gap).
- **New component: `lc-status-dot`** — the traffic-light atom for list rows,
  rails and boards. Five semantic tones (`done`, `run`, `wait`, `blocked`,
  `open`), optional `pulse` for in-progress states (an expanding ring in the
  tone's color; static under `prefers-reduced-motion`), sizes `md` (8px) and
  `sm` (6px) for dense rows. Decorative by default (`aria-hidden`); pass
  `label` to expose the state via `role="img"`.
- **Progress bar: `inline` mode** (`lc-progress-bar`) — the bar flows with a
  list row at a fixed width (`--lc-progress-bar-inline-width`, default 5rem)
  instead of filling its container. The new `--lc-progress-bar-height` hook
  sets an exact track height over any size — the canvases' 6px rollup bar is
  `size="sm" [inline]="true"` with `--lc-progress-bar-height: 6px`. (Thin
  tracks already existed: `size="xs"` is 2px, `sm` 4px.)
- **Theming hooks instead of `::ng-deep`** — stable CSS custom properties for
  the four spots apps were piercing:
  - `lc-accordion`: `--lc-accordion-header-bg`, `--lc-accordion-header-fg`,
    `--lc-accordion-header-border`, `--lc-accordion-header-hover-bg` (the
    tinted "current" section: set bg to `var(--color-primary-subtle)`).
  - `lc-select`: `--lc-select-clear-display` (e.g. `none`),
    `--lc-select-clear-fg`, `--lc-select-clear-hover-fg`,
    `--lc-select-clear-hover-bg`.
  - `lc-page-header`: `--lc-page-header-subtitle-display` (e.g. `none` for
    the collapsed header), `--lc-page-header-subtitle-fg`,
    `--lc-page-header-subtitle-font-size` (wins over all size variants).
  - `lc-pipeline`: `--lc-pipeline-node-bg`, `--lc-pipeline-node-fg`,
    `--lc-pipeline-node-border` (joining the existing `--lc-pipeline-*`
    hooks).

  New Storybook stories *Inline Link*, *Disabled With Reason* (Button),
  *With Action* (Alert), *All Tones* / *In List Rows* (Status Dot) and
  *Inline In List Rows* (Progress Bar).

## [2.17.0] - 2026-08-13

### Added

- **Tabs: per-tab badges** (`lc-tab`) — a `badge` input (string or number)
  renders a count or status label after the tab label, and `badgeVariant`
  picks its color (`default` | `primary` | `success` | `warning` | `error` |
  `info`, default `default`). The badge is the existing `lc-badge` (size
  `xs`, pill), so colors track the DS2.0 semantic palette automatically in
  both themes. `0` renders as a badge; `undefined`, `null` and `''` hide it,
  so a count can be cleared without restructuring the tab. In vertical
  (sidebar-style) tabs the badge sits at the trailing edge of the tab button.
  The badge keeps a constant font-weight, so selecting a tab (semibold label)
  doesn't reflow it. Tab buttons are now `inline-flex` with the density gap;
  tabs without a badge render exactly as before. New Storybook story
  *With Badges*.

## [2.16.0] - 2026-07-21

### Added

- **Dependency viewer: `layout="layered"`** (`lc-dependency-viewer`, default
  `tree` — no change to existing usage) — a layered/DAG layout that places nodes
  by their depth in the *dependency* graph instead of by their depth in the
  `children` nesting. A node always sits past everything it depends on
  (longest-path layering), so `direction="horizontal"` reads as an order of work
  left→right and nodes that depend on nothing start the first layer; a node with
  several predecessors clears the deepest of them rather than sitting beside it.
  Crossings are minimised with Sugiyama's median heuristic (alternating sweeps,
  best result kept), then a coordinate pass slides nodes toward the middle of
  their neighbours so chains run straight instead of stair-stepping — on a
  20-node plan-shaped graph handed over in arbitrary order that is a ~55%
  reduction in crossings versus arrival order. `direction="vertical"` turns the
  layers into rows.

  Both link kinds are treated as precedence: `dependsOn` says "this comes after
  that", and a `children` link says the same of a parent and its child. Layering
  over their union is what keeps a `children` edge pointing with the flow instead
  of doubling back, and means **every** link is drawn — including the
  multi-predecessor ones a tree layout has to discard to keep one parent per
  node. Cycles are tolerated: a DFS picks the links that close each loop, the
  rest is layered as a DAG, and the loop-closers are drawn as dashed return
  edges, so a graph that turns out to be cyclic still renders.

- **Dependency viewer: `root` accepts an array** (`lc-dependency-viewer`) — a
  forest, which is how you feed a flat set of items that has no natural root
  (specs related only by `dependsOn`). Previously such a set had to be wrapped in
  a synthetic root, which then occupied the first layer on its own. In `tree`
  mode each root gets its own band along the secondary axis; a node reachable
  from two roots is still laid out exactly once.

- **Dependency viewer: `fitMode`** (`lc-dependency-viewer`) — `contain` (fit both
  axes; what `autoFit` does, which it now supersedes), `fit-width` (fit the
  width, let the height follow the graph) or `none`. Defaults to `autoFit`'s
  setting and overrides it when set. `fit-width` is the answer to "everything
  fits but nothing is readable": nodes keep a legible size and the *page*
  scrolls, while the graph itself never scrolls internally. Past roughly 20 nodes
  a process view generally wants it.

- **Dependency viewer: `minNodeSize`** (`lc-dependency-viewer`) — a floor, in px
  of node width (160px unscaled), on how far fitting may shrink the nodes. Below
  it the fit stops scaling down and lets the graph overflow, which `fit-width`
  turns into page scroll. Never enlarges a graph that already fits.

  New Storybook stories *Layered — Order of Work*, *Layered — Vertical*,
  *Layered — Fit Width*, *Layered — Minimum Node Size*, *Layered — Relation
  Types* and *Layered — Cycle Tolerance*.

## [2.15.0] - 2026-07-21

### Added

- **Dependency viewer: `autoFit`** (`lc-dependency-viewer`) — scales and centres
  the graph so all of it fits the canvas, re-fitting on container resize (via
  `ResizeObserver`) and whenever the graph changes shape. The fit only ever
  shrinks: it never enlarges past 100%, so a two-node graph keeps its natural
  size instead of ballooning to fill the frame. Under `autoFit` the `anchorNodeId`
  compensation stands down (both move the pan on relayout, and they would
  otherwise fight over it) and `resetView()` re-fits rather than snapping back to
  100%. The bounding box is taken from the node boxes plus the edge label points,
  which is what puts a bowed cross-reference's apex inside the fit.
- **Dependency viewer: `interactive`** (`lc-dependency-viewer`, default `true`) —
  `false` freezes the viewport: no drag-pan, no wheel-zoom, no toolbar zoom
  buttons, and no grab cursor. The wheel event is left un-prevented so the page
  behind the viewer still scrolls. Content interaction is untouched — `nodeSelect`
  and `nodeExpand` still fire and collapse toggles still work, so a static viewer
  is still click-through. Together with `autoFit` this is the
  everything-at-a-glance configuration: new Storybook stories *Auto Fit*,
  *Auto Fit Vertical*, *Static Overview* and *Static Without Auto Fit*.
- **Dependency viewer: `fit()`** (`lc-dependency-viewer`) — imperative counterpart
  to `autoFit`, alongside the existing `focusNode()` / `resetView()`.

### Fixed

- **Dependency viewer: the legend was pushed out of the frame, and the canvas
  overhung its container** (`lc-dependency-viewer`) — the host was a plain block
  and the canvas took `height: 100%`, which resolves against the *host*, not
  against the space left over by the toolbar and legend. The canvas therefore
  overhung by the toolbar's height, shunting the legend past the host's
  `overflow: hidden` edge. The host is now a column flex container and the canvas
  takes the remaining space. This is also what makes `autoFit` correct: it now
  measures the viewport the user can actually see.

## [2.14.0] - 2026-07-20

### Fixed

- **Sidenav: badge on the collapsed rail was unreadable and covered the icon**
  (`lc-sidenav`) — the collapsed-mode overrides set `font-size` / `min-width` /
  `padding` on `.lc-sidenav__nav-badge`, which is the `lc-badge` **host**; the
  visible element is the inner `.lc-badge` the component renders, so none of
  them applied and the badge stayed at full `xs` size (20px) inside a 40px
  item. On top of that the badge variants use translucent fills, so the icon
  glyph showed through the badge. The badge is now sized as a real count
  bubble (16px, 10px/600 text) via `::ng-deep`, anchored to the item's
  top-right corner and nudged outward so 1–2 digit values clear the glyph
  entirely, and given an opaque backdrop plus a 2px ring in the rail color
  (new `--lc-sidenav-badge-ring` token, follows `--lc-sidenav-bg`) so wider
  values like `99+` stay legible where they do overlap. New Storybook story
  *Collapsed Rail — Badges* covers the variants and value widths on both
  themes.
- **Header: the built-in Logout menu item rendered a "?" placeholder**
  (`lc-header`) — its icon was the un-aliased Heroicon name
  `arrow-right-start-on-rectangle`. Now resolves to Tabler `logout`.

### Added

- **Icon: 11 more documented Heroicon aliases** (`ICON_ALIASES`) — every
  Heroicon name still referenced anywhere in this library now resolves instead
  of falling back to the placeholder: `cpu-chip`, `clipboard-document-list`,
  `archive-box`, `puzzle-piece`, `paper-airplane`, `presentation-chart-bar`,
  `chat-bubble-left`, `chat-bubble-left-right`, `building-office`,
  `rocket-launch`, and the logout arrow in both Heroicon spellings
  (`arrow-right-start-on-rectangle`, `arrow-right-on-rectangle`).
  `beaker` / `table-cells` / `code-bracket` / `question-mark-circle` stay
  deliberately un-aliased — they are the documented "did you mean …?"
  examples — so the stories that used them now name their Tabler icon
  directly.

## [2.13.1] - 2026-07-19

### Fixed

- **Icon: SPA `index.html` fallback can no longer be injected** (`lc-icon`) —
  P1, reported from a LC Factory prod incident (CLS 0.66 from 34 instances of
  a typo'd icon name). In SPA deployments the server answers missing asset
  paths with the `index.html` fallback and status 200; `lc-icon` injected that
  document unchecked via `bypassSecurityTrustHtml`, once per instance. Three
  layers of fixes:
  - Unknown icon names are caught **before** any request — in production as
    well as dev — with exactly one console warning per name and the visible
    "?" placeholder. Note: names outside `ICON_NAMES`/`ICON_ALIASES` that
    happened to be servable are no longer fetched.
  - HTTP responses are validated before rendering: `text/html` content-types
    are rejected, and the body must parse as a standalone `<svg>` document
    (parse errors and non-SVG roots are dropped with one warning per name).
    `processSvgString` no longer returns unparseable input verbatim — that was
    the actual injection point.
  - `bypassSecurityTrustHtml` is confined to a single documented funnel that
    only ever receives parsed, re-serialized SVG.
  `strict` is unchanged (dev/CI escalation: throw on unknown names) and
  documented in the Storybook docs alongside the new SPA-safe loading
  behavior.

## [2.13.0] - 2026-07-18

Closes the six gaps found while building app views DS-first (R1–R6 of the
2026-07-18 requirements review): one chat-rendering bug and five missing
capabilities that previously forced app-side custom builds.

### Added

- **New component: `lc-split-pane`** — resizable two-pane layout container
  (R6). Projects `slot="start"` / `slot="end"` panes side by side with a
  draggable separator: pointer-capture drag within `minSize` / `maxSize`
  (px or a percentage of the container, e.g. `'55%'`), double-click to restore
  `initialSize`, and full keyboard support (focusable separator with
  `role="separator"`, `aria-valuenow`; ←/→ resize by `step`, Home/End jump to
  the bounds). With `storageKey` the width persists to localStorage and
  survives a reload. Below the `stackBelow` viewport breakpoint the panes
  stack vertically and the resizer disables. `sizeChange` reports every
  applied width.
- **Chip: clickable chips** (`lc-chip`) — `clickable` renders the chip as a
  real `<button type="button">` with hover / active / `:focus-visible` states
  and a new `chipClick` output (R2), so chips can act as navigation / action
  elements. Combinable with `removable`: the ✕ fires only `remove`, never
  `chipClick` (inside a clickable chip it renders as a focusable
  `role="button"` span, since nesting native buttons is invalid HTML).
  `disabled` suppresses `chipClick` and sets `aria-disabled`. Non-clickable
  chips render exactly as before — no button wrapper.
- **Breadcrumbs: click navigation without URLs** (`lc-breadcrumbs`) — items
  without `url` now render as buttons and emit the new `itemClick` output
  instead of navigating (R3), for breadcrumbs that switch in-memory state
  (e.g. the parent chain of a selected node). `BreadcrumbItem` gains an
  optional `id` for handling those clicks. Items with `url` keep their
  router-link behavior, and the last item stays non-interactive with
  `aria-current="page"`.
- **Tree view: generic object trees** (`lc-tree-view`) — `TreeNode.type` is
  no longer restricted to `'file' | 'folder'` (R4): any string marks a custom
  domain type, rendered with a colored type dot (`color`, any CSS color or
  token) or an explicit `icon` instead of the file-icon heuristics. Any node
  with children can now expand regardless of type. Two new `status` values
  complement the existing git-ish ones: `'success'` renders a ✓ indicator and
  `'busy'` a pulsing dot (static under `prefers-reduced-motion`, with
  `aria-busy` on the tree item). Plain file trees render exactly as before.
- **Toggle group: per-option dot indicator** (`lc-toggle-group`) —
  `ToggleOption.dot` renders a small status dot right of the label (R5), e.g.
  an unread marker on a tab-like option. `dot: true` uses the `warning` tone;
  `'warning' | 'error' | 'success'` pick a semantic color explicitly. The dot
  never changes the option height.

### Fixed

- **Markdown: `---` ripped ~48px holes into chat bubbles** (`lc-markdown`) —
  the `chat` variant condensed every block element except `hr`, which still
  inherited the base `1.5em` margin (R1). Since LLM answers routinely use
  `---` as a section divider, chat transcripts showed large empty gaps. An
  `hr` in `variant="chat"` now spans 16px total; `default` and `compact` are
  unchanged.

## [2.12.1] - 2026-07-15

### Fixed

- **Dependency viewer: edge labels were hidden behind nodes** (`lc-dependency-viewer`) —
  labels are drawn in their own pass after the nodes now, and carry a halo in the
  viewer's background colour so they stay legible wherever they land.

  Partly a regression from 2.12.0: labels have always been drawn before the nodes, but
  while the node fills were translucent they showed through faintly. Making the fills
  opaque (to stop edges bleeding through) turned "faint" into "invisible".
- **Dependency viewer: edge labels sat 8px off their edge** — `labelY` is an SVG
  baseline, and the label was additionally nudged up by 8px, so the text ended up ~16px
  above the point it marks. In a 24px gutter between stacked siblings that pushed it out
  of the gap and onto the node above (measured: 5px into the box for 3 of 4 labels in
  the "Complex Relationships" story). Labels are now centred on their edge's midpoint
  via `dominant-baseline`, and clear the nodes without any change to the layout spacing.

## [2.12.0] - 2026-07-15

### Changed

- **Page layout caps content width by default** (`lc-page-layout`) — **visible change
  for every page using this component.** Header, body and footer are now capped at
  `--lc-content-max-width` (1536px) and centred, so content no longer stretches edge
  to edge on wide and ultrawide monitors. All three regions share the cap, so a page
  title stays aligned with the body beneath it. Below 1536px nothing changes.

  This is the piece that actually delivers a content cap: it applies to every page in
  the shell regardless of what each one uses internally — including pages on
  `<lc-container size="full">`.

  Opt out per instance with `contentWidth="full"` (for full-bleed maps, boards or
  canvases), or retune the width globally/per subtree via `--lc-content-max-width`.
  The internal scroll behaviour and height chain are unchanged: the body remains the
  scroll container, and children relying on `height: 100%` (e.g. `lc-chat`) still
  resolve against it.

### Added

- **Container: `xxl` size** (`lc-container`) — new preset between `xl` (1280px) and
  `full`, capping content at **1536px** and keeping it centred. Closes the gap that
  forced data-dense pages (dashboards, two-column card layouts, tables) to choose
  between an `xl` that squeezes and a `full` that stretches across ultrawide
  displays. `sm`/`md`/`lg`/`xl`/`full` are unchanged — this is purely additive.
- **`--lc-content-max-width` token** — the canonical content cap (1536px, matching
  `size="xxl"`), also exported as the `SizeContentMaxWidth` TypeScript constant. App
  shells that centre content outside of `lc-container` should reference this instead
  of hard-coding a width, so every LC app lands on the same content width:

  ```scss
  .app-content {
    max-width: var(--lc-content-max-width);
    margin-inline: auto;
  }
  ```

  Unlike `sm`–`xl` (which map onto Tailwind's screen scale), `xxl` reads this token
  in CSS, so overriding the custom property retunes the container and the shell
  together rather than letting them drift apart.
- **Dependency viewer: node events** (`lc-dependency-viewer`) — `(nodeSelect)` fires on
  selection (not on deselect) and `(nodeExpand)` on double-click, both carrying the
  original `DependencyNode`. This is the hook for click-to-expand and custom detail
  panels.
- **Dependency viewer: opaque `data` passthrough** — `DependencyNode.data?: Record<string,
  unknown>` is never read by the component and handed back unchanged on `nodeSelect` /
  `nodeExpand`, so callers can carry their own metadata through the viewer.
- **Dependency viewer: viewport anchoring** — new `[anchorNodeId]` (defaults to the
  selected node) keeps a node pinned to its screen position across `root` updates.
- **Dependency viewer: free-form edge labels** — `DependencyEdgeDef.relationLabel?: string`
  renders any label verbatim (`CALLS`, `HAS_COLUMN`, …) without squeezing it into the
  seven built-in relations. The `relation` enum is unchanged and still drives colour.
- **Dependency viewer: truncation indicator** — `DependencyNode.moreCount?: number` renders
  a quiet "+N" marker for nodes whose neighbourhood is capped.
- **Dependency viewer: node types** — `DependencyNode.type?: string` plus `[typeColors]`
  colours nodes along a category axis, with its own legend. Additive to `status`: a
  resolved type colour wins for the fill, otherwise `status` applies exactly as before.
- **Dependency viewer: filters** — `[hiddenRelations]` and `[hiddenTypes]` hide edges and
  nodes without reshuffling the remaining layout.
- **Dependency viewer: imperative API** — `focusNode(id)`, `resetView()`, `expand(id)`,
  `collapse(id)`, `expandAll()`, `collapseAll()` for deep links and programmatic control.

### Fixed

- **Dependency viewer no longer crashes on cyclic input** (`lc-dependency-viewer`) — a cycle
  (`a → b → a`) previously recursed until `RangeError: Maximum call stack size exceeded`,
  and a node reachable from two parents was rendered twice at two positions. The layout now
  treats its input as a graph: a link back to an already-placed node is drawn as a
  cross-reference arrow instead of being followed. Every node is laid out exactly once, and
  no input can make the layout recurse forever.
- **Dependency viewer: O(n²) work per change detection** — `hasChildren()` walked the whole
  tree for every node on every cycle, and the layout resolved parents with a linear scan.
  Both are map lookups now.
- **Dependency viewer: edges showed through nodes in the dark theme**
  (`lc-dependency-viewer`) — the status fills resolve to translucent tints
  (`--color-success-50` → `rgba(…, 0.18)`), so edges routed behind a node were visible
  straight through it. Nodes now carry an opaque backdrop beneath the tint. The paint
  order was never the problem: edges were always drawn under the nodes.
- **Dependency viewer: cross-references cut across unrelated nodes** — a cross-reference
  joins an arbitrary pair, so its direct curve could pass behind a node in between and
  read as a broken edge. They now detour around it (parent→child edges always ran down
  the gutter and never had this problem). This is a small fixed search over candidate
  routes, not obstacle-avoiding routing: a dense enough graph can still leave the
  least-bad route crossing something.
- **Dependency viewer: unreadable labels in the dark theme** — node labels used
  `--color-<status>-700`, which is dark ink in *both* themes (`--color-error-700` is
  `#6b0909`), leaving dark-on-dark text over the dark theme's tints. Labels now use the
  theme's semantic `--color-text-*`, which flips with the theme; status stays legible
  through the border and tint.
- **Dependency viewer: chrome used the raw neutral scale** — toolbar, legend, detail panel
  and toggles read `--color-neutral-*`, which the dark theme inverts into blue-greys that
  clashed with the DS2.0 teal-tinted surface (a `#111827` panel on a `#14222e` card). They
  now use the semantic `--color-surface-*` / `--color-border` / `--color-text-*` tokens.
- **Page header: actions align to the title line** (`lc-page-header`) — the title and
  the `[slot="actions"]` now share an internal `__title-row` that centres them against
  each other, with the subtitle below that row. Previously `__row` used
  `align-items: flex-start`, so actions sat ~3px above the title's optical centre
  (measured: 2.75px at `size="default"` with `size="sm"` buttons, up to 13.75px for
  `compact` + `lg`). Actions now centre on the title line for every combination of
  header size (compact/default/comfortable) and button size (sm/md/lg).

  This also fixes a larger latent bug: because `__row` wraps and `__titles` reported a
  wide max-content size, **a long subtitle pushed the actions onto their own line
  below the subtitle even on wide viewports** — buttons landed ~77px below the title
  and left-aligned. They now stay on the title line regardless of subtitle length.

  Two visible consequences, both intentional:
  - When actions wrap on narrow viewports they now sit **between the title and the
    subtitle** rather than below the subtitle.
  - Wrapped actions stay **right-aligned** (previously they went left), matching the
    documented "right-aligned actions" contract.

  Apps that worked around the offset with a `min-height` on `.lc-page-header__title`
  (e.g. via `::ng-deep`) should remove it — it will now over-tall the title row.

## [2.11.0] - 2026-07-13

### Added

- **Chat: user avatar** (`lc-chat`) — user turns can now show an avatar on the
  outer right edge: the message's `avatar` image, or an initials **monogram**
  built from `name` when no image is set. Gated by the existing `showAvatars`
  input, so it stays off when neither is present; `showAvatars=false` disables
  it entirely. Agent/system turns keep their left-rail dot/avatar/status icon.

### Changed

- **Chat: compact, redesigned layout** (`lc-chat`) — the chat now uses a single
  space-efficient spacing scale (tighter thread gap, padding, line-height and
  font) so noticeably more turns fit on screen; there is **no roomy variant**.
  User turns are redesigned as **right-aligned, accent-tinted bubbles without a
  name label**, with the timestamp on a muted line beneath; agent turns show
  their timestamp inline next to the name. This is a visible change to the
  default appearance (no API change). The spacing is exposed as `--lc-chat-*`
  custom properties for CSS-level fine-tuning.

## [2.10.0] - 2026-07-13

### Added

- **Badge: leading status dot** (`lc-badge`) — new `[dot]` input renders a small
  dot filled in the variant's `currentColor` before the label (the scannable
  "● label" status pattern). Works across every size and variant; purely additive.
- **Card: compact icon tile** (`lc-card`) — new `[iconSize]` input (`sm` | `md`,
  default `md`). `sm` renders a smaller ~1.75rem chip for dense card headers;
  combines with `[iconVariant]`. Default size unchanged.
- **Card: rich status badge slot** (`lc-card`) — new `card-badge` projection
  slot in the title row so a full `lc-badge` (e.g. with a leading `[dot]`) can be
  placed beside the title. Takes visual precedence over the plain `badge` string;
  the slot collapses when empty. The existing `badge`/`badgeVariant` string API is
  unchanged.
- **Description List: value suffix + monospace values** (`lc-description-list`) —
  new optional `valueSuffix` per item renders a muted qualifier after the value on
  the same line; new `emphasis: 'mono'` renders the value in `--font-family-mono`
  (paths, URLs, hashes). Existing items without the new fields are unchanged.
- **Description List: row separator style** (`lc-description-list`) — new
  `[separator]` input (`line` | `divider` | `none`, default `line`). `divider`
  swaps the solid per-row line for a subtle dashed one; `none` removes it. Default
  matches the previous look exactly and is orthogonal to `leaders`.
- **Pipeline: compact size** (`lc-pipeline`) — new `[size]` input (`sm` | `md`,
  default `md`). `sm` shrinks nodes, thins connectors and tightens the grid for a
  dense status spine; captions stay legible. Default size unchanged.
- **Page Header: leading icon tile** (`lc-page-header`) — new `[icon]` input
  (with `[iconVariant]` and `[iconSize]`) renders a leading brand tile beside the
  title, mirroring `lc-card`. Purely additive; the `title-suffix`/`actions` slots
  are unchanged.

### Notes

- All changes are additive and backward-compatible; existing usages render
  identically. On `lc-description-list`, `separator` is deliberately separate from
  the existing `leaders` input rather than merging the two (which would have been
  a breaking change): `leaders` still controls the dotted term↔value leader,
  while `separator` controls the per-row line.

## [2.9.0] - 2026-07-13

### Added

- **Pipeline** (`lc-pipeline`) — a new status timeline of connected process
  nodes. Unlike `lc-stepper` (a navigation stepper whose states derive from the
  active index), **each node carries its own explicit status**, so completed,
  current, pending, warning and error nodes can appear in the same chain — each
  with an optional caption under its label. Status drives the node color and a
  default icon (overridable per node); `horizontal` / `vertical` orientation and
  an optional `clickable` mode (`stepClick`).
- **Description List** (`lc-description-list`) — a new component for key/value
  metadata rendered as a semantic `<dl>`. `rows` layout (term left, value right)
  with an optional dotted **leader line** (`[leaders]`), or `stacked` layout for
  narrow columns; per-row value emphasis (`default` / `muted` / `strong` /
  `primary`) and optional links.
- **Card: leading header icon** (`lc-card`) — new `[icon]` input renders a
  Tabler icon as a teal brand tile to the left of the title, with
  `[iconVariant]` (`brand` gradient tile / `subtle` translucent tile). Purely
  additive; cards without `icon` are unchanged.
- **Page Header: `title-suffix` slot** (`lc-page-header`) — a new
  `[slot="title-suffix"]` projects one or more chips/badges inline next to the
  title (beside the existing single `badge`). The row wraps on narrow viewports
  and collapses when empty.

### Changed

- **DS2.0 dark shell is darker** — the dark app background token
  (`--color-background`) drops from `#111827` to `#0A121B` (a deeper teal-black),
  so raised card surfaces (`#14222E`) read with more separation.
- **New `--color-sidebar` surface token** — the darkest shell layer
  (`#070E15` dark / `neutral-50` light). `lc-sidenav` now uses it, producing the
  two-tone shell (dark nav rail against a slightly lighter content area). Falls
  back to `--color-surface` where the token is not defined.

### Notes

- Backward compatible: the two new components are additive, and the `lc-card` /
  `lc-page-header` additions are opt-in inputs/slots that leave existing usage
  unchanged. The background change only affects the dark theme's app-level
  surfaces; component surfaces and text tokens are unchanged.

## [2.8.0] - 2026-07-01

### Added

- **Icon: fail-loud on unknown names** (`lc-icon`) — a name that is neither a
  served Tabler icon nor a documented alias (e.g. `beaker`, `table-cells`,
  `cpu-chip`) no longer renders as a silent empty space. It now logs
  `[lc-icon] Unknown icon "…"` in development **and** always renders a visible
  placeholder glyph (a dashed frame with a `?`) in every mode.
  - New `strict` input: when `true`, an unknown name **throws** in development
    (a CI guard to catch typos); no effect in production.
- **Icon: transient load retry** (`lc-icon`) — a failed asset request is now
  retried twice with a short backoff before showing the placeholder, so a
  transient hiccup (connection reset, server busy, or a large burst of icons
  hitting the browser's pending-request limit) no longer leaves an otherwise
  valid icon stuck on the fallback. A genuine `404` is not retried.
- **Icon: canonical name catalog exported** — the design system now exports the
  machine-readable set of valid `lc-icon` names so consumers can lint statically
  against an official source instead of parsing `node_modules`:
  - `ICON_NAMES` (`readonly string[]`), `isValidIconName(name)`, and the
    `IconName` type, all from the package entry.
  - `ICON_ALIASES` (Heroicon/Material → Tabler) is now public/documented.
  - A generated `icon-names.json` is shipped and importable at
    `@life-cockpit/angular-ui-kit/icon-names.json` for build tooling.
  - Regenerate after bumping `@tabler/icons` or editing the alias/inline maps
    with `npm run generate:icon-names` (a unit test guards against drift).
- Icon `aria-hidden` is set on the decorative fallback; the header/panel wiring
  is unchanged.

### Notes

- Backward compatible for valid names: rendering, aliases, sizing, colors and
  accessibility are unchanged. The `iconAliasMap` / `inlineSvgMap` internals were
  extracted into `icon-aliases.ts` / `icon-inline-svgs.ts` (no public change).
- The previous behavior logged `Failed to load icon "…"` for **every** failed
  request (including in unit tests); that noise is gone — unknown names are
  reported once, up front, and known-but-unreachable assets fall back silently.

## [2.7.0] - 2026-07-01

### Added

- **Accordion: rich header template** (`lc-accordion`) — project arbitrary
  non-interactive header content (label, `lc-badge`, meta, a right-aligned
  value) via `<ng-template lcAccordionHeader>` instead of the plain `title`
  string. The component keeps owning the disclosure chevron, click/keyboard
  handling and focus ring; the consumer supplies only the inner content.
  - New `chevronPosition` input (`'trailing'` default | `'leading'`). `leading`
    frees the right edge so a header element pinned with `margin-left: auto`
    (e.g. a timestamp) is not pushed inward.
  - `title` is now optional and, when a header template is present, serves as
    the accessible-label fallback; a new `ariaLabel` input can override it.
- **Accordion: lazy / deferred body** (`lc-accordion`) — with an
  `<ng-template lcAccordionContent>` body, `[lazy]="true"` defers body creation
  until the first open (then keeps it mounted on collapse), and
  `[destroyOnClose]="true"` discards it on every collapse and recreates it on
  reopen. Default `<ng-content>` bodies are unchanged (always eager).
- Header/panel are now wired with `aria-controls` / `aria-labelledby` and the
  chevron is `aria-hidden`.

### Notes

- Fully backward compatible: without `lcAccordionHeader` / `lcAccordionContent` /
  the new inputs, `lc-accordion` behaves exactly as before (`title` + eager
  `<ng-content>` body). `lc-accordion-group [multi]="false"` keeps single-open
  behavior across dynamic `@for` child lists.

## [2.6.0] - 2026-06-29

### Fixed

- **Markdown: task-list checkboxes now render** (`lc-markdown`) — task items
  (`- [ ]` / `- [x]`) previously rendered with no marker at all, because Angular's
  HTML sanitizer strips `<input>`. The checkbox is now an accessible styled
  element (`role="checkbox"` with `aria-checked` / `aria-disabled`) that survives
  sanitization. `[x]` / `[X]` are both accepted, and plain `-` items keep their
  disc bullet (mixed lists work).

### Added

- **Markdown: GFM table alignment + scroll** (`lc-markdown`) — pipe tables honor
  per-column alignment from the delimiter row (`:--` left, `:-:` center, `--:`
  right), expose `scope="col"` on header cells, and scroll horizontally when wide
  instead of breaking layout.
- **Markdown: autolinks** (`lc-markdown`) — bare `http(s)://`, `www.`, and email
  addresses in prose become links (honoring `linkTarget` / `sanitize`), but never
  inside code spans or fenced code.
- Explicit `em` italic styling for consistency across themes.

### Docs

- Expanded the `lc-markdown` Storybook description and README entry to cover the
  full GFM feature set and change highlighting; added a *GFM Features* story.

## [2.5.0] - 2026-06-29

### Added

- **Markdown: change highlighting** (`lc-markdown`) — A live-rendered document can
  now show *where* it changed, in place. Pass the pre-edit markdown as
  `previousContent` and set `highlightChanges`; the changed/added blocks in
  `content` are highlighted with a straight left accent bar + a subtle tint.
  - **Block-level diff** — `content` and `previousContent` are split into the same
    rendered blocks (heading, paragraph, blockquote, table row) and diffed by
    normalized text. Lists are diffed per `<li>`, so a single edited or added item
    highlights on its own — not the whole list.
  - **Fade or persist** — `changeHighlightFadeMs` fades the highlight (and its
    breathing-room padding) cleanly back to a normal block after N ms; unset, the
    highlight persists until the content changes again.
  - **`scrollToFirstChange`** brings the first changed block into view.
  - **Accessible** — each changed block carries a visually-hidden "geändert"
    label (not colour-only) and a single polite `aria-live` summary announces the
    changed-block count; `changesHighlighted` emits `{ changedBlocks }`.
  - **Fully backward compatible** — without the inputs, rendering is byte-for-byte
    the previous output. See the new *Change Highlighting* Storybook stories.

### Changed

- **Demo stories use generic example content** — the Markdown change-highlighting
  and Table tree-rows stories now use neutral placeholder data rather than
  domain-specific examples.

## [2.4.0] - 2026-06-27

### Added

- **Table: grouped / expandable tree rows** (`lc-table`) — A flat data table can
  now render a parent/child hierarchy (e.g. Epic → Spec, task → subtask) by
  setting `idKey` + `parentKey`; the column the disclosure attaches to is the
  `treeColumn` (defaults to the first column).
  - **Disclosure + indentation** — parent rows show a real `<button>` chevron
    (rotates 90° on expand, reusing the kit's disclosure animation); descendants
    are indented one level per depth with a subtle indent guide. Rows without
    children reserve the chevron space so titles stay aligned.
  - **Expand state** — expanded by default (`defaultExpanded`), or fully
    controlled via `[(expandedIds)]`; toggling emits `rowToggle` and
    `expandedIdsChange`. Clicking the chevron toggles a group and **does not**
    emit `rowClick`.
  - **Structure-aware sort & filter** — sorting sorts siblings within each group
    and keeps the tree intact (never flattens); filtering keeps a matching row
    visible together with its ancestor chain.
  - **Group-safe pagination** — pages over root rows so a group is never split
    across pages.
  - **Accessible** — `role="treegrid"` with `aria-level` / `aria-expanded` /
    `aria-posinset` / `aria-setsize`; the chevron is a keyboard-toggleable button
    with an `aria-label`.
  - **Fully backward compatible** — without `idKey`/`parentKey` the table is
    byte-for-byte identical to the previous flat table. See the new *Tree Grouped
    Rows* Storybook story.

### Fixed

- **Table: `pageSize` input now actually applies** (`lc-table`) — The page size
  was previously hardcoded to 10 internally and the `pageSize` input was ignored
  (it only appeared to work because both defaulted to 10). It is now seeded from
  the input (overridable by the page-size dropdown).
- **Table stories: unreadable names in dark mode** — the demo `user` cell
  templates referenced a non-existent `--lc-text-primary` token and fell back to
  a near-black colour; they now use the semantic `--color-text-*` tokens.

## [2.3.0] - 2026-06-26

### Added

- **Chat: semantic message status** (`lc-chat`) — A new optional
  `ChatMessage.status` (`'default' | 'info' | 'success' | 'warning' | 'error'`)
  marks a message semantically, **orthogonal to `role`** (role = *who* speaks,
  status = *what kind* of message). A `role: 'agent'` reply can now be
  `status: 'error'` (failed) or `status: 'success'` (tool finished) without
  overloading `role`.
  - **Rail icon + colour** — a non-default status replaces the rail dot with a
    semantic icon coloured by the matching token (`--color-info-500`,
    `--color-success-500`, `--color-warning-500`, `--color-error-500`), reusing
    the `lc-alert` icon vocabulary.
  - **Accessible by default** — colour is never the only signal: each status
    pairs the icon with a visually-hidden label. `error` renders the message as
    `role="alert"` / `aria-live="assertive"`; `info`/`success`/`warning` use
    `aria-live="polite"`.
  - **`error` never pulses**, even while `streaming`.
  - **Fully backward compatible** — omitting `status` (or `'default'`) is
    pixel-identical to the previous role-coloured output. A status marker is
    still surfaced when `showAvatars` is `false`, so an error can't go unseen.
  - See the new *Semantic status* Storybook story.

## [2.2.1] - 2026-06-26

### Fixed

- **Chat timeline rail no longer runs into empty space** (`lc-chat`) — The rail
  is now drawn as connectors between adjacent dots instead of one continuous
  line spanning the whole thread. A lone message (e.g. a single bottom-anchored
  greeting) now shows just its dot with no line trailing up into the empty area,
  and user boxes still break the rail cleanly.

## [2.2.0] - 2026-06-26

### Changed

- **Chat redesigned to a document / timeline look** (`lc-chat`) — The
  conversation now reads as a single full-width column with a vertical timeline
  rail:
  - **Role-coloured rail dots** — each agent/system turn sits on the rail with a
    coloured dot (agent = primary, system = muted). The agent dot emits a soft
    pulse while streaming. `showAvatars` toggles the rail markers (a message
    `avatar` URL still renders a small image in place of the dot).
  - **User messages as a rail-interrupting box** — instead of a saturated
    right-aligned bubble, a user turn is now a full-width surface box (with name
    + timestamp header) whose solid background breaks the rail line.
  - **System / "thought" messages are de-emphasised** (muted text) so real
    messages read more clearly.
  - **Composer** is a single rounded box with an **auto-growing** textarea that
    hugs its content (grows to a max, then scrolls) and an action row (attach
    left, send right as a rounded square). Flatter surfaces throughout, all
    spacing/typography driven by tokens.
  - This changes the default chat appearance. Existing inputs, outputs, events
    and the `messageTemplate` slot are unchanged.

### Added

- **Chat: `contentWidth` input** (`lc-chat`, `'full' | 'narrow'`, default
  `'full'`) — `'full'` spans the available width; `'narrow'` constrains the
  thread and composer to a centered reading column (~46rem).

## [2.1.0] - 2026-06-26

### Added

- **PageLayout component (`lc-page-layout`)** — New full-height page shell that
  pins a header (and optional footer) while the body fills the remaining height
  and scrolls internally — the page itself never scrolls. Encapsulates the
  full-height "height chain" (`100dvh` / `100%`, `overflow: hidden`, and the
  `min-height: 0` flex trick) so it doesn't have to be rebuilt per app. Inputs:
  `fill` (`'screen'` = `100dvh` for the page root, `'parent'` = `100%` when
  nested below an app shell), `scrollBody` (default `true`), and `padded`
  (density-aware body padding, default `false`). Content projects into three
  slots: `[layout-header]` (pinned top), default (scrolling body), and
  `[layout-footer]` (pinned bottom). Exported via the main barrel together with
  the `PageLayoutFill` type.
- **Chat: `bordered` input** (`lc-chat`, default `true`) — Set `false` to render
  the chat flush/edge-to-edge without its own border + rounded corners, e.g. as
  the full-height body of an `<lc-page-layout>` sitting directly under a page
  header without a nested card border.
- **Chat: `messageAnchor` input** (`lc-chat`, `'top' | 'bottom'`, default
  `'top'`) — `'bottom'` anchors a short conversation to the bottom of the
  message area (empty space above), like most messaging apps. Implemented with a
  collapsing `margin-top: auto` on the first message so the top stays reachable
  once messages overflow (unlike `justify-content: flex-end`, which clips
  overflow).
- **Page header: `noPaddingX` input** (`lc-page-header`, default `false`) —
  Removes the header's own horizontal padding so its content sits flush with the
  container edge; use when the header already lives inside a padded wrapper
  (e.g. `<lc-container>`) to avoid a double inset.
- **Storybook** — New `Layout/PageLayout` stories (Scrolling Content, Chat full
  height, With Footer) and new `lc-chat` stories (Bottom-anchored, Borderless).
- **Docs** — New `Layout/Full-Height Pages` guide covering the height-chain
  principle, the `lc-page-layout` API, full-screen and nested app-page recipes,
  the app-shell height requirement, and a troubleshooting table.

### Changed

- **Page header now self-pads horizontally** (`lc-page-header`) — The header
  previously had only vertical padding, so its content sat flush against the
  container edge. It now applies density-aware horizontal padding by default
  (matching `lc-section`), driven by the `--lc-density-padding-*` tokens. The
  divider (when `showDivider` is set) still spans the full width — only the
  content is inset. **Potential impact:** if you already place `lc-page-header`
  inside a horizontally padded container you may now see a double inset; opt out
  with `[noPaddingX]="true"`.

## [2.0.2] - 2026-06-24

### Fixed

- **Fluid chart width** — All chart components now fill their container width
  automatically via `ResizeObserver`. Previously, charts rendered at a fixed
  pixel width (default 400 px) regardless of the card or layout slot they were
  placed in, because the SVG coordinate system was driven by a static `width`
  input. Charts now observe their host element and recompute all internal
  coordinates (plot area, grid lines, bars, dots, axes) whenever the container
  resizes. The `width` input is retained as an initial fallback value used
  before the first observation fires.

  Affected components: `lc-area-chart`, `lc-bar-chart`, `lc-line-chart`,
  `lc-stacked-bar-chart`, `lc-waterfall-chart`, `lc-funnel-chart`,
  `lc-sparkline`.

- **Chart host display** — All chart host elements (`lc-*-chart`, `lc-sparkline`)
  now declare `display: block` so they participate in normal block layout and
  can receive an explicit width from their parent. Previously the `inline-flex`
  / `inline-block` default caused the host to shrink-wrap its SVG content
  instead of stretching to fill the available space.

  Affected components: all of the above plus `lc-pie-chart`, `lc-donut-chart`,
  `lc-radar-chart`, `lc-gantt-chart`.

## [2.0.1] - 2026-06-24

### Added

- **StageList component (`lc-stage-list`)** — New data-display component for
  pipeline/status distributions with one row per stage (dot, label, optional
  value, optional proportional bar). Supports `stages`, shared normalization
  via optional `max`, `showValue`, `showBar`, compact `size` (`sm`/`md`),
  `clickable` rows with `stageClick`, and `emptyText` for empty datasets.
- **Exported public types** — `StageItem` and `StageListSize` are part of the
  package API and exported via the main barrel.
- **Storybook coverage** — Added dedicated stories for Default, AllZero,
  SingleStage, Clickable, NoBar, Small, LongLabels and SharedMax.

### Changed

- **Accessibility and interaction defaults** — Stage rows render with list
  semantics (`role="list"` / `role="listitem"`); clickable mode uses keyboard
  accessible buttons and emits the full `StageItem` payload.

### Fixed

- **Width normalization edge cases** — Fill width calculation now guards against
  invalid/zero max values, clamps percentages to `0..100`, and guarantees a
  minimum visible fill (`2px`) for non-zero values.
- **Color fallback behavior** — Missing stage color now consistently falls back
  to `--lc-color-primary-500` (with `--color-primary-500` fallback).

### Tests

- Added unit tests for width math (`max` resolution + guard), zero/empty data,
  click emission, and color fallback.

## [2.0.0] - 2026-06-24

**Design System 2.0 — a dark-first visual redesign of the entire component library.**

The look is rebuilt around a distinctive, teal-tinted dark aesthetic (gradient
surfaces, a teal accent line on cards, layered glow shadows, semantic status
colors, pill controls). All ~90 components were migrated onto a single semantic
token layer so a component recipe renders correctly in both themes. The brand
color palette is unchanged.

### Added

- **Dark-first token & theme foundation** — teal-tinted dark surfaces
  (`--color-surface`, `--color-surface-2`, `--color-surface-sunken`), gradient
  surface (`--gradient-surface`), translucent borders (`--color-border`,
  `--color-border-strong`), brighter dark text (`--color-text-primary/secondary/
  tertiary`), and visual primitives: `--accent-line`, `--gradient-text`,
  `--gradient-brand-tile`, `--shadow-brand-glow`, `--shadow-glow`,
  `--app-background-image` (radial teal/violet glows for the app shell).
- **Solid brand-fill tokens** — `--color-primary-fill`, `--color-secondary-fill`,
  `--color-error-fill` (+ `-hover`/`-active`) and `--color-on-primary`/
  `-on-secondary`/`-on-error` ink, so primary/secondary/danger buttons stay
  high-contrast in both themes.
- **Semantic color scale aliases** — `--color-{success,error,warning,info}-{50,
  100,500,600,700}` now resolve onto the canonical semantic shades.
- **Shared SCSS mixins** (`src/styles/_mixins.scss`) — `focus-ring`, `elevation`,
  `card-surface`, `gradient-text`, `glow`, `pill`, `kicker`, `brand-tile`.
- **Reproducible token build** — pinned `style-dictionary@4.4.0` + the
  `build:tokens` nx target (the lib `build` depends on it).
- **Working theme service** — dark default with a real `setTheme`/`toggleTheme`/
  `useSystemPreference` toggling the `.dark`/`.light` class on `:root`.

### Changed

- **Dark is the default theme.** `:root.dark, :root:not(.light)` makes dark the
  default look; `.light` is the explicit opt-in.
- **Theme switching standardized on the `.dark` class.** ~52 components gated
  dark styling on `[data-theme='dark']` (and `:host-context([data-theme])`),
  which the service never set — that dark CSS was dead code. All reconciled to
  the real `.dark` class; redundant/inverted dark blocks removed.
- **Border-radius scale enlarged** (`sm` 10px, `md` 12px, `lg` 18px, `xl` 24px,
  `2xl` 32px) and **elevation deepened** to layered, pitch-grade shadows.
- **Components migrated to semantic tokens** across all buckets — surfaces,
  pills/badges/chips/status, buttons & interactive controls, form inputs,
  feedback, overlays, charts, typography/brand. `sidenav` and `header` are now
  dark-first with `--light` opt-in modifiers; `chat` adopts a Claude-style
  layout (assistant messages render full-width without a bubble).
- **Icons resolve from the Tabler icon set.** Components reference Heroicon
  names; the served set is Tabler. The `iconAliasMap` now translates Heroicon →
  Tabler names so icons load over HTTP (previously many resolved to the `X`
  fallback).

### Fixed

- Many **non-existent token references** that silently rendered nothing or wrong
  values: `--color-text` → `--color-text-primary`, `--elevation-xl/lg/md/sm` →
  `--elevation-4/3/2/1`, `--radius-*` → `--border-radius-*`, `--color-white` →
  `--color-neutral-white`/surface, `--color-danger-*` → `--color-error*`,
  `--color-neutral-950/0`, `--color-warning-400`, `--shadow-lg`.
- **Frozen light surfaces** that stayed white in dark mode (compile-time
  `colors.$color-neutral-*` and hardcoded `#fff`/pastels) in code-block,
  document-viewer, file-upload, search-input, toolbar, log-viewer, timeline,
  table, kanban, gantt.
- **Input consistency** — search-input and other fields now match the canonical
  input field (raised surface, hairline border, teal focus).
- date-range-picker uses a real `lc-icon` instead of a hardcoded emoji.

### Migration

This is a major release. Consumer apps (Cockpit, …) should:

- **Choose a theme explicitly.** Apps that set no theme now render dark. To keep
  the old light look, add the `light` class to `<html>` or call
  `themeService.setTheme('light')` (now functional).
- **Replace any manual `data-theme="dark"` toggling with the `.dark` class** (or
  use the theme service). This is the most likely silent breakage.
- **Set `--app-background-image`** on the app shell (`<body>`/root) for the
  radial-glow background.
- Expect **enlarged radii / deeper shadows / changed semantic surface, text and
  border values**; a few components changed their default variant look.
- Ensure global styles `@use` the kit's `src/styles/index.scss`.

## [1.11.11] - 2026-06-23

### Added

- **Table row actions column (`lc-table`)** — New `actions` input renders a trailing actions column with per-row buttons (e.g. Freigeben / Ablehnen). Each `TableAction` supports `key`, `label`, `icon`, `variant`, `tooltip`, and per-row `hidden`/`disabled` predicates. Omit `label` for compact icon-only buttons. Configure the column via `actionsLabel`, `actionsWidth`, and `actionsAlign` (`start` | `center` | `end`) — the header label follows the same alignment as the buttons. Clicks emit `actionClick` (`{ action, row, rowIndex }`) with the paginate-safe absolute row index, and stop propagation so they never trigger the row's `rowClick`.

## [1.11.10] - 2026-06-23

### Added

- **TreeView component (`lc-tree-view`)** — New component for visualizing file/folder hierarchies, designed to render a complete GitHub project. Renders a recursive `TreeNode[]` structure with expand/collapse folders, expand-all/collapse-all, two-way bound `selectedId`, a `nodeClick` output, indentation guide lines, and optional git-style status badges (added/modified/removed).
- **Automatic file-type icons** — Files resolve a Tabler icon by well-known file name (`package.json`, `Dockerfile`, `README.md`, …) and by extension (`.ts`, `.json`, `.scss`, `.py`, `.md`, `.png`, `.svg`, `.zip`, …), with open/closed folder icons. Per-node `icon` overrides are supported. Resolution is exposed via the standalone `resolveFileIcon` helper.

## [1.11.9] - 2026-06-19

### Changed

- **FilterBar uses LC Select component** — Replaced native `<select>` usage in `lc-filter-bar` with `<lc-select>` so filter controls consistently use design-system components and styling.
- **FilterBar search uses LC SearchInput** — Replaced the native search `<input>` in `lc-filter-bar` with `<lc-search-input>` for consistent behavior and styling.
- **NotificationCenter search uses LC SearchInput** — Replaced the native search `<input>` in `lc-notification-center` with `<lc-search-input>`.
- **Table page size uses LC Select** — Replaced native pagination page-size `<select>` in `lc-table` with `<lc-select>`.
- **Table column filters use LC Input** — Replaced native text filter `<input>` fields in `lc-table` with `<lc-input>`.

### Fixed

- **Search icon fallback regression** — Added a compatibility icon alias mapping `magnifying-glass` to Tabler `search` so existing usages render the correct search icon instead of the fallback `X` icon.

## [1.11.8] - 2026-06-18

### Added

- **Table cell styling API** — `TableColumn` now supports `cellClass` and `cellStyle` (static or callback-based) for per-cell conditional styling.

### Docs

- **Table stories restored and expanded** — Revalidated `WithCellFormatting`, `WithBadgesAndAvatars`, `EnterpriseUsers` and added `WithCellFormattingAndStyling` to document formatter + styling usage in Storybook.
- **README update** — Table feature summary now explicitly includes cell styling hooks.

## [1.11.7] - 2026-06-18

### Fixed

- **npm publish build failure** — Moved `mermaid` back from `dependencies` to optional `peerDependencies` to satisfy ng-packagr packaging rules (`allowedNonPeerDependencies`) and unblock release publishing.

## [1.11.6] - 2026-06-18

### Fixed

- **Release consistency** — Cut a fresh patch release so npm/docs publishing can run on a new immutable version after `v1.11.5` retagging.

### Notes

- **Table formatter API remains available** — `TableColumn.formatter(value, row, column, rowIndex)` is part of the published package types.
- **Stories are docs artifacts, not npm artifacts** — Story files are published to Storybook docs, not shipped inside the npm library tarball.

## [1.11.5] - 2026-06-18

### Added

- **Table cell formatter API** — `TableColumn` now supports a `formatter(value, row, column, rowIndex)` callback for per-column display formatting when no custom template is provided.
- **Table Storybook examples** — Added `WithCellFormatting`, `WithBadgesAndAvatars`, and `EnterpriseUsers` stories to demonstrate formatter callbacks and composed cell templates (avatar, badges, chips, action buttons).

### Docs

- **Table component docs expanded** — Updated `TableComponent` API docs and Storybook feature descriptions to document formatter callbacks and composed cell patterns.
- **Library README update** — Table component description now explicitly mentions sorting, filtering, pagination, formatter callbacks and custom cell templates.

## [1.11.4] - 2026-06-08

### Changed

- **Icon source migration** — `lc-icon` now resolves SVGs from Tabler Icons (`/tabler-icons/{outline|filled}`) instead of Heroicons, with existing `variant="solid"` mapped to Tabler `filled` assets.
- **Asset wiring updated** — Demo build and Storybook static asset mounts now serve Tabler icon files from `@tabler/icons/icons`.
- **Docs aligned** — Component/story/demo descriptions were updated from Heroicons wording to Tabler Icons terminology.

### Fixed

- **Storybook icon browser coverage** — `All Icons` in Icon stories now reads the installed Tabler catalog dynamically (instead of a hardcoded 324-item preset), so the displayed icon count stays accurate after package updates.

## [1.11.3] - 2026-05-27

### Fixed

- **Mermaid peer dependency** — Declared `mermaid` (`^11.0.0`) as an optional peer dependency so consumers get a proper install hint when using Mermaid blocks in `lc-markdown`. The dynamic `import('mermaid')` already falls back gracefully when the runtime is missing.

## [1.11.2] - 2026-05-27

### Added

- **Markdown Mermaid support** — Fenced code blocks with language `mermaid` are now rendered as diagrams in `lc-markdown`.
- **Storybook example** — Added a small `MermaidSupport` story to validate Mermaid rendering with a minimal flowchart.

### Fixed

- **Code block readability** — Prevented inline markdown `code` styles from overriding `lc-code-block` text color in dark code panels.
- **Mermaid SVG rendering** — Preserved Mermaid-generated SVG styling so shapes/edges render correctly (not labels-only).
- **Typing regression** — Corrected markdown parse fallback typing for code/mermaid blocks (`kind` field), fixing TypeScript build errors.

## [1.11.1] - 2026-05-26

### Changed

- **Sidenav brand row polish** — The new collapse chevron in the logo area is now visually quieter and better balanced (smaller ghost-style control, refined spacing).
- **Brand logo hit area refinement** — In expanded mode the logo click area now wraps the logo content instead of stretching across most of the row, which removes the awkward "large empty clickable area" effect.
- **Collapsed rail logo sizing/alignment** — In collapsed mode the brand emblem now uses compact `sm` size and the logo row removes horizontal padding, so the emblem is centered correctly inside the 56px rail.

### Docs

- **Stories + component docs synchronized** — Updated Sidenav Storybook descriptions and `SidenavComponent` JSDoc example to reflect current behavior (dedicated chevron collapse control in brand row, current signal-based input names).

## [1.11.0] - 2026-05-26

### Added

- **Chat file upload** — `<lc-chat>` gains optional file attachments via paperclip button: new inputs `allowFileUpload`, `accept`, `multiple`, `maxFileSize`, new output `fileAttach`, new types `ChatAttachment` / `ChatFileAttachEvent`. Pending attachments render as chips above the input row; image attachments show thumbnail previews inside the message bubble. New story *With File Upload* + updated JSDoc with two `@example` blocks.
- **Custom brand support in `<lc-logo>`** — New inputs `src`, `emblemSrc`, `darkSrc`, `darkEmblemSrc` so consuming apps can drop in their own brand assets without forking. Theme-aware dark variants are wired up via `<picture>`. Auto-invert CSS filter is now applied **only** to the built-in Life-Cockpit assets so custom logos never get color-shifted.
- **`LC_LOGO_BASE_PATH` injection token** — Overrides the default `/assets` prefix used to resolve the built-in Life-Cockpit logo files (e.g. for apps serving static files from `/static` or `/ui-kit`).
- **Logo sizes `xs` and `xl`** — `<lc-logo size>` now accepts the full `xs | sm | md | lg | xl` scale (was `sm | md | lg`).
- **Header `logoSize` input** — Forwarded to inner `<lc-logo>` (`xs | sm | md | lg | xl`). New story *Logo Sizes* renders all five variants.
- **Header `size` input** — Explicit header height (`sm` 56px · `md` 64px default · `lg` 80px · `xl` 112px). Useful to align the header with a sidenav brand block in sidebar-first layouts. Class-based (`lc-header--size-*`), independent of any inner logo.
- **Sidenav `logoSize` input** — Controls the brand-block height in sidebar-first layouts (`xs | sm | md | lg | xl`, **default `md` = 64px** so the brand block lines up with `<lc-header size="md">` out of the box). New story *Sidebar-First Layout (Prominent Brand)* showcases the `lg` (80px) variant.

### Changed

- **Header height now honored exactly** — Removed vertical padding on `.lc-header`; content (profile trigger, context info, hamburger) is centered via flexbox so `min-height` actually drives the height instead of being inflated by the avatar/button. Net effect: default header is now exactly 64px tall.
- **Sidenav brand-block alignment** — `.lc-sidenav__logo` height scale realigned with `<lc-header size="*">` (sm 56 / md 64 / lg 80 / xl 112). Switched from view-encapsulation-fragile `:has(.lc-logo.size-*)` selectors to explicit `lc-sidenav__logo--size-*` host classes so the heights work reliably regardless of where the `.lc-logo` element lives.
- **Sidenav collapsed logo padding** — In collapsed (icon-rail) mode the logo container now uses horizontal-only padding so its `min-height` reflects the configured size instead of being pushed taller by extra vertical padding.
- **Sample app layout** — Restructured to sidebar-first: full-height `lc-sidenav` with brand block on top (dark theme), `lc-header` to the right with `[showLogo]="false"`.
- **Removed obsolete asset** — `life-cockpit-logo_old.svg` deleted from `libs/angular-ui-kit/src/assets/`.

### Fixed

- **Sidenav / Header height mismatch in sidebar-first layouts** — The brand block on the sidenav and the header next to it are now pixel-aligned at the same height for every matching pair (`logoSize="md"` ↔ `size="md"`, `logoSize="lg"` ↔ `size="lg"`, …).

## [1.10.1] - 2026-05-20

### Changed

- **`@life-cockpit/angular-ui-kit` npm README** — Replaced minimal placeholder with the full library overview (links to public docs, MCP server snippet, density token usage, theming and density notes).

## [1.10.0] - 2026-05-20

### Added

- **Density token system** — New CSS custom property scale (`--lc-density-gap-{xs,sm,md,lg,xl}`, `--lc-density-padding-{xs,sm,md,lg,xl}`, `--lc-density-section-gap`) wired to a single `data-density="compact|cosy|comfortable"` attribute. Setting it on any ancestor rescales every density-aware component beneath it without template changes. Cosy is the default and matches the previous visual rhythm exactly (zero pixel shift on upgrade).
- **PageHeaderComponent** — Page-level title block with slots for trailing actions and a short header-internal description. Distinct from `lc-header` (app chrome) and `lc-toolbar` (control bar).
- **ToolbarComponent** — Reusable horizontal control bar with `start` / default / `end` slots; auto-collapses empty slots; `density`, `background`, `border`, `align`, `wrap` and `sticky` inputs.
- **Density showcase stories** — Four new entries under **Design Tokens / Density**: side-by-side cascade, full-width stacked comparison, live token-value inspector, and local-override demonstration.
- **Density Tokens section in spacing docs** — Three tables (gap, padding, section-gap) × three density modes with semantic mapping and four rules of thumb.

### Changed

- **24 components made density-aware** — Layout rhythm (gap, padding) of `card`, `container`, `section`, `stack`, `page-header`, `toolbar`, `spacer`, `list`, `menu`, `breadcrumbs`, `tabs`, `alert`, `toast`, `pagination`, `input`, `textarea`, `datepicker`, `select`, `modal`, `header`, `table`, `rich-text-editor`, `sidenav`, and `footer` now reads from `--lc-density-*` with safe fallbacks to the original `--spacing-*` tokens. Cosy defaults preserve current visuals.
- **`libs/angular-ui-kit/src/styles/index.scss`** — Now imports `@angular/cdk/overlay-prebuilt.css` so the `.cdk-overlay-transparent-backdrop { opacity: 0 }` reset is present in every consuming app/Storybook.

### Fixed

- **Select / Datepicker backdrop flash** — `ModalComponent` is rendered with `ViewEncapsulation.None`; its SCSS rule that targeted `.cdk-overlay-backdrop` was leaking globally to every CDK overlay and showing a brief grey flash on Select, Datepicker, Menu and Tooltip dismissal. Removed the leak and scoped the modal backdrop to its own `.lc-modal-backdrop` class, while ensuring the official CDK overlay reset is loaded globally.
- **`lc-select` dead style removed** — `.lc-select__option--focused` rule was unused (template emits `--highlighted`).
- **`lc-page-header` JSDoc + story imports** — Description corrected to match supported slot content; unused `BadgeComponent` import removed from stories.

## [1.9.0] - 2026-05-15

### Added

- **AccordionGroupComponent** — Wrapper component that coordinates multiple `<lc-accordion>` children; supports single-expand (default) and multi-expand modes via `[multi]` input; includes `collapseAll()` / `expandAll()` programmatic API

### Changed

- **Accordion styling refresh** — Smoother 300ms cubic-bezier transitions for expand/collapse; CSS grid-based height animation (content always in DOM); chevron rotates instead of swapping icons; staggered opacity/translateY fade-in for body content; subtle box-shadow on outlined variant with elevated hover state; refined spacing and border-radius

### Fixed

- **Sidenav stories** — Replaced invalid `themeValue` arg with correct `theme` input name
- **Sample app bindings** — Updated breadcrumbs, pagination, and sidenav examples to use new signal input names (removed `*Input` suffix)

## [1.8.0] - 2026-05-14

### Changed

- **Signal API migration** — Header, Tabs, Menu, Logo, Breadcrumbs, Pagination, Sidenav, and Table-cell directive migrated from `@Input()`/`@Output()` to `input()`/`output()`/`model()`/`computed()`; Sidenav input names simplified (removed `*Input` suffix)
- **CommonModule removed** — 25 components no longer import `CommonModule`; 8 components replaced with standalone `NgClass`, `NgTemplateOutlet`, or `NgStyle` imports
- **Track expressions simplified** — Chat (`track msg.id`), Kanban Board (`track col.id`/`track card.id`); removed unused `trackBy` helper methods
- **Pagination duplicate key fix** — Changed `track page` to `track $index` to avoid NG0955 warning with ellipsis entries

## [1.7.0] - 2026-05-13

### Changed

- **Button migrated to signal APIs** — All `@Input()` decorators replaced with `input()`, `@Output() EventEmitter` replaced with `output()`, `isDisabled` getter replaced with `computed()`; removed duplicate `isLoading` input
- **Markdown `RenderPart.lang` typed** — Changed from `string` to `CodeBlockLanguage`, removing `$any()` cast in template

### Fixed

- **`track $index` → proper identity tracking** — Gallery (`track item.src`), Tag Input (`track tag`), Stepper (`track step.label`), Pagination (`track page`), Date Range Picker (`track day.date.getTime()`); improves re-render performance on list changes
- **`$any()` casts removed** — 6 templates (Table, Datepicker, Textarea, Filter Bar, Log Viewer, Markdown) now use typed `getInputValue()` helper instead of bypassing strict type checks

## [1.6.3] - 2026-05-13

### Fixed

- **Sidenav logo area height** — Fixed `height: 64px` to match the header; logo uses `sm` size (32px) so it fits without overflow; horizontal-only padding for clean alignment

## [1.6.2] - 2026-05-13

### Fixed

- **Sidenav parent active style** — Parent accordion items with an active child no longer receive the full active highlight (teal background); they now only show bold text, keeping the full active style exclusively on the directly active child item

## [1.6.1] - 2026-05-13

### Fixed

- **Sidenav dark theme contrast** — Lightened dark background (`#1e1e22`), hover (`#2a2a2f`), and added teal accent for active items (`--lc-sidenav-active-bg/fg/icon`) for better readability
- **Sidenav active item hover** — Active items no longer change color on hover (both light and dark themes)
- **Sidenav icon alignment** — Section action button (plus) and accordion action button (ellipsis) are now vertically aligned; section title line-height matches button height
- **Sidenav logo sizing** — Logo uses `md` size (48px) when expanded instead of `sm` (32px); logo area uses flexible min-height

### Changed

- **Sidenav documentation** — Comprehensive Storybook docs with full inputs/outputs table, `NavigationItem` interface shape, and theming token reference

## [1.6.0] - 2026-05-12

### Added

- **Sidenav responsive mobile mode** — Docked sidenav automatically switches to drawer mode below a configurable breakpoint (`mobileBreakpointInput`, default 768px); viewport changes detected via `matchMedia` listener; auto-closes drawer after item navigation on mobile
- **Sidenav `showLogo` with collapse toggle** — Optional logo area at the top of the sidenav (`showLogoInput`); displays full logo when expanded, emblem when collapsed; clicking the logo toggles collapsed state
- **Sidenav accordion expands collapsed sidebar** — Clicking a collapsible parent item in icon-rail mode automatically expands the sidebar and opens the group
- **Header `showLogo` input** — Allows hiding the logo in sidebar-first layouts where the logo lives in the sidenav
- **Header `showHamburger` + `hamburgerClick`** — Hamburger menu button for toggling the mobile drawer sidenav
- **Responsive story** — New "Responsive (Mobile View)" Storybook story demonstrating the mobile drawer behavior with hamburger toggle

## [1.5.0] - 2026-05-11

### Added

- **Sidenav `action`** — Optional action button on navigation items and section headers (visible on hover), emits `itemAction` event; supports sections, collapsible parents, and simple items
- **Sidenav `badge`** — Optional badge on navigation items for displaying counts or labels with color variants; positioned as overlay in collapsed icon-rail mode
- **Sidenav nested section children** — Section children can now be collapsible parents with their own children and actions (3-level nesting)
- **Sidenav collapsed tooltips** — Fixed tooltips for all item types in collapsed icon-rail mode

## [1.4.0] - 2026-05-11

### Added

- **Header `contextName` / `contextLabel`** — New clickable context area in the header (right side, next to profile menu) for displaying tenant, organization, project, or other contextual info; emits `contextClick` event for opening modals or navigation; long names are truncated with tooltip; hidden on mobile

## [1.3.1] - 2026-05-08

### Added

- **Chat `#messageTemplate`** — Custom content projection for chat messages via `@ContentChild('messageTemplate')`, enabling rich content like `<lc-diff-viewer>` or `<lc-markdown>` inside agent bubbles; new `data` field on `ChatMessage` for arbitrary metadata

### Fixed

- Markdown list bullets missing due to global CSS reset — restored `list-style: disc` / `decimal` inside `.lc-markdown`
- Markdown and Log-viewer `[innerHTML]` content unstyled — added `ViewEncapsulation.None` so dynamic HTML receives component styles
- Combobox story category mismatch (`Forms` → `Form`)
- Markdown story category mismatch (`Content` → `Components`)

## [1.3.0] - 2026-05-08

### Added

- **`<lc-markdown>`** — GFM markdown renderer with built-in parser (no external dependencies), fenced code block delegation to `<lc-code-block>`, heading anchors, link target control, compact variant, and `src` input for remote loading
- **`<lc-log-viewer>`** — Streaming log / terminal viewer with virtualized rendering, ANSI color parsing, level filtering, search with highlighting, auto-scroll, pause/resume, ring buffer, and `stream$` Observable input; supports `log` and `terminal` (Catppuccin) variants
- **`<lc-confirm-dialog>` + `ConfirmService`** — Standardized confirmation dialogs wrapping `<lc-modal>` with `default`/`destructive`/`warning` variants, auto-icon per variant, optional `requireText` matching, and an imperative `ConfirmService` with `confirm()`/`destructive()`/`warning()` returning `Promise<boolean>`
- **`<lc-combobox>`** — Async autocomplete with `ControlValueAccessor`, sync options + async `loadOptions` via rxjs debounce/switchMap, single/multiple selection, `allowCreate`, grouped options, keyboard navigation, and size variants

## [1.2.2] - 2026-05-08

### Fixed

- Ghost button variant ignores parent theme tokens — `.btn-ghost` now reads from `--lc-button-ghost-fg`, `--lc-button-ghost-hover-bg`, `--lc-button-ghost-hover-fg`, `--lc-button-ghost-active-bg` CSS custom properties (with neutral fallbacks), allowing any parent to retheme it
- Dark header hamburger invisible — header dark variant now maps `--lc-header-*` tokens onto `--lc-button-ghost-*` tokens for all child `lc-button` elements (hamburger, theme toggle, profile trigger), fixing both idle color and hover background

## [1.2.1] - 2026-05-08

### Fixed

- Dark header dropdown text invisible — menu header/user-name/email used `--lc-header-fg` tokens which resolve to white in dark mode, but the dropdown panel has a white background; switched to global theme tokens (`--color-text`, `--color-text-secondary`, `--color-divider`)
- Sidenav nav-item icons appear very pale — light-mode tokens referenced `var(--color-neutral-700)` which gets remapped in global dark mode; hardcoded light fallback values to prevent cross-theme bleed

## [1.2.0] - 2026-05-08

### Added

- **Component Theming API** — Header, Sidenav, and Logo now support a `theme` input (`auto`/`light`/`dark`) with internal CSS custom property tokens for fully independent theming
- **Card (Extended)** — Badge pill with 5 color variants (`info`/`success`/`warning`/`error`/`neutral`), `[card-header-action]` projection slot, header divider, larger title
- **Header `menuSize`** — New `menuSize` input (`sm`/`md`/`lg`) passed through to internal profile dropdown menu
- **MCP Server `search_component` Tool** — Custom tool for single-call component lookup by fuzzy name match, eliminating the 3-call pattern for LLM consumers
- **Component Theming Documentation** — New Section 6 in Getting Started docs with usage examples and token reference tables

### Fixed

- Dark header logo rendering (switched from `brightness(0) invert(1)` to `invert(1) hue-rotate(180deg)` to preserve detail)
- Dark header toggle icon visibility (explicit color inheritance for `lc-icon`/`svg` in dark scope)
- Dark header profile trigger border contrast
- Modal flickering in Storybook (template now uses internal `_open` signal; stories use trigger button pattern)
- Modal docs page rendering (stories use `inline: false` to prevent `position: fixed` clipping in docs canvas)
- Modal header/footer padding reduced for a more compact, polished appearance
- Modal header titles (`h1`–`h6`) now have scoped font-size/weight styling

## [1.1.1] - 2026-05-07

### Added

- **List (Extended)** — Rich item structure with avatar (image/initials), subtitle, description, trailing badges (5 color variants), metadata text, selected state, and three sizes (sm/md/lg)
- **Menu Size Variants** — New `size` input (sm/md/lg) for compact, default, and spacious menu layouts
- **Hero Variants** — Slim (compact) and light (pastel gradients) hero section variants
- **Sidenav Collapsed Mode** — Icon-rail collapsed state with tooltip labels

### Fixed

- Menu dropdown z-index raised to prevent rendering behind Storybook code blocks
- Menu story positions changed to `bottom-left` to prevent clipping
- Menu stories now include `min-height` to ensure dropdown visibility
- List card variant no longer forces vertical flex layout on items

## [1.1.0] - 2026-05-07

### Added

- **Rich Text Editor** — WYSIWYG/Markdown/Split mode editor with toolbar, ControlValueAccessor, word count
- **Table (Extended)** — Pagination, row selection, per-column filtering, inline cell editing
- **Scatter Plot** — Interactive scatter plot chart component
- **Funnel Chart** — Funnel visualization component
- **Tag Input** — Tag/chip input with autocomplete and validation
- **Date Range Picker** — Dual calendar range selection with presets
- **Diff Viewer** — Side-by-side and inline text diff comparison
- **Kanban Board** — Drag-and-drop board with columns, WIP limits, and card management
- **Notification Center** — Grouped notifications with mark-as-read, filtering, and actions

### Changed

- Reorganized Storybook sidebar: moved components to proper sections (Form, Data Display, Feedback, Navigation, Layout)
- Replaced emoji icons with `lc-icon` in Notification Center and Kanban Board
- Added comprehensive feature documentation (Key Features, argTypes, story descriptions) to all new component stories
- Added alphabetical sorting and section icons in Storybook sidebar
- Raised component style budget to 6kb/12kb (warning/error)

### Fixed

- Duplicate `getPopoverIcon()` method in sample sidebar
- Optional chaining in Kanban Board (`draggedCard()?.card?.id`)
- Chat component timestamp type (`null` → `undefined`)

## [1.0.1] - 2026-04-30

### Added

- Remote MCP server via AWS Lambda Function URL at `https://design.life-cockpit.de/mcp`

## [1.0.0] - 2026-04-29

### Initial Release

First stable release of the Life Cockpit Angular UI Kit.

#### Components (45+)

- **General**: Accordion, Button, Card, Icon, Logo, Menu, Typography
- **Form**: Checkbox, Datepicker, Email Input, Input, Password Input, Radio, Select, Switch, Textarea, Verification Code Input
- **Layout**: Container, Drawer, Section, Spacer, Stack
- **Navigation**: Breadcrumbs, Header, Pagination, Sidenav, Tabs
- **Data Display**: Avatar, Badge, Chip, Empty State, Field Group, Filter Bar, List, Metric Card, Skeleton, Spinner, Stepper, Table, Toggle Group
- **Feedback**: Alert, Error Display, Modal, Toast, Tooltip

#### Features

- Light and dark theme support with `ThemeService`
- Design tokens for colors, spacing, typography, elevation, sizes, and animations
- Global styles with CSS reset, typography, and utility classes
- Full standalone component support (Angular 21+)
- Storybook documentation for all components

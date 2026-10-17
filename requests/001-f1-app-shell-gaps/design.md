# Design 001: F1 app-shell gaps (AS-12, AS-13, AS-14, AS-15, AS-16)

- **Status:** revised (change notes below, review round 1, 2026-10-17)
- **Spec:** [spec.md](spec.md) — AC-1 … AC-28
- **Baseline:** 3.4.1 (lib unchanged at `315a8a0`). Shots, measurements, the story-ID list (824 IDs) and the MCP manifest (112 components, 1178 inputs) are in `tmp/story-shots/001/baseline/`.

## 0. The five decisions this design makes

| Spec question | Decision | Why |
|---|---|---|
| Secondary-entry layout (AC-15, AC-16) | **One entry per folder of `src/lib/`** (108 public entries named like the folder), plus `icon-names` (the name list, split out of `icon`) and three internal entries `internal/overlay`, `internal/chart`, `internal/url` (was `shared/`). 112 entries. Sources stay where they are; each entry is a one-line `ng-package.json` stub at `libs/angular-ui-kit/<entry>/` pointing at `src/lib/<entry>/index.ts`. The primary entry re-exports every public entry by package path. | The folder rule is predictable for consumers (`lc-icon` → `/icon`), the folder graph has no cycles (checked), and the stub layout was proven with ng-packagr 22.2.4 in a prototype (§3.4) without moving a single source file. |
| How fetched icons avoid every Trusted Types sink (AC-12) | Fetched SVG text goes through a **sink-free allow-list builder**: a small strict tokenizer that creates the SVG with `document.createElementNS` / `setAttribute` / `createTextNode`, accepting only `svg g path circle ellipse line polyline polygon rect text` and paint/geometry attributes. It never touches `parseFromString`, `innerHTML` or the `lc-icon` policy. The same builder renders bundled icons on the server. | No string-fed sink exists on that path, in any browser. XHR `responseType: 'document'` via a `blob:` URL would need `connect-src blob:` (life-os has `connect-src 'self'`), and CSS masks render no `<svg>` and can't detect the `index.html` fallback. Tabler 3.44 uses only `svg` + `path` (surveyed: 6,146 files, max 2.7 kB). |
| What icons do when the CSP refuses the policy (AC-11) | Every **bundled** icon renders the existing **placeholder** (dashed "?"), built by the same sink-free builder and decorated like the icon would have been (size, colour, `role="img"` + `aria-label` or `aria-hidden`). **One** console warning per page. No retry of `createPolicy`. | Rendering nothing would strip the accessible name of icon-only buttons (the label sits on the `<svg>`) and hide the misconfiguration. A visible placeholder plus one warning is the kit's "fail loud and safe" rule from 2.13.1. |
| Production handling of unknown names (AC-19) | **The list in development only.** Production checks the name's form (`^[a-z0-9]+(?:[-_][a-z0-9]+)*$`, ≤ 64 characters; all 5,161 names match), then requests a non-inline name **once per page**, validates the response, and renders the placeholder plus **one** warning per name if it is not an allow-listed SVG (404 included). | AC-18 forbids the list in any emitted `.js` file, so the "load the list lazily" alternative fails AC-18 (its lazy chunk is emitted) and costs an 18.7 kB request. With the 2.13.1 validation in place, one request per unknown name can't inject anything or shift the layout. |
| Sidenav current item when `activeRoute` is empty (AC-23) | **One source for the look and the announcement.** `routerLinkActive` goes; a computed *current item* drives both `--active` and `aria-current="page"`. `activeRoute` set: the first link (display order) whose `route` equals it. `activeRoute` empty: the router's URL path. The exact match wins, otherwise the longest link route that is a whole-segment prefix of the path (`/` matches only `/`). Ties go to the first in display order. | Exactly one current link (or none) in every state, and it looks current iff it is announced. `ariaCurrentWhenActive` alone would keep two mechanisms and let several prefix matches be current at once. |

## 1. Approach

**Extend, no new component.** The design follows existing patterns:

- **AS-12** follows `lc-provider-button`'s `loading`: `[attr.aria-busy]="busy() ? 'true' : null"`, a plain `input(false)` with no `booleanAttribute`, like every boolean input in the kit.
- **AS-14** keeps `lc-icon`'s public API, DOM and resolution order (hand-picked inline, then inlined Tabler, then fetch) and replaces only how markup becomes DOM:
  - one Trusted Types policy for the bundled constants;
  - the allow-list builder for everything else;
  - imperative insertion into the template's container `div` (no `[innerHTML]`, no `DomSanitizer`).
- **AS-15** follows Angular's own packaging (`@angular/common/http`: an `exports`-only subpath with `types` and `default`, no nested `package.json` in the published package). ng-packagr generates exactly that.
- **AS-16** keeps every class, token and selector of the sidenav (both `--active` and `[aria-current='page']` stay styled) and only changes who decides which link is current.
- **AS-13** needs no code change: `import('mermaid')` stays in `lc-markdown`'s entry, so only apps that reach that entry (or the primary entry) resolve `mermaid`.

## 2. Public API

| Kind | Name | Type | Default | Description (JSDoc) |
|---|---|---|---|---|
| input | `AppPageComponent.busy` | `boolean` (`input(false)`) | `false` | Marks the page as loading: `aria-busy="true"` on its `<main>` while `true`, no attribute while `false`. Set it while a skeleton stands in for the content. Screen readers may hold back changes inside a busy region until it clears, so a loading message that must be heard belongs outside `<main>` (for example a `.sr-only` `role="status"` next to the page) or is static text. No visual change. `@default false` |
| input (JSDoc only) | `SidenavComponent.activeRoute` | `string` | `''` | The current route. When set, the first link (in display order) whose `route` equals it is the current item: it alone gets `aria-current="page"` and the current look, whatever the router matches. When empty, the sidenav follows the router: the link whose route equals the URL's path is current, otherwise the one with the longest route the path starts with (`/household` on `/household/members`; `/` only on `/`). Routes are compared as written, so give them as absolute paths (`'/household'`). *(Last sentence: change note R1.)* `@default ''` |
| input (JSDoc only) | `SidenavComponent.items` | `NavigationItem[]` | `[]` | Replace the last sentence: "Items link with `routerLink`; exactly one link, the current item (see `activeRoute`), gets `aria-current="page"`." |
| JSDoc only | `IconComponent` class doc | — | — | Add a section **Trusted Types**: bundled icons go through one policy, `lc-icon`, created on the first icon render; it accepts only the kit's own SVG strings. Add `lc-icon` to the CSP's `trusted-types`. Fetched icons need no policy: they are rebuilt from an allow-list (basic shapes, paint and geometry attributes); anything else is dropped and shows the placeholder. Production checks names only by their form and requests a non-inline name once. |
| entry points | `@lifecorner/angular-ui-kit/<entry>` | `exports` subpath with `types` + `default` | — | 112 entries, listed in §3.4. Each public symbol is exported from exactly one entry. The primary entry keeps every symbol. |
| moved symbols | `ICON_NAMES`, `isValidIconName` | unchanged | — | Exported from `@lifecorner/angular-ui-kit/icon-names` (and the primary). `isValidIconName` JSDoc adds: "`lc-icon` uses it in development builds only, so production bundles leave the list out unless the app imports it." |
| CSS hook | none new | — | — | — |
| type | none new | — | — | No new exported type. The Trusted Types interfaces the icon needs are declared locally, not exported. |

**No new public symbol beyond `busy` and the subpaths.** The test helpers for the policy state stay unexported: tests import them from the icon folder by relative path.

**The default rendering stays unchanged:**

- `busy` defaults to `false`, which renders no attribute, so the DOM is identical (AC-2).
- `lc-icon` in the browser produces the same container and `<svg>` with the same attributes in the same order. The 3.4.1 DOM was measured (`components-icon--sizes` at 360 px): `xmlns, fill, viewBox, stroke-width, stroke, width=24px, height=24px, role=img, style="color: currentcolor;"`. Only the path from string to DOM changes (AC-9).
- The sidenav's current item, with `activeRoute` set to a link's route, looks and announces exactly as before. That is every story in the kit and life-os's shell.
- The primary entry exports the same names (AC-14).

The behaviour changes, all for the changelog under *Changed*:

1. On a page where the router matches a different link than `activeRoute`, only the `activeRoute` link looks current now.
2. With `activeRoute` empty and several router matches, only the deepest one looks current, and it now has `aria-current`.
3. Production fetches a non-inline unknown name once.
4. Fetched SVG is allow-listed.
5. Prerendered icons now carry their size and accessibility attributes.

## 3. Anatomy and layout

None of the five gaps adds a visual, so the wireframes below fix the values that must stay unchanged. The one new visual surface is the *Today (loading)* story.

### 3.1 `lc-app-page` busy: story *Today (loading, busy page)*

The skeleton mirrors life-os's `ShellSkeletonComponent` (Today, board t08) so the story shows the real page.

**360 px**

```
x 0                                                         360
┌────────────────────────────────────────────────────────────┐ y 0
│ [emblem] Produkt · Unser Haushalt                  (JA)    │ lc-header shell-header (transparent), 64
├────────────────────────────────────────────────────────────┤ y 64
│ <main id="main" class="lc-app-page__main" aria-busy="true">│ padding 24 · 24 · 16 (unchanged)
│ ┊ .sr-only "Heute wird geladen …" (static text, 0 px)      │
│ ┊ ▒▒▒▒▒▒▒▒▒▒▒▒▒▒                      45 % = 140 × 17, r 6  │ heading block, gap 12
│ ┊ ▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒              70 % = 218 × 42, r 8  │
│ ┊ ▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒                    50 % = 156 × 42, r 8  │
│ ┊                                     gap 24 (--lc-app-page-gap)
│ ┊ (●)(●) ▒▒▒▒▒▒▒                       34 circles, −4 overlap, 3 px ring in --color-background · 12 · 30 % × 20, r 6; row min-height 44
│ ┊ ▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒   312 × 96, r 24      │ the card
│ ┊ ▒▒▒▒▒▒▒▒▒ ▒▒▒▒▒▒▒▒▒ ▒▒▒▒▒▒▒▒▒       3 × 98.7 × 74, r 18, gap 8
│ </main>                                                    │ content x 24 → 336 (312)
│ horizon · floating lc-bottom-nav (unchanged)               │
└────────────────────────────────────────────────────────────┘
```

**From 1024 px (1280 px shown; no right column while loading)**

```
x 0        240                                                                   1280
┌──────────┬───────────────────────────────────────────────────────────────────────┐ y 0
│ header (full width), 64                                                          │
├──────────┼───────────────────────────────────────────────────────────────────────┤ y 64
│ sidenav  │ <main aria-busy="true">  padding 56 (1280) · 48 (1024)                │
│ docked   │        x 320 ┊ ▒▒▒▒▒▒▒▒▒▒▒ 45 % = 396 × 17                ┊ x 1200     │
│ 240 px   │              ┊ ▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒ 70 % = 616 × 42          ┊            │
│ "Heute"  │              ┊ ▒▒▒▒▒▒▒▒▒▒▒▒ 50 % = 440 × 42               ┊            │
│ current  │              ┊ gap 40                                      ┊            │
│          │              ┊ (●)(●) ▒▒▒▒ 30 % = 264 × 20   (member row at every width, as life-os's skeleton)
│          │              ┊ ▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒ 880 × 96, r 24 ┊            │
│          │              ┊ ▒▒▒▒▒▒▒▒ ▒▒▒▒▒▒▒▒ ▒▒▒▒▒▒▒▒ 3 × 288 × 74      ┊            │
└──────────┴───────────────────────────────────────────────────────────────────────┘
1024 px: main x 240, width 784, content x 288 → 976 (688)
1280 px: main x 240, width 1040, content max 880 centred → x 320 → 1200
```

| Element | Spacing / size | Type | Token |
|---|---|---|---|
| `<main>` | padding 24 / 48 / 56 at 360 / 1024 / 1280 (measured, unchanged) | — | `--lc-app-page-padding-*` |
| Column gap | 24 below 1024, 40 from 1024 (measured) | — | `--lc-app-page-gap` |
| Skeleton blocks | as in the wireframe | — | `--color-skeleton` / `--color-surface-2` (lc-skeleton's own) |
| Loading text | `.sr-only`, first child of the content | — | — |

`busy` itself changes no box: the `<main>` box at 360/1024/1280 must equal the one measured in *Today (desktop)* without an aside (x 0/240/240, padding as above).

### 3.2 `lc-sidenav` current item (unchanged look, one source)

The values were measured on 3.4.1 and must stay identical.

```
1280 px, variant transparent, docked (layout-app-shell--today-desktop)
x 0   24                         216  240
│     ╭──────────────────────────╮    │  current: 48 px pill, radius full, 16 px / 600,
│     │ ☼  Heute                 │    │  bg --color-surface-selected, ink --color-on-surface-selected,
│     ╰──────────────────────────╯    │  icon stroke 2.2; aria-current="page" + lc-sidenav__nav-item--active
│        ⌂  Haushalt                  │  other: 16 px / 500, --color-text-secondary, no attribute
                                         measured: pills x 24, width 192, y 112 and 164 (4 px apart),
                                         padding 0 16, icon–label gap 12, label x 72

360 px, drawer (navigation-sidenav--drawer-mode)
x 0 8                                   272
│   ╭──────────────────────────────────╮   current: 44 px, radius 12, 14 px / 600
│   │ ▣  Projects                      │   x 8, width 264 (measured)
│   ╰──────────────────────────────────╯
│     ⌂  Dashboard …                       other links: no aria-current
```

The rule, applied once per render in display order (top-level sorted by `displayOrder`, children in array order, depth first) over every link item (simple items, group children, section children, section grandchildren):

```
key = activeRoute() !== '' ? activeRoute()                      // exact string equality, as since 3.3.0
                           : path(router URL)                   // primary outlet, no query/fragment/matrix
current = first link with route === key
       ?? (activeRoute() === '' ? longest link route R ≠ '/' with key.startsWith(R + '/') : none)
```

- `--active` class **and** `aria-current="page"` are bound to `isCurrent(item)`, and only to it. `routerLinkActive` and `routerLinkActiveOptions` are removed from all four link templates; `routerLink` stays.
- `--has-active-child` and the auto-expansion of the group that contains the current link use the same current item, so a router-matched child's group opens too. Additive, as now: the user's own collapses survive.
- The router URL comes from a signal that holds `router.url` and updates on every `NavigationEnd`. Before the first navigation it is the router's initial URL (`/`), which is exactly what `routerLinkActive` saw in 3.4.1.
- *(Change note R1.)* Routes are compared **as written**, so the rule assumes absolute routes, as `NavigationItem.route` documents (`'/'`, `'/trading'`). A relative route (`'settings'`) never matches the router path when `activeRoute` is empty; 3.4.1's `routerLinkActive` resolved it and painted it. No known consumer uses relative routes (kit stories, life-os; lc-platform has its own sidenav). The `activeRoute` JSDoc says "absolute" so nobody relies on it.

### 3.3 `lc-icon` (unchanged DOM)

```
<lc-icon>                                         :host inline-flex, centred (unchanged)
  <div class="icon-container icon-md icon-outline" style="width: 24px; height: 24px;">
    <svg  …source attributes in source order…                ← exactly one child, always
          width="24px" height="24px"                         ← decoration, set in place
          role="img" aria-label="…" | aria-hidden="true"
          style="color: …">
      <path …/> …
```

Where the `<svg>` comes from:

| Source | Server (prerender) | Browser without `window.trustedTypes` (jsdom, older engines) | Browser with TT, policy created | Browser with TT, policy refused |
|---|---|---|---|---|
| Inline constant (hand-picked, inlined Tabler) | builder | `DOMParser.parseFromString(constant, 'image/svg+xml')` | `parseFromString(policy.createHTML(constant), …)` | placeholder via builder (one warning per page) |
| Placeholder | builder | as an inline constant | as an inline constant | builder |
| Fetched text | never fetched (as 3.4.1) | builder | builder | builder (no policy needed) |

- **Parse once per constant and clone per instance.** The browser path parses each distinct constant once (`DOMParser` → `document.importNode`), caches that element, and gives each instance `cloneNode(true)`. So `createHTML` runs once per distinct icon.
- **Build with the document, not the renderer.** Builder and decoration use `inject(DOCUMENT)` APIs (`createElementNS`, `setAttribute`, `style.color`, `createTextNode`, `appendChild`, `removeChild`). They do **not** use the component's `Renderer2`: under emulated encapsulation it stamps `_ngcontent-*` onto every node it creates, which would change the SVG's DOM.
- **Write the DOM during change detection.** Insertion runs in a component `effect` that reads the container `viewChild`, so it happens during change detection on the server too (`afterRender*` hooks don't run on the server). It removes the container's existing children (the prerendered `<svg>` after hydration) and appends the new one.
- **Re-decorate without rebuilding.** A change of `size`, `color`, `decorative` or `ariaLabel` re-decorates the existing element in place. It never rebuilds it or fetches again.
- **While loading, the container is empty.** For fetched icons it keeps its px size, as in 3.4.1.

### 3.4 Package anatomy (the entry layout)

```
libs/angular-ui-kit/
├─ ng-package.json, package.json         primary, unchanged (exports for entries are generated by ng-packagr)
├─ src/index.ts                          export * from '@lifecorner/angular-ui-kit/<entry>';  × 109 public entries
├─ src/lib/<entry>/index.ts              NEW: the entry's public API = today's index.ts lines for that folder
├─ src/lib/icon-names/                   NEW folder: icon-names.data.ts (moved from icon/), isValidIconName, index.ts
├─ src/lib/internal/{overlay,chart,url}/ was src/lib/shared/ (overlay-stack.service · chart-* · safe-url), each with index.ts
├─ <entry>/ng-package.json               NEW stub × 109: { "lib": { "entryFile": "../src/lib/<entry>/index.ts" } }
└─ internal/<x>/ng-package.json          NEW stub × 3:  { "lib": { "entryFile": "../../src/lib/internal/<x>/index.ts" } }

dist/libs/angular-ui-kit (published)
├─ fesm2022/lifecorner-angular-ui-kit.mjs           re-exports only: export * from "@lifecorner/angular-ui-kit/<entry>"
├─ fesm2022/lifecorner-angular-ui-kit-<entry>.mjs   × 112 (internal entries: …-internal-overlay.mjs etc.)
├─ types/lifecorner-angular-ui-kit[-<entry>].d.ts
├─ <entry>/package.json                             dev only, listed in the generated .npmignore (not published)
└─ package.json exports: "." · "./<entry>" × 112 (types + default) · "./styles" · "./styles/*" · "./icon-names.json" · "./package.json"
```

**The prototype** (scratchpad, ng-packagr 22.2.4, the repo's node_modules) built three entries with this exact stub layout:

- the module IDs came out as `@x/kit/icon` and `@x/kit/internal/overlay`;
- cross-entry imports stayed imports in the FESM;
- the primary FESM was `export * from "…/icon"`;
- `exports` was generated with `types` and `default`;
- the nested `package.json`s were npm-ignored.

A relative import across entries (`../icon/icon.component`) **failed the build** with `TS6059 … is not under 'rootDir'` (ng-packagr sets `rootDir` to the entry file's folder). That error is the guard against duplicated modules (AC-16).

**Rules for the developer:**

1. Every import across folders in library sources (not specs or stories) uses the package path `@lifecorner/angular-ui-kit/<entry>`. Imports within a folder stay relative.
2. `tsconfig.base.json` gets `"@lifecorner/angular-ui-kit/*": ["libs/angular-ui-kit/src/lib/*/index.ts"]` next to the existing primary mapping. That serves Jest (Nx resolver), Storybook and the IDE. ng-packagr adds its own exact mappings to the built `.d.ts`, which win over the wildcard.
3. ESLint `@nx/enforce-module-boundaries` flags self-imports by alias. Its secondary-entry detection looks for an `ng-package.json` next to the source, which the stub layout doesn't have. Set `allowCircularSelfDependency: true` for this project's sources (in `libs/angular-ui-kit/eslint.config.mjs`). The ng-packagr build stays the real guard.
4. A unit test asserts the stubs and folders match 1:1: every `src/lib/**/index.ts` that is an entry has its stub with the right `entryFile`, and vice versa.
5. `scripts/generate-icon-names.mjs` writes `icon-names.data.ts` into `src/lib/icon-names/`.
6. The cross-component spec `shared/i18n-labels.spec.ts` moves to `src/lib/` (it belongs to no entry).
7. Record the library build time before and after in `build.md`. 112 entries compile one after another.

**Rejected:** moving the sources into Nx-style `libs/angular-ui-kit/<entry>/src/` folders. It would break the layout that `CLAUDE.md` and the agent definitions in `.claude/agents/` reference, every relative SCSS path and `git blame`, and it buys only the lint detection that one option provides.

**The entries** (AC-15). Each public symbol appears in exactly one row. The dependencies are the folder graph measured from the imports; it has no cycles, and its maximum depth is 3 (`chat`, `document-viewer`).

| Entry `@lifecorner/angular-ui-kit/…` | Public symbols | Depends on entries |
|---|---|---|
| `tokens` | Color*, Spacing*, Typography*, Elevation*, BorderRadius*, Animation*, Size* (the generated constants) | — |
| `theme` | ThemeMode, ThemeConfig, ThemeState, ThemeService | — |
| `models` | NavigationItem | — |
| `accordion` | AccordionChevronPosition, AccordionComponent, AccordionGroupComponent, AccordionHeaderDirective, AccordionContentDirective | icon |
| `button` | ButtonVariant, ButtonSize, ButtonType, ButtonComponent, ButtonLinkComponent (`a[lcButton]`) | — |
| `card` | CardVariant, CardHeadingLevel, CardComponent | icon |
| `checkbox` | CheckboxSize, CheckboxComponent | — |
| `icon` | IconComponent, IconVariant, IconSize, IconName, isInlineIconName, ICON_ALIASES, resetIconWarnings, resetIconCache | icon-names (development only) |
| `icon-names` | ICON_NAMES, isValidIconName | — |
| `logo` | LC_LOGO_BASE_PATH, LogoComponent | — |
| `menu` | MenuItem, MenuComponent | icon, internal/overlay |
| `input` | InputAutocapitalize, InputEnterKeyHint, InputComponent | icon |
| `radio` | RadioSize, RadioGroupRegistry, RadioComponent, RadioGroupOrientation, RadioGroupComponent, RadioGroupContext, RADIO_GROUP | — |
| `typography` | TypographyComponent | — |
| `datepicker` | DateValue, DatepickerComponent | — |
| `select` | SelectOption, SelectOptionGroup, SelectValue, SelectComponent | — |
| `switch` | SwitchComponent | — |
| `textarea` | TextareaComponent | — |
| `password-input` | PasswordStrength, PasswordRequirement, PasswordStrengthMode, PasswordInputComponent | alert, icon, input |
| `verification-code-input` | VerificationCodeInputGap, VerificationCodeInputComponent | — |
| `email-input` | EmailInputComponent | input |
| `hero` | HeroColor, HeroSize, HeroVariant, HeroContentWidth, HeroComponent | — |
| `progress-bar` | ProgressBarColor, ProgressBarSize, ProgressBarVariant, ProgressBarComponent | — |
| `divider` | DividerOrientation, DividerVariant, DividerSpacing, DividerComponent | — |
| `search-input` | SearchInputSize, SearchInputComponent | icon |
| `file-upload` | FileUploadFile, FileUploadComponent | icon |
| `popover` | PopoverPosition, PopoverTrigger, PopoverComponent | internal/overlay |
| `provider-button` | ProviderButtonProvider, ProviderButtonText, ProviderButtonAppearance, ProviderButtonSize, ProviderButtonShape, ProviderButtonType, ProviderButtonComponent | — |
| `copy-field` | CopyFieldLayout, CopyFieldComponent | button, icon, input |
| `container` | ContainerSize, ContainerComponent | — |
| `page-header` | PageHeaderSize, PageHeaderComponent | icon |
| `page-layout` | PageLayoutFill, PageLayoutContentWidth, PageLayoutComponent | — |
| `section` | SectionSpacing, SectionBackground, SectionComponent | — |
| `spacer` | SpacerSize, SpacerComponent | — |
| `split-pane` | SplitPaneComponent | — |
| `stack` | StackDirection, StackGap, StackAlign, StackJustify, StackComponent | — |
| `toolbar` | ToolbarComponent | — |
| `alert` | AlertVariant, AlertActionsLayout, AlertComponent | icon |
| `error-display` | ErrorSeverity, ErrorDisplayComponent | alert |
| `toast` | ToastVariant, ToastPosition, ToastAction, ToastConfig, Toast, ToastService, ToastComponent, ToastOutletComponent | icon |
| `modal` | ModalSize, ModalPlacement, ModalComponent | icon, internal/overlay |
| `tooltip` | TooltipPosition, TooltipContentComponent, TooltipDirective | internal/overlay |
| `breadcrumbs` | BreadcrumbItem, BreadcrumbSize, BreadcrumbsComponent | — |
| `header` | HeaderNavItem, HeaderTitleTag, HeaderVariant, HeaderUserMenuTrigger, HeaderComponent | avatar, button, icon, logo, menu, theme |
| `pagination` | PaginationSize, PaginationComponent | — |
| `sidenav` | SidenavPosition, SidenavMode, SidenavVariant, SidenavComponent | badge, icon, logo, models |
| `tabs` | TabOrientation, TabComponent, TabsComponent | badge |
| `bottom-nav` | BottomNavItem, BottomNavVariant, BottomNavComponent | badge, icon |
| `app-shell` | AppShellComponent, AppPageComponent | — |
| `avatar` | AvatarSize, AvatarStatus, AvatarColor, AVATAR_MEMBER_COLORS, AvatarComponent | — |
| `badge` | BadgeVariant, BadgeSize, BadgeComponent | — |
| `status-dot` | StatusDotTone, StatusDotSize, StatusDotComponent | — |
| `toggle-group` | ToggleOptionDot, ToggleOption, ToggleGroupComponent | — |
| `list` | ListOrientation, ListVariant, ListItem, ListSize, ListComponent, ListItemTemplateDirective | avatar, button, icon |
| `chip` | ChipVariant, ChipSize, ChipComponent | icon |
| `table` | TableColumn, TableAction, TableActionsAlign, ActionClickEvent, SortEvent, CellEditEvent, SelectionChangeEvent, RowToggleEvent, TableTreeConfig, TableVariant, TableSize, TableComponent, TableCellDirective | button, icon, input, select |
| `field-group` | FieldGroupComponent | icon |
| `stepper` | StepperStep, StepState, StepperComponent | — |
| `filter-bar` | FilterConfig, FilterOption, FilterValues, FilterBarComponent | search-input, select |
| `spinner` | SpinnerSize, SpinnerComponent | — |
| `skeleton` | SkeletonVariant, SkeletonComponent | — |
| `empty-state` | EmptyStateSize, EmptyStateHeadingLevel, EmptyStateComponent | icon |
| `drawer` | DrawerPosition, DrawerSize, DrawerComponent | icon, internal/overlay |
| `timeline` | TimelineItemState, TimelineHeadingLevel, TimelineItem, TimelineOrientation, TimelineComponent, TimelineTemplateContext, TimelineContentDirective, TimelineMetaDirective | badge, icon |
| `avatar-group` | AvatarGroupItem, AvatarGroupComponent | avatar |
| `slider` | SliderComponent | — |
| `number-input` | NumberInputComponent | icon |
| `callout` | CalloutVariant, CalloutComponent | icon |
| `next-step-card` | NextStepCardTone, NextStepCardVariant, NextStepCardActionsLayout, NextStepCardTitleTag, NextStepCardActionSize, NextStepCardComponent | button, icon |
| `choice-prompt` | ChoicePromptOption, ChoicePromptSecondaryAction, ChoicePromptDecision, ChoicePromptSize, ChoicePromptComponent | button |
| `rating` | RatingSize, RatingComponent | icon |
| `color-picker` | ColorPickerComponent | — |
| `code-block` | CodeBlockLanguage, CodeBlockComponent | icon |
| `footer` | FooterLink, FooterSection, FooterVariant, FooterHeadingLevel, FooterComponent | icon |
| `sparkline` | SparklineColor, SparklineCurve, SparklineComponent | internal/chart |
| `stat-trend` | StatTrendDirection, StatTrendComponent | icon, sparkline |
| `donut-chart` | DonutSegment, DonutChartSize, DonutChartComponent | internal/chart |
| `bar-chart` | BarChartItem, BarChartOrientation, BarChartComponent | internal/chart |
| `line-chart` | LineChartSeries, LineChartComponent | internal/chart |
| `gauge` | GaugeColor, GaugeSize, GaugeComponent | internal/chart |
| `stacked-bar-chart` | StackedBarCategory, StackedBarLegend, StackedBarOrientation, StackedBarChartComponent | internal/chart |
| `area-chart` | AreaChartSeries, AreaChartComponent | internal/chart |
| `heatmap` | HeatmapCell, HeatmapComponent | internal/chart |
| `pie-chart` | PieSegment, PieChartSize, PieChartComponent | internal/chart |
| `radar-chart` | RadarChartSeries, RadarChartComponent | internal/chart |
| `progress-ring` | ProgressRingColor, ProgressRingSize, ProgressRingComponent | — |
| `waterfall-chart` | WaterfallItem, WaterfallChartComponent | internal/chart |
| `calendar` | CalendarView, CalendarLabels, CalendarEvent, CalendarComponent | — |
| `gantt-chart` | GanttDependency, GanttTask, GanttChartComponent | — |
| `chat` | ChatMessageRole, ChatMessageStatus, ChatRenderMarkdown, ChatAttachment, ChatMessage, ChatSendEvent, ChatFileAttachEvent, ChatComponent | icon, markdown (→ needs `mermaid` resolvable) |
| `document-viewer` | DocumentType, DocumentViewerComponent | code-block, icon, internal/url, markdown (→ `mermaid`), spinner |
| `gallery` | GalleryLayout, GallerySize, GalleryItem, GalleryComponent | icon, internal/url |
| `dependency-viewer` | DependencyNodeStatus, DependencyDirection, DependencyRelation, DependencyLayout, DependencyFitMode, DependencyEdgeDef, DependencyNode, DependencyViewerComponent | — |
| `tree-view` | TreeNodeType, TreeNodeStatus, TreeNode, TreeViewComponent, FOLDER_ICON, FOLDER_OPEN_ICON, FILE_FALLBACK_ICON, resolveFileIcon | icon |
| `scatter-plot` | ScatterPoint, ScatterSeries, ScatterPlotComponent | internal/chart |
| `funnel-chart` | FunnelStep, FunnelChartComponent | internal/chart |
| `tag-input` | TagInputComponent | — |
| `date-range-picker` | DateRange, DateRangePickerComponent | icon |
| `diff-viewer` | DiffViewMode, DiffViewerComponent | — |
| `kanban-board` | KanbanCard, KanbanLabel, KanbanColumn, KanbanMoveEvent, KanbanBoardComponent | icon |
| `notification-center` | NotificationType, NotificationPriority, Notification, NotificationCenterComponent | icon, search-input |
| `rich-text-editor` | RichTextEditorMode, ToolbarAction, ToolbarConfig, RichTextEditorComponent | internal/url |
| `markdown` | MarkdownHeading, MarkdownLinkClick, MarkdownRendered, MarkdownChangesHighlighted, RenderPart, MarkdownComponent | code-block, internal/url; `import('mermaid')` |
| `log-viewer` | LogLevel, LogViewerVariant, LogLine, LogViewerComponent | icon |
| `confirm-dialog` | ConfirmDialogVariant, ConfirmDialogButtonSize, RequireTextConfig, ConfirmDialogComponent, ConfirmOptions, ConfirmService | button, icon, input, modal |
| `combobox` | ComboboxOption, ComboboxValue, ComboboxSize, ComboboxComponent | chip, icon, spinner |
| `stage-list` | StageItem, StageListSize, StageListComponent | — |
| `description-list` | DescriptionListEmphasis, DescriptionListItem, DescriptionListLayout, DescriptionListSize, DescriptionListSeparator, DescriptionListComponent | — |
| `pipeline` | PipelineStatus, PipelineStep, PipelineOrientation, PipelineSize, PipelineComponent | icon |
| `internal/overlay` | OverlayStackService (internal; not in the primary entry; no semver guarantee) | — |
| `internal/chart` | chart-color, chart-palette, chart-path, chart-scale helpers (internal) | — |
| `internal/url` | safe-url helpers (internal) | — |

**Selectors whose entry isn't their own name** (for the docs table): `lc-app-page` → `app-shell` · `a[lcButton]` → `button` · `lc-toast`, `lc-toast-outlet`, `ToastService` → `toast` · `lc-radio-group` → `radio` · `lc-accordion-group` → `accordion` · `lc-tab` → `tabs` · `[lcTooltip]` → `tooltip` · `ConfirmService` → `confirm-dialog`.

**The F1 shell set's closure** (what life-os's eager route pulls in) is 20 entries: alert, app-shell, avatar, badge, bottom-nav, button, container, footer, header, icon, logo, menu, models, next-step-card, page-header, sidenav, skeleton, theme, toast, internal/overlay. `icon-names` is not among them in production.

## 4. States

### `lc-app-page`

| State | `<main>` | Notes |
|---|---|---|
| `busy` unset or `false` | no `aria-busy` attribute | identical to 3.4.1 |
| `busy` `true` | `aria-busy="true"` | nothing else changes: classes, `id`, aside, content (AC-2) |
| toggles true → false → true | the attribute follows each change | — |
| prerendered with `[busy]="true"` | `aria-busy="true"` in the HTML | AC-3 |

### `lc-sidenav`

These states are unchanged except for the rule:

| State | Expected |
|---|---|
| `activeRoute` = a link's route | that link alone: `aria-current="page"`, `--active`, the current look. Its group or section parent gets `--has-active-child` and opens |
| `activeRoute` = a route no link has | no current link, no `aria-current` anywhere |
| `activeRoute` set, the router on another link | only the `activeRoute` link is current (*Changed*: 3.4.1 also painted the router match) |
| `activeRoute` empty, URL `/` | the `/` link is current with `aria-current` (*Changed*: 3.4.1 painted it without the attribute) |
| `activeRoute` empty, URL `/household/members`, links `/household` and `/household/members` | only `/household/members` (*Changed*: 3.4.1 painted both) |
| `activeRoute` empty, URL `/household/members`, only `/household` is a link | `/household` (prefix match) |
| Two links with the same route | the first in display order |
| Hover on the current item | no hover colour change, as before |
| Focus-visible | unchanged ring |
| Collapsed rail (56 px) | the current icon tile looks as before; the label is in `title` |
| Drawer (below the breakpoint) | same rule; the drawer closes on item click as before |
| Long German labels (*Einstellungen des Haushalts*) | unchanged ellipsis or wrapping, not touched |

### `lc-icon`

| State | DOM | Console |
|---|---|---|
| Empty name | container with no child | — |
| Inline icon | one `<svg>`, decorated | — |
| Fetched, loading | empty container at its px size | — |
| Fetched, valid | one `<svg>` built from the allow-list | — |
| Fetched, `text/html` or not an SVG document | placeholder | the 3.4.1 non-SVG warning, once per name |
| Fetched, SVG outside the allow-list (`<script>`, `onload`, external `href`, `url(…)`, DOCTYPE, > 32 KiB, malformed) | placeholder; nothing of the response reaches the DOM | `… was dropped: <reason>`, once per name |
| Unknown name, development | placeholder, **no request** (as 3.4.1); `strict` throws | `Unknown icon …`, once per name |
| Malformed name (fails the form check), any mode | placeholder, no request | `Unknown icon …`, once per name |
| Unknown but well-formed name, production | empty container → one request per page → placeholder | non-SVG or `could not be loaded (404)`, once per name |
| Known name, asset fails (404, offline), development | placeholder | none (as 3.4.1) |
| Same, production | placeholder | `could not be loaded (…)`, once per name: production can't tell it from a typo |
| Trusted Types, policy refused | every **bundled** icon: placeholder, decorated; fetched icons render normally | one warning per page |
| Prerendered | the decorated `<svg>` is in the HTML (*Changed*: 3.4.1 rendered the bare constant) | — |
| After hydration | exactly one `<svg>` (the client's replaces the server's in the same task) | no NG05xx |
| `size`, `color`, `decorative`, `ariaLabel` change | re-decorated in place; no new request, no rebuild | — |

**Fetch cache.** It still holds one request per path per page, two retries for transient errors and no retry on 404. A **404 is now kept** in the per-path cache (previously evicted), so a later instance of the same missing name doesn't request it again. Transient failures are still evicted. If an existing test pinned re-requests after a 404, change it and give the reason in `build.md`.

### The allow-list builder (fetched SVG, and the server)

| Rule | Value |
|---|---|
| Input size | ≤ 32,768 characters (Tabler's largest is 2,666 bytes), else rejected |
| Prolog | an optional BOM, an optional `<?xml …?>` at the very start, whitespace, comments |
| Rejected anywhere | `<!DOCTYPE`, `<!ENTITY`, `<![CDATA[`, any other `<!…`, `<?` after the start, unbalanced or unclosed tags, unquoted or duplicate attributes, `<` inside a value, any entity other than `&amp; &lt; &gt; &quot; &apos;` and numeric references, nesting deeper than 16 |
| Root | exactly one element, `svg`; `xmlns` absent or `http://www.w3.org/2000/svg` |
| Elements | `svg` (root only), `g`, `path`, `circle`, `ellipse`, `line`, `polyline`, `polygon`, `rect`, `text`. **Any other element rejects the icon**, including `script`, `foreignObject`, `style`, `a`, `use`, `image`, `defs`, `animate*`, `set`, `filter` and prefixed names |
| Attributes kept | `xmlns` (root) · `viewBox width height preserveAspectRatio class` · `d points x y x1 y1 x2 y2 cx cy r rx ry transform pathLength` · `fill fill-rule fill-opacity clip-rule stroke stroke-width stroke-linecap stroke-linejoin stroke-miterlimit stroke-dasharray stroke-dashoffset stroke-opacity opacity color vector-effect shape-rendering` · `text-anchor dominant-baseline font-family font-size font-weight font-style letter-spacing` |
| Attributes that reject the icon | any name starting with `on` (any case); `href`, `xlink:href`, any `*:href`; any value containing `url(` or `javascript:` |
| Attributes dropped silently | everything else (`style`, `id`, `data-*`, `aria-*`, `role`, `focusable`, `version`, `xmlns:xlink`, `xml:space`, …). The component sets its own accessibility attributes |
| Text | only whitespace, except inside `text` (created with `createTextNode`) |
| Output | the root `SVGElement` built with `document.createElementNS(SVG_NS, …)` in source order, or a rejection reason for the warning |

**Equivalence.** For every bundled constant (133 strings plus the placeholder), the builder's element serialises identically to `DOMParser`'s parse in jsdom. A test asserts this, so the server and the client render the same SVG.

### The `lc-icon` policy

- It lives in one module of the `icon` entry and is never exported.
- It is created lazily, the first time a bundled icon renders in a browser that has `window.trustedTypes`. It is never created at import time, and never on the server.
- The call is `trustedTypes.createPolicy('lc-icon', { createHTML })`. `createHTML(input)` returns `input` only if it is **identical** to one of the bundled constants, held in a `Set` built on first use from `INLINE_ICON_SVGS`, `INLINE_TABLER_SVGS` and the placeholder. For anything else it throws a `TypeError` (`lc-icon: not a bundled icon`).
- The policy defines no `createScript` and no `createScriptURL`.
- Its state per document is `unset` → `ready` | `none` (no `trustedTypes`) | `refused` (`createPolicy` threw). After `refused` the kit never calls `createPolicy` again.

## 5. Theming

No element changes its token. No new tokens. The computed values below are the regression reference.

| Element | Light | Dark | Contrast (computed, WCAG) |
|---|---|---|---|
| Sidenav current link ink on its pill | `--color-on-surface-selected` rgb(20, 79, 91) on `--color-surface-selected` rgb(224, 241, 244) | rgb(163, 213, 223) on rgba(32, 132, 151, 0.24) over `--color-background` #0a121b = rgb(15, 45, 57) | light **7.85:1**, dark **9.03:1** |
| Sidenav other links | `--color-text-secondary` rgb(75, 85, 99) on white | rgb(196, 210, 217) on #0a121b | light **7.56:1**, dark **12.17:1** |
| Icon / placeholder | `currentColor` (inherits; unchanged) | same | inherits its context |
| Skeleton (story) | `lc-skeleton`'s own tokens | same | decorative, no text |

The measured current-item boxes (3.4.1, must stay):

- transparent at 1280 px: 48 px high, radius 9999 px, 16 px / 600;
- default and drawer at 360 px: 44 px high, radius 12 px, 14 px / 600, x 8, width 264.

**Forced colours.** The sidenav's existing forced-colours rule covers `--active` and `[aria-current='page']` and stays; the two now always coincide. Icons use `currentColor` and follow forced colours as before.

## 6. Accessibility

- **`aria-busy`** sits on the `<main>` landmark only, as `"true"` or absent, never `"false"`.
- **Loading text.** The kit adds no live region and no text. The docs recommend:
  - static `.sr-only` text inside the page, as life-os does: it is read when reached, not announced;
  - or a `role="status"` element outside `<main>` (a sibling of `lc-app-page` in the shell's default slot) when the loading must be announced.
- **Sidenav.**
  - Exactly one `a[aria-current="page"]` (or none) in the sidenav's `<nav>`, steady across navigation, hydration and the router's updates (no `routerLinkActive` left to remove it). WCAG 1.3.1 and 4.1.2.
  - Keyboard order, focus ring, the 44 / 48 px targets and the drawer dialog semantics are unchanged.
  - `lc-bottom-nav` is untouched (AC-25).
- **Icons.**
  - `role="img"` + `aria-label`, or `aria-hidden="true"`, exactly as before.
  - Prerendered icons now carry them before JavaScript runs.
  - The placeholder in every failure state (fetch, unknown name, policy refused) keeps the instance's `aria-label`, so icon-only buttons never lose their accessible name.
  - Consumer `ariaLabel` and `color` reach only `setAttribute` and `style.color`, never a sink (AC-8).
- **Reduced motion.** Nothing new animates. `lc-skeleton` keeps its own `prefers-reduced-motion` rule.
- **Announcements.** None new.

## 7. Texts

There is no new built-in UI text, so there are no new label or `locale` inputs. EN and DE are not applicable (spec).

**Console messages** (developer-facing, English, each at most once as stated). None matches life-os's violation pattern except the AC-11 one, which only appears on the failure path.

| When | Text |
|---|---|
| Unknown name (development), or malformed name (any mode) | `[lc-icon] Unknown icon "${name}". Use a Tabler name or a documented alias (see ICON_NAMES / ICON_ALIASES). Rendering a placeholder instead.` (3.4.1 text) |
| Fetched non-SVG (unchanged) | `[lc-icon] "${name}": ${path} returned non-SVG content (${contentType}) — dropped. In SPA deployments this is typically the index.html fallback for a missing asset.` |
| Fetched SVG outside the allow-list | `[lc-icon] "${name}": ${path} was dropped: ${reason}. Fetched icons may contain only basic shapes with paint and geometry attributes. Rendering a placeholder instead.` Reasons: `<script> is not allowed` · `the attribute "onload" is not allowed` · `a reference to "${value}" is not allowed` · `a DOCTYPE is not allowed` · `it is larger than 32 KB` · `it is not well-formed` |
| Production, final load failure | `[lc-icon] "${name}": ${path} could not be loaded (${status}) — an unknown name or a missing asset. Rendering a placeholder instead.` |
| Policy refused (once per page, AC-11) | `[lc-icon] Icons render a placeholder: the Trusted Types policy "lc-icon" could not be created. Add lc-icon to the trusted-types directive of the Content Security Policy.` |

**Story text** (German content, as in the other app-shell stories): `Heute wird geladen …` (the `.sr-only` text). The sidenav story labels are `Heute`, `Haushalt`, `Mitglieder` and `Einstellungen`; the longest, *Einstellungen*, fits the 192 px pill at 1280 px and the 264 px drawer row at 360 px with room to spare.

**Docs** (EN):

- **`getting-started.mdx`, *Use components*.** Show the secondary-entry imports first, for example `import { ButtonComponent } from '@lifecorner/angular-ui-kit/button';`. Say that they keep unused parts out of the app and let lazy routes take kit parts with them, that the import path is the component's folder (table of exceptions as in §3.4), and that `@lifecorner/angular-ui-kit` keeps working unchanged.
- **New section *Content Security Policy*.**
  - With Trusted Types, add `lc-icon` to `trusted-types`.
  - `lc-markdown`, `lc-code-block`, `lc-log-viewer`, `lc-rich-text-editor` and `lc-document-viewer` still need `angular#unsafe-bypass`.
  - With two copies of the kit on one page, the second `createPolicy('lc-icon')` needs `'allow-duplicates'`.
- ***mermaid*.** It is needed only by the `markdown`, `chat` and `document-viewer` entries and by the primary entry. Without it, import from the other entries, or keep `externalDependencies: ["mermaid"]`.
- ***Provide HttpClient*.** Inline icons need no request, but `lc-icon` still injects `HttpClient`.
- **READMEs.** One paragraph on the entry points with the same example.
- **Icon story docs.**
  - A *Trusted Types* paragraph, with the policy text from §2.
  - Correct "without issuing a network request": in development; production requests a well-formed unknown name once and shows the placeholder.
  - The `ICON_NAMES` import example now reads `from '@lifecorner/angular-ui-kit/icon-names'`.
- **App-shell story docs, `lc-app-page` paragraph.** Add `busy` (the JSDoc text) and the loading-text guidance.
- **Sidenav story docs.** The `activeRoute` row in its table gets the rule from §2.

## 8. Stories

| Story | Expected ID | Args | Shows |
|---|---|---|---|
| **Today (loading, busy page)**, export `TodayLoading` (new, *Layout/App Shell*) | `layout-app-shell--today-loading` | `horizon: true`, `busy: true`; story-level argType `busy`: `control: 'boolean'`, description = the JSDoc's first two sentences, `table: { defaultValue: { summary: 'false' } }` | The Today shell with the §3.1 skeleton inside `lc-app-page [busy]="busy"`: the static `.sr-only` text, the member row at every width, no aside. The description says what `aria-busy` does and where an announced status belongs. Toggling `busy` changes no pixel. |
| **Router-matched current item**, export `RouterMatched` (new, *Navigation/Sidenav*) | `navigation-sidenav--router-matched` | `mode: 'docked'`, `variant: 'transparent'`, `width: '248px'`, `mobileBreakpoint: 0`, `isOpen: true`, **no `activeRoute`**; four simple items: Heute `/`, Haushalt `/household`, Mitglieder `/household/members`, Einstellungen `/settings` (3.4.1 would paint both Haushalt and Mitglieder on `/household/members`) | Story-level `applicationConfig({ providers: [provideRouter([{ path: '**', component: <empty> }], withHashLocation())] })`, so the router reads the iframe's hash (`/`) and clicks move it. The `play` step clicks *Mitglieder* and asserts exactly one `link` with `aria-current="page"` (Mitglieder) and one `.lc-sidenav__nav-item--active` (the same element), then blurs the link *(change note R1)*: the scripted click leaves a `:focus-visible` ring that a mouse click wouldn't, and the story shows the current look. Description: the rule from §2. If the story-level router can't override the global `provideRouter([])` reliably, say so in `build.md`; the unit tests are the binding evidence. |

**Unchanged** (the review compares them with the 3.4.1 baseline):

- `layout-app-shell--today-desktop`, `--today-phone`, `--content-page`;
- `navigation-sidenav--docked`, `--drawer-mode`, `--with-nested-items`, `--with-groups-and-actions`, `--transparent-on-the-page`, `--collapsed-icon-rail`;
- `components-icon--default`, `--sizes`, `--solid`, `--custom-colors`, `--unknown-name-fallback`, `--inline-set`, `--all-icons`.

**No story for the policy-refused state.** Storybook has no CSP, and faking `window.trustedTypes` in one story would leak into every other story in the same session. AC-11 is proven by the browser check.

All 824 story IDs of 3.4.1 must still exist (`tmp/story-shots/001/baseline/story-ids-3.4.1.json`).

## 9. Verification

### Fixtures (the spec leaves them to the design)

1. **`tools/compat/template` (existing; Angular 21.0 / 21 / 22.0 / 22).**
   - **Routes.** The root becomes `<router-outlet />`. Route `''` is today's page, unchanged and importing from the **primary** entry. A new route set **`/tt`** (`''`, `household`, `icons`, `fetched`) imports **only from secondary entries** and renders the F1 set of AC-10 (b) and nothing that needs `angular#unsafe-bypass`.
   - **Shell.** `/tt` has a docked sidenav with `[activeRoute]` bound to the router URL (as life-os does) and `lc-app-page [busy]` (true on the server, cleared after hydration).
   - **`/tt/icons`** renders every inline name × variant (the list generated from the kit source at fixture time, not from `ICON_NAMES`).
   - **`/tt/fetched`** renders `anchor`, `lc-typo-icon` (served the `index.html` fallback) and `lc-crafted` (served `<svg onload="window.__pwned=1">`).
   - **Singletons.** `LC_LOGO_BASE_PATH` is provided from the primary entry in `app.config`. A `/tt` page injects `ToastService` and `ThemeService` from the primary entry.
   - Every route is prerendered (`outputMode: 'static'`).
2. **`tools/compat/check-trusted-types.mjs` (new, chrome-headless-shell over CDP like `story-shots.mjs`).**
   - Serves `dist/compat/browser` with the life-os headers plus `lc-icon`: `default-src 'none'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self'; connect-src 'self'; base-uri 'self'; object-src 'none'; require-trusted-types-for 'script'; trusted-types angular lc-icon`.
   - Serves `/tabler-icons/` from the repo's `@tabler/icons`, falls back to `index.html` with 200 `text/html` for unknown paths, and serves the crafted SVG as `image/svg+xml`.
   - Runs at 1280 and 360 px, then a second time with `trusted-types angular` (AC-11).
   - Collects `securitypolicyviolation` events (an init script), console and Log entries (life-os's pattern), uncaught exceptions and NG05xx messages.
   - Runs in CI in the Angular 22 compat job.
   - **Pitfall:** if a violation comes from Angular itself (an inline event-dispatch script, for example), mirror how life-os handles it and record it in `build.md`. Never weaken the CSP or exempt a kit violation.
   - *(Change note R1.)* It does: Angular 22 enables incremental hydration by default (`withIncrementalHydration` is deprecated since 22.0), which writes the inline event-dispatch script, and critical-CSS inlining writes an inline script too. The life-os settings (`withNoIncrementalHydration()`, `optimization.styles.inlineCritical: false`) belong **only to the build this check serves**. The four-version prerender build of `tools/compat/template` keeps Angular's defaults, because it stands for the existing consumers of AC-20 (for example an angular.json configuration `csp` plus a `fileReplacements` entry for `app.config.ts`, built once more for Angular 22 in the CI job).
3. **`tools/compat/entries` + `tools/compat/check-entries.mjs` (new; Angular 22).**
   - **The app.** Only secondary-entry imports. An eager shell route uses the F1 shell set of AC-17. A lazy route `/reports` (`loadComponent`) uses `lc-line-chart`, `lc-table`, `lc-modal` and `lc-markdown`.
   - **Builds.** `ng build --stats-json`, production and development. The variant **without `mermaid`** (`npm uninstall mermaid`, and a `fileReplacements` `reports` page without `lc-markdown`) builds in production and development and prerenders, with no `externalDependencies`.
   - **Before numbers.** The same app with every import rewritten to `@lifecorner/angular-ui-kit` (3.4.1 from npm, then 3.5.0's primary entry) gives the "before" numbers.
   - **Package checks.** The script also packs the build and checks:
     - AC-13: `createPolicy` appears in exactly one `fesm2022/*.mjs`;
     - AC-14: the export names and kinds, through the TypeScript checker, against `npm pack @lifecorner/angular-ui-kit@3.4.1`;
     - AC-15: every subpath resolves its `types` (tsc) and `default` (node `import()` after `@angular/compiler`);
     - AC-16: every source path occurs in exactly one `fesm2022/*.mjs.map` `sources`.

### Per AC

| AC | How | Expected value |
|---|---|---|
| AC-1 | unit test (`app-shell.component.spec.ts`); MCP manifest | `busy` is an input signal, default `false`, JSDoc contains `@default false`; manifest `layout-app-shell` → `AppPageComponent` lists `busy`, 1179 inputs in total (1178 + 1) |
| AC-2 | unit test | `busy=true` → `main[aria-busy="true"]`; `false` or unset → `hasAttribute('aria-busy') === false`; true → false → true follows each change; `outerHTML` of the page without the attribute is equal before and after |
| AC-3 | compat `EXPECT_IN_HTML` (4 versions) | `/<main(?=[^>]*id="shell-main")(?=[^>]*aria-busy="true")[^>]*>/` with `[busy]="true"` on the existing app-page; the `app page aside` check stays green |
| AC-4 | story `layout-app-shell--today-loading` at 360 / 1024 / 1280, light and dark; `--measure` | `main.getAttribute('aria-busy') === 'true'`; `main` box and padding as §3.1 (x 0 / 240 / 240; padding 24 / 48 / 56); content 312 / 688 / 880 wide; argType `busy` with `table.defaultValue.summary === 'false'`; the docs text present in `get-documentation` |
| AC-5 | source-scan unit test over `lib/icon/*.ts` and `.html` (excluding specs and stories); fake-`trustedTypes` unit test | no `bypassSecurityTrust`, no `[innerHTML]`, no `innerHTML`, `outerHTML`, `insertAdjacentHTML`, `createContextualFragment`, `setHTMLUnsafe`; `parseFromString(` at exactly one call site. With the fake installed, every `DOMParser.prototype.parseFromString` call receives the fake's TrustedHTML object (an object with `toString()`), never a `string` |
| AC-6 | unit test with a fake `trustedTypes` | 0 `createPolicy` calls after importing the icon entry and rendering no icon; after 50 instances (10 names, both variants, all sizes, plus a fetched icon), exactly 1 call, with the name `'lc-icon'` and the rule keys `['createHTML']`; the fake throwing → still exactly 1 call |
| AC-7 | unit test against the rules object captured by the fake | each of the 133 constants and the placeholder returns itself (`===`); throws for the fetched `anchor.svg` text, a constant plus `' '`, `<svg onload="alert(1)">`, `<img src=x onerror=alert(1)>`, `''` |
| AC-8 | unit test | `ariaLabel='"><img src=x onerror=alert(1)>'` → `svg.getAttribute('aria-label')` equals that literal; `host.querySelectorAll('img').length === 0`; `color` reaches only `svg.style.color` |
| AC-9 | the existing DOM assertions in `icon.component.spec.ts` green; builder equivalence test (133 + 1); story-shots of the icon stories at 360 and 1280 px, light and dark, plus `--measure` of the `<svg>` attributes | attributes as in the 3.4.1 baseline (for example `components-icon--sizes`: `xmlns, fill, viewBox, stroke-width, stroke, width=16px…40px, height=…, role=img, style=color: currentcolor;`); shots pixel-equal to `tmp/story-shots/001/baseline/` |
| AC-10 | `check-trusted-types.mjs`, run 1, output in `build.md` | (a) `/tt/icons`: each name × variant has exactly 1 `<svg>` with ≥ 1 child; (b) every listed F1 element is present with a non-zero box, the member menu, modal, confirm dialog and toast opened, the sidenav docked at 1280 and the drawer at 360; (c) 0 violation events, 0 matching console or Log lines; (d) 0 NG05xx, each `lc-icon` has 1 `<svg>` after `whenStable` |
| AC-11 | same script, run 2 (`trusted-types angular`) | 0 uncaught exceptions; F1 elements present; each bundled `lc-icon` has 1 `<svg>` whose children are `rect,text` (the placeholder) and keeps its `aria-label`; exactly 1 console warning containing `lc-icon` and `trusted-types`; 1 `trusted-types` violation (the browser's own report of the refused policy) |
| AC-12 | unit tests (the builder table in §4; 3.4.1 fetch tests green; a 404 kept in the cache); browser script `/tt/fetched` | `anchor`: 1 `<svg>`, 3 `path`, 0 violations; `lc-typo-icon` and `lc-crafted`: placeholder, 1 warning each, `window.__pwned === undefined`; without TT (jsdom) the same through the builder |
| AC-13 | browser run 1 (the primary-entry `IconComponent` on route `''` is in the same bundle as `/icon`'s); tarball grep | 0 violations (a second policy would throw); `grep -l createPolicy fesm2022/*.mjs` → only `lifecorner-angular-ui-kit-icon.mjs` |
| AC-14 | `check-entries.mjs` export diff | 0 names removed or changed in kind compared with 3.4.1; `fesm2022/lifecorner-angular-ui-kit.mjs`, `types/lifecorner-angular-ui-kit.d.ts`, the `./styles`, `./styles/*`, `./icon-names.json` and `./package.json` exports and the `src/assets/` and `src/styles/` paths present; the diff in `build.md` |
| AC-15 | `check-entries.mjs`; the stub-correspondence unit test | 112 subpaths with `types` + `default`, all resolve; every public symbol in exactly one entry (§3.4 table) |
| AC-16 | source-map script; compat prerender and browser | every kit source in exactly 1 `.mjs.map`; 0 entry cycles; a toast from the primary entry's `ToastService` appears in the `/toast` outlet; `lc-logo` from `/logo` uses the base path provided through the primary entry (`EXPECT_IN_HTML`); a theme change through the primary entry's `ThemeService` reaches `lc-header` |
| AC-17 | `check-entries.mjs` (metafile) | no module of a lazy-only entry (closure of `/reports` minus closure of the shell: line-chart, table, markdown, modal, code-block, select, input, internal/chart, internal/url, …) in an initial chunk, and all of them in a lazy chunk; the kit's initial JS raw and gzip, before (3.4.1 primary) and after (secondary entries), in `build.md` and the changelog |
| AC-18 | the same production build plus grep; unit tests with `ngDevMode` on and off | `abacus-off` in 0 emitted `.js` files (production); the development build still contains it; dev: unknown name warns, `strict` throws; an app importing `isValidIconName` gets the list (the fixture's dev variant or a one-line check); the gzip saving reported |
| AC-19 | unit test with `globalThis.ngDevMode = false` (restored after) | unknown well-formed name: 1 request, then the placeholder (rect + text), 1 warning for 404 and for `text/html`, 0 non-SVG nodes, the container 24 × 24 px throughout; a malformed name (`../x`, `Foo Bar`): 0 requests, 1 warning; a second instance of the same name: 0 new requests. The changelog says it under *Changed* |
| AC-20 | compat log (4 versions, the primary page and `/tt`); Jest summary; `index.json` diff; manifest diff | all `EXPECT_IN_HTML` green; Jest count ≥ before (record both), changed assertions listed with reasons; the 824 baseline IDs ⊆ the new IDs; manifest: the same 112 components, inputs = baseline + `busy` |
| AC-21 | MCP `get-documentation` for `lc-icon` and `lc-app-page`; the getting-started text | each component doc shows its import line (from the component's folder: `import { AppShellComponent, AppPageComponent } from '@lifecorner/angular-ui-kit/app-shell';`) in a separate *Import* doc entry, so `summary` stays the description's first sentence; getting-started as §7; both READMEs mention the entries |
| AC-22 | unit test with `provideRouter` + `RouterTestingHarness`, routes `/` and `/household` | after the first navigation to `/`, `/` → `/household`, `/household` → `/`, and a first navigation straight to `/household` (each after `whenStable`): `querySelectorAll('a[aria-current]').length === 1`, and it is the `activeRoute` link; docked and drawer; repeated for a group child, a section child and a section grandchild |
| AC-23 | the same tests, plus `activeRoute` empty; story-shots `navigation-sidenav--*` (list in §8) at 1280 (docked) and 360 (drawer), light and dark, and the new `--router-matched` | for every link: `classList.contains('lc-sidenav__nav-item--active') === hasAttribute('aria-current')`; `activeRoute` empty on `/` → the `/` link current with `aria-current`; current-item colours, height, radius and weight equal to §5 / the baseline |
| AC-24 | compat `EXPECT_IN_HTML` on `/tt/index.html`; browser script | in the sidenav's `<nav>`: exactly one `aria-current="page"`, on the `/tt` link, which also has `--active`; still exactly one after hydration and the first `NavigationEnd` |
| AC-25 | `git diff` of `lib/bottom-nav/`; Jest; story-shots of the six `navigation-bottom-nav--*` stories against 3.4.1 | *(Change note R1; was "0 changed files", which contradicted §3.4 rules 1 and 4.)* Template, styles, logic and spec unchanged. The only diff is the two import specifiers rewritten to package paths (`@lifecorner/angular-ui-kit/icon`, `/badge`), which AC-16 requires (a relative import across entries fails with TS6059), plus the new `index.ts`. Its Jest tests are green and the shots are pixel-identical |
| AC-26 | `check-entries.mjs`, the no-`mermaid` variant | production and development `ng build` plus prerender exit 0 without `mermaid` and without `externalDependencies` |
| AC-27 | Storybook *Mermaid Support* story; Jest; the getting-started text | diagrams render from the primary and the `/markdown` entry; the docs state the primary entry's `mermaid` requirement |
| AC-28 | changelog review (release-manager) | 3.5.0 names AS-12…AS-16 and the life-os pages (Today, the app shell, every page with an icon). *Changed*: sidenav (the 3 cases in §4), icons under Trusted Types, unknown names in production, the allow-listed fetched SVGs, the 404 cache, decorated prerendered icons. *Migration*: add `lc-icon` to `trusted-types`. *Compatibility*: no API break, the numbers from AC-17 and AC-18 |

### Risks for the developer to watch

- **Build time** with 112 entries: report it, and come back if a CI job exceeds its timeout.
- **Dead code in production.** The guard is `typeof ngDevMode === 'undefined' || ngDevMode`, the pattern Angular's own packages use. The `abacus-off` grep (AC-18) proves that esbuild drops the `icon-names` module behind it. If it doesn't, ask back before trying anything else.
- **Effects on the server.** On the server, the container may resolve one round after the effect's first run. The prerendered HTML must contain the `<svg>`: add an `EXPECT_IN_HTML` entry for an inline icon.
- **Hydration.** The `<svg>` is not a template node, as with 3.4.1's `[innerHTML]`. If NG05xx appears anyway, ask back before using `ngSkipHydration`.

## Change notes

**R1 (review round 1, 2026-10-17, commit `3a46591`).** The design was wrong or silent in four places; the build showed it. The code didn't define these: each change is the designer's decision, and `review.md` gives the reasons.

1. **§9 AC-25.** "0 changed files under `lib/bottom-nav/`" contradicted §3.4 rules 1 and 4, which require package-path imports across entries and an `index.ts` per folder. The expected value is now "template, styles, logic and spec unchanged". The two import specifiers and `index.ts` are the packaging change AC-16 requires. The spec's AC-25 ("source … untouched") is read as the bottom-nav's behaviour and look, which are unchanged (shots pixel-identical, Jest green).
2. **§8 Router-matched.** The play step ends with `blur()` on the clicked link, so the canvas shows the current look and not the scripted click's focus ring.
3. **§9 Fixtures 2.** Angular 22's default incremental hydration (and critical-CSS inlining) puts inline scripts into the prerendered page, as anticipated. The life-os settings apply only to the build under the CSP. The four-version compat build keeps Angular's defaults. This is open as should-fix #1 in `review.md`.
4. **§2 / §3.2 `activeRoute`.** Routes are compared as written, so relative routes don't match the router path when `activeRoute` is empty. The JSDoc asks for absolute paths. This is open as nit #2 in `review.md`.

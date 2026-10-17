# @lifecorner/angular-ui-kit

Angular UI component library for the **LifeCorner Design System** — 110 accessible, themeable Angular standalone components (for apps on Angular 21 and 22) with signal-based inputs, OnPush change detection, light/dark themes, and a full density token system (`compact` / `cosy` / `comfortable`).

## Resources

| | |
|---|---|
| 📖 **Live documentation & Storybook** | https://design.life-cockpit.de (moves to `design.lifecorner.de` once that domain is registered) |
| 🤖 **MCP server for AI agents** | https://design.life-cockpit.de/mcp |
| 📦 **npm package** | https://www.npmjs.com/package/@lifecorner/angular-ui-kit |
| 🐙 **Source code** | https://github.com/getlifecorner/lc-design-system |

> **Renamed in 3.3.0.** Up to 3.2.x this package was `@life-cockpit/angular-ui-kit` (now deprecated). Replace the import and `@use` paths with `@lifecorner/angular-ui-kit`; the `lc-` selectors, `LC_*` tokens and the API stay the same. The docs site and the MCP endpoint stay on `design.life-cockpit.de` until `lifecorner.de` is registered, then move to `design.lifecorner.de`.

## Installation

```bash
npm install @lifecorner/angular-ui-kit
```

### Peer Dependencies

Make sure these are installed in your project:

```bash
npm install @angular/cdk @angular/common @angular/core @angular/forms @angular/platform-browser @angular/router rxjs
```

## Setup

Import the global styles in your `styles.scss`:

```scss
@use '@lifecorner/angular-ui-kit/styles';
```

Every built-in text is an input (English or German defaults), and components that
format dates take a `locale` — see **Internationalization** in the docs.

## Usage

Import components from their secondary entries, `@lifecorner/angular-ui-kit/<entry>`
(the component's folder name):

```typescript
import { ButtonComponent } from '@lifecorner/angular-ui-kit/button';
import { CardComponent } from '@lifecorner/angular-ui-kit/card';

@Component({
  standalone: true,
  imports: [ButtonComponent, CardComponent],
  template: `
    <lc-card>
      <lc-button variant="primary">Click me</lc-button>
    </lc-card>
  `,
})
export class MyComponent {}
```

Since 3.5 every component (or small group, such as `app-shell` with `lc-app-page`)
is its own entry, so an app bundles only what it imports and lazy routes take kit
parts with them. `@lifecorner/angular-ui-kit` keeps working unchanged and
re-exports every entry. `mermaid` is needed only by the `markdown`, `chat` and
`document-viewer` entries and the primary entry. With a Trusted Types CSP, add
`lc-icon` to `trusted-types`. See **Installation** in the docs for the entry table
and the CSP notes.

## Components

### General

| Component | Selector | Description |
|-----------|----------|-------------|
| Accordion | `lc-accordion` | Expandable/collapsible panels with optional rich header template (`lcAccordionHeader`) and lazy/deferred body (`lcAccordionContent` + `[lazy]`/`[destroyOnClose]`) |
| Button | `lc-button` | Primary, secondary, and text buttons |
| Button link | `a[lcButton]` | `lc-button` look on a native `<a href>` — native attributes pass through, works without JavaScript |
| Card | `lc-card` | Content container with elevation; optional leading brand-tile header icon (`[icon]` / `[iconVariant]`) |
| Chat | `lc-chat` | Conversational UI with streaming, custom message templates |
| Icon | `lc-icon` | Tabler SVG icons; fail-loud on unknown names (dev warning + visible placeholder, optional `[strict]` throw); exports `ICON_NAMES` / `isValidIconName` / `ICON_ALIASES` (+ `icon-names.json`) for static checking; tree-shakable glyphs: `provideLcIcons([ICON_HOME, …])` with the constants of `@lifecorner/angular-ui-kit/icons` |
| Logo | `lc-logo` | LifeCorner logo: Edu, the emblem, and the LifeCorner lockup, with dark and small drawings |
| Markdown | `lc-markdown` | GFM renderer (tables with alignment, task lists, autolinks, code/mermaid) with in-place change highlighting |
| Menu | `lc-menu` | Dropdown menu |
| Typography | `lc-typography` | Text with preset styles |

### Form

| Component | Selector | Description |
|-----------|----------|-------------|
| Checkbox | `lc-checkbox` | Checkbox input |
| Combobox | `lc-combobox` | Async autocomplete with single/multiple selection |
| Copy Field | `lc-copy-field` | A value to copy (link, token, command): wraps, 48.5 px copy button, one polite announcement |
| Datepicker | `lc-datepicker` | Date selection |
| Email Input | `lc-email-input` | Email-specific input |
| Input | `lc-input` | Text input field |
| Password Input | `lc-password-input` | Password input with toggle |
| Provider Button | `lc-provider-button` | "Sign in with Google" drawn to Google's branding guidelines (light, dark, neutral; no Google script) |
| Radio | `lc-radio` | Radio button |
| Radio Group | `lc-radio-group` | `<fieldset>` with a legend, one help text and one error around `lc-radio`s; `[(value)]` or a form control |
| Select | `lc-select` | Dropdown select |
| Switch | `lc-switch` | Toggle switch |
| Textarea | `lc-textarea` | Multi-line text input |
| Verification Code | `lc-verification-code-input` | OTP/code input |

### Layout

| Component | Selector | Description |
|-----------|----------|-------------|
| App Shell | `lc-app-shell` | The app frame, phone first, with the document scrolling: header, docked side navigation from 1024 px, bottom bar below, footer, optional horizon |
| App Page | `lc-app-page` | A page in the shell: `<main>` at a reading width and an optional right column docked to the window's edge from 1280 px |
| Container | `lc-container` | Page container with max-width |
| Drawer | `lc-drawer` | Slide-in side panel |
| Page Header | `lc-page-header` | Page title with overline, subtitle and actions; `title`, `display` and `auth` sizes |
| Section | `lc-section` | Content section |
| Spacer | `lc-spacer` | Spacing utility |
| Stack | `lc-stack` | Flex layout utility |

### Navigation

| Component | Selector | Description |
|-----------|----------|-------------|
| Bottom Nav | `lc-bottom-nav` | Bottom navigation bar for phones and tablets (links, `aria-current`), docked or floating |
| Breadcrumbs | `lc-breadcrumbs` | Breadcrumb navigation |
| Footer | `lc-footer` | Site or app footer with labelled link sections |
| Header | `lc-header` | App shell or public-site header: plain `homeHref`, labelled `navItems`, `[slot='end']`, translatable labels |
| Pagination | `lc-pagination` | Page navigation |
| Sidenav | `lc-sidenav` | Side navigation; docked, drawer, or transparent with pill items |
| Sidenav Placeholder | `lc-sidenav-placeholder` | Inert skeleton with the docked sidenav's boxes, the `@placeholder` of a deferred `lc-sidenav` (no layout shift; phones never load the sidenav) |
| Tabs | `lc-tabs` | Tab navigation |

### Data Display

| Component | Selector | Description |
|-----------|----------|-------------|
| Avatar | `lc-avatar` | User avatar; six member colours and a ring |
| Avatar Group | `lc-avatar-group` | Stacked avatars, e.g. a household's member row |
| Badge | `lc-badge` | Status badge |
| Chip | `lc-chip` | Tag/label chip |
| Description List | `lc-description-list` | Key/value metadata (`<dl>`) with rows/stacked layout, optional dotted leaders and per-row emphasis/links |
| Empty State | `lc-empty-state` | Placeholder for empty content |
| Field Group | `lc-field-group` | Grouped form fields |
| Filter Bar | `lc-filter-bar` | Filter controls |
| List | `lc-list` | List display |
| Log Viewer | `lc-log-viewer` | Streaming log/terminal viewer with virtualization |
| Metric Card | `lc-metric-card` | KPI/metric display |
| Pipeline | `lc-pipeline` | Status timeline of connected process nodes; per-node status (complete/current/pending/warning/error) with captions, horizontal/vertical |
| Skeleton | `lc-skeleton` | Loading placeholder |
| Spinner | `lc-spinner` | Loading indicator |
| Stepper | `lc-stepper` | Step-by-step progress |
| Table | `lc-table` | Data table with sorting, filtering, pagination, formatter callbacks, cell styling hooks and custom cell templates |
| Timeline | `lc-timeline` | Ordered list of events with times (`<time datetime>`) |
| Toggle Group | `lc-toggle-group` | Segmented toggle |

### Feedback

| Component | Selector | Description |
|-----------|----------|-------------|
| Alert | `lc-alert` | Inline alert message |
| Callout | `lc-callout` | Highlighted note in running content |
| Confirm Dialog | `lc-confirm-dialog` | Confirmation dialog with text-match support |
| Error Display | `lc-error-display` | Error state display |
| Modal | `lc-modal` | Dialog/modal window; bottom sheet on phones (`placement`) |
| Next-Step Card | `lc-next-step-card` | The one next step with its actions; `soft` variant for the "Weite" look |
| Toast | `lc-toast` | Notification toast |
| Toast Outlet | `lc-toast-outlet` | Renders the `ToastService` queue per position inside persistent live regions — place it once in the app shell |
| Tooltip | `lcTooltip` | Tooltip directive |

### Services

| Service | Description |
|---------|-------------|
| `ConfirmService` | Imperative confirm/destructive/warning dialogs returning `Promise<boolean>` |
| `ThemeService` | Toggle light/dark theme; persists the choice (`localStorage` key `lc-theme`) and adopts a `dark`/`light`/`system` class already on `<html>` at startup (`system` follows the OS without a script) |
| `ToastService` | `show({ message, variant, … })` — rendered by `<lc-toast-outlet />` |

## Theming

The library supports light and dark themes:

```typescript
import { ThemeService } from '@lifecorner/angular-ui-kit';

@Component({ ... })
export class AppComponent {
  private themeService = inject(ThemeService);

  toggleTheme() {
    this.themeService.toggleTheme();
  }
}
```

`lc-header`'s theme button toggles the service itself (set `[autoToggleTheme]="false"`
to handle `(themeToggleClick)` in the app instead).

### Toasts

```html
<!-- once, e.g. in the app shell -->
<lc-toast-outlet />
```

```typescript
inject(ToastService).show({ message: 'Saved', variant: 'success' });
```

## Branding (custom logo)

`lc-logo`, `lc-header` and `lc-sidenav` accept custom logo URLs so you can drop your own brand into the shell:

```html
<lc-header
  title="Acme"
  [logoSrc]="'/assets/acme-logo.svg'"
  [logoEmblemSrc]="'/assets/acme-emblem.svg'"
  [logoDarkSrc]="'/assets/acme-logo-dark.svg'"
  logoAlt="Acme Inc."
/>
```

The built-in LifeCorner logos (`lifecorner-logo.svg`, `lifecorner-logo-on-dark.svg`, `lifecorner-emblem*.svg`) are loaded from `/assets/` by default. If your app serves static files from a different prefix, override the path via the `LC_LOGO_BASE_PATH` token:

```typescript
import { LC_LOGO_BASE_PATH } from '@lifecorner/angular-ui-kit';

bootstrapApplication(AppComponent, {
  providers: [
    { provide: LC_LOGO_BASE_PATH, useValue: '/static/lc' },
  ],
});
```

Or copy the assets from `node_modules/@lifecorner/angular-ui-kit/src/assets/` to your app's public `/assets/` folder (e.g. via the `assets` array in `angular.json`).

## Chat with Rich Content

The Chat component supports custom message templates for embedding any component inside chat bubbles:

```typescript
import { ChatComponent, ChatMessage, DiffViewerComponent } from '@lifecorner/angular-ui-kit';

@Component({
  imports: [ChatComponent, DiffViewerComponent],
  template: `
    <lc-chat [messages]="messages" title="Spec Author">
      <ng-template #messageTemplate let-msg>
        {{ msg.content }}
        @if (msg.data?.diff) {
          <lc-diff-viewer
            [oldText]="msg.data.oldText"
            [newText]="msg.data.newText"
            mode="inline"
          />
        }
      </ng-template>
    </lc-chat>
  `,
})
export class SpecAuthorComponent {
  messages: ChatMessage[] = [
    { id: '1', role: 'agent', content: 'Ziel ausgefüllt:', name: 'Agent',
      data: { diff: true, oldText: '## Ziel\n\n_TBD_', newText: '## Ziel\n\nOnboarding-Plattform' } },
  ];
}
```

## Design Tokens

Design tokens for colors, spacing, typography, elevation, and more are available as TypeScript constants:

```typescript
import { ColorTokens, SpacingTokens } from '@lifecorner/angular-ui-kit';
```

### Density

All components react to a density token cascade. Set the density on any ancestor element (or `<html>`) and every descendant component adapts paddings, gaps and font sizes:

```html
<div data-density="compact"> <!-- 'compact' | 'cosy' (default) | 'comfortable' -->
  <lc-card>...</lc-card>
</div>
```

See the *Design Tokens → Density* section on https://design.life-cockpit.de for the full token reference.

## MCP Server for AI Agents

The design system ships with a hosted **Model Context Protocol** server that lets AI coding agents (Copilot, Claude, Cursor, etc.) discover components, props, variants and usage examples without hallucinating.

**Endpoint:** `https://design.life-cockpit.de/mcp`

### VS Code / GitHub Copilot

Add to your `.vscode/mcp.json` (or workspace `settings.json`):

```json
{
  "servers": {
    "lc-design-sys": {
      "type": "http",
      "url": "https://design.life-cockpit.de/mcp"
    }
  }
}
```

### Claude Desktop / Cursor

```json
{
  "mcpServers": {
    "lc-design-sys": {
      "url": "https://design.life-cockpit.de/mcp"
    }
  }
}
```

### Available tools

| Tool | Description |
|---|---|
| `list-all-documentation` | Lists every component and docs page with its IDs |
| `search_component` | Finds a component by name and returns full docs in one call |
| `get-documentation` | Returns props, variants, usage examples and stories for a given ID |
| `get-documentation-for-story` | Retrieves docs for a specific Storybook story variant |
| `get_changelog` | Returns the changelog for the latest releases |

With the MCP server connected, your agent will *never invent props or variants* — it always grounds answers in the published component documentation.

## Development

```bash
# Run unit tests
nx test angular-ui-kit

# Build the library
nx build angular-ui-kit

# Run Storybook
nx storybook angular-ui-kit
```

## License

MIT

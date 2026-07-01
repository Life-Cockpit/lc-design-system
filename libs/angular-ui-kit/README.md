# @life-cockpit/angular-ui-kit

Angular UI component library for the **Life Cockpit Design System** — 60+ accessible, themeable Angular 21 standalone components with signal-based inputs, OnPush change detection, light/dark themes, and a full density token system (`compact` / `cosy` / `comfortable`).

## Resources

| | |
|---|---|
| 📖 **Live documentation & Storybook** | https://design.life-cockpit.de |
| 🤖 **MCP server for AI agents** | https://design.life-cockpit.de/mcp |
| 📦 **npm package** | https://www.npmjs.com/package/@life-cockpit/angular-ui-kit |
| 🐙 **Source code** | https://github.com/Life-Cockpit/lc-design-system |

## Installation

```bash
npm install @life-cockpit/angular-ui-kit
```

### Peer Dependencies

Make sure these are installed in your project:

```bash
npm install @angular/cdk @angular/common @angular/core @angular/forms @angular/platform-browser @angular/router rxjs
```

## Setup

Import the global styles in your `styles.scss`:

```scss
@import '@life-cockpit/angular-ui-kit/styles/index.scss';
```

## Usage

Import components directly in your Angular standalone components or modules:

```typescript
import { ButtonComponent, CardComponent } from '@life-cockpit/angular-ui-kit';

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

## Components

### General

| Component | Selector | Description |
|-----------|----------|-------------|
| Accordion | `lc-accordion` | Expandable/collapsible panels with optional rich header template (`lcAccordionHeader`) and lazy/deferred body (`lcAccordionContent` + `[lazy]`/`[destroyOnClose]`) |
| Button | `lc-button` | Primary, secondary, and text buttons |
| Card | `lc-card` | Content container with elevation |
| Chat | `lc-chat` | Conversational UI with streaming, custom message templates |
| Icon | `lc-icon` | SVG icon display |
| Logo | `lc-logo` | Life Cockpit logo |
| Markdown | `lc-markdown` | GFM renderer (tables with alignment, task lists, autolinks, code/mermaid) with in-place change highlighting |
| Menu | `lc-menu` | Dropdown menu |
| Typography | `lc-typography` | Text with preset styles |

### Form

| Component | Selector | Description |
|-----------|----------|-------------|
| Checkbox | `lc-checkbox` | Checkbox input |
| Combobox | `lc-combobox` | Async autocomplete with single/multiple selection |
| Datepicker | `lc-datepicker` | Date selection |
| Email Input | `lc-email-input` | Email-specific input |
| Input | `lc-input` | Text input field |
| Password Input | `lc-password-input` | Password input with toggle |
| Radio | `lc-radio` | Radio button group |
| Select | `lc-select` | Dropdown select |
| Switch | `lc-switch` | Toggle switch |
| Textarea | `lc-textarea` | Multi-line text input |
| Verification Code | `lc-verification-code-input` | OTP/code input |

### Layout

| Component | Selector | Description |
|-----------|----------|-------------|
| Container | `lc-container` | Page container with max-width |
| Drawer | `lc-drawer` | Slide-in side panel |
| Section | `lc-section` | Content section |
| Spacer | `lc-spacer` | Spacing utility |
| Stack | `lc-stack` | Flex layout utility |

### Navigation

| Component | Selector | Description |
|-----------|----------|-------------|
| Breadcrumbs | `lc-breadcrumbs` | Breadcrumb navigation |
| Header | `lc-header` | Page header |
| Pagination | `lc-pagination` | Page navigation |
| Sidenav | `lc-sidenav` | Side navigation |
| Tabs | `lc-tabs` | Tab navigation |

### Data Display

| Component | Selector | Description |
|-----------|----------|-------------|
| Avatar | `lc-avatar` | User avatar |
| Badge | `lc-badge` | Status badge |
| Chip | `lc-chip` | Tag/label chip |
| Empty State | `lc-empty-state` | Placeholder for empty content |
| Field Group | `lc-field-group` | Grouped form fields |
| Filter Bar | `lc-filter-bar` | Filter controls |
| List | `lc-list` | List display |
| Log Viewer | `lc-log-viewer` | Streaming log/terminal viewer with virtualization |
| Metric Card | `lc-metric-card` | KPI/metric display |
| Skeleton | `lc-skeleton` | Loading placeholder |
| Spinner | `lc-spinner` | Loading indicator |
| Stepper | `lc-stepper` | Step-by-step progress |
| Table | `lc-table` | Data table with sorting, filtering, pagination, formatter callbacks, cell styling hooks and custom cell templates |
| Toggle Group | `lc-toggle-group` | Segmented toggle |

### Feedback

| Component | Selector | Description |
|-----------|----------|-------------|
| Alert | `lc-alert` | Inline alert message |
| Confirm Dialog | `lc-confirm-dialog` | Confirmation dialog with text-match support |
| Error Display | `lc-error-display` | Error state display |
| Modal | `lc-modal` | Dialog/modal window |
| Toast | `lc-toast` | Notification toast |
| Tooltip | `lcTooltip` | Tooltip directive |

### Services

| Service | Description |
|---------|-------------|
| `ConfirmService` | Imperative confirm/destructive/warning dialogs returning `Promise<boolean>` |
| `ThemeService` | Toggle light/dark theme |

## Theming

The library supports light and dark themes:

```typescript
import { ThemeService } from '@life-cockpit/angular-ui-kit';

@Component({ ... })
export class AppComponent {
  private themeService = inject(ThemeService);

  toggleTheme() {
    this.themeService.toggleTheme();
  }
}
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

The built-in Life-Cockpit logos are loaded from `/assets/` by default. If your app serves static files from a different prefix, override the path via the `LC_LOGO_BASE_PATH` token:

```typescript
import { LC_LOGO_BASE_PATH } from '@life-cockpit/angular-ui-kit';

bootstrapApplication(AppComponent, {
  providers: [
    { provide: LC_LOGO_BASE_PATH, useValue: '/static/lc' },
  ],
});
```

Or copy the assets from `node_modules/@life-cockpit/angular-ui-kit/assets/` to your app's public `/assets/` folder (e.g. via the `assets` array in `angular.json`).

## Chat with Rich Content

The Chat component supports custom message templates for embedding any component inside chat bubbles:

```typescript
import { ChatComponent, ChatMessage, DiffViewerComponent } from '@life-cockpit/angular-ui-kit';

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
import { ColorTokens, SpacingTokens } from '@life-cockpit/angular-ui-kit';
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

import type { Meta, StoryObj } from '@storybook/angular';
import { moduleMetadata } from '@storybook/angular';
import { PageHeaderComponent } from './page-header.component';
import { ButtonComponent } from '../button/button.component';
import { ChipComponent } from '../chip/chip.component';
import { TabsComponent, TabComponent } from '../tabs/tabs.component';

const meta: Meta<PageHeaderComponent> = {
  title: 'Layout/Page Header',
  component: PageHeaderComponent,
  decorators: [
    moduleMetadata({
      imports: [
        PageHeaderComponent,
        ButtonComponent,
        ChipComponent,
        TabsComponent,
        TabComponent,
      ],
    }),
  ],
  parameters: {
    docs: {
      description: {
        component: `
The **Page Header** is the top-of-page title block that introduces a route. It combines
breadcrumbs, a title, a subtitle, an optional badge, a primary actions area, secondary
metadata and a free-form body region — all wired up with density-aware spacing so every
page in the app gets the same vertical rhythm out of the box.

It is **not** the global application header (use \`lc-header\` for that, which provides
chrome like logo, user menu, theme toggle). The page header lives **inside** the routing
outlet, the application header lives **outside** of it.

---

#### Slot structure

| Slot | Purpose | Position |
|------|---------|----------|
| \`[slot="breadcrumbs"]\` | Trail navigation (\`<lc-breadcrumbs>\`) | above the title row |
| \`[slot="actions"]\` | Primary page actions (buttons, menus) | right of the title row |
| \`[slot="meta"]\` | Secondary metadata (chips, tags, timestamps) | below the title row |
| default | Long-form description text or a short sub-nav line | bottom of the header |

> **Note:** the default slot is for short header-internal content (descriptions, an
> inline sub-nav). Full-blown navigation primitives like \`lc-tabs\` — which render
> both the tab strip **and** their panels — belong **below** the page header, not
> inside it. See the *Followed by tabs* story for the correct pattern.

Empty slots collapse automatically — they do not produce phantom gaps.

---

#### Inputs

| Input | Type | Default | Description |
|-------|------|---------|-------------|
| \`title\` | \`string\` | — | Main heading text |
| \`subtitle\` | \`string\` | — | Short supporting line below the title |
| \`level\` | \`1 \\| 2 \\| 3\` | \`1\` | Semantic heading level (\`h1\`/\`h2\`/\`h3\`) |
| \`size\` | \`'compact' \\| 'default' \\| 'comfortable'\` | \`'default'\` | Visual scale of the whole block |
| \`badge\` | \`string\` | — | Pill rendered next to the title (e.g. \`Beta\`, \`New\`) |
| \`showDivider\` | \`boolean\` | \`false\` | Render a border-bottom divider below the header |

---

#### Size variants

| Size | Typical use | Title size |
|------|-------------|------------|
| \`compact\` | Side panels, data-dense tools, modals | \`--font-size-lg\` |
| \`default\` | Standard application pages | \`--font-size-2xl\` |
| \`comfortable\` | Landing / welcome / onboarding pages | \`--font-size-3xl\` |

The size also influences gap and padding locally, so a compact header is tighter and a
comfortable header breathes more — without changing your template.

---

#### Density-awareness

The header consumes \`--lc-density-gap-*\` and \`--lc-density-padding-*\` like every other
layout primitive. Wrap any ancestor with \`data-density\` to rescale, or use the \`size\`
input for a header-specific override.

---

#### Accessibility

- Renders the title as a real \`<h1>\`, \`<h2>\` or \`<h3>\` so screen readers get a correct document outline
- Use \`level="1"\` for the top-level page heading; nest \`level="2"\` headers below if needed
- The badge is purely decorative — if it conveys state, also expose it through accessible text
- Keep the actions slot to ≤ 3 primary buttons; overflow into a dropdown for the rest

---

#### When to use what

| Need | Component |
|------|-----------|
| App-wide chrome (logo, user menu, theme toggle) | \`lc-header\` |
| The title of the **current page** | \`lc-page-header\` |
| A reusable row of controls anywhere on a page | \`lc-toolbar\` |

---

#### Typical page layout

\`\`\`html
<lc-header />                          <!-- global, outside <router-outlet> -->
<router-outlet />                      <!-- route below -->
  └─ <lc-page-header title="…">        <!-- one per route -->
      └─ <lc-breadcrumbs slot="breadcrumbs" />
      └─ <lc-button slot="actions" />
  <lc-toolbar>…</lc-toolbar>           <!-- 0..n per page -->
  <lc-card>…</lc-card>
\`\`\`
        `,
      },
    },
  },
  argTypes: {
    title: { control: 'text', description: 'Main heading text.' },
    subtitle: { control: 'text', description: 'Short supporting line below the title.' },
    level: {
      control: 'inline-radio',
      options: [1, 2, 3],
      description: 'Semantic heading level (does not affect size — use `size` for that).',
      table: { defaultValue: { summary: '1' } },
    },
    size: {
      control: 'inline-radio',
      options: ['compact', 'default', 'comfortable'],
      description: 'Visual scale of the whole header block.',
      table: { defaultValue: { summary: 'default' } },
    },
    showDivider: {
      control: 'boolean',
      description: 'Render a divider line below the header.',
      table: { defaultValue: { summary: 'false' } },
    },
    badge: { control: 'text', description: 'Optional pill next to the title (e.g. `Beta`).' },
  },
};
export default meta;
type Story = StoryObj<PageHeaderComponent>;

// ─── Stories ───────────────────────────────────────────────────────────────

export const Default: Story = {
  name: 'Default — title + subtitle + actions',
  args: {
    title: 'Reports',
    subtitle: 'Compare period-over-period metrics across all your projects.',
    level: 1,
    size: 'default',
    showDivider: true,
  },
  parameters: {
    docs: {
      description: {
        story:
          'The canonical page header: title, supporting subtitle, primary actions on the ' +
          'right, and a divider separating the header from the page content below.',
      },
    },
  },
  render: (args) => ({
    props: args,
    template: `
      <lc-page-header
        [title]="title"
        [subtitle]="subtitle"
        [level]="level"
        [size]="size"
        [showDivider]="showDivider"
        [badge]="badge"
      >
        <lc-button slot="actions" variant="secondary">Export</lc-button>
        <lc-button slot="actions" variant="primary">New report</lc-button>
      </lc-page-header>
    `,
  }),
};

export const WithBreadcrumbs: Story = {
  name: 'With breadcrumbs',
  args: {
    title: 'Workspace settings',
    subtitle: 'Configure billing, members and integrations.',
    showDivider: true,
  },
  parameters: {
    docs: {
      description: {
        story:
          'Breadcrumbs sit above the title row in their own slot. Pair with `<lc-breadcrumbs>` ' +
          'in production — a plain `<nav>` is shown here to keep the story self-contained.',
      },
    },
  },
  render: (args) => ({
    props: args,
    template: `
      <lc-page-header [title]="title" [subtitle]="subtitle" [showDivider]="showDivider">
        <nav slot="breadcrumbs" style="font-size:.875rem;color:#666">
          Home · Workspace · <span style="color:#111;font-weight:500">Settings</span>
        </nav>
        <lc-button slot="actions" variant="primary">Save changes</lc-button>
      </lc-page-header>
    `,
  }),
};

export const WithBadgeAndMeta: Story = {
  name: 'With badge + meta chips',
  args: {
    title: 'API console',
    subtitle: 'Test endpoints against the staging environment.',
    badge: 'Beta',
    showDivider: true,
  },
  parameters: {
    docs: {
      description: {
        story:
          'The `badge` input is great for surfacing release stage (Beta, Alpha, New). ' +
          'The meta slot below the title row is the right place for secondary metadata ' +
          'like environment chips, owner labels or unsaved-change indicators.',
      },
    },
  },
  render: (args) => ({
    props: args,
    template: `
      <lc-page-header [title]="title" [subtitle]="subtitle" [badge]="badge" [showDivider]="showDivider">
        <lc-button slot="actions" variant="primary">Open docs</lc-button>
        <lc-chip slot="meta" variant="info" size="sm">env: staging</lc-chip>
        <lc-chip slot="meta" variant="warning" size="sm">3 unsaved</lc-chip>
      </lc-page-header>
    `,
  }),
};

export const TitleSuffixBadges: Story = {
  name: 'Multiple badges beside the title (title-suffix slot)',
  args: { title: 'Project Overview', subtitle: 'Migration & modernization', showDivider: false },
  parameters: {
    docs: {
      description: {
        story:
          'When one `badge` is not enough, project the `[slot="title-suffix"]` to place ' +
          'several chips/badges inline next to the title — e.g. an identifier chip plus a ' +
          'status pill. The slot wraps on narrow viewports and collapses when empty.',
      },
    },
  },
  render: (args) => ({
    props: args,
    template: `
      <lc-page-header [title]="title" [subtitle]="subtitle" [showDivider]="showDivider">
        <lc-chip slot="title-suffix" size="sm">identifier</lc-chip>
        <lc-chip slot="title-suffix" size="sm" variant="success">Ready</lc-chip>
        <lc-button slot="actions" variant="primary">New item</lc-button>
      </lc-page-header>
    `,
  }),
};

export const WithBodyContent: Story = {
  name: 'Followed by tabs (tabs live below the header)',
  args: { title: 'Members', subtitle: '24 active across 3 teams', showDivider: false },
  parameters: {
    docs: {
      description: {
        story:
          '`lc-tabs` renders both the tab bar **and** its panel content, so it belongs ' +
          '*below* the page header — not inside it. The header stays focused on page ' +
          'identity (title, actions, meta), while tabs own the actual page content.',
      },
    },
  },
  render: (args) => ({
    props: args,
    template: `
      <lc-page-header [title]="title" [subtitle]="subtitle" [showDivider]="showDivider">
        <lc-button slot="actions" variant="primary">Invite member</lc-button>
      </lc-page-header>

      <lc-tabs>
        <lc-tab label="All">All members</lc-tab>
        <lc-tab label="Owners">Owners</lc-tab>
        <lc-tab label="Admins">Admins</lc-tab>
        <lc-tab label="Pending">Pending invites</lc-tab>
      </lc-tabs>
    `,
  }),
};

export const Compact: Story = {
  name: 'Compact — for side panels / modals',
  args: { title: 'Inbox', subtitle: '42 unread', size: 'compact', showDivider: true },
  parameters: {
    docs: {
      description: {
        story:
          'Use the compact size inside drawers, side panels or modals where vertical real ' +
          'estate is scarce. Title shrinks to `--font-size-lg`, gaps tighten globally.',
      },
    },
  },
  render: (args) => ({
    props: args,
    template: `
      <lc-page-header [title]="title" [subtitle]="subtitle" [size]="size" [showDivider]="showDivider">
        <lc-button slot="actions" variant="secondary" size="sm">Mark all read</lc-button>
      </lc-page-header>
    `,
  }),
};

export const Comfortable: Story = {
  name: 'Comfortable — for landing / onboarding',
  args: {
    title: 'Welcome back, Anna 👋',
    subtitle: 'Here is what changed since you were away.',
    size: 'comfortable',
  },
  parameters: {
    docs: {
      description: {
        story:
          'The comfortable size produces a near-hero feel for welcome and onboarding pages — ' +
          'larger title (`--font-size-3xl`), more breathing room around the block.',
      },
    },
  },
  render: (args) => ({
    props: args,
    template: `
      <lc-page-header [title]="title" [subtitle]="subtitle" [size]="size">
        <lc-button slot="actions" variant="primary" size="lg">Continue setup</lc-button>
      </lc-page-header>
    `,
  }),
};

export const HeadingLevels: Story = {
  name: 'Heading levels',
  parameters: {
    docs: {
      description: {
        story:
          'Use `level` to choose the semantic heading element. The visual size is controlled ' +
          'independently by `size` — so you can render a semantic `<h2>` at default visual size.',
      },
    },
  },
  render: () => ({
    template: `
      <div style="display:flex;flex-direction:column;gap:1.5rem">
        <lc-page-header [level]="1" title="level=1 → <h1>" subtitle="Top of page" />
        <lc-page-header [level]="2" title="level=2 → <h2>" subtitle="Section header" />
        <lc-page-header [level]="3" title="level=3 → <h3>" subtitle="Subsection header" />
      </div>
    `,
  }),
};

export const FullExample: Story = {
  name: 'Full example — every slot used',
  parameters: {
    docs: {
      description: {
        story:
          'A realistic page header using every slot: breadcrumbs, title, subtitle, badge, ' +
          'actions, meta chips and a tabs row in the body slot.',
      },
    },
  },
  render: () => ({
    template: `
      <lc-page-header
        title="Project Phoenix"
        subtitle="Internal tools for the Q3 rebrand initiative."
        badge="Active"
        [showDivider]="true"
      >
        <nav slot="breadcrumbs" style="font-size:.875rem;color:#666">
          Workspaces · Engineering · <span style="color:#111">Project Phoenix</span>
        </nav>

        <lc-button slot="actions" variant="secondary">Share</lc-button>
        <lc-button slot="actions" variant="secondary">Settings</lc-button>
        <lc-button slot="actions" variant="primary">Deploy</lc-button>

        <lc-chip slot="meta" variant="success" size="sm">on track</lc-chip>
        <lc-chip slot="meta" variant="info" size="sm">12 members</lc-chip>
        <lc-chip slot="meta" variant="warning" size="sm">3 blockers</lc-chip>
      </lc-page-header>

      <lc-tabs>
        <lc-tab label="Overview">Overview content</lc-tab>
        <lc-tab label="Tasks">Tasks content</lc-tab>
        <lc-tab label="Releases">Releases content</lc-tab>
        <lc-tab label="Activity">Activity content</lc-tab>
      </lc-tabs>
    `,
  }),
};

import type { Meta, StoryObj } from '@storybook/angular';
import { moduleMetadata } from '@storybook/angular';
import { ToolbarComponent } from './toolbar.component';
import { ButtonComponent } from '../button/button.component';

const meta: Meta<ToolbarComponent> = {
  title: 'Layout/Toolbar',
  component: ToolbarComponent,
  decorators: [moduleMetadata({ imports: [ToolbarComponent, ButtonComponent] })],
  parameters: {
    docs: {
      description: {
        component: `
The **Toolbar** is a horizontal strip for grouping related controls — filters, search, sort,
primary actions — above a table, inside a card, on top of a drawer, or anywhere a row of
buttons needs consistent visual rhythm.

It is **not** the global application header (use \`lc-header\` for that) and it is **not** a
page title block (use \`lc-page-header\` for that). It is a generic control bar that can
appear multiple times on the same screen.

---

#### Slot structure

| Slot | Purpose | Alignment |
|------|---------|-----------|
| \`[slot="start"]\` | Leading content — title stub, primary filter, icon | left |
| default | Middle content — search, secondary filters; grows to fill | flexible |
| \`[slot="end"]\` | Trailing actions — buttons, menus | right (auto) |

Empty slots collapse automatically (\`:empty { display: none }\`) so they do not produce
phantom gaps. If you only fill \`start\` and \`end\`, the middle becomes a flex spacer and
the end slot pushes itself to the right edge — no manual \`lc-spacer\` needed.

---

#### Density-awareness

The toolbar reads \`--lc-density-gap-*\` and \`--lc-density-padding-*\` from the cascade.
Wrapping any ancestor with \`data-density="compact|cosy|comfortable"\` automatically
rescales gap and padding without changing the template.

The local \`density\` input lets a single toolbar override the cascade — useful when one
toolbar (e.g. inside a card) should be tighter than the surrounding page.

---

#### Inputs

| Input | Type | Default | Description |
|-------|------|---------|-------------|
| \`density\` | \`'compact' \\| 'cosy' \\| 'comfortable'\` | \`'cosy'\` | Local override of density tokens |
| \`background\` | \`'transparent' \\| 'surface' \\| 'muted'\` | \`'transparent'\` | Fill color from theme tokens |
| \`border\` | \`'none' \\| 'bottom' \\| 'top' \\| 'around'\` | \`'none'\` | Divider placement |
| \`align\` | \`'start' \\| 'center' \\| 'end' \\| 'stretch' \\| 'baseline'\` | \`'center'\` | Cross-axis alignment of children |
| \`wrap\` | \`boolean\` | \`true\` | Allow children to wrap on narrow viewports |
| \`sticky\` | \`boolean\` | \`false\` | Pin to top of scroll container (\`position: sticky\`) |

---

#### Accessibility

- Renders with \`role="toolbar"\` on the host element
- Provide an \`aria-label\` on the host if the toolbar's purpose is not obvious from
  context (e.g. \`<lc-toolbar aria-label="Table filters">\`)
- Left / Right (and Home / End) move focus between the toolbar's controls, as the role
  promises; arrows are left alone inside text fields, selects and nested composite widgets
- Slot projection preserves DOM order, so tab order matches visual order; every control
  stays reachable via Tab (no roving tabindex over the projected content)

---

#### When to use what

| Need | Component |
|------|-----------|
| App-wide chrome (logo, user menu, theme toggle) | \`lc-header\` |
| The title of the current page | \`lc-page-header\` |
| A reusable row of controls anywhere on a page | \`lc-toolbar\` |
        `,
      },
    },
  },
  argTypes: {
    density: {
      control: 'inline-radio',
      options: ['compact', 'cosy', 'comfortable'],
      description: 'Visual density — controls local gap and padding tokens.',
      table: { defaultValue: { summary: 'cosy' } },
    },
    background: {
      control: 'inline-radio',
      options: ['transparent', 'surface', 'muted'],
      description: 'Background fill from semantic color tokens.',
      table: { defaultValue: { summary: 'transparent' } },
    },
    border: {
      control: 'inline-radio',
      options: ['none', 'bottom', 'top', 'around'],
      description: 'Divider placement around the toolbar.',
      table: { defaultValue: { summary: 'none' } },
    },
    align: {
      control: 'inline-radio',
      options: ['start', 'center', 'end', 'stretch', 'baseline'],
      description: 'Cross-axis alignment of projected content.',
      table: { defaultValue: { summary: 'center' } },
    },
    wrap: {
      control: 'boolean',
      description: 'Allow children to wrap on narrow viewports.',
      table: { defaultValue: { summary: 'true' } },
    },
    sticky: {
      control: 'boolean',
      description: 'Pin to top of scroll container.',
      table: { defaultValue: { summary: 'false' } },
    },
  },
};
export default meta;
type Story = StoryObj<ToolbarComponent>;

// ─── Stories ───────────────────────────────────────────────────────────────

export const Default: Story = {
  name: 'Default — title + actions',
  args: {
    density: 'cosy',
    background: 'transparent',
    border: 'none',
    wrap: true,
    align: 'center',
    sticky: false,
  },
  parameters: {
    docs: {
      description: {
        story:
          'The most common pattern: a title on the left and primary actions on the right. ' +
          'The middle slot is empty, so the end slot is auto-pushed to the right edge.',
      },
    },
  },
  render: (args) => ({
    props: args,
    template: `
      <lc-toolbar
        [density]="density"
        [background]="background"
        [border]="border"
        [wrap]="wrap"
        [align]="align"
        [sticky]="sticky"
      >
        <strong slot="start">Reports</strong>
        <lc-button slot="end" variant="secondary">Export</lc-button>
        <lc-button slot="end" variant="primary">New report</lc-button>
      </lc-toolbar>
    `,
  }),
};

export const WithMiddleContent: Story = {
  name: 'With search / filter in middle',
  args: { density: 'cosy', background: 'muted', border: 'around' },
  parameters: {
    docs: {
      description: {
        story:
          'When the middle slot is filled, it grows to fill the remaining space — perfect ' +
          'for a search field flanked by a label on the left and actions on the right.',
      },
    },
  },
  render: (args) => ({
    props: args,
    template: `
      <lc-toolbar [density]="density" [background]="background" [border]="border">
        <strong slot="start">Users</strong>
        <input
          placeholder="Search users…"
          style="flex:1;min-width:0;padding:.375rem .625rem;border:1px solid #ddd;border-radius:.375rem;"
        />
        <lc-button slot="end" variant="secondary" size="sm">Filter</lc-button>
        <lc-button slot="end" variant="primary" size="sm">Add user</lc-button>
      </lc-toolbar>
    `,
  }),
};

export const Compact: Story = {
  name: 'Compact — above a data table',
  args: { density: 'compact', background: 'surface', border: 'bottom' },
  parameters: {
    docs: {
      description: {
        story:
          'Tight spacing for data-dense tools — pairs naturally with a data table directly ' +
          'below. Uses `border="bottom"` to merge visually with the content underneath.',
      },
    },
  },
  render: (args) => ({
    props: args,
    template: `
      <lc-toolbar [density]="density" [background]="background" [border]="border">
        <span slot="start">42 items</span>
        <lc-button slot="end" variant="ghost" size="sm">Sort</lc-button>
        <lc-button slot="end" variant="ghost" size="sm">Group</lc-button>
        <lc-button slot="end" variant="ghost" size="sm">Filter</lc-button>
      </lc-toolbar>
    `,
  }),
};

export const Sticky: Story = {
  name: 'Sticky inside a scroll container',
  parameters: {
    docs: {
      description: {
        story:
          'With `sticky="true"` the toolbar pins to the top of its nearest scrolling ancestor. ' +
          'A subtle backdrop blur improves readability when content scrolls beneath it.',
      },
    },
  },
  render: () => ({
    template: `
      <div style="height:200px;overflow:auto;border:1px solid #ccc;border-radius:.5rem">
        <lc-toolbar background="surface" border="bottom" [sticky]="true">
          <strong slot="start">Sticky toolbar</strong>
          <lc-button slot="end" variant="primary" size="sm">Action</lc-button>
        </lc-toolbar>
        <div style="padding:1rem;line-height:1.6">
          <p>Scroll this container — the toolbar above stays pinned.</p>
          ${'<p>Lorem ipsum dolor sit amet, consectetur adipiscing elit.</p>'.repeat(20)}
        </div>
      </div>
    `,
  }),
};

export const Borders: Story = {
  name: 'Border variants',
  parameters: {
    docs: { description: { story: 'All four border options side-by-side.' } },
  },
  render: () => ({
    template: `
      <div style="display:flex;flex-direction:column;gap:1rem">
        <lc-toolbar border="none" background="muted">
          <span slot="start">border="none"</span>
          <lc-button slot="end" variant="secondary" size="sm">Action</lc-button>
        </lc-toolbar>
        <lc-toolbar border="bottom" background="muted">
          <span slot="start">border="bottom"</span>
          <lc-button slot="end" variant="secondary" size="sm">Action</lc-button>
        </lc-toolbar>
        <lc-toolbar border="top" background="muted">
          <span slot="start">border="top"</span>
          <lc-button slot="end" variant="secondary" size="sm">Action</lc-button>
        </lc-toolbar>
        <lc-toolbar border="around" background="muted">
          <span slot="start">border="around"</span>
          <lc-button slot="end" variant="secondary" size="sm">Action</lc-button>
        </lc-toolbar>
      </div>
    `,
  }),
};

export const DensityCascade: Story = {
  name: 'Inherits ancestor [data-density]',
  parameters: {
    docs: {
      description: {
        story:
          'Setting `data-density` on any ancestor automatically rescales the toolbar — ' +
          'no template changes required. The local `density` input always wins if set.',
      },
    },
  },
  render: () => ({
    template: `
      <div data-density="compact" style="border:1px dashed #ccc;padding:1rem;margin-bottom:1rem;border-radius:.5rem">
        <p style="margin:0 0 .5rem;font-family:system-ui">data-density="compact" (ancestor)</p>
        <lc-toolbar background="muted" border="around">
          <strong slot="start">Compact</strong>
          <lc-button slot="end" variant="secondary" size="sm">Action</lc-button>
        </lc-toolbar>
      </div>
      <div data-density="cosy" style="border:1px dashed #ccc;padding:1rem;margin-bottom:1rem;border-radius:.5rem">
        <p style="margin:0 0 .5rem;font-family:system-ui">data-density="cosy" (ancestor)</p>
        <lc-toolbar background="muted" border="around">
          <strong slot="start">Cosy</strong>
          <lc-button slot="end" variant="secondary" size="sm">Action</lc-button>
        </lc-toolbar>
      </div>
      <div data-density="comfortable" style="border:1px dashed #ccc;padding:1rem;border-radius:.5rem">
        <p style="margin:0 0 .5rem;font-family:system-ui">data-density="comfortable" (ancestor)</p>
        <lc-toolbar background="muted" border="around">
          <strong slot="start">Comfortable</strong>
          <lc-button slot="end" variant="secondary" size="sm">Action</lc-button>
        </lc-toolbar>
      </div>
    `,
  }),
};

export const InsideCard: Story = {
  name: 'Composed inside a card',
  parameters: {
    docs: {
      description: {
        story:
          'A card with a toolbar in its header and another toolbar as a footer action bar — ' +
          'demonstrates that toolbar is a generic primitive that composes well.',
      },
    },
  },
  render: () => ({
    template: `
      <div style="border:1px solid #e5e5e5;border-radius:.5rem;background:#fff;overflow:hidden;max-width:560px">
        <lc-toolbar background="surface" border="bottom">
          <strong slot="start">Project settings</strong>
          <lc-button slot="end" variant="ghost" size="sm" iconOnly="true" ariaLabel="More">⋯</lc-button>
        </lc-toolbar>
        <div style="padding:1rem">
          <p style="margin:0;color:#555">Card body content goes here.</p>
        </div>
        <lc-toolbar background="muted" border="top">
          <lc-button slot="end" variant="secondary">Cancel</lc-button>
          <lc-button slot="end" variant="primary">Save</lc-button>
        </lc-toolbar>
      </div>
    `,
  }),
};

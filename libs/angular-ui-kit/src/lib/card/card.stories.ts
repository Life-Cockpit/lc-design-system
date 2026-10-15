import type { Meta, StoryObj } from '@storybook/angular';
import { moduleMetadata } from '@storybook/angular';
import { CardComponent } from './card.component';
import { IconComponent } from '../icon/icon.component';
import { BadgeComponent } from '../badge/badge.component';

const meta: Meta<CardComponent> = {
  title: 'Components/Card',
  component: CardComponent,
  decorators: [moduleMetadata({ imports: [IconComponent, BadgeComponent] })],
  parameters: {
    docs: {
      description: {
        component: `
The Card component groups related content with visual hierarchy.
Use it for content sections, dashboard widgets, and list items.

**Key Features:**
- 5 variants (elevated, outlined, flat; 3.3: raised — the sign-in card with the long
  auth shadow — and dashed — the muted "coming soon" tile, never clickable)
- 3.3: \`borderRadius="xl"\` (24 px) — with \`outlined\` the content card on the "Weite" sky
- 3.3: \`headingLevel\` (2–6) for the built-in title
- Configurable padding and border radius
- Structured header: title + badge + right-side action slot
- Subtitle/description below title
- Clickable mode with hover effects
- Content projection for headers, body, and footers

**Header Structure:**
- \`title\` — Main heading
- \`badge\` + \`badgeVariant\` — Count/label pill next to title  
- \`[card-header-action]\` — Projected content on the right (buttons, links)
- \`subtitle\` — Description text below title
        `,
      },
    },
  },
  argTypes: {
    variant: {
      control: 'select',
      options: ['elevated', 'outlined', 'flat', 'raised', 'dashed'],
      description:
        'Visual style of the card. 3.3: `raised` — plain surface, hairline, the long soft `--shadow-auth-card`, no accent line (the sign-in card); `dashed` — the muted "coming soon" tile (`--color-muted-tile`, dashed `--color-muted-tile-border`, secondary ink), never clickable: `clickable` and `selected` are ignored.',
      table: { defaultValue: { summary: 'elevated' } },
    },
    padding: {
      control: 'select',
      options: ['none', 'xs', 'sm', 'md', 'lg'],
      description: 'Internal padding',
      table: { defaultValue: { summary: 'md' } },
    },
    borderRadius: {
      control: 'select',
      options: ['none', 'sm', 'md', 'lg', 'xl', 'full'],
      description: 'Corner rounding. 3.3: `xl` = 24 px (the "Weite" content card, with `variant="outlined"`).',
      table: { defaultValue: { summary: 'md' } },
    },
    headingLevel: {
      control: 'select',
      options: [2, 3, 4, 5, 6],
      description: '3.3: heading level of the built-in `title` (`h2`–`h6`). Semantics only, the look stays the same.',
      table: { defaultValue: { summary: '3' } },
    },
    clickable: { control: 'boolean', description: 'Adds hover effects and pointer cursor (ignored by `dashed`)' },
    selected: { control: 'boolean', description: 'Highlight as selected (when clickable)' },
    badge: { description: 'Badge text/count shown next to the title' },
    badgeVariant: {
      control: 'select',
      options: ['default', 'primary', 'success', 'warning', 'error'],
      description: 'Color variant of the badge',
    },
    icon: { description: 'Optional leading icon (Tabler name) shown as a tile before the title' },
    iconVariant: {
      control: 'select',
      options: ['brand', 'subtle'],
      description: 'Visual treatment of the leading icon tile',
      table: { defaultValue: { summary: 'brand' } },
    },
    iconSize: {
      control: 'inline-radio',
      options: ['sm', 'md'],
      description: 'Size of the leading icon tile',
      table: { defaultValue: { summary: 'md' } },
    },
  },
};

export default meta;
type Story = StoryObj<CardComponent>;

export const Default: Story = {
  args: { title: 'Project Overview', subtitle: 'Last updated 2 hours ago', variant: 'elevated', padding: 'md' },
  render: (args) => ({
    props: args,
    template: `
      <lc-card [title]="title" [subtitle]="subtitle" [variant]="variant" [padding]="padding">
        <p style="margin: 0; color: var(--color-text-secondary); font-size: 14px; line-height: 1.5;">
          Your project is on track. 12 of 15 tasks completed this sprint.
          The team velocity has increased by 20% compared to last month.
        </p>
      </lc-card>`,
  }),
};

export const WithIcon: Story = {
  args: {
    title: 'Section Title',
    subtitle: 'Supporting description text',
    icon: 'settings',
    iconVariant: 'brand',
    variant: 'elevated',
    padding: 'md',
  },
  render: (args) => ({
    props: args,
    template: `
      <lc-card [title]="title" [subtitle]="subtitle" [icon]="icon" [iconVariant]="iconVariant"
               [variant]="variant" [padding]="padding" [badge]="badge" [badgeVariant]="badgeVariant">
        <p style="margin: 0; color: var(--color-text-secondary); font-size: 14px; line-height: 1.5;">
          A leading icon tile pairs with the title to give each card a clear, scannable identity.
        </p>
      </lc-card>`,
  }),
};

export const CompactIcon: Story = {
  name: 'Compact icon (iconSize="sm")',
  parameters: {
    docs: { description: { story: 'Use `iconSize="sm"` for dense card headers where the default tile feels too large. Pairs with either `iconVariant`.' } },
  },
  render: () => ({
    template: `
      <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 16px; max-width: 640px;">
        <lc-card variant="outlined" title="Default tile" subtitle="iconSize=&quot;md&quot;" icon="settings" iconVariant="subtle" padding="md">
          <p style="margin: 0; font-size: 14px; color: var(--color-text-secondary);">Standard leading tile.</p>
        </lc-card>
        <lc-card variant="outlined" title="Compact tile" subtitle="iconSize=&quot;sm&quot;" icon="settings" iconVariant="subtle" iconSize="sm" padding="md">
          <p style="margin: 0; font-size: 14px; color: var(--color-text-secondary);">Smaller chip for dense layouts.</p>
        </lc-card>
      </div>`,
  }),
};

export const StatusBadgeSlot: Story = {
  name: 'Status badge slot (card-badge)',
  parameters: {
    docs: { description: { story: 'Project a full `lc-badge` into the `card-badge` slot for a rich status pill (e.g. with a leading `[dot]`) — takes visual precedence over the plain `badge` string input.' } },
  },
  render: () => ({
    template: `
      <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 16px; max-width: 640px;">
        <lc-card variant="outlined" title="Configuration" icon="adjustments" iconVariant="subtle" iconSize="sm" padding="md">
          <lc-badge card-badge variant="success" [rounded]="true" [dot]="true">Complete</lc-badge>
          <p style="margin: 0; font-size: 14px; color: var(--color-text-secondary);">All required fields are set.</p>
        </lc-card>
        <lc-card variant="outlined" title="Data source" icon="database" iconVariant="subtle" iconSize="sm" padding="md">
          <lc-badge card-badge variant="warning" [rounded]="true" [dot]="true">Out of date</lc-badge>
          <p style="margin: 0; font-size: 14px; color: var(--color-text-secondary);">Last synced a while ago.</p>
        </lc-card>
      </div>`,
  }),
};

export const Outlined: Story = {
  args: { title: 'Team Members', variant: 'outlined', padding: 'md' },
  render: (args) => ({
    props: args,
    template: `
      <lc-card [title]="title" [variant]="variant" [padding]="padding">
        <div style="display: flex; flex-direction: column; gap: 12px;">
          <div style="display: flex; align-items: center; gap: 12px;">
            <lc-avatar name="Alice Johnson" size="sm"></lc-avatar>
            <div>
              <p style="margin: 0; font-weight: 500; font-size: 14px;">Alice Johnson</p>
              <p style="margin: 0; font-size: 12px; color: var(--color-text-secondary);">Product Designer</p>
            </div>
          </div>
          <div style="display: flex; align-items: center; gap: 12px;">
            <lc-avatar name="Bob Smith" size="sm"></lc-avatar>
            <div>
              <p style="margin: 0; font-weight: 500; font-size: 14px;">Bob Smith</p>
              <p style="margin: 0; font-size: 12px; color: var(--color-text-secondary);">Frontend Developer</p>
            </div>
          </div>
          <div style="display: flex; align-items: center; gap: 12px;">
            <lc-avatar name="Carol White" size="sm"></lc-avatar>
            <div>
              <p style="margin: 0; font-weight: 500; font-size: 14px;">Carol White</p>
              <p style="margin: 0; font-size: 12px; color: var(--color-text-secondary);">Backend Engineer</p>
            </div>
          </div>
        </div>
      </lc-card>`,
  }),
};

export const Flat: Story = {
  args: { title: 'Quick Stats', variant: 'flat', padding: 'md' },
  render: (args) => ({
    props: args,
    template: `
      <lc-card [title]="title" [variant]="variant" [padding]="padding" style="background: #f9fafb;">
        <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; text-align: center;">
          <div>
            <p style="margin: 0; font-size: 24px; font-weight: 700; color: var(--color-text-primary);">128</p>
            <p style="margin: 4px 0 0; font-size: 12px; color: var(--color-text-secondary);">Active Users</p>
          </div>
          <div>
            <p style="margin: 0; font-size: 24px; font-weight: 700; color: var(--color-text-primary);">94%</p>
            <p style="margin: 4px 0 0; font-size: 12px; color: var(--color-text-secondary);">Uptime</p>
          </div>
          <div>
            <p style="margin: 0; font-size: 24px; font-weight: 700; color: var(--color-text-primary);">3.2s</p>
            <p style="margin: 4px 0 0; font-size: 12px; color: var(--color-text-secondary);">Avg Response</p>
          </div>
        </div>
      </lc-card>`,
  }),
};

export const Clickable: Story = {
  parameters: {
    docs: { description: { story: 'Clickable cards show hover effects and emit `cardClick` events. Use for selectable items.' } },
  },
  render: () => ({
    template: `
      <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; max-width: 600px;">
        <lc-card variant="outlined" [clickable]="true" title="Starter" padding="md">
          <p style="margin: 0 0 8px; font-size: 24px; font-weight: 700;">$9<span style="font-size: 14px; color: var(--color-text-secondary);">/mo</span></p>
          <p style="margin: 0; font-size: 13px; color: var(--color-text-secondary);">5 projects, 1 user</p>
        </lc-card>
        <lc-card variant="outlined" [clickable]="true" [selected]="true" title="Pro" padding="md">
          <p style="margin: 0 0 8px; font-size: 24px; font-weight: 700;">$29<span style="font-size: 14px; color: var(--color-text-secondary);">/mo</span></p>
          <p style="margin: 0; font-size: 13px; color: var(--color-text-secondary);">Unlimited projects</p>
        </lc-card>
        <lc-card variant="outlined" [clickable]="true" title="Enterprise" padding="md">
          <p style="margin: 0 0 8px; font-size: 24px; font-weight: 700;">Custom</p>
          <p style="margin: 0; font-size: 13px; color: var(--color-text-secondary);">Dedicated support</p>
        </lc-card>
      </div>`,
  }),
};

export const WithFooter: Story = {
  parameters: {
    docs: { description: { story: 'Cards can contain multiple projected sections for header, body, and footer areas.' } },
  },
  render: () => ({
    template: `
      <lc-card variant="elevated" padding="md" style="max-width: 400px;">
        <div style="margin-bottom: 12px;">
          <h3 style="margin: 0 0 4px; font-size: 16px; font-weight: 600;">Subscription Renewal</h3>
          <p style="margin: 0; font-size: 13px; color: var(--color-text-secondary);">Your current plan expires on June 1, 2026</p>
        </div>
        <p style="margin: 0 0 16px; font-size: 14px; color: var(--color-text-secondary); line-height: 1.5;">
          Renew now to keep access to all premium features including advanced analytics, priority support, and unlimited exports.
        </p>
        <div style="display: flex; gap: 8px; justify-content: flex-end; padding-top: 12px; border-top: 1px solid #e5e7eb;">
          <lc-button variant="ghost" size="sm">Remind Later</lc-button>
          <lc-button variant="primary" size="sm">Renew Now</lc-button>
        </div>
      </lc-card>`,
  }),
};

export const FooterSlot: Story = {
  name: 'Footer slot (card-footer)',
  parameters: {
    docs: { description: { story: 'Project content into the `card-footer` slot to get a standardized footer with a divider and consistent padding — no manual `border-top` needed. Layout inside the footer is up to you (e.g. an action left, a link right).' } },
  },
  render: () => ({
    template: `
      <lc-card variant="elevated" title="Component" subtitle="Overview" icon="package" iconVariant="subtle" iconSize="sm" padding="md" style="max-width: 400px;">
        <lc-badge card-badge variant="primary" [rounded]="true" [dot]="true">Ready</lc-badge>
        <lc-description-list
          [items]="[
            { term: 'Type', value: 'Container' },
            { term: 'Version', value: '1.4.0', emphasis: 'mono' },
            { term: 'Status', value: 'Maintained', emphasis: 'strong' }
          ]" />
        <div card-footer style="width: 100%; display: flex; align-items: center; justify-content: space-between;">
          <lc-button variant="ghost" size="sm">Edit</lc-button>
          <a href="#" style="font-size: 13px; color: var(--color-primary-500); text-decoration: none;">Details ›</a>
        </div>
      </lc-card>`,
  }),
};

export const Variants: Story = {
  parameters: {
    docs: { description: { story: 'All card variants side by side.' } },
  },
  render: () => ({
    template: `
      <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px;">
        <lc-card variant="elevated" title="Elevated" padding="md">
          <p style="margin: 0; font-size: 14px; color: var(--color-text-secondary);">Box shadow for depth</p>
        </lc-card>
        <lc-card variant="outlined" title="Outlined" padding="md">
          <p style="margin: 0; font-size: 14px; color: var(--color-text-secondary);">Border only, no shadow</p>
        </lc-card>
        <lc-card variant="flat" title="Flat" padding="md">
          <p style="margin: 0; font-size: 14px; color: var(--color-text-secondary);">No shadow or border</p>
        </lc-card>
      </div>`,
  }),
};

export const WithBadge: Story = {
  name: 'With Badge',
  parameters: {
    docs: { description: { story: 'Title with a badge/count pill. Use `badge` input for counts or status labels.' } },
  },
  render: () => ({
    template: `
      <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 16px; max-width: 700px;">
        <lc-card variant="outlined" title="Members" badge="3" subtitle="People with access to this organization." padding="lg">
          <div style="display: flex; flex-direction: column; gap: 12px;">
            <div style="display: flex; align-items: center; gap: 12px;">
              <lc-avatar name="Jane Doe" size="sm"></lc-avatar>
              <div style="flex: 1;">
                <p style="margin: 0; font-weight: 500; font-size: 14px;">Jane Doe</p>
                <p style="margin: 0; font-size: 12px; color: var(--color-text-secondary);">jane@example.com</p>
              </div>
              <lc-chip variant="success" size="sm">owner</lc-chip>
            </div>
          </div>
        </lc-card>
        <lc-card variant="outlined" title="Notifications" badge="12" badgeVariant="error" subtitle="Unread alerts and updates." padding="lg">
          <p style="margin: 0; font-size: 14px; color: var(--color-text-secondary);">You have 12 unread notifications.</p>
        </lc-card>
      </div>`,
  }),
};

export const WithHeaderAction: Story = {
  name: 'With Header Action',
  parameters: {
    docs: { description: { story: 'Use `[card-header-action]` slot to project buttons or links on the right side of the header.' } },
  },
  render: () => ({
    template: `
      <lc-card variant="outlined" title="Projects" subtitle="Each project maps to a Git repository." padding="lg" style="max-width: 600px;">
        <lc-button card-header-action variant="primary" size="sm" iconLeft="plus">New project</lc-button>
        <div style="display: flex; flex-direction: column; gap: 16px;">
          <div style="display: flex; align-items: flex-start; justify-content: space-between;">
            <div>
              <p style="margin: 0; font-weight: 600; font-size: 15px;">Sample Project</p>
              <p style="margin: 2px 0 0; font-size: 13px; color: var(--color-text-secondary);">Spec driven project</p>
            </div>
            <div style="display: flex; gap: 8px;">
              <lc-button variant="ghost" size="xs" iconLeft="pencil">Edit</lc-button>
              <lc-button variant="ghost" size="xs" iconLeft="trash">Delete</lc-button>
            </div>
          </div>
        </div>
      </lc-card>`,
  }),
};

export const SectionCards: Story = {
  name: 'Section Cards (Dashboard Pattern)',
  parameters: {
    docs: { description: { story: 'Common dashboard pattern: outlined cards as content sections with structured headers, badges, and actions.' } },
  },
  render: () => ({
    template: `
      <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 20px; max-width: 900px;">
        <lc-card variant="outlined" title="Members" badge="1" badgeVariant="primary" subtitle="People with access to this organization." padding="lg">
          <lc-button card-header-action variant="ghost" size="sm" iconLeft="plus">Invite</lc-button>
          <div style="display: flex; align-items: center; gap: 12px;">
            <lc-avatar name="Jane Doe" size="sm"></lc-avatar>
            <div style="flex: 1;">
              <p style="margin: 0; font-weight: 500; font-size: 14px;">Jane Doe</p>
              <p style="margin: 0; font-size: 12px; color: var(--color-text-secondary);">jane@example.com</p>
            </div>
            <lc-chip variant="success" size="sm">owner</lc-chip>
          </div>
        </lc-card>
        <lc-card variant="outlined" title="Projects" badge="2" badgeVariant="primary" subtitle="Each project maps to a Git repository." padding="lg">
          <lc-button card-header-action variant="primary" size="sm" iconLeft="plus">New project</lc-button>
          <div style="display: flex; flex-direction: column; gap: 12px;">
            <div style="padding: 10px 0; border-bottom: 1px solid #f3f4f6;">
              <p style="margin: 0; font-weight: 500; font-size: 14px;">Sample Project</p>
              <p style="margin: 2px 0 0; font-size: 12px; color: var(--color-text-secondary);">Spec driven project</p>
            </div>
            <div style="padding: 10px 0;">
              <p style="margin: 0; font-weight: 500; font-size: 14px;">Design System</p>
              <p style="margin: 2px 0 0; font-size: 12px; color: var(--color-text-secondary);">UI component library</p>
            </div>
          </div>
        </lc-card>
      </div>`,
  }),
};

// ── 3.3 ────────────────────────────────────────────────────────────────────

/** The content card on the "Weite" sky: outlined, hairline, radius 24, no shadow. */
export const WeiteContentCard: Story = {
  name: 'Weite content card (3.3)',
  args: { title: 'Mitglieder', headingLevel: 2, variant: 'outlined', borderRadius: 'xl', padding: 'lg' },
  render: (args) => ({
    props: args,
    template: `
      <div style="max-width: 420px;">
        <lc-card [title]="title" [headingLevel]="headingLevel" [variant]="variant" [borderRadius]="borderRadius" [padding]="padding">
          <p style="margin: 0;">Lena Brandt · Tom Ek</p>
        </lc-card>
      </div>
    `,
  }),
};

/** The sign-in card: plain surface, hairline and the long, soft auth shadow. */
export const RaisedAuthCard: Story = {
  name: 'Raised – sign-in card (3.3)',
  render: () => ({
    template: `
      <div style="max-width: 440px; padding: 2rem 0 4rem;">
        <lc-card variant="raised" borderRadius="xl" padding="lg">
          <p style="margin: 0;">Formular</p>
        </lc-card>
      </div>
    `,
  }),
};

/** Muted "coming soon" tiles: never clickable, no focus, icons decorative. */
export const DashedComingSoon: Story = {
  name: 'Dashed – coming soon tiles (3.3)',
  render: () => ({
    template: `
      <ul style="list-style: none; margin: 0; padding: 0; display: flex; gap: 0.5rem; max-width: 360px;">
        <li style="flex: 1; min-width: 0;">
          <lc-card variant="dashed" padding="sm" borderRadius="lg">
            <span style="display: flex; align-items: center; justify-content: space-between; gap: 0.25rem;">
              <lc-icon name="building-library" size="sm" [decorative]="true" />
              <lc-badge size="sm" [rounded]="true">Bald</lc-badge>
            </span>
            <span style="font-size: 0.875rem; font-weight: 600;">Bankkonten</span>
          </lc-card>
        </li>
        <li style="flex: 1; min-width: 0;">
          <lc-card variant="dashed" padding="sm" borderRadius="lg" [clickable]="true">
            <span style="display: flex; align-items: center; justify-content: space-between; gap: 0.25rem;">
              <lc-icon name="document-text" size="sm" [decorative]="true" />
              <lc-badge size="sm" [rounded]="true">Bald</lc-badge>
            </span>
            <span style="font-size: 0.875rem; font-weight: 600;">Verträge</span>
          </lc-card>
        </li>
      </ul>
    `,
  }),
};


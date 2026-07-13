import type { Meta, StoryObj } from '@storybook/angular';
import { CardComponent } from './card.component';

const meta: Meta<CardComponent> = {
  title: 'Components/Card',
  component: CardComponent,
  parameters: {
    docs: {
      description: {
        component: `
The Card component groups related content with visual hierarchy.
Use it for content sections, dashboard widgets, and list items.

**Key Features:**
- 3 variants (elevated, outlined, flat)
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
      options: ['elevated', 'outlined', 'flat'],
      description: 'Visual style of the card',
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
      options: ['none', 'sm', 'md', 'lg', 'full'],
      description: 'Corner rounding',
      table: { defaultValue: { summary: 'md' } },
    },
    clickable: { control: 'boolean', description: 'Adds hover effects and pointer cursor' },
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
        <p style="margin: 0; color: #4b5563; font-size: 14px; line-height: 1.5;">
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
              <p style="margin: 0; font-size: 12px; color: #6b7280;">Product Designer</p>
            </div>
          </div>
          <div style="display: flex; align-items: center; gap: 12px;">
            <lc-avatar name="Bob Smith" size="sm"></lc-avatar>
            <div>
              <p style="margin: 0; font-weight: 500; font-size: 14px;">Bob Smith</p>
              <p style="margin: 0; font-size: 12px; color: #6b7280;">Frontend Developer</p>
            </div>
          </div>
          <div style="display: flex; align-items: center; gap: 12px;">
            <lc-avatar name="Carol White" size="sm"></lc-avatar>
            <div>
              <p style="margin: 0; font-weight: 500; font-size: 14px;">Carol White</p>
              <p style="margin: 0; font-size: 12px; color: #6b7280;">Backend Engineer</p>
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
            <p style="margin: 0; font-size: 24px; font-weight: 700; color: #111827;">128</p>
            <p style="margin: 4px 0 0; font-size: 12px; color: #6b7280;">Active Users</p>
          </div>
          <div>
            <p style="margin: 0; font-size: 24px; font-weight: 700; color: #111827;">94%</p>
            <p style="margin: 4px 0 0; font-size: 12px; color: #6b7280;">Uptime</p>
          </div>
          <div>
            <p style="margin: 0; font-size: 24px; font-weight: 700; color: #111827;">3.2s</p>
            <p style="margin: 4px 0 0; font-size: 12px; color: #6b7280;">Avg Response</p>
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
          <p style="margin: 0 0 8px; font-size: 24px; font-weight: 700;">$9<span style="font-size: 14px; color: #6b7280;">/mo</span></p>
          <p style="margin: 0; font-size: 13px; color: #6b7280;">5 projects, 1 user</p>
        </lc-card>
        <lc-card variant="outlined" [clickable]="true" [selected]="true" title="Pro" padding="md">
          <p style="margin: 0 0 8px; font-size: 24px; font-weight: 700;">$29<span style="font-size: 14px; color: #6b7280;">/mo</span></p>
          <p style="margin: 0; font-size: 13px; color: #6b7280;">Unlimited projects</p>
        </lc-card>
        <lc-card variant="outlined" [clickable]="true" title="Enterprise" padding="md">
          <p style="margin: 0 0 8px; font-size: 24px; font-weight: 700;">Custom</p>
          <p style="margin: 0; font-size: 13px; color: #6b7280;">Dedicated support</p>
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
          <p style="margin: 0; font-size: 13px; color: #6b7280;">Your current plan expires on June 1, 2026</p>
        </div>
        <p style="margin: 0 0 16px; font-size: 14px; color: #4b5563; line-height: 1.5;">
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
          <p style="margin: 0; font-size: 14px; color: #6b7280;">Box shadow for depth</p>
        </lc-card>
        <lc-card variant="outlined" title="Outlined" padding="md">
          <p style="margin: 0; font-size: 14px; color: #6b7280;">Border only, no shadow</p>
        </lc-card>
        <lc-card variant="flat" title="Flat" padding="md">
          <p style="margin: 0; font-size: 14px; color: #6b7280;">No shadow or border</p>
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
              <lc-avatar name="Eric Fritzsche" size="sm"></lc-avatar>
              <div style="flex: 1;">
                <p style="margin: 0; font-weight: 500; font-size: 14px;">Eric Fritzsche</p>
                <p style="margin: 0; font-size: 12px; color: #6b7280;">eric@lc-factory.local</p>
              </div>
              <lc-chip variant="success" size="sm">owner</lc-chip>
            </div>
          </div>
        </lc-card>
        <lc-card variant="outlined" title="Notifications" badge="12" badgeVariant="error" subtitle="Unread alerts and updates." padding="lg">
          <p style="margin: 0; font-size: 14px; color: #6b7280;">You have 12 unread notifications.</p>
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
      <lc-card variant="outlined" title="Projects" subtitle="Each project maps to a Git repository the agents can work in." padding="lg" style="max-width: 600px;">
        <lc-button card-header-action variant="primary" size="sm" iconLeft="plus">New project</lc-button>
        <div style="display: flex; flex-direction: column; gap: 16px;">
          <div style="display: flex; align-items: flex-start; justify-content: space-between;">
            <div>
              <p style="margin: 0; font-weight: 600; font-size: 15px;">LC-Factory</p>
              <p style="margin: 2px 0 0; font-size: 13px; color: #6b7280;">Spec driven project</p>
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
            <lc-avatar name="Eric Fritzsche" size="sm"></lc-avatar>
            <div style="flex: 1;">
              <p style="margin: 0; font-weight: 500; font-size: 14px;">Eric Fritzsche</p>
              <p style="margin: 0; font-size: 12px; color: #6b7280;">eric@lc-factory.local</p>
            </div>
            <lc-chip variant="success" size="sm">owner</lc-chip>
          </div>
        </lc-card>
        <lc-card variant="outlined" title="Projects" badge="2" badgeVariant="primary" subtitle="Each project maps to a Git repository." padding="lg">
          <lc-button card-header-action variant="primary" size="sm" iconLeft="plus">New project</lc-button>
          <div style="display: flex; flex-direction: column; gap: 12px;">
            <div style="padding: 10px 0; border-bottom: 1px solid #f3f4f6;">
              <p style="margin: 0; font-weight: 500; font-size: 14px;">LC-Factory</p>
              <p style="margin: 2px 0 0; font-size: 12px; color: #6b7280;">Spec driven project</p>
            </div>
            <div style="padding: 10px 0;">
              <p style="margin: 0; font-weight: 500; font-size: 14px;">Design System</p>
              <p style="margin: 2px 0 0; font-size: 12px; color: #6b7280;">UI component library</p>
            </div>
          </div>
        </lc-card>
      </div>`,
  }),
};

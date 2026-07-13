import type { Meta, StoryObj } from '@storybook/angular';
import { BadgeComponent } from './badge.component';

const meta: Meta<BadgeComponent> = {
  title: 'Data Display/Badge',
  component: BadgeComponent,
  parameters: {
    docs: {
      description: {
        component: `
The Badge component displays short status labels, counts, or tags.
Use it for statuses, categories, notifications, and metadata.

**Key Features:**
- 6 semantic variants
- 4 sizes (xs, sm, md, lg)
- Rounded pill mode
- Content projection for custom content
        `,
      },
    },
  },
  argTypes: {
    variant: {
      control: 'select',
      options: ['default', 'primary', 'success', 'warning', 'error', 'info'],
      description: 'Color variant',
      table: { defaultValue: { summary: 'default' } },
    },
    size: {
      control: 'select',
      options: ['xs', 'sm', 'md', 'lg'],
      description: 'Badge size',
      table: { defaultValue: { summary: 'md' } },
    },
    rounded: { control: 'boolean', description: 'Pill-shaped badge' },
    dot: { control: 'boolean', description: 'Show a leading status dot in the variant color' },
  },
};

export default meta;
type Story = StoryObj<BadgeComponent>;

export const Default: Story = {
  args: { variant: 'default', size: 'md' },
  render: (args) => ({
    props: args,
    template: `<lc-badge [variant]="variant" [size]="size">Draft</lc-badge>`,
  }),
};

export const Primary: Story = {
  args: { variant: 'primary', size: 'md' },
  render: (args) => ({
    props: args,
    template: `<lc-badge [variant]="variant" [size]="size">New</lc-badge>`,
  }),
};

export const Success: Story = {
  args: { variant: 'success', size: 'md' },
  render: (args) => ({
    props: args,
    template: `<lc-badge [variant]="variant" [size]="size">Active</lc-badge>`,
  }),
};

export const Warning: Story = {
  args: { variant: 'warning', size: 'md' },
  render: (args) => ({
    props: args,
    template: `<lc-badge [variant]="variant" [size]="size">Pending</lc-badge>`,
  }),
};

export const ErrorBadge: Story = {
  name: 'Error',
  args: { variant: 'error', size: 'md' },
  render: (args) => ({
    props: args,
    template: `<lc-badge [variant]="variant" [size]="size">Failed</lc-badge>`,
  }),
};

export const Pill: Story = {
  parameters: {
    docs: { description: { story: 'Rounded pill badges work well for counts and notification indicators.' } },
  },
  args: { variant: 'primary', rounded: true },
  render: (args) => ({
    props: args,
    template: `<lc-badge [variant]="variant" [rounded]="rounded">12</lc-badge>`,
  }),
};

export const WithDot: Story = {
  name: 'With status dot',
  parameters: {
    docs: { description: { story: 'Set `[dot]` to prefix the label with a small dot filled in the variant color — a scannable "● label" status pattern.' } },
  },
  args: { variant: 'success', rounded: true, dot: true },
  render: (args) => ({
    props: args,
    template: `<lc-badge [variant]="variant" [rounded]="rounded" [dot]="dot">Ready</lc-badge>`,
  }),
};

export const StatusDots: Story = {
  name: 'Status dots (all variants)',
  parameters: {
    docs: { description: { story: 'The dot inherits each variant’s text color, so it stays consistent across the whole scale.' } },
  },
  render: () => ({
    template: `
      <div style="display: flex; gap: 8px; flex-wrap: wrap; align-items: center;">
        <lc-badge variant="default" [rounded]="true" [dot]="true">Idle</lc-badge>
        <lc-badge variant="primary" [rounded]="true" [dot]="true">Assigned</lc-badge>
        <lc-badge variant="info" [rounded]="true" [dot]="true">In progress</lc-badge>
        <lc-badge variant="warning" [rounded]="true" [dot]="true">Needs review</lc-badge>
        <lc-badge variant="success" [rounded]="true" [dot]="true">Complete</lc-badge>
        <lc-badge variant="error" [rounded]="true" [dot]="true">Blocked</lc-badge>
      </div>`,
  }),
};

export const AllVariants: Story = {
  parameters: {
    docs: { description: { story: 'All badge variants at a glance. Use semantic colors for consistent meaning.' } },
  },
  render: () => ({
    template: `
      <div style="display: flex; flex-direction: column; gap: 16px;">
        <div>
          <p style="margin: 0 0 8px; font-weight: 600; font-size: 14px; color: #555;">Status Badges</p>
          <div style="display: flex; gap: 8px; flex-wrap: wrap; align-items: center;">
            <lc-badge variant="default">Draft</lc-badge>
            <lc-badge variant="primary">In Review</lc-badge>
            <lc-badge variant="info">In Progress</lc-badge>
            <lc-badge variant="warning">Pending</lc-badge>
            <lc-badge variant="success">Published</lc-badge>
            <lc-badge variant="error">Rejected</lc-badge>
          </div>
        </div>
        <div>
          <p style="margin: 0 0 8px; font-weight: 600; font-size: 14px; color: #555;">Pill Badges (counts)</p>
          <div style="display: flex; gap: 8px; flex-wrap: wrap; align-items: center;">
            <lc-badge variant="primary" [rounded]="true">3</lc-badge>
            <lc-badge variant="error" [rounded]="true">99+</lc-badge>
            <lc-badge variant="success" [rounded]="true">✓</lc-badge>
          </div>
        </div>
        <div>
          <p style="margin: 0 0 8px; font-weight: 600; font-size: 14px; color: #555;">Sizes</p>
          <div style="display: flex; gap: 8px; flex-wrap: wrap; align-items: center;">
            <lc-badge variant="primary" size="xs">XS</lc-badge>
            <lc-badge variant="primary" size="sm">Small</lc-badge>
            <lc-badge variant="primary" size="md">Medium</lc-badge>
            <lc-badge variant="primary" size="lg">Large</lc-badge>
          </div>
        </div>
      </div>`,
  }),
};

export const InContext: Story = {
  parameters: {
    docs: { description: { story: 'Badges used in navigation items and list contexts.' } },
  },
  render: () => ({
    template: `
      <div style="max-width: 280px; border: 1px solid #e5e7eb; border-radius: 8px; overflow: hidden;">
        <div style="padding: 12px 16px; display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #e5e7eb;">
          <span style="font-size: 14px;">Inbox</span>
          <lc-badge variant="primary" [rounded]="true">24</lc-badge>
        </div>
        <div style="padding: 12px 16px; display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #e5e7eb;">
          <span style="font-size: 14px;">Tasks</span>
          <lc-badge variant="warning" [rounded]="true">5</lc-badge>
        </div>
        <div style="padding: 12px 16px; display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #e5e7eb;">
          <span style="font-size: 14px;">Notifications</span>
          <lc-badge variant="error" [rounded]="true">3</lc-badge>
        </div>
        <div style="padding: 12px 16px; display: flex; justify-content: space-between; align-items: center;">
          <span style="font-size: 14px;">Archive</span>
          <lc-badge variant="default">128</lc-badge>
        </div>
      </div>`,
  }),
};

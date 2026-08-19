import type { Meta, StoryObj } from '@storybook/angular';
import { ChipComponent } from './chip.component';

/**
 * Chips are compact elements representing tags, filters, selections, or status labels.
 * They can be static labels or interactive (removable). Use them in filter bars,
 * tag inputs, and status indicators.
 */
const meta: Meta<ChipComponent> = {
  title: 'Data Display/Chip',
  component: ChipComponent,
  argTypes: {
    variant: {
      control: 'select',
      options: ['default', 'primary', 'success', 'warning', 'error', 'info'],
      description: 'Color variant that communicates the chip\'s semantic meaning',
    },
    size: {
      control: 'select',
      options: ['sm', 'md', 'lg'],
      description: 'Controls chip height and text size',
    },
    icon: { description: 'Icon name displayed before the label (from lc-icon set)' },
    removable: { description: 'Shows a close button to allow the user to dismiss the chip' },
    clickable: { description: 'Renders the chip as a button that emits chipClick on activation' },
    disabled: { description: 'Visually dims the chip and prevents interaction' },
  },

  parameters: {
    docs: {
      description: {
        component: `
Chip component for displaying tags, filters, or selections.

**Key Features:**
- Color variants (primary, secondary, success, warning, error, info, neutral)
- Multiple size options (sm, md, lg)
- Optional leading icon
- Removable with close button and remove event
- Disabled state support
`,
      },
    },
  },
};

export default meta;
type Story = StoryObj<ChipComponent>;

export const Default: Story = {
  args: { variant: 'default', size: 'md' },
  render: (args) => ({
    props: args,
    template: `<lc-chip [variant]="variant" [size]="size">Design System</lc-chip>`,
  }),
};

export const WithIcon: Story = {
  args: { variant: 'primary', icon: 'tag', size: 'md' },
  render: (args) => ({
    props: args,
    template: `<lc-chip [variant]="variant" [icon]="icon" [size]="size">Frontend</lc-chip>`,
  }),
};

export const Removable: Story = {
  args: { variant: 'info', removable: true, size: 'md' },
  render: (args) => ({
    props: args,
    template: `<lc-chip [variant]="variant" [removable]="removable" [size]="size">filter: active</lc-chip>`,
  }),
};

export const Clickable: Story = {
  args: { variant: 'default', clickable: true, size: 'md' },
  render: (args) => ({
    props: args,
    template: `<lc-chip [variant]="variant" [clickable]="clickable" [size]="size">Related item</lc-chip>`,
  }),
};

export const ClickableRemovable: Story = {
  name: 'Clickable + Removable',
  parameters: {
    docs: { description: { story: 'Two sibling buttons inside the pill — activate (chipClick) and remove — so no control is nested in another and both are reachable with Tab.' } },
  },
  render: () => ({
    template: `
      <div style="display: flex; gap: 8px; flex-wrap: wrap;">
        <lc-chip variant="primary" [clickable]="true" [removable]="true">Item A</lc-chip>
        <lc-chip variant="default" [clickable]="true" [removable]="true">Item B</lc-chip>
        <lc-chip variant="default" [clickable]="true" [disabled]="true">Item C (disabled)</lc-chip>
      </div>`,
  }),
};

export const Disabled: Story = {
  args: { variant: 'primary', disabled: true, size: 'md' },
  render: (args) => ({
    props: args,
    template: `<lc-chip [variant]="variant" [disabled]="disabled" [size]="size">Archived</lc-chip>`,
  }),
};

export const AllVariants: Story = {
  name: 'All Color Variants',
  render: () => ({
    template: `
      <div style="display: flex; gap: 8px; flex-wrap: wrap; align-items: center;">
        <lc-chip variant="default">Default</lc-chip>
        <lc-chip variant="primary">Primary</lc-chip>
        <lc-chip variant="success">Success</lc-chip>
        <lc-chip variant="warning">Warning</lc-chip>
        <lc-chip variant="error">Error</lc-chip>
        <lc-chip variant="info">Info</lc-chip>
      </div>`,
  }),
};

export const Sizes: Story = {
  name: 'Size Comparison',
  render: () => ({
    template: `
      <div style="display: flex; gap: 8px; align-items: center;">
        <lc-chip variant="primary" size="sm">Small</lc-chip>
        <lc-chip variant="primary" size="md">Medium</lc-chip>
        <lc-chip variant="primary" size="lg">Large</lc-chip>
      </div>`,
  }),
};

export const StatusLabels: Story = {
  name: 'Status Labels (Use Case)',
  render: () => ({
    template: `
      <div style="display: flex; flex-direction: column; gap: 12px; max-width: 400px;">
        <div style="display: flex; justify-content: space-between; align-items: center; padding: 8px 0; border-bottom: 1px solid #eee;">
          <span>Deploy to staging</span>
          <lc-chip variant="success" size="sm">Completed</lc-chip>
        </div>
        <div style="display: flex; justify-content: space-between; align-items: center; padding: 8px 0; border-bottom: 1px solid #eee;">
          <span>Code review</span>
          <lc-chip variant="warning" size="sm">In Progress</lc-chip>
        </div>
        <div style="display: flex; justify-content: space-between; align-items: center; padding: 8px 0; border-bottom: 1px solid #eee;">
          <span>Database migration</span>
          <lc-chip variant="error" size="sm">Failed</lc-chip>
        </div>
        <div style="display: flex; justify-content: space-between; align-items: center; padding: 8px 0;">
          <span>Unit tests</span>
          <lc-chip variant="info" size="sm">Pending</lc-chip>
        </div>
      </div>`,
  }),
};

export const FilterBar: Story = {
  name: 'Active Filters (Composition)',
  render: () => ({
    template: `
      <div style="max-width: 500px;">
        <div style="font-size: 13px; color: #666; margin-bottom: 8px;">Active filters:</div>
        <div style="display: flex; gap: 8px; flex-wrap: wrap;">
          <lc-chip variant="primary" icon="user" [removable]="true">Assigned to me</lc-chip>
          <lc-chip variant="default" [removable]="true">Priority: High</lc-chip>
          <lc-chip variant="success" [removable]="true">Status: Open</lc-chip>
          <lc-chip variant="info" icon="calendar" [removable]="true">Due this week</lc-chip>
        </div>
      </div>`,
  }),
};

export const TagInput: Story = {
  name: 'Tag Input (Composition)',
  render: () => ({
    template: `
      <div style="max-width: 400px;">
        <label style="display: block; font-size: 14px; font-weight: 500; margin-bottom: 6px;">Tags</label>
        <div style="border: 1px solid #ddd; border-radius: 6px; padding: 8px; display: flex; gap: 6px; flex-wrap: wrap; align-items: center;">
          <lc-chip variant="default" size="sm" [removable]="true">Angular</lc-chip>
          <lc-chip variant="default" size="sm" [removable]="true">TypeScript</lc-chip>
          <lc-chip variant="default" size="sm" [removable]="true">Storybook</lc-chip>
          <span style="font-size: 13px; color: #999; padding: 2px 4px;">Add tag...</span>
        </div>
        <div style="font-size: 12px; color: #666; margin-top: 4px;">Press Enter to add a tag</div>
      </div>`,
  }),
};

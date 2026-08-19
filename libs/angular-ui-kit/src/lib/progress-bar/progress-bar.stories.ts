import type { Meta, StoryObj } from '@storybook/angular';
import { ProgressBarComponent } from './progress-bar.component';

const meta: Meta<ProgressBarComponent> = {
  title: 'Feedback/Progress Bar',
  component: ProgressBarComponent,
  parameters: {
    docs: {
      description: {
        component: `
Progress bar for displaying completion status.

**Key Features:**
- Linear and circular variants
- 6 color themes
- 4 size options (xs, sm, md, lg)
- Optional percentage label
- Indeterminate mode with animation
- Full ARIA support
        `,
      },
    },
  },
  argTypes: {
    value: { control: { type: 'range', min: 0, max: 100 }, description: 'Progress 0–100' },
    color: {
      control: 'select',
      options: ['primary', 'secondary', 'success', 'warning', 'error', 'info'],
      table: { defaultValue: { summary: 'primary' } },
    },
    size: {
      control: 'select',
      options: ['xs', 'sm', 'md', 'lg'],
      table: { defaultValue: { summary: 'md' } },
    },
    variant: {
      control: 'select',
      options: ['linear', 'circular'],
      table: { defaultValue: { summary: 'linear' } },
    },
    showLabel: { control: 'boolean', table: { defaultValue: { summary: 'false' } } },
    indeterminate: { control: 'boolean', table: { defaultValue: { summary: 'false' } } },
  },
};

export default meta;
type Story = StoryObj<ProgressBarComponent>;

export const Default: Story = {
  args: { value: 65, color: 'primary', size: 'md', showLabel: true },
};

export const Sizes: Story = {
  render: () => ({
    template: `
      <div style="display: flex; flex-direction: column; gap: 16px; max-width: 400px;">
        <lc-progress-bar [value]="60" size="xs" [showLabel]="true"></lc-progress-bar>
        <lc-progress-bar [value]="60" size="sm" [showLabel]="true"></lc-progress-bar>
        <lc-progress-bar [value]="60" size="md" [showLabel]="true"></lc-progress-bar>
        <lc-progress-bar [value]="60" size="lg" [showLabel]="true"></lc-progress-bar>
      </div>`,
  }),
};

export const Colors: Story = {
  render: () => ({
    template: `
      <div style="display: flex; flex-direction: column; gap: 12px; max-width: 400px;">
        <lc-progress-bar [value]="70" color="primary" [showLabel]="true"></lc-progress-bar>
        <lc-progress-bar [value]="70" color="secondary" [showLabel]="true"></lc-progress-bar>
        <lc-progress-bar [value]="70" color="success" [showLabel]="true"></lc-progress-bar>
        <lc-progress-bar [value]="70" color="warning" [showLabel]="true"></lc-progress-bar>
        <lc-progress-bar [value]="70" color="error" [showLabel]="true"></lc-progress-bar>
        <lc-progress-bar [value]="70" color="info" [showLabel]="true"></lc-progress-bar>
      </div>`,
  }),
};

export const InlineInListRows: Story = {
  parameters: {
    docs: {
      description: {
        story:
          '`inline` lets the bar flow with a list row at a fixed width (`--lc-progress-bar-inline-width`); `--lc-progress-bar-height` sets the exact track height, e.g. the 6px rollup bar.',
      },
    },
  },
  render: () => ({
    template: `
      <div style="display: flex; flex-direction: column; max-width: 420px; font-size: 13px;">
        <div style="display: flex; align-items: center; gap: 12px; padding: 8px 0; border-bottom: 1px solid var(--color-divider);">
          <span style="flex: 1;">Wave 1 — Fundament</span>
          <lc-progress-bar [value]="100" size="sm" color="success" [inline]="true" style="--lc-progress-bar-height: 6px;"></lc-progress-bar>
          <span style="color: var(--color-text-tertiary); min-width: 3ch; text-align: right;">8/8</span>
        </div>
        <div style="display: flex; align-items: center; gap: 12px; padding: 8px 0; border-bottom: 1px solid var(--color-divider);">
          <span style="flex: 1;">Wave 2 — Billing</span>
          <lc-progress-bar [value]="45" size="sm" [inline]="true" style="--lc-progress-bar-height: 6px;"></lc-progress-bar>
          <span style="color: var(--color-text-tertiary); min-width: 3ch; text-align: right;">5/11</span>
        </div>
        <div style="display: flex; align-items: center; gap: 12px; padding: 8px 0;">
          <span style="flex: 1;">Wave 3 — Rollout</span>
          <lc-progress-bar [value]="10" size="sm" [inline]="true" style="--lc-progress-bar-height: 6px;"></lc-progress-bar>
          <span style="color: var(--color-text-tertiary); min-width: 3ch; text-align: right;">1/9</span>
        </div>
      </div>`,
  }),
};

export const Indeterminate: Story = {
  args: { indeterminate: true, color: 'primary', size: 'md' },
};

export const Circular: Story = {
  args: { value: 72, variant: 'circular', color: 'primary', size: 'md', showLabel: true },
};

export const CircularSizes: Story = {
  render: () => ({
    template: `
      <div style="display: flex; gap: 24px; align-items: center;">
        <lc-progress-bar [value]="75" variant="circular" size="xs" [showLabel]="true"></lc-progress-bar>
        <lc-progress-bar [value]="75" variant="circular" size="sm" [showLabel]="true"></lc-progress-bar>
        <lc-progress-bar [value]="75" variant="circular" size="md" [showLabel]="true"></lc-progress-bar>
        <lc-progress-bar [value]="75" variant="circular" size="lg" [showLabel]="true"></lc-progress-bar>
      </div>`,
  }),
};

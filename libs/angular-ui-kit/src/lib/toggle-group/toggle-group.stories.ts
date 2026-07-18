import type { Meta, StoryObj } from '@storybook/angular';
import { ToggleGroupComponent } from './toggle-group.component';

/**
 * Toggle Group presents a set of mutually exclusive options as segmented buttons.
 * Only one option can be selected at a time. Use it for view switching, time ranges,
 * and tab-like selections that don't navigate.
 */
const meta: Meta<ToggleGroupComponent> = {
  title: 'Form/Toggle Group',
  component: ToggleGroupComponent,
  argTypes: {
    size: {
      control: 'select',
      options: ['sm', 'md', 'lg'],
      description: 'Controls button height and font size',
    },
  },

  parameters: {
    docs: {
      description: {
        component: `
Toggle group component for single-option selection from a set.

**Key Features:**
- Multiple segmented toggle buttons
- Active state highlighting
- Size variants (sm, md, lg)
- Two-way selected value binding
- Per-option disabled state
- Dark mode support via CSS custom properties
`,
      },
    },
  },
};

export default meta;
type Story = StoryObj<ToggleGroupComponent>;

export const Default: Story = {
  args: {
    options: [
      { value: 'list', label: 'List' },
      { value: 'grid', label: 'Grid' },
      { value: 'board', label: 'Board' },
    ],
    selected: 'list',
    size: 'md',
  },
};

export const TwoOptions: Story = {
  name: 'Two Options',
  args: {
    options: [
      { value: 'monthly', label: 'Monthly' },
      { value: 'yearly', label: 'Yearly' },
    ],
    selected: 'monthly',
    size: 'md',
  },
};

export const WithDisabled: Story = {
  name: 'With Disabled Option',
  args: {
    options: [
      { value: 'free', label: 'Free' },
      { value: 'pro', label: 'Pro' },
      { value: 'enterprise', label: 'Enterprise', disabled: true },
    ],
    selected: 'pro',
    size: 'md',
  },
};

export const Sizes: Story = {
  name: 'Size Comparison',
  render: () => ({
    props: {
      options: [
        { value: '1d', label: '1D' },
        { value: '1w', label: '1W' },
        { value: '1m', label: '1M' },
        { value: '1y', label: '1Y' },
        { value: 'all', label: 'All' },
      ],
    },
    template: `
      <div style="display: flex; flex-direction: column; gap: 16px;">
        <div>
          <div style="font-size: 11px; color: #666; margin-bottom: 6px;">Small</div>
          <lc-toggle-group [options]="options" selected="1m" size="sm"></lc-toggle-group>
        </div>
        <div>
          <div style="font-size: 11px; color: #666; margin-bottom: 6px;">Medium (default)</div>
          <lc-toggle-group [options]="options" selected="1m" size="md"></lc-toggle-group>
        </div>
        <div>
          <div style="font-size: 11px; color: #666; margin-bottom: 6px;">Large</div>
          <lc-toggle-group [options]="options" selected="1m" size="lg"></lc-toggle-group>
        </div>
      </div>`,
  }),
};

export const TimeRange: Story = {
  name: 'Time Range Selector',
  args: {
    options: [
      { value: '1h', label: '1H' },
      { value: '1d', label: '1D' },
      { value: '1w', label: '1W' },
      { value: '1m', label: '1M' },
      { value: '3m', label: '3M' },
      { value: '1y', label: '1Y' },
    ],
    selected: '1w',
    size: 'sm',
  },
};

export const ViewSwitcher: Story = {
  name: 'View Switcher (Composition)',
  render: () => ({
    props: {
      viewOptions: [
        { value: 'list', label: 'List' },
        { value: 'grid', label: 'Grid' },
        { value: 'kanban', label: 'Kanban' },
      ],
    },
    template: `
      <div style="max-width: 500px;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
          <h4 style="margin: 0; font-weight: 600;">Projects</h4>
          <lc-toggle-group [options]="viewOptions" selected="grid" size="sm"></lc-toggle-group>
        </div>
        <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px;">
          <div style="border: 1px solid #eee; border-radius: 8px; padding: 16px;">
            <div style="font-weight: 500;">Life-Cockpit</div>
            <div style="font-size: 12px; color: #666; margin-top: 4px;">3 tasks remaining</div>
          </div>
          <div style="border: 1px solid #eee; border-radius: 8px; padding: 16px;">
            <div style="font-weight: 500;">Mobile App</div>
            <div style="font-size: 12px; color: #666; margin-top: 4px;">7 tasks remaining</div>
          </div>
        </div>
      </div>`,
  }),
};

/**
 * Options can carry a small status dot (`dot`) — for example an unread
 * indicator on a tab-like option. `dot: true` uses the warning tone; pass
 * `'warning' | 'error' | 'success'` explicitly to pick another semantic color.
 */
export const WithDotIndicator: Story = {
  name: 'With Dot Indicator',
  render: () => ({
    props: {
      options: [
        { value: 'first', label: 'First view', dot: true },
        { value: 'second', label: 'Second view' },
      ],
      tones: [
        { value: 'a', label: 'Warning', dot: 'warning' },
        { value: 'b', label: 'Error', dot: 'error' },
        { value: 'c', label: 'Success', dot: 'success' },
      ],
      selected: 'second',
      selectedTone: 'a',
    },
    template: `
      <div style="display: flex; flex-direction: column; gap: 16px; align-items: flex-start;">
        <lc-toggle-group [options]="options" [selected]="selected" />
        <lc-toggle-group [options]="tones" [selected]="selectedTone" size="sm" />
      </div>`,
  }),
};

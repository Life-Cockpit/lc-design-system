import type { Meta, StoryObj } from '@storybook/angular';
import { ProgressRingComponent } from './progress-ring.component';

const meta: Meta<ProgressRingComponent> = {
  title: 'Charts/Progress Ring',
  component: ProgressRingComponent,
  tags: ['autodocs'],
  argTypes: {
    color: { control: 'select', options: ['primary', 'secondary', 'success', 'warning', 'error', 'info'] },
    size: { control: 'select', options: ['xs', 'sm', 'md', 'lg'] },
    showValue: { control: 'boolean', description: 'Show the percentage text in the centre (alias: showLabel)' },
    ariaLabel: { control: 'text', description: 'Accessible name of the progressbar', table: { defaultValue: { summary: 'Progress' } } },
  },

  parameters: {
    docs: {
      description: {
        component: `
Progress ring component for circular progress indication.

**Key Features:**
- Circular SVG progress arc (0–100%)
- Color theme variants (primary, secondary, success, warning, error)
- Size presets (xs, sm, md, lg)
- Optional percentage value display (\`showValue\` / \`showLabel\`)
- Animated stroke transitions
- Accessible \`progressbar\` role with \`aria-valuenow\` and \`ariaLabel\`
`,
      },
    },
  },
};
export default meta;
type Story = StoryObj<ProgressRingComponent>;

export const Default: Story = { args: { value: 72 } };
export const Success: Story = { args: { value: 95, color: 'success' } };
export const Warning: Story = { args: { value: 45, color: 'warning' } };
export const Error: Story = { args: { value: 15, color: 'error' } };

export const AllSizes: Story = {
  render: () => ({
    template: `
      <div style="display: flex; align-items: center; gap: 16px;">
        <lc-progress-ring [value]="72" size="xs"></lc-progress-ring>
        <lc-progress-ring [value]="72" size="sm"></lc-progress-ring>
        <lc-progress-ring [value]="72" size="md"></lc-progress-ring>
        <lc-progress-ring [value]="72" size="lg"></lc-progress-ring>
      </div>
    `,
    moduleMetadata: { imports: [ProgressRingComponent] },
  }),
};

export const Dashboard: Story = {
  render: () => ({
    template: `
      <div style="display: flex; gap: 24px; flex-wrap: wrap;">
        <div style="text-align: center;">
          <lc-progress-ring [value]="92" color="success" size="lg"></lc-progress-ring>
          <div style="margin-top: 8px; font-size: 14px; color: #666;">Uptime</div>
        </div>
        <div style="text-align: center;">
          <lc-progress-ring [value]="67" color="primary" size="lg"></lc-progress-ring>
          <div style="margin-top: 8px; font-size: 14px; color: #666;">CPU</div>
        </div>
        <div style="text-align: center;">
          <lc-progress-ring [value]="45" color="warning" size="lg"></lc-progress-ring>
          <div style="margin-top: 8px; font-size: 14px; color: #666;">Memory</div>
        </div>
        <div style="text-align: center;">
          <lc-progress-ring [value]="12" color="error" size="lg"></lc-progress-ring>
          <div style="margin-top: 8px; font-size: 14px; color: #666;">Errors</div>
        </div>
      </div>
    `,
    moduleMetadata: { imports: [ProgressRingComponent] },
  }),
};

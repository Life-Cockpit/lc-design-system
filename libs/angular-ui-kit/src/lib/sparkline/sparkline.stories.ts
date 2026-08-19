import type { Meta, StoryObj } from '@storybook/angular';
import { SparklineComponent } from './sparkline.component';

const meta: Meta<SparklineComponent> = {
  title: 'Charts/Sparkline',
  component: SparklineComponent,
  tags: ['autodocs'],
  argTypes: {
    color: {
      control: 'select',
      options: ['primary', 'secondary', 'success', 'warning', 'error', 'info'],
    },
    curve: {
      control: 'select',
      options: ['linear', 'smooth'],
    },
  },

  parameters: {
    docs: {
      description: {
        component: `
Sparkline component for compact inline trend visualization.

**Key Features:**
- Linear or smooth curve interpolation
- Optional area fill below the line
- Color theme variants (primary, secondary, success, warning, error)
- Optional end-dot indicator
- Configurable dimensions and stroke width
- Lightweight SVG rendering
`,
      },
    },
  },
};

export default meta;
type Story = StoryObj<SparklineComponent>;

const sampleData = [4, 8, 5, 12, 9, 14, 11, 16, 13, 18];

export const Default: Story = {
  args: {
    data: sampleData,
  },
};

export const Filled: Story = {
  args: {
    data: sampleData,
    filled: true,
    color: 'primary',
  },
};

export const LinearCurve: Story = {
  args: {
    data: sampleData,
    curve: 'linear',
  },
};

export const WithEndDot: Story = {
  args: {
    data: sampleData,
    showEndDot: true,
    color: 'success',
  },
};

export const LargeSize: Story = {
  args: {
    data: [2, 5, 3, 8, 6, 10, 7, 12, 9, 15, 11, 14],
    width: 240,
    height: 64,
    strokeWidth: 3,
    filled: true,
    showEndDot: true,
    color: 'info',
  },
};

export const Downtrend: Story = {
  args: {
    data: [20, 18, 19, 15, 12, 14, 10, 8, 5, 3],
    filled: true,
    showEndDot: true,
    color: 'error',
  },
};

export const Fluid: Story = {
  parameters: {
    docs: { description: { story: 'With `fluid` the sparkline stretches to its container instead of its fixed `width`.' } },
  },
  render: (args) => ({
    props: args,
    template: `
      <div style="width: 100%; max-width: 480px; border: 1px dashed var(--color-border); padding: 8px;">
        <lc-sparkline [data]="data" [fluid]="true" [filled]="true" [showEndDot]="true" color="primary"></lc-sparkline>
      </div>
    `,
    moduleMetadata: { imports: [SparklineComponent] },
  }),
  args: { data: sampleData },
};

export const AllColors: Story = {
  render: () => ({
    template: `
      <div style="display: flex; flex-direction: column; gap: 12px;">
        <div style="display: flex; align-items: center; gap: 12px;">
          <span style="width: 80px; font-size: 14px;">Primary</span>
          <lc-sparkline [data]="data" color="primary" [filled]="true" [showEndDot]="true"></lc-sparkline>
        </div>
        <div style="display: flex; align-items: center; gap: 12px;">
          <span style="width: 80px; font-size: 14px;">Secondary</span>
          <lc-sparkline [data]="data" color="secondary" [filled]="true" [showEndDot]="true"></lc-sparkline>
        </div>
        <div style="display: flex; align-items: center; gap: 12px;">
          <span style="width: 80px; font-size: 14px;">Success</span>
          <lc-sparkline [data]="data" color="success" [filled]="true" [showEndDot]="true"></lc-sparkline>
        </div>
        <div style="display: flex; align-items: center; gap: 12px;">
          <span style="width: 80px; font-size: 14px;">Warning</span>
          <lc-sparkline [data]="data" color="warning" [filled]="true" [showEndDot]="true"></lc-sparkline>
        </div>
        <div style="display: flex; align-items: center; gap: 12px;">
          <span style="width: 80px; font-size: 14px;">Error</span>
          <lc-sparkline [data]="data" color="error" [filled]="true" [showEndDot]="true"></lc-sparkline>
        </div>
        <div style="display: flex; align-items: center; gap: 12px;">
          <span style="width: 80px; font-size: 14px;">Info</span>
          <lc-sparkline [data]="data" color="info" [filled]="true" [showEndDot]="true"></lc-sparkline>
        </div>
      </div>
    `,
    props: {
      data: [4, 8, 5, 12, 9, 14, 11, 16, 13, 18],
    },
    moduleMetadata: {
      imports: [SparklineComponent],
    },
  }),
};

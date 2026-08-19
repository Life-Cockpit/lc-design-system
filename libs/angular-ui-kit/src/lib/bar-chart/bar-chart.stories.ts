import type { Meta, StoryObj } from '@storybook/angular';
import { BarChartComponent } from './bar-chart.component';

const meta: Meta<BarChartComponent> = {
  title: 'Charts/Bar Chart',
  component: BarChartComponent,
  tags: ['autodocs'],
  argTypes: {
    orientation: {
      control: 'select',
      options: ['vertical', 'horizontal'],
    },
  },

  parameters: {
    docs: {
      description: {
        component: `
Bar chart component for comparing categorical data.

**Key Features:**
- Vertical and horizontal orientation
- Per-bar or uniform color support
- Optional value labels on bars
- Configurable grid and axis labels
- Adjustable bar gap spacing
- Responsive SVG rendering
`,
      },
    },
  },
};

export default meta;
type Story = StoryObj<BarChartComponent>;

export const Default: Story = {
  args: {
    data: [
      { value: 45, label: 'Jan' },
      { value: 72, label: 'Feb' },
      { value: 58, label: 'Mar' },
      { value: 90, label: 'Apr' },
      { value: 65, label: 'May' },
      { value: 82, label: 'Jun' },
    ],
  },
};

export const Horizontal: Story = {
  args: {
    data: [
      { value: 120, label: 'Series A' },
      { value: 95, label: 'Series B' },
      { value: 78, label: 'Series C' },
      { value: 45, label: 'Series D' },
      { value: 30, label: 'Series E' },
    ],
    orientation: 'horizontal',
    height: 250,
  },
};

export const SingleColor: Story = {
  args: {
    data: [
      { value: 30, label: 'Mon' },
      { value: 65, label: 'Tue' },
      { value: 42, label: 'Wed' },
      { value: 78, label: 'Thu' },
      { value: 55, label: 'Fri' },
    ],
    color: 'var(--color-primary-500)',
  },
};

export const CustomColors: Story = {
  args: {
    data: [
      { value: 85, label: 'Q1', color: 'var(--color-success-default)' },
      { value: 60, label: 'Q2', color: 'var(--color-warning-default)' },
      { value: 95, label: 'Q3', color: 'var(--color-info-default)' },
      { value: 45, label: 'Q4', color: 'var(--color-error-default)' },
    ],
    width: 300,
    height: 180,
  },
};

export const NegativeValues: Story = {
  parameters: {
    docs: { description: { story: 'Negative values hang below the zero baseline; the grid extends to cover them.' } },
  },
  args: {
    data: [
      { value: 42, label: 'Q1' },
      { value: -18, label: 'Q2' },
      { value: 25, label: 'Q3' },
      { value: -30, label: 'Q4' },
      { value: 12, label: 'Q5' },
    ],
    height: 220,
  },
};

export const CustomFormat: Story = {
  parameters: {
    docs: { description: { story: '`formatValue` formats both the value labels and the axis ticks.' } },
  },
  args: {
    data: [
      { value: 0.42, label: 'A' },
      { value: 0.8, label: 'B' },
      { value: 0.15, label: 'C' },
      { value: 1, label: 'D' },
    ],
    formatValue: (v: number) => `${Math.round(v * 100)}%`,
    height: 200,
  },
};

export const NoGrid: Story = {
  args: {
    data: [
      { value: 45, label: 'A' },
      { value: 72, label: 'B' },
      { value: 58, label: 'C' },
    ],
    showGrid: false,
    width: 250,
    height: 150,
  },
};

export const Wide: Story = {
  args: {
    data: [
      { value: 20, label: 'Jan' },
      { value: 35, label: 'Feb' },
      { value: 28, label: 'Mar' },
      { value: 42, label: 'Apr' },
      { value: 55, label: 'May' },
      { value: 48, label: 'Jun' },
      { value: 62, label: 'Jul' },
      { value: 70, label: 'Aug' },
      { value: 58, label: 'Sep' },
      { value: 75, label: 'Oct' },
      { value: 68, label: 'Nov' },
      { value: 80, label: 'Dec' },
    ],
    width: 600,
    height: 250,
    color: 'var(--color-info-default)',
  },
};

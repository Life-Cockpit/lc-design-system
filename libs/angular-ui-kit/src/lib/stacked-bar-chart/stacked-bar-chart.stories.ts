import type { Meta, StoryObj } from '@storybook/angular';
import { StackedBarChartComponent } from './stacked-bar-chart.component';

const meta: Meta<StackedBarChartComponent> = {
  title: 'Charts/Stacked Bar Chart',
  component: StackedBarChartComponent,
  tags: ['autodocs'],

  parameters: {
    docs: {
      description: {
        component: `
Stacked bar chart component for comparing category compositions.

**Key Features:**
- Multiple stacked value segments per category
- Vertical and horizontal orientation
- Optional legend, grid, value labels, and axis labels
- Configurable bar gap spacing
- Color-coded segments with legend mapping
- Responsive SVG rendering
`,
      },
    },
  },
};
export default meta;
type Story = StoryObj<StackedBarChartComponent>;

export const Default: Story = {
  args: {
    categories: [
      { label: 'Q1', values: [30, 20, 10] },
      { label: 'Q2', values: [25, 35, 15] },
      { label: 'Q3', values: [40, 25, 20] },
      { label: 'Q4', values: [35, 30, 25] },
    ],
    legends: [{ label: 'Product A' }, { label: 'Product B' }, { label: 'Product C' }],
  },
};

export const Horizontal: Story = {
  args: {
    categories: [
      { label: 'Team 1', values: [60, 30] },
      { label: 'Team 2', values: [45, 55] },
      { label: 'Team 3', values: [70, 20] },
    ],
    legends: [{ label: 'Completed' }, { label: 'In Progress' }],
    orientation: 'horizontal',
    height: 200,
  },
};

export const TwoSeries: Story = {
  args: {
    categories: [
      { label: 'Jan', values: [40, 20] },
      { label: 'Feb', values: [35, 30] },
      { label: 'Mar', values: [50, 15] },
      { label: 'Apr', values: [45, 25] },
      { label: 'May', values: [55, 20] },
      { label: 'Jun', values: [60, 30] },
    ],
    legends: [{ label: 'Revenue' }, { label: 'Cost' }],
    width: 500,
  },
};

export const WithValues: Story = {
  parameters: {
    docs: { description: { story: '`showValues` prints each segment value (when it fits) and the stack total.' } },
  },
  args: {
    categories: [
      { label: 'Q1', values: [30, 20, 10] },
      { label: 'Q2', values: [25, 35, 15] },
      { label: 'Q3', values: [40, 25, 20] },
    ],
    legends: [{ label: 'Series A' }, { label: 'Series B' }, { label: 'Series C' }],
    showValues: true,
    height: 240,
  },
};

export const NegativeValues: Story = {
  parameters: {
    docs: { description: { story: 'Negative values stack downward from the zero baseline.' } },
  },
  args: {
    categories: [
      { label: 'Jan', values: [40, -15] },
      { label: 'Feb', values: [35, -30] },
      { label: 'Mar', values: [50, -10] },
      { label: 'Apr', values: [20, -45] },
    ],
    legends: [{ label: 'Inflow' }, { label: 'Outflow' }],
    showValues: true,
    height: 240,
  },
};

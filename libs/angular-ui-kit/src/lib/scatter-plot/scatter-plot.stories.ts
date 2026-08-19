import type { Meta, StoryObj } from '@storybook/angular';
import { ScatterPlotComponent } from './scatter-plot.component';

const meta: Meta<ScatterPlotComponent> = {
  title: 'Charts/Scatter Plot',
  component: ScatterPlotComponent,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: `
Scatter plot for visualizing correlations between two variables.

**Key Features:**
- Multiple data series with automatic color assignment
- Variable dot sizes for bubble-chart style (size property on data points)
- Configurable axis labels (X / Y)
- Interactive dots: tooltip on hover/focus, \`pointClick\` on click or Enter/Space (keyboard reachable)
- Optional legend for multi-series data
- Grid lines and axis labels toggles
- Adjustable dot radius
- Responsive SVG rendering
        `,
      },
    },
  },
  argTypes: {
    xAxisLabel: { control: 'text', description: 'Label for the horizontal axis' },
    yAxisLabel: { control: 'text', description: 'Label for the vertical axis' },
    showLegend: { control: 'boolean', description: 'Show legend for multiple series', table: { defaultValue: { summary: 'false' } } },
    showGrid: { control: 'boolean', description: 'Show background grid lines', table: { defaultValue: { summary: 'true' } } },
    showXLabels: { control: 'boolean', description: 'Show X axis labels', table: { defaultValue: { summary: 'true' } } },
    showYLabels: { control: 'boolean', description: 'Show Y axis labels', table: { defaultValue: { summary: 'true' } } },
    dotRadius: { control: 'number', description: 'Default dot radius in pixels', table: { defaultValue: { summary: '4' } } },
    interactive: { control: 'boolean', description: 'Dots are focusable buttons that emit pointClick', table: { defaultValue: { summary: 'true' } } },
    width: { control: 'number', description: 'Chart width in px' },
    height: { control: 'number', description: 'Chart height in px' },
  },
};
export default meta;
type Story = StoryObj<ScatterPlotComponent>;

export const Basic: Story = {
  parameters: {
    docs: { description: { story: 'Basic scatter plot showing the relationship between study hours and test scores.' } },
  },
  args: {
    series: [
      {
        label: 'Students',
        data: [
          { x: 2, y: 65 }, { x: 3, y: 72 }, { x: 4, y: 78 },
          { x: 5, y: 82 }, { x: 6, y: 88 }, { x: 7, y: 91 },
          { x: 1, y: 55 }, { x: 3.5, y: 70 }, { x: 5.5, y: 85 },
        ],
      },
    ],
    xAxisLabel: 'Study Hours',
    yAxisLabel: 'Score',
    width: 500,
    height: 300,
  },
};

export const MultipleSeries: Story = {
  parameters: {
    docs: { description: { story: 'Multiple data series with automatic color differentiation and a legend.' } },
  },
  args: {
    series: [
      {
        label: 'Group A',
        data: [
          { x: 10, y: 20 }, { x: 15, y: 25 }, { x: 20, y: 35 },
          { x: 25, y: 30 }, { x: 30, y: 45 },
        ],
      },
      {
        label: 'Group B',
        data: [
          { x: 12, y: 30 }, { x: 18, y: 40 }, { x: 22, y: 28 },
          { x: 28, y: 50 }, { x: 35, y: 55 },
        ],
      },
    ],
    showLegend: true,
    width: 500,
    height: 300,
  },
};

export const BubbleStyle: Story = {
  parameters: {
    docs: { description: { story: 'Bubble chart variant using the size property on data points to control dot radius.' } },
  },
  args: {
    series: [
      {
        label: 'Revenue',
        data: [
          { x: 10, y: 20, size: 5 }, { x: 20, y: 35, size: 10 },
          { x: 30, y: 25, size: 8 }, { x: 40, y: 50, size: 15 },
          { x: 50, y: 40, size: 12 }, { x: 60, y: 60, size: 20 },
        ],
      },
    ],
    width: 500,
    height: 300,
    xAxisLabel: 'Employees',
    yAxisLabel: 'Revenue (M$)',
  },
};

export const Compact: Story = {
  parameters: {
    docs: { description: { story: 'Compact view with no grid or axis labels, suitable for sparkline-like usage.' } },
  },
  args: {
    series: [
      {
        label: 'Data',
        data: Array.from({ length: 30 }, () => ({
          x: Math.random() * 100,
          y: Math.random() * 100,
        })),
      },
    ],
    width: 300,
    height: 200,
    showGrid: false,
    showXLabels: false,
    showYLabels: false,
    dotRadius: 3,
  },
};

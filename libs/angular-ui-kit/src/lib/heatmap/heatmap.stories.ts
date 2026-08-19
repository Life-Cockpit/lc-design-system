import type { Meta, StoryObj } from '@storybook/angular';
import { HeatmapComponent } from './heatmap.component';

const meta: Meta<HeatmapComponent> = {
  title: 'Charts/Heatmap',
  component: HeatmapComponent,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: `
Heatmap component for visualizing 2D data density.

**Key Features:**
- Color-interpolated cells from min to max value
- Configurable cell size, gap, and corner radius
- Custom min/max color range
- Optional row and column labels
- Optional value display within cells
- Responsive SVG rendering
`,
      },
    },
  },
};
export default meta;
type Story = StoryObj<HeatmapComponent>;

const weekData = [
  [2, 5, 8, 3, 1, 0, 0],
  [4, 7, 12, 6, 3, 1, 0],
  [6, 10, 15, 9, 5, 2, 1],
  [3, 8, 11, 7, 4, 1, 0],
  [1, 4, 9, 5, 2, 0, 0],
];

export const Default: Story = {
  args: {
    data: weekData,
    rowLabels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
    colLabels: ['6am', '9am', '12pm', '3pm', '6pm', '9pm', '12am'],
  },
};

export const WithValues: Story = {
  args: {
    data: [[8, 3, 5], [2, 9, 1], [4, 6, 7]],
    rowLabels: ['A', 'B', 'C'],
    colLabels: ['X', 'Y', 'Z'],
    showValues: true,
    cellSize: 40,
  },
};

export const LargeCells: Story = {
  args: {
    data: weekData,
    rowLabels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
    colLabels: ['6am', '9am', '12pm', '3pm', '6pm', '9pm', '12am'],
    cellSize: 40,
    cellGap: 3,
    showValues: true,
  },
};

export const CustomColors: Story = {
  parameters: {
    docs: { description: { story: '`colorMin` and `colorMax` are blended per cell (`color-mix`); value ink flips to the surface colour on strong cells.' } },
  },
  args: {
    data: [[8, 3, 5], [2, 9, 1], [4, 6, 7]],
    rowLabels: ['A', 'B', 'C'],
    colLabels: ['X', 'Y', 'Z'],
    colorMin: 'var(--color-warning-50)',
    colorMax: 'var(--color-error-default)',
    showValues: true,
    cellSize: 40,
  },
};

export const CompactGrid: Story = {
  args: {
    data: Array.from({ length: 7 }, () => Array.from({ length: 12 }, () => Math.floor(Math.random() * 10))),
    rowLabels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    cellSize: 14,
    cellGap: 2,
    cellRadius: 2,
    colorMax: 'var(--color-success-default)',
  },
};

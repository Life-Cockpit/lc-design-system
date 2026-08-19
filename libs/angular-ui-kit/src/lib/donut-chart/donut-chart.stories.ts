import type { Meta, StoryObj } from '@storybook/angular';
import { DonutChartComponent } from './donut-chart.component';

const meta: Meta<DonutChartComponent> = {
  title: 'Charts/Donut Chart',
  component: DonutChartComponent,
  tags: ['autodocs'],
  argTypes: {
    size: {
      control: 'select',
      options: ['sm', 'md', 'lg'],
    },
  },

  parameters: {
    docs: {
      description: {
        component: `
Donut chart component for proportional data with center content.

**Key Features:**
- Color-coded ring segments
- Configurable ring thickness
- Center label and value display
- Size presets (sm, md, lg)
- Optional legend display
- Responsive SVG rendering
`,
      },
    },
  },
};

export default meta;
type Story = StoryObj<DonutChartComponent>;

export const Default: Story = {
  args: {
    segments: [
      { value: 45, label: 'Desktop' },
      { value: 30, label: 'Mobile' },
      { value: 15, label: 'Tablet' },
      { value: 10, label: 'Other' },
    ],
    centerValue: '100%',
    centerLabel: 'Traffic',
  },
};

export const WithLegend: Story = {
  args: {
    segments: [
      { value: 45, label: 'Desktop' },
      { value: 30, label: 'Mobile' },
      { value: 15, label: 'Tablet' },
      { value: 10, label: 'Other' },
    ],
    centerValue: '4,210',
    centerLabel: 'Visits',
    showLegend: true,
  },
};

export const TwoSegments: Story = {
  args: {
    segments: [
      { value: 72, label: 'Completed' },
      { value: 28, label: 'Remaining' },
    ],
    centerValue: '72%',
    centerLabel: 'Done',
  },
};

export const CustomColors: Story = {
  args: {
    segments: [
      { value: 40, label: 'Active', color: 'var(--color-success-default)' },
      { value: 25, label: 'Idle', color: 'var(--color-warning-default)' },
      { value: 20, label: 'Offline', color: 'var(--color-error-default)' },
      { value: 15, label: 'Unknown', color: 'var(--color-secondary-500)' },
    ],
    centerValue: '156',
    centerLabel: 'Servers',
    showLegend: true,
    size: 'lg',
  },
};

export const Small: Story = {
  args: {
    segments: [
      { value: 65, label: 'Used' },
      { value: 35, label: 'Free' },
    ],
    centerValue: '65%',
    size: 'sm',
  },
};

export const Large: Story = {
  args: {
    segments: [
      { value: 30, label: 'Series A' },
      { value: 25, label: 'Series B' },
      { value: 20, label: 'Series C' },
      { value: 15, label: 'Series D' },
      { value: 10, label: 'Other' },
    ],
    centerValue: '5',
    centerLabel: 'Series',
    showLegend: true,
    size: 'lg',
  },
};

export const SingleSegment: Story = {
  parameters: {
    docs: { description: { story: 'A single segment renders as a full ring.' } },
  },
  args: {
    segments: [{ value: 100, label: 'All' }],
    centerValue: '100%',
  },
};

export const ThickRing: Story = {
  args: {
    segments: [
      { value: 80, label: 'Complete' },
      { value: 20, label: 'Incomplete' },
    ],
    centerValue: '80%',
    thickness: 0.5,
  },
};

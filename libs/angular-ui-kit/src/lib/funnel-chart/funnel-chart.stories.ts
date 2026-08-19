import type { Meta, StoryObj } from '@storybook/angular';
import { FunnelChartComponent } from './funnel-chart.component';

const meta: Meta<FunnelChartComponent> = {
  title: 'Charts/Funnel Chart',
  component: FunnelChartComponent,
  tags: ['autodocs'],
  argTypes: {
    orientation: {
      control: 'radio',
      options: ['vertical', 'horizontal'],
      description: 'Layout direction of the funnel',
      table: { defaultValue: { summary: 'vertical' } },
    },
    showPercentage: { control: 'boolean', description: 'Display conversion percentage relative to first step', table: { defaultValue: { summary: 'true' } } },
    showValues: { control: 'boolean', description: 'Show absolute values on each step', table: { defaultValue: { summary: 'true' } } },
    width: { control: 'number', description: 'Chart width in px' },
    height: { control: 'number', description: 'Chart height in px' },
  },
  parameters: {
    docs: {
      description: {
        component: `
Funnel chart for visualizing conversion pipelines and progressive filtering.

**Key Features:**
- Vertical and horizontal orientations
- Automatic percentage calculation relative to first step
- Toggleable value and percentage labels
- Per-step custom colors
- Smooth trapezoidal step rendering
- Labels readable on any step fill (ink picked from literal colours, halo on tokens)
- Responsive SVG rendering
        `,
      },
    },
  },
};
export default meta;
type Story = StoryObj<FunnelChartComponent>;

export const SalesFunnel: Story = {
  parameters: {
    docs: { description: { story: 'Classic sales funnel from website visits through to retained customers.' } },
  },
  args: {
    steps: [
      { label: 'Website Visits', value: 15000 },
      { label: 'Sign-ups', value: 8000 },
      { label: 'Trial Started', value: 4000 },
      { label: 'Paid Conversion', value: 1200 },
      { label: 'Retained', value: 900 },
    ],
    width: 450,
    height: 350,
  },
};

export const Horizontal: Story = {
  parameters: {
    docs: { description: { story: 'Horizontal orientation for side-by-side funnel visualisation.' } },
  },
  args: {
    steps: [
      { label: 'Leads', value: 500 },
      { label: 'Qualified', value: 300 },
      { label: 'Proposal', value: 150 },
      { label: 'Closed', value: 60 },
    ],
    orientation: 'horizontal',
    width: 500,
    height: 250,
  },
};

export const CustomColors: Story = {
  parameters: {
    docs: { description: { story: 'Each step can define its own color for brand-aligned funnels.' } },
  },
  args: {
    steps: [
      { label: 'Awareness', value: 10000, color: 'var(--color-info-default)' },
      { label: 'Interest', value: 6000, color: 'var(--color-secondary-500)' },
      { label: 'Decision', value: 2500, color: 'var(--color-secondary-600)' },
      { label: 'Action', value: 1000, color: 'var(--color-secondary-700)' },
    ],
    width: 400,
    height: 300,
  },
};

export const ValuesOnly: Story = {
  parameters: {
    docs: { description: { story: 'Only absolute values displayed, percentages hidden.' } },
  },
  args: {
    steps: [
      { label: 'Step 1', value: 800 },
      { label: 'Step 2', value: 500 },
      { label: 'Step 3', value: 200 },
    ],
    showPercentage: false,
    width: 350,
    height: 250,
  },
};

export const PercentagesOnly: Story = {
  parameters: {
    docs: { description: { story: 'Only conversion percentages displayed, absolute values hidden.' } },
  },
  args: {
    steps: [
      { label: 'Total', value: 5000 },
      { label: 'Filtered', value: 3000 },
      { label: 'Result', value: 500 },
    ],
    showValues: false,
    width: 350,
    height: 250,
  },
};

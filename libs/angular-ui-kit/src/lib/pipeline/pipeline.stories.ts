import type { Meta, StoryObj } from '@storybook/angular';
import { PipelineComponent } from './pipeline.component';

const meta: Meta<PipelineComponent> = {
  title: 'Components/Pipeline',
  component: PipelineComponent,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: `
Pipeline — a status timeline of connected process nodes.

Unlike the **Stepper** (a navigation stepper whose states derive from the active
index), each pipeline node carries its own explicit status, so completed,
current, pending, warning and error nodes can appear in the same chain — with an
optional caption under each label.

**Statuses:** \`complete\` · \`current\` · \`pending\` · \`warning\` · \`error\`
`,
      },
    },
  },
  argTypes: {
    orientation: { control: 'inline-radio', options: ['horizontal', 'vertical'] },
    clickable: { control: 'boolean' },
  },
};

export default meta;
type Story = StoryObj<PipelineComponent>;

const steps = [
  { label: 'Connect', caption: 'Token valid', status: 'complete' as const },
  { label: 'Checkout', caption: '2 hours ago', status: 'complete' as const },
  { label: 'Profile', caption: 'Detected', status: 'complete' as const },
  { label: 'Analyze', caption: 'Running…', status: 'current' as const },
  { label: 'Graph', caption: 'Out of date', status: 'warning' as const },
];

export const Horizontal: Story = {
  args: { steps, orientation: 'horizontal', clickable: false },
  render: (args) => ({
    props: args,
    template: `<div style="max-width: 760px;"><lc-pipeline [steps]="steps" [orientation]="orientation" [clickable]="clickable" /></div>`,
  }),
};

export const Vertical: Story = {
  args: { steps, orientation: 'vertical', clickable: false },
  render: (args) => ({
    props: args,
    template: `<div style="max-width: 320px;"><lc-pipeline [steps]="steps" [orientation]="orientation" [clickable]="clickable" /></div>`,
  }),
};

export const AllStatuses: Story = {
  args: {
    orientation: 'horizontal',
    steps: [
      { label: 'Complete', status: 'complete' },
      { label: 'Current', status: 'current' },
      { label: 'Warning', status: 'warning' },
      { label: 'Error', status: 'error' },
      { label: 'Pending', status: 'pending' },
    ],
  },
  render: (args) => ({
    props: args,
    template: `<div style="max-width: 760px;"><lc-pipeline [steps]="steps" [orientation]="orientation" /></div>`,
  }),
};

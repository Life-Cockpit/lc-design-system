import type { Meta, StoryObj } from '@storybook/angular';
import { DescriptionListComponent } from './description-list.component';

const meta: Meta<DescriptionListComponent> = {
  title: 'Components/Description List',
  component: DescriptionListComponent,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: `
Description list for key/value metadata (a styled \`<dl>\`).

**Key Features:**
- \`rows\` layout: term left, value right, with an optional dotted leader line
- \`stacked\` layout: term above value, for narrow columns
- Per-row value emphasis (\`default\`, \`muted\`, \`strong\`, \`primary\`) and optional links
- Semantic \`<dl>\`/\`<dt>\`/\`<dd>\` markup
`,
      },
    },
  },
  argTypes: {
    layout: { control: 'inline-radio', options: ['rows', 'stacked'] },
    leaders: { control: 'boolean' },
    size: { control: 'inline-radio', options: ['sm', 'md'] },
  },
};

export default meta;
type Story = StoryObj<DescriptionListComponent>;

const sampleItems = [
  { term: 'Identifier', value: 'example/resource', href: '#', emphasis: 'primary' as const },
  { term: 'Access', value: 'Token stored · read only' },
  { term: 'Owner', value: 'Placeholder Team' },
  { term: 'Status', value: 'Maintained', emphasis: 'strong' as const },
  { term: 'Last change', value: 'Two hours ago', emphasis: 'muted' as const },
];

export const Rows: Story = {
  args: { items: sampleItems, layout: 'rows', leaders: false, size: 'md' },
  render: (args) => ({
    props: args,
    template: `<div style="max-width: 420px;"><lc-description-list [items]="items" [layout]="layout" [leaders]="leaders" [size]="size" /></div>`,
  }),
};

export const WithLeaders: Story = {
  args: { items: sampleItems, layout: 'rows', leaders: true, size: 'md' },
  render: (args) => ({
    props: args,
    template: `<div style="max-width: 420px;"><lc-description-list [items]="items" [layout]="layout" [leaders]="leaders" [size]="size" /></div>`,
  }),
};

export const Stacked: Story = {
  args: { items: sampleItems, layout: 'stacked', size: 'md' },
  render: (args) => ({
    props: args,
    template: `<div style="max-width: 280px;"><lc-description-list [items]="items" [layout]="layout" [size]="size" /></div>`,
  }),
};

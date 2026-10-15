import type { Meta, StoryObj } from '@storybook/angular';
import { expect, within } from 'storybook/test';
import { RadioComponent } from './radio.component';
import { RadioGroupComponent } from './radio-group.component';

const meta: Meta<RadioGroupComponent> = {
  title: 'Form/Radio Group',
  component: RadioGroupComponent,
  parameters: {
    docs: {
      description: {
        component: `
\`lc-radio-group\` — a group of \`lc-radio\`s as a native \`<fieldset>\` named by its
\`<legend>\`, with one help text and one error for the whole group (both linked by
\`aria-describedby\`). The group gives every radio inside the same \`name\`, \`required\`,
\`disabled\` and invalid state and holds the selected value: \`[(value)]\` or a form control
on the group (\`[formControl]\`, \`formControlName\`, \`ngModel\`).

\`\`\`html
<lc-radio-group legend="Sprache" [legendHidden]="true" [(value)]="locale">
  <lc-radio value="device" label="Wie dieses Gerät" size="lg" />
  <lc-radio value="en" label="English" size="lg" lang="en" />
  <lc-radio value="de" label="Deutsch" size="lg" lang="de" />
</lc-radio-group>
\`\`\`

**Touch targets:** \`lc-radio size="lg"\` rows are 44 px high and the whole row is the target;
rows sit 8 px apart. Smaller sizes still meet WCAG 2.5.8 (24 px) by spacing.
        `,
      },
    },
  },
  argTypes: {
    legend: { control: 'text', description: 'The group’s question, rendered as the `<legend>` (its accessible name)' },
    legendHidden: {
      control: 'boolean',
      description: 'Hides the legend visually; screen readers still read it',
      table: { defaultValue: { summary: 'false' } },
    },
    name: { control: 'text', description: 'The `name` of every radio in the group. Unset = a generated one' },
    helpText: { control: 'text', description: 'Help for the whole group, below the legend' },
    error: { control: 'text', description: 'One error for the whole group; marks every radio invalid' },
    required: { control: 'boolean', description: 'Every radio is required', table: { defaultValue: { summary: 'false' } } },
    requiredIndicator: {
      control: 'boolean',
      description: 'Shows `*` after the legend of a required group',
      table: { defaultValue: { summary: 'true' } },
    },
    requiredAriaLabel: {
      control: 'text',
      description: 'Accessible name of the `*` marker',
      table: { defaultValue: { summary: 'required' } },
    },
    disabled: { control: 'boolean', description: 'Disables every radio', table: { defaultValue: { summary: 'false' } } },
    orientation: {
      control: 'select',
      options: ['vertical', 'horizontal'],
      description: 'Stacked rows (default) or a wrapping row',
      table: { defaultValue: { summary: 'vertical' } },
    },
    value: { control: 'text', description: 'Selected value (two-way bindable via [(value)]); empty = none' },
  },
  args: {
    legend: 'Language',
    legendHidden: false,
    helpText: '',
    error: '',
    required: false,
    requiredIndicator: true,
    disabled: false,
    orientation: 'vertical',
    value: 'device',
  },
  render: (args) => ({
    props: args,
    moduleMetadata: { imports: [RadioGroupComponent, RadioComponent] },
    template: `
      <lc-radio-group [legend]="legend" [legendHidden]="legendHidden" [helpText]="helpText" [error]="error"
                      [required]="required" [requiredIndicator]="requiredIndicator" [disabled]="disabled"
                      [orientation]="orientation" [(value)]="value">
        <lc-radio value="device" label="Like this device" size="lg" />
        <lc-radio value="en" label="English" size="lg" lang="en" />
        <lc-radio value="de" label="Deutsch" size="lg" lang="de" />
      </lc-radio-group>
    `,
  }),
};

export default meta;
type Story = StoryObj<RadioGroupComponent>;

export const Default: Story = {
  play: async ({ canvasElement }) => {
    const group = within(canvasElement).getByRole('group', { name: 'Language' });
    await expect(within(group).getAllByRole('radio')).toHaveLength(3);
  },
};

export const WithHelpAndError: Story = {
  name: 'With Help Text and Error',
  args: { value: '', required: true, helpText: 'Applies to this device only.', error: 'Choose a language.' },
};

export const HiddenLegend: Story = {
  name: 'Legend for Screen Readers Only',
  args: { legendHidden: true },
};

export const Horizontal: Story = {
  args: { orientation: 'horizontal' },
};

export const Disabled: Story = {
  args: { disabled: true },
};

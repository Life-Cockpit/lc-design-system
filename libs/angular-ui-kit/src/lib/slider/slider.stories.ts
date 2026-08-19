import type { Meta, StoryObj } from '@storybook/angular';
import { SliderComponent } from './slider.component';

const meta: Meta<SliderComponent> = {
  title: 'Form/Slider',
  component: SliderComponent,
  argTypes: {
    min: { control: 'number' },
    max: { control: 'number' },
    step: { control: 'number' },
    showValue: { control: 'boolean' },
    disabled: { control: 'boolean' },
  },

  parameters: {
    docs: {
      description: {
        component: `
Slider component for selecting a numeric value within a range.

**Key Features:**
- Configurable min, max, and step values
- Visual fill track indicating current position
- Optional value label display
- Disabled state support
- ControlValueAccessor integration for reactive forms
`,
      },
    },
  },
};

export default meta;
type Story = StoryObj<SliderComponent>;

export const Default: Story = {
  args: { min: 0, max: 100, step: 1, label: 'Volume', showValue: true, disabled: false },
};

export const WithStep: Story = {
  args: { min: 0, max: 100, step: 10, label: 'Brightness', showValue: true },
};

export const Disabled: Story = {
  args: { min: 0, max: 100, step: 1, label: 'Locked', showValue: true, disabled: true },
};

export const NoLabel: Story = {
  args: { min: 0, max: 50, step: 1, showValue: true },
};

export const NoValue: Story = {
  args: { min: 0, max: 100, step: 1, label: 'Secret', showValue: false },
};

export const OffsetRange: Story = {
  args: { min: 10, max: 20, step: 0.5, label: 'Level', showValue: true },
};

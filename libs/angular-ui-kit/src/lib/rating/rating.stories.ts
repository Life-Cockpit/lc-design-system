import type { Meta, StoryObj } from '@storybook/angular';
import { RatingComponent } from './rating.component';

const meta: Meta<RatingComponent> = {
  title: 'Form/Rating',
  component: RatingComponent,
  argTypes: {
    max: { control: 'number' },
    size: { control: 'select', options: ['sm', 'md', 'lg'] },
    readonly: { control: 'boolean' },
    disabled: { control: 'boolean' },
    showValue: { control: 'boolean' },
    allowHalf: { control: 'boolean' },
  },

  parameters: {
    docs: {
      description: {
        component: `
Rating component for star-based value selection.

**Key Features:**
- Configurable maximum star count
- Half-star rating support (click the left half of a star; arrow keys step by 0.5)
- Multiple size variants (sm, md, lg)
- Read-only (still focusable, \`aria-readonly\`) and disabled states
- Hover preview with visual feedback
- Keyboard: stars form a radiogroup — Arrow keys step, Home/End jump to the ends
- ControlValueAccessor integration for reactive forms
`,
      },
    },
  },
};

export default meta;
type Story = StoryObj<RatingComponent>;

export const Default: Story = {
  args: { max: 5, size: 'md', label: 'Bewertung', showValue: true },
};

export const Large: Story = {
  args: { max: 5, size: 'lg', label: 'Qualität', showValue: true },
};

export const Small: Story = {
  args: { max: 5, size: 'sm' },
};

export const HalfStars: Story = {
  args: { max: 5, size: 'lg', allowHalf: true, label: 'Bewertung', showValue: true },
};

export const Readonly: Story = {
  args: { max: 5, size: 'md', readonly: true, showValue: true },
};

export const Disabled: Story = {
  args: { max: 5, size: 'md', disabled: true },
};

export const TenStars: Story = {
  args: { max: 10, size: 'sm', showValue: true },
};

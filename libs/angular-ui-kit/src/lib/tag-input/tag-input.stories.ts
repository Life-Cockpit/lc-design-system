import type { Meta, StoryObj } from '@storybook/angular';
import { TagInputComponent } from './tag-input.component';

const meta: Meta<TagInputComponent> = {
  title: 'Form/Tag Input',
  component: TagInputComponent,
  tags: ['autodocs'],
  argTypes: {
    separator: {
      control: 'radio',
      options: ['enter', 'comma', 'both'],
      description: 'Key(s) used to confirm a new tag',
      table: { defaultValue: { summary: 'both' } },
    },
    maxTags: { control: 'number', description: 'Maximum number of tags allowed (unlimited by default)', table: { defaultValue: { summary: 'Infinity' } } },
    allowDuplicates: { control: 'boolean', description: 'Allow duplicate tag values', table: { defaultValue: { summary: 'false' } } },
    removable: { control: 'boolean', description: 'Show remove button on each tag', table: { defaultValue: { summary: 'true' } } },
    disabled: { control: 'boolean', description: 'Disable the entire input' },
    placeholder: { control: 'text', description: 'Placeholder text for the input field' },
    label: { control: 'text', description: 'Label shown above the input' },
  },
  parameters: {
    docs: {
      description: {
        component: `
Tag input component for entering and managing multiple tags.

**Key Features:**
- Configurable separators (Enter, comma, or both)
- Duplicate tag prevention (toggleable)
- Maximum tag limit — the input turns read-only once it is reached
- Autocomplete suggestions dropdown (listbox: ArrowUp/ArrowDown to highlight, Enter to pick, Escape to close)
- Remove tags via × button or Backspace
- ControlValueAccessor for Angular reactive forms
- Disabled state support
- Accessible keyboard navigation
        `,
      },
    },
  },
};
export default meta;
type Story = StoryObj<TagInputComponent>;

export const Default: Story = {
  parameters: {
    docs: { description: { story: 'Basic tag input with default settings. Press Enter to add tags.' } },
  },
  args: {
    placeholder: 'Add a tag…',
    label: 'Tags',
  },
};

export const WithMaxTags: Story = {
  parameters: {
    docs: { description: { story: 'The input turns read-only after reaching the maximum tag limit and says so in its placeholder.' } },
  },
  args: {
    placeholder: 'Max 3 tags…',
    maxTags: 3,
    label: 'Limited Tags',
  },
};

export const WithSuggestions: Story = {
  parameters: {
    docs: { description: { story: 'Autocomplete dropdown filtered by the current input value. Use ArrowUp/ArrowDown and Enter to pick a suggestion.' } },
  },
  args: {
    placeholder: 'Start typing…',
    suggestions: ['Red', 'Green', 'Blue', 'Yellow', 'Orange', 'Purple', 'Teal', 'Grey'],
    label: 'Colour',
  },
};

export const AllowDuplicates: Story = {
  parameters: {
    docs: { description: { story: 'Duplicates are permitted — the same tag value can be added multiple times.' } },
  },
  args: {
    placeholder: 'Duplicates allowed…',
    allowDuplicates: true,
  },
};

export const NotRemovable: Story = {
  parameters: {
    docs: { description: { story: 'Tags cannot be removed once added.' } },
  },
  args: {
    removable: false,
  },
};

export const Disabled: Story = {
  parameters: {
    docs: { description: { story: 'Fully disabled state — no interaction possible.' } },
  },
  args: {
    disabled: true,
    label: 'Disabled',
  },
};

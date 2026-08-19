import type { Meta, StoryObj } from '@storybook/angular';
import { SearchInputComponent } from './search-input.component';

const meta: Meta<SearchInputComponent> = {
  title: 'Form/Search Input',
  component: SearchInputComponent,
  parameters: {
    docs: {
      description: {
        component: `
Specialized search input with built-in magnifying glass icon, clear button, and debounced output.

**Key Features:**
- Search icon prefix
- Clear button appears when input has a value
- Debounced \`searchChange\` output (default 300ms)
- \`searchSubmit\` output on Enter key
- Two-way bindable \`value\` (preset / reset from the parent)
- 3 size variants (sm, md, lg)
- Disabled state
        `,
      },
    },
  },
  argTypes: {
    placeholder: { control: 'text' },
    size: { control: 'select', options: ['sm', 'md', 'lg'] },
    debounceMs: { control: { type: 'number', min: 0, max: 1000 } },
    disabled: { control: 'boolean' },
    value: { control: 'text', description: 'Current query (two-way bindable via [(value)])' },
    ariaLabel: { control: 'text', description: 'Accessible name (default "Search")' },
  },
};

export default meta;
type Story = StoryObj<SearchInputComponent>;

export const Default: Story = {
  args: { placeholder: 'Search…', size: 'md', debounceMs: 300 },
};

export const Sizes: Story = {
  render: () => ({
    template: `
      <div style="display: flex; flex-direction: column; gap: 12px; max-width: 320px;">
        <lc-search-input size="sm" placeholder="Small search"></lc-search-input>
        <lc-search-input size="md" placeholder="Medium search"></lc-search-input>
        <lc-search-input size="lg" placeholder="Large search"></lc-search-input>
      </div>`,
  }),
};

export const Disabled: Story = {
  args: { placeholder: 'Search disabled', disabled: true, size: 'md' },
};

export const WithPresetValue: Story = {
  parameters: {
    docs: { description: { story: 'A parent can preset or reset the query via `[value]`; external writes do not emit `searchChange`.' } },
  },
  args: { placeholder: 'Search…', value: 'preset query', size: 'md', debounceMs: 300 },
};

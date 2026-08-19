import type { Meta, StoryObj } from '@storybook/angular';
import { TextareaComponent } from './textarea.component';

/**
 * A multi-line text input for longer form content like descriptions, comments,
 * and messages. Supports character counting, auto-resize, validation states,
 * and two visual variants.
 */
const meta: Meta<TextareaComponent> = {
  title: 'Form/Textarea',
  component: TextareaComponent,
  argTypes: {
    label: { description: 'Label text displayed above the textarea' },
    placeholder: { description: 'Placeholder text shown when empty' },
    variant: {
      control: 'select',
      options: ['outline', 'filled'],
      description: 'Visual style — outline has a border, filled has a background',
    },
    size: {
      control: 'select',
      options: ['xs', 'sm', 'md', 'lg'],
      description: 'Controls padding and font size',
    },
    rows: { description: 'Number of visible text lines (default height)' },
    maxLength: { description: 'Maximum number of characters allowed' },
    showCharacterCount: { description: 'Shows remaining/total character count below the field' },
    autoResize: { description: 'Automatically grows/shrinks based on content' },
    minRows: { description: 'Minimum rows when auto-resize is enabled' },
    maxRows: { description: 'Maximum rows when auto-resize is enabled' },
    helperText: { description: 'Helpful hint shown below the textarea' },
    error: { description: 'Shows error styling when true' },
    errorMessage: { description: 'Error message displayed below the textarea' },
    disabled: { description: 'Prevents editing' },
    readonly: { description: 'Allows copying but not editing' },
  },
  parameters: {
    docs: {
      description: {
        component: `
Textarea component for multi-line text input.

**Key Features:**
- Variant styles (outline, filled)
- Size presets (xs, sm, md, lg)
- Auto-resize with configurable min/max rows
- Character count display with maxLength
- Validation error message and helper text
- Disabled and readonly states
- ControlValueAccessor integration for reactive forms
`,
      },
    },
  },
};

export default meta;
type Story = StoryObj<TextareaComponent>;

export const Default: Story = {
  args: { label: 'Description', placeholder: 'Enter a description...', variant: 'outline', size: 'md', rows: 3 },
};

export const WithHelperText: Story = {
  name: 'With Helper Text',
  args: { label: 'Bio', placeholder: 'Tell us about yourself...', helperText: 'This will appear on your public profile', variant: 'outline', size: 'md', rows: 3 },
};

export const WithCharacterCount: Story = {
  name: 'With Character Count',
  args: { label: 'Short message', placeholder: 'Write a short message...', maxLength: 280, showCharacterCount: true, variant: 'outline', size: 'md', rows: 3 },
};

export const AutoResize: Story = {
  name: 'Auto-Resize',
  args: { label: 'Notes', placeholder: 'Start typing — the field will grow automatically...', autoResize: true, minRows: 2, maxRows: 10, variant: 'outline', size: 'md' },
};

export const WithError: Story = {
  name: 'Error State',
  args: { label: 'Feedback', placeholder: 'Enter your feedback...', error: true, errorMessage: 'Feedback must be at least 20 characters', variant: 'outline', size: 'md', rows: 3 },
};

export const FilledVariant: Story = {
  name: 'Filled Variant',
  args: { label: 'Comments', placeholder: 'Add a comment...', variant: 'filled', size: 'md', rows: 3 },
};

export const Disabled: Story = {
  args: { label: 'System Note', placeholder: '', variant: 'outline', size: 'md', rows: 2, disabled: true },
};

export const Readonly: Story = {
  args: { label: 'Agreement Terms', variant: 'outline', size: 'md', rows: 4, readonly: true },
};

export const Sizes: Story = {
  name: 'Size Comparison',
  render: () => ({
    template: `
      <div style="display: flex; flex-direction: column; gap: 16px; max-width: 400px;">
        <lc-textarea label="Extra Small" placeholder="xs size" size="xs" [rows]="2"></lc-textarea>
        <lc-textarea label="Small" placeholder="sm size" size="sm" [rows]="2"></lc-textarea>
        <lc-textarea label="Medium (default)" placeholder="md size" size="md" [rows]="2"></lc-textarea>
        <lc-textarea label="Large" placeholder="lg size" size="lg" [rows]="2"></lc-textarea>
      </div>`,
  }),
};

export const FeedbackForm: Story = {
  name: 'Feedback Form (Composition)',
  render: () => ({
    template: `
      <div style="max-width: 480px;">
        <h4 style="margin: 0 0 4px; font-weight: 600;">Send Feedback</h4>
        <p style="margin: 0 0 16px; font-size: 13px; color: #666;">Help us improve by sharing your thoughts.</p>
        <div style="display: flex; flex-direction: column; gap: 16px;">
          <lc-textarea
            label="What went well?"
            placeholder="Tell us what you enjoyed..."
            [rows]="3"
            [maxLength]="500"
            [showCharacterCount]="true"
          ></lc-textarea>
          <lc-textarea
            label="What could be improved?"
            placeholder="Any suggestions or issues..."
            [rows]="3"
            [maxLength]="500"
            [showCharacterCount]="true"
          ></lc-textarea>
          <lc-textarea
            label="Additional comments (optional)"
            placeholder="Anything else you'd like to add..."
            helperText="Your feedback is anonymous"
            [rows]="2"
            [autoResize]="true"
            [maxRows]="6"
          ></lc-textarea>
        </div>
      </div>`,
  }),
};

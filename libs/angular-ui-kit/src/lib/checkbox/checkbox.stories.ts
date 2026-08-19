import type { Meta, StoryObj } from '@storybook/angular';
import { CheckboxComponent } from './checkbox.component';

const meta: Meta<CheckboxComponent> = {
  title: 'Form/Checkbox',
  component: CheckboxComponent,
  parameters: {
    docs: {
      description: {
        component: `
The Checkbox component handles boolean toggle inputs with labels.
Supports validation, help text, and indeterminate state.

**Key Features:**
- Label with optional help text
- Error state with message
- Required field marker
- ControlValueAccessor for Angular forms
        `,
      },
    },
  },
  argTypes: {
    size: {
      control: 'select',
      options: ['xs', 'sm', 'md', 'lg'],
      description: 'Checkbox size',
      table: { defaultValue: { summary: 'md' } },
    },
    label: { control: 'text', description: 'Checkbox label' },
    helpText: { control: 'text', description: 'Helper text shown below the label' },
    checked: { control: 'boolean', description: 'Checked state (two-way bindable via [(checked)])' },
    indeterminate: { control: 'boolean', description: 'Partially-checked state, cleared on the next toggle' },
    disabled: { control: 'boolean', description: 'Disables the checkbox' },
    required: { control: 'boolean', description: 'Marks as required' },
  },
};

export default meta;
type Story = StoryObj<CheckboxComponent>;

export const Default: Story = {
  args: { label: 'I agree to the terms and conditions' },
};

export const WithHelpText: Story = {
  args: { label: 'Subscribe to newsletter', helpText: 'Get weekly updates about new features and design tips.' },
};

export const WithError: Story = {
  parameters: {
    docs: { description: { story: 'Error state when the checkbox is required but not checked.' } },
  },
  args: { label: 'I agree to the privacy policy', error: true, errorMessage: 'You must accept the privacy policy to continue.' },
};

export const Required: Story = {
  args: { label: 'Terms of Service', required: true, helpText: 'Required to create an account.' },
};

export const Disabled: Story = {
  render: () => ({
    template: `
      <div style="display: flex; flex-direction: column; gap: 8px;">
        <lc-checkbox label="This option is currently unavailable" [disabled]="true"></lc-checkbox>
        <lc-checkbox label="Locked in the on state" [disabled]="true" [checked]="true"></lc-checkbox>
      </div>`,
  }),
};

export const Indeterminate: Story = {
  parameters: {
    docs: { description: { story: 'Partially selected parent checkbox; the state clears on the next user toggle.' } },
  },
  args: { label: 'Select all', indeterminate: true },
};

export const CheckboxGroup: Story = {
  parameters: {
    docs: { description: { story: 'Multiple checkboxes for multi-select scenarios.' } },
  },
  render: () => ({
    template: `
      <div style="display: flex; flex-direction: column; gap: 4px;">
        <p style="margin: 0 0 8px; font-weight: 600; font-size: 14px;">Notification Preferences</p>
        <lc-checkbox label="Email notifications" helpText="Receive updates via email"></lc-checkbox>
        <lc-checkbox label="Push notifications" helpText="Browser push notifications"></lc-checkbox>
        <lc-checkbox label="SMS alerts" helpText="Text messages for urgent items"></lc-checkbox>
        <lc-checkbox label="Weekly digest" helpText="Summary of activity every Monday"></lc-checkbox>
      </div>`,
  }),
};

export const ConsentForm: Story = {
  parameters: {
    docs: { description: { story: 'Real-world pattern: consent checkboxes in a signup flow.' } },
  },
  render: () => ({
    template: `
      <div style="max-width: 400px; display: flex; flex-direction: column; gap: 16px;">
        <lc-input label="Email" type="email" placeholder="you@example.com" [required]="true"></lc-input>
        <lc-input label="Password" type="password" placeholder="••••••••" [required]="true"></lc-input>
        <div style="display: flex; flex-direction: column; gap: 8px; margin-top: 4px;">
          <lc-checkbox label="I agree to the Terms of Service" [required]="true"></lc-checkbox>
          <lc-checkbox label="I want to receive product updates" helpText="Optional. You can unsubscribe anytime."></lc-checkbox>
        </div>
        <lc-button variant="primary" [fullWidth]="true">Create Account</lc-button>
      </div>`,
  }),
};

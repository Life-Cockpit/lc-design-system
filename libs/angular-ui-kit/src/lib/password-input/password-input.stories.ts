import type { Meta, StoryObj } from '@storybook/angular';
import { fn } from 'storybook/test';
import { PasswordInputComponent } from './password-input.component';

/**
 * A specialized password input with toggle visibility, optional strength meter,
 * and requirement checklist. Perfect for signup, login, and password change forms.
 */
const meta: Meta<PasswordInputComponent> = {
  title: 'Form/Password Input',
  component: PasswordInputComponent,
  args: {
    strengthChange: fn(),
  },
  argTypes: {
    strengthChange: { action: 'strengthChange', description: 'Emitted when the password strength level changes' },
    label: { description: 'Label text above the input' },
    placeholder: { description: 'Placeholder text' },
    showStrengthMeter: { description: 'Shows a colored bar indicating password strength' },
    showRequirements: { description: 'Shows a checklist of password requirements' },
    disabled: { description: 'Prevents interaction' },
    required: { description: 'Marks the field as required' },
    error: { description: 'Custom error message to display' },
  },

  parameters: {
    docs: {
      description: {
        component: `
Password Input Component with Show/Hide Toggle and Strength Meter

**Key Features:**
- Show/Hide password toggle (eye icon)
- Real-time password strength indicator (Weak/Fair/Good/Strong)
- Visual strength meter bar with color coding
- Validation feedback (length, uppercase, lowercase, digit, symbol)
- Accessible ARIA attributes
- Reactive Forms ControlValueAccessor implementation
`,
      },
    },
  },
};

export default meta;
type Story = StoryObj<PasswordInputComponent>;

export const Default: Story = {
  args: { label: 'Password', placeholder: 'Enter your password' },
};

export const WithStrengthMeter: Story = {
  name: 'With Strength Meter',
  args: { label: 'New Password', placeholder: 'Create a strong password', showStrengthMeter: true },
};

export const WithRequirements: Story = {
  name: 'With Requirements Checklist',
  args: { label: 'Password', placeholder: 'Enter password', showRequirements: true },
};

export const FullFeatured: Story = {
  name: 'Strength + Requirements',
  args: { label: 'New Password', placeholder: 'Create a strong password', showStrengthMeter: true, showRequirements: true },
};

export const WithError: Story = {
  name: 'Error State',
  args: { label: 'Password', placeholder: 'Enter password', error: 'Incorrect password. Please try again.' },
};

export const Disabled: Story = {
  args: { label: 'Password', placeholder: 'Enter password', disabled: true },
};

export const Required: Story = {
  args: { label: 'Password', placeholder: 'Required field', required: true },
};

export const LoginForm: Story = {
  name: 'Login Form (Composition)',
  render: () => ({
    template: `
      <div style="max-width: 360px;">
        <h3 style="margin: 0 0 4px; font-size: 20px; font-weight: 600;">Welcome back</h3>
        <p style="margin: 0 0 20px; font-size: 13px; color: #666;">Enter your credentials to access your account.</p>
        <div style="display: flex; flex-direction: column; gap: 16px;">
          <lc-email-input label="Email" placeholder="you@example.com" [required]="true"></lc-email-input>
          <lc-password-input label="Password" placeholder="Enter password" [required]="true"></lc-password-input>
          <lc-button variant="primary" [fullWidth]="true">Sign In</lc-button>
        </div>
      </div>`,
  }),
};

export const SignupForm: Story = {
  name: 'Signup Form (Composition)',
  render: () => ({
    template: `
      <div style="max-width: 360px;">
        <h3 style="margin: 0 0 4px; font-size: 20px; font-weight: 600;">Create account</h3>
        <p style="margin: 0 0 20px; font-size: 13px; color: #666;">Get started with a free account.</p>
        <div style="display: flex; flex-direction: column; gap: 16px;">
          <lc-email-input label="Email" placeholder="you@example.com" [required]="true" [validateOnInput]="true"></lc-email-input>
          <lc-password-input label="Password" placeholder="Create a password" [showStrengthMeter]="true" [showRequirements]="true" [required]="true"></lc-password-input>
          <lc-password-input label="Confirm Password" placeholder="Repeat your password" [required]="true"></lc-password-input>
          <lc-button variant="primary" [fullWidth]="true">Create Account</lc-button>
        </div>
      </div>`,
  }),
};

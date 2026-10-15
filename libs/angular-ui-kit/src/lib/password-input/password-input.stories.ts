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
    requiredIndicator: {
      control: 'boolean',
      description: 'Shows the `*` of a required field; `false` keeps `required` / `aria-required` without it',
      table: { defaultValue: { summary: 'true' } },
    },
    helperText: { control: 'text', description: 'Help below the field (e.g. the password rule), linked by aria-describedby; the error replaces it' },
    minLength: {
      control: 'number',
      description: 'Native `minlength` and the length rule of checklist and meter. Unset = no attribute, rule of 8',
    },
    strengthMode: {
      control: 'select',
      options: ['composition', 'length'],
      description:
        'Meter scoring: `composition` (length + four character classes, 3.2) or `length` (NIST SP 800-63B: below minLength Weak, from it Fair, 1.5× Good, 2× Strong)',
      table: { defaultValue: { summary: 'composition' } },
    },
    autocomplete: {
      control: 'text',
      description: 'Native `autocomplete`: `current-password` (sign-in) or `new-password` (registration, change). Unset = no attribute',
    },
    name: { control: 'text', description: 'Native `name` of the inner input. Unset = no attribute' },
    autocapitalize: {
      control: 'select',
      options: ['off', 'none', 'on', 'sentences', 'words', 'characters'],
      description: 'Native `autocapitalize`; `off` so a shown password is never capitalised',
      table: { defaultValue: { summary: 'off' } },
    },
    spellcheck: {
      control: 'boolean',
      description: 'Native `spellcheck`; `false` so a shown password never reaches a spell checker',
      table: { defaultValue: { summary: 'false' } },
    },
    enterkeyhint: {
      control: 'select',
      options: [undefined, 'enter', 'done', 'go', 'next', 'previous', 'search', 'send'],
      description: 'Native `enterkeyhint` (label of the on-screen Enter key). Unset = no attribute',
    },
    showPasswordAriaLabel: { control: 'text', description: 'Accessible name of the toggle while hidden', table: { defaultValue: { summary: 'Show password' } } },
    hidePasswordAriaLabel: { control: 'text', description: 'Accessible name of the toggle while shown', table: { defaultValue: { summary: 'Hide password' } } },
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
- Accessible ARIA attributes; a 44 px visibility toggle
- NIST-style rules: \`helperText\` for the rule, \`minLength\`, a length-only meter
  (\`strengthMode="length"\`) or no meter at all
- Password managers: \`autocomplete\` (\`current-password\` / \`new-password\`) and \`name\`;
  a shown password is never capitalised, autocorrected or spell-checked
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

/** Registration by NIST SP 800-63B: a length rule as helper text, no composition rules, a password manager saves it. */
export const NewPasswordNist: Story = {
  name: 'New Password, NIST Rule (SI-3)',
  args: {
    label: 'Password',
    placeholder: '',
    autocomplete: 'new-password',
    name: 'new-password',
    minLength: 8,
    helperText: 'At least 8 characters.',
  },
};

/** The meter scores length only (no character classes): Weak below 8, Fair from 8, Good from 12, Strong from 16. */
export const LengthOnlyMeter: Story = {
  name: 'Length-only Meter (SI-3)',
  args: {
    label: 'New password',
    placeholder: '',
    autocomplete: 'new-password',
    minLength: 8,
    strengthMode: 'length',
    showStrengthMeter: true,
    helperText: 'At least 8 characters. Longer is stronger.',
  },
};

/** Sign-in: the current password, filled by the password manager. */
export const CurrentPassword: Story = {
  name: 'Sign-in Password (SI-2)',
  args: { label: 'Password', placeholder: '', autocomplete: 'current-password', name: 'password', enterkeyhint: 'go' },
};

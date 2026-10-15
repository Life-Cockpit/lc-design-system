import type { Meta, StoryObj } from '@storybook/angular';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { EmailInputComponent } from './email-input.component';

/**
 * A specialized input for email addresses with built-in validation.
 * Validates email format on input or blur and provides clear error feedback.
 * Supports all standard input states (disabled, readonly, required, error).
 */
const meta: Meta<EmailInputComponent> = {
  title: 'Form/Email Input',
  component: EmailInputComponent,
  argTypes: {
    label: { description: 'Label text above the input' },
    placeholder: { description: 'Placeholder text (default: "you@example.com")' },
    size: {
      control: 'select',
      options: ['xs', 'sm', 'md', 'lg'],
      description: 'Controls input height and font size',
    },
    validateOnInput: { description: 'Validates as the user types (vs on blur)' },
    error: { description: 'Custom error message to display' },
    helperText: { description: 'Help text shown below the input' },
    disabled: { description: 'Prevents interaction' },
    readonly: { description: 'Allows copying but not editing' },
    required: { description: 'Marks the field as required' },
    requiredIndicator: {
      control: 'boolean',
      description: 'Shows the `*` of a required field; `false` keeps the required semantics without it',
      table: { defaultValue: { summary: 'true' } },
    },
    showIcon: {
      control: 'boolean',
      description: 'Shows the leading mail icon; `false` gives long addresses about 36 px more room',
      table: { defaultValue: { summary: 'true' } },
    },
    readonlyWrap: {
      control: 'boolean',
      description: 'While `readonly`: the address wraps instead of being clipped (a hidden native input keeps value, name and autocomplete)',
      table: { defaultValue: { summary: 'false' } },
    },
    autocomplete: {
      control: 'text',
      description:
        'Native `autocomplete`: `email` (registration), `username` (sign-in name), `username webauthn` (sign-in, passkeys offered in the field). Unset = no attribute',
    },
    name: { control: 'text', description: 'Native `name` of the inner input. Unset = no attribute' },
    autocapitalize: {
      control: 'select',
      options: [undefined, 'off', 'none', 'on', 'sentences', 'words', 'characters'],
      description: 'Native `autocapitalize`. Unset = no attribute',
    },
    spellcheck: { control: 'select', options: [undefined, true, false], description: 'Native `spellcheck`. Unset = no attribute' },
    enterkeyhint: {
      control: 'select',
      options: [undefined, 'enter', 'done', 'go', 'next', 'previous', 'search', 'send'],
      description: 'Native `enterkeyhint` (label of the on-screen Enter key). Unset = no attribute',
    },
    ariaLabel: { control: 'text', description: 'Accessible name if different from the label' },
    requiredMessage: {
      control: 'text',
      description: 'Error for an empty required field',
      table: { defaultValue: { summary: 'Email address is required' } },
    },
    invalidMessage: {
      control: 'text',
      description: 'Error for a malformed address',
      table: { defaultValue: { summary: 'Please enter a valid email address' } },
    },
  },

  parameters: {
    docs: {
      description: {
        component: `
Email input component with built-in RFC 5322 validation.

**Key Features:**
- RFC 5322 regex email format validation
- Real-time validation feedback on input
- Valid/invalid visual indicators
- Size presets (xs, sm, md, lg)
- Helper text and error message display
- Disabled and readonly states; read-only addresses can wrap (\`readonlyWrap\`)
- Optional leading mail icon (\`showIcon\`)
- Autofill: \`autocomplete\` — \`username webauthn\` on a sign-in form lets the browser offer
  passkeys right in this field; \`email\` for registration; \`username\` on a password page
- ControlValueAccessor integration for reactive forms
`,
      },
    },
  },
};

export default meta;
type Story = StoryObj<EmailInputComponent>;

export const Default: Story = {
  args: { label: 'Email Address', placeholder: 'you@example.com', size: 'md' },
};

export const WithHelperText: Story = {
  name: 'With Helper Text',
  args: { label: 'Email', placeholder: 'you@example.com', size: 'md', helperText: 'We\'ll never share your email with third parties.' },
};

export const WithValidation: Story = {
  name: 'Live Validation',
  args: { label: 'Email', placeholder: 'you@example.com', size: 'md', validateOnInput: true, helperText: 'Validation runs as you type' },
};

export const WithError: Story = {
  name: 'Error State',
  args: { label: 'Email', placeholder: 'you@example.com', size: 'md', error: 'Please enter a valid email address' },
};

export const Required: Story = {
  args: { label: 'Work Email', placeholder: 'name@company.com', size: 'md', required: true },
};

export const Disabled: Story = {
  args: { label: 'Email', placeholder: 'you@example.com', size: 'md', disabled: true },
};

export const Readonly: Story = {
  args: { label: 'Account Email', size: 'md', readonly: true },
};

export const Sizes: Story = {
  name: 'Size Comparison',
  render: () => ({
    template: `
      <div style="display: flex; flex-direction: column; gap: 16px; max-width: 360px;">
        <lc-email-input label="XS" placeholder="xs size" size="xs"></lc-email-input>
        <lc-email-input label="SM" placeholder="sm size" size="sm"></lc-email-input>
        <lc-email-input label="MD (default)" placeholder="md size" size="md"></lc-email-input>
        <lc-email-input label="LG" placeholder="lg size" size="lg"></lc-email-input>
      </div>`,
  }),
};

export const InviteForm: Story = {
  name: 'Team Invite (Composition)',
  render: () => ({
    template: `
      <div style="max-width: 400px;">
        <h4 style="margin: 0 0 4px; font-weight: 600;">Invite Team Members</h4>
        <p style="margin: 0 0 16px; font-size: 13px; color: #666;">Send invitations to join your workspace.</p>
        <div style="display: flex; flex-direction: column; gap: 12px;">
          <lc-email-input label="Email 1" placeholder="colleague@company.com" [required]="true" [validateOnInput]="true"></lc-email-input>
          <lc-email-input label="Email 2" placeholder="colleague@company.com" [validateOnInput]="true"></lc-email-input>
          <lc-email-input label="Email 3" placeholder="colleague@company.com" [validateOnInput]="true"></lc-email-input>
        </div>
        <div style="margin-top: 16px;">
          <lc-button variant="primary">Send Invitations</lc-button>
        </div>
      </div>`,
  }),
};

/** Sign-in: password managers fill the address, the browser offers passkeys in the field (conditional UI). */
export const SignInWithPasskeyAutofill: Story = {
  name: 'Sign-in with Passkey Autofill (SI-2)',
  args: {
    label: 'Email address',
    placeholder: '',
    size: 'lg',
    showIcon: false,
    autocomplete: 'username webauthn',
    name: 'email',
    autocapitalize: 'off',
    spellcheck: false,
    enterkeyhint: 'next',
  },
};

/** Password page: the address typed earlier, read-only, wrapping, and named `username` for password managers. */
export const ReadonlyAddressThatWraps: Story = {
  name: 'Read-only Address that Wraps (SI-10)',
  render: () => ({
    moduleMetadata: { imports: [EmailInputComponent, ReactiveFormsModule] },
    props: { address: new FormControl('johanna-friederike.brandt-oberhausen@example.com') },
    template: `
      <div style="max-width: 312px">
        <lc-email-input label="Email address" size="lg" [readonly]="true" [readonlyWrap]="true" [showIcon]="false"
                        autocomplete="username" name="username" [formControl]="address"></lc-email-input>
      </div>`,
  }),
};

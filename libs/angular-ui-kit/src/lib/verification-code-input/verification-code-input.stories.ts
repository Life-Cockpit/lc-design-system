import type { Meta, StoryObj } from '@storybook/angular';
import { fn } from 'storybook/test';
import { VerificationCodeInputComponent } from './verification-code-input.component';

/**
 * Verification Code Input provides individual digit fields for entering OTP,
 * PIN, or verification codes. Auto-advances focus between fields and supports
 * paste from clipboard. Use for 2FA, email verification, and phone confirmation.
 */
const meta: Meta<VerificationCodeInputComponent> = {
  title: 'Form/Verification Code Input',
  component: VerificationCodeInputComponent,
  args: {
    complete: fn(),
  },
  argTypes: {
    complete: { action: 'complete', description: 'Emitted with the full code string when all digits are entered' },
    label: { description: 'Label text above the input fields' },
    length: { description: 'Number of digit fields (4 for PIN, 6 for typical OTP)' },
    hint: { description: 'Hint text below the fields (defaults to "Enter the N-digit code"; empty string hides it)' },
    autofocus: { description: 'Focus the first digit field once rendered' },
    autoSubmit: { description: 'Deprecated — `complete` always emits once when all digits are filled; bind `(complete)` to auto-submit' },
    error: { description: 'Error message displayed below the fields' },
    disabled: { description: 'Prevents all interaction' },
    required: { description: 'Marks the field group as required' },
    requiredIndicator: {
      control: 'boolean',
      description: 'Shows the `*` of a required code; `false` keeps the required semantics without it',
      table: { defaultValue: { summary: 'true' } },
    },
    gap: {
      control: 'select',
      options: ['default', 'compact'],
      description: 'Space between the boxes: `default` 12 px (8 px below 480 px), `compact` 8 px (4 px below 480 px)',
      table: { defaultValue: { summary: 'default' } },
    },
    digitAriaLabel: {
      control: 'text',
      description: 'Accessible name of each box; `{n}` and `{total}` are replaced',
      table: { defaultValue: { summary: 'Digit {n} of {total}' } },
    },
  },

  parameters: {
    docs: {
      description: {
        component: `
Verification Code Input Component with one input per digit

**Key Features:**
- Configurable number of digit fields (\`length\`)
- Automatic focus advancement after entering a digit
- Backspace moves to the previous input, arrow keys navigate
- Paste / autofill support (splits the code across the inputs). Box 1 carries
  \`autocomplete="one-time-code"\` and \`inputmode="numeric"\`; no box has a \`maxlength\`,
  which would cut an autofilled code to its first digit
- After a wrong code: call \`clear()\` (empties the boxes, reports \`''\`, focuses box 1), or
  write \`''\` through the form control (focus stays)
- Phones (below 480 px): 44 × 48 px boxes 8 px apart — six boxes are 304 px; \`gap="compact"\`
  for narrower columns
- Accessible ARIA attributes (labelled group, linked hint and error)
- Reactive Forms ControlValueAccessor implementation
- \`complete\` emits exactly once when all digits are entered
`,
      },
    },
  },
};

export default meta;
type Story = StoryObj<VerificationCodeInputComponent>;

export const Default: Story = {
  name: '6-Digit Code',
  args: { label: 'Verification Code', length: 6 },
};

export const FourDigit: Story = {
  name: '4-Digit PIN',
  args: { label: 'Enter PIN', length: 4 },
};

export const WithError: Story = {
  name: 'Error State',
  args: { label: 'Verification Code', length: 6, error: 'Invalid code. Please check your email and try again.' },
};

export const CompleteEvent: Story = {
  name: 'Complete Event',
  args: { label: 'Enter Code', length: 6 },
};

export const CustomHint: Story = {
  name: 'Custom Hint + Autofocus',
  args: { label: 'One-time code', length: 6, hint: 'Open your authenticator app to get the code', autofocus: true },
};

export const Disabled: Story = {
  args: { label: 'Verification Code', length: 6, disabled: true },
};

export const Required: Story = {
  args: { label: 'Security Code', length: 6, required: true },
};

export const TwoFactorAuth: Story = {
  name: '2FA Verification (Composition)',
  render: () => ({
    template: `
      <div style="max-width: 380px; text-align: center;">
        <div style="margin-bottom: 24px;">
          <div style="width: 56px; height: 56px; background: var(--color-primary-subtle); border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 12px;">
            <lc-icon name="shield-check" size="lg" color="var(--color-primary-500)"></lc-icon>
          </div>
          <h3 style="margin: 0 0 4px; font-size: 18px; font-weight: 600;">Two-Factor Authentication</h3>
          <p style="margin: 0; font-size: 13px; color: #666;">Enter the 6-digit code from your authenticator app.</p>
        </div>
        <lc-verification-code-input
          label=""
          [length]="6"
          hint=""
        ></lc-verification-code-input>
        <p style="margin: 16px 0 0; font-size: 12px; color: #666;">Didn't receive a code? <a href="#" style="color: var(--color-primary-500); text-decoration: none;">Resend</a></p>
      </div>`,
  }),
};

export const EmailVerification: Story = {
  name: 'Email Verification (Composition)',
  render: () => ({
    template: `
      <div style="max-width: 380px; text-align: center;">
        <div style="margin-bottom: 24px;">
          <h3 style="margin: 0 0 4px; font-size: 18px; font-weight: 600;">Verify your email</h3>
          <p style="margin: 0; font-size: 13px; color: #666;">We sent a verification code to <strong>name&#64;example.com</strong></p>
        </div>
        <lc-verification-code-input
          label=""
          [length]="6"
          hint=""
          [required]="true"
        ></lc-verification-code-input>
        <div style="margin-top: 20px;">
          <lc-button variant="primary" [fullWidth]="true">Verify Email</lc-button>
        </div>
        <p style="margin: 12px 0 0; font-size: 12px; color: #666;">Code expires in 10 minutes</p>
      </div>`,
  }),
};

/** The sign-in code page on a 360 px phone: six 44 × 48 px boxes fit the 312 px column. */
export const OnAPhone: Story = {
  name: 'On a Phone (SI-4)',
  args: { label: 'Code', length: 6, hint: 'The code is valid for 10 minutes.', requiredIndicator: false },
  parameters: { viewport: { defaultViewport: 'mobile1' } },
  render: (args) => ({
    props: args,
    template: `
      <div style="max-width: 312px">
        <lc-verification-code-input [label]="label" [length]="length" [hint]="hint" [gap]="gap"
                                    [requiredIndicator]="requiredIndicator" />
      </div>`,
  }),
};

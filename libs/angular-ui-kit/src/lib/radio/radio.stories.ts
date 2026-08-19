import type { Meta, StoryObj } from '@storybook/angular';
import { RadioComponent } from './radio.component';

/**
 * Radio buttons allow users to select exactly one option from a group.
 * Always use at least 2 radios together with the same `name` attribute.
 * Supports labels, help text, error states, and multiple sizes.
 */
const meta: Meta<RadioComponent> = {
  title: 'Form/Radio',
  component: RadioComponent,
  argTypes: {
    label: { description: 'Display text next to the radio button' },
    name: { description: 'Groups radios together — only one in a group can be selected' },
    value: { description: 'The value submitted when this radio is selected' },
    size: {
      control: 'select',
      options: ['xs', 'sm', 'md', 'lg'],
      description: 'Controls radio button and label size',
    },
    helpText: { description: 'Additional context displayed below the label' },
    error: { description: 'Shows error styling when true' },
    errorMessage: { description: 'Error message displayed below the radio' },
    required: { description: 'Marks the field as required' },
    disabled: { control: 'boolean', description: 'Prevents interaction' },
    checked: { control: 'boolean', description: 'Checked state (two-way bindable via [(checked)])' },
  },

  parameters: {
    docs: {
      description: {
        component: `
Radio button component for single-option selection within a group.

**Key Features:**
- Single selection within a named radio group
- Multiple size variants (sm, md, lg)
- Validation error display with error message
- Help text support
- Full accessibility with ARIA attributes
- ControlValueAccessor integration for reactive forms
`,
      },
    },
  },
};

export default meta;
type Story = StoryObj<RadioComponent>;

export const Default: Story = {
  render: () => ({
    template: `
      <div style="display: flex; flex-direction: column; gap: 8px;">
        <lc-radio name="fruit" value="apple" label="Apple"></lc-radio>
        <lc-radio name="fruit" value="banana" label="Banana"></lc-radio>
        <lc-radio name="fruit" value="cherry" label="Cherry"></lc-radio>
      </div>`,
  }),
};

export const WithHelpText: Story = {
  name: 'With Help Text',
  render: () => ({
    template: `
      <div style="display: flex; flex-direction: column; gap: 12px;">
        <lc-radio name="plan" value="starter" label="Starter" helpText="Free forever, up to 3 projects"></lc-radio>
        <lc-radio name="plan" value="pro" label="Professional" helpText="$12/month, unlimited projects and team members"></lc-radio>
        <lc-radio name="plan" value="enterprise" label="Enterprise" helpText="Custom pricing, dedicated support and SLA"></lc-radio>
      </div>`,
  }),
};

export const WithError: Story = {
  name: 'Error State',
  render: () => ({
    template: `
      <div style="display: flex; flex-direction: column; gap: 8px;">
        <lc-radio name="terms" value="agree" label="I agree to the terms" [error]="true" errorMessage="You must accept the terms to continue"></lc-radio>
      </div>`,
  }),
};

export const Disabled: Story = {
  render: () => ({
    template: `
      <div style="display: flex; flex-direction: column; gap: 8px;">
        <lc-radio name="locked" value="a" label="Available option"></lc-radio>
        <lc-radio name="locked" value="b" label="Disabled option" [disabled]="true"></lc-radio>
        <lc-radio name="locked" value="c" label="Another available option"></lc-radio>
      </div>`,
  }),
};

export const Sizes: Story = {
  name: 'Size Comparison',
  render: () => ({
    template: `
      <div style="display: flex; gap: 32px; align-items: flex-start;">
        <div style="display: flex; flex-direction: column; gap: 6px;">
          <span style="font-size: 11px; color: #666; font-weight: 500;">XS</span>
          <lc-radio name="size-xs" value="a" label="Extra small" size="xs"></lc-radio>
        </div>
        <div style="display: flex; flex-direction: column; gap: 6px;">
          <span style="font-size: 11px; color: #666; font-weight: 500;">SM</span>
          <lc-radio name="size-sm" value="a" label="Small" size="sm"></lc-radio>
        </div>
        <div style="display: flex; flex-direction: column; gap: 6px;">
          <span style="font-size: 11px; color: #666; font-weight: 500;">MD</span>
          <lc-radio name="size-md" value="a" label="Medium" size="md"></lc-radio>
        </div>
        <div style="display: flex; flex-direction: column; gap: 6px;">
          <span style="font-size: 11px; color: #666; font-weight: 500;">LG</span>
          <lc-radio name="size-lg" value="a" label="Large" size="lg"></lc-radio>
        </div>
      </div>`,
  }),
};

export const ShippingMethod: Story = {
  name: 'Shipping Method (Composition)',
  render: () => ({
    template: `
      <fieldset style="border: none; padding: 0; margin: 0; max-width: 400px;">
        <legend style="font-size: 14px; font-weight: 600; margin-bottom: 12px;">Shipping Method</legend>
        <div style="display: flex; flex-direction: column; gap: 12px;">
          <div style="border: 1px solid #e2e2e2; border-radius: 8px; padding: 12px 16px;">
            <lc-radio name="shipping" value="standard" label="Standard Shipping" helpText="5-7 business days — Free"></lc-radio>
          </div>
          <div style="border: 1px solid #e2e2e2; border-radius: 8px; padding: 12px 16px;">
            <lc-radio name="shipping" value="express" label="Express Shipping" helpText="2-3 business days — $9.99"></lc-radio>
          </div>
          <div style="border: 1px solid #e2e2e2; border-radius: 8px; padding: 12px 16px;">
            <lc-radio name="shipping" value="overnight" label="Overnight Shipping" helpText="Next business day — $24.99"></lc-radio>
          </div>
        </div>
      </fieldset>`,
  }),
};

export const PaymentMethod: Story = {
  name: 'Payment Method (Composition)',
  render: () => ({
    template: `
      <fieldset style="border: none; padding: 0; margin: 0; max-width: 360px;">
        <legend style="font-size: 14px; font-weight: 600; margin-bottom: 12px;">Payment Method</legend>
        <div style="display: flex; flex-direction: column; gap: 10px;">
          <lc-radio name="payment" value="card" label="Credit / Debit Card" helpText="All major card networks" [checked]="true"></lc-radio>
          <lc-radio name="payment" value="wallet" label="Digital Wallet" helpText="Pay with your wallet balance"></lc-radio>
          <lc-radio name="payment" value="bank" label="Bank Transfer" helpText="Direct bank transfer (1-2 days)"></lc-radio>
          <lc-radio name="payment" value="voucher" label="Voucher" [disabled]="true" helpText="Coming soon"></lc-radio>
        </div>
      </fieldset>`,
  }),
};

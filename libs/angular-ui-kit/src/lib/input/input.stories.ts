import type { Meta, StoryObj } from '@storybook/angular';
import { InputComponent } from './input.component';

const meta: Meta<InputComponent> = {
  title: 'Form/Input',
  component: InputComponent,
  parameters: {
    docs: {
      description: {
        component: `
The Input component handles text-based form data entry with comprehensive
validation, accessibility, and customization features.

**Key Features:**
- Multiple input types (text, email, password, number, tel, url)
- 4 sizes (xs, sm, md, lg)
- Validation with error messages
- Helper text for guidance
- Leading/trailing icons
- Character count display
- ControlValueAccessor for Angular forms integration
        `,
      },
    },
  },
  argTypes: {
    type: {
      control: 'select',
      options: ['text', 'email', 'password', 'number', 'tel', 'url'],
      description: 'Input type',
      table: { defaultValue: { summary: 'text' } },
    },
    size: {
      control: 'select',
      options: ['xs', 'sm', 'md', 'lg'],
      description: 'Input field size',
      table: { defaultValue: { summary: 'md' } },
    },
    label: { control: 'text', description: 'Label displayed above the input' },
    value: { control: 'text', description: 'Current value (two-way bindable via [(value)])' },
    placeholder: { control: 'text', description: 'Placeholder text' },
    helperText: { control: 'text', description: 'Helper text below the input' },
    error: { control: 'text', description: 'Error message (activates error state)' },
    disabled: { control: 'boolean', description: 'Disables the input' },
    readonly: { control: 'boolean', description: 'Makes the input read-only' },
    required: { control: 'boolean', description: 'Marks as required' },
  },
};

export default meta;
type Story = StoryObj<InputComponent>;

export const Default: Story = {
  args: { label: 'Full Name', placeholder: 'Enter your full name', size: 'md' },
};

export const WithHelper: Story = {
  parameters: {
    docs: { description: { story: 'Helper text provides additional guidance below the input.' } },
  },
  args: { label: 'Username', placeholder: 'your-username', helperText: 'Must be 3–20 characters. Only letters, numbers, and hyphens.' },
};

export const WithError: Story = {
  parameters: {
    docs: { description: { story: 'Error messages appear when validation fails. The input border turns red.' } },
  },
  args: { label: 'Email Address', placeholder: 'you@example.com', type: 'email', error: 'Please enter a valid email address' },
};

export const WithIcon: Story = {
  parameters: {
    docs: { description: { story: 'Icons provide visual context about the input purpose.' } },
  },
  args: { label: 'Search', placeholder: 'Search users, projects...', iconBefore: 'magnifying-glass' },
};

export const WithCharCount: Story = {
  parameters: {
    docs: { description: { story: 'Character count helps users stay within limits. Shows current/max.' } },
  },
  args: { label: 'Bio', placeholder: 'Tell us about yourself...', maxLength: 150, showCharCount: true, helperText: 'A short description for your profile.' },
};

export const Required: Story = {
  args: { label: 'Company Name', placeholder: 'Acme Inc.', required: true },
};

export const Disabled: Story = {
  args: { label: 'Account ID', placeholder: 'Auto-generated', disabled: true },
};

export const Readonly: Story = {
  args: { label: 'API Key', readonly: true },
};

export const Sizes: Story = {
  parameters: {
    docs: { description: { story: 'All available input sizes. Use `sm` for compact forms, `lg` for hero inputs.' } },
  },
  render: () => ({
    template: `
      <div style="display: flex; flex-direction: column; gap: 16px; max-width: 400px;">
        <lc-input size="xs" label="Extra Small" placeholder="xs size"></lc-input>
        <lc-input size="sm" label="Small" placeholder="sm size"></lc-input>
        <lc-input size="md" label="Medium (default)" placeholder="md size"></lc-input>
        <lc-input size="lg" label="Large" placeholder="lg size"></lc-input>
      </div>`,
  }),
};

export const LoginForm: Story = {
  parameters: {
    docs: { description: { story: 'Real-world example: a login form using multiple input features.' } },
  },
  render: () => ({
    template: `
      <div style="max-width: 360px; padding: 24px; border: 1px solid #e5e7eb; border-radius: 12px;">
        <h2 style="margin: 0 0 4px; font-size: 20px; font-weight: 600;">Welcome back</h2>
        <p style="margin: 0 0 20px; font-size: 14px; color: var(--color-text-secondary);">Sign in to your account</p>
        <div style="display: flex; flex-direction: column; gap: 16px;">
          <lc-input label="Email" type="email" placeholder="you@company.com" iconBefore="envelope" [required]="true"></lc-input>
          <lc-input label="Password" type="password" placeholder="••••••••" [required]="true"></lc-input>
          <lc-button variant="primary" [fullWidth]="true">Sign In</lc-button>
          <lc-button variant="link" size="sm">Forgot your password?</lc-button>
        </div>
      </div>`,
  }),
};

export const ContactForm: Story = {
  parameters: {
    docs: { description: { story: 'Example showing inputs with various validation states.' } },
  },
  render: () => ({
    template: `
      <div style="max-width: 480px; display: flex; flex-direction: column; gap: 16px;">
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px;">
          <lc-input label="First Name" placeholder="John" [required]="true"></lc-input>
          <lc-input label="Last Name" placeholder="Doe" [required]="true"></lc-input>
        </div>
        <lc-input label="Email" type="email" placeholder="john@example.com" [required]="true" iconBefore="envelope"></lc-input>
        <lc-input label="Phone" type="tel" placeholder="+1 (555) 000-0000" iconBefore="phone" helperText="Optional. For urgent inquiries only."></lc-input>
      </div>`,
  }),
};

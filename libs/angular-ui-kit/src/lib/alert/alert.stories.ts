import type { Meta, StoryObj } from '@storybook/angular';
import { moduleMetadata } from '@storybook/angular';
import { AlertComponent } from './alert.component';
import { ButtonComponent } from '../button/button.component';

const meta: Meta<AlertComponent> = {
  title: 'Feedback/Alert',
  component: AlertComponent,
  parameters: {
    docs: {
      description: {
        component: `
The Alert component displays inline notifications and messages.
Use it to inform users about important state changes, errors, warnings, or confirmations.

**Key Features:**
- 4 semantic variants (success, error, warning, info)
- Optional title and icon
- Dismissible option with close button
- Action slot (\`slot="action"\`) for a button right of the body, e.g. retry
- Accessible: role="alert" for error / warning, role="status" otherwise; \`visible\` is two-way bindable
        `,
      },
    },
  },
  argTypes: {
    variant: {
      control: 'select',
      options: ['success', 'error', 'warning', 'info'],
      description: 'Semantic variant determining color and default icon',
      table: { defaultValue: { summary: 'info' } },
    },
    title: { control: 'text', description: 'Optional bold title' },
    message: { control: 'text', description: 'Alert message (alternative to ng-content)' },
    dismissible: { control: 'boolean', description: 'Shows a close button' },
    showIcon: { control: 'boolean', description: 'Show/hide the status icon', table: { defaultValue: { summary: 'true' } } },
  },
};

export default meta;
type Story = StoryObj<AlertComponent>;

export const Info: Story = {
  args: { variant: 'info', title: 'New Feature Available', message: 'You can now export your data as CSV. Check the settings page for more options.' },
};

export const Success: Story = {
  args: { variant: 'success', title: 'Payment Successful', message: 'Your subscription has been renewed. Next billing date: May 15, 2026.' },
};

export const Warning: Story = {
  args: { variant: 'warning', title: 'Storage Almost Full', message: 'You have used 90% of your storage quota. Consider upgrading your plan or deleting unused files.' },
};

export const Error: Story = {
  args: { variant: 'error', title: 'Connection Failed', message: 'Unable to reach the server. Please check your internet connection and try again.' },
};

export const Dismissible: Story = {
  parameters: {
    docs: { description: { story: 'Dismissible alerts show a close button. The `dismissed` event fires when clicked; bind `[(visible)]` to show the alert again later.' } },
  },
  args: { variant: 'info', title: 'Cookie Consent', message: 'We use cookies to improve your experience. By continuing, you agree to our privacy policy.', dismissible: true },
};

export const WithAction: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'Project a button with `slot="action"` to render it right of the alert body — the standard "error state with retry" pattern.',
      },
    },
  },
  decorators: [moduleMetadata({ imports: [ButtonComponent] })],
  render: () => ({
    template: `
      <lc-alert variant="error" title="Laden fehlgeschlagen" message="Die Vorhaben-Liste konnte nicht geladen werden.">
        <lc-button slot="action" variant="outline" size="sm">Erneut versuchen</lc-button>
      </lc-alert>`,
  }),
};

export const WithoutTitle: Story = {
  parameters: {
    docs: { description: { story: 'Alerts work without a title for simpler messages.' } },
  },
  args: { variant: 'success', message: 'Your changes have been saved.' },
};

export const WithoutIcon: Story = {
  args: { variant: 'info', title: 'Note', message: 'This alert has no icon for a minimal look.', showIcon: false },
};

export const AllVariants: Story = {
  parameters: {
    docs: { description: { story: 'Side-by-side comparison of all alert variants.' } },
  },
  render: () => ({
    template: `
      <div style="display: flex; flex-direction: column; gap: 12px;">
        <lc-alert variant="info" title="Information">This is a general informational message for the user.</lc-alert>
        <lc-alert variant="success" title="Success">The operation completed successfully.</lc-alert>
        <lc-alert variant="warning" title="Warning">Please review the following items before proceeding.</lc-alert>
        <lc-alert variant="error" title="Error">Something went wrong. Please try again later.</lc-alert>
      </div>`,
  }),
};

export const FormValidation: Story = {
  parameters: {
    docs: { description: { story: 'Common pattern: showing validation errors above a form.' } },
  },
  render: () => ({
    template: `
      <div style="max-width: 400px; display: flex; flex-direction: column; gap: 16px;">
        <lc-alert variant="error" title="Please fix the following errors:">
          <ul style="margin: 4px 0 0; padding-left: 16px; font-size: 14px;">
            <li>Email address is required</li>
            <li>Password must be at least 8 characters</li>
          </ul>
        </lc-alert>
        <lc-input label="Email" placeholder="you@example.com" error="Email is required"></lc-input>
        <lc-input label="Password" type="password" placeholder="••••••••" error="Minimum 8 characters"></lc-input>
      </div>`,
  }),
};

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
- Action slot (\`slot="action"\`) for a button right of the body, e.g. retry;
  3.3: \`actionsLayout="stacked"\` puts several actions in their own row below the text
- 3.3: the variant icon is decorative unless \`iconAriaLabel\` names it — no built-in English word
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
    iconAriaLabel: {
      control: 'text',
      description:
        '3.3: accessible name of the variant icon (e.g. „Warnung“). Unset = decorative icon (`aria-hidden`); the title and colour carry the tone. The kit sets no default text.',
    },
    actionsLayout: {
      control: 'inline-radio',
      options: ['inline', 'stacked'],
      description:
        '3.3: `inline` — one action right of the body (3.2). `stacked` — the actions in their own row below the text; below 576 px of alert width one per line at full width, 8 px apart, from 576 px side by side at natural width.',
      table: { defaultValue: { summary: 'inline' } },
    },
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

/** 3.3 (AS-11): two answers below the text — full width on a phone, side by side from 576 px. */
export const StackedActions: Story = {
  name: 'Stacked actions (3.3)',
  decorators: [moduleMetadata({ imports: [ButtonComponent] })],
  render: () => ({
    template: `
      <div style="display: flex; flex-direction: column; gap: 1.5rem;">
        <div style="max-width: 312px;">
          <lc-alert variant="warning" title="Du hast nur einen Passkey" message="Ohne einen zweiten kommst du nicht mehr in dein Konto, wenn dieses Gerät fehlt." [showIcon]="false" actionsLayout="stacked">
            <lc-button slot="action" variant="outline" size="lg">Zweiten Passkey einrichten</lc-button>
            <lc-button slot="action" variant="ghost" size="lg">Später</lc-button>
          </lc-alert>
        </div>
        <lc-alert variant="warning" title="Du hast nur einen Passkey" message="Ohne einen zweiten kommst du nicht mehr in dein Konto, wenn dieses Gerät fehlt." iconAriaLabel="Warnung" actionsLayout="stacked">
          <lc-button slot="action" variant="outline" size="lg">Zweiten Passkey einrichten</lc-button>
          <lc-button slot="action" variant="ghost" size="lg">Später</lc-button>
        </lc-alert>
      </div>
    `,
  }),
};


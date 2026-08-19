import type { Meta, StoryObj } from '@storybook/angular';
import { SpinnerComponent } from './spinner.component';

const meta: Meta<SpinnerComponent> = {
  title: 'Feedback/Spinner',
  component: SpinnerComponent,
  parameters: {
    docs: {
      description: {
        component: `
The Spinner component indicates loading or processing states.
Use it for async operations, page loads, and data fetching.

**Key Features:**
- 3 sizes (sm, md, lg)
- Optional message text
- Accessible with ARIA attributes
        `,
      },
    },
  },
  argTypes: {
    size: {
      control: 'select',
      options: ['sm', 'md', 'lg'],
      description: 'Spinner size',
      table: { defaultValue: { summary: 'md' } },
    },
    message: { control: 'text', description: 'Loading message displayed below the spinner' },
  },
};

export default meta;
type Story = StoryObj<SpinnerComponent>;

export const Default: Story = {
  args: { size: 'md' },
};

export const WithMessage: Story = {
  args: { size: 'md', message: 'Loading your dashboard...' },
};

export const Sizes: Story = {
  parameters: {
    docs: { description: { story: 'Use `sm` inline with text, `md` for sections, and `lg` for full-page loading.' } },
  },
  render: () => ({
    template: `
      <div style="display: flex; align-items: center; gap: 32px;">
        <div style="text-align: center;">
          <lc-spinner size="sm"></lc-spinner>
          <p style="margin: 8px 0 0; font-size: 12px; color: var(--color-text-secondary);">Small</p>
        </div>
        <div style="text-align: center;">
          <lc-spinner size="md"></lc-spinner>
          <p style="margin: 8px 0 0; font-size: 12px; color: var(--color-text-secondary);">Medium</p>
        </div>
        <div style="text-align: center;">
          <lc-spinner size="lg"></lc-spinner>
          <p style="margin: 8px 0 0; font-size: 12px; color: var(--color-text-secondary);">Large</p>
        </div>
      </div>`,
  }),
};

export const InCard: Story = {
  parameters: {
    docs: { description: { story: 'Spinner used as a placeholder while content loads.' } },
  },
  render: () => ({
    template: `
      <lc-card variant="outlined" padding="lg">
        <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 200px;">
          <lc-spinner size="lg" message="Loading analytics data..."></lc-spinner>
        </div>
      </lc-card>`,
  }),
};

export const InlineWithButton: Story = {
  parameters: {
    docs: { description: { story: 'Small spinner used inline next to form elements during submission.' } },
  },
  render: () => ({
    template: `
      <div style="display: flex; align-items: center; gap: 12px;">
        <lc-button variant="primary" [disabled]="true">Submitting...</lc-button>
        <lc-spinner size="sm"></lc-spinner>
        <span style="font-size: 14px; color: var(--color-text-secondary);">Please wait</span>
      </div>`,
  }),
};

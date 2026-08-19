import type { Meta, StoryObj } from '@storybook/angular';
import { ModalComponent } from './modal.component';

const meta: Meta<ModalComponent> = {
  title: 'Feedback/Modal',
  component: ModalComponent,
  parameters: {
    docs: {
      description: {
        component: `
The Modal component displays content in a focused overlay dialog.
Use it for confirmations, forms, and important user interactions that require attention.

**Key Features:**
- 5 sizes (sm, md, lg, xl, full)
- Header, body, and footer slots
- Backdrop click to close
- Keyboard escape support
- Focus trapping for accessibility

Click the **Open Modal** button in each story to see the modal in action.
        `,
      },
      story: { inline: false, height: '120px' },
    },
  },
  argTypes: {
    size: {
      control: 'select',
      options: ['sm', 'md', 'lg', 'xl', 'full'],
      description: 'Modal width',
      table: { defaultValue: { summary: 'md' } },
    },
    open: { control: 'boolean', description: 'Controls visibility' },
  },
};

export default meta;
type Story = StoryObj<ModalComponent>;

export const Default: Story = {
  args: { open: false, size: 'md' },
  render: (args) => ({
    props: { ...args, isOpen: false },
    template: `
      <lc-button variant="primary" (click)="isOpen = true">Open Modal</lc-button>
      <lc-modal [open]="isOpen" (openChange)="isOpen = $event" [size]="size">
        <div slot="header"><h2>Confirm Action</h2></div>
        <div slot="body">
          <p style="margin: 0; color: var(--color-text-secondary); line-height: 1.5;">
            Are you sure you want to proceed? This action will update your billing settings and cannot be undone.
          </p>
        </div>
        <div slot="footer" style="display: flex; gap: 8px; justify-content: flex-end;">
          <lc-button variant="outline" (click)="isOpen = false">Cancel</lc-button>
          <lc-button variant="primary" (click)="isOpen = false">Confirm</lc-button>
        </div>
      </lc-modal>`,
  }),
};

export const Small: Story = {
  parameters: {
    docs: { description: { story: 'Small modals for quick confirmations.' } },
  },
  args: { open: false, size: 'sm' },
  render: (args) => ({
    props: { ...args, isOpen: false },
    template: `
      <lc-button variant="outline" (click)="isOpen = true">Open Small Modal</lc-button>
      <lc-modal [open]="isOpen" (openChange)="isOpen = $event" [size]="size">
        <div slot="header"><h2>Delete Item?</h2></div>
        <div slot="body">
          <p style="margin: 0; color: var(--color-text-secondary);">This item will be permanently removed.</p>
        </div>
        <div slot="footer" style="display: flex; gap: 8px; justify-content: flex-end;">
          <lc-button variant="ghost" size="sm" (click)="isOpen = false">Keep</lc-button>
          <lc-button variant="danger" size="sm" (click)="isOpen = false">Delete</lc-button>
        </div>
      </lc-modal>`,
  }),
};

export const Large: Story = {
  parameters: {
    docs: { description: { story: 'Large modals for forms and detailed content.' } },
  },
  args: { open: false, size: 'lg' },
  render: (args) => ({
    props: { ...args, isOpen: false },
    template: `
      <lc-button variant="outline" (click)="isOpen = true">Open Large Modal</lc-button>
      <lc-modal [open]="isOpen" (openChange)="isOpen = $event" [size]="size">
        <div slot="header"><h2>Edit Profile</h2></div>
        <div slot="body">
          <div style="display: flex; flex-direction: column; gap: 16px;">
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px;">
              <lc-input label="First Name" placeholder="John"></lc-input>
              <lc-input label="Last Name" placeholder="Doe"></lc-input>
            </div>
            <lc-input label="Email" type="email" placeholder="john@example.com" iconBefore="envelope"></lc-input>
            <lc-input label="Job Title" placeholder="Software Engineer"></lc-input>
          </div>
        </div>
        <div slot="footer" style="display: flex; gap: 8px; justify-content: flex-end;">
          <lc-button variant="ghost" (click)="isOpen = false">Cancel</lc-button>
          <lc-button variant="primary" (click)="isOpen = false">Save Changes</lc-button>
        </div>
      </lc-modal>`,
  }),
};

export const DestructiveConfirmation: Story = {
  parameters: {
    docs: { description: { story: 'Pattern for confirming destructive actions with a danger button.' } },
  },
  args: { open: false, size: 'sm' },
  render: (args) => ({
    props: { ...args, isOpen: false },
    template: `
      <lc-button variant="danger" (click)="isOpen = true">Delete Account...</lc-button>
      <lc-modal [open]="isOpen" (openChange)="isOpen = $event" [size]="size">
        <div slot="header">
          <div style="display: flex; align-items: center; gap: 8px;">
            <lc-icon name="exclamation-triangle" size="md" color="var(--color-error-default)"></lc-icon>
            <h2 style="color: #991b1b;">Delete Account</h2>
          </div>
        </div>
        <div slot="body">
          <p style="margin: 0 0 12px; color: var(--color-text-secondary); line-height: 1.5;">
            This will permanently delete your account and all associated data including:
          </p>
          <ul style="margin: 0; padding-left: 20px; color: var(--color-text-secondary); font-size: 14px; line-height: 1.8;">
            <li>All projects and tasks</li>
            <li>Team memberships</li>
            <li>Billing history</li>
          </ul>
        </div>
        <div slot="footer" style="display: flex; gap: 8px; justify-content: flex-end;">
          <lc-button variant="outline" (click)="isOpen = false">Cancel</lc-button>
          <lc-button variant="danger" (click)="isOpen = false">Delete Forever</lc-button>
        </div>
      </lc-modal>`,
  }),
};

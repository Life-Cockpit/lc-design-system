import type { Meta, StoryObj } from '@storybook/angular';
import { fn, expect, userEvent, within } from 'storybook/test';
import { ButtonComponent } from './button.component';
import { IconComponent } from '../icon/icon.component';

const meta: Meta<ButtonComponent> = {
  title: 'Components/Button',
  component: ButtonComponent,
  parameters: {
    docs: {
      description: {
        component: `
The Button component is the primary interactive element for triggering actions.
It supports multiple variants, sizes, states, and slots for icons.

**Key Features:**
- 8 visual variants for different contexts
- 4 sizes (xs, sm, md, lg)
- Loading state with spinner
- Icon slots (before/after)
- Full-width option
- Accessible with ARIA attributes
        `,
      },
    },
  },
  args: {
    clicked: fn(),
    focused: fn(),
    blurred: fn(),
  },
  argTypes: {
    variant: {
      control: 'select',
      options: ['primary', 'secondary', 'outline', 'ghost', 'link', 'danger', 'warning', 'info'],
      description: 'Visual style variant',
      table: { defaultValue: { summary: 'primary' } },
    },
    size: {
      control: 'select',
      options: ['xs', 'sm', 'md', 'lg'],
      description: 'Button size',
      table: { defaultValue: { summary: 'md' } },
    },
    disabled: { control: 'boolean', description: 'Disables the button' },
    loading: { control: 'boolean', description: 'Shows a loading spinner and disables the button' },
    fullWidth: { control: 'boolean', description: 'Stretches the button to full container width' },
    iconOnly: { control: 'boolean', description: 'Renders as a square icon-only button' },
    type: {
      control: 'select',
      options: ['button', 'submit', 'reset'],
      description: 'HTML button type attribute',
      table: { defaultValue: { summary: 'button' } },
    },
    clicked: { action: 'clicked', description: 'Emitted when the button is clicked' },
    focused: { action: 'focused', description: 'Emitted when the button receives focus' },
    blurred: { action: 'blurred', description: 'Emitted when the button loses focus' },
  },
};

export default meta;
type Story = StoryObj<ButtonComponent>;

// --- Basic Variants ---

export const Primary: Story = {
  args: { variant: 'primary', size: 'md' },
  render: (args) => ({
    props: args,
    template: `<lc-button [variant]="variant" [size]="size" (clicked)="clicked($event)" (focused)="focused($event)" (blurred)="blurred($event)">Save Changes</lc-button>`,
  }),
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    const button = canvas.getByRole('button', { name: /save changes/i });
    await userEvent.click(button);
    await expect(args['clicked']).toHaveBeenCalled();
  },
};

export const Secondary: Story = {
  args: { variant: 'secondary', size: 'md' },
  render: (args) => ({
    props: args,
    template: `<lc-button [variant]="variant" [size]="size" (clicked)="clicked($event)" (focused)="focused($event)" (blurred)="blurred($event)">Learn More</lc-button>`,
  }),
};

export const Outline: Story = {
  args: { variant: 'outline', size: 'md' },
  render: (args) => ({
    props: args,
    template: `<lc-button [variant]="variant" [size]="size" (clicked)="clicked($event)" (focused)="focused($event)" (blurred)="blurred($event)">Edit Profile</lc-button>`,
  }),
};

export const Ghost: Story = {
  args: { variant: 'ghost', size: 'md' },
  render: (args) => ({
    props: args,
    template: `<lc-button [variant]="variant" [size]="size" (clicked)="clicked($event)" (focused)="focused($event)" (blurred)="blurred($event)">Cancel</lc-button>`,
  }),
};

export const LinkButton: Story = {
  name: 'Link',
  args: { variant: 'link', size: 'md' },
  render: (args) => ({
    props: args,
    template: `<lc-button [variant]="variant" [size]="size" (clicked)="clicked($event)" (focused)="focused($event)" (blurred)="blurred($event)">View Documentation</lc-button>`,
  }),
};

export const InlineLink: Story = {
  parameters: {
    docs: {
      description: {
        story:
          '`inline` makes the button flow with the surrounding text and inherit its typography — for links inside copy, linked counters and clickable row titles. Pair with `variant="link"`.',
      },
    },
  },
  render: () => ({
    template: `
      <p style="max-width: 48ch; font-size: 14px; line-height: 1.6;">
        Im aktuellen Sprint sind
        <lc-button variant="link" [inline]="true">3 Vorhaben blockiert</lc-button>
        und <lc-button variant="link" [inline]="true">2 warten auf Review</lc-button>.
      </p>
      <h4 style="margin: 16px 0 0; font-size: 16px; font-weight: 600;">
        <lc-button variant="link" [inline]="true" style="--lc-button-link-fg: inherit;">Clickable row title</lc-button>
      </h4>`,
  }),
};

export const Danger: Story = {
  args: { variant: 'danger', size: 'md' },
  render: (args) => ({
    props: args,
    template: `<lc-button [variant]="variant" [size]="size" (clicked)="clicked($event)" (focused)="focused($event)" (blurred)="blurred($event)">Delete Account</lc-button>`,
  }),
};

export const Warning: Story = {
  args: { variant: 'warning', size: 'md' },
  render: (args) => ({
    props: args,
    template: `<lc-button [variant]="variant" [size]="size" (clicked)="clicked($event)" (focused)="focused($event)" (blurred)="blurred($event)">Reset Settings</lc-button>`,
  }),
};

export const InfoButton: Story = {
  name: 'Info',
  args: { variant: 'info', size: 'md' },
  render: (args) => ({
    props: args,
    template: `<lc-button [variant]="variant" [size]="size" (clicked)="clicked($event)" (focused)="focused($event)" (blurred)="blurred($event)">Show Details</lc-button>`,
  }),
};

// --- States ---

export const Loading: Story = {
  parameters: {
    docs: { description: { story: 'The loading state replaces icon slots with a spinner and disables interaction.' } },
  },
  args: { variant: 'primary', loading: true },
  render: (args) => ({
    props: args,
    template: `<lc-button [variant]="variant" [loading]="loading" (clicked)="clicked($event)">Saving...</lc-button>`,
  }),
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    const button = canvas.getByRole('button');
    await expect(button).toBeDisabled();
    await userEvent.click(button);
    await expect(args['clicked']).not.toHaveBeenCalled();
  },
};

export const Disabled: Story = {
  args: { variant: 'primary', disabled: true },
  render: (args) => ({
    props: args,
    template: `<lc-button [variant]="variant" [disabled]="disabled" (clicked)="clicked($event)">Not Available</lc-button>`,
  }),
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    const button = canvas.getByRole('button');
    await expect(button).toBeDisabled();
    await userEvent.click(button);
    await expect(args['clicked']).not.toHaveBeenCalled();
  },
};

export const DisabledWithReason: Story = {
  parameters: {
    docs: {
      description: {
        story:
          '`disabledReason` shows a tooltip explaining *why* the button is disabled — it appears on hover even in the disabled state.',
      },
    },
  },
  args: { variant: 'primary', disabled: true },
  render: (args) => ({
    props: args,
    template: `<lc-button [variant]="variant" [disabled]="disabled" disabledReason="Erst alle Pflichtfelder ausfüllen" (clicked)="clicked($event)">Freigeben</lc-button>`,
  }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const button = canvas.getByRole('button');
    await expect(button).toBeDisabled();
    await expect(button).toHaveAttribute('title', 'Erst alle Pflichtfelder ausfüllen');
  },
};

// --- Sizes ---

export const Sizes: Story = {
  parameters: {
    docs: { description: { story: 'Buttons come in 4 sizes. Use `xs` for tight spaces, `lg` for prominent CTAs.' } },
  },
  render: (args) => ({
    props: args,
    template: `
      <div style="display: flex; align-items: center; gap: 12px; flex-wrap: wrap;">
        <lc-button size="xs" variant="primary" (clicked)="clicked($event)">Extra Small</lc-button>
        <lc-button size="sm" variant="primary" (clicked)="clicked($event)">Small</lc-button>
        <lc-button size="md" variant="primary" (clicked)="clicked($event)">Medium</lc-button>
        <lc-button size="lg" variant="primary" (clicked)="clicked($event)">Large</lc-button>
      </div>`,
  }),
};

// --- With Icons ---

export const WithIconBefore: Story = {
  parameters: {
    docs: { description: { story: 'Use `slot="icon-before"` for a leading icon.' } },
  },
  render: (args) => ({
    props: args,
    moduleMetadata: { imports: [IconComponent] },
    template: `
      <lc-button variant="primary" (clicked)="clicked($event)">
        <lc-icon slot="icon-before" name="plus" size="sm"></lc-icon>
        Add Item
      </lc-button>`,
  }),
};

export const WithIconAfter: Story = {
  parameters: {
    docs: { description: { story: 'Use `slot="icon-after"` for a trailing icon.' } },
  },
  render: (args) => ({
    props: args,
    moduleMetadata: { imports: [IconComponent] },
    template: `
      <lc-button variant="outline" (clicked)="clicked($event)">
        Next Step
        <lc-icon slot="icon-after" name="arrow-right" size="sm"></lc-icon>
      </lc-button>`,
  }),
};

export const IconOnly: Story = {
  parameters: {
    docs: { description: { story: 'Icon-only buttons render as squares. Always provide `ariaLabel` for accessibility.' } },
  },
  render: (args) => ({
    props: args,
    moduleMetadata: { imports: [IconComponent] },
    template: `
      <div style="display: flex; gap: 8px;">
        <lc-button variant="outline" [iconOnly]="true" ariaLabel="Edit" (clicked)="clicked($event)">
          <lc-icon name="pencil" size="sm"></lc-icon>
        </lc-button>
        <lc-button variant="outline" [iconOnly]="true" ariaLabel="Delete" (clicked)="clicked($event)">
          <lc-icon name="trash" size="sm"></lc-icon>
        </lc-button>
        <lc-button variant="outline" [iconOnly]="true" ariaLabel="Settings" (clicked)="clicked($event)">
          <lc-icon name="cog-6-tooth" size="sm"></lc-icon>
        </lc-button>
        <lc-button variant="primary" [iconOnly]="true" ariaLabel="Add" (clicked)="clicked($event)">
          <lc-icon name="plus" size="sm"></lc-icon>
        </lc-button>
      </div>`,
  }),
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    const editBtn = canvas.getByRole('button', { name: /edit/i });
    await userEvent.click(editBtn);
    await expect(args['clicked']).toHaveBeenCalled();
  },
};

// --- Layout ---

export const FullWidth: Story = {
  parameters: {
    docs: { description: { story: 'Full width buttons stretch to fill their container. Useful in modals and mobile layouts.' } },
  },
  render: (args) => ({
    props: args,
    template: `
      <div style="max-width: 320px; display: flex; flex-direction: column; gap: 8px;">
        <lc-button variant="primary" [fullWidth]="true" (clicked)="clicked($event)">Sign In</lc-button>
        <lc-button variant="outline" [fullWidth]="true" (clicked)="clicked($event)">Create Account</lc-button>
      </div>`,
  }),
};

// --- Showcase ---

export const AllVariants: Story = {
  parameters: {
    docs: { description: { story: 'Complete overview of all button variants in their default, disabled, and loading states.' } },
  },
  render: (args) => ({
    props: args,
    template: `
      <div style="display: flex; flex-direction: column; gap: 16px;">
        <div>
          <p style="margin-bottom: 8px; font-weight: 600; font-size: 14px; color: #555;">Active</p>
          <div style="display: flex; gap: 8px; flex-wrap: wrap;">
            <lc-button variant="primary" (clicked)="clicked($event)">Primary</lc-button>
            <lc-button variant="secondary" (clicked)="clicked($event)">Secondary</lc-button>
            <lc-button variant="outline" (clicked)="clicked($event)">Outline</lc-button>
            <lc-button variant="ghost" (clicked)="clicked($event)">Ghost</lc-button>
            <lc-button variant="link" (clicked)="clicked($event)">Link</lc-button>
            <lc-button variant="danger" (clicked)="clicked($event)">Danger</lc-button>
            <lc-button variant="warning" (clicked)="clicked($event)">Warning</lc-button>
            <lc-button variant="info" (clicked)="clicked($event)">Info</lc-button>
          </div>
        </div>
        <div>
          <p style="margin-bottom: 8px; font-weight: 600; font-size: 14px; color: #555;">Disabled</p>
          <div style="display: flex; gap: 8px; flex-wrap: wrap;">
            <lc-button variant="primary" [disabled]="true">Primary</lc-button>
            <lc-button variant="secondary" [disabled]="true">Secondary</lc-button>
            <lc-button variant="outline" [disabled]="true">Outline</lc-button>
            <lc-button variant="ghost" [disabled]="true">Ghost</lc-button>
            <lc-button variant="link" [disabled]="true">Link</lc-button>
            <lc-button variant="danger" [disabled]="true">Danger</lc-button>
            <lc-button variant="warning" [disabled]="true">Warning</lc-button>
            <lc-button variant="info" [disabled]="true">Info</lc-button>
          </div>
        </div>
        <div>
          <p style="margin-bottom: 8px; font-weight: 600; font-size: 14px; color: #555;">Loading</p>
          <div style="display: flex; gap: 8px; flex-wrap: wrap;">
            <lc-button variant="primary" [loading]="true">Primary</lc-button>
            <lc-button variant="secondary" [loading]="true">Secondary</lc-button>
            <lc-button variant="outline" [loading]="true">Outline</lc-button>
            <lc-button variant="danger" [loading]="true">Danger</lc-button>
          </div>
        </div>
      </div>`,
  }),
};

// --- Real-world Examples ---

export const ButtonGroup: Story = {
  parameters: {
    docs: { description: { story: 'Common pattern: a group of buttons for form actions.' } },
  },
  render: (args) => ({
    props: args,
    moduleMetadata: { imports: [IconComponent] },
    template: `
      <div style="display: flex; gap: 8px; justify-content: flex-end; padding: 16px; border-top: 1px solid #e5e7eb;">
        <lc-button variant="ghost" (clicked)="clicked($event)">Cancel</lc-button>
        <lc-button variant="outline" (clicked)="clicked($event)">Save Draft</lc-button>
        <lc-button variant="primary" (clicked)="clicked($event)">
          <lc-icon slot="icon-before" name="check" size="sm"></lc-icon>
          Publish
        </lc-button>
      </div>`,
  }),
};

export const DestructiveAction: Story = {
  parameters: {
    docs: { description: { story: 'Danger variant paired with context for destructive actions.' } },
  },
  render: (args) => ({
    props: args,
    moduleMetadata: { imports: [IconComponent] },
    template: `
      <div style="padding: 16px; border: 1px solid #fecaca; border-radius: 8px; background: #fef2f2;">
        <p style="margin: 0 0 12px; font-weight: 600; color: #991b1b;">Danger Zone</p>
        <p style="margin: 0 0 12px; font-size: 14px; color: #7f1d1d;">Once you delete your account, there is no going back.</p>
        <lc-button variant="danger" (clicked)="clicked($event)">
          <lc-icon slot="icon-before" name="trash" size="sm"></lc-icon>
          Delete Account
        </lc-button>
      </div>`,
  }),
};

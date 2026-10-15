import type { Meta, StoryObj } from '@storybook/angular';
import { ConfirmDialogComponent } from './confirm-dialog.component';

const meta: Meta<ConfirmDialogComponent> = {
  title: 'Feedback/ConfirmDialog',
  component: ConfirmDialogComponent,
  parameters: {
    docs: {
      description: {
        component: `
The ConfirmDialog provides a standardized confirmation pattern
built on top of \`<lc-modal>\`. Supports default, destructive, and
warning variants, plus optional text-matching confirmation.

Also available as an imperative service: \`ConfirmService.confirm()\`.

**3.3:** the dialog is named by its title; \`closeAriaLabel\` translates the close button;
\`[slot='preview']\` shows what the action affects; \`confirmLoading\` keeps the dialog open with a
busy confirm button; \`buttonSize="lg"\` gives 48.5 px buttons; \`placement="auto"\` makes it a
bottom sheet below 640 px.
        `,
      },
      story: { inline: false, height: '120px' },
    },
  },
  argTypes: {
    variant: {
      control: 'select',
      options: ['default', 'destructive', 'warning'],
    },
    closeAriaLabel: {
      control: 'text',
      description: '3.3: accessible name of the close button in the header.',
      table: { defaultValue: { summary: 'Close modal' } },
    },
    confirmLoading: {
      control: 'boolean',
      description: '3.3: spinner on the confirm button; a second confirm is ignored while the action runs.',
      table: { defaultValue: { summary: 'false' } },
    },
    buttonSize: {
      control: 'inline-radio',
      options: ['sm', 'md', 'lg'],
      description: '3.3: size of both buttons — `lg` (48.5 px) meets the 44 px touch target.',
      table: { defaultValue: { summary: 'md' } },
    },
    placement: {
      control: 'inline-radio',
      options: ['center', 'auto', 'sheet'],
      description: '3.3: passed to `lc-modal` — `auto` is a bottom sheet below 640 px, centred above.',
      table: { defaultValue: { summary: 'center' } },
    },
  },
};

export default meta;
type Story = StoryObj<ConfirmDialogComponent>;

export const Default: Story = {
  args: { open: false, title: 'Confirm Action', message: 'Are you sure you want to proceed?', variant: 'default' },
  render: (args) => ({
    props: { ...args, isOpen: false },
    template: `
      <lc-button variant="primary" (click)="isOpen = true">Open Confirm</lc-button>
      <lc-confirm-dialog
        [open]="isOpen"
        [variant]="variant"
        [title]="title"
        [message]="message"
        (confirmed)="isOpen = false"
        (cancelled)="isOpen = false"
      />`,
  }),
};

export const Destructive: Story = {
  args: { open: false, title: 'Delete Project?', message: 'This will permanently delete the project and all associated data. This action cannot be undone.', variant: 'destructive' },
  render: (args) => ({
    props: { ...args, isOpen: false },
    template: `
      <lc-button variant="danger" (click)="isOpen = true">Delete Project...</lc-button>
      <lc-confirm-dialog
        [open]="isOpen"
        variant="destructive"
        [title]="title"
        [message]="message"
        confirmLabel="Delete Forever"
        (confirmed)="isOpen = false"
        (cancelled)="isOpen = false"
      />`,
  }),
  parameters: {
    docs: { description: { story: 'Destructive variant with red confirm button and warning icon.' } },
  },
};

export const Warning: Story = {
  args: { open: false, title: 'Unsaved Changes', message: 'You have unsaved changes. Leaving this page will discard them.', variant: 'warning' },
  render: (args) => ({
    props: { ...args, isOpen: false },
    template: `
      <lc-button variant="outline" (click)="isOpen = true">Leave Page</lc-button>
      <lc-confirm-dialog
        [open]="isOpen"
        variant="warning"
        [title]="title"
        [message]="message"
        confirmLabel="Discard"
        cancelLabel="Stay"
        (confirmed)="isOpen = false"
        (cancelled)="isOpen = false"
      />`,
  }),
  parameters: {
    docs: { description: { story: 'Warning variant for potentially data-losing actions.' } },
  },
};

export const WithTextConfirmation: Story = {
  args: { open: false, title: 'Delete "my-project"?', message: 'This will permanently delete the project.', variant: 'destructive' },
  render: (args) => ({
    props: { ...args, isOpen: false },
    template: `
      <lc-button variant="danger" (click)="isOpen = true">Delete with confirmation...</lc-button>
      <lc-confirm-dialog
        [open]="isOpen"
        variant="destructive"
        [title]="title"
        [message]="message"
        confirmLabel="Delete"
        [requireText]="{ prompt: 'Type the project name to confirm', expected: 'my-project' }"
        (confirmed)="isOpen = false"
        (cancelled)="isOpen = false"
      />`,
  }),
  parameters: {
    docs: { description: { story: 'Double opt-out: confirm button disabled until user types the exact project name.' } },
  },
};

/** 3.3 (AC-5): a preview of what is removed, large buttons, a sheet on phones, a busy confirm. */
export const RealUse: Story = {
  name: 'Preview, large buttons, loading (3.3)',
  args: {
    open: false,
    title: 'Passkey entfernen?',
    message: 'Du meldest dich danach mit einem anderen Passkey an.',
    variant: 'destructive',
    closeAriaLabel: 'Schließen',
    buttonSize: 'lg',
    placement: 'auto',
  },
  render: (args) => ({
    props: { ...args, isOpen: false, busy: false },
    template: `
      <lc-button variant="primary" (click)="isOpen = true; busy = false">Open Confirm</lc-button>
      <lc-confirm-dialog
        [open]="isOpen"
        [variant]="variant"
        [title]="title"
        [message]="message"
        [closeAriaLabel]="closeAriaLabel"
        [buttonSize]="buttonSize"
        [placement]="placement"
        [confirmLoading]="busy"
        confirmLabel="Entfernen"
        cancelLabel="Abbrechen"
        (confirmed)="busy = true"
        (cancelled)="isOpen = false"
      >
        <p slot="preview" style="margin: 0; font-weight: 600;">iPhone · Safari · zuletzt heute 20:05</p>
      </lc-confirm-dialog>`,
  }),
};


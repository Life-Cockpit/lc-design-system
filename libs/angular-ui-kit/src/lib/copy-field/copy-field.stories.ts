import type { Meta, StoryObj } from '@storybook/angular';
import { expect, within } from 'storybook/test';
import { CopyFieldComponent } from './copy-field.component';

const meta: Meta<CopyFieldComponent> = {
  title: 'Form/Copy Field',
  component: CopyFieldComponent,
  parameters: {
    docs: {
      description: {
        component: `
\`lc-copy-field\` — a value to copy (an invitation link, a token, a command): the value
read-only and **wrapping** (never clipped; a read-only textbox named by the label), a
48.5 px copy button, and **one polite announcement** after copying. The button says
"Copied" for two seconds. If the clipboard refuses, the value is focused and selected so
the person can copy it by hand, and \`copyFailed\` fires.

\`\`\`html
<lc-copy-field label="Einladungslink" [value]="link" copyLabel="Kopieren"
               copiedLabel="Kopiert" copiedAnnouncement="Link kopiert" />
\`\`\`

\`layout="stacked"\` (default) puts the button below at full width — the phone layout;
\`inline\` puts it beside the value. All texts are inputs.
        `,
      },
    },
  },
  argTypes: {
    label: { control: 'text', description: 'Label of the value (its accessible name)' },
    value: { control: 'text', description: 'The value to copy' },
    helperText: { control: 'text', description: 'Help below the value' },
    layout: {
      control: 'select',
      options: ['stacked', 'inline'],
      description: '`stacked`: button below at full width; `inline`: button beside the value',
      table: { defaultValue: { summary: 'stacked' } },
    },
    showIcon: {
      control: 'boolean',
      description: 'Clipboard icon in the button (a check after copying)',
      table: { defaultValue: { summary: 'true' } },
    },
    copyLabel: { control: 'text', description: 'Button label', table: { defaultValue: { summary: 'Copy' } } },
    copiedLabel: {
      control: 'text',
      description: 'Button label for two seconds after copying',
      table: { defaultValue: { summary: 'Copied' } },
    },
    copiedAnnouncement: {
      control: 'text',
      description: 'Spoken once after copying (polite live region)',
      table: { defaultValue: { summary: 'Copied to the clipboard' } },
    },
    copied: { description: 'Emitted with the value after it was copied', action: 'copied' },
    copyFailed: { description: 'Emitted when the clipboard refused (the value is then selected)', action: 'copyFailed' },
  },
  args: {
    label: 'Invitation link',
    value: 'https://example.com/join/7f3a9c1e-2b4d-4e8f-9a6b-1c2d3e4f5a6b',
    layout: 'stacked',
    showIcon: true,
    copyLabel: 'Copy',
    copiedLabel: 'Copied',
    copiedAnnouncement: 'Copied to the clipboard',
  },
};

export default meta;
type Story = StoryObj<CopyFieldComponent>;

export const Default: Story = {
  play: async ({ canvasElement }) => {
    await expect(within(canvasElement).getByRole('button', { name: /copy/i })).toBeTruthy();
    await expect(within(canvasElement).getByRole('textbox', { name: 'Invitation link' })).toBeTruthy();
  },
};

/** On a 360 px phone the long link wraps; the button spans the column. */
export const OnAPhone: Story = {
  name: 'On a Phone (German)',
  args: {
    label: 'Einladungslink',
    copyLabel: 'Kopieren',
    copiedLabel: 'Kopiert',
    copiedAnnouncement: 'Link kopiert',
    helperText: 'Gilt 7 Tage.',
    showIcon: false,
  },
  render: (args) => ({
    props: args,
    template: `
      <div style="max-width: 312px">
        <lc-copy-field [label]="label" [value]="value" [helperText]="helperText" [showIcon]="showIcon"
                       [copyLabel]="copyLabel" [copiedLabel]="copiedLabel" [copiedAnnouncement]="copiedAnnouncement" />
      </div>`,
  }),
};

export const Inline: Story = {
  args: { layout: 'inline', label: 'Command', value: 'claude mcp add lifecorner https://example.com/mcp' },
};

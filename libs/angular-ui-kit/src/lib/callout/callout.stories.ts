import type { Meta, StoryObj } from '@storybook/angular';
import { CalloutComponent } from './callout.component';

const meta: Meta<CalloutComponent> = {
  title: 'Feedback/Callout',
  component: CalloutComponent,
  argTypes: {
    variant: { control: 'select', options: ['info', 'success', 'warning', 'error', 'neutral'] },
    dismissible: { control: 'boolean' },
    icon: {
      control: 'text',
      description: "3.3: icon name instead of the variant's default icon.",
    },
    iconAriaLabel: {
      control: 'text',
      description:
        '3.3: accessible name of the icon (e.g. „Hinweis“). Unset = decorative icon (`aria-hidden`); the title and text carry the tone. The kit sets no default text.',
    },
  },

  parameters: {
    docs: {
      description: {
        component: `
Callout component for contextual information banners.

**Key Features:**
- Semantic variants (info, success, warning, error, neutral)
- Auto-mapped variant icons; 3.3: \`icon\` overrides it, and it is decorative unless
  \`iconAriaLabel\` names it (no built-in English word)
- Optional title text
- Dismissible with close button (\`visible\` is two-way bindable to show it again)
- role="alert" for error / warning, role="status" otherwise
- Content projection for custom body content
`,
      },
    },
  },
};

export default meta;
type Story = StoryObj<CalloutComponent>;

export const Info: Story = {
  args: { variant: 'info', title: 'Hinweis' },
  render: (args) => ({
    props: args,
    template: `<lc-callout [variant]="variant" [title]="title" [dismissible]="dismissible">Das System wird am Sonntag gewartet.</lc-callout>`,
  }),
};

export const Success: Story = {
  args: { variant: 'success', title: 'Erfolg' },
  render: (args) => ({
    props: args,
    template: `<lc-callout [variant]="variant" [title]="title">Alle Änderungen wurden gespeichert.</lc-callout>`,
  }),
};

export const Warning: Story = {
  args: { variant: 'warning', title: 'Achtung' },
  render: (args) => ({
    props: args,
    template: `<lc-callout [variant]="variant" [title]="title">Ihr Speicherplatz ist fast voll.</lc-callout>`,
  }),
};

export const Error: Story = {
  args: { variant: 'error', title: 'Fehler' },
  render: (args) => ({
    props: args,
    template: `<lc-callout [variant]="variant" [title]="title">Verbindung zum Server konnte nicht hergestellt werden.</lc-callout>`,
  }),
};

export const Dismissible: Story = {
  args: { variant: 'info', title: 'Tipp', dismissible: true },
  render: (args) => ({
    props: args,
    template: `<lc-callout [variant]="variant" [title]="title" [dismissible]="dismissible">Diese Meldung kann geschlossen werden.</lc-callout>`,
  }),
};

export const NoTitle: Story = {
  args: { variant: 'neutral' },
  render: (args) => ({
    props: args,
    template: `<lc-callout [variant]="variant">Ein einfacher Hinweis ohne Titel.</lc-callout>`,
  }),
};

/** 3.3 (G-24): an own icon with a translated name. */
export const NamedIcon: Story = {
  name: 'Named icon (3.3)',
  render: () => ({
    template: `<lc-callout variant="neutral" icon="light-bulb" iconAriaLabel="Tipp" title="Gut zu wissen">Verträge werden aus Lastschriften erkannt.</lc-callout>`,
  }),
};


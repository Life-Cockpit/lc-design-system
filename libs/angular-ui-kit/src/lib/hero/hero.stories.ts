import type { Meta, StoryObj } from '@storybook/angular';
import { HeroComponent } from './hero.component';

const meta: Meta<HeroComponent> = {
  title: 'Layout/Hero',
  component: HeroComponent,
  parameters: {
    docs: {
      description: {
        component: `
The Hero component creates a prominent page header with a gradient background.
Use it at the top of pages to introduce content, highlight key information, or set visual context.

**Key Features:**
- 9 gradient color themes (primary, secondary, neutral, success, info, warning, accent-orange, accent-purple, accent-violet)
- 3 visual variants: default (dark gradient), slim (compact banner), light (soft pastel with dark text)
- 3 size variants (sm, md, lg) with mobile-first responsive padding and typography
- Content projection for body text and a footer slot for metadata / stats
- Configurable border radius
        `,
      },
    },
  },
  argTypes: {
    title: {
      control: 'text',
      description: 'Main headline text',
    },
    label: {
      control: 'text',
      description: 'Small uppercase label above the title',
    },
    color: {
      control: 'select',
      options: [
        'primary',
        'secondary',
        'neutral',
        'success',
        'info',
        'warning',
        'accent-orange',
        'accent-purple',
        'accent-violet',
      ],
      description: 'Gradient color theme',
      table: { defaultValue: { summary: 'primary' } },
    },
    size: {
      control: 'select',
      options: ['sm', 'md', 'lg'],
      description: 'Controls padding and font sizes',
      table: { defaultValue: { summary: 'md' } },
    },
    borderRadius: {
      control: 'select',
      options: ['none', 'sm', 'md', 'lg'],
      description: 'Corner rounding',
      table: { defaultValue: { summary: 'lg' } },
    },
    variant: {
      control: 'select',
      options: ['default', 'slim', 'light'],
      description: 'Visual variant: default (dark gradient), slim (compact), light (pastel)',
      table: { defaultValue: { summary: 'default' } },
    },
  },
};

export default meta;
type Story = StoryObj<HeroComponent>;

const footerStatStyle =
  'display: flex; flex-direction: column; gap: 4px;';
const statLabelStyle =
  'font-size: 10px; font-weight: 600; letter-spacing: 0.1em; text-transform: uppercase; opacity: 0.6;';
const statValueStyle = 'font-size: 14px; font-weight: 500;';

export const Default: Story = {
  args: {
    label: 'PROJEKT ALPHA',
    title: 'Ein Hero-Bereich für die wichtigste Aussage der Seite.',
    color: 'primary',
    size: 'md',
    borderRadius: 'lg',
  },
  render: (args) => ({
    props: args,
    template: `
      <lc-hero [label]="label" [title]="title" [color]="color" [size]="size" [borderRadius]="borderRadius">
        <p style="margin: 0;">
          Ein bis zwei Sätze erläuternder Text unter der Überschrift. Der Hero trägt
          die Kernaussage und eine Handvoll Kennzahlen im Footer-Slot.
        </p>
        <div hero-footer>
          <div style="${footerStatStyle}">
            <span style="${statLabelStyle}">STAND</span>
            <span style="${statValueStyle}">Q2 · Phase zwei</span>
          </div>
          <div style="${footerStatStyle}">
            <span style="${statLabelStyle}">TEAM</span>
            <span style="${statValueStyle}">4 Personen · 2 Standorte</span>
          </div>
          <div style="${footerStatStyle}">
            <span style="${statLabelStyle}">TESTABDECKUNG</span>
            <span style="${statValueStyle}">1.200 Tests grün</span>
          </div>
          <div style="${footerStatStyle}">
            <span style="${statLabelStyle}">STATUS</span>
            <span style="${statValueStyle}">Im Plan · Review offen</span>
          </div>
        </div>
      </lc-hero>`,
  }),
};

export const Minimal: Story = {
  args: {
    title: 'Willkommen',
    color: 'neutral',
    size: 'sm',
    borderRadius: 'lg',
  },
  render: (args) => ({
    props: args,
    template: `
      <lc-hero [title]="title" [color]="color" [size]="size" [borderRadius]="borderRadius">
        <p style="margin: 0;">Ein einfacher Hero ohne Label und Footer.</p>
      </lc-hero>`,
  }),
};

export const WithLabel: Story = {
  args: {
    label: 'DASHBOARD',
    title: 'Projektübersicht',
    color: 'secondary',
    size: 'md',
    borderRadius: 'lg',
  },
  render: (args) => ({
    props: args,
    template: `
      <lc-hero [label]="label" [title]="title" [color]="color" [size]="size" [borderRadius]="borderRadius">
        <p style="margin: 0;">Alle wichtigen Metriken und Fortschritte auf einen Blick.</p>
      </lc-hero>`,
  }),
};

export const Large: Story = {
  args: {
    label: 'RELEASE',
    title: 'Version 3.0 ist da.',
    color: 'accent-violet',
    size: 'lg',
    borderRadius: 'lg',
  },
  render: (args) => ({
    props: args,
    template: `
      <lc-hero [label]="label" [title]="title" [color]="color" [size]="size" [borderRadius]="borderRadius">
        <p style="margin: 0;">
          Highlights: Multi-Tenancy, neues Dashboard, verbesserte Performance und über 50 Bugfixes.
        </p>
        <div hero-footer>
          <div style="${footerStatStyle}">
            <span style="${statLabelStyle}">DATUM</span>
            <span style="${statValueStyle}">6. Mai 2026</span>
          </div>
          <div style="${footerStatStyle}">
            <span style="${statLabelStyle}">NEUE FEATURES</span>
            <span style="${statValueStyle}">12</span>
          </div>
          <div style="${footerStatStyle}">
            <span style="${statLabelStyle}">BREAKING CHANGES</span>
            <span style="${statValueStyle}">0</span>
          </div>
        </div>
      </lc-hero>`,
  }),
};

export const NoRadius: Story = {
  args: {
    title: 'Full-Width Hero',
    color: 'info',
    size: 'md',
    borderRadius: 'none',
  },
  render: (args) => ({
    props: args,
    template: `
      <lc-hero [title]="title" [color]="color" [size]="size" [borderRadius]="borderRadius">
        <p style="margin: 0;">Ohne Radius eignet sich der Hero für Edge-to-Edge Layouts.</p>
      </lc-hero>`,
  }),
};

export const AllColors: Story = {
  render: () => ({
    template: `
      <div style="display: flex; flex-direction: column; gap: 16px;">
        <lc-hero title="Primary" color="primary" size="sm" borderRadius="md">
          <p style="margin: 0;">Gradient preview</p>
        </lc-hero>
        <lc-hero title="Secondary" color="secondary" size="sm" borderRadius="md">
          <p style="margin: 0;">Gradient preview</p>
        </lc-hero>
        <lc-hero title="Neutral" color="neutral" size="sm" borderRadius="md">
          <p style="margin: 0;">Gradient preview</p>
        </lc-hero>
        <lc-hero title="Success" color="success" size="sm" borderRadius="md">
          <p style="margin: 0;">Gradient preview</p>
        </lc-hero>
        <lc-hero title="Info" color="info" size="sm" borderRadius="md">
          <p style="margin: 0;">Gradient preview</p>
        </lc-hero>
        <lc-hero title="Warning" color="warning" size="sm" borderRadius="md">
          <p style="margin: 0;">Gradient preview</p>
        </lc-hero>
        <lc-hero title="Accent Orange" color="accent-orange" size="sm" borderRadius="md">
          <p style="margin: 0;">Gradient preview</p>
        </lc-hero>
        <lc-hero title="Accent Purple" color="accent-purple" size="sm" borderRadius="md">
          <p style="margin: 0;">Gradient preview</p>
        </lc-hero>
        <lc-hero title="Accent Violet" color="accent-violet" size="sm" borderRadius="md">
          <p style="margin: 0;">Gradient preview</p>
        </lc-hero>
      </div>`,
  }),
};

export const Slim: Story = {
  parameters: {
    docs: { description: { story: 'Slim variant — a compact banner with reduced padding and smaller typography.' } },
  },
  args: {
    label: 'DASHBOARD',
    title: 'Quick Stats',
    color: 'primary',
    size: 'md',
    borderRadius: 'md',
    variant: 'slim',
  },
  render: (args) => ({
    props: args,
    template: `
      <lc-hero [label]="label" [title]="title" [color]="color" [size]="size" [borderRadius]="borderRadius" [variant]="variant">
        <p style="margin: 0;">A compact hero for secondary page sections or dashboards.</p>
      </lc-hero>`,
  }),
};

export const Light: Story = {
  parameters: {
    docs: { description: { story: 'Light variant — soft pastel gradient with dark text, ideal for less prominent headers.' } },
  },
  args: {
    label: 'GETTING STARTED',
    title: 'Welcome to your workspace',
    color: 'primary',
    size: 'md',
    borderRadius: 'lg',
    variant: 'light',
  },
  render: (args) => ({
    props: args,
    template: `
      <lc-hero [label]="label" [title]="title" [color]="color" [size]="size" [borderRadius]="borderRadius" [variant]="variant">
        <p style="margin: 0;">A softer, lighter hero that blends well with content-heavy pages.</p>
      </lc-hero>`,
  }),
};

export const LightSlim: Story = {
  parameters: {
    docs: { description: { story: 'Combining slim and light for a subtle, compact section header.' } },
  },
  args: {
    title: 'Note',
    color: 'info',
    size: 'sm',
    borderRadius: 'md',
    variant: 'light',
  },
  render: (args) => ({
    props: args,
    template: `
      <lc-hero [title]="title" [color]="color" [size]="size" [borderRadius]="borderRadius" variant="slim light">
        <p style="margin: 0;">A very compact, pastel-colored callout-style hero.</p>
      </lc-hero>`,
  }),
};

export const AllLightColors: Story = {
  parameters: {
    docs: { description: { story: 'All light variant color themes side by side.' } },
  },
  render: () => ({
    template: `
      <div style="display: flex; flex-direction: column; gap: 12px;">
        <lc-hero title="Primary Light" color="primary" size="sm" borderRadius="md" variant="light"></lc-hero>
        <lc-hero title="Secondary Light" color="secondary" size="sm" borderRadius="md" variant="light"></lc-hero>
        <lc-hero title="Neutral Light" color="neutral" size="sm" borderRadius="md" variant="light"></lc-hero>
        <lc-hero title="Success Light" color="success" size="sm" borderRadius="md" variant="light"></lc-hero>
        <lc-hero title="Info Light" color="info" size="sm" borderRadius="md" variant="light"></lc-hero>
        <lc-hero title="Warning Light" color="warning" size="sm" borderRadius="md" variant="light"></lc-hero>
        <lc-hero title="Accent Orange Light" color="accent-orange" size="sm" borderRadius="md" variant="light"></lc-hero>
        <lc-hero title="Accent Purple Light" color="accent-purple" size="sm" borderRadius="md" variant="light"></lc-hero>
        <lc-hero title="Accent Violet Light" color="accent-violet" size="sm" borderRadius="md" variant="light"></lc-hero>
      </div>`,
  }),
};

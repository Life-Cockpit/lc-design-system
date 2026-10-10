import type { Meta, StoryObj } from '@storybook/angular';
import { expect, within } from 'storybook/test';
import { ButtonLinkComponent } from './button-link.component';

const meta: Meta<ButtonLinkComponent> = {
  title: 'Components/Button Link',
  component: ButtonLinkComponent,
  parameters: {
    docs: {
      description: {
        component: `
\`a[lcButton]\` — the \`lc-button\` look on a native link. Use it for navigation that
should look like a button: calls to action, "read more" links, a language switch,
links to social profiles.

\`\`\`html
<a lcButton variant="primary" size="lg" href="/de/neuigkeiten">Schau uns beim Bauen zu</a>
<a lcButton variant="ghost" href="/en/security" hreflang="en" lang="en">English</a>
\`\`\`

**How it differs from \`lc-button\`**
- The host *is* the \`<a>\`: there is no wrapper and no inner \`<button>\`. Every native
  link attribute — \`href\`, \`hreflang\`, \`lang\`, \`rel\`, \`target\`, \`download\`,
  \`title\`, \`aria-*\` — passes through untouched (they are not inputs).
- No event listeners: navigation is the browser's. After SSR or prerendering the
  markup is a plain \`<a class="btn btn-primary btn-lg" href="…">\`, so it works with
  JavaScript disabled. \`routerLink\` may sit on the same anchor for in-app navigation.
- Same variants (\`primary | secondary | outline | ghost | link | danger | warning | info\`),
  sizes (\`xs | sm | md | lg\`) and modifiers (\`fullWidth\`, \`iconOnly\`, \`inline\`) as
  \`lc-button\`, from the same stylesheet. Icon slots: \`[slot='icon-before']\`,
  \`[slot='icon-after']\`.
- Labels wrap instead of overflowing the viewport (WCAG 1.4.10 reflow).
- A link cannot be disabled or busy — render plain text or an \`lc-button\` for those
  states. \`iconOnly\` links need an \`aria-label\`.

**Touch target:** \`size="lg"\` is 48.5 px high (2 × 12 px padding + 18 px × 1.25 line
height + 2 × 1 px border) and meets the 44 px target; \`md\` is 42 px, \`sm\` 35.5 px.
        `,
      },
    },
  },
  argTypes: {
    variant: {
      control: 'select',
      options: ['primary', 'secondary', 'outline', 'ghost', 'link', 'danger', 'warning', 'info'],
      description: 'Visual style variant (same as lc-button)',
      table: { defaultValue: { summary: 'primary' } },
    },
    size: {
      control: 'select',
      options: ['xs', 'sm', 'md', 'lg'],
      description: 'Size (same as lc-button); lg meets the 44 px touch target',
      table: { defaultValue: { summary: 'md' } },
    },
    fullWidth: { control: 'boolean', description: 'Stretches the link to the full container width' },
    iconOnly: { control: 'boolean', description: 'Square icon-only link (needs aria-label)' },
    inline: { control: 'boolean', description: 'Flows with surrounding text (pair with variant="link")' },
  },
};

export default meta;
type Story = StoryObj<ButtonLinkComponent>;

export const Primary: Story = {
  args: { variant: 'primary', size: 'lg' },
  render: (args) => ({
    props: args,
    template: `<a lcButton [variant]="variant" [size]="size" href="#neuigkeiten">Schau uns beim Bauen zu</a>`,
  }),
  play: async ({ canvasElement }) => {
    const link = within(canvasElement).getByRole('link', { name: /schau uns beim bauen zu/i });
    await expect(link.tagName).toBe('A');
    await expect(link.getAttribute('href')).toBe('#neuigkeiten');
    await expect(link.classList.contains('btn-lg')).toBe(true);
  },
};

export const Variants: Story = {
  render: () => ({
    template: `
      <div style="display: flex; flex-wrap: wrap; gap: 12px; align-items: center;">
        <a lcButton variant="primary" href="#primary">Primary</a>
        <a lcButton variant="secondary" href="#secondary">Secondary</a>
        <a lcButton variant="outline" href="#outline">Outline</a>
        <a lcButton variant="ghost" href="#ghost">Ghost</a>
        <a lcButton variant="link" href="#link">Link</a>
        <a lcButton variant="danger" href="#danger">Danger</a>
        <a lcButton variant="warning" href="#warning">Warning</a>
        <a lcButton variant="info" href="#info">Info</a>
      </div>
    `,
  }),
};

export const Sizes: Story = {
  render: () => ({
    template: `
      <div style="display: flex; flex-wrap: wrap; gap: 12px; align-items: center;">
        <a lcButton size="xs" href="#xs">Extra small</a>
        <a lcButton size="sm" href="#sm">Small</a>
        <a lcButton size="md" href="#md">Medium (42 px)</a>
        <a lcButton size="lg" href="#lg">Large (48.5 px, touch target)</a>
      </div>
    `,
  }),
};

/** Language switch: `hreflang` names the target language, `lang` the language of the label. */
export const LanguageSwitch: Story = {
  render: () => ({
    template: `
      <a lcButton variant="ghost" size="lg" href="#en-security" hreflang="en" lang="en"
         aria-label="Open this page in English">English</a>
    `,
  }),
  play: async ({ canvasElement }) => {
    const link = within(canvasElement).getByRole('link', { name: /open this page in english/i });
    await expect(link.getAttribute('hreflang')).toBe('en');
    await expect(link.getAttribute('lang')).toBe('en');
  },
};

/** Secondary links at the end of a page: outline, large, full width on phones. */
export const SecondaryLinks: Story = {
  render: () => ({
    template: `
      <div style="display: grid; gap: 12px; max-width: 360px;">
        <a lcButton variant="outline" size="lg" [fullWidth]="true" href="#sicherheit">Sind meine Daten sicher?</a>
        <a lcButton variant="outline" size="lg" [fullWidth]="true" href="#so-bauen-wir">Wer das baut, und wie?</a>
      </div>
    `,
  }),
};

export const WithIcons: Story = {
  render: () => ({
    template: `
      <div style="display: flex; flex-wrap: wrap; gap: 12px; align-items: center;">
        <a lcButton variant="primary" href="#weiter">
          Weiter
          <lc-icon slot="icon-after" name="arrow-right" size="sm" [decorative]="true" />
        </a>
        <a lcButton variant="outline" href="#profil" rel="me">
          <lc-icon slot="icon-before" name="external-link" size="sm" [decorative]="true" />
          LinkedIn
        </a>
        <a lcButton variant="ghost" [iconOnly]="true" href="#start" aria-label="Startseite">
          <lc-icon name="home" size="sm" [decorative]="true" />
        </a>
      </div>
    `,
  }),
};

/** `variant="link"` with `inline` reads as a link inside running text. */
export const InlineInText: Story = {
  render: () => ({
    template: `
      <p style="max-width: 420px; line-height: 1.6;">
        Alle Entscheidungen stehen auf der Seite
        <a lcButton variant="link" [inline]="true" href="#so-bauen-wir">So bauen wir</a>,
        jede mit Datum.
      </p>
    `,
  }),
};

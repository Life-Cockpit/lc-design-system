import type { Meta, StoryObj } from '@storybook/angular';
import { expect, within } from 'storybook/test';
import { FooterComponent } from './footer.component';

const meta: Meta<FooterComponent> = {
  title: 'Layout/Footer',
  component: FooterComponent,
  argTypes: {
    showBorder: { control: 'boolean' },
    compact: { control: 'boolean' },
    variant: { control: 'select', options: ['default', 'primary', 'dark', 'neutral'] },
    headingLevel: {
      control: 'select',
      options: [2, 3, 4, 5, 6],
      description: 'Heading level of the section titles — continue the page outline',
      table: { defaultValue: { summary: '4' } },
    },
    navAriaLabel: { description: 'Accessible name of the `<nav>` around the sections', table: { defaultValue: { summary: 'Footer' } } },
    externalLinkHint: {
      description: 'Visually hidden text read after the label of an `external` link',
      table: { defaultValue: { summary: '(opens in a new tab)' } },
    },
  },

  parameters: {
    docs: {
      description: {
        component: `
Footer component for application-wide bottom navigation.

**Key Features:**
- Multi-section navigation with link groups inside a labelled \`<nav>\` (\`navAriaLabel\`, default \`Footer\`)
- Section titles at a configurable heading level (\`headingLevel\`, \`2–6\`, default \`4\`) — the level changes the outline, not the look
- Copyright text display (plus a default slot for extra content in the bottom row)
- Compact single-row layout option
- Color variants (\`default\`, \`primary\`, \`dark\`, \`neutral\`)
- Optional top border

**Links** (\`FooterLink\`: \`{ label, href, external?, current?, rel? }\`)
- Every link is at least 44 px high (\`--size-min-touch-height\`).
- Ink is \`--color-text-secondary\`: 6.87:1 on the light page background and 7.56:1 on a
  white surface (12.17:1 / 10.45:1 in dark). Hover and the current page add an underline,
  so no state is marked by color alone.
- \`current: true\` → \`aria-current="page"\`, primary ink and an underline.
- \`external: true\` opens a new tab; screen readers hear \`externalLinkHint\` after the
  label (default "(opens in a new tab)") and \`rel\` defaults to \`noopener noreferrer\`.
- \`rel\` sets the attribute explicitly, e.g. \`me\` for your own social profiles (plain
  links named after the platform — the footer has no icon links).
`,
      },
    },
  },
};

export default meta;
type Story = StoryObj<FooterComponent>;

const sampleSections = [
  {
    title: 'Produkt',
    links: [
      { label: 'Features', href: '/features' },
      { label: 'Preise', href: '/pricing' },
      { label: 'Changelog', href: '/changelog' },
    ],
  },
  {
    title: 'Unternehmen',
    links: [
      { label: 'Über uns', href: '/about' },
      { label: 'Karriere', href: '/careers' },
      { label: 'Blog', href: '/blog' },
    ],
  },
  {
    title: 'Ressourcen',
    links: [
      { label: 'Dokumentation', href: '/docs' },
      { label: 'API Referenz', href: '/api', external: true },
      { label: 'GitHub', href: 'https://github.com', external: true },
    ],
  },
  {
    title: 'Rechtliches',
    links: [
      { label: 'Datenschutz', href: '/privacy' },
      { label: 'Impressum', href: '/imprint' },
      { label: 'AGB', href: '/terms' },
    ],
  },
];

export const Default: Story = {
  args: {
    showBorder: true,
    compact: false,
    variant: 'default',
  },
  render: (args) => ({
    props: {
      ...args,
      sections: sampleSections,
      copyright: '© 2026 Life-Cockpit. Alle Rechte vorbehalten.',
    },
    template: `<lc-footer [sections]="sections" [copyright]="copyright" [showBorder]="showBorder" [compact]="compact" [variant]="variant" />`,
  }),
};

export const Compact: Story = {
  args: {
    compact: true,
    variant: 'default',
  },
  render: (args) => ({
    props: {
      ...args,
      copyright: '© 2026 Life-Cockpit. Alle Rechte vorbehalten.',
    },
    template: `<lc-footer [copyright]="copyright" [compact]="compact" [variant]="variant" />`,
  }),
};

export const NoBorder: Story = {
  args: {
    showBorder: false,
    variant: 'default',
  },
  render: (args) => ({
    props: {
      ...args,
      sections: sampleSections.slice(0, 2),
      copyright: '© 2026 Life-Cockpit',
    },
    template: `<lc-footer [sections]="sections" [copyright]="copyright" [showBorder]="showBorder" [variant]="variant" />`,
  }),
};

export const CopyrightOnly: Story = {
  args: {
    compact: true,
    variant: 'default',
  },
  render: (args) => ({
    props: {
      ...args,
      copyright: '© 2026 Life-Cockpit GmbH',
    },
    template: `<lc-footer [copyright]="copyright" [compact]="compact" [variant]="variant" />`,
  }),
};

export const Primary: Story = {
  args: {
    variant: 'primary',
  },
  render: (args) => ({
    props: {
      ...args,
      sections: sampleSections,
      copyright: '© 2026 Life-Cockpit. Alle Rechte vorbehalten.',
    },
    template: `<lc-footer [sections]="sections" [copyright]="copyright" [variant]="variant" />`,
  }),
};

export const Dark: Story = {
  args: {
    variant: 'dark',
  },
  render: (args) => ({
    props: {
      ...args,
      sections: sampleSections,
      copyright: '© 2026 Life-Cockpit. Alle Rechte vorbehalten.',
    },
    template: `<lc-footer [sections]="sections" [copyright]="copyright" [variant]="variant" />`,
  }),
};

export const Neutral: Story = {
  args: {
    variant: 'neutral',
  },
  render: (args) => ({
    props: {
      ...args,
      sections: sampleSections.slice(0, 3),
      copyright: '© 2026 Life-Cockpit',
    },
    template: `<lc-footer [sections]="sections" [copyright]="copyright" [variant]="variant" />`,
  }),
};

export const PublicSite: Story = {
  name: 'Public Site (heading level, current page, rel)',
  parameters: {
    docs: {
      description: {
        story:
          'Footer of a public site whose pages use `h1` + `h2`: section titles as `h2`, a German nav label, the current page marked, `rel="me"` on the profile link and an external link with a translated hint.',
      },
    },
  },
  render: () => ({
    props: {
      sections: [
        {
          title: 'Seiten',
          links: [
            { label: 'Sicherheit', href: '#sicherheit', current: true },
            { label: 'So bauen wir', href: '#so-bauen-wir' },
            { label: 'Roadmap', href: '#roadmap' },
            { label: 'Neuigkeiten', href: '#neuigkeiten' },
          ],
        },
        {
          title: 'Rechtliches',
          links: [
            { label: 'Impressum', href: '#impressum' },
            { label: 'Datenschutz', href: '#datenschutz' },
          ],
        },
        {
          title: 'Mitverfolgen',
          links: [
            { label: 'LinkedIn', href: '#linkedin', rel: 'me' },
            { label: 'GitHub', href: '#github', external: true },
          ],
        },
      ],
    },
    template: `
      <lc-footer
        [sections]="sections"
        [headingLevel]="2"
        navAriaLabel="Fußzeile"
        externalLinkHint="(öffnet in neuem Tab)"
        copyright="© 2026 Produkt · Keine Cookies, kein Tracking"
      />`,
  }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const nav = canvas.getByRole('navigation', { name: 'Fußzeile' });
    await expect(within(nav).getAllByRole('heading', { level: 2 }).length).toBe(3);
    await expect(within(nav).getByRole('link', { name: 'Sicherheit' }).getAttribute('aria-current')).toBe('page');
    await expect(within(nav).getByRole('link', { name: 'GitHub (öffnet in neuem Tab)' })).toBeTruthy();
  },
};

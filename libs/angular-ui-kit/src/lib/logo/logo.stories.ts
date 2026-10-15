import type { Meta, StoryObj } from '@storybook/angular';
import { LogoComponent } from './logo.component';

/**
 * The LifeCorner logo: Edu, the emblem, and the LifeCorner lockup.
 * Renders the lockup or the emblem only, follows the app theme with its own
 * dark drawings, and switches to the small emblem at 32 px and below.
 */
const meta: Meta<LogoComponent> = {
  title: 'Components/Logo',
  component: LogoComponent,
  argTypes: {
    variant: {
      control: 'select',
      options: ['full', 'emblem'],
      description: 'The lockup (emblem and name) or the emblem only',
    },
    size: {
      control: 'select',
      options: ['xs', 'sm', 'md', 'lg', 'xl'],
      description: 'Height: xs 24 px, sm 32 px, md 48 px, lg 64 px, xl 96 px. The emblem uses its small drawing at xs and sm.',
    },
    alt: { description: 'Alt text. Defaults to "LifeCorner"; set your brand name when you pass your own sources.' },
    clickable: { description: 'Adds hover effect and cursor pointer (for use as a link)' },
    colorMode: {
      control: 'select',
      options: ['auto', 'light', 'dark'],
      description:
        'auto follows the app theme (light source on light, dark source on dark, including `:root.system`); light or dark pins one source. No CSS inversion.',
    },
    src: { control: 'text', description: 'Custom URL for the lockup; replaces the built-in LifeCorner lockup' },
    emblemSrc: { control: 'text', description: 'Custom URL for the emblem; replaces the built-in emblem at every size' },
    darkSrc: {
      control: 'text',
      description: 'Dark-theme URL for the lockup. Without it a custom `src` is shown on dark too.',
    },
    darkEmblemSrc: { control: 'text', description: 'Dark-theme URL for the emblem' },
  },

  parameters: {
    docs: {
      description: {
        component: `
The LifeCorner logo: **Edu**, the emblem (a head, two eyes, four arms ending in connection points), and the **LifeCorner lockup** (filled emblem, "Life" and "Corner" in Plus Jakarta Sans Bold, outlined to paths).

**Built-in assets** (served from \`LC_LOGO_BASE_PATH\`, default \`/assets\`):

| Variant | Light | Dark |
|---|---|---|
| \`full\` | \`lifecorner-logo.svg\` | \`lifecorner-logo-on-dark.svg\` |
| \`emblem\`, md to xl | \`lifecorner-emblem.svg\` | \`lifecorner-emblem-on-dark.svg\` |
| \`emblem\`, xs and sm (≤ 32 px) | \`lifecorner-emblem-small.svg\` | \`lifecorner-emblem-small-on-dark.svg\` |

\`lifecorner-emblem-mono.svg\` (one colour) ships for print and one-colour uses.

**Theme:** with \`colorMode="auto"\` both drawings are in the DOM and the root theme picks one, with the selectors of the theme stylesheets: dark under \`:root.dark\`, a root without a theme class, and \`:root.system\` while the OS is dark; light under \`:root.light\` and \`:root.system\` while the OS is light. No script, right on the first paint.

**Rules:** the logo is flat and fixed. Never animate, rotate, pose, recolour or distort it; scale it only proportionally. The lockup always uses the filled emblem. In running text the name is plain text.
`,
      },
    },
  },
};

export default meta;
type Story = StoryObj<LogoComponent>;

export const Full: Story = {
  name: 'Lockup',
  args: { variant: 'full', size: 'md' },
};

export const Emblem: Story = {
  name: 'Emblem Only',
  args: { variant: 'emblem', size: 'md' },
};

export const SmallEmblem: Story = {
  name: 'Small Emblem (≤ 32 px)',
  args: { variant: 'emblem', size: 'sm' },
  parameters: {
    docs: {
      description: {
        story: 'At `xs` and `sm` the emblem switches to its small drawing: heavier arms and filled connection points, so it stays crisp down to 16 px.',
      },
    },
  },
};

export const LightAndDark: Story = {
  name: 'Light and Dark',
  render: () => ({
    template: `
      <div style="display: grid; gap: 16px; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));">
        <div style="display: flex; flex-direction: column; gap: 20px; padding: 24px; background: #ffffff; border: 1px solid #e5e7eb; border-radius: 12px;">
          <lc-logo variant="full" size="md" colorMode="light"></lc-logo>
          <div style="display: flex; align-items: center; gap: 16px;">
            <lc-logo variant="emblem" size="lg" colorMode="light"></lc-logo>
            <lc-logo variant="emblem" size="sm" colorMode="light"></lc-logo>
            <lc-logo variant="emblem" size="xs" colorMode="light"></lc-logo>
          </div>
        </div>
        <div style="display: flex; flex-direction: column; gap: 20px; padding: 24px; background: #0a121b; border-radius: 12px;">
          <lc-logo variant="full" size="md" colorMode="dark"></lc-logo>
          <div style="display: flex; align-items: center; gap: 16px;">
            <lc-logo variant="emblem" size="lg" colorMode="dark"></lc-logo>
            <lc-logo variant="emblem" size="sm" colorMode="dark"></lc-logo>
            <lc-logo variant="emblem" size="xs" colorMode="dark"></lc-logo>
          </div>
        </div>
      </div>`,
  }),
  parameters: {
    docs: {
      description: {
        story: 'Each drawing pinned with `colorMode`. With the default `auto` the logo follows the app theme on its own.',
      },
    },
  },
};

export const Clickable: Story = {
  args: { variant: 'full', size: 'md', clickable: true },
};

export const Sizes: Story = {
  name: 'Size Comparison',
  render: () => ({
    template: `
      <div style="display: flex; flex-direction: column; gap: 20px;">
        <div style="display: flex; align-items: center; gap: 16px;">
          <span style="font-size: 11px; color: var(--color-text-secondary); width: 24px;">xs</span>
          <lc-logo variant="full" size="xs"></lc-logo>
        </div>
        <div style="display: flex; align-items: center; gap: 16px;">
          <span style="font-size: 11px; color: var(--color-text-secondary); width: 24px;">sm</span>
          <lc-logo variant="full" size="sm"></lc-logo>
        </div>
        <div style="display: flex; align-items: center; gap: 16px;">
          <span style="font-size: 11px; color: var(--color-text-secondary); width: 24px;">md</span>
          <lc-logo variant="full" size="md"></lc-logo>
        </div>
        <div style="display: flex; align-items: center; gap: 16px;">
          <span style="font-size: 11px; color: var(--color-text-secondary); width: 24px;">lg</span>
          <lc-logo variant="full" size="lg"></lc-logo>
        </div>
        <div style="display: flex; align-items: center; gap: 16px;">
          <span style="font-size: 11px; color: var(--color-text-secondary); width: 24px;">xl</span>
          <lc-logo variant="full" size="xl"></lc-logo>
        </div>
      </div>`,
  }),
};

export const EmblemSizes: Story = {
  name: 'Emblem Sizes',
  render: () => ({
    template: `
      <div style="display: flex; align-items: center; gap: 20px;">
        <lc-logo variant="emblem" size="xs"></lc-logo>
        <lc-logo variant="emblem" size="sm"></lc-logo>
        <lc-logo variant="emblem" size="md"></lc-logo>
        <lc-logo variant="emblem" size="lg"></lc-logo>
        <lc-logo variant="emblem" size="xl"></lc-logo>
      </div>`,
  }),
  parameters: {
    docs: {
      description: {
        story: 'xs and sm use the small drawing; md, lg and xl the standard one.',
      },
    },
  },
};

export const InHeader: Story = {
  name: 'In Header (Composition)',
  render: () => ({
    template: `
      <div style="display: flex; align-items: center; justify-content: space-between; padding: 12px 24px; border-bottom: 1px solid var(--color-border);">
        <div style="display: flex; align-items: center; gap: 12px;">
          <lc-logo variant="full" size="sm" [clickable]="true"></lc-logo>
          <span style="color: var(--color-border);">|</span>
          <span style="font-size: 13px; color: var(--color-text-secondary);">Design System</span>
        </div>
        <div style="display: flex; align-items: center; gap: 8px;">
          <span style="font-size: 13px;">Sarah Connor</span>
        </div>
      </div>`,
  }),
};

export const OnDarkBackground: Story = {
  name: 'On Dark Background',
  render: () => ({
    template: `
      <div style="display: flex; align-items: center; gap: 24px; padding: 24px; background: #0a121b; border-radius: 8px;">
        <lc-logo variant="full" size="md" colorMode="dark"></lc-logo>
        <lc-logo variant="emblem" size="md" colorMode="dark"></lc-logo>
      </div>`,
  }),
};

/**
 * Consuming apps can supply their own brand assets via `src`, `emblemSrc`,
 * `darkSrc` and `darkEmblemSrc` — no need to fork the component.
 *
 * A custom logo is never recoloured: without a dark partner it is shown as it
 * is on dark too.
 */
export const CustomBrand: Story = {
  name: 'Custom Brand Logo',
  args: {
    variant: 'full',
    size: 'md',
    src: 'https://upload.wikimedia.org/wikipedia/commons/a/a7/React-icon.svg',
    alt: 'Acme Inc.',
  },
  parameters: {
    docs: {
      description: {
        story: `
\`\`\`html
<lc-logo
  src="/assets/acme-logo.svg"
  emblemSrc="/assets/acme-emblem.svg"
  darkSrc="/assets/acme-logo-dark.svg"
  darkEmblemSrc="/assets/acme-emblem-dark.svg"
  alt="Acme Inc.">
</lc-logo>
\`\`\`

\`darkSrc\` / \`darkEmblemSrc\` are optional. When provided, the logo
swaps with the **app theme** (\`:root.dark\`, the dark-first default, or
\`:root.system\` while the OS is dark), pure CSS, no JavaScript needed.
\`colorMode="light|dark"\` pins one source.
`,
      },
    },
  },
};

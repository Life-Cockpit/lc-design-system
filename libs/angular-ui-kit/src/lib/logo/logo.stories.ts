import type { Meta, StoryObj } from '@storybook/angular';
import { LogoComponent } from './logo.component';

/**
 * The Life-Cockpit logo component renders the full wordmark or emblem-only variant.
 * Available in multiple sizes. Use `clickable` to make it a link (e.g. back to home).
 */
const meta: Meta<LogoComponent> = {
  title: 'Components/Logo',
  component: LogoComponent,
  argTypes: {
    variant: {
      control: 'select',
      options: ['full', 'emblem'],
      description: 'Full wordmark or emblem/icon only',
    },
    size: {
      control: 'select',
      options: ['xs', 'sm', 'md', 'lg', 'xl'],
      description: 'Logo dimensions',
    },
    alt: { description: 'Alt text for accessibility' },
    clickable: { description: 'Adds hover effect and cursor pointer (for use as a link)' },
    colorMode: {
      control: 'select',
      options: ['auto', 'light', 'dark'],
      description: 'Color adaptation — dark inverts the logo for dark backgrounds',
    },
  },

  parameters: {
    docs: {
      description: {
        component: `
Logo component for displaying the Life-Cockpit brand identity.

**Key Features:**
- Full logo and emblem-only variants
- Multiple size options (sm, md, lg)
- SVG-based for crisp rendering at any resolution
- Dark mode compatible
`,
      },
    },
  },
};

export default meta;
type Story = StoryObj<LogoComponent>;

export const Full: Story = {
  name: 'Full Wordmark',
  args: { variant: 'full', size: 'md' },
};

export const Emblem: Story = {
  name: 'Emblem Only',
  args: { variant: 'emblem', size: 'md' },
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
          <span style="font-size: 11px; color: #666; width: 24px;">xs</span>
          <lc-logo variant="full" size="xs"></lc-logo>
        </div>
        <div style="display: flex; align-items: center; gap: 16px;">
          <span style="font-size: 11px; color: #666; width: 24px;">sm</span>
          <lc-logo variant="full" size="sm"></lc-logo>
        </div>
        <div style="display: flex; align-items: center; gap: 16px;">
          <span style="font-size: 11px; color: #666; width: 24px;">md</span>
          <lc-logo variant="full" size="md"></lc-logo>
        </div>
        <div style="display: flex; align-items: center; gap: 16px;">
          <span style="font-size: 11px; color: #666; width: 24px;">lg</span>
          <lc-logo variant="full" size="lg"></lc-logo>
        </div>
        <div style="display: flex; align-items: center; gap: 16px;">
          <span style="font-size: 11px; color: #666; width: 24px;">xl</span>
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
};

export const InHeader: Story = {
  name: 'In Header (Composition)',
  render: () => ({
    template: `
      <div style="display: flex; align-items: center; justify-content: space-between; padding: 12px 24px; border-bottom: 1px solid #eee;">
        <div style="display: flex; align-items: center; gap: 12px;">
          <lc-logo variant="full" size="sm" [clickable]="true"></lc-logo>
          <span style="color: #ddd;">|</span>
          <span style="font-size: 13px; color: #666;">Design System</span>
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
      <div style="display: flex; align-items: center; gap: 24px; padding: 24px; background: #18181b; border-radius: 8px;">
        <lc-logo variant="full" size="md" colorMode="dark"></lc-logo>
        <lc-logo variant="emblem" size="md" colorMode="dark"></lc-logo>
      </div>`,
  }),
};

/**
 * Consuming apps can supply their own brand assets via `src`, `emblemSrc`,
 * `darkSrc` and `darkEmblemSrc` — no need to fork the component.
 *
 * When any custom source is provided the auto-invert filter is disabled so
 * the customer's brand colors stay intact.
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
swaps with the **app theme** (the \`:root.light\` opt-in vs. the dark-first
default / \`:root.dark\`), not with the OS \`prefers-color-scheme\` — pure
CSS, no JavaScript needed. \`colorMode="light|dark"\` pins one source.
`,
      },
    },
  },
};

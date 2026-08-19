import type { Meta, StoryObj } from '@storybook/angular';
import { DividerComponent } from './divider.component';

const meta: Meta<DividerComponent> = {
  title: 'Layout/Divider',
  component: DividerComponent,
  parameters: {
    docs: {
      description: {
        component: `
A simple divider for visually separating content sections.

**Key Features:**
- Horizontal and vertical orientations
- Solid, dashed, and dotted line styles
- Configurable spacing (none to xl)
- Optional inline label (e.g. "OR")
- Semantic \`role="separator"\`
        `,
      },
    },
  },
  argTypes: {
    orientation: { control: 'select', options: ['horizontal', 'vertical'] },
    variant: { control: 'select', options: ['solid', 'dashed', 'dotted'] },
    spacing: { control: 'select', options: ['none', 'xs', 'sm', 'md', 'lg', 'xl'] },
    label: { control: 'text' },
  },
};

export default meta;
type Story = StoryObj<DividerComponent>;

export const Default: Story = {
  render: () => ({
    template: `
      <p>Content above the divider.</p>
      <lc-divider></lc-divider>
      <p>Content below the divider.</p>`,
  }),
};

export const WithLabel: Story = {
  render: () => ({
    template: `
      <p>Sign in with your account</p>
      <lc-divider label="OR" spacing="lg"></lc-divider>
      <p>Continue with Google</p>`,
  }),
};

export const Variants: Story = {
  render: () => ({
    template: `
      <div style="display: flex; flex-direction: column; gap: 4px;">
        <span style="font-size: 12px; color: var(--color-text-tertiary);">Solid</span>
        <lc-divider variant="solid" spacing="sm"></lc-divider>
        <span style="font-size: 12px; color: var(--color-text-tertiary);">Dashed</span>
        <lc-divider variant="dashed" spacing="sm"></lc-divider>
        <span style="font-size: 12px; color: var(--color-text-tertiary);">Dotted</span>
        <lc-divider variant="dotted" spacing="sm"></lc-divider>
      </div>`,
  }),
};

export const Vertical: Story = {
  render: () => ({
    template: `
      <div style="display: flex; align-items: center; height: 40px;">
        <span>Home</span>
        <lc-divider orientation="vertical" spacing="md"></lc-divider>
        <span>About</span>
        <lc-divider orientation="vertical" spacing="md"></lc-divider>
        <span>Contact</span>
      </div>`,
  }),
};

export const Spacing: Story = {
  render: () => ({
    template: `
      <div>
        <p>None</p><lc-divider spacing="none"></lc-divider>
        <p>XS</p><lc-divider spacing="xs"></lc-divider>
        <p>SM</p><lc-divider spacing="sm"></lc-divider>
        <p>MD (default)</p><lc-divider spacing="md"></lc-divider>
        <p>LG</p><lc-divider spacing="lg"></lc-divider>
        <p>XL</p><lc-divider spacing="xl"></lc-divider>
        <p>End</p>
      </div>`,
  }),
};

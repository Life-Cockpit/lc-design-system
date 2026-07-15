import type { Meta, StoryObj } from '@storybook/angular';
import { ContainerComponent } from './container.component';

/**
 * Container constrains content width and centers it horizontally.
 * Provides consistent max-widths across breakpoints (sm, md, lg, xl, xxl, full)
 * with optional horizontal padding removal.
 */
const meta: Meta<ContainerComponent> = {
  title: 'Layout/Container',
  component: ContainerComponent,
  argTypes: {
    size: {
      control: 'select',
      options: ['sm', 'md', 'lg', 'xl', 'xxl', 'full'],
      description:
        'Maximum width — sm (640px), md (768px), lg (1024px), xl (1280px), xxl (1536px), full (100%)',
    },
    noPadding: { description: 'Removes horizontal padding' },
    paddingY: { description: 'Adds vertical padding' },
  },

  parameters: {
    docs: {
      description: {
        component: `
Container component for responsive max-width content layout.

**Key Features:**
- Max-width presets (sm, md, lg, xl, xxl, full)
- Optional horizontal padding removal
- Optional vertical padding
- Centered content alignment

**Choosing between \`xxl\` and \`full\`:** \`xxl\` caps content at the
\`--lc-content-max-width\` token (1536px) and keeps it centred — the right choice for
data-dense pages that \`xl\` squeezes but \`full\` stretches across ultrawide displays.
Reach for \`full\` only when content genuinely should bleed to the viewport edge.

An app shell that centres content outside of \`lc-container\` should reference the same
token rather than hard-coding a width, so both stay in lockstep:

\`\`\`scss
.app-content {
  max-width: var(--lc-content-max-width);
  margin-inline: auto;
}
\`\`\`
`,
      },
    },
  },
};

export default meta;
type Story = StoryObj<ContainerComponent>;

export const Default: Story = {
  args: { size: 'lg', noPadding: false },
  render: (args) => ({
    props: args,
    template: `<lc-container [size]="size" [noPadding]="noPadding">
      <div style="background: #f0f4ff; padding: 24px; border-radius: 8px; border: 1px dashed #4f8ef7;">Content inside a <strong>{{size}}</strong> container</div>
    </lc-container>`,
  }),
};

export const AllSizes: Story = {
  name: 'Size Comparison',
  render: () => ({
    template: `
      <div style="display: flex; flex-direction: column; gap: 12px; background: #fafafa; padding: 16px;">
        <lc-container size="sm">
          <div style="background: #e8f5e9; padding: 12px; border-radius: 6px; border: 1px dashed #4caf50; font-size: 13px;">sm — max-width: 640px</div>
        </lc-container>
        <lc-container size="md">
          <div style="background: #e3f2fd; padding: 12px; border-radius: 6px; border: 1px dashed #2196f3; font-size: 13px;">md — max-width: 768px</div>
        </lc-container>
        <lc-container size="lg">
          <div style="background: #fff3e0; padding: 12px; border-radius: 6px; border: 1px dashed #ff9800; font-size: 13px;">lg — max-width: 1024px (default)</div>
        </lc-container>
        <lc-container size="xl">
          <div style="background: #fce4ec; padding: 12px; border-radius: 6px; border: 1px dashed #e91e63; font-size: 13px;">xl — max-width: 1280px</div>
        </lc-container>
        <lc-container size="xxl">
          <div style="background: #e0f2f1; padding: 12px; border-radius: 6px; border: 1px dashed #009688; font-size: 13px;">xxl — max-width: 1536px (--lc-content-max-width)</div>
        </lc-container>
        <lc-container size="full">
          <div style="background: #f3e5f5; padding: 12px; border-radius: 6px; border: 1px dashed #9c27b0; font-size: 13px;">full — 100% width</div>
        </lc-container>
      </div>`,
  }),
};

export const NoPadding: Story = {
  name: 'No Padding',
  args: { size: 'lg', noPadding: true },
  render: (args) => ({
    props: args,
    template: `<lc-container [size]="size" [noPadding]="noPadding">
      <div style="background: #fff8e1; padding: 24px; border: 1px dashed #ffc107;">This container has no horizontal padding — content extends to the edges.</div>
    </lc-container>`,
  }),
};

export const PageLayout: Story = {
  name: 'Page Layout (Composition)',
  render: () => ({
    template: `
      <div style="background: #f5f5f5; padding: 24px 0;">
        <lc-container size="lg">
          <h2 style="margin: 0 0 8px; font-size: 20px; font-weight: 600;">Project Dashboard</h2>
          <p style="margin: 0 0 16px; color: #666; font-size: 14px;">Overview of your project metrics and recent activity.</p>
          <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px;">
            <div style="background: white; padding: 20px; border-radius: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.08);">
              <div style="font-size: 12px; color: #666;">Tasks</div>
              <div style="font-size: 24px; font-weight: 600; margin-top: 4px;">42</div>
            </div>
            <div style="background: white; padding: 20px; border-radius: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.08);">
              <div style="font-size: 12px; color: #666;">Completed</div>
              <div style="font-size: 24px; font-weight: 600; margin-top: 4px;">28</div>
            </div>
            <div style="background: white; padding: 20px; border-radius: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.08);">
              <div style="font-size: 12px; color: #666;">Team</div>
              <div style="font-size: 24px; font-weight: 600; margin-top: 4px;">7</div>
            </div>
          </div>
        </lc-container>
      </div>`,
  }),
};

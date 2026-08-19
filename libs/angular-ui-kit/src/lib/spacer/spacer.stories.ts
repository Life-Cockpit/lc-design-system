import type { Meta, StoryObj } from '@storybook/angular';
import { SpacerComponent } from './spacer.component';

/**
 * Spacer is a utility component that creates space between elements.
 * Use `auto` to push elements apart (flex grow), or fixed sizes for
 * consistent spacing without relying on margins.
 */
const meta: Meta<SpacerComponent> = {
  title: 'Layout/Spacer',
  component: SpacerComponent,
  argTypes: {
    size: {
      control: 'select',
      options: ['auto', 'xs', 'sm', 'md', 'lg', 'xl'],
      description: 'auto = flex-grow (fills available space), fixed sizes add specific gaps',
    },
  },

  parameters: {
    docs: {
      description: {
        component: `
Spacer component for adding vertical or flexible spacing.

**Key Features:**
- Fixed, density-aware spacing sizes (xs, sm, md, lg, xl)
- Auto (flex-grow) mode for filling available space
- Host class binding for layout integration
`,
      },
    },
  },
};

export default meta;
type Story = StoryObj<SpacerComponent>;

export const Auto: Story = {
  name: 'Auto (Push Apart)',
  render: () => ({
    template: `
      <div style="display: flex; flex-direction: column; border: 1px dashed #ccc; border-radius: 6px; height: 200px;">
        <div style="padding: 12px; background: #e0f2fe;">Header area</div>
        <lc-spacer size="auto"></lc-spacer>
        <div style="padding: 12px; background: #e0f2fe;">Footer pushed to bottom</div>
      </div>`,
  }),
};

export const FixedSizes: Story = {
  name: 'Fixed Size Comparison',
  render: () => ({
    template: `
      <div style="display: flex; flex-direction: column; gap: 0; max-width: 300px;">
        <div style="padding: 8px; background: #f0f0f0; border-radius: 4px;">Content</div>
        <div style="position: relative;"><lc-spacer size="xs"></lc-spacer><span style="position: absolute; right: 0; top: 0; font-size: 10px; color: #999;">xs</span></div>
        <div style="padding: 8px; background: #f0f0f0; border-radius: 4px;">Content</div>
        <div style="position: relative;"><lc-spacer size="sm"></lc-spacer><span style="position: absolute; right: 0; top: 0; font-size: 10px; color: #999;">sm</span></div>
        <div style="padding: 8px; background: #f0f0f0; border-radius: 4px;">Content</div>
        <div style="position: relative;"><lc-spacer size="md"></lc-spacer><span style="position: absolute; right: 0; top: 0; font-size: 10px; color: #999;">md</span></div>
        <div style="padding: 8px; background: #f0f0f0; border-radius: 4px;">Content</div>
        <div style="position: relative;"><lc-spacer size="lg"></lc-spacer><span style="position: absolute; right: 0; top: 0; font-size: 10px; color: #999;">lg</span></div>
        <div style="padding: 8px; background: #f0f0f0; border-radius: 4px;">Content</div>
        <div style="position: relative;"><lc-spacer size="xl"></lc-spacer><span style="position: absolute; right: 0; top: 0; font-size: 10px; color: #999;">xl</span></div>
        <div style="padding: 8px; background: #f0f0f0; border-radius: 4px;">Content</div>
      </div>`,
  }),
};

export const HorizontalAuto: Story = {
  name: 'Horizontal Auto (Push Apart)',
  render: () => ({
    template: `
      <div style="display: flex; align-items: center; border: 1px dashed #ccc; border-radius: 6px; padding: 12px;">
        <span style="font-weight: 600;">Logo</span>
        <lc-spacer size="auto"></lc-spacer>
        <span style="font-size: 13px; color: #666;">User Menu</span>
      </div>`,
  }),
};

export const CardLayout: Story = {
  name: 'In Card Layout (Composition)',
  render: () => ({
    template: `
      <div style="display: flex; flex-direction: column; border: 1px solid #eee; border-radius: 8px; padding: 20px; height: 220px; max-width: 300px;">
        <h4 style="margin: 0; font-weight: 600;">Pro Plan</h4>
        <p style="margin: 8px 0 0; font-size: 13px; color: #666;">Unlimited projects and team members.</p>
        <lc-spacer size="auto"></lc-spacer>
        <div style="font-size: 24px; font-weight: 700;">$29<span style="font-size: 14px; font-weight: 400; color: #666;">/mo</span></div>
        <lc-spacer size="sm"></lc-spacer>
        <button style="padding: 8px 16px; background: #4f8ef7; color: white; border: none; border-radius: 6px; cursor: pointer;">Upgrade</button>
      </div>`,
  }),
};

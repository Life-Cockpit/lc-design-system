import type { Meta, StoryObj } from '@storybook/angular';
import { SkeletonComponent } from './skeleton.component';

/**
 * Skeleton loaders provide a visual placeholder while content is loading.
 * They improve perceived performance by showing the expected layout shape
 * before data arrives. Available in line, circle, and rectangle variants.
 */
const meta: Meta<SkeletonComponent> = {
  title: 'Feedback/Skeleton',
  component: SkeletonComponent,
  argTypes: {
    variant: {
      control: 'select',
      options: ['line', 'circle', 'rect'],
      description: 'Shape of the skeleton — line for text, circle for avatars, rect for images/cards',
    },
    width: { description: 'Custom width (CSS value, e.g. "200px" or "60%")' },
    height: { description: 'Custom height (CSS value)' },
    borderRadius: { description: 'Custom border radius for the rect variant' },
  },

  parameters: {
    docs: {
      description: {
        component: `
Skeleton loader component for placeholder loading states.

**Key Features:**
- Variant shapes (text, rect, circle)
- Shimmer animation effect; a static fill under \`prefers-reduced-motion: reduce\` (since 3.3)
- Custom width, height, and border radius
- Composable for building complex loading layouts
- Dark mode compatible

**Colours:** the fill is \`--color-skeleton\` with the shimmer band \`--color-skeleton-highlight\`
(both visible on the white light page and on cards). Override per use with the hooks
\`--lc-skeleton-bg\` and \`--lc-skeleton-highlight\` on the element or an ancestor.
`,
      },
    },
  },
};

export default meta;
type Story = StoryObj<SkeletonComponent>;

export const Line: Story = {
  name: 'Text Line',
  args: { variant: 'line', width: '100%', height: '16px' },
};

export const Circle: Story = {
  name: 'Circle (Avatar)',
  args: { variant: 'circle', width: '48px', height: '48px' },
};

export const Rectangle: Story = {
  name: 'Rectangle (Image)',
  args: { variant: 'rect', width: '200px', height: '120px', borderRadius: '8px' },
};

export const TextBlock: Story = {
  name: 'Text Block',
  render: () => ({
    template: `
      <div style="display: flex; flex-direction: column; gap: 8px; max-width: 400px;">
        <lc-skeleton variant="line" width="70%"></lc-skeleton>
        <lc-skeleton variant="line" width="100%"></lc-skeleton>
        <lc-skeleton variant="line" width="100%"></lc-skeleton>
        <lc-skeleton variant="line" width="45%"></lc-skeleton>
      </div>`,
  }),
};

export const UserCard: Story = {
  name: 'User Card Loading',
  render: () => ({
    template: `
      <div style="display: flex; gap: 12px; align-items: flex-start; padding: 16px; border: 1px solid #eee; border-radius: 8px; max-width: 360px;">
        <lc-skeleton variant="circle" width="48px" height="48px"></lc-skeleton>
        <div style="flex: 1; display: flex; flex-direction: column; gap: 8px;">
          <lc-skeleton variant="line" width="40%"></lc-skeleton>
          <lc-skeleton variant="line" width="65%"></lc-skeleton>
          <lc-skeleton variant="line" width="50%"></lc-skeleton>
        </div>
      </div>`,
  }),
};

export const ArticleCard: Story = {
  name: 'Article Card Loading',
  render: () => ({
    template: `
      <div style="border: 1px solid #eee; border-radius: 12px; overflow: hidden; max-width: 320px;">
        <lc-skeleton variant="rect" width="100%" height="180px"></lc-skeleton>
        <div style="padding: 16px; display: flex; flex-direction: column; gap: 10px;">
          <lc-skeleton variant="line" width="80%"></lc-skeleton>
          <lc-skeleton variant="line" width="100%"></lc-skeleton>
          <lc-skeleton variant="line" width="60%"></lc-skeleton>
          <div style="display: flex; gap: 8px; margin-top: 8px; align-items: center;">
            <lc-skeleton variant="circle" width="24px" height="24px"></lc-skeleton>
            <lc-skeleton variant="line" width="100px"></lc-skeleton>
          </div>
        </div>
      </div>`,
  }),
};

export const TableLoading: Story = {
  name: 'Table Rows Loading',
  render: () => ({
    template: `
      <div style="max-width: 500px;">
        <div style="display: flex; gap: 16px; padding: 12px 0; border-bottom: 1px solid #eee;">
          <lc-skeleton variant="line" width="30%"></lc-skeleton>
          <lc-skeleton variant="line" width="20%"></lc-skeleton>
          <lc-skeleton variant="line" width="25%"></lc-skeleton>
          <lc-skeleton variant="line" width="15%"></lc-skeleton>
        </div>
        <div style="display: flex; gap: 16px; padding: 12px 0; border-bottom: 1px solid #eee;">
          <lc-skeleton variant="line" width="30%"></lc-skeleton>
          <lc-skeleton variant="line" width="20%"></lc-skeleton>
          <lc-skeleton variant="line" width="25%"></lc-skeleton>
          <lc-skeleton variant="line" width="15%"></lc-skeleton>
        </div>
        <div style="display: flex; gap: 16px; padding: 12px 0; border-bottom: 1px solid #eee;">
          <lc-skeleton variant="line" width="30%"></lc-skeleton>
          <lc-skeleton variant="line" width="20%"></lc-skeleton>
          <lc-skeleton variant="line" width="25%"></lc-skeleton>
          <lc-skeleton variant="line" width="15%"></lc-skeleton>
        </div>
      </div>`,
  }),
};

export const DashboardGrid: Story = {
  name: 'Dashboard Loading (Composition)',
  render: () => ({
    template: `
      <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; max-width: 700px;">
        <div style="border: 1px solid #eee; border-radius: 8px; padding: 16px;">
          <lc-skeleton variant="line" width="50%"></lc-skeleton>
          <div style="margin-top: 12px;"><lc-skeleton variant="line" width="60%" height="28px"></lc-skeleton></div>
          <div style="margin-top: 8px;"><lc-skeleton variant="line" width="40%"></lc-skeleton></div>
        </div>
        <div style="border: 1px solid #eee; border-radius: 8px; padding: 16px;">
          <lc-skeleton variant="line" width="50%"></lc-skeleton>
          <div style="margin-top: 12px;"><lc-skeleton variant="line" width="60%" height="28px"></lc-skeleton></div>
          <div style="margin-top: 8px;"><lc-skeleton variant="line" width="40%"></lc-skeleton></div>
        </div>
        <div style="border: 1px solid #eee; border-radius: 8px; padding: 16px;">
          <lc-skeleton variant="line" width="50%"></lc-skeleton>
          <div style="margin-top: 12px;"><lc-skeleton variant="line" width="60%" height="28px"></lc-skeleton></div>
          <div style="margin-top: 8px;"><lc-skeleton variant="line" width="40%"></lc-skeleton></div>
        </div>
      </div>`,
  }),
};

import type { Meta, StoryObj } from '@storybook/angular';
import { SplitPaneComponent } from './split-pane.component';

/**
 * Resizable two-pane layout container. The start pane has a fixed,
 * user-adjustable width (drag the separator, double-click to reset,
 * arrow keys when focused); the end pane fills the remaining space.
 */
const meta: Meta<SplitPaneComponent> = {
  title: 'Layout/SplitPane',
  component: SplitPaneComponent,
  argTypes: {
    initialSize: { description: 'Initial start-pane width in px (restored on double-click)' },
    minSize: { description: 'Minimum start-pane width in px' },
    maxSize: {
      description: "Maximum start-pane width: px number or percentage string like '55%'",
    },
    step: { description: 'Keyboard resize step in px (←/→ on the focused separator)' },
    storageKey: { description: 'Persists the width to localStorage under this key' },
    stackBelow: {
      description: 'Viewport width in px below which panes stack and the resizer disables',
    },
  },
  parameters: {
    docs: {
      description: {
        component: `
Resizable two-pane layout container.

**Key Features:**
- Drag the separator with mouse / touch (pointer capture), bounded by \`minSize\` / \`maxSize\`
- Double-click the separator to restore \`initialSize\`
- Keyboard accessible: focusable separator with \`role="separator"\`, ←/→ resize, Home/End jump to the bounds
- Optional persistence via \`storageKey\`
- Stacks vertically below the \`stackBelow\` viewport breakpoint
`,
      },
    },
  },
};

export default meta;
type Story = StoryObj<SplitPaneComponent>;

const paneStyle =
  'height: 100%; padding: 16px; box-sizing: border-box; font-size: 14px;';

export const Default: Story = {
  args: { initialSize: 280, minSize: 180, maxSize: '60%' },
  render: (args) => ({
    props: args,
    template: `
      <div style="height: 320px; border: 1px solid #ddd; border-radius: 8px; overflow: hidden;">
        <lc-split-pane [initialSize]="initialSize" [minSize]="minSize" [maxSize]="maxSize">
          <div slot="start" style="${paneStyle} background: #fafafa;">
            <strong>Start pane</strong>
            <p style="color:#666;">Fixed, adjustable width. Drag the separator, double-click it to reset, or focus it and use the arrow keys.</p>
          </div>
          <div slot="end" style="${paneStyle}">
            <strong>End pane</strong>
            <p style="color:#666;">Fills the remaining space.</p>
          </div>
        </lc-split-pane>
      </div>`,
  }),
};

export const Persistent: Story = {
  name: 'Persistent Width',
  render: () => ({
    template: `
      <div style="height: 260px; border: 1px solid #ddd; border-radius: 8px; overflow: hidden;">
        <lc-split-pane [initialSize]="240" [minSize]="160" [maxSize]="'50%'" storageKey="storybook-demo">
          <div slot="start" style="${paneStyle} background: #fafafa;">
            Resize me, then reload the page — the width is restored from localStorage.
          </div>
          <div slot="end" style="${paneStyle}">Content area</div>
        </lc-split-pane>
      </div>`,
  }),
};

export const StackedBreakpoint: Story = {
  name: 'Stacked Below Breakpoint',
  render: () => ({
    template: `
      <p style="font-size: 13px; color: #666;">
        Narrow the viewport below 720px: the panes stack vertically and the
        resizer disappears.
      </p>
      <div style="height: 320px; border: 1px solid #ddd; border-radius: 8px; overflow: hidden;">
        <lc-split-pane [initialSize]="260" [minSize]="180" [stackBelow]="720">
          <div slot="start" style="${paneStyle} background: #fafafa;">Start pane</div>
          <div slot="end" style="${paneStyle}">End pane</div>
        </lc-split-pane>
      </div>`,
  }),
};

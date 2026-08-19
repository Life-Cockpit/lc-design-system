import type { Meta, StoryObj } from '@storybook/angular';
import { PopoverComponent } from './popover.component';

const meta: Meta<PopoverComponent> = {
  title: 'Feedback/Popover',
  component: PopoverComponent,
  parameters: {
    docs: {
      description: {
        component: `
A floating panel for rich content triggered by click or hover.

**Key Features:**
- 4 positions (top, bottom, left, right)
- Click or hover trigger
- Optional arrow indicator
- Closes on click outside or Escape key
- Content projection for trigger and body
        `,
      },
    },
  },
  argTypes: {
    position: { control: 'select', options: ['top', 'bottom', 'left', 'right'] },
    trigger: { control: 'select', options: ['click', 'hover'] },
    showArrow: { control: 'boolean' },
  },
};

export default meta;
type Story = StoryObj<PopoverComponent>;

const panelStyle =
  'padding: 8px 0; display: flex; flex-direction: column;';
const itemStyle =
  'padding: 6px 16px; font-size: 14px; cursor: pointer; color: var(--color-text-primary);';

export const Default: Story = {
  args: { position: 'bottom', trigger: 'click', showArrow: true },
  render: (args) => ({
    props: args,
    template: `
      <div style="padding: 100px; display: flex; justify-content: center;">
        <lc-popover [position]="position" [trigger]="trigger" [showArrow]="showArrow">
          <button popover-trigger style="padding: 8px 16px; border: 1px solid #d1d5db; border-radius: 6px; background: white; cursor: pointer;">
            Open Popover
          </button>
          <div popover-content>
            <div style="${panelStyle}">
              <div style="${itemStyle}">Edit</div>
              <div style="${itemStyle}">Duplicate</div>
              <div style="${itemStyle}">Archive</div>
              <div style="${itemStyle}; color: #9d0e0e;">Delete</div>
            </div>
          </div>
        </lc-popover>
      </div>`,
  }),
};

export const HoverTrigger: Story = {
  args: { position: 'bottom', trigger: 'hover', showArrow: true },
  render: (args) => ({
    props: args,
    template: `
      <div style="padding: 100px; display: flex; justify-content: center;">
        <lc-popover [position]="position" [trigger]="trigger" [showArrow]="showArrow">
          <span popover-trigger style="text-decoration: underline; cursor: help; color: #208497;">
            Hover me for details
          </span>
          <div popover-content>
            <p style="margin: 0; font-size: 14px; color: var(--color-text-primary);">
              This popover appears on hover and disappears when you move away.
            </p>
          </div>
        </lc-popover>
      </div>`,
  }),
};

export const Positions: Story = {
  render: () => ({
    template: `
      <div style="padding: 120px; display: flex; gap: 80px; justify-content: center; flex-wrap: wrap;">
        <lc-popover position="top">
          <button popover-trigger style="padding: 8px 16px; border: 1px solid #d1d5db; border-radius: 6px; background: white; cursor: pointer;">Top</button>
          <div popover-content><p style="margin: 0; font-size: 14px;">Top popover</p></div>
        </lc-popover>
        <lc-popover position="bottom">
          <button popover-trigger style="padding: 8px 16px; border: 1px solid #d1d5db; border-radius: 6px; background: white; cursor: pointer;">Bottom</button>
          <div popover-content><p style="margin: 0; font-size: 14px;">Bottom popover</p></div>
        </lc-popover>
        <lc-popover position="left">
          <button popover-trigger style="padding: 8px 16px; border: 1px solid #d1d5db; border-radius: 6px; background: white; cursor: pointer;">Left</button>
          <div popover-content><p style="margin: 0; font-size: 14px;">Left popover</p></div>
        </lc-popover>
        <lc-popover position="right">
          <button popover-trigger style="padding: 8px 16px; border: 1px solid #d1d5db; border-radius: 6px; background: white; cursor: pointer;">Right</button>
          <div popover-content><p style="margin: 0; font-size: 14px;">Right popover</p></div>
        </lc-popover>
      </div>`,
  }),
};

export const NoArrow: Story = {
  args: { position: 'bottom', trigger: 'click', showArrow: false },
  render: (args) => ({
    props: args,
    template: `
      <div style="padding: 100px; display: flex; justify-content: center;">
        <lc-popover [position]="position" [showArrow]="showArrow">
          <button popover-trigger style="padding: 8px 16px; border: 1px solid #d1d5db; border-radius: 6px; background: white; cursor: pointer;">
            No Arrow
          </button>
          <div popover-content>
            <p style="margin: 0; font-size: 14px; color: var(--color-text-primary);">
              A popover without the arrow indicator.
            </p>
          </div>
        </lc-popover>
      </div>`,
  }),
};

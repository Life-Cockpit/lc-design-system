import type { Meta, StoryObj } from '@storybook/angular';
import { fn } from 'storybook/test';
import { MenuComponent } from './menu.component';

/**
 * Menus display a list of actions or options in a floating panel.
 * Triggered by a button or icon, they appear in configurable positions.
 * Items can have icons, dividers, danger variants, and disabled states.
 */
const meta: Meta<MenuComponent> = {
  title: 'Navigation/Menu',
  component: MenuComponent,
  args: {
    itemClick: fn(),
    closed: fn(),
  },
  argTypes: {
    itemClick: { action: 'itemClick', description: 'Emitted with the MenuItem when an item is clicked' },
    closed: { action: 'closed', description: 'Emitted when the menu is closed' },
    isOpen: { description: 'Whether the menu is currently visible' },
    position: {
      control: 'select',
      options: ['bottom-left', 'bottom-right', 'top-left', 'top-right'],
      description: 'Anchor position relative to the trigger element',
    },
    minWidth: { description: 'Minimum width of the menu panel (CSS value)' },
    size: {
      control: 'select',
      options: ['sm', 'md', 'lg'],
      description: 'Size of menu items — sm is compact, md is default, lg is spacious',
    },
  },

  parameters: {
    docs: {
      description: {
        component: `
Menu Component - Dropdown menu for navigation and actions

**Key Features:**
- Customizable menu items with icons
- Support for links and buttons
- Dividers between menu sections
- Optional subtitle/metadata for items
- Danger variant for destructive actions
- Click outside to close (top-most overlay only)
- Keyboard navigation: focus moves into the menu on open, Arrow keys / Home / End move between items, Enter / Space activate, Escape closes and returns focus to the trigger
- ARIA menu semantics (\`aria-haspopup\` / \`aria-expanded\` / \`aria-controls\` on the trigger, \`role="menu"\` / \`role="menuitem"\`)
- OnPush change detection for performance
`,
      },
    },
  },
};

export default meta;
type Story = StoryObj<MenuComponent>;

export const Default: Story = {
  args: {
    isOpen: true,
    position: 'bottom-left',
    items: [
      { id: 'profile', label: 'Profile', icon: 'user' },
      { id: 'settings', label: 'Settings', icon: 'cog-6-tooth' },
      { id: 'help', label: 'Help & Support', icon: 'help-circle', dividerAfter: true },
      { id: 'logout', label: 'Sign Out', icon: 'arrow-right-on-rectangle', variant: 'danger' },
    ],
  },
  render: (args) => ({
    props: args,
    template: `
      <div style="position: relative; display: inline-block; padding: 20px; min-height: 280px;">
        <lc-menu [items]="items" [isOpen]="isOpen" [position]="position">
          <button trigger style="padding: 8px 16px; border-radius: 6px; border: 1px solid #ddd; background: white; cursor: pointer;">Account ▾</button>
        </lc-menu>
      </div>`,
  }),
};

export const WithDividers: Story = {
  name: 'With Dividers & Danger',
  args: {
    isOpen: true,
    position: 'bottom-left',
    items: [
      { id: 'edit', label: 'Edit', icon: 'pencil' },
      { id: 'duplicate', label: 'Duplicate', icon: 'document-duplicate' },
      { id: 'move', label: 'Move to…', icon: 'folder', dividerAfter: true },
      { id: 'archive', label: 'Archive', icon: 'archive-box' },
      { id: 'delete', label: 'Delete', icon: 'trash', variant: 'danger' },
    ],
  },
  render: (args) => ({
    props: args,
    template: `
      <div style="position: relative; display: inline-block; padding: 20px; min-height: 300px;">
        <lc-menu [items]="items" [isOpen]="isOpen" [position]="position">
          <button trigger style="padding: 8px 16px; border-radius: 6px; border: 1px solid #ddd; background: white; cursor: pointer;">Actions ▾</button>
        </lc-menu>
      </div>`,
  }),
};

export const WithDisabled: Story = {
  name: 'With Disabled Items',
  args: {
    isOpen: true,
    position: 'bottom-left',
    items: [
      { id: 'view', label: 'View Details', icon: 'eye' },
      { id: 'share', label: 'Share', icon: 'share' },
      { id: 'export', label: 'Export (Pro)', icon: 'arrow-down-tray', disabled: true },
      { id: 'api', label: 'API Access (Pro)', icon: 'code', disabled: true },
    ],
  },
  render: (args) => ({
    props: args,
    template: `
      <div style="position: relative; display: inline-block; padding: 20px; min-height: 260px;">
        <lc-menu [items]="items" [isOpen]="isOpen" [position]="position">
          <button trigger style="padding: 8px 16px; border-radius: 6px; border: 1px solid #ddd; background: white; cursor: pointer;">More ▾</button>
        </lc-menu>
      </div>`,
  }),
};

export const FileMenu: Story = {
  name: 'File Context Menu',
  args: {
    isOpen: true,
    position: 'bottom-left',
    items: [
      { id: 'open', label: 'Open', icon: 'folder-open' },
      { id: 'rename', label: 'Rename', icon: 'pencil' },
      { id: 'download', label: 'Download', icon: 'arrow-down-tray', dividerAfter: true },
      { id: 'move', label: 'Move to Trash', icon: 'trash', variant: 'danger' },
    ],
  },
  render: (args) => ({
    props: args,
    template: `
      <div style="position: relative; display: inline-block; padding: 20px; min-height: 260px;">
        <lc-menu [items]="items" [isOpen]="isOpen" [position]="position">
          <button trigger style="padding: 6px 10px; border-radius: 4px; border: 1px solid #ddd; background: white; cursor: pointer; font-size: 18px;">⋮</button>
        </lc-menu>
      </div>`,
  }),
};

export const CompactSize: Story = {
  name: 'Compact (sm)',
  args: {
    isOpen: true,
    position: 'bottom-left',
    size: 'sm',
    minWidth: '180px',
    items: [
      { id: 'cut', label: 'Cut', icon: 'scissors' },
      { id: 'copy', label: 'Copy', icon: 'document-duplicate' },
      { id: 'paste', label: 'Paste', icon: 'clipboard-document', dividerAfter: true },
      { id: 'delete', label: 'Delete', icon: 'trash', variant: 'danger' },
    ],
  },
  render: (args) => ({
    props: args,
    template: `
      <div style="position: relative; display: inline-block; padding: 20px; min-height: 220px;">
        <lc-menu [items]="items" [isOpen]="isOpen" [position]="position" [size]="size" [minWidth]="minWidth">
          <button trigger style="padding: 4px 8px; border-radius: 4px; border: 1px solid #ddd; background: white; cursor: pointer; font-size: 14px;">Edit ▾</button>
        </lc-menu>
      </div>`,
  }),
};

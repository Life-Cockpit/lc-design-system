import type { Meta, StoryObj } from '@storybook/angular';
import { fn, expect, userEvent, within } from 'storybook/test';
import { SidenavComponent } from './sidenav.component';
import { HeaderComponent } from '../header/header.component';

/**
 * Sidenav provides a vertical navigation panel for application-level routing.
 * Supports docked (always visible) and drawer (overlay) modes with left/right
 * positioning. Automatically switches to drawer on narrow viewports.
 *
 * Items can have icons, nested children, section headlines, action buttons,
 * badges, active-route highlighting, and an integrated logo header for
 * sidebar-first layouts.
 */
const meta: Meta<SidenavComponent> = {
  title: 'Navigation/Sidenav',
  component: SidenavComponent,
  args: {
    closed: fn(),
    itemClicked: fn(),
    itemAction: fn(),
  },
  argTypes: {
    closed: { action: 'closed', description: 'Emitted when the sidenav is closed (drawer mode)' },
    itemClicked: { action: 'itemClicked', description: 'Emitted with the NavigationItem when an item is clicked' },
    itemAction: { action: 'itemAction', description: 'Emitted with the NavigationItem when an action button is clicked' },
    mode: {
      control: 'select',
      options: ['drawer', 'docked'],
      description: 'Docked stays visible, drawer overlays content',
    },
    position: {
      control: 'select',
      options: ['left', 'right'],
      description: 'Which side of the viewport the nav appears on',
    },
    isOpen: { description: 'Whether the sidenav is currently visible' },
    collapsed: { description: 'Collapse to 56px icon-rail mode' },
    activeRoute: { description: 'The currently active route (highlights matching item)' },
    width: { description: 'Custom width (CSS value, e.g. "280px")' },
    showLogo: { description: 'Show the logo at the top of the sidenav (for sidebar-first layouts)' },
    logoSize: {
      control: 'select',
      options: ['xs', 'sm', 'md', 'lg', 'xl'],
      description:
        'Size of the brand logo when `showLogo=true`. The logo area grows automatically so the logo is never clipped. Default is `md` (64px) which aligns with `<lc-header size="md">`. Use `lg`/`xl` for an extra-prominent brand block.',
      table: { defaultValue: { summary: 'md' } },
    },
    mobileBreakpoint: {
      control: 'number',
      description: 'Viewport width (px) below which docked mode switches to drawer',
    },
    theme: {
      control: 'select',
      options: ['auto', 'light', 'dark'],
      description: 'Theme variant — sets internal tokens (--lc-sidenav-bg, --lc-sidenav-fg, etc.)',
    },
  },

  parameters: {
    docs: {
      description: {
        component: `
Sidenav component for application navigation sidebar.

**Key Features:**
- **Drawer** (overlay) and **docked** (persistent) modes
- **Responsive mobile mode** — docked automatically switches to drawer below \`mobileBreakpoint\` (default 768px); auto-closes after navigation
- **Collapsed icon-rail** mode (56px narrow sidebar with icons only and hover tooltips); clicking a collapsible parent auto-expands the sidebar
- **Integrated logo** area (\`showLogo\`) with full logo / emblem toggle and a dedicated collapse chevron in the brand row (docked + expanded). Click the logo or chevron to collapse/expand in sidebar-first layouts. Use \`logoSize\` (\`xs | sm | md | lg | xl\`) to scale the brand block — the area grows automatically to fit the logo.
- **Hierarchical navigation** with collapsible groups (up to 3 levels deep)
- **Section headlines** for item grouping with optional action buttons (\`item.action\`)
- **Action buttons** on any item — hover-reveal icon buttons that emit \`itemAction\`
- **Badges** on items (\`item.badge\`) for counts or status indicators with color variants
- **Active route highlighting** — active items keep their color on hover
- **Keyboard navigation** — Escape closes drawer mode
- Configurable **width** and **position** (left/right)
- Optional **backdrop overlay**
- **Theme** input (\`auto\` | \`light\` | \`dark\`) — dark mode uses teal accent for active items
- Accessible with ARIA \`navigation\` role

**Inputs:**
| Input | Type | Default | Description |
|---|---|---|---|
| \`isOpen\` | \`boolean\` | \`false\` | Whether the sidenav is visible |
| \`mode\` | \`'drawer' \\| 'docked'\` | \`'drawer'\` | Overlay or persistent sidebar |
| \`position\` | \`'left' \\| 'right'\` | \`'left'\` | Side of viewport |
| \`width\` | \`string\` | \`'320px'\` | CSS width |
| \`collapsed\` | \`boolean\` | \`false\` | Icon-rail mode |
| \`showLogo\` | \`boolean\` | \`false\` | Show logo area at top |
| \`logoSize\` | \`'xs' \\| 'sm' \\| 'md' \\| 'lg' \\| 'xl'\` | \`'md'\` | Size of the brand logo (logo area grows automatically) |
| \`mobileBreakpoint\` | \`number\` | \`768\` | Viewport width (px) below which docked → drawer |
| \`items\` | \`NavigationItem[]\` | \`[]\` | Navigation items |
| \`activeRoute\` | \`string\` | \`''\` | Currently active route |
| \`hasOverlay\` | \`boolean\` | \`true\` | Show backdrop in drawer mode |
| \`ariaLabel\` | \`string\` | \`'Side navigation'\` | ARIA label |
| \`theme\` | \`'auto' \\| 'light' \\| 'dark'\` | \`'auto'\` | Theme variant |

**Outputs:**
| Output | Payload | Description |
|---|---|---|
| \`closed\` | \`void\` | Sidenav close requested (overlay click, Escape) |
| \`itemClicked\` | \`NavigationItem\` | Item navigated |
| \`itemAction\` | \`NavigationItem\` | Item action button clicked |

**NavigationItem shape:**
\`\`\`ts
interface NavigationItem {
  id: string;
  icon: string;
  label: string;
  route: string;
  displayOrder: number;
  isSection?: boolean;           // renders as section headline
  children?: NavigationItem[];   // nested items
  action?: { icon: string; ariaLabel?: string };  // hover-reveal button
  badge?: { value: string | number; variant?: BadgeVariant };  // count badge
}
\`\`\`

**Theming tokens:** \`--lc-sidenav-bg\`, \`--lc-sidenav-fg\`, \`--lc-sidenav-fg-active\`, \`--lc-sidenav-border\`, \`--lc-sidenav-hover-bg\`, \`--lc-sidenav-section-fg\`

Dark mode adds: \`--lc-sidenav-active-bg\`, \`--lc-sidenav-active-fg\`, \`--lc-sidenav-active-icon\`

**Icon-column geometry:** \`--lc-sidenav-rail-width\` (56px), \`--lc-sidenav-nav-padding-x\` (8px),
\`--lc-sidenav-item-padding-x\` (10px). Expanded and collapsed share the gutters, so the icon
column sits at 28px in both states and the icons do not shift when toggling — which is what an
\`lc-header\` hamburger aligns to. When overriding, keep
\`nav-padding-x + item-padding-x + icon-size / 2 == rail-width / 2\` and set the header's
\`--lc-header-hamburger-slot\` to the same rail width.
`,
      },
    },
  },
};

export default meta;
type Story = StoryObj<SidenavComponent>;

const standardItems = [
  { id: '1', icon: 'home', label: 'Dashboard', route: '/dashboard', displayOrder: 1 },
  { id: '2', icon: 'folder', label: 'Projects', route: '/projects', displayOrder: 2 },
  { id: '3', icon: 'users', label: 'Team', route: '/team', displayOrder: 3 },
  { id: '4', icon: 'chart-bar', label: 'Analytics', route: '/analytics', displayOrder: 4 },
  { id: '5', icon: 'cog-6-tooth', label: 'Settings', route: '/settings', displayOrder: 5 },
];

export const Docked: Story = {
  name: 'Docked Mode',
  args: {
    isOpen: true,
    mode: 'docked',
    items: standardItems,
    activeRoute: '/dashboard',
  },
};

export const DrawerMode: Story = {
  name: 'Drawer Mode',
  args: {
    isOpen: true,
    mode: 'drawer',
    items: standardItems,
    activeRoute: '/projects',
  },
};

export const RightPosition: Story = {
  name: 'Right Position',
  args: {
    isOpen: true,
    mode: 'docked',
    position: 'right',
    items: standardItems,
    activeRoute: '/team',
  },
};

export const WithNestedItems: Story = {
  name: 'With Nested Children',
  args: {
    isOpen: true,
    mode: 'docked',
    items: [
      { id: '1', icon: 'home', label: 'Dashboard', route: '/dashboard', displayOrder: 1 },
      { id: '2', icon: 'folder', label: 'Projects', route: '/projects', displayOrder: 2, children: [
        { id: '2a', icon: 'document', label: 'Active', route: '/projects/active', displayOrder: 1 },
        { id: '2b', icon: 'archive-box', label: 'Archived', route: '/projects/archived', displayOrder: 2 },
      ]},
      { id: '3', icon: 'users', label: 'Team', route: '/team', displayOrder: 3, children: [
        { id: '3a', icon: 'user-plus', label: 'Members', route: '/team/members', displayOrder: 1 },
        { id: '3b', icon: 'shield-check', label: 'Roles', route: '/team/roles', displayOrder: 2 },
      ]},
      { id: '4', icon: 'cog-6-tooth', label: 'Settings', route: '/settings', displayOrder: 4 },
    ],
    activeRoute: '/projects/active',
  },
};

export const FullApplication: Story = {
  name: 'Full App Layout (Composition)',
  args: {
    isOpen: true,
    mode: 'docked',
    items: [
      { id: '1', icon: 'home', label: 'Home', route: '/', displayOrder: 1 },
      { id: '2', icon: 'clipboard-document-list', label: 'Tasks', route: '/tasks', displayOrder: 2 },
      { id: '3', icon: 'calendar', label: 'Calendar', route: '/calendar', displayOrder: 3 },
      { id: '4', icon: 'chart-bar', label: 'Reports', route: '/reports', displayOrder: 4 },
      { id: '5', icon: 'bell', label: 'Notifications', route: '/notifications', displayOrder: 5 },
      { id: '6', icon: 'cog-6-tooth', label: 'Settings', route: '/settings', displayOrder: 6 },
    ],
    activeRoute: '/tasks',
  },
  render: (args) => ({
    props: args,
    template: `
      <div style="display: flex; height: 400px; border: 1px solid #eee; border-radius: 8px; overflow: hidden;">
        <lc-sidenav [isOpen]="isOpen" [mode]="mode" [items]="items" [activeRoute]="activeRoute"></lc-sidenav>
        <div style="flex: 1; padding: 24px;">
          <h3 style="margin: 0 0 8px; font-weight: 600;">Tasks</h3>
          <p style="color: #666; font-size: 14px;">Main content area next to the sidenav.</p>
        </div>
      </div>`,
  }),
};

export const CollapsedIconRail: Story = {
  name: 'Collapsed Icon Rail',
  parameters: {
    docs: { description: { story: 'Collapsed mode shows only icons in a narrow 56px rail. Hover over an icon to see the label tooltip.' } },
  },
  args: {
    isOpen: true,
    mode: 'docked',
    collapsed: true,
    items: standardItems,
    activeRoute: '/dashboard',
  },
  render: (args) => ({
    props: args,
    template: `
      <div style="display: flex; height: 400px; border: 1px solid #eee; border-radius: 8px; overflow: hidden;">
        <lc-sidenav [isOpen]="isOpen" [mode]="mode" [collapsed]="collapsed" [items]="items" [activeRoute]="activeRoute"></lc-sidenav>
        <div style="flex: 1; padding: 24px;">
          <h3 style="margin: 0 0 8px; font-weight: 600;">Dashboard</h3>
          <p style="color: #666; font-size: 14px;">The sidenav is collapsed to a narrow icon rail. Hover icons for labels.</p>
        </div>
      </div>`,
  }),
};

export const CollapsedVsExpanded: Story = {
  name: 'Collapsed vs Expanded',
  parameters: {
    docs: { description: { story: 'Side-by-side comparison of collapsed icon rail and full expanded sidenav.' } },
  },
  render: () => ({
    template: `
      <div style="display: flex; gap: 24px;">
        <div style="display: flex; height: 400px; border: 1px solid #eee; border-radius: 8px; overflow: hidden; flex: 0 0 auto;">
          <lc-sidenav [isOpen]="true" mode="docked" [collapsed]="true"
            [items]="[
              { id: '1', icon: 'home', label: 'Dashboard', route: '/dashboard', displayOrder: 1 },
              { id: '2', icon: 'folder', label: 'Projects', route: '/projects', displayOrder: 2 },
              { id: '3', icon: 'users', label: 'Team', route: '/team', displayOrder: 3 },
              { id: '4', icon: 'chart-bar', label: 'Analytics', route: '/analytics', displayOrder: 4 },
              { id: '5', icon: 'cog-6-tooth', label: 'Settings', route: '/settings', displayOrder: 5 }
            ]"
            activeRoute="/dashboard">
          </lc-sidenav>
          <div style="padding: 16px; font-size: 13px; color: #999;">Collapsed</div>
        </div>
        <div style="display: flex; height: 400px; border: 1px solid #eee; border-radius: 8px; overflow: hidden; flex: 1;">
          <lc-sidenav [isOpen]="true" mode="docked" [collapsed]="false" width="240px"
            [items]="[
              { id: '1', icon: 'home', label: 'Dashboard', route: '/dashboard', displayOrder: 1 },
              { id: '2', icon: 'folder', label: 'Projects', route: '/projects', displayOrder: 2 },
              { id: '3', icon: 'users', label: 'Team', route: '/team', displayOrder: 3 },
              { id: '4', icon: 'chart-bar', label: 'Analytics', route: '/analytics', displayOrder: 4 },
              { id: '5', icon: 'cog-6-tooth', label: 'Settings', route: '/settings', displayOrder: 5 }
            ]"
            activeRoute="/dashboard">
          </lc-sidenav>
          <div style="padding: 16px; font-size: 13px; color: #999; flex: 1;">Expanded</div>
        </div>
      </div>`,
  }),
};

export const DarkTheme: Story = {
  name: 'Dark Theme',
  parameters: {
    docs: { description: { story: 'Sidenav with explicit dark theme via `[theme]="dark"`. Uses internal tokens for background, text, and hover colors.' } },
  },
  args: {
    isOpen: true,
    mode: 'docked',
    theme: 'dark',
    items: standardItems,
    activeRoute: '/dashboard',
  },
  render: (args) => ({
    props: args,
    template: `
      <div style="display: flex; height: 400px; border: 1px solid #333; border-radius: 8px; overflow: hidden;">
        <lc-sidenav [isOpen]="isOpen" [mode]="mode" [theme]="theme" [items]="items" [activeRoute]="activeRoute"></lc-sidenav>
        <div style="flex: 1; padding: 24px; background: #f9fafb;">
          <h3 style="margin: 0 0 8px; font-weight: 600;">Content Area</h3>
          <p style="color: #666; font-size: 14px;">The sidenav uses its own dark tokens, independent of the page theme.</p>
        </div>
      </div>`,
  }),
};

export const WithGroupsAndActions: Story = {
  name: 'Groups with Actions',
  parameters: {
    docs: { description: { story: 'Section headers and collapsible items can have action buttons (visible on hover). Useful for "Add project", context menus, etc.' } },
  },
  args: {
    isOpen: true,
    mode: 'docked',
    theme: 'dark',
    items: [
      { id: '1', icon: 'chart-bar', label: 'Dashboard', route: '/dashboard', displayOrder: 1 },
      { id: '2', icon: 'cpu-chip', label: 'Agent Runs', route: '/agent-runs', displayOrder: 2 },
      {
        id: 'projects-section', icon: '', label: 'Projects', route: '', displayOrder: 3,
        isSection: true,
        action: { icon: 'plus', ariaLabel: 'Add project' },
        children: [
          {
            id: 'p1', icon: 'folder', label: 'Project Alpha', route: '/projects/alpha', displayOrder: 1,
            action: { icon: 'ellipsis-horizontal', ariaLabel: 'Project Alpha options' },
            children: [
              { id: 'p1a', icon: 'clipboard-document-list', label: 'Specs & Epics', route: '/projects/alpha/specs', displayOrder: 1 },
              { id: 'p1b', icon: 'building-library', label: 'ADRs', route: '/projects/alpha/adrs', displayOrder: 2 },
              { id: 'p1c', icon: 'document-text', label: 'Policies', route: '/projects/alpha/policies', displayOrder: 3 },
              { id: 'p1d', icon: 'link', label: 'Context Sources', route: '/projects/alpha/context', displayOrder: 4 },
              { id: 'p1e', icon: 'chart-bar-square', label: 'Metrics', route: '/projects/alpha/metrics', displayOrder: 5 },
            ],
          },
          {
            id: 'p2', icon: 'folder', label: 'Project Beta', route: '/projects/beta', displayOrder: 2,
            action: { icon: 'ellipsis-horizontal', ariaLabel: 'Project Beta options' },
            children: [
              { id: 'p2a', icon: 'clipboard-document-list', label: 'Specs & Epics', route: '/projects/beta/specs', displayOrder: 1 },
            ],
          },
          {
            id: 'p3', icon: 'folder', label: 'Project Gamma', route: '/projects/gamma', displayOrder: 3,
            action: { icon: 'ellipsis-horizontal', ariaLabel: 'Project Gamma options' },
            children: [
              { id: 'p3a', icon: 'clipboard-document-list', label: 'Specs & Epics', route: '/projects/gamma/specs', displayOrder: 1 },
            ],
          },
        ],
      },
      { id: '10', icon: 'cog-6-tooth', label: 'Org Settings', route: '/settings', displayOrder: 10 },
    ],
    activeRoute: '/projects/alpha/specs',
  },
  render: (args) => ({
    props: args,
    template: `
      <div style="display: flex; height: 500px; border: 1px solid #333; border-radius: 8px; overflow: hidden;">
        <lc-sidenav [isOpen]="isOpen" [mode]="mode" [theme]="theme" [items]="items" [activeRoute]="activeRoute" (itemAction)="itemAction($event)"></lc-sidenav>
        <div style="flex: 1; padding: 24px; background: #f9fafb;">
          <h3 style="margin: 0 0 8px; font-weight: 600;">Specs &amp; Epics</h3>
          <p style="color: #666; font-size: 14px;">Hover over section headers or items to see action buttons.</p>
        </div>
      </div>`,
  }),
};

export const WithBadges: Story = {
  name: 'With Badges',
  parameters: {
    docs: { description: { story: 'Navigation items can display a badge with a count or label on the right side. Badges support all color variants.' } },
  },
  args: {
    isOpen: true,
    mode: 'docked',
    items: [
      { id: '1', icon: 'home', label: 'Dashboard', route: '/dashboard', displayOrder: 1 },
      { id: '2', icon: 'clipboard-document-list', label: 'Tasks', route: '/tasks', displayOrder: 2, badge: { value: 12, variant: 'primary' } },
      { id: '3', icon: 'bell', label: 'Notifications', route: '/notifications', displayOrder: 3, badge: { value: 3, variant: 'error' } },
      { id: '4', icon: 'envelope', label: 'Messages', route: '/messages', displayOrder: 4, badge: { value: 'New', variant: 'success' } },
      { id: '5', icon: 'users', label: 'Team', route: '/team', displayOrder: 5, children: [
        { id: '5a', icon: 'user-plus', label: 'Pending Invites', route: '/team/invites', displayOrder: 1, badge: { value: 2, variant: 'warning' } },
        { id: '5b', icon: 'shield-check', label: 'Roles', route: '/team/roles', displayOrder: 2 },
      ]},
      { id: '6', icon: 'cog-6-tooth', label: 'Settings', route: '/settings', displayOrder: 6 },
    ],
    activeRoute: '/tasks',
  },
  render: (args) => ({
    props: args,
    template: `
      <div style="display: flex; height: 400px; border: 1px solid #eee; border-radius: 8px; overflow: hidden;">
        <lc-sidenav [isOpen]="isOpen" [mode]="mode" [items]="items" [activeRoute]="activeRoute"></lc-sidenav>
        <div style="flex: 1; padding: 24px;">
          <h3 style="margin: 0 0 8px; font-weight: 600;">Tasks</h3>
          <p style="color: #666; font-size: 14px;">Items can show badges for counts, status, or labels.</p>
        </div>
      </div>`,
  }),
};

export const CollapsedWithGroups: Story = {
  name: 'Collapsed with Groups & Actions',
  parameters: {
    docs: { description: { story: 'Collapsed icon rail with section groups, collapsible items, actions, and badges. Groups are separated by dividers, labels/chevrons/children are hidden.' } },
  },
  args: {
    isOpen: true,
    mode: 'docked',
    collapsed: true,
    theme: 'dark',
    items: [
      { id: '1', icon: 'chart-bar', label: 'Dashboard', route: '/dashboard', displayOrder: 1 },
      { id: '2', icon: 'cpu-chip', label: 'Agent Runs', route: '/agent-runs', displayOrder: 2, badge: { value: 3, variant: 'primary' } },
      {
        id: 'projects-section', icon: '', label: 'Projects', route: '', displayOrder: 3,
        isSection: true,
        action: { icon: 'plus', ariaLabel: 'Add project' },
        children: [
          { id: 'p1', icon: 'folder', label: 'Project Alpha', route: '/projects/alpha', displayOrder: 1 },
          { id: 'p2', icon: 'folder', label: 'Project Beta', route: '/projects/beta', displayOrder: 2 },
          { id: 'p3', icon: 'folder', label: 'Project Gamma', route: '/projects/gamma', displayOrder: 3 },
        ],
      },
      { id: '10', icon: 'cog-6-tooth', label: 'Org Settings', route: '/settings', displayOrder: 10 },
    ],
    activeRoute: '/projects/alpha',
  },
  render: (args) => ({
    props: args,
    template: `
      <div style="display: flex; height: 400px; border: 1px solid #333; border-radius: 8px; overflow: hidden;">
        <lc-sidenav [isOpen]="isOpen" [mode]="mode" [collapsed]="collapsed" [theme]="theme" [items]="items" [activeRoute]="activeRoute" (itemAction)="itemAction($event)"></lc-sidenav>
        <div style="flex: 1; padding: 24px; background: #f9fafb;">
          <h3 style="margin: 0 0 8px; font-weight: 600;">Project Alpha</h3>
          <p style="color: #666; font-size: 14px;">Collapsed sidenav with section groups. Hover icons for labels.</p>
        </div>
      </div>`,
  }),
};

export const CollapsedRailBadges: Story = {
  name: 'Collapsed Rail — Badges',
  parameters: {
    docs: {
      description: {
        story:
          'Badge rendering on the 56px icon rail, across variants and value widths. ' +
          'The badge sits on the item\'s top-right corner as a compact count bubble ' +
          'and keeps an opaque backdrop plus a ring in the rail color, so it stays ' +
          'readable where a wider value ("99+") reaches over the icon. Shown on both ' +
          'themes because the ring follows `--lc-sidenav-bg`.',
      },
    },
  },
  args: {
    isOpen: true,
    mode: 'docked',
    collapsed: true,
  },
  render: () => ({
    props: {
      items: [
        { id: '1', icon: 'home', label: 'One digit', route: '/a', displayOrder: 1, badge: { value: 3, variant: 'primary' } },
        { id: '2', icon: 'bell', label: 'Two digits', route: '/b', displayOrder: 2, badge: { value: 12, variant: 'error' } },
        { id: '3', icon: 'mail', label: 'Overflow value', route: '/c', displayOrder: 3, badge: { value: '99+', variant: 'warning' } },
        { id: '4', icon: 'folder', label: 'Text value', route: '/d', displayOrder: 4, badge: { value: 'New', variant: 'success' } },
        { id: '5', icon: 'chart-bar', label: 'Default variant', route: '/e', displayOrder: 5, badge: { value: 7 } },
        { id: '6', icon: 'settings', label: 'No badge', route: '/f', displayOrder: 6 },
      ],
    },
    template: `
      <div style="display: flex; gap: 32px; align-items: flex-start;">
        <div>
          <p style="margin: 0 0 8px; font-size: 12px; font-weight: 600; letter-spacing: .06em; text-transform: uppercase; color: var(--color-text-secondary);">Dark (default)</p>
          <div style="height: 340px; border-radius: 8px; overflow: hidden;">
            <lc-sidenav [isOpen]="true" mode="docked" [collapsed]="true" theme="dark" [items]="items" activeRoute="/b"></lc-sidenav>
          </div>
        </div>
        <div>
          <p style="margin: 0 0 8px; font-size: 12px; font-weight: 600; letter-spacing: .06em; text-transform: uppercase; color: var(--color-text-secondary);">Light</p>
          <div style="height: 340px; border-radius: 8px; overflow: hidden;">
            <lc-sidenav [isOpen]="true" mode="docked" [collapsed]="true" theme="light" [items]="items" activeRoute="/b"></lc-sidenav>
          </div>
        </div>
      </div>`,
  }),
};

export const SidebarFirstLayout: Story = {
  name: 'Sidebar-First Layout',
  parameters: {
    docs: { description: { story: 'The sidenav takes full height beside the header. Logo is shown at the top with default `logoSize="md"` (64px brand block, aligned with `<lc-header size="md">`). In docked + expanded mode, the brand row also shows a dedicated chevron button to collapse quickly. For an extra-prominent brand, see *Sidebar-First Layout (Prominent Brand)* below.' } },
    layout: 'fullscreen',
  },
  render: () => ({
    moduleMetadata: { imports: [HeaderComponent] },
    template: `
      <div style="display: flex; height: 500px; border: 1px solid #333; border-radius: 8px; overflow: hidden;">
        <lc-sidenav
          [isOpen]="true"
          mode="docked"
          [showLogo]="true"
          theme="dark"
          width="240px"
          [items]="[
            { id: '1', icon: 'chart-bar', label: 'Dashboard', route: '/dashboard', displayOrder: 1 },
            { id: '2', icon: 'cpu-chip', label: 'Agent Runs', route: '/agent-runs', displayOrder: 2, badge: { value: 3, variant: 'primary' } },
            {
              id: 'projects', icon: '', label: 'Projects', route: '', displayOrder: 3,
              isSection: true,
              action: { icon: 'plus', ariaLabel: 'Add project' },
              children: [
                { id: 'p1', icon: 'folder', label: 'Project Alpha', route: '/projects/alpha', displayOrder: 1,
                  action: { icon: 'ellipsis-horizontal', ariaLabel: 'Options' },
                  children: [
                    { id: 'p1a', icon: 'clipboard-document-list', label: 'Specs & Epics', route: '/projects/alpha/specs', displayOrder: 1 },
                    { id: 'p1b', icon: 'building-library', label: 'ADRs', route: '/projects/alpha/adrs', displayOrder: 2 },
                    { id: 'p1c', icon: 'document-text', label: 'Policies', route: '/projects/alpha/policies', displayOrder: 3 }
                  ]
                },
                { id: 'p2', icon: 'folder', label: 'Project Beta', route: '/projects/beta', displayOrder: 2,
                  action: { icon: 'ellipsis-horizontal', ariaLabel: 'Options' } },
                { id: 'p3', icon: 'folder', label: 'Project Gamma', route: '/projects/gamma', displayOrder: 3,
                  action: { icon: 'ellipsis-horizontal', ariaLabel: 'Options' } }
              ]
            },
            { id: '10', icon: 'cog-6-tooth', label: 'Org Settings', route: '/settings', displayOrder: 10 }
          ]"
          activeRoute="/projects/alpha/specs">
        </lc-sidenav>
        <div style="display: flex; flex-direction: column; flex: 1; min-width: 0;">
          <lc-header
            title="Life-Cockpit"
            subtitle="Specs & Epics"
            userName="Sarah Connor"
            userEmail="sarah@example.com"
            contextName="Acme Corp"
            contextLabel="Organization"
            [showThemeButton]="true"
            [showLogo]="false"
          ></lc-header>
          <main style="flex: 1; padding: 24px; overflow-y: auto; background: #f9fafb;">
            <h2 style="margin: 0 0 12px; font-weight: 600; font-size: 1.25rem;">Specs & Epics</h2>
            <p style="color: #666; font-size: 14px;">Content area with header above. The sidenav owns the full height and logo. Use the logo or the chevron in the brand row to toggle collapsed state.</p>
          </main>
        </div>
      </div>`,
  }),
};

export const SidebarFirstCollapsed: Story = {
  name: 'Sidebar-First Layout (Collapsed)',
  parameters: {
    docs: { description: { story: 'Same sidebar-first layout but with the sidenav collapsed to an icon rail. The logo switches to the emblem automatically.' } },
    layout: 'fullscreen',
  },
  render: () => ({
    moduleMetadata: { imports: [HeaderComponent] },
    template: `
      <div style="display: flex; height: 500px; border: 1px solid #333; border-radius: 8px; overflow: hidden;">
        <lc-sidenav
          [isOpen]="true"
          mode="docked"
          [showLogo]="true"
          [collapsed]="true"
          theme="dark"
          [items]="[
            { id: '1', icon: 'chart-bar', label: 'Dashboard', route: '/dashboard', displayOrder: 1 },
            { id: '2', icon: 'cpu-chip', label: 'Agent Runs', route: '/agent-runs', displayOrder: 2, badge: { value: 3, variant: 'primary' } },
            {
              id: 'projects', icon: '', label: 'Projects', route: '', displayOrder: 3,
              isSection: true,
              children: [
                { id: 'p1', icon: 'folder', label: 'Project Alpha', route: '/projects/alpha', displayOrder: 1 },
                { id: 'p2', icon: 'folder', label: 'Project Beta', route: '/projects/beta', displayOrder: 2 },
                { id: 'p3', icon: 'folder', label: 'Project Gamma', route: '/projects/gamma', displayOrder: 3 }
              ]
            },
            { id: '10', icon: 'cog-6-tooth', label: 'Org Settings', route: '/settings', displayOrder: 10 }
          ]"
          activeRoute="/projects/alpha">
        </lc-sidenav>
        <div style="display: flex; flex-direction: column; flex: 1; min-width: 0;">
          <lc-header
            title="Life-Cockpit"
            userName="Sarah Connor"
            userEmail="sarah@example.com"
            contextName="Acme Corp"
            contextLabel="Organization"
            [showThemeButton]="true"
            [showLogo]="false"
          ></lc-header>
          <main style="flex: 1; padding: 24px; overflow-y: auto; background: #f9fafb;">
            <h2 style="margin: 0 0 12px; font-weight: 600; font-size: 1.25rem;">Project Alpha</h2>
            <p style="color: #666; font-size: 14px;">Collapsed sidebar with emblem logo. Click the emblem to expand. Header sits beside the sidenav.</p>
          </main>
        </div>
      </div>`,
  }),
};

export const ResponsiveMobile: Story = {
  name: 'Responsive (Mobile View)',
  parameters: {
    docs: { description: { story: 'On narrow screens (below 768px), the docked sidenav automatically switches to drawer mode with overlay. The hamburger button in the header toggles it. Resize the browser or use Storybook viewport controls to test.' } },
    layout: 'fullscreen',
    viewport: { defaultViewport: 'mobile1' },
  },
  render: () => ({
    moduleMetadata: { imports: [HeaderComponent] },
    props: {
      sidebarOpen: false,
      toggleSidebar() { this['sidebarOpen'] = !this['sidebarOpen']; },
    },
    template: `
      <div style="display: flex; height: 100vh; overflow: hidden;">
        <lc-sidenav
          [isOpen]="sidebarOpen"
          mode="docked"
          [mobileBreakpoint]="9999"
          [showLogo]="true"
          theme="dark"
          width="280px"
          [items]="[
            { id: '1', icon: 'chart-bar', label: 'Dashboard', route: '/dashboard', displayOrder: 1 },
            { id: '2', icon: 'cpu-chip', label: 'Agent Runs', route: '/agent-runs', displayOrder: 2, badge: { value: 3, variant: 'primary' } },
            {
              id: 'projects', icon: '', label: 'Projects', route: '', displayOrder: 3,
              isSection: true,
              action: { icon: 'plus', ariaLabel: 'Add project' },
              children: [
                { id: 'p1', icon: 'folder', label: 'Project Alpha', route: '/projects/alpha', displayOrder: 1 },
                { id: 'p2', icon: 'folder', label: 'Project Beta', route: '/projects/beta', displayOrder: 2 },
                { id: 'p3', icon: 'folder', label: 'Project Gamma', route: '/projects/gamma', displayOrder: 3 }
              ]
            },
            { id: '10', icon: 'cog-6-tooth', label: 'Settings', route: '/settings', displayOrder: 10 }
          ]"
          activeRoute="/dashboard"
          (closed)="sidebarOpen = false">
        </lc-sidenav>
        <div style="display: flex; flex-direction: column; flex: 1; min-width: 0;">
          <lc-header
            title="Life-Cockpit"
            userName="Sarah Connor"
            userEmail="sarah@example.com"
            [showHamburger]="true"
            [showLogo]="false"
            (hamburgerClick)="toggleSidebar()"
          ></lc-header>
          <main style="flex: 1; padding: 16px; overflow-y: auto; background: #f9fafb;">
            <h2 style="margin: 0 0 12px; font-weight: 600; font-size: 1.25rem;">Dashboard</h2>
            <p style="color: #666; font-size: 14px;">On mobile, the sidenav becomes a drawer overlay. Use the hamburger menu to open it. Resize to desktop to see it dock.</p>
          </main>
        </div>
      </div>`,
  }),
};

export const SidebarFirstProminentBrand: Story = {
  name: 'Sidebar-First Layout (Prominent Brand)',
  parameters: {
    docs: {
      description: {
        story:
          'Extra-prominent brand block via `logoSize="lg"` (80px). Pair with `<lc-header size="lg">` so the header lines up with the taller brand area. The brand row keeps the dedicated chevron collapse button for quick toggling. The default `md` size (64px) is shown in *Sidebar-First Layout* above.',
      },
    },
    layout: 'fullscreen',
  },
  render: () => ({
    moduleMetadata: { imports: [HeaderComponent] },
    template: `
      <div style="display: flex; height: 520px; border: 1px solid #333; border-radius: 8px; overflow: hidden;">
        <lc-sidenav
          [isOpen]="true"
          mode="docked"
          [showLogo]="true"
          logoSize="lg"
          theme="dark"
          width="256px"
          [items]="[
            { id: '1', icon: 'chart-bar', label: 'Dashboard', route: '/dashboard', displayOrder: 1 },
            { id: '2', icon: 'cpu-chip', label: 'Agent Runs', route: '/agent-runs', displayOrder: 2, badge: { value: 3, variant: 'primary' } },
            {
              id: 'projects', icon: '', label: 'Projects', route: '', displayOrder: 3,
              isSection: true,
              action: { icon: 'plus', ariaLabel: 'Add project' },
              children: [
                { id: 'p1', icon: 'folder', label: 'Project Alpha', route: '/projects/alpha', displayOrder: 1 },
                { id: 'p2', icon: 'folder', label: 'Project Beta', route: '/projects/beta', displayOrder: 2 }
              ]
            },
            { id: '10', icon: 'cog-6-tooth', label: 'Org Settings', route: '/settings', displayOrder: 10 }
          ]"
          activeRoute="/dashboard">
        </lc-sidenav>
        <div style="display: flex; flex-direction: column; flex: 1; min-width: 0;">
          <lc-header
            userName="Sarah Connor"
            userEmail="sarah@example.com"
            contextName="Life-Cockpit"
            contextLabel="Organization"
            size="lg"
            [showHamburger]="true"
            [showLogo]="false"
          ></lc-header>
          <main style="flex: 1; padding: 24px; overflow-y: auto; background: #f9fafb;">
            <h2 style="margin: 0 0 8px; font-weight: 700; font-size: 1.5rem;">Dashboard</h2>
            <p style="color: #666; font-size: 14px;">Overview of project activity, agent runs, and key metrics.</p>
          </main>
        </div>
      </div>`,
  }),
};

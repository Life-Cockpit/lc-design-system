import type { Meta, StoryObj } from '@storybook/angular';
import { BreadcrumbsComponent } from './breadcrumbs.component';

/**
 * Breadcrumbs show the user's current location within a navigation hierarchy.
 * Each item except the last is a clickable link. Supports custom separators
 * and multiple sizes.
 */
const meta: Meta<BreadcrumbsComponent> = {
  title: 'Navigation/Breadcrumbs',
  component: BreadcrumbsComponent,
  argTypes: {
    items: { description: 'Array of breadcrumb items with label and optional url' },
    size: {
      control: 'select',
      options: ['sm', 'md', 'lg'],
      description: 'Controls font size and spacing',
    },
    separator: { description: 'Character(s) used between items (default: "/")' },
  },

  parameters: {
    docs: {
      description: {
        component: `
Breadcrumbs component for hierarchical navigation.

**Key Features:**
- Configurable separator character
- Ellipsis collapse for long paths with maxItems
- Multiple size variants (sm, md, lg)
- Router link support for navigation items
- Accessible with ARIA breadcrumb landmark
`,
      },
    },
  },
};

export default meta;
type Story = StoryObj<BreadcrumbsComponent>;

export const Default: Story = {
  args: {
    items: [
      { label: 'Home', url: '/' },
      { label: 'Products', url: '/products' },
      { label: 'Shoes', url: '/products/shoes' },
      { label: 'Running' },
    ],
    size: 'md',
    separator: '/',
  },
};

export const TwoLevels: Story = {
  name: 'Two Levels',
  args: {
    items: [
      { label: 'Dashboard', url: '/' },
      { label: 'Settings' },
    ],
    size: 'md',
    separator: '/',
  },
};

export const DeepHierarchy: Story = {
  name: 'Deep Hierarchy',
  args: {
    items: [
      { label: 'Home', url: '/' },
      { label: 'Organization', url: '/org' },
      { label: 'Teams', url: '/org/teams' },
      { label: 'Engineering', url: '/org/teams/engineering' },
      { label: 'Frontend', url: '/org/teams/engineering/frontend' },
      { label: 'Members' },
    ],
    size: 'md',
    separator: '/',
  },
};

export const ChevronSeparator: Story = {
  name: 'Chevron Separator',
  args: {
    items: [
      { label: 'Home', url: '/' },
      { label: 'Projects', url: '/projects' },
      { label: 'Life-Cockpit' },
    ],
    size: 'md',
    separator: '›',
  },
};

export const ArrowSeparator: Story = {
  name: 'Arrow Separator',
  args: {
    items: [
      { label: 'Account', url: '/account' },
      { label: 'Billing', url: '/account/billing' },
      { label: 'Invoices' },
    ],
    size: 'md',
    separator: '→',
  },
};

export const Sizes: Story = {
  name: 'Size Comparison',
  render: () => ({
    template: `
      <div style="display: flex; flex-direction: column; gap: 16px;">
        <div>
          <div style="font-size: 11px; color: #666; margin-bottom: 4px;">Small</div>
          <lc-breadcrumbs [items]="items" size="sm"></lc-breadcrumbs>
        </div>
        <div>
          <div style="font-size: 11px; color: #666; margin-bottom: 4px;">Medium (default)</div>
          <lc-breadcrumbs [items]="items" size="md"></lc-breadcrumbs>
        </div>
        <div>
          <div style="font-size: 11px; color: #666; margin-bottom: 4px;">Large</div>
          <lc-breadcrumbs [items]="items" size="lg"></lc-breadcrumbs>
        </div>
      </div>`,
    props: {
      items: [
        { label: 'Home', url: '/' },
        { label: 'Documents', url: '/docs' },
        { label: 'Report Q4.pdf' },
      ],
    },
  }),
};

export const InPageHeader: Story = {
  name: 'In Page Header (Composition)',
  render: () => ({
    template: `
      <div style="max-width: 600px; border-bottom: 1px solid #eee; padding-bottom: 16px;">
        <lc-breadcrumbs
          [items]="items"
          size="sm"
        ></lc-breadcrumbs>
        <h2 style="margin: 8px 0 4px; font-size: 22px; font-weight: 600;">Project Settings</h2>
        <p style="margin: 0; font-size: 13px; color: #666;">Manage your project configuration and team members.</p>
      </div>`,
    props: {
      items: [
        { label: 'Home', url: '/' },
        { label: 'Projects', url: '/projects' },
        { label: 'Life-Cockpit', url: '/projects/lc' },
        { label: 'Settings' },
      ],
    },
  }),
};

export const StateNavigation: Story = {
  name: 'State Navigation (without URLs)',
  render: () => ({
    template: `
      <div style="max-width: 600px;">
        <lc-breadcrumbs
          [items]="items"
          (itemClick)="onItemClick($event)"
        ></lc-breadcrumbs>
        <p style="margin: 8px 0 0; font-size: 13px; color: #666;">
          Items without <code>url</code> render as buttons and emit
          <code>itemClick</code> — useful when a click should change in-memory
          state instead of navigating to a route.
        </p>
      </div>`,
    props: {
      items: [
        { label: 'Collection', id: 'collection' },
        { label: 'Group', id: 'group' },
        { label: 'Item Detail' },
      ],
      onItemClick: (item: unknown) => console.log('itemClick', item),
    },
  }),
};

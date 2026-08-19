import type { Meta, StoryObj } from '@storybook/angular';
import { FilterBarComponent } from './filter-bar.component';

/**
 * Filter Bar combines search, select, and toggle filters in a horizontal layout.
 * Use it above tables or lists to let users narrow down results.
 * Emits filter values as they change.
 */
const meta: Meta<FilterBarComponent> = {
  title: 'Data Display/Filter Bar',
  component: FilterBarComponent,
  argTypes: {
    size: {
      control: 'select',
      options: ['sm', 'md'],
      description: 'Controls height of filter inputs',
    },
  },

  parameters: {
    docs: {
      description: {
        component: `
Filter bar component for composable data filtering.

**Key Features:**
- Select dropdowns, toggle groups, and search inputs
- Declarative filter configuration via FilterConfig array
- Two-way filter values binding
- Responsive horizontal flex layout
- Size variants (sm, md)
- Dark mode support
`,
      },
    },
  },
};

export default meta;
type Story = StoryObj<FilterBarComponent>;

export const Default: Story = {
  args: {
    size: 'md',
    filters: [
      { key: 'search', label: 'Search', type: 'search', placeholder: 'Search...' },
      { key: 'status', label: 'Status', type: 'select', options: [{ value: 'active', label: 'Active' }, { value: 'inactive', label: 'Inactive' }] },
      { key: 'featured', label: 'Featured', type: 'toggle', options: [{ value: '', label: 'All' }, { value: 'true', label: 'Featured only' }] },
    ],
    values: {},
  },
};

export const WithPresetValues: Story = {
  name: 'With Preset Values',
  args: {
    size: 'md',
    filters: [
      { key: 'search', label: 'Search', type: 'search', placeholder: 'Filter by name...' },
      { key: 'role', label: 'Role', type: 'select', options: [{ value: 'admin', label: 'Admin' }, { value: 'editor', label: 'Editor' }, { value: 'viewer', label: 'Viewer' }] },
      { key: 'active', label: 'Active', type: 'toggle', options: [{ value: '', label: 'All' }, { value: 'true', label: 'Active only' }] },
    ],
    values: { role: 'editor', active: 'true' },
  },
};

export const SmallSize: Story = {
  name: 'Small Size',
  args: {
    size: 'sm',
    filters: [
      { key: 'search', label: 'Search', type: 'search', placeholder: 'Quick search...' },
      { key: 'category', label: 'Category', type: 'select', options: [{ value: 'bug', label: 'Bug' }, { value: 'feature', label: 'Feature' }, { value: 'docs', label: 'Documentation' }] },
    ],
    values: {},
  },
};

export const ProjectFilters: Story = {
  name: 'Project Management Filters',
  args: {
    size: 'md',
    filters: [
      { key: 'search', label: 'Search', type: 'search', placeholder: 'Search tasks...' },
      { key: 'priority', label: 'Priority', type: 'select', options: [{ value: 'high', label: 'High' }, { value: 'medium', label: 'Medium' }, { value: 'low', label: 'Low' }] },
      { key: 'assignee', label: 'Assignee', type: 'select', options: [{ value: 'me', label: 'Assigned to me' }, { value: 'unassigned', label: 'Unassigned' }] },
      { key: 'overdue', label: 'Due', type: 'toggle', options: [{ value: '', label: 'All' }, { value: 'true', label: 'Overdue only' }] },
    ],
    values: {},
  },
};

export const AboveTable: Story = {
  name: 'Above a Table (Composition)',
  render: () => ({
    props: {
      filters: [
        { key: 'search', label: 'Search', type: 'search', placeholder: 'Search members...' },
        { key: 'role', label: 'Role', type: 'select', options: [{ value: 'admin', label: 'Admin' }, { value: 'member', label: 'Member' }] },
        { key: 'active', label: 'Active', type: 'toggle', options: [{ value: '', label: 'All' }, { value: 'true', label: 'Active only' }] },
      ],
    },
    template: `
      <div style="max-width: 700px;">
        <lc-filter-bar [filters]="filters" size="sm"></lc-filter-bar>
        <table style="width: 100%; border-collapse: collapse; margin-top: 12px;">
          <thead>
            <tr style="border-bottom: 2px solid #eee;">
              <th style="padding: 8px 12px; text-align: left; font-size: 13px;">Name</th>
              <th style="padding: 8px 12px; text-align: left; font-size: 13px;">Email</th>
              <th style="padding: 8px 12px; text-align: left; font-size: 13px;">Role</th>
            </tr>
          </thead>
          <tbody>
            <tr style="border-bottom: 1px solid #f0f0f0;"><td style="padding: 8px 12px; font-size: 13px;">Alice</td><td style="padding: 8px 12px; font-size: 13px;">alice&#64;co.com</td><td style="padding: 8px 12px; font-size: 13px;">Admin</td></tr>
            <tr style="border-bottom: 1px solid #f0f0f0;"><td style="padding: 8px 12px; font-size: 13px;">Bob</td><td style="padding: 8px 12px; font-size: 13px;">bob&#64;co.com</td><td style="padding: 8px 12px; font-size: 13px;">Member</td></tr>
            <tr><td style="padding: 8px 12px; font-size: 13px;">Carol</td><td style="padding: 8px 12px; font-size: 13px;">carol&#64;co.com</td><td style="padding: 8px 12px; font-size: 13px;">Member</td></tr>
          </tbody>
        </table>
      </div>`,
  }),
};

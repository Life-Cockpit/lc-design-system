import type { Meta, StoryObj } from '@storybook/angular';
import { DrawerComponent } from './drawer.component';

const meta: Meta<DrawerComponent> = {
  title: 'Feedback/Drawer',
  component: DrawerComponent,
  parameters: {
    docs: {
      description: {
        component: `
The Drawer component slides a panel from the side of the screen.
Use it for secondary navigation, detail panels, filters, and forms.

**Key Features:**
- Left or right positioning
- 4 sizes (sm, md, lg, xl)
- Heading with close button
- Backdrop and keyboard dismiss
- Content projection
        `,
      },
    },
  },
  argTypes: {
    position: {
      control: 'select',
      options: ['left', 'right'],
      description: 'Slide-in direction',
      table: { defaultValue: { summary: 'right' } },
    },
    size: {
      control: 'select',
      options: ['sm', 'md', 'lg', 'xl'],
      description: 'Panel width',
      table: { defaultValue: { summary: 'md' } },
    },
    open: { control: 'boolean', description: 'Controls visibility' },
    heading: { control: 'text', description: 'Drawer heading text' },
  },
};

export default meta;
type Story = StoryObj<DrawerComponent>;

export const Default: Story = {
  args: { open: true, position: 'right', size: 'md', heading: 'Task Details' },
  render: (args) => ({
    props: args,
    template: `
      <lc-drawer [open]="open" [position]="position" [size]="size" [heading]="heading">
        <div style="padding: 16px; display: flex; flex-direction: column; gap: 12px;">
          <div>
            <p style="margin: 0; font-size: 12px; color: var(--color-text-secondary); text-transform: uppercase;">Status</p>
            <lc-badge variant="info">In Progress</lc-badge>
          </div>
          <div>
            <p style="margin: 0; font-size: 12px; color: var(--color-text-secondary); text-transform: uppercase;">Assignee</p>
            <div style="display: flex; align-items: center; gap: 8px; margin-top: 4px;">
              <lc-avatar name="Alice Johnson" size="xs"></lc-avatar>
              <span style="font-size: 14px;">Alice Johnson</span>
            </div>
          </div>
          <div>
            <p style="margin: 0; font-size: 12px; color: var(--color-text-secondary); text-transform: uppercase;">Description</p>
            <p style="margin: 4px 0 0; font-size: 14px; color: var(--color-text-primary); line-height: 1.5;">
              Implement the new authentication flow including OAuth2 support, refresh token handling, and session management.
            </p>
          </div>
        </div>
      </lc-drawer>`,
  }),
};

export const LeftPosition: Story = {
  args: { open: true, position: 'left', size: 'sm', heading: 'Navigation' },
  render: (args) => ({
    props: args,
    template: `
      <lc-drawer [open]="open" [position]="position" [size]="size" [heading]="heading">
        <div style="padding: 8px;">
          <div style="display: flex; flex-direction: column; gap: 4px;">
            <a style="display: block; padding: 8px 12px; border-radius: 6px; background: #eff6ff; color: #1d4ed8; text-decoration: none; font-size: 14px;">Dashboard</a>
            <a style="display: block; padding: 8px 12px; border-radius: 6px; color: var(--color-text-primary); text-decoration: none; font-size: 14px;">Projects</a>
            <a style="display: block; padding: 8px 12px; border-radius: 6px; color: var(--color-text-primary); text-decoration: none; font-size: 14px;">Team</a>
            <a style="display: block; padding: 8px 12px; border-radius: 6px; color: var(--color-text-primary); text-decoration: none; font-size: 14px;">Reports</a>
            <a style="display: block; padding: 8px 12px; border-radius: 6px; color: var(--color-text-primary); text-decoration: none; font-size: 14px;">Settings</a>
          </div>
        </div>
      </lc-drawer>`,
  }),
};

export const FilterPanel: Story = {
  parameters: {
    docs: { description: { story: 'Common pattern: a filter drawer for table/list views.' } },
  },
  args: { open: true, position: 'right', size: 'sm', heading: 'Filters' },
  render: (args) => ({
    props: args,
    template: `
      <lc-drawer [open]="open" [position]="position" [size]="size" [heading]="heading">
        <div style="padding: 16px; display: flex; flex-direction: column; gap: 16px;">
          <lc-select label="Status" placeholder="All statuses" [options]="[{value:'active', label:'Active'}, {value:'inactive', label:'Inactive'}, {value:'pending', label:'Pending'}]"></lc-select>
          <lc-select label="Role" placeholder="All roles" [options]="[{value:'admin', label:'Admin'}, {value:'editor', label:'Editor'}, {value:'viewer', label:'Viewer'}]"></lc-select>
          <lc-input label="Search" placeholder="Filter by name..." iconBefore="magnifying-glass"></lc-input>
          <div style="display: flex; gap: 8px; margin-top: 8px;">
            <lc-button variant="outline" [fullWidth]="true">Reset</lc-button>
            <lc-button variant="primary" [fullWidth]="true">Apply</lc-button>
          </div>
        </div>
      </lc-drawer>`,
  }),
};

export const LargeForm: Story = {
  parameters: {
    docs: { description: { story: 'Large drawer with a full form for detail editing.' } },
  },
  args: { open: true, position: 'right', size: 'lg', heading: 'Create New Project' },
  render: (args) => ({
    props: args,
    template: `
      <lc-drawer [open]="open" [position]="position" [size]="size" [heading]="heading">
        <div style="padding: 16px; display: flex; flex-direction: column; gap: 16px;">
          <lc-input label="Project Name" placeholder="My New Project" [required]="true"></lc-input>
          <lc-input label="Description" placeholder="A brief description of the project..."></lc-input>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px;">
            <lc-select label="Priority" placeholder="Select..." [options]="[{value:'low', label:'Low'}, {value:'medium', label:'Medium'}, {value:'high', label:'High'}]"></lc-select>
            <lc-select label="Category" placeholder="Select..." [options]="[{value:'dev', label:'Development'}, {value:'design', label:'Design'}, {value:'marketing', label:'Marketing'}]"></lc-select>
          </div>
          <lc-checkbox label="Make this project public"></lc-checkbox>
          <div style="display: flex; gap: 8px; justify-content: flex-end; margin-top: 16px; padding-top: 16px; border-top: 1px solid #e5e7eb;">
            <lc-button variant="ghost">Cancel</lc-button>
            <lc-button variant="primary">Create Project</lc-button>
          </div>
        </div>
      </lc-drawer>`,
  }),
};

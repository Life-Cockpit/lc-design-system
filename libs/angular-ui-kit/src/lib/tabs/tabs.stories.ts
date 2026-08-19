import type { Meta, StoryObj } from '@storybook/angular';
import { fn, expect, userEvent, within } from 'storybook/test';
import { TabsComponent } from './tabs.component';

// `selectedIndex` is a model(); its `selectedIndexChange` output binding exists on
// the component but not as a class property, so Storybook's inferred arg type has
// to be widened for the action.
type TabsArgs = TabsComponent & { selectedIndexChange: (index: number) => void };

const meta: Meta<TabsArgs> = {
  title: 'Navigation/Tabs',
  component: TabsComponent,
  args: {
    selectedIndexChange: fn(),
  },
  parameters: {
    docs: {
      description: {
        component: `
The Tabs component organizes content into switchable panels.
Use it for settings pages, multi-section views, and content categorization.

**Key Features:**
- Horizontal and vertical orientation
- Icon support per tab
- Badge support per tab (counts or status labels)
- Disabled tabs
- Lazy content rendering
- Two-way selection binding via \`[(selectedIndex)]\`
- Keyboard navigation (arrow keys, Home, End) moves focus and selection together
- Tabs added or removed at runtime (e.g. via \`@for\`) are picked up automatically
        `,
      },
    },
  },
  argTypes: {
    orientation: {
      control: 'select',
      options: ['horizontal', 'vertical'],
      description: 'Tab bar direction',
      table: { defaultValue: { summary: 'horizontal' } },
    },
    selectedIndex: {
      control: 'number',
      description: 'Selected tab index (two-way bindable)',
      table: { defaultValue: { summary: '0' } },
    },
    selectedIndexChange: { action: 'selectedIndexChange', description: 'Emitted when a tab is selected (index)' },
  },
};

export default meta;
type Story = StoryObj<TabsArgs>;

export const Default: Story = {
  render: (args) => ({
    props: args,
    template: `
      <lc-tabs (selectedIndexChange)="selectedIndexChange($event)">
        <lc-tab label="Overview">
          <div style="padding: 16px;">
            <h3 style="margin: 0 0 8px; font-size: 16px; font-weight: 600;">Project Overview</h3>
            <p style="margin: 0; font-size: 14px; color: var(--color-text-secondary); line-height: 1.6;">
              This project is currently in the development phase. The team has completed 12 of 15 tasks
              for this sprint. Overall progress is at 75% with an expected completion date of May 15, 2026.
            </p>
          </div>
        </lc-tab>
        <lc-tab label="Activity">
          <div style="padding: 16px;">
            <h3 style="margin: 0 0 12px; font-size: 16px; font-weight: 600;">Recent Activity</h3>
            <div style="display: flex; flex-direction: column; gap: 12px; font-size: 14px;">
              <div style="display: flex; gap: 8px; color: var(--color-text-secondary);">
                <span style="color: var(--color-text-tertiary); min-width: 60px;">2h ago</span>
                <span>Alice pushed 3 commits to <strong>feature/auth</strong></span>
              </div>
              <div style="display: flex; gap: 8px; color: var(--color-text-secondary);">
                <span style="color: var(--color-text-tertiary); min-width: 60px;">5h ago</span>
                <span>Bob closed issue <strong>#142</strong></span>
              </div>
              <div style="display: flex; gap: 8px; color: var(--color-text-secondary);">
                <span style="color: var(--color-text-tertiary); min-width: 60px;">1d ago</span>
                <span>Carol merged PR <strong>#89</strong></span>
              </div>
            </div>
          </div>
        </lc-tab>
        <lc-tab label="Settings" icon="cog-6-tooth">
          <div style="padding: 16px;">
            <h3 style="margin: 0 0 12px; font-size: 16px; font-weight: 600;">Project Settings</h3>
            <div style="display: flex; flex-direction: column; gap: 12px; max-width: 400px;">
              <lc-input label="Project Name" placeholder="My Project"></lc-input>
              <lc-select label="Visibility" placeholder="Select..." [options]="[{value: 'public', label: 'Public'}, {value: 'private', label: 'Private'}]"></lc-select>
            </div>
          </div>
        </lc-tab>
      </lc-tabs>`,
  }),
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    const activityTab = canvas.getByRole('tab', { name: /activity/i });
    await userEvent.click(activityTab);
    await expect(args['selectedIndexChange']).toHaveBeenCalledWith(1);
  },
};

export const WithIcons: Story = {
  parameters: {
    docs: { description: { story: 'Tabs with leading icons for visual context.' } },
  },
  render: () => ({
    template: `
      <lc-tabs>
        <lc-tab label="Dashboard" icon="home">
          <div style="padding: 16px;">
            <p style="margin: 0; color: var(--color-text-secondary);">Dashboard content with analytics and metrics.</p>
          </div>
        </lc-tab>
        <lc-tab label="Users" icon="users">
          <div style="padding: 16px;">
            <p style="margin: 0; color: var(--color-text-secondary);">User management and team members.</p>
          </div>
        </lc-tab>
        <lc-tab label="Settings" icon="cog-6-tooth">
          <div style="padding: 16px;">
            <p style="margin: 0; color: var(--color-text-secondary);">Application configuration.</p>
          </div>
        </lc-tab>
      </lc-tabs>`,
  }),
};

export const WithBadges: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'Tabs with badges for counts or status. Set content via `badge` and the color via `badgeVariant` (`default`, `primary`, `success`, `warning`, `error`, `info`).',
      },
    },
  },
  render: () => ({
    template: `
      <lc-tabs>
        <lc-tab label="Inbox" [badge]="12" badgeVariant="primary">
          <p style="padding: 16px; margin: 0; color: var(--color-text-secondary);">12 unread messages.</p>
        </lc-tab>
        <lc-tab label="Drafts" [badge]="3">
          <p style="padding: 16px; margin: 0; color: var(--color-text-secondary);">3 drafts pending.</p>
        </lc-tab>
        <lc-tab label="Errors" [badge]="2" badgeVariant="error">
          <p style="padding: 16px; margin: 0; color: var(--color-text-secondary);">2 failed deliveries.</p>
        </lc-tab>
        <lc-tab label="Updates" badge="New" badgeVariant="success">
          <p style="padding: 16px; margin: 0; color: var(--color-text-secondary);">Fresh product updates.</p>
        </lc-tab>
        <lc-tab label="Archive">
          <p style="padding: 16px; margin: 0; color: var(--color-text-secondary);">Archived conversations.</p>
        </lc-tab>
      </lc-tabs>`,
  }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const inboxTab = canvas.getByRole('tab', { name: /inbox/i });
    await expect(inboxTab).toHaveTextContent('12');
  },
};

export const Vertical: Story = {
  parameters: {
    docs: { description: { story: 'Vertical tabs work well for settings pages with many sections.' } },
  },
  render: () => ({
    template: `
      <lc-tabs orientation="vertical">
        <lc-tab label="General" icon="identification">
          <div style="padding: 16px; max-width: 400px;">
            <h3 style="margin: 0 0 16px; font-size: 16px; font-weight: 600;">General Settings</h3>
            <div style="display: flex; flex-direction: column; gap: 12px;">
              <lc-input label="Display Name" placeholder="John Doe"></lc-input>
              <lc-input label="Email" type="email" placeholder="john@example.com"></lc-input>
            </div>
          </div>
        </lc-tab>
        <lc-tab label="Security" icon="shield-check">
          <div style="padding: 16px; max-width: 400px;">
            <h3 style="margin: 0 0 16px; font-size: 16px; font-weight: 600;">Security</h3>
            <div style="display: flex; flex-direction: column; gap: 12px;">
              <lc-input label="Current Password" type="password" placeholder="••••••••"></lc-input>
              <lc-input label="New Password" type="password" placeholder="••••••••"></lc-input>
            </div>
          </div>
        </lc-tab>
        <lc-tab label="Notifications" icon="bell">
          <div style="padding: 16px;">
            <h3 style="margin: 0 0 16px; font-size: 16px; font-weight: 600;">Notifications</h3>
            <div style="display: flex; flex-direction: column; gap: 8px;">
              <lc-checkbox label="Email notifications"></lc-checkbox>
              <lc-checkbox label="Push notifications"></lc-checkbox>
              <lc-checkbox label="Weekly digest"></lc-checkbox>
            </div>
          </div>
        </lc-tab>
        <lc-tab label="Billing" icon="credit-card">
          <div style="padding: 16px;">
            <h3 style="margin: 0 0 8px; font-size: 16px; font-weight: 600;">Billing</h3>
            <p style="margin: 0; font-size: 14px; color: var(--color-text-secondary);">Current plan: Pro ($29/month)</p>
          </div>
        </lc-tab>
      </lc-tabs>`,
  }),
};

export const WithDisabledTab: Story = {
  render: () => ({
    template: `
      <lc-tabs>
        <lc-tab label="Published">
          <p style="padding: 16px; margin: 0; color: var(--color-text-secondary);">Published content visible to everyone.</p>
        </lc-tab>
        <lc-tab label="Drafts">
          <p style="padding: 16px; margin: 0; color: var(--color-text-secondary);">Your unpublished drafts.</p>
        </lc-tab>
        <lc-tab label="Analytics" [disabled]="true">
          <p style="padding: 16px; margin: 0; color: var(--color-text-secondary);">Upgrade to Pro for analytics.</p>
        </lc-tab>
      </lc-tabs>`,
  }),
};

import type { Meta, StoryObj } from '@storybook/angular';
import { ListComponent } from './list.component';

/**
 * Lists display structured item collections with rich content support.
 * Each item can have an avatar or icon, label with subtitle and description,
 * trailing badges, metadata, and action buttons. Supports card and default
 * variants, size options, selected state and optional dividers.
 */
const meta: Meta<ListComponent> = {
  title: 'Data Display/List',
  component: ListComponent,
  argTypes: {
    orientation: {
      control: 'select',
      options: ['vertical', 'horizontal'],
      description: 'Layout direction of list items',
    },
    variant: {
      control: 'select',
      options: ['default', 'card'],
      description: 'Visual style — default is flat, card adds background and shadow',
    },
    size: {
      control: 'select',
      options: ['sm', 'md', 'lg'],
      description: 'Size of list items — sm is compact, lg is spacious',
    },
    showDividers: { description: 'Show separator lines between items' },
  },

  parameters: {
    docs: {
      description: {
        component: `
List component for displaying structured item collections.

**Key Features:**
- Vertical and horizontal layout orientations
- Variant styles (default, card)
- Three sizes (sm, md, lg)
- Optional dividers between items
- Avatar support (image URL or initials)
- Subtitle and description lines
- Trailing badges with color variants
- Metadata text (dates, sizes, counts)
- Action buttons with click events
- Selected/highlighted state
- Accessible with ARIA list role
`,
      },
    },
  },
};

export default meta;
type Story = StoryObj<ListComponent>;

export const Default: Story = {
  args: {
    items: [
      { label: 'Dashboard', icon: 'home' },
      { label: 'Projects', icon: 'folder' },
      { label: 'Team Members', icon: 'users' },
      { label: 'Settings', icon: 'cog-6-tooth' },
    ],
    variant: 'default',
    showDividers: true,
  },
};

export const CardVariant: Story = {
  name: 'Card Variant',
  args: {
    items: [
      { label: 'Quarterly Report', icon: 'document' },
      { label: 'Team Meeting Notes', icon: 'document' },
      { label: 'Product Roadmap', icon: 'document' },
    ],
    variant: 'card',
    showDividers: true,
  },
};

export const WithActions: Story = {
  name: 'With Action Buttons',
  args: {
    items: [
      { label: 'main-branch.yml', icon: 'document', action: 'View' },
      { label: 'deploy-staging.yml', icon: 'document', action: 'View' },
      { label: 'nightly-tests.yml', icon: 'document', action: 'View' },
    ],
    variant: 'default',
    showDividers: true,
  },
};

export const Horizontal: Story = {
  args: {
    items: [
      { label: 'Overview', icon: 'home' },
      { label: 'Analytics', icon: 'chart-bar' },
      { label: 'Reports', icon: 'document' },
      { label: 'Settings', icon: 'cog-6-tooth' },
    ],
    orientation: 'horizontal',
    variant: 'default',
  },
};

export const WithDisabled: Story = {
  name: 'With Disabled Items',
  args: {
    items: [
      { label: 'Active Feature', icon: 'check-circle' },
      { label: 'Beta Feature', icon: 'flask' },
      { label: 'Coming Soon', icon: 'lock-closed', disabled: true },
      { label: 'Deprecated', icon: 'x-circle', disabled: true },
    ],
    variant: 'default',
    showDividers: true,
  },
};

export const SettingsMenu: Story = {
  name: 'Settings Menu (Composition)',
  args: {
    items: [
      { label: 'General', icon: 'cog-6-tooth', action: '›' },
      { label: 'Notifications', icon: 'bell', action: '›' },
      { label: 'Privacy & Security', icon: 'shield-check', action: '›' },
      { label: 'Billing', icon: 'credit-card', action: '›' },
      { label: 'Integrations', icon: 'puzzle-piece', action: '›' },
      { label: 'Delete Account', icon: 'trash' },
    ],
    variant: 'card',
    showDividers: true,
  },
};

export const WithSubtitles: Story = {
  name: 'With Subtitles',
  args: {
    items: [
      { label: 'Dashboard', subtitle: 'Overview of your projects', icon: 'home' },
      { label: 'Analytics', subtitle: 'Performance metrics & insights', icon: 'chart-bar' },
      { label: 'Team', subtitle: '12 members', icon: 'users' },
      { label: 'Settings', subtitle: 'Preferences & configuration', icon: 'cog-6-tooth' },
    ],
    showDividers: true,
  },
};

export const WithAvatars: Story = {
  name: 'With Avatars',
  args: {
    items: [
      { label: 'Anna Schmidt', subtitle: 'Product Designer', avatar: 'AS' },
      { label: 'Ben Weber', subtitle: 'Frontend Engineer', avatar: 'BW' },
      { label: 'Clara Müller', subtitle: 'Project Manager', avatar: 'CM' },
      { label: 'David Klein', subtitle: 'Backend Engineer', avatar: 'DK' },
    ],
    showDividers: true,
  },
};

export const WithBadges: Story = {
  name: 'With Badges',
  args: {
    items: [
      { label: 'Inbox', icon: 'inbox', badge: '24', badgeVariant: 'primary' },
      { label: 'Drafts', icon: 'document', badge: '3', badgeVariant: 'default' },
      { label: 'Sent', icon: 'paper-airplane', badge: '142', badgeVariant: 'success' },
      { label: 'Spam', icon: 'shield-exclamation', badge: '7', badgeVariant: 'error' },
    ],
    showDividers: true,
  },
};

export const WithMetadata: Story = {
  name: 'With Metadata',
  args: {
    items: [
      { label: 'quarterly-report.pdf', icon: 'document', metadata: '2.4 MB · Mar 15' },
      { label: 'team-photo.jpg', icon: 'photo', metadata: '4.1 MB · Mar 12' },
      { label: 'presentation.pptx', icon: 'presentation-chart-bar', metadata: '8.7 MB · Mar 10' },
      { label: 'notes.md', icon: 'document-text', metadata: '12 KB · Mar 8' },
    ],
    showDividers: true,
  },
};

export const RichItems: Story = {
  name: 'Rich Items',
  args: {
    items: [
      {
        label: 'Design System v2.0',
        subtitle: 'Component library refresh',
        description: 'Update all components to the new design tokens and add dark mode support.',
        avatar: 'DS',
        badge: 'In Progress',
        badgeVariant: 'warning' as const,
        metadata: 'Due Apr 30',
      },
      {
        label: 'API Integration',
        subtitle: 'Backend connectivity',
        description: 'Connect the frontend to the new REST API endpoints with proper error handling.',
        avatar: 'AI',
        badge: 'Done',
        badgeVariant: 'success' as const,
        metadata: 'Completed',
      },
      {
        label: 'User Testing',
        subtitle: 'UX validation',
        description: 'Conduct usability tests with 10 participants across three user personas.',
        avatar: 'UT',
        badge: 'Planned',
        badgeVariant: 'primary' as const,
        metadata: 'May 15',
      },
    ],
    showDividers: true,
    size: 'lg',
  },
};

export const ContactList: Story = {
  name: 'Contact List',
  args: {
    items: [
      {
        label: 'Emma Johnson',
        subtitle: 'emma.johnson@example.com',
        avatar: 'EJ',
        metadata: 'Online',
        action: 'Message',
      },
      {
        label: 'Liam Brown',
        subtitle: 'liam.brown@example.com',
        avatar: 'LB',
        metadata: 'Away',
        action: 'Message',
      },
      {
        label: 'Sophie Davis',
        subtitle: 'sophie.davis@example.com',
        avatar: 'SD',
        metadata: 'Offline',
        action: 'Message',
      },
    ],
    showDividers: true,
  },
};

export const NotificationList: Story = {
  name: 'Notification List',
  args: {
    items: [
      {
        label: 'New comment on your post',
        subtitle: 'Anna replied to your design review',
        icon: 'chat-bubble-left',
        badge: 'New',
        badgeVariant: 'primary' as const,
        metadata: '2 min ago',
        selected: true,
      },
      {
        label: 'Build succeeded',
        subtitle: 'Pipeline #1247 completed successfully',
        icon: 'check-circle',
        badge: 'Success',
        badgeVariant: 'success' as const,
        metadata: '15 min ago',
      },
      {
        label: 'Deployment failed',
        subtitle: 'Staging environment deployment error',
        icon: 'exclamation-triangle',
        badge: 'Error',
        badgeVariant: 'error' as const,
        metadata: '1 hour ago',
      },
    ],
    showDividers: true,
  },
};

export const SmallSize: Story = {
  name: 'Small Size',
  args: {
    items: [
      { label: 'Option A', subtitle: 'First option', icon: 'check' },
      { label: 'Option B', subtitle: 'Second option', icon: 'check' },
      { label: 'Option C', subtitle: 'Third option', icon: 'check', selected: true },
    ],
    size: 'sm',
    showDividers: true,
  },
};

export const LargeSize: Story = {
  name: 'Large Size',
  args: {
    items: [
      { label: 'Premium Plan', subtitle: '$29/month', description: 'Unlimited projects, priority support, and advanced analytics.', icon: 'star', badge: 'Popular', badgeVariant: 'primary' as const },
      { label: 'Business Plan', subtitle: '$79/month', description: 'Everything in Premium plus SSO, audit logs, and SLA.', icon: 'building-office', badge: 'Best Value', badgeVariant: 'success' as const },
      { label: 'Enterprise', subtitle: 'Custom pricing', description: 'Dedicated infrastructure, custom integrations, and 24/7 support.', icon: 'globe-alt', action: 'Contact Sales' },
    ],
    size: 'lg',
    showDividers: true,
  },
};

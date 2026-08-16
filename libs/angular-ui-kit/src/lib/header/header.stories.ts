import type { Meta, StoryObj } from '@storybook/angular';
import { moduleMetadata } from '@storybook/angular';
import { fn, expect, userEvent, within } from 'storybook/test';
import { HeaderComponent } from './header.component';
import { SidenavComponent } from '../sidenav/sidenav.component';

/**
 * The application header provides top-level navigation, branding, user info,
 * and quick actions. Typically placed at the very top of the page layout.
 * Supports hamburger menu, theme toggle, and user profile dropdown.
 */
const meta: Meta<HeaderComponent> = {
  title: 'Navigation/Header',
  component: HeaderComponent,
  args: {
    hamburgerClick: fn(),
    themeToggleClick: fn(),
    logoutClick: fn(),
    profileClick: fn(),
  },
  argTypes: {
    hamburgerClick: { action: 'hamburgerClick', description: 'Emitted when the hamburger menu is clicked' },
    themeToggleClick: { action: 'themeToggleClick', description: 'Emitted when the theme toggle is clicked' },
    logoutClick: { action: 'logoutClick', description: 'Emitted when logout is clicked' },
    profileClick: { action: 'profileClick', description: 'Emitted when the profile item is clicked' },
    title: { description: 'Application or page title' },
    subtitle: { description: 'Secondary text below the title' },
    logo: { description: 'URL to a logo image' },
    logoSize: {
      control: 'select',
      options: ['xs', 'sm', 'md', 'lg', 'xl'],
      description:
        'Size of the brand logo. The header grows automatically when set to `lg` (80px) or `xl` (112px) so the logo is never clipped.',
      table: { defaultValue: { summary: 'md' } },
    },
    size: {
      control: 'select',
      options: ['sm', 'md', 'lg', 'xl'],
      description:
        'Overall header height — useful to align the header with a sidebar brand block (`sm` 56px, `md` 64px, `lg` 80px, `xl` 112px).',
      table: { defaultValue: { summary: 'md' } },
    },
    userName: { description: 'Displayed user name (for the profile area)' },
    userEmail: { description: 'User email shown in the profile dropdown' },
    showHamburger: { description: 'Shows a hamburger menu button (for mobile/sidebar toggle)' },
    showThemeButton: { description: 'Shows a dark/light theme toggle button' },
    showProfileMenuItem: { description: 'Whether to show a "Profile" item in the user menu' },
    contextName: { description: 'Contextual name displayed in the header (e.g. tenant, organization, project)' },
    contextLabel: { description: 'Label displayed above the context name (e.g. "Tenant", "Organization", "Project")' },
    theme: {
      control: 'select',
      options: ['auto', 'light', 'dark'],
      description: 'Theme variant — sets internal tokens (--lc-header-bg, --lc-header-fg, etc.)',
    },
    menuSize: {
      control: 'select',
      options: ['sm', 'md', 'lg'],
      description: 'Size of the profile dropdown menu',
      table: { defaultValue: { summary: 'sm' } },
    },
  },

  parameters: {
    docs: {
      description: {
        component: `
AppHeaderComponent - Global application header for Life-Cockpit shell

**Key Features:**
- Clickable logo for home navigation
- Configurable brand logo size via \`logoSize\` (\`xs | sm | md | lg | xl\`);
  the header grows automatically for \`lg\` / \`xl\` so the logo isn't clipped.
  Set \`[showLogo]=\"false\"\` when the brand lives in the sidenav (sidebar-first layout).
- Overall header height via \`size\` (\`sm | md | lg | xl\`) — use this to align the header
  with a sidenav brand block (same height scale as \`lc-sidenav\` logo area).
- Optional title and subtitle display
- User profile dropdown with avatar, name, email, optional Profile link, and Logout
- Optional theme toggle button in header
- Hamburger menu toggle for the sidebar — rendered in a fixed-width slot flush
  with the header's left edge so the icon centers on the sidenav icon column
  (28px) in both the expanded and the collapsed state. The slot is constant,
  so nothing shifts when the sidenav toggles; override
  \`--lc-header-hamburger-slot\` only to match a custom \`--lc-sidenav-rail-width\`
- \`theme\` input (\`auto\` | \`light\` | \`dark\`) with internal CSS tokens
- Logo auto-adapts color to the header's theme
- OnPush change detection for performance

**Theming Tokens:** \`--lc-header-bg\`, \`--lc-header-fg\`, \`--lc-header-fg-secondary\`, \`--lc-header-border\`, \`--lc-header-hover-bg\`, \`--lc-header-trigger-border\`, \`--lc-header-trigger-fg\`
`,
      },
    },
  },
};

export default meta;
type Story = StoryObj<HeaderComponent>;

export const Default: Story = {
  args: { title: 'Life-Cockpit', subtitle: 'Design System', userName: 'Sarah Connor', userEmail: 'sarah@example.com' },
};

export const WithHamburger: Story = {
  name: 'With Hamburger Menu',
  args: { title: 'Life-Cockpit', subtitle: 'Dashboard', userName: 'Sarah Connor', userEmail: 'sarah@example.com', showHamburger: true },
};

export const AboveSidenav: Story = {
  name: 'Above a Sidenav (Aligned Hamburger)',
  parameters: {
    docs: {
      description: {
        story:
          'Header spanning above a docked sidenav. The hamburger sits in a fixed slot at the header\'s left edge, centered on the sidenav icon column (28px) — the same column in both the expanded nav and the collapsed rail. Toggle it: the sidenav changes width, but the hamburger, the header content beside it and the nav icons all stay exactly where they are.',
      },
    },
  },
  decorators: [moduleMetadata({ imports: [SidenavComponent] })],
  render: () => ({
    props: {
      collapsed: true,
      items: [
        { id: '1', icon: 'chart-bar', label: 'Cockpit', route: '/cockpit', displayOrder: 1 },
        { id: '2', icon: 'home', label: 'Factory', route: '/factory', displayOrder: 2 },
        { id: '3', icon: 'bell', label: 'Benachrichtigungen', route: '/notifications', displayOrder: 3 },
        { id: '4', icon: 'currency-dollar', label: 'Kosten', route: '/costs', displayOrder: 4 },
      ],
    },
    template: `
      <div style="display: flex; flex-direction: column; height: 480px; border: 1px solid var(--color-border);">
        <lc-header
          title="Life-Cockpit"
          [showHamburger]="true"
          userName="Sarah Connor"
          (hamburgerClick)="collapsed = !collapsed"
        ></lc-header>
        <div style="display: flex; flex: 1; min-height: 0;">
          <lc-sidenav
            mode="docked"
            [isOpen]="true"
            [collapsed]="collapsed"
            (collapsedChange)="collapsed = $event"
            [items]="items"
            activeRoute="/factory"
            width="280px"
          ></lc-sidenav>
          <div style="flex: 1; background: var(--color-background);"></div>
        </div>
      </div>`,
  }),
};

export const WithThemeToggle: Story = {
  name: 'With Theme Toggle',
  args: { title: 'Life-Cockpit', userName: 'Sarah Connor', userEmail: 'sarah@example.com', showThemeButton: true },
};

export const FullFeatured: Story = {
  name: 'All Options Enabled',
  args: { title: 'Life-Cockpit', subtitle: 'Project Dashboard', userName: 'Sarah Connor', userEmail: 'sarah@example.com', showHamburger: true, showThemeButton: true, showProfileMenuItem: true, contextName: 'Acme Corp', contextLabel: 'Tenant' },
};

export const Minimal: Story = {
  name: 'Minimal (Title Only)',
  args: { title: 'My App' },
};

export const WithLongTitle: Story = {
  name: 'Long Title & Subtitle',
  args: { title: 'Enterprise Resource Management Platform', subtitle: 'Human Resources Department', userName: 'Administrator', userEmail: 'admin@company.com' },
};

export const DarkTheme: Story = {
  name: 'Dark Theme',
  args: {
    title: 'Life-Cockpit',
    subtitle: 'Design System',
    userName: 'Sarah Connor',
    userEmail: 'sarah@example.com',
    showThemeButton: true,
    theme: 'dark',
  },
};

export const LightThemeExplicit: Story = {
  name: 'Light Theme (Explicit)',
  args: {
    title: 'Life-Cockpit',
    subtitle: 'Dashboard',
    userName: 'Sarah Connor',
    userEmail: 'sarah@example.com',
    theme: 'light',
  },
};

export const WithOrgInfo: Story = {
  name: 'With Context Info (Organization)',
  args: {
    title: 'Life-Cockpit',
    subtitle: 'Dashboard',
    userName: 'Sarah Connor',
    userEmail: 'sarah@example.com',
    contextName: 'Acme Corporation',
    contextLabel: 'Organization',
  },
};

export const WithTenantInfo: Story = {
  name: 'With Context Info (Tenant)',
  args: {
    title: 'Life-Cockpit',
    userName: 'Sarah Connor',
    userEmail: 'sarah@example.com',
    contextName: 'Production',
    contextLabel: 'Tenant',
    showThemeButton: true,
  },
};

export const WithOrgNameOnly: Story = {
  name: 'Context Name Without Label',
  args: {
    title: 'Life-Cockpit',
    userName: 'Sarah Connor',
    userEmail: 'sarah@example.com',
    contextName: 'Acme Corp',
  },
};

export const LogoSizes: Story = {
  name: 'Logo Sizes',
  parameters: {
    docs: {
      description: {
        story:
          'The brand logo size can be controlled via the `logoSize` input (`xs | sm | md | lg | xl`). The header grows automatically for `lg` and `xl` so the logo never gets clipped.',
      },
    },
  },
  render: () => ({
    template: `
      <div style="display: flex; flex-direction: column; gap: 12px;">
        @for (size of sizes; track size) {
          <div>
            <div style="font-size: 12px; color: #6b7280; margin: 0 24px 4px;">logoSize="{{ size }}"</div>
            <lc-header
              title="Life-Cockpit"
              subtitle="Design System"
              [logoSize]="size"
              userName="Sarah Connor"
              userEmail="sarah@example.com"
            ></lc-header>
          </div>
        }
      </div>`,
    props: { sizes: ['xs', 'sm', 'md', 'lg', 'xl'] as const },
  }),
};

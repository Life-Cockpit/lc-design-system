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
    subtitle: {
      description:
        'Secondary text below the title (e.g. a household name), shown as typed: one line, cut with "…" when it does not fit; the full text is its `title` attribute and stays readable for screen readers. `--lc-header-subtitle-max-width` caps it',
    },
    variant: {
      control: 'select',
      options: ['default', 'transparent'],
      description:
        '`default`: the bar on `--color-surface` with a bottom border. `transparent`: no background, no border — the header sits on the page; pair it with `[sticky]="false"`',
      table: { defaultValue: { summary: 'default' } },
    },
    userMenuTrigger: {
      control: 'select',
      options: ['icon', 'avatar'],
      description:
        'What the account button shows: `icon` (user icon and chevron, at least 44 px high) or `avatar` (the initials of `userName` in a 48 px round button; the avatar is decorative, the button is named by `userMenuAriaLabel`)',
      table: { defaultValue: { summary: 'icon' } },
    },
    userAvatarSrc: {
      description: 'Photo for the account avatar (trigger and menu header); the initials show when empty or broken',
      table: { defaultValue: { summary: "''" } },
    },
    userAvatarColor: {
      control: 'select',
      options: ['default', 'member-1', 'member-2', 'member-3', 'member-4', 'member-5', 'member-6'],
      description: 'Colour of the account avatar: `default` or a member colour `member-1` … `member-6` (white initials)',
      table: { defaultValue: { summary: 'default' } },
    },
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
    userName: { description: 'Displayed user name (menu header; initials of the avatar trigger). Wraps in the menu, never cut' },
    userEmail: { description: 'User email shown in the profile dropdown. Wraps anywhere, never cut; the menu is at most `min(18rem, 100vw − 2rem)` wide' },
    showHamburger: { description: 'Shows a hamburger menu button (for mobile/sidebar toggle)' },
    sidenavOpen: {
      control: 'boolean',
      description:
        'Open state of the sidenav the hamburger controls — reflected as `aria-expanded` on the toggle. Leave unset when the header does not know it.',
    },
    sidenavId: { description: 'DOM id of the controlled sidenav (`aria-controls` on the hamburger)' },
    showThemeButton: { description: 'Shows a dark/light theme toggle button' },
    autoToggleTheme: {
      control: 'boolean',
      description:
        'Whether the theme button toggles the ThemeService itself before emitting `themeToggleClick`. Set to `false` when the app toggles in the handler.',
      table: { defaultValue: { summary: 'true' } },
    },
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
    showUserMenu: {
      control: 'boolean',
      description: 'Render the account menu (avatar trigger with Profile / Logout)',
      table: { defaultValue: { summary: 'true' } },
    },
    homeHref: {
      description:
        'Plain URL for the brand link. When set the brand is a native `<a href>` (no router needed); empty keeps `routerLink="/"`',
      table: { defaultValue: { summary: "''" } },
    },
    navItems: {
      control: 'object',
      description:
        'Main navigation `{ label, href, current? }[]` → `<nav aria-label><ul><li><a href>`; `current` sets `aria-current="page"`. Below 1024 px the nav takes a second, wrapping row',
    },
    navAriaLabel: { description: 'Accessible name of the `<nav>`', table: { defaultValue: { summary: 'Main navigation' } } },
    titleTag: {
      control: 'select',
      options: ['h1', 'h2', 'h3', 'p', 'span', 'div'],
      description: 'Element for the title — use `span` when the page has its own `<h1>`',
      table: { defaultValue: { summary: 'h1' } },
    },
    sticky: {
      control: 'boolean',
      description: 'Keep the header at the top while scrolling',
      table: { defaultValue: { summary: 'true' } },
    },
    homeAriaLabel: { description: 'Accessible name of the brand link', table: { defaultValue: { summary: 'Go to home' } } },
    hamburgerAriaLabel: { description: 'Accessible name of the hamburger', table: { defaultValue: { summary: 'Toggle sidebar menu' } } },
    userMenuAriaLabel: { description: 'Accessible name of the account menu trigger', table: { defaultValue: { summary: 'Open user menu' } } },
    themeToDarkAriaLabel: { description: 'Theme button label in the light theme', table: { defaultValue: { summary: 'Switch to dark mode' } } },
    themeToLightAriaLabel: { description: 'Theme button label in the dark theme', table: { defaultValue: { summary: 'Switch to light mode' } } },
    contextAriaLabel: { description: 'Accessible name of the context button', table: { defaultValue: { summary: 'Context info' } } },
    profileLabel: { description: 'Label of the Profile menu entry', table: { defaultValue: { summary: 'Profile' } } },
    logoutLabel: { description: 'Label of the Logout menu entry', table: { defaultValue: { summary: 'Logout' } } },
  },

  parameters: {
    docs: {
      description: {
        component: `
AppHeaderComponent - Global application header for the LifeCorner shell

**Key Features:**
- Clickable logo for home navigation
- Configurable brand logo size via \`logoSize\` (\`xs | sm | md | lg | xl\`);
  the header grows automatically for \`lg\` / \`xl\` so the logo isn't clipped.
  Set \`[showLogo]="false"\` when the brand lives in the sidenav (sidebar-first layout).
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

**Public, prerendered sites** (see the *Public Site* stories):
- \`homeHref\` — the brand becomes a plain \`<a href>\`; no router and no JavaScript needed.
- \`navItems\` (\`{ label, href, current? }[]\`) — rendered as
  \`<nav aria-label="…"><ul><li><a href aria-current="page">\`; the current page is
  marked by an underline as well as by color. From 1024 px the nav sits in the bar;
  below it takes a second row and wraps, links are 44 px high. Label: \`navAriaLabel\`.
- \`[slot='end']\` — content at the end of the first row, e.g. a language link
  (\`<a slot="end" lcButton variant="ghost" hreflang="en" lang="en">\`). DOM and focus
  order: brand → nav → end slot.
- \`showUserMenu\` (default \`true\`) hides the account menu, \`titleTag\` renders the
  title as \`h1 | h2 | h3 | p | span | div\` (default \`h1\`), \`sticky\` (default
  \`true\`) can be switched off.
- The \`ThemeService\` — which reads and writes the theme class and \`localStorage\` —
  is only created when \`showThemeButton\` is on.

**App shell ("Weite", 3.3)** (see the *App Shell* stories):
- \`variant="transparent"\` — no background and no border; use it with \`[sticky]="false"\`.
- \`userMenuTrigger="avatar"\` — the account button is the person's initials avatar
  (\`userAvatarColor\`, \`userAvatarSrc\`) in a 48 px round button; the icon trigger is
  44 px high in every density.
- The subtitle is one line with "…", its full text in \`title\`, shown as typed.
- The account menu is at most \`min(18rem, 100vw − 2rem)\` wide; name and email wrap.

**Labels** (English defaults, one input each): \`homeAriaLabel\`, \`hamburgerAriaLabel\`,
\`userMenuAriaLabel\`, \`navAriaLabel\`, \`themeToDarkAriaLabel\`, \`themeToLightAriaLabel\`,
\`contextAriaLabel\`, \`profileLabel\`, \`logoutLabel\`.

**Theming Tokens:** \`--lc-header-bg\`, \`--lc-header-fg\`, \`--lc-header-fg-secondary\`, \`--lc-header-border\`, \`--lc-header-hover-bg\`, \`--lc-header-trigger-border\`, \`--lc-header-trigger-fg\`
`,
      },
    },
  },
};

export default meta;
type Story = StoryObj<HeaderComponent>;

export const Default: Story = {
  args: { title: 'LifeCorner', subtitle: 'Design System', userName: 'Sarah Connor', userEmail: 'sarah@example.com' },
};

export const WithHamburger: Story = {
  name: 'With Hamburger Menu',
  args: { title: 'LifeCorner', subtitle: 'Dashboard', userName: 'Sarah Connor', userEmail: 'sarah@example.com', showHamburger: true },
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
        { id: '1', icon: 'chart-bar', label: 'Dashboard', route: '/dashboard', displayOrder: 1 },
        { id: '2', icon: 'home', label: 'Projects', route: '/projects', displayOrder: 2 },
        { id: '3', icon: 'bell', label: 'Benachrichtigungen', route: '/notifications', displayOrder: 3 },
        { id: '4', icon: 'currency-dollar', label: 'Kosten', route: '/costs', displayOrder: 4 },
      ],
    },
    template: `
      <div style="display: flex; flex-direction: column; height: 480px; border: 1px solid var(--color-border);">
        <lc-header
          title="LifeCorner"
          [showHamburger]="true"
          [sidenavOpen]="!collapsed"
          sidenavId="story-sidenav"
          userName="Sarah Connor"
          (hamburgerClick)="collapsed = !collapsed"
        ></lc-header>
        <div style="display: flex; flex: 1; min-height: 0;">
          <lc-sidenav
            id="story-sidenav"
            mode="docked"
            [isOpen]="true"
            [collapsed]="collapsed"
            (collapsedChange)="collapsed = $event"
            [items]="items"
            activeRoute="/projects"
            width="280px"
          ></lc-sidenav>
          <div style="flex: 1; background: var(--color-background);"></div>
        </div>
      </div>`,
  }),
};

export const WithThemeToggle: Story = {
  name: 'With Theme Toggle',
  args: { title: 'LifeCorner', userName: 'Sarah Connor', userEmail: 'sarah@example.com', showThemeButton: true },
};

export const FullFeatured: Story = {
  name: 'All Options Enabled',
  args: { title: 'LifeCorner', subtitle: 'Project Dashboard', userName: 'Sarah Connor', userEmail: 'sarah@example.com', showHamburger: true, showThemeButton: true, showProfileMenuItem: true, contextName: 'Acme Corp', contextLabel: 'Tenant' },
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
    title: 'LifeCorner',
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
    title: 'LifeCorner',
    subtitle: 'Dashboard',
    userName: 'Sarah Connor',
    userEmail: 'sarah@example.com',
    theme: 'light',
  },
};

export const WithOrgInfo: Story = {
  name: 'With Context Info (Organization)',
  args: {
    title: 'LifeCorner',
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
    title: 'LifeCorner',
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
    title: 'LifeCorner',
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
            <div style="font-size: 12px; color: var(--color-text-secondary); margin: 0 24px 4px;">logoSize="{{ size }}"</div>
            <lc-header
              title="LifeCorner"
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

const publicNav = [
  { label: 'Sicherheit', href: '#sicherheit', current: true },
  { label: 'So bauen wir', href: '#so-bauen-wir' },
  { label: 'Roadmap', href: '#roadmap' },
];

export const PublicSite: Story = {
  name: 'Public Site (no router, labelled nav, end slot)',
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        story:
          'Frame of a static, prerendered website: plain home link (`homeHref`), labelled main navigation with the current page marked, a language link in `[slot=\'end\']`, no account menu, no sticky position and no `<h1>` in the header. Nothing here needs JavaScript. Resize below 1024 px to see the nav move to its own wrapping row.',
      },
    },
  },
  render: () => ({
    props: { navItems: publicNav },
    template: `
      <lc-header
        size="sm"
        [sticky]="false"
        [showUserMenu]="false"
        homeHref="#start"
        homeAriaLabel="Produkt – Startseite"
        navAriaLabel="Hauptnavigation"
        [navItems]="navItems"
      >
        <a slot="end" lcButton variant="ghost" href="#en" hreflang="en" lang="en"
           aria-label="Open this page in English">English</a>
      </lc-header>`,
  }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const nav = canvas.getByRole('navigation', { name: 'Hauptnavigation' });
    await expect(within(nav).getByRole('link', { name: 'Sicherheit' }).getAttribute('aria-current')).toBe('page');
    await expect(canvas.getByRole('link', { name: 'Produkt – Startseite' }).getAttribute('href')).toBe('#start');
    await expect(canvasElement.querySelector('h1')).toBeNull();
  },
};

export const PublicSitePhone: Story = {
  name: 'Public Site on a Phone (two rows)',
  // The breakpoint is the viewport (1024 px), so this story opens in the mobile
  // viewport; in the docs page it renders at the page width.
  globals: { viewport: { value: 'mobile1', isRotated: false } },
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        story:
          'Below a 1024 px viewport the navigation takes a second row under brand and language link and wraps when the labels do not fit. Open the story in the canvas (mobile viewport) to see it.',
      },
    },
  },
  render: () => ({
    props: { navItems: [...publicNav, { label: 'Neuigkeiten', href: '#neuigkeiten' }] },
    template: `
      <lc-header size="sm" [sticky]="false" [showUserMenu]="false" homeHref="#start"
                 homeAriaLabel="Produkt – Startseite" navAriaLabel="Hauptnavigation" [navItems]="navItems">
        <a slot="end" lcButton variant="ghost" href="#en" hreflang="en" lang="en">English</a>
      </lc-header>`,
  }),
};

export const TranslatedLabels: Story = {
  name: 'Translated Labels',
  parameters: {
    docs: {
      description: {
        story: 'Every built-in label is an input; the defaults stay English.',
      },
    },
  },
  args: {
    title: 'LifeCorner',
    titleTag: 'span',
    userName: 'Sarah Connor',
    userEmail: 'sarah@example.com',
    showHamburger: true,
    showThemeButton: true,
    homeAriaLabel: 'Zur Startseite',
    hamburgerAriaLabel: 'Seitenleiste ein- oder ausblenden',
    userMenuAriaLabel: 'Benutzermenü öffnen',
    themeToDarkAriaLabel: 'Zum dunklen Design wechseln',
    themeToLightAriaLabel: 'Zum hellen Design wechseln',
    profileLabel: 'Profil',
    logoutLabel: 'Abmelden',
  },
};

/** Household frame on a phone ("Weite"): transparent header, long household name, the member's initials avatar. */
export const AppShellPhone: Story = {
  name: 'App Shell on a Phone (transparent, avatar)',
  parameters: {
    docs: {
      description: {
        story:
          'The header on the page: no surface, no border, not sticky. The household name ends with "…" (hover shows it in full); the account button is the initials avatar in the member colour, named "Menü für …". Open the menu: the 49-character name and the 42-character email wrap in a menu that stays inside the 360 px screen.',
      },
    },
  },
  args: {
    title: 'Produkt',
    titleTag: 'span',
    subtitle: 'Familie Apfelbaum-Kieselbacher-Morgentau',
    size: 'sm',
    logoSize: 'sm',
    variant: 'transparent',
    sticky: false,
    userMenuTrigger: 'avatar',
    userAvatarColor: 'member-1',
    userName: 'Johanna-Friederike Apfelbaum-Kieselbacher-Morgentau',
    userEmail: 'johanna.apfelbaum-kieselbacher@example.org',
    userMenuAriaLabel: 'Menü für Johanna-Friederike Apfelbaum-Kieselbacher-Morgentau',
    menuSize: 'md',
    profileLabel: 'Einstellungen',
    logoutLabel: 'Abmelden',
    homeAriaLabel: 'Produkt – Startseite',
  },
  render: (args) => ({
    props: args,
    template: `
      <div style="width: 360px; height: 420px; background: var(--color-background); border: 1px solid var(--color-border); border-radius: 12px;">
        <lc-header
          [title]="title" [titleTag]="titleTag" [subtitle]="subtitle" [size]="size" [logoSize]="logoSize"
          [variant]="variant" [sticky]="sticky" [userMenuTrigger]="userMenuTrigger" [userAvatarColor]="userAvatarColor"
          [userName]="userName" [userEmail]="userEmail" [userMenuAriaLabel]="userMenuAriaLabel" [menuSize]="menuSize"
          [profileLabel]="profileLabel" [logoutLabel]="logoutLabel" [homeAriaLabel]="homeAriaLabel"
          (profileClick)="profileClick()" (logoutClick)="logoutClick()" />
      </div>`,
  }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const trigger = canvas.getByRole('button', { name: /^Menü für/ });
    await userEvent.click(trigger);
    await expect(canvas.getByRole('menu')).toBeTruthy();
    const name = canvasElement.querySelector('.lc-header__menu-user-name') as HTMLElement;
    await expect(name.textContent?.trim()).toBe('Johanna-Friederike Apfelbaum-Kieselbacher-Morgentau');
  },
};

/** The same header from 1024 px: `size="md"`, the subtitle has room. */
export const AppShellDesktop: Story = {
  name: 'App Shell on Desktop (transparent, avatar)',
  args: {
    title: 'Produkt',
    titleTag: 'span',
    subtitle: 'Unser Haushalt',
    size: 'md',
    variant: 'transparent',
    sticky: false,
    userMenuTrigger: 'avatar',
    userAvatarColor: 'member-2',
    userName: 'Tom Ek',
    userEmail: 'tom@example.org',
    userMenuAriaLabel: 'Menü für Tom Ek',
    menuSize: 'md',
    profileLabel: 'Einstellungen',
    logoutLabel: 'Abmelden',
  },
};


import type { Meta, StoryObj } from '@storybook/angular';
import { moduleMetadata } from '@storybook/angular';
import type { NavigationItem } from '@lifecorner/angular-ui-kit/models';
import { SidenavComponent } from '../sidenav/sidenav.component';
import { SidenavPlaceholderComponent } from './sidenav-placeholder.component';

const items: NavigationItem[] = [
  { id: 'today', icon: 'sun', label: 'Heute', route: '/', displayOrder: 1 },
  { id: 'household', icon: 'home', label: 'Haushalt', route: '/household', displayOrder: 2 },
  { id: 'lists', icon: 'check', label: 'Listen', route: '/lists', displayOrder: 3 },
  { id: 'calendar', icon: 'calendar', label: 'Kalender', route: '/calendar', displayOrder: 4 },
  { id: 'settings', icon: 'settings', label: 'Einstellungen', route: '/settings', displayOrder: 5 },
];

const sectioned: NavigationItem[] = [
  { id: 'today', icon: 'sun', label: 'Heute', route: '/', displayOrder: 1 },
  {
    id: 'money', icon: 'banknotes', label: 'Finanzen', route: '', displayOrder: 2,
    children: [
      { id: 'budget', icon: 'chart-bar', label: 'Budget', route: '/money/budget', displayOrder: 1 },
      { id: 'accounts', icon: 'building-library', label: 'Konten', route: '/money/accounts', displayOrder: 2 },
    ],
  },
  {
    id: 'household', icon: '', label: 'Haushalt', route: '', displayOrder: 3, isSection: true,
    children: [
      { id: 'members', icon: 'users', label: 'Mitglieder', route: '/members', displayOrder: 1 },
      { id: 'notifications', icon: 'bell-alert', label: 'Benachrichtigungen', route: '/notifications', displayOrder: 2 },
    ],
  },
];

type Args = SidenavPlaceholderComponent & { items: NavigationItem[] };

/**
 * Placeholder and sidenav, side by side, with the same bindings; each in a
 * 480 px tall block column (like the app shell's: a percentage `width`
 * resolves against it).
 */
const pair = (column = 'auto') => `
  <div style="display: flex; gap: 32px; align-items: flex-start; flex-wrap: wrap;">
    <figure style="margin: 0;">
      <div class="story-column" style="height: 480px; width: ${column};">
        <lc-sidenav-placeholder [items]="items" [activeRoute]="activeRoute" [collapsed]="collapsed" [isOpen]="isOpen"
          [width]="width" [variant]="variant" [theme]="theme" [position]="position" [showLogo]="showLogo" [logoSize]="logoSize" />
      </div>
      <figcaption style="font-size: 12px; color: var(--color-text-tertiary); margin-top: 8px;">lc-sidenav-placeholder</figcaption>
    </figure>
    <figure style="margin: 0;">
      <div class="story-column" style="height: 480px; width: ${column};">
        <lc-sidenav mode="docked" [mobileBreakpoint]="0" [items]="items" [activeRoute]="activeRoute" [collapsed]="collapsed" [isOpen]="isOpen"
          [width]="width" [variant]="variant" [theme]="theme" [position]="position" [showLogo]="showLogo" [logoSize]="logoSize" />
      </div>
      <figcaption style="font-size: 12px; color: var(--color-text-tertiary); margin-top: 8px;">lc-sidenav</figcaption>
    </figure>
  </div>`;

const meta: Meta<Args> = {
  title: 'Navigation/Sidenav Placeholder',
  component: SidenavPlaceholderComponent,
  decorators: [moduleMetadata({ imports: [SidenavComponent] })],
  args: {
    items,
    activeRoute: '/',
    collapsed: false,
    isOpen: true,
    width: '320px',
    variant: 'default',
    theme: 'auto',
    position: 'left',
    showLogo: false,
    logoSize: 'md',
  },
  argTypes: {
    items: {
      control: 'object',
      description: 'Navigation items, the same value as on `lc-sidenav`: they give the number of rows, the sections and the groups that start expanded',
      table: { defaultValue: { summary: '[]' } },
    },
    activeRoute: {
      control: 'text',
      description: 'The current route, as on `lc-sidenav`: it decides which group starts expanded (when empty, the router URL does)',
      table: { defaultValue: { summary: "''" } },
    },
    collapsed: {
      control: 'boolean',
      description: 'The 56 px icon rail. One-way here (a `model` on `lc-sidenav`)',
      table: { defaultValue: { summary: 'false' } },
    },
    isOpen: {
      control: 'boolean',
      description: 'Whether the docked rail is open; a closed one is 0 px wide',
      table: { defaultValue: { summary: 'false' } },
    },
    width: {
      control: 'text',
      description: 'Width of the rail (CSS value), as on `lc-sidenav`',
      table: { defaultValue: { summary: "'320px'" } },
    },
    variant: {
      control: 'select',
      options: ['default', 'transparent'],
      description: 'Surface, as on `lc-sidenav`: `default` (the rail) or `transparent` (the side navigation on the page, 48 px pills)',
      table: { defaultValue: { summary: 'default' } },
    },
    theme: {
      control: 'select',
      options: ['auto', 'light', 'dark'],
      description: 'Theme, as on `lc-sidenav`',
      table: { defaultValue: { summary: 'auto' } },
    },
    position: {
      control: 'select',
      options: ['left', 'right'],
      description: 'Position, as on `lc-sidenav`',
      table: { defaultValue: { summary: 'left' } },
    },
    showLogo: {
      control: 'boolean',
      description: 'Reserves the logo block, as `showLogo` on `lc-sidenav`',
      table: { defaultValue: { summary: 'false' } },
    },
    logoSize: {
      control: 'select',
      options: ['xs', 'sm', 'md', 'lg', 'xl'],
      description: 'Height of the logo block (56 · 56 · 64 · 80 · 112 px), as on `lc-sidenav`',
      table: { defaultValue: { summary: 'md' } },
    },
  },
  parameters: {
    docs: {
      description: {
        component: `
\`lc-sidenav-placeholder\` stands in for a docked \`lc-sidenav\` while it loads (3.6, AS-18): an inert skeleton
of the rail with exactly the sidenav's boxes — the same container, width, logo block, rows, sections and
expanded groups, from the same classes and the same box rules — so swapping it for the sidenav moves
nothing (CLS 0). Give it the sidenav's bindings.

Use it as the \`@placeholder\` of a \`@defer (on viewport)\` block. In the app shell the navigation column is
hidden below 1024 px, so on a phone the trigger never fires and the sidenav's JavaScript never loads:

\`\`\`html
<div shell-nav>
  @defer (on viewport) {
    <lc-sidenav mode="docked" [isOpen]="true" width="100%" [mobileBreakpoint]="0"
                variant="transparent" ariaLabel="Hauptnavigation" [items]="nav" [activeRoute]="url()" />
  } @placeholder {
    <lc-sidenav-placeholder [isOpen]="true" width="100%" variant="transparent" [items]="nav" [activeRoute]="url()" />
  }
</div>
\`\`\`

- Import \`SidenavComponent\` only from \`@lifecorner/angular-ui-kit/sidenav\` and use it only inside the
  \`@defer\` block; any other use in the same component makes Angular load it eagerly.
- Outside the app shell, hide the placeholder's container below your breakpoint, or the trigger fires on
  phones too (correct, but it saves nothing).
- With a percentage \`width\` (\`100%\`), put the block in a container of definite width, as the app shell's
  column is. In a shrink-to-fit container (a flex-row item, an inline block) the sidenav's width follows its
  labels, which the placeholder cannot know.
- The section titles are 64 px bars: their line is the same height, the bar is not as wide as the text.
- Accessibility: \`aria-hidden="true"\` and \`inert\` — no landmark, no tab stop, nothing announced, so focus is
  never inside it when it is swapped. The landmark, \`aria-current\` and the tab order arrive with \`lc-sidenav\`.
  Static: no shimmer, nothing for reduced motion to stop.
- CSS hook: \`--lc-sidenav-placeholder-fill\` (default \`color-mix(in srgb, var(--lc-sidenav-fg) 16%, transparent)\`),
  \`GrayText\` in forced colours. The \`--lc-sidenav-*\` hooks apply as on \`lc-sidenav\` (set them on an ancestor of both).
`,
      },
    },
  },
};

export default meta;
type Story = StoryObj<Args>;

/** The placeholder next to the sidenav it stands in for, with the same arguments: the same boxes. */
export const NextToTheSidenav: Story = {
  name: 'Next to the sidenav',
  render: (args) => ({ props: args, template: pair() }),
};

/** The app shell's look: `variant="transparent"`, `width="100%"` in a 240 px column. */
export const Transparent: Story = {
  name: 'Transparent',
  args: { variant: 'transparent', width: '100%' },
  render: (args) => ({ props: args, template: pair('240px') }),
};

/** The 56 px icon rail, side by side. */
export const Collapsed: Story = {
  name: 'Collapsed',
  args: { collapsed: true },
  render: (args) => ({ props: args, template: pair() }),
};

/** A section, a group expanded by `activeRoute` and the logo block. */
export const SectionsGroupsAndLogo: Story = {
  name: 'Sections, groups and logo',
  args: { items: sectioned, activeRoute: '/money/accounts', showLogo: true },
  render: (args) => ({ props: args, template: pair() }),
};

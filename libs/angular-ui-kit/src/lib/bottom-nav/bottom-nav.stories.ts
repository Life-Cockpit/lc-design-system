import type { Meta, StoryObj } from '@storybook/angular';
import { fn } from 'storybook/test';
import { BottomNavComponent, BottomNavItem } from './bottom-nav.component';

const twoDestinations: BottomNavItem[] = [
  { id: 'today', label: 'Today', icon: 'sun', route: '/' },
  { id: 'household', label: 'Household', icon: 'home', route: '/household' },
];

const fiveDestinations: BottomNavItem[] = [
  { id: 'today', label: 'Heute', icon: 'sun', route: '/' },
  { id: 'contracts', label: 'Verträge', icon: 'file-text', route: '/contracts' },
  { id: 'finances', label: 'Finanzen', icon: 'wallet', route: '/finances' },
  { id: 'documents', label: 'Dokumente', icon: 'folder', route: '/documents' },
  { id: 'household', label: 'Haushalt', icon: 'home', route: '/household' },
];

const sixDestinations: BottomNavItem[] = [
  ...fiveDestinations.slice(0, 4),
  { id: 'calendar', label: 'Kalender', icon: 'calendar', route: '/calendar' },
  fiveDestinations[4],
];

/** A 360 px phone frame; the bar renders in flow (`fixed=false`) at its bottom. */
const phoneFrame = (bar: string, padding = '0', lang = 'en') => `
  <div lang="${lang}" style="width: 360px; height: 260px; display: flex; flex-direction: column; justify-content: flex-end;
              box-sizing: border-box; padding: ${padding}; background: var(--color-background); border: 1px solid var(--color-border); border-radius: 12px; overflow: hidden;">
    ${bar}
  </div>`;

const meta: Meta<BottomNavComponent> = {
  title: 'Navigation/Bottom Nav',
  component: BottomNavComponent,
  args: {
    reselect: fn(),
    moreClick: fn(),
    fixed: false,
  },
  argTypes: {
    items: {
      description:
        'Destinations (`BottomNavItem[]`: `id`, `label`, `icon`, `route`; optional `displayOrder`, `badge { value, variant? }`). A `NavigationItem[]` fits as is.',
    },
    activeRoute: {
      description: 'The current URL (e.g. `router.url`); the item matching its first path segment is current, `/` matches only itself',
    },
    ariaLabel: { description: 'Accessible name of the `<nav>` landmark', table: { defaultValue: { summary: 'Main navigation' } } },
    variant: {
      control: 'select',
      options: ['docked', 'floating'],
      description: '`docked` spans the bottom edge with a top border; `floating` is the inset, elevated pill (16 px from the sides and above the safe-area inset, radius 28 px)',
      table: { defaultValue: { summary: 'docked' } },
    },
    fixed: {
      control: 'boolean',
      description: 'Pin the bar to the bottom of the viewport (default `true`). Off renders it in the document flow, as in these previews.',
      table: { defaultValue: { summary: 'true' } },
    },
    maxItems: {
      control: 'number',
      description: 'Most entries shown; with more destinations the first `maxItems − 1` stay and the rest go behind "More"',
      table: { defaultValue: { summary: '5' } },
    },
    moreLabel: { description: 'Label of the overflow entry', table: { defaultValue: { summary: 'More' } } },
    moreIcon: { description: 'Icon of the overflow entry', table: { defaultValue: { summary: 'dots' } } },
    moreRoute: {
      description: 'Route of the overflow entry (a page listing the rest). Empty renders a button that emits `moreClick`',
    },
    badgeAriaLabel: {
      description: 'Text read after a label when the item has a badge; `{value}` is replaced with the badge value',
      table: { defaultValue: { summary: '{value} new' } },
    },
    reselect: { action: 'reselect', description: 'The current item was tapped again (scroll the page to the top)' },
    moreClick: { action: 'moreClick', description: 'The overflow entry was tapped while it has no `moreRoute`' },
  },
  parameters: {
    docs: {
      description: {
        component: `
Bottom navigation bar for phones and tablets: the main destinations as links in the thumb zone. Use it below 1024 px; from 1024 px the side navigation takes over (see App Shell).

**Key Features:**
- Links, not tabs: \`<nav aria-label><ul><li><a routerLink>\` with \`aria-current="page"\` on the current destination
- Items at least 64 × 64 px: a 24 px icon over a 12 px label that is always visible and wraps at large text sizes
- The current item: a 56 × 32 px pill in \`--color-surface-selected\`, a heavier icon and a bold label in \`--color-on-surface-selected\`
- Current by the first path segment (\`/household/members\` keeps Household current); \`/\` only matches itself
- Overflow: from \`maxItems + 1\` destinations, the first \`maxItems − 1\` and a "More" entry (\`moreRoute\` or the \`moreClick\` output)
- \`reselect\` when the current item is tapped again
- \`variant="floating"\`: an inset pill, 16 px from the sides and above the safe-area inset, radius 28 px, elevated
- Fixed to the viewport with the safe-area insets, below menus and dialogs; no hover-only information; reduced motion respected
- Theming hooks: \`--lc-bottom-nav-bg\`, \`-border\`, \`-shadow\`, \`-fg\`, \`-current-bg\`, \`-current-fg\`, \`-hover-bg\`, \`-z\`
`,
      },
    },
  },
};

export default meta;
type Story = StoryObj<BottomNavComponent>;

/** Two destinations, docked to the bottom edge. */
export const Default: Story = {
  args: { items: twoDestinations, activeRoute: '/', ariaLabel: 'Main navigation' },
  render: (args) => ({
    props: args,
    template: phoneFrame(
      `<lc-bottom-nav [items]="items" [activeRoute]="activeRoute" [ariaLabel]="ariaLabel" [variant]="variant" [fixed]="fixed" (reselect)="reselect($event)" />`,
    ),
  }),
};

/** The "Weite" look (LK-5): an inset, elevated pill on the page. */
export const Floating: Story = {
  args: { items: twoDestinations, activeRoute: '/', variant: 'floating' },
  render: (args) => ({
    props: args,
    template: phoneFrame(
      `<lc-bottom-nav [items]="items" [activeRoute]="activeRoute" [variant]="variant" [fixed]="fixed" (reselect)="reselect($event)" />`,
      '16px',
    ),
  }),
};

/** Five destinations with German labels; "Dokumente" still fits on one line at 360 px. */
export const FiveDestinations: Story = {
  args: { items: fiveDestinations, activeRoute: '/finances/accounts', variant: 'floating', ariaLabel: 'Hauptnavigation' },
  render: (args) => ({
    props: args,
    template: phoneFrame(
      `<lc-bottom-nav [items]="items" [activeRoute]="activeRoute" [variant]="variant" [ariaLabel]="ariaLabel" [fixed]="fixed" />`,
      '16px',
      'de',
    ),
  }),
};

/** Six destinations: the first four stay and "Mehr" links to a page that lists the rest; a hidden destination makes "Mehr" current. */
export const OverflowMore: Story = {
  args: {
    items: sixDestinations,
    activeRoute: '/household',
    variant: 'floating',
    moreLabel: 'Mehr',
    moreRoute: '/more',
    ariaLabel: 'Hauptnavigation',
  },
  render: (args) => ({
    props: args,
    template: phoneFrame(
      `<lc-bottom-nav [items]="items" [activeRoute]="activeRoute" [variant]="variant" [ariaLabel]="ariaLabel"
         [moreLabel]="moreLabel" [moreRoute]="moreRoute" [fixed]="fixed" />`,
      '16px',
      'de',
    ),
  }),
};

/** Badges sit on the icon; screen readers hear the label followed by `badgeAriaLabel`. */
export const WithBadges: Story = {
  args: {
    items: [
      twoDestinations[0],
      { id: 'inbox', label: 'Eingang', icon: 'inbox', route: '/inbox', badge: { value: 3, variant: 'primary' } },
      twoDestinations[1],
    ],
    activeRoute: '/',
    variant: 'floating',
    badgeAriaLabel: '{value} neu',
  },
  render: (args) => ({
    props: args,
    template: phoneFrame(
      `<lc-bottom-nav [items]="items" [activeRoute]="activeRoute" [variant]="variant" [badgeAriaLabel]="badgeAriaLabel" [fixed]="fixed" />`,
      '16px',
    ),
  }),
};

/** Fixed to the viewport (`fixed=true`, the default in apps): open the story on its own to see it at the bottom. */
export const FixedToViewport: Story = {
  args: { items: twoDestinations, activeRoute: '/', variant: 'floating', fixed: true },
  parameters: { docs: { disable: true }, layout: 'fullscreen' },
};

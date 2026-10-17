import type { Meta, StoryObj } from '@storybook/angular';
import { moduleMetadata } from '@storybook/angular';
import { AppShellComponent } from './app-shell.component';
import { AppPageComponent } from './app-page.component';
import { HeaderComponent } from '../header/header.component';
import { SidenavComponent } from '../sidenav/sidenav.component';
import { SidenavPlaceholderComponent } from '../sidenav-placeholder/sidenav-placeholder.component';
import { BottomNavComponent } from '../bottom-nav/bottom-nav.component';
import { AvatarGroupComponent } from '../avatar-group/avatar-group.component';
import { ListComponent } from '../list/list.component';
import { SkeletonComponent } from '../skeleton/skeleton.component';

const nav = [
  { id: 'today', icon: 'sun', label: 'Heute', route: '/', displayOrder: 1 },
  { id: 'household', icon: 'home', label: 'Haushalt', route: '/household', displayOrder: 2 },
];

const members = [
  { label: 'Johanna-Friederike Apfelbaum-Kieselbacher-Morgentau', subtitle: 'Mitglied seit 12. Okt. 2026', avatar: 'JA', avatarColor: 'member-1' as const },
  { label: 'Tom Ek', subtitle: 'Mitglied seit 12. Okt. 2026', avatar: 'TE', avatarColor: 'member-2' as const },
];

const placeholder = (text: string, height = 160) =>
  `<div style="min-height: ${height}px; box-sizing: border-box; border: 1.5px dashed var(--color-border); border-radius: 12px;
              display: flex; align-items: center; justify-content: center; padding: 16px; text-align: center;
              font-size: 13px; color: var(--color-text-tertiary);">${text}</div>`;

/** Today in the "Weite" frame: every slot of the shell and the page's right column. */
const todayTemplate = `
  <lc-app-shell [horizon]="horizon">
    <lc-header shell-header variant="transparent" [sticky]="false" title="Produkt" titleTag="span"
               subtitle="Unser Haushalt" homeAriaLabel="Produkt – Startseite"
               userMenuTrigger="avatar" userAvatarColor="member-1"
               userName="Johanna-Friederike Apfelbaum-Kieselbacher-Morgentau"
               userEmail="johanna.apfelbaum-kieselbacher@example.org"
               userMenuAriaLabel="Menü für Johanna-Friederike Apfelbaum-Kieselbacher-Morgentau"
               profileLabel="Einstellungen" logoutLabel="Abmelden" menuSize="md" />
    <lc-sidenav shell-nav mode="docked" [isOpen]="true" width="100%" [mobileBreakpoint]="0"
                variant="transparent" ariaLabel="Hauptnavigation" [items]="nav" activeRoute="/" />
    <lc-app-page asideLabelledby="story-members">
      <div>
        <p style="margin: 0 0 12px; font-size: 13px; font-weight: 700; letter-spacing: .12em; text-transform: uppercase; color: var(--color-overline, var(--color-link));">Donnerstag, 15. Oktober</p>
        <h1 style="margin: 0; font-size: 40px; line-height: 1.05; letter-spacing: -0.035em; color: var(--color-text-primary);">Guten Abend, Johanna</h1>
      </div>
      <div class="story-member-row">
        <lc-avatar-group [avatars]="memberAvatars" size="sm" [ring]="true" overlap="4px" />
      </div>
      ${placeholder('‹Der eine nächste Schritt›', 140)}
      ${placeholder('‹Seiteninhalt›', 120)}
      <section page-aside>
        <h2 id="story-members" style="margin: 0 0 16px; font-size: 22px; color: var(--color-text-primary);">Mitglieder</h2>
        <lc-list [items]="members" size="lg" [showDividers]="true" />
      </section>
    </lc-app-page>
    <lc-bottom-nav shell-bottom-nav variant="floating" ariaLabel="Hauptnavigation" [items]="nav" activeRoute="/" />
  </lc-app-shell>
  <style>
    @media (min-width: 1280px) { .story-member-row { display: none; } }
  </style>`;

const meta: Meta<AppShellComponent> = {
  title: 'Layout/App Shell',
  component: AppShellComponent,
  decorators: [
    moduleMetadata({
      imports: [
        AppPageComponent, HeaderComponent, SidenavComponent, SidenavPlaceholderComponent, BottomNavComponent,
        AvatarGroupComponent, ListComponent, SkeletonComponent,
      ],
    }),
  ],
  argTypes: {
    horizon: {
      control: 'boolean',
      description:
        'Close the page with the "Weite" horizon (`.lc-horizon`): full width below the side navigation and the page, filling the rest of the screen; the footer and the floating bar rest on its land',
      table: { defaultValue: { summary: 'false' } },
    },
  },
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: `
The frame of an app: header, side navigation, page, bottom bar, footer and the horizon, phone first, with the **document** scrolling (no inner scroll container), so the iOS status-bar tap, address-bar collapse and pull-to-refresh keep working. For a full-height page that scrolls inside (a chat), put an \`lc-page-layout fill="parent"\` in the page.

**\`lc-app-shell\` slots:**
| Slot | Below 1024 px | From 1024 px |
|---|---|---|
| \`[shell-header]\` | in the flow, scrolls away; top and side safe-area insets | the same, across the full width |
| \`[shell-nav]\` | hidden | a docked column, 240 px (248 from 1440, 280 from 1920; \`--lc-app-shell-nav-width\`), sticky once the header is gone. Use \`lc-sidenav mode="docked" [isOpen]="true" width="100%" [mobileBreakpoint]="0"\` |
| default | the page | the page, up to the window's right edge |
| \`[shell-bottom-nav]\` | \`lc-bottom-nav\` (fixed); the shell keeps 112 px + the inset free at the end (\`--lc-app-shell-bottom-clearance\`) | hidden |
| \`[shell-footer]\` | after the page, or on the horizon's land | the same |

Input \`horizon\` closes the page with the horizon block (\`.lc-horizon\`, from the kit's styles).

**\`lc-app-page\`** — the page inside the shell: \`<main [id]="mainId">\` (default \`main\`) with the content as a column (24 px apart, 40 px from 1024 px), centred and at most \`contentMaxWidth\` wide (880 px; side padding 24 · 32 · 48 · 56 · 72 · 96 px). \`[page-aside]\` is the right column: an \`<aside>\` after \`<main>\`, docked to the window's right edge from 1280 px (360 · 400 · 460 px; \`--lc-app-page-aside-width\`) with a fading tint and hairline that start behind the header (set a changed \`--lc-app-page-aside-width\` on the shell, so both parts line up), hidden below 1280 px (show a narrow equivalent inside main). It renders only with \`asideLabelledby\` or \`asideAriaLabel\`.

\`busy\` marks the page as loading: \`aria-busy="true"\` on its \`<main>\` while \`true\`, no attribute while \`false\` (default). Set it while a skeleton stands in for the content. Screen readers may hold back changes inside a busy region until it clears, so a loading message that must be heard belongs outside \`<main>\` (for example a \`.sr-only\` \`role="status"\` next to the page, in the shell's default slot) or is static text such as a \`.sr-only\` line inside the page, read when reached. No visual change (3.5, AS-12).

Needs \`<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">\`. Breakpoints are CSS media queries, so the layout holds before JavaScript (SSR, prerendering).
`,
      },
    },
  },
};

export default meta;
type Story = StoryObj<AppShellComponent>;

/** Today on a desktop: transparent header, side navigation on the page, centred content, the members column docked right, the horizon. */
export const TodayDesktop: Story = {
  name: 'Today (desktop, right column, horizon)',
  args: { horizon: true },
  render: (args) => ({
    props: {
      ...args,
      nav,
      members,
      memberAvatars: members.map((m) => ({ name: m.label, color: m.avatarColor })),
    },
    template: todayTemplate,
  }),
};

/** The same page on a phone: no side navigation, the member row inside main, the floating bar resting on the horizon's land. */
export const TodayPhone: Story = {
  name: 'Today (phone, floating bar)',
  args: { horizon: true },
  globals: { viewport: { value: 'mobile1', isRotated: false } },
  parameters: {
    docs: {
      description: {
        story: 'Open the story in the canvas (mobile viewport): the layout follows the viewport, so in the docs page it renders at the page width.',
      },
    },
  },
  render: TodayDesktop.render,
};

/** A content page without the horizon and without a right column (Household, Settings): plain sky, the bar's height kept free. */
export const ContentPage: Story = {
  name: 'Content page (no horizon, no right column)',
  args: { horizon: false },
  render: (args) => ({
    props: { ...args, nav },
    template: `
      <lc-app-shell [horizon]="horizon">
        <lc-header shell-header variant="transparent" [sticky]="false" title="Produkt" titleTag="span"
                   subtitle="Familie Apfelbaum-Kieselbacher-Morgentau und Freunde" userMenuTrigger="avatar"
                   userAvatarColor="member-2" userName="Tom Ek" userMenuAriaLabel="Menü für Tom Ek" />
        <lc-sidenav shell-nav mode="docked" [isOpen]="true" width="100%" [mobileBreakpoint]="0"
                    variant="transparent" ariaLabel="Hauptnavigation" [items]="nav" activeRoute="/household" />
        <lc-app-page contentMaxWidth="672px">
          <h1 style="margin: 0; font-size: 32px; color: var(--color-text-primary);">Haushalt</h1>
          ${placeholder('‹Der eine nächste Schritt›', 140)}
          ${placeholder('‹Mitglieder, Einladung›', 480)}
        </lc-app-page>
        <lc-bottom-nav shell-bottom-nav variant="floating" ariaLabel="Hauptnavigation" [items]="nav" activeRoute="/household" />
      </lc-app-shell>`,
  }),
};

/** The skeleton life-os shows while Today loads (board t08), inside a busy page. */
const todayLoadingTemplate = `
  <lc-app-shell [horizon]="horizon">
    <lc-header shell-header variant="transparent" [sticky]="false" title="Produkt" titleTag="span"
               subtitle="Unser Haushalt" homeAriaLabel="Produkt – Startseite"
               userMenuTrigger="avatar" userAvatarColor="member-1"
               userName="Johanna-Friederike Apfelbaum-Kieselbacher-Morgentau"
               userMenuAriaLabel="Menü für Johanna-Friederike Apfelbaum-Kieselbacher-Morgentau" />
    <lc-sidenav shell-nav mode="docked" [isOpen]="true" width="100%" [mobileBreakpoint]="0"
                variant="transparent" ariaLabel="Hauptnavigation" [items]="nav" activeRoute="/" />
    <lc-app-page [busy]="busy">
      <p class="sr-only">Heute wird geladen …</p>
      <!-- lc-skeleton sizes its host and its box with the same width, so a
           percentage goes on a wrapper and the skeleton fills it. -->
      <div class="story-skeleton-heading">
        <div style="width: 45%"><lc-skeleton height="17px" borderRadius="6px" /></div>
        <div style="width: 70%"><lc-skeleton height="42px" borderRadius="8px" /></div>
        <div style="width: 50%"><lc-skeleton height="42px" borderRadius="8px" /></div>
      </div>
      <div class="story-skeleton-members">
        <span class="story-skeleton-avatars">
          <lc-skeleton variant="circle" width="34px" height="34px" />
          <lc-skeleton variant="circle" width="34px" height="34px" />
        </span>
        <div style="width: 30%"><lc-skeleton height="20px" borderRadius="6px" /></div>
      </div>
      <lc-skeleton variant="rect" height="96px" borderRadius="24px" />
      <div class="story-skeleton-tiles">
        <lc-skeleton variant="rect" height="74px" borderRadius="18px" />
        <lc-skeleton variant="rect" height="74px" borderRadius="18px" />
        <lc-skeleton variant="rect" height="74px" borderRadius="18px" />
      </div>
    </lc-app-page>
    <lc-bottom-nav shell-bottom-nav variant="floating" ariaLabel="Hauptnavigation" [items]="nav" activeRoute="/" />
  </lc-app-shell>
  <style>
    .story-skeleton-heading { display: flex; flex-direction: column; gap: 12px; }
    .story-skeleton-members { display: flex; align-items: center; gap: 12px; min-height: 44px; }
    .story-skeleton-avatars { display: flex; }
    .story-skeleton-avatars lc-skeleton + lc-skeleton { margin-left: -4px; }
    .story-skeleton-avatars .lc-skeleton { box-shadow: 0 0 0 3px var(--color-background); }
    .story-skeleton-tiles { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 8px; }
  </style>`;

/**
 * Today while it loads: the page is busy (`aria-busy="true"` on `<main>`) and a
 * skeleton stands in for the content; the member row shows at every width and
 * there is no right column yet.
 */
export const TodayLoading: StoryObj<AppShellComponent & { busy: boolean }> = {
  name: 'Today (loading, busy page)',
  args: { horizon: true, busy: true },
  argTypes: {
    busy: {
      control: 'boolean',
      description:
        'Marks the page as loading: `aria-busy="true"` on its `<main>` while `true`, no attribute while `false`. Set it while a skeleton stands in for the content.',
      table: { defaultValue: { summary: 'false' } },
    },
  },
  parameters: {
    docs: {
      description: {
        story:
          '`lc-app-page [busy]="true"` sets `aria-busy="true"` on the page\'s `<main>`; `false` removes the attribute. Screen readers may hold back what changes inside a busy region until it clears, so the loading text here is static `.sr-only` text inside the page (read when reached). A status that must be announced belongs outside `<main>`, e.g. a `.sr-only` `role="status"` next to `lc-app-page` in the shell. Toggling `busy` changes no pixel.',
      },
    },
  },
  render: (args) => ({
    props: { ...args, nav },
    template: todayLoadingTemplate,
  }),
};

/**
 * Today with the side navigation loaded lazily (3.6, AS-18): `@defer` around
 * `lc-sidenav` with `lc-sidenav-placeholder` as its placeholder, in a
 * `<div shell-nav>`. An app uses `on viewport` (the column is hidden below
 * 1024 px, so a phone never loads the sidenav); the story waits 1.5 s
 * (`on timer`) so both states can be seen and measured.
 */
const lazyNavTemplate = `
  <lc-app-shell [horizon]="horizon">
    <lc-header shell-header variant="transparent" [sticky]="false" title="Produkt" titleTag="span"
               subtitle="Unser Haushalt" homeAriaLabel="Produkt – Startseite"
               userMenuTrigger="avatar" userAvatarColor="member-1" userName="Johanna-Friederike Apfelbaum-Kieselbacher-Morgentau"
               userMenuAriaLabel="Menü für Johanna-Friederike Apfelbaum-Kieselbacher-Morgentau" />
    <div shell-nav>
      @defer (on timer(1500ms)) {
        <lc-sidenav mode="docked" [isOpen]="true" width="100%" [mobileBreakpoint]="0"
                    variant="transparent" ariaLabel="Hauptnavigation" [items]="lazyNav" activeRoute="/" />
      } @placeholder {
        <lc-sidenav-placeholder [isOpen]="true" width="100%" variant="transparent" [items]="lazyNav" activeRoute="/" />
      }
    </div>
    <lc-app-page>
      <div>
        <p style="margin: 0 0 12px; font-size: 13px; font-weight: 700; letter-spacing: .12em; text-transform: uppercase; color: var(--color-overline, var(--color-link));">Donnerstag, 15. Oktober</p>
        <h1 style="margin: 0; font-size: 40px; line-height: 1.05; letter-spacing: -0.035em; color: var(--color-text-primary);">Guten Abend, Johanna</h1>
      </div>
      ${placeholder('‹Der eine nächste Schritt›', 140)}
      ${placeholder('‹Seiteninhalt›', 120)}
    </lc-app-page>
    <lc-bottom-nav shell-bottom-nav variant="floating" ariaLabel="Hauptnavigation" [items]="lazyNav" activeRoute="/" />
  </lc-app-shell>`;

const lazyNav = (labels: { today: string; household: string; settings: string }) => [
  { id: 'today', icon: 'sun', label: labels.today, route: '/', displayOrder: 1 },
  { id: 'household', icon: 'home', label: labels.household, route: '/household', displayOrder: 2 },
  { id: 'settings', icon: 'settings', label: labels.settings, route: '/settings', displayOrder: 3 },
];

const EN = { today: 'Today', household: 'Household overview', settings: 'Notification settings' };
const DE = { today: 'Heute', household: 'Haushaltsübersicht', settings: 'Benachrichtigungseinstellungen' };

export const LazySideNavigation: Story = {
  name: 'Lazy side navigation',
  args: { horizon: true },
  parameters: {
    docs: {
      description: {
        story:
          '`<div shell-nav> @defer (on viewport) { <lc-sidenav …/> } @placeholder { <lc-sidenav-placeholder …same bindings…/> } </div>`. The placeholder has the sidenav\'s boxes, so the swap moves neither the column nor `<main>` (CLS 0). Here `on timer(1500ms)` stands in for `on viewport`. Below 1024 px the column is hidden and nothing loads.',
      },
    },
  },
  render: (args) => ({ props: { ...args, lazyNav: lazyNav(EN) }, template: lazyNavTemplate }),
};

/** The same with long German labels: they end with an ellipsis at 1024 px, as before (AC-11). */
export const LazySideNavigationGerman: Story = {
  name: 'Lazy side navigation (German)',
  args: { horizon: true },
  render: (args) => ({ props: { ...args, lazyNav: lazyNav(DE) }, template: lazyNavTemplate }),
};

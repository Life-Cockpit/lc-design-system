import type { Meta, StoryObj } from '@storybook/angular';
import { moduleMetadata } from '@storybook/angular';
import { AppShellComponent } from './app-shell.component';
import { AppPageComponent } from './app-page.component';
import { HeaderComponent } from '../header/header.component';
import { SidenavComponent } from '../sidenav/sidenav.component';
import { BottomNavComponent } from '../bottom-nav/bottom-nav.component';
import { AvatarGroupComponent } from '../avatar-group/avatar-group.component';
import { ListComponent } from '../list/list.component';

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
      imports: [AppPageComponent, HeaderComponent, SidenavComponent, BottomNavComponent, AvatarGroupComponent, ListComponent],
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

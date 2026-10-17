import type { Meta, StoryObj } from '@storybook/angular';
import { applicationConfig } from '@storybook/angular';
import { Component, signal, computed, ChangeDetectionStrategy } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { IconComponent } from './icon.component';
import { provideLcIcons } from './icon-registry';
// 3.6 (AS-17): the 3.5.1 maps live in the lazy internal entry; the constants in `icons`.
import { INLINE_ICON_SVGS, INLINE_TABLER_NAMES } from '@lifecorner/angular-ui-kit/internal/icon-set';
import {
  BUNDLED_ICONS,
  ICON_CHECK_CIRCLE,
  ICON_CHECK_CIRCLE_SOLID,
  ICON_HOME,
  ICON_HOME_SOLID,
  ICON_MAIL,
} from '@lifecorner/angular-ui-kit/icons';
// The package's exports map only exposes ./icons/*, so the catalogue JSON has to be
// reached by path.
// eslint-disable-next-line @nx/enforce-module-boundaries
import tablerIcons from '../../../../../node_modules/@tabler/icons/icons.json';

const ALL_ICONS = Object.keys(tablerIcons).sort((a, b) => a.localeCompare(b));

@Component({
  selector: 'lc-icon-gallery',
  standalone: true,
  imports: [IconComponent, FormsModule],
  changeDetection: ChangeDetectionStrategy.Eager,
  template: `
    <div style="margin-bottom: 16px; display: flex; align-items: center; gap: 12px; flex-wrap: wrap;">
      <input
        type="text"
        [ngModel]="search()"
        (ngModelChange)="search.set($event)"
        placeholder="Search icons…"
        style="padding: 8px 12px; border: 1px solid #D1D5DB; border-radius: 6px; font-size: 14px; width: 260px; outline: none;"
      />
      <span style="font-size: 13px; color: #6B7280;">
        {{ filtered().length }} of {{ icons.length }} icons
      </span>
      <label style="font-size: 13px; color: #6B7280; display: flex; align-items: center; gap: 4px; margin-left: auto;">
        <input type="checkbox" [ngModel]="showSolid()" (ngModelChange)="showSolid.set($event)" />
        Solid
      </label>
    </div>
    <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(100px, 1fr)); gap: 4px;">
      @for (icon of filtered(); track icon) {
        <button
          type="button"
          style="display: flex; flex-direction: column; align-items: center; padding: 12px 4px; border: 0; border-radius: 8px; background: transparent; color: inherit; font: inherit; cursor: pointer; transition: background 0.15s;"
          (mouseenter)="$event.currentTarget.style.background='#F3F4F6'"
          (mouseleave)="$event.currentTarget.style.background='transparent'"
          (click)="copyName(icon)"
          [title]="'Click to copy: ' + icon"
        >
          <lc-icon [name]="icon" [variant]="showSolid() ? 'solid' : 'outline'" size="md" [decorative]="true"></lc-icon>
          <span style="font-size: 10px; color: #6B7280; margin-top: 6px; text-align: center; word-break: break-all; line-height: 1.3;">{{ icon }}</span>
        </button>
      }
    </div>
    @if (filtered().length === 0) {
      <div style="text-align: center; padding: 48px 0; color: #9CA3AF;">
        No icons match "{{ search() }}"
      </div>
    }
  `,
})
class IconGalleryComponent {
  readonly icons = ALL_ICONS;
  readonly search = signal('');
  readonly showSolid = signal(false);
  readonly filtered = computed(() => {
    const q = this.search().toLowerCase();
    return q ? this.icons.filter(n => n.includes(q)) : this.icons;
  });

  copyName(name: string) {
    navigator.clipboard.writeText(name);
  }
}

/**
 * Icons are SVG-based visual symbols from the Tabler Icons library.
 * This story reads the full icon catalog from the installed Tabler package and
 * supports outline plus solid (filled) variants.
 * Use them in buttons, navigation, lists, and status indicators.
 *
 * Usage: `<lc-icon name="home" variant="outline" size="md" />`
 */
const meta: Meta<IconComponent> = {
  title: 'Components/Icon',
  component: IconComponent,
  argTypes: {
    name: { description: 'Icon name from the Tabler set (e.g. "home", "user", "settings")' },
    variant: {
      control: 'select',
      options: ['outline', 'solid'],
      description: 'Outline has stroked paths, solid maps to filled icons',
    },
    size: {
      control: 'select',
      options: ['xs', 'sm', 'md', 'lg', 'xl'],
      description: 'Icon dimensions — xs: 16px, sm: 20px, md: 24px, lg: 32px, xl: 40px',
    },
    color: { description: 'CSS color value (default: currentColor, inherits text color)' },
    ariaLabel: { description: 'Accessible label for screen readers (omit for decorative icons)' },
    decorative: { description: 'If true, icon is hidden from screen readers (aria-hidden)' },
    strict: {
      control: 'boolean',
      description:
        'If true, an unknown icon name throws in development mode (CI guard). Default just warns + renders a visible placeholder.',
    },
  },

  parameters: {
    docs: {
      description: {
        component: `
Icon component - Tabler Icons wrapper for displaying SVG icons

**Key Features:**
- Signal-based reactive API
- Support for outline and solid variants
- Multiple size options (xs, sm, md, lg, xl)
- Custom color support (CSS colors, variables)
- Accessibility attributes (ARIA labels, decorative icons)
- Dynamic SVG loading from Tabler Icons

**Valid names & fail-loud**

The component serves the **Tabler** icon set and also accepts a set of documented
**Heroicon/Material aliases**. An unknown name (a typo, or an un-aliased Heroicon
name like \`beaker\` / \`table-cells\`) no longer disappears silently: it always
renders a **visible placeholder** (a dashed frame with a "?") and logs one warning
per name. In development builds it is checked against the full name list, never
requested, and logs \`[lc-icon] Unknown icon "…"\`. Production builds leave the
~5,000 names out of the bundle (3.5) and check a name only by its form: a malformed
name logs \`Unknown icon\` as in development, a well-formed unknown name is requested
**once per page** and, when the answer is not an icon, logs
\`[lc-icon] "…": … could not be loaded (404)\` or \`… returned non-SVG content\`. Set
\`[strict]="true"\` to additionally throw in dev — useful as a CI guard (no effect in
production builds).

**SPA-safe loading**

Icons loaded over HTTP are validated before they are rendered: a \`text/html\` or
non-SVG response is dropped. This matters because SPA deployments answer missing
asset paths with the \`index.html\` fallback and status 200 — without the gate,
that document would be injected into the page once per icon instance. An SVG
response is rebuilt node by node from an **allow-list**: basic shapes (\`g\`,
\`path\`, \`circle\`, \`ellipse\`, \`line\`, \`polyline\`, \`polygon\`, \`rect\`,
\`text\`) with paint and geometry attributes. Scripts, event handlers, references
(\`href\`, \`url(…)\`), a DOCTYPE or anything else drop the icon. Dropped responses
get a single console warning per name, and the placeholder is shown instead.

**Trusted Types**

Bundled icons go through one Trusted Types policy, \`lc-icon\`, created on the
first icon render; it accepts only the kit's own SVG strings (registered \`ICON_*\`
glyphs, the kit's lazily loaded set and the placeholder — since 3.6 each of them also
passes the allow-list below). If your Content Security Policy enforces Trusted Types, add
\`lc-icon\` to its \`trusted-types\` directive, for example
\`require-trusted-types-for 'script'; trusted-types angular lc-icon\`. Fetched
icons need no policy: they are rebuilt from the allow-list above. When the page
refuses the policy, bundled icons show the placeholder (with their size, colour and
label) and the console says so once. There is no sanitizer bypass and no HTML
binding, so \`angular#unsafe-bypass\` is not needed for icons.

**Register the glyphs you render (3.6)**

The kit's inline glyphs are tree-shakable: register the ones your app renders and
only those (plus the ones the kit's own components render) are bundled. Registered
glyphs render synchronously, in prerendered HTML too.

\`\`\`ts
// app.config.ts
import { provideLcIcons } from '@lifecorner/angular-ui-kit/icon';
import { ICON_HOME, ICON_MAIL, ICON_X_MARK } from '@lifecorner/angular-ui-kit/icons';

providers: [provideLcIcons([ICON_HOME, ICON_MAIL, ICON_X_MARK], { unregistered: 'placeholder' })]
\`\`\`

An inline name nobody registered loads the kit's whole set once, as a lazy chunk
(\`unregistered: 'load'\`, the default — an app that opts into nothing renders as in
3.5.1), or shows the placeholder and warns once (\`'placeholder'\`). See the
**Bundle Size** page for the constants, the warnings and the lazy side navigation.

The canonical set of valid names is exported for static checking:

\`\`\`ts
import { ICON_NAMES, isValidIconName } from '@lifecorner/angular-ui-kit/icon-names';
import { ICON_ALIASES } from '@lifecorner/angular-ui-kit/icon';
// or, for build tooling:
import iconNames from '@lifecorner/angular-ui-kit/icon-names.json';

isValidIconName('flask');  // true
isValidIconName('beaker'); // false — did you mean 'flask'?
\`\`\`
`,
      },
    },
  },
};

export default meta;
type Story = StoryObj<IconComponent>;

export const Default: Story = {
  args: { name: 'home', variant: 'outline', size: 'md' },
};

export const Solid: Story = {
  args: { name: 'heart', variant: 'solid', size: 'md', color: '#ef4444' },
};

export const Sizes: Story = {
  name: 'Size Comparison',
  render: () => ({
    template: `
      <div style="display: flex; align-items: center; gap: 24px;">
        <div style="text-align: center;">
          <lc-icon name="star" size="xs"></lc-icon>
          <div style="font-size: 11px; color: #6B7280; margin-top: 4px;">xs · 16px</div>
        </div>
        <div style="text-align: center;">
          <lc-icon name="star" size="sm"></lc-icon>
          <div style="font-size: 11px; color: #6B7280; margin-top: 4px;">sm · 20px</div>
        </div>
        <div style="text-align: center;">
          <lc-icon name="star" size="md"></lc-icon>
          <div style="font-size: 11px; color: #6B7280; margin-top: 4px;">md · 24px</div>
        </div>
        <div style="text-align: center;">
          <lc-icon name="star" size="lg"></lc-icon>
          <div style="font-size: 11px; color: #6B7280; margin-top: 4px;">lg · 32px</div>
        </div>
        <div style="text-align: center;">
          <lc-icon name="star" size="xl"></lc-icon>
          <div style="font-size: 11px; color: #6B7280; margin-top: 4px;">xl · 40px</div>
        </div>
      </div>`,
  }),
};

export const OutlineVsSolid: Story = {
  name: 'Outline vs Solid',
  render: () => ({
    template: `
      <div style="display: grid; grid-template-columns: auto auto auto; gap: 16px 32px; align-items: center;">
        <div style="font-size: 12px; color: #6B7280; font-weight: 600;">Icon</div>
        <div style="font-size: 12px; color: #6B7280; font-weight: 600;">Outline</div>
        <div style="font-size: 12px; color: #6B7280; font-weight: 600;">Solid</div>
        <span style="font-size: 13px;">Heart</span>
        <lc-icon name="heart" variant="outline" size="md"></lc-icon>
        <lc-icon name="heart" variant="solid" size="md" color="#ef4444"></lc-icon>
        <span style="font-size: 13px;">Star</span>
        <lc-icon name="star" variant="outline" size="md"></lc-icon>
        <lc-icon name="star" variant="solid" size="md" color="#f59e0b"></lc-icon>
        <span style="font-size: 13px;">Check Circle</span>
        <lc-icon name="check-circle" variant="outline" size="md"></lc-icon>
        <lc-icon name="check-circle" variant="solid" size="md" color="#22c55e"></lc-icon>
        <span style="font-size: 13px;">Bell</span>
        <lc-icon name="bell" variant="outline" size="md"></lc-icon>
        <lc-icon name="bell" variant="solid" size="md" color="#6366f1"></lc-icon>
        <span style="font-size: 13px;">Shield</span>
        <lc-icon name="shield-check" variant="outline" size="md"></lc-icon>
        <lc-icon name="shield-check" variant="solid" size="md" color="#208497"></lc-icon>
      </div>`,
  }),
};

export const CustomColors: Story = {
  name: 'Custom Colors',
  render: () => ({
    template: `
      <div style="display: flex; gap: 16px; align-items: center;">
        <lc-icon name="check-circle" variant="solid" size="lg" color="#8EA475"></lc-icon>
        <lc-icon name="exclamation-triangle" variant="solid" size="lg" color="#E1A040"></lc-icon>
        <lc-icon name="x-circle" variant="solid" size="lg" color="#9D0E0E"></lc-icon>
        <lc-icon name="information-circle" variant="solid" size="lg" color="#208497"></lc-icon>
      </div>`,
  }),
};

/** Browse all installed Tabler icons. Click an icon to copy its name. Use the search field to filter. */
export const AllIcons: Story = {
  name: 'All Icons (Tabler Catalog)',
  render: () => ({
    moduleMetadata: { imports: [IconGalleryComponent] },
    template: `<lc-icon-gallery></lc-icon-gallery>`,
  }),
};

/**
 * Unknown names no longer vanish silently. A valid name renders its icon; an
 * unknown name (typo or un-aliased Heroicon name) renders a visible dashed "?"
 * placeholder and, in development, logs a `[lc-icon] Unknown icon "…"` warning.
 */
export const UnknownNameFallback: Story = {
  name: 'Unknown Name → Visible Fallback',
  render: () => ({
    template: `
      <div style="display: grid; grid-template-columns: auto auto; gap: 12px 24px; align-items: center;">
        <span style="font-size: 12px; color: #6B7280; font-weight: 600;">Name</span>
        <span style="font-size: 12px; color: #6B7280; font-weight: 600;">Rendered</span>
        <span style="font-size: 13px; font-family: monospace;">flask (valid)</span>
        <lc-icon name="flask" size="lg"></lc-icon>
        <span style="font-size: 13px; font-family: monospace;">x-mark (alias)</span>
        <lc-icon name="x-mark" size="lg"></lc-icon>
        <span style="font-size: 13px; font-family: monospace;">beaker (unknown)</span>
        <lc-icon name="beaker" size="lg"></lc-icon>
        <span style="font-size: 13px; font-family: monospace;">table-cells (unknown)</span>
        <lc-icon name="table-cells" size="lg"></lc-icon>
      </div>`,
  }),
};

/**
 * 3.3 (G-7): icons that render without a request — offline, at once and in
 * prerendered HTML. The hand-picked set (looked up by the name as written, so
 * `x-mark` and `check-circle` work) plus the Tabler icons inlined at build
 * time for websites, app shells and sign-in. `isInlineIconName(name)` tells an
 * app or a static site whether a name is in it.
 */
export const InlineSet: Story = {
  name: 'Inline set (3.3)',
  render: () => ({
    props: { names: [...Object.keys(INLINE_ICON_SVGS), ...INLINE_TABLER_NAMES] },
    template: `
      <ul style="list-style: none; margin: 0; padding: 0; display: grid; grid-template-columns: repeat(auto-fill, minmax(140px, 1fr)); gap: 12px;">
        @for (name of names; track name) {
          <li style="display: flex; align-items: center; gap: 8px; font: 12px monospace; color: var(--color-text-secondary);">
            <lc-icon [name]="name" size="md" [decorative]="true" />{{ name }}
          </li>
        }
      </ul>`,
  }),
};

const caption = 'font-size: 11px; color: var(--color-text-tertiary); margin-top: 4px; font-family: monospace;';

/**
 * 3.6 (AS-17): glyphs registered with `provideLcIcons` render synchronously —
 * in every size and both variants — and only they are bundled.
 */
export const RegisteredIcons: Story = {
  name: 'Registered icons',
  decorators: [
    applicationConfig({
      providers: [provideLcIcons([ICON_HOME, ICON_HOME_SOLID, ICON_MAIL, ICON_CHECK_CIRCLE, ICON_CHECK_CIRCLE_SOLID])],
    }),
  ],
  parameters: {
    docs: {
      description: {
        story:
          'This story registers `ICON_HOME`, `ICON_HOME_SOLID`, `ICON_MAIL`, `ICON_CHECK_CIRCLE` and `ICON_CHECK_CIRCLE_SOLID` (from `@lifecorner/angular-ui-kit/icons`) with `provideLcIcons([...])` in its application config. Glyphs add up along the injector tree: `app.config`, a route\'s `providers` or a component\'s `providers`. An alias finds the glyph of its target (`envelope` → `ICON_MAIL`).',
      },
    },
  },
  render: () => ({
    props: {
      rows: [
        { name: 'home', variant: 'outline', constant: 'ICON_HOME' },
        { name: 'home', variant: 'solid', constant: 'ICON_HOME_SOLID' },
        { name: 'envelope', variant: 'outline', constant: 'ICON_MAIL' },
        { name: 'check-circle', variant: 'outline', constant: 'ICON_CHECK_CIRCLE' },
        { name: 'check-circle', variant: 'solid', constant: 'ICON_CHECK_CIRCLE_SOLID' },
      ],
      sizes: ['xs', 'sm', 'md', 'lg', 'xl'],
      caption,
    },
    template: `
      <div style="display: grid; grid-template-columns: minmax(160px, auto) repeat(5, 48px); gap: 12px 8px; align-items: center;">
        @for (row of rows; track row.constant) {
          <div style="font: 12px monospace; color: var(--color-text-secondary);">{{ row.constant }}<div [style]="caption">{{ row.name }} · {{ row.variant }}</div></div>
          @for (size of sizes; track size) {
            <div style="display: flex; justify-content: center;"><lc-icon [name]="row.name" [variant]="row.variant" [size]="size" [ariaLabel]="row.name" /></div>
          }
        }
      </div>`,
  }),
};

/**
 * 3.6 (AS-17): with `unregistered: 'placeholder'` an inline name nobody
 * registered shows the placeholder (and warns once) instead of loading the
 * kit's set; a name outside the inline set is fetched as before. Same box.
 */
export const UnregisteredName: Story = {
  name: 'Unregistered name',
  decorators: [applicationConfig({ providers: [provideLcIcons([ICON_HOME], { unregistered: 'placeholder' })] })],
  parameters: {
    docs: {
      description: {
        story:
          '`provideLcIcons([ICON_HOME], { unregistered: \'placeholder\' })`. `home` is registered and renders at once; `sun` is a kit glyph nobody registered: the placeholder, and once per name `[lc-icon] "sun" is not registered. Add ICON_SUN from @lifecorner/angular-ui-kit/icons to provideLcIcons(). Rendering a placeholder instead.` in the console (development and production); `anchor` is not in the inline set and is fetched from the Tabler assets as before. All three boxes are 24 × 24 px. With the default `\'load\'` the kit\'s set loads once instead, and the warning (development only) ends with "Loading the kit\'s icon set instead."',
      },
    },
  },
  render: () => ({
    props: { caption },
    template: `
      <div style="display: flex; gap: 32px; align-items: flex-start;">
        <div style="text-align: center;"><lc-icon name="home" size="md" ariaLabel="home" /><div [style]="caption">home · registered</div></div>
        <div style="text-align: center;"><lc-icon name="sun" size="md" ariaLabel="sun" /><div [style]="caption">sun · placeholder</div></div>
        <div style="text-align: center;"><lc-icon name="anchor" size="md" ariaLabel="anchor" /><div [style]="caption">anchor · fetched</div></div>
      </div>`,
  }),
};

/** Upper snake case of the 3.5.1 key, `_SOLID` for the solid glyph. */
const constantOf = (name: string, variant: string) =>
  `ICON_${name.toUpperCase().replace(/-/g, '_')}${variant === 'solid' ? '_SOLID' : ''}`;

/**
 * 3.6 (AS-17): every constant of `@lifecorner/angular-ui-kit/icons` with its
 * glyph — "which constant do I need for this name?".
 */
export const IconConstants: Story = {
  name: 'Icon constants',
  decorators: [applicationConfig({ providers: [provideLcIcons(BUNDLED_ICONS)] })],
  parameters: {
    docs: {
      description: {
        story:
          'All 133 constants (`BUNDLED_ICONS` registers them all — for tests or a page that really shows every glyph; an app that imports it bundles all of them). A name that is an alias finds the constant of its target: `x-circle` → `ICON_CIRCLE_X`, `envelope` → `ICON_MAIL`, `cog-6-tooth` → `ICON_SETTINGS`.',
      },
    },
  },
  render: () => ({
    props: { icons: BUNDLED_ICONS.map((icon) => ({ ...icon, constant: constantOf(icon.name, icon.variant) })), caption },
    template: `
      <ul style="list-style: none; margin: 0; padding: 0; display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 12px;">
        @for (icon of icons; track icon.constant) {
          <li style="display: flex; align-items: center; gap: 10px;">
            <lc-icon [name]="icon.name" [variant]="icon.variant" size="md" [decorative]="true" />
            <div style="font: 12px monospace; color: var(--color-text-secondary);">{{ icon.constant }}<div [style]="caption">{{ icon.name }} · {{ icon.variant }}</div></div>
          </li>
        }
      </ul>`,
  }),
};


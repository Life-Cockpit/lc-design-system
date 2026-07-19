import type { Meta, StoryObj } from '@storybook/angular';
import { Component, signal, computed } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { IconComponent } from './icon.component';
import tablerIcons from '../../../../../node_modules/@tabler/icons/icons.json';

const ALL_ICONS = Object.keys(tablerIcons).sort((a, b) => a.localeCompare(b));

@Component({
  selector: 'icon-gallery',
  standalone: true,
  imports: [IconComponent, FormsModule],
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
        <div
          style="display: flex; flex-direction: column; align-items: center; padding: 12px 4px; border-radius: 8px; cursor: pointer; transition: background 0.15s;"
          (mouseenter)="$event.currentTarget.style.background='#F3F4F6'"
          (mouseleave)="$event.currentTarget.style.background='transparent'"
          (click)="copyName(icon)"
          [title]="'Click to copy: ' + icon"
        >
          <lc-icon [name]="icon" [variant]="showSolid() ? 'solid' : 'outline'" size="md"></lc-icon>
          <span style="font-size: 10px; color: #6B7280; margin-top: 6px; text-align: center; word-break: break-all; line-height: 1.3;">{{ icon }}</span>
        </div>
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
name like \`beaker\` / \`table-cells\`) no longer disappears silently: it logs
\`[lc-icon] Unknown icon "…"\` (once per name, in development **and** production)
and always renders a **visible placeholder** (a dashed frame with a "?") — without
issuing a network request. Set \`[strict]="true"\` to additionally throw in dev —
useful as a CI guard (no effect in production builds).

**SPA-safe loading**

Icons loaded over HTTP are validated before they are rendered: the response must
not be \`text/html\` and must parse as a standalone \`<svg>\` document. This matters
because SPA deployments answer missing asset paths with the \`index.html\` fallback
and status 200 — without the gate, that document would be injected into the page
once per icon instance. Non-SVG responses are dropped with a single console
warning per name, and the placeholder is shown instead.

The canonical set of valid names is exported for static checking:

\`\`\`ts
import { ICON_NAMES, isValidIconName, ICON_ALIASES } from '@life-cockpit/angular-ui-kit';
// or, for build tooling:
import iconNames from '@life-cockpit/angular-ui-kit/icon-names.json';

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
    template: `<icon-gallery></icon-gallery>`,
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

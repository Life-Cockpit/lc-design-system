import {
  Component,
  InjectionToken,
  input,
  inject,
  computed,
  ChangeDetectionStrategy,
} from '@angular/core';

/**
 * Injection token for the base path used to resolve the built-in
 * LifeCorner logo assets. Defaults to `'/assets'` so consuming apps
 * that copy the package's `assets/` folder to their public root keep
 * working out of the box.
 *
 * Override this token at the application root if your app serves
 * static files from a different prefix (e.g. `/static`, `/ui-kit`).
 *
 * @example
 * ```ts
 * providers: [
 *   { provide: LC_LOGO_BASE_PATH, useValue: '/static/lc' },
 * ]
 * ```
 */
export const LC_LOGO_BASE_PATH = new InjectionToken<string>('LC_LOGO_BASE_PATH', {
  providedIn: 'root',
  factory: () => '/assets',
});

/** Sizes at or below 32 px, which use the small emblem (heavier arms, filled points). */
const SMALL_EMBLEM_SIZES: ReadonlySet<string> = new Set(['xs', 'sm']);

/**
 * Logo component for displaying a brand identity.
 *
 * Defaults to the LifeCorner logo (Edu, the emblem, and the LifeCorner
 * lockup) but accepts custom `src` / `emblemSrc` (and optional `darkSrc` /
 * `darkEmblemSrc`) so consuming apps can drop in their own brand assets
 * without forking the component.
 *
 * Features:
 * - Full lockup and emblem-only variants; the emblem switches to its small
 *   drawing at `xs` and `sm` (32 px and below)
 * - Multiple size options (xs, sm, md, lg, xl)
 * - Light and dark sources that follow the APP theme exactly as the theme
 *   stylesheets do: dark under `:root.dark`, under a root without a theme
 *   class (dark-first default), and under `:root.system` when the OS is dark;
 *   light under `:root.light` and under `:root.system` when the OS is light.
 *   `colorMode="light|dark"` pins one source.
 * - The built-in logo ships its own dark drawings; nothing is inverted or
 *   recoloured by CSS. A custom logo without a dark partner stays as it is.
 * - The logo is flat and fixed: never animated, posed or distorted.
 *
 * @example Default LifeCorner logo
 * ```html
 * <lc-logo variant="full" size="md"></lc-logo>
 * ```
 *
 * @example Custom brand logo
 * ```html
 * <lc-logo
 *   src="/assets/acme-logo.svg"
 *   emblemSrc="/assets/acme-emblem.svg"
 *   darkSrc="/assets/acme-logo-dark.svg"
 *   alt="Acme Inc.">
 * </lc-logo>
 * ```
 */
@Component({
  selector: 'lc-logo',
  standalone: true,
  imports: [],
  templateUrl: './logo.component.html',
  styleUrls: ['./logo.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LogoComponent {
  /**
   * Logo variant to display
   * - 'full': the lockup (emblem and name)
   * - 'emblem': just the emblem
   */
  readonly variant = input<'full' | 'emblem'>('full');

  /**
   * Size of the logo
   * - 'xs': 24px height (small emblem)
   * - 'sm': 32px height (small emblem)
   * - 'md': 48px height (default)
   * - 'lg': 64px height
   * - 'xl': 96px height
   */
  readonly size = input<'xs' | 'sm' | 'md' | 'lg' | 'xl'>('md');

  /**
   * Alt text for accessibility. Defaults to the name of the built-in logo;
   * set it to your brand name when you pass your own sources.
   */
  readonly alt = input('LifeCorner');

  /**
   * Makes the logo appear clickable
   */
  readonly clickable = input(false);

  /**
   * Which source to show.
   * - 'auto': follows the app theme (light source on light, dark source on dark)
   * - 'light': always the light source (for light backgrounds)
   * - 'dark': always the dark source (for dark backgrounds); falls back to the
   *   light source when a custom logo has no dark partner
   */
  readonly colorMode = input<'auto' | 'light' | 'dark'>('auto');

  /**
   * Custom URL for the full logo. When set, overrides the built-in
   * LifeCorner lockup.
   */
  readonly src = input<string>('');

  /**
   * Custom URL for the emblem-only logo. When set, overrides the built-in
   * LifeCorner emblem at every size.
   */
  readonly emblemSrc = input<string>('');

  /**
   * Optional dark-theme URL for the full logo. When provided, the logo swaps
   * with the app theme (see `colorMode`). Without it a custom `src` is shown
   * on dark too; the built-in lockup brings its own dark drawing.
   */
  readonly darkSrc = input<string>('');

  /**
   * Optional dark-theme URL for the emblem-only logo.
   */
  readonly darkEmblemSrc = input<string>('');

  /** Whether the consumer supplied at least one custom source. */
  readonly hasCustomSrc = computed(
    () => !!this.src() || !!this.emblemSrc() || !!this.darkSrc() || !!this.darkEmblemSrc(),
  );

  private readonly basePath = inject(LC_LOGO_BASE_PATH);

  /** The built-in LifeCorner pair for the current variant and size. */
  private readonly builtIn = computed(() => {
    const base = this.basePath.replace(/\/$/, '');
    if (this.variant() === 'emblem') {
      const small = SMALL_EMBLEM_SIZES.has(this.size()) ? '-small' : '';
      return {
        light: `${base}/lifecorner-emblem${small}.svg`,
        dark: `${base}/lifecorner-emblem${small}-on-dark.svg`,
      };
    }
    return {
      light: `${base}/lifecorner-logo.svg`,
      dark: `${base}/lifecorner-logo-on-dark.svg`,
    };
  });

  /** Custom light source for the current variant, or empty string. */
  private readonly customSrc = computed(() =>
    this.variant() === 'emblem' ? this.emblemSrc() : this.src(),
  );

  readonly logoSrc = computed(() => this.customSrc() || this.builtIn().light);

  /**
   * Dark-theme source for the current variant: the custom dark source, else
   * the built-in dark drawing — unless a custom light logo is set without a
   * dark partner (the kit never recolours a brand), then empty string.
   */
  readonly logoDarkSrc = computed(() => {
    const customDark = this.variant() === 'emblem' ? this.darkEmblemSrc() : this.darkSrc();
    if (customDark) {
      return customDark;
    }
    return this.customSrc() ? '' : this.builtIn().dark;
  });

  /**
   * Which sources are in the DOM. Without a dark source there is only the one
   * image. With one, an explicit `colorMode` renders that side alone; `auto`
   * renders BOTH and lets the stylesheet show the one matching the root theme
   * class — that way the swap follows the app theme (also when it is toggled
   * without `ThemeService`, e.g. Storybook), needs no JS, and is right on the
   * first paint.
   */
  readonly showLightSrc = computed(() => !this.logoDarkSrc() || this.colorMode() !== 'dark');
  readonly showDarkSrc = computed(() => !!this.logoDarkSrc() && this.colorMode() !== 'light');

  readonly logoClasses = computed(() => {
    const classes = [`size-${this.size()}`];
    if (this.clickable()) {
      classes.push('clickable');
    }
    return classes.join(' ');
  });
}

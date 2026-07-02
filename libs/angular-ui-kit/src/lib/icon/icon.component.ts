import {
  Component,
  input,
  computed,
  signal,
  effect,
  isDevMode,
  ChangeDetectionStrategy,
  inject,
} from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { retry, throwError, timer } from 'rxjs';
import { ICON_ALIASES } from './icon-aliases';
import { INLINE_ICON_SVGS } from './icon-inline-svgs';
import { isValidIconName } from './icon-catalog';

export type IconVariant = 'outline' | 'solid';
export type IconSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

/**
 * Visible placeholder rendered when an icon cannot be resolved (unknown name or
 * failed asset load). Deliberately distinct from any real icon — a dashed frame
 * with a "?" — so missing icons are immediately obvious instead of showing an
 * empty space or an ambiguous glyph.
 */
const ICON_FALLBACK_SVG =
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">' +
  '<rect x="3.5" y="3.5" width="17" height="17" rx="3" stroke-dasharray="2.5 2.5" />' +
  '<text x="12" y="16.5" text-anchor="middle" font-size="12" font-weight="700" font-family="system-ui, -apple-system, sans-serif" fill="currentColor" stroke="none">?</text>' +
  '</svg>';

/**
 * Icon component - Tabler Icons wrapper for displaying SVG icons
 *
 * Features:
 * - Signal-based reactive API
 * - Support for outline and solid variants
 * - Multiple size options (xs, sm, md, lg, xl)
 * - Custom color support (CSS colors, variables)
 * - Accessibility attributes (ARIA labels, decorative icons)
 * - Dynamic SVG loading from Tabler Icons
 * - Fail-loud on unknown names: a dev-mode warning + a visible placeholder
 *   (never a silent empty space). See {@link ICON_NAMES} / {@link isValidIconName}
 *   for the canonical set of valid names, and {@link ICON_ALIASES} for the
 *   supported Heroicon/Material aliases.
 *
 * @example
 * ```html
 * <!-- Basic usage -->
 * <lc-icon name="user" />
 *
 * <!-- With variant and size -->
 * <lc-icon name="check" variant="solid" size="lg" />
 *
 * <!-- With custom color -->
 * <lc-icon name="arrow-right" color="#FF5733" />
 *
 * <!-- With CSS variable color -->
 * <lc-icon name="star" color="var(--color-primary-500)" />
 *
 * <!-- With accessibility label -->
 * <lc-icon name="user" ariaLabel="User profile" />
 *
 * <!-- Decorative icon (hidden from screen readers) -->
 * <lc-icon name="sparkles" [decorative]="true" />
 *
 * <!-- Strict: throw in dev when the name is unknown (catch typos in CI) -->
 * <lc-icon name="beaker" [strict]="true" />
 * ```
 */
@Component({
  selector: 'lc-icon',
  standalone: true,
  imports: [],
  templateUrl: './icon.component.html',
  styleUrls: ['./icon.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class IconComponent {
  private readonly sanitizer = inject(DomSanitizer);
  private readonly http = inject(HttpClient);

  /**
  * Icon name from Tabler Icons library
   * @example "user", "check", "arrow-right"
   */
  readonly name = input<string>('');

  /**
   * Icon variant (outline or solid)
   * @default "outline"
   */
  readonly variant = input<IconVariant>('outline');

  /**
   * Icon size
   * - xs: 16px
   * - sm: 20px
   * - md: 24px (default)
   * - lg: 32px
   * - xl: 40px
   * @default "md"
   */
  readonly size = input<IconSize>('md');

  /**
   * Icon color
   * Can be:
   * - CSS color: "#FF5733", "rgb(255, 87, 51)"
   * - CSS variable: "var(--color-primary-500)"
   * - "currentColor" (default - inherits from parent)
   * @default "currentColor"
   */
  readonly color = input<string>('currentColor');

  /**
   * Accessible label for screen readers
   * Required if icon has semantic meaning
   */
  readonly ariaLabel = input<string>();

  /**
   * Whether icon is purely decorative (hidden from screen readers)
   * @default false
   */
  readonly decorative = input<boolean>(false);

  /**
   * Strict mode. When `true` and the name is not a valid icon (see
   * {@link isValidIconName}), the component **throws** in development mode
   * instead of only warning — useful as a CI guard to catch typos/unknown
   * names. No effect in production builds.
   * @default false
   */
  readonly strict = input<boolean>(false);

  /**
  * SVG content loaded from Tabler Icons
   * @internal
   */
  readonly svgContent = signal<SafeHtml>('');

  /**
   * Computed path to SVG file
   * @internal
   */
  readonly iconPath = computed(() => {
    const rawName = this.name();
    const iconVariant = this.variant();
    if (!rawName) return '';
    const iconName = ICON_ALIASES[rawName] ?? rawName;
    const tablerVariant = iconVariant === 'solid' ? 'filled' : 'outline';
    return `/tabler-icons/${tablerVariant}/${iconName}.svg`;
  });

  /**
   * Computed size in pixels
   * @internal
   */
  readonly sizeInPixels = computed(() => {
    const sizeMap: Record<IconSize, string> = {
      xs: '16px',
      sm: '20px',
      md: '24px',
      lg: '32px',
      xl: '40px',
    };
    return sizeMap[this.size()];
  });

  /**
   * Computed CSS classes
   * @internal
   */
  readonly computedClasses = computed(() => {
    const classes = ['icon-container', `icon-${this.size()}`, `icon-${this.variant()}`];

    return classes.join(' ');
  });

  /**
   * Computed inline color style
   * @internal
   */
  readonly colorStyle = computed(() => {
    return this.color();
  });

  constructor() {
    // Load SVG content when name or variant changes
    effect(() => {
      const rawName = this.name();
      const iconVariant = this.variant();

      if (!rawName) {
        this.svgContent.set('');
        return;
      }

      // Fail loud on names outside the canonical set (typos, un-aliased
      // Heroicon names, …). We still attempt to load below, so anything that
      // *is* servable keeps working — this only surfaces the problem instead of
      // silently rendering an empty icon.
      if (!isValidIconName(rawName) && isDevMode()) {
        console.warn(
          `[lc-icon] Unknown icon "${rawName}". Use a Tabler name or a documented alias (see ICON_NAMES / ICON_ALIASES).`
        );
        if (this.strict()) {
          throw new Error(
            `[lc-icon] Unknown icon "${rawName}" (strict mode). Use a Tabler name or a documented alias.`
          );
        }
      }

      // Resolve aliases (Heroicon/Material -> Tabler)
      const iconName = ICON_ALIASES[rawName] ?? rawName;

      // Try to use inline SVG first (avoids HTTP request)
      const inlineSvg = INLINE_ICON_SVGS[iconName]?.[iconVariant];
      if (inlineSvg) {
        const processed = this.processSvgString(inlineSvg);
        this.svgContent.set(this.sanitizer.bypassSecurityTrustHtml(processed));
        return;
      }

      // Fallback to HTTP loading (may not work in all environments)
      const path = this.iconPath();
      if (!path) {
        this.svgContent.set('');
        return;
      }

      // Fetch SVG content. Transient failures (connection reset, timeout,
      // 5xx) — e.g. a burst of icons overwhelming the dev server — are retried
      // with a short backoff before falling back, so a hiccup does not leave an
      // otherwise-valid icon stuck on the placeholder. A genuine 404 (missing
      // asset) is not retried.
      this.http
        .get(path, { responseType: 'text' })
        .pipe(
          retry({
            count: 2,
            delay: (error, retryCount) =>
              error instanceof HttpErrorResponse && error.status === 404
                ? throwError(() => error)
                : timer(200 * retryCount),
          })
        )
        .subscribe({
        next: (svgText) => {
          // Process SVG to add our attributes
          const processed = this.processSvgString(svgText);
          this.svgContent.set(this.sanitizer.bypassSecurityTrustHtml(processed));
        },
        error: () => {
          // Asset missing or unreachable: render a visible placeholder so the
          // gap is obvious rather than an empty space. Unknown names were
          // already reported above; a known-but-unloadable name (e.g. offline,
          // SSR, or unit tests where assets are not served) stays quiet here to
          // avoid console noise.
          const processed = this.processSvgString(ICON_FALLBACK_SVG);
          this.svgContent.set(this.sanitizer.bypassSecurityTrustHtml(processed));
        },
      });
    });
  }

  /**
   * Process SVG string to add size, color, and accessibility attributes
   * @private
   */
  private processSvgString(svgText: string): string {
    // Parse as DOM to manipulate
    const parser = new DOMParser();
    const doc = parser.parseFromString(svgText, 'image/svg+xml');
    const svg = doc.querySelector('svg');

    if (!svg) return svgText;

    // Set size
    const size = this.sizeInPixels();
    svg.setAttribute('width', size);
    svg.setAttribute('height', size);

    // Set color
    const color = this.colorStyle();
    svg.style.color = color;

    // Set accessibility attributes
    if (this.decorative()) {
      svg.setAttribute('aria-hidden', 'true');
      svg.removeAttribute('role');
      svg.removeAttribute('aria-label');
    } else {
      svg.setAttribute('role', 'img');
      svg.removeAttribute('aria-hidden');

      const label = this.ariaLabel();
      if (label) {
        svg.setAttribute('aria-label', label);
      } else {
        svg.removeAttribute('aria-label');
      }
    }

    return new XMLSerializer().serializeToString(svg);
  }
}

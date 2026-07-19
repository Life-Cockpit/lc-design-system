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
 * Icon names already reported to the console. A page with dozens of instances
 * of the same typo must produce exactly one warning, not one per instance —
 * and the warning fires in production too (unlike the old dev-only warning,
 * which left prod incidents invisible in the console).
 */
const warnedIconNames = new Set<string>();

function warnOnce(name: string, message: string): void {
  if (warnedIconNames.has(name)) return;
  warnedIconNames.add(name);
  console.warn(message);
}

/**
 * Clears the warn-once-per-name registry. Only needed by unit tests that
 * assert on console warnings across multiple cases.
 * @internal
 */
export function resetIconWarnings(): void {
  warnedIconNames.clear();
}

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
 * - Fail-loud on unknown names: a console warning (once per name, in dev AND
 *   prod) + a visible placeholder (never a silent empty space) — and **no
 *   network request**, because in SPA deployments the server answers missing
 *   asset paths with the index.html fallback. See {@link ICON_NAMES} /
 *   {@link isValidIconName} for the canonical set of valid names, and
 *   {@link ICON_ALIASES} for the supported Heroicon/Material aliases.
 * - Fetched responses are validated (content-type + parsed `<svg>` root)
 *   before anything is trusted — a non-SVG response (e.g. the SPA index.html
 *   fallback) is dropped and replaced by the placeholder.
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
      // Heroicon names, …) — in dev AND prod, once per name. Crucially, an
      // unknown name is never fetched: in SPA deployments the server answers
      // missing asset paths with the index.html fallback (status 200), so a
      // fetch for a typo'd name would come back as a full HTML document. The
      // placeholder is rendered instead.
      if (!isValidIconName(rawName)) {
        warnOnce(
          rawName,
          `[lc-icon] Unknown icon "${rawName}". Use a Tabler name or a documented alias (see ICON_NAMES / ICON_ALIASES). Rendering a placeholder instead.`
        );
        if (isDevMode() && this.strict()) {
          throw new Error(
            `[lc-icon] Unknown icon "${rawName}" (strict mode). Use a Tabler name or a documented alias.`
          );
        }
        this.renderFallback();
        return;
      }

      // Resolve aliases (Heroicon/Material -> Tabler)
      const iconName = ICON_ALIASES[rawName] ?? rawName;

      // Try to use inline SVG first (avoids HTTP request)
      const inlineSvg = INLINE_ICON_SVGS[iconName]?.[iconVariant];
      if (inlineSvg) {
        const processed = this.processSvgString(inlineSvg);
        if (processed !== null) {
          this.setTrustedSvg(processed);
        } else {
          this.renderFallback();
        }
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
        .get(path, { observe: 'response', responseType: 'text' })
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
        next: (response) => {
          // Validate before anything touches the DOM: SPA deployments answer
          // missing asset paths with `index.html` and status 200 — that
          // document must be dropped, never injected. A text/html content-type
          // is rejected outright; everything else must parse as a standalone
          // <svg> document (see processSvgString).
          const contentType = response.headers.get('content-type') ?? '';
          const processed = contentType.includes('text/html')
            ? null
            : this.processSvgString(response.body ?? '');
          if (processed === null) {
            warnOnce(
              rawName,
              `[lc-icon] "${rawName}": ${path} returned non-SVG content` +
                (contentType ? ` (${contentType})` : '') +
                ' — dropped. In SPA deployments this is typically the index.html fallback for a missing asset.'
            );
            this.renderFallback();
            return;
          }
          this.setTrustedSvg(processed);
        },
        error: () => {
          // Asset missing or unreachable: render a visible placeholder so the
          // gap is obvious rather than an empty space. Unknown names were
          // already reported above; a known-but-unloadable name (e.g. offline,
          // SSR, or unit tests where assets are not served) stays quiet here to
          // avoid console noise.
          this.renderFallback();
        },
      });
    });
  }

  /**
   * The single funnel to `bypassSecurityTrustHtml`. The bypass is only safe
   * because every caller passes the output of {@link processSvgString}, which
   * guarantees the markup is a parsed and re-serialized standalone `<svg>`
   * document — never raw fetched text. Do NOT add callers that skip that
   * validation, and do NOT "simplify" the gates away: without them, a SPA
   * server's index.html fallback (status 200, text/html) gets injected into
   * the page once per icon instance.
   * @private
   */
  private setTrustedSvg(processedSvg: string): void {
    this.svgContent.set(this.sanitizer.bypassSecurityTrustHtml(processedSvg));
  }

  /**
   * Renders the visible "?" placeholder for anything that cannot be resolved
   * to a real icon (unknown name, failed load, non-SVG response).
   * @private
   */
  private renderFallback(): void {
    this.setTrustedSvg(this.processSvgString(ICON_FALLBACK_SVG) ?? ICON_FALLBACK_SVG);
  }

  /**
   * Parse an SVG string and add size, color, and accessibility attributes.
   *
   * Returns `null` when the input is not a standalone SVG document — a parse
   * error, or a non-`<svg>` root such as an HTML page. Callers must treat
   * `null` as "do not render"; the raw input is never passed through.
   * @private
   */
  private processSvgString(svgText: string): string | null {
    // Parse as DOM to manipulate
    const parser = new DOMParser();
    const doc = parser.parseFromString(svgText, 'image/svg+xml');
    const svg = doc.documentElement;

    // Reject anything that is not a clean, standalone <svg> document. On
    // parse errors DOMParser yields a <parsererror> root (Firefox) or embeds
    // a <parsererror> element in partially-parsed output (Chromium) — both
    // must never reach the DOM.
    if (
      svg.nodeName.toLowerCase() !== 'svg' ||
      doc.getElementsByTagName('parsererror').length > 0
    ) {
      return null;
    }

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

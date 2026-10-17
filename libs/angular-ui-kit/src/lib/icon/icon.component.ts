import {
  Component,
  ElementRef,
  input,
  computed,
  signal,
  effect,
  isDevMode,
  ChangeDetectionStrategy,
  inject,
  PLATFORM_ID,
  viewChild,
} from '@angular/core';
import { DOCUMENT, isPlatformBrowser } from '@angular/common';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, catchError, map, of, retry, shareReplay, tap, throwError, timer } from 'rxjs';
import { isValidIconName } from '@lifecorner/angular-ui-kit/icon-names';
import { ICON_ALIASES } from './icon-aliases';
import { resolveInlineIconSvg } from './icon-inline-lookup';
import { buildSvg, looksLikeSvgDocument } from './icon-svg-builder';
import { decorateSvg, parseBundledSvg, placeholderSvg } from './icon-dom';

export type IconVariant = 'outline' | 'solid';
export type IconSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

/**
 * The form every icon name has (all 5,161 do): lower-case words joined by `-`
 * or `_`, at most 64 characters. Production builds check names by this form
 * only; the full list is for development builds (3.5, AS-15).
 */
const ICON_NAME_FORM = /^[a-z0-9]+(?:[-_][a-z0-9]+)*$/;
const MAX_ICON_NAME_LENGTH = 64;

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

const unknownIconMessage = (name: string) =>
  `[lc-icon] Unknown icon "${name}". Use a Tabler name or a documented alias (see ICON_NAMES / ICON_ALIASES). Rendering a placeholder instead.`;

/**
 * Outcome of one asset fetch. A 404 is an outcome too, so the cache keeps it
 * and a later instance of the same missing name asks no second time.
 */
type IconFetchResult =
  | { kind: 'svg'; svg: SVGElement }
  | { kind: 'non-svg'; contentType: string }
  | { kind: 'dropped'; reason: string }
  | { kind: 'failed'; status: string };

/**
 * One in-flight/completed fetch per asset path, shared by every `lc-icon`
 * instance on the page (a table with 200 rows of the same status icon used to
 * fire 200 identical requests). Transient failures are evicted so the next
 * instance tries again; a completed one — valid, dropped or 404 — is kept.
 */
const iconFetchCache = new Map<string, Observable<IconFetchResult>>();

const isNotFound = (error: unknown) => error instanceof HttpErrorResponse && error.status === 404;

function fetchIcon(http: HttpClient, doc: Document, path: string): Observable<IconFetchResult> {
  let cached = iconFetchCache.get(path);
  if (!cached) {
    cached = http.get(path, { observe: 'response', responseType: 'text' }).pipe(
      // Transient failures (connection reset, timeout, 5xx) — e.g. a burst of
      // icons overwhelming the dev server — are retried with a short backoff
      // before falling back, so a hiccup does not leave an otherwise-valid
      // icon stuck on the placeholder. A genuine 404 (missing asset) is not
      // retried.
      retry({
        count: 2,
        delay: (error, retryCount) => (isNotFound(error) ? throwError(() => error) : timer(200 * retryCount)),
      }),
      // Validate before anything touches the DOM: SPA deployments answer
      // missing asset paths with `index.html` and status 200 — that document
      // must be dropped, never rendered. A text/html content-type is rejected
      // outright; everything else is rebuilt through the allow-list builder,
      // which creates the <svg> node by node and never hands text to a parser.
      map((response): IconFetchResult => {
        const contentType = response.headers.get('content-type') ?? '';
        const body = response.body ?? '';
        if (contentType.includes('text/html') || !looksLikeSvgDocument(body)) return { kind: 'non-svg', contentType };
        const built = buildSvg(doc, body);
        return built.svg ? { kind: 'svg', svg: built.svg } : { kind: 'dropped', reason: built.reason };
      }),
      catchError((error: unknown) => (isNotFound(error) ? of<IconFetchResult>({ kind: 'failed', status: '404' }) : throwError(() => error))),
      tap({ error: () => iconFetchCache.delete(path) }),
      shareReplay({ bufferSize: 1, refCount: false })
    );
    iconFetchCache.set(path, cached);
  }
  return cached;
}

/**
 * Clears the shared per-path fetch cache. Only needed by unit tests, whose
 * `HttpTestingController` is recreated per test.
 * @internal
 */
export function resetIconCache(): void {
  iconFetchCache.clear();
}

/** What the container shows: nothing, a bundled constant, a fetched (built) icon, or the placeholder. */
type IconSource =
  | { kind: 'none' }
  | { kind: 'bundled'; markup: string }
  | { kind: 'fetched'; svg: SVGElement }
  | { kind: 'placeholder' };

const NO_ICON: IconSource = { kind: 'none' };
const PLACEHOLDER: IconSource = { kind: 'placeholder' };

/**
 * Icon component - Tabler Icons wrapper for displaying SVG icons
 *
 * Features:
 * - Signal-based reactive API
 * - Support for outline and solid variants
 * - Multiple size options (xs, sm, md, lg, xl)
 * - Custom color support (CSS colors, variables)
 * - Accessibility attributes (ARIA labels, decorative icons)
 * - Inline SVGs for the common icons (a hand-picked set plus Tabler icons
 *   inlined at build time, see {@link isInlineIconName}): no request, they
 *   render offline and in prerendered HTML; looked up by the name as written,
 *   then by its alias target
 * - Dynamic SVG loading from Tabler Icons for everything else
 * - Fail-loud on unknown names: a console warning (once per name, in dev AND
 *   prod) + a visible placeholder (never a silent empty space). Development
 *   builds check every name against {@link ICON_NAMES} / {@link isValidIconName}
 *   and request **no** unknown name, because in SPA deployments the server
 *   answers missing asset paths with the index.html fallback. Production
 *   builds leave the ~5,000 names out of the bundle (3.5, AS-15): they check
 *   a name only by its form, request a well-formed unknown name once per
 *   page, and show the placeholder when the answer is not an icon. See
 *   {@link ICON_ALIASES} for the supported Heroicon/Material aliases.
 * - Fetched responses are validated before anything reaches the page: a
 *   `text/html` or non-SVG response (e.g. the SPA index.html fallback) is
 *   dropped, and an SVG is rebuilt from an allow-list — basic shapes (`g`,
 *   `path`, `circle`, `ellipse`, `line`, `polyline`, `polygon`, `rect`,
 *   `text`) with paint and geometry attributes. Scripts, event handlers,
 *   references (`href`, `url(…)`) and anything else drop the icon, which
 *   then shows the placeholder.
 * - One request per asset path per page (shared cache, a 404 included); a
 *   name change cancels the instance's pending load so a slow old response
 *   never overwrites the newer icon; `size` / `color` / `decorative` /
 *   `ariaLabel` re-decorate the rendered `<svg>` in place, without refetching.
 *
 * **Trusted Types** (3.5, AS-14): bundled icons go through one policy,
 * `lc-icon`, created on the first icon render; it accepts only the kit's own
 * SVG strings. If your Content Security Policy enforces Trusted Types, add
 * `lc-icon` to its `trusted-types` directive (with two copies of the kit on
 * one page, the second needs `'allow-duplicates'`). Fetched icons need no
 * policy: they are rebuilt node by node from the allow-list above. When the
 * page refuses the policy, bundled icons show the placeholder and the console
 * says so once. No sanitizer bypass, no HTML binding.
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
  private readonly http = inject(HttpClient);
  private readonly doc = inject(DOCUMENT);
  /**
   * Fetching needs a browser; the server renders inline icons and the
   * placeholder (through the allow-list builder) and leaves fetched names
   * empty — the client takes over on hydration.
   */
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));
  private readonly container = viewChild.required<ElementRef<HTMLElement>>('container');

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
   * What the container shows for the current name/variant. Loading writes
   * here; the element and its decoration are derived below.
   */
  private readonly source = signal<IconSource>(NO_ICON);

  /**
   * A fresh `<svg>` for the current source, undecorated. It depends on the
   * source only, so a change of `size`, `color`, `decorative` or `ariaLabel`
   * re-decorates the same element instead of building a new one.
   */
  private readonly svgElement = computed<SVGElement | null>(() => {
    const source = this.source();
    switch (source.kind) {
      case 'none':
        return null;
      case 'fetched':
        return source.svg.cloneNode(true) as SVGElement;
      case 'bundled': {
        const svg = this.isBrowser ? parseBundledSvg(this.doc, source.markup) : (buildSvg(this.doc, source.markup).svg ?? null);
        return svg ?? placeholderSvg(this.doc, this.isBrowser);
      }
      case 'placeholder':
        return placeholderSvg(this.doc, this.isBrowser);
    }
  });

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
    // Resolve the source when name or variant changes.
    effect((onCleanup) => {
      const rawName = this.name();
      const iconVariant = this.variant();

      if (!rawName) {
        this.source.set(NO_ICON);
        return;
      }

      // Fail loud on names outside the canonical set (typos, un-aliased
      // Heroicon names, …), once per name. Development builds check the full
      // list and never fetch an unknown name: in SPA deployments the server
      // answers missing asset paths with the index.html fallback (status 200).
      // Production builds fold this branch away (ngDevMode is false there),
      // so the list stays out of the bundle; they check the name's form and
      // validate whatever the server answers instead.
      if (typeof ngDevMode === 'undefined' || ngDevMode) {
        if (!isValidIconName(rawName)) {
          warnOnce(rawName, unknownIconMessage(rawName));
          if (isDevMode() && this.strict()) {
            throw new Error(
              `[lc-icon] Unknown icon "${rawName}" (strict mode). Use a Tabler name or a documented alias.`
            );
          }
          this.source.set(PLACEHOLDER);
          return;
        }
      } else if (rawName.length > MAX_ICON_NAME_LENGTH || !ICON_NAME_FORM.test(rawName)) {
        warnOnce(rawName, unknownIconMessage(rawName));
        this.source.set(PLACEHOLDER);
        return;
      }

      // Inline markup first (no request; renders offline and in prerendered
      // HTML): by the name as written, then by its alias target (G-7).
      const inlineSvg = resolveInlineIconSvg(rawName, iconVariant);
      if (inlineSvg) {
        this.source.set({ kind: 'bundled', markup: inlineSvg });
        return;
      }

      // Everything else is fetched, in the browser only. While it loads the
      // container is empty (it keeps its px size).
      const path = this.iconPath();
      this.source.set(NO_ICON);
      if (!path || !this.isBrowser) return;

      const subscription = fetchIcon(this.http, this.doc, path).subscribe({
        next: (result) => {
          switch (result.kind) {
            case 'svg':
              this.source.set({ kind: 'fetched', svg: result.svg });
              return;
            case 'non-svg':
              warnOnce(
                rawName,
                `[lc-icon] "${rawName}": ${path} returned non-SVG content` +
                  (result.contentType ? ` (${result.contentType})` : '') +
                  ' — dropped. In SPA deployments this is typically the index.html fallback for a missing asset.'
              );
              break;
            case 'dropped':
              warnOnce(
                rawName,
                `[lc-icon] "${rawName}": ${path} was dropped: ${result.reason}. Fetched icons may contain only basic shapes with paint and geometry attributes. Rendering a placeholder instead.`
              );
              break;
            case 'failed':
              this.warnLoadFailure(rawName, path, result.status);
              break;
          }
          this.source.set(PLACEHOLDER);
        },
        error: (error: unknown) => {
          // Asset unreachable after the retries: render a visible placeholder
          // so the gap is obvious rather than an empty space.
          this.warnLoadFailure(rawName, path, error instanceof HttpErrorResponse && error.status ? String(error.status) : 'network error');
          this.source.set(PLACEHOLDER);
        },
      });
      // A name/variant change (or destroy) while the load is in flight: stop
      // listening, so a slow old response cannot overwrite the newer icon.
      onCleanup(() => subscription.unsubscribe());
    });

    // Put the element into the container and decorate it with the CURRENT
    // inputs. Runs during change detection, so it also runs on the server and
    // the prerendered HTML carries the decorated <svg>. After hydration it
    // replaces the server's <svg> with the client's. Built with the document's
    // own DOM APIs, never the renderer: the renderer would stamp _ngcontent
    // attributes onto every node and change the SVG's DOM.
    effect(() => {
      const host = this.container().nativeElement;
      const svg = this.svgElement();
      if (svg) {
        decorateSvg(svg, {
          size: this.sizeInPixels(),
          color: this.colorStyle(),
          decorative: this.decorative(),
          label: this.ariaLabel(),
        });
      }
      const inPlace = svg ? host.childNodes.length === 1 && host.firstChild === svg : host.childNodes.length === 0;
      if (inPlace) return;
      while (host.firstChild) host.removeChild(host.firstChild);
      if (svg) host.appendChild(svg);
    });
  }

  /**
   * A known name whose asset can't be loaded stays quiet in development (as
   * before: unit tests and offline work have no assets). Production can't
   * tell it from a typo — the list isn't there — so it says so, once.
   */
  private warnLoadFailure(name: string, path: string, status: string): void {
    if (typeof ngDevMode === 'undefined' || ngDevMode) return;
    warnOnce(
      name,
      `[lc-icon] "${name}": ${path} could not be loaded (${status}) — an unknown name or a missing asset. Rendering a placeholder instead.`
    );
  }
}

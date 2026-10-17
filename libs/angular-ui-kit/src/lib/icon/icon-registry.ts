import { InjectionToken, Provider, inject } from '@angular/core';
import type { IconVariant } from './icon.component';
import { offerIconSvgs } from './icon-trusted-types';

/**
 * One glyph shipped by the kit (3.6, AS-17). Import the constants from
 * `@lifecorner/angular-ui-kit/icons` (`ICON_HOME`, `ICON_X_MARK_SOLID`, …) and
 * register them with {@link provideLcIcons}. Markup you write yourself is not
 * supported: it has to pass the same allow-list as fetched icons, or it
 * renders the placeholder.
 */
export interface LcIconDefinition {
  /** The 3.5.1 key of the glyph, e.g. `x-mark` or `mail` (aliases resolve to it). */
  readonly name: string;
  /** The variant the glyph draws. */
  readonly variant: IconVariant;
  /** The SVG markup. */
  readonly svg: string;
}

/**
 * What a kit glyph does that nobody registered (see {@link LcIconOptions}):
 * `'load'` loads the kit's whole set once, as a lazy chunk, and renders it;
 * `'placeholder'` shows the placeholder and warns, so the set never loads.
 */
export type LcIconFallback = 'load' | 'placeholder';

/** App-wide `lc-icon` options. Set them once, in `app.config`. */
export interface LcIconOptions {
  /**
   * What a kit glyph does that nobody registered: `'load'` loads the kit's
   * whole set once, as a lazy chunk, and renders it (the 3.5.1 output, a
   * moment later in a client-only render; prerendered HTML is unchanged);
   * `'placeholder'` shows the placeholder and warns once per name (in
   * production too), so the set never loads. With `'placeholder'`,
   * `<lc-icon [strict]="true">` also throws in development. For
   * `unregistered`, the nearest `provideLcIcons` call that sets it wins.
   * @default 'load'
   */
  readonly unregistered?: LcIconFallback;
}

/**
 * The glyphs one injector registered, linked to the scope above it.
 * @internal
 */
export interface IconScope {
  readonly parent: IconScope | null;
  /** Markup by `variant:name`. */
  readonly glyphs: ReadonlyMap<string, string>;
  /** Set by an app's {@link provideLcIcons} call only. */
  readonly unregistered: LcIconFallback | undefined;
  /** `true` for an app's call, `false` for a kit component's own glyphs. */
  readonly byApp: boolean;
}

/** @internal */
export const LC_ICON_SCOPE = new InjectionToken<IconScope>('LC_ICON_SCOPE');

interface IconContribution {
  readonly icons: readonly LcIconDefinition[];
  readonly options: LcIconOptions;
}

/** Every provideLcIcons call of one injector (several calls add up). */
const LC_ICON_CONTRIBUTIONS = new InjectionToken<readonly IconContribution[]>('LC_ICON_CONTRIBUTIONS');

const glyphKey = (name: string, variant: IconVariant) => `${variant}:${name}`;

function glyphMap(icons: readonly LcIconDefinition[]): Map<string, string> {
  const glyphs = new Map<string, string>();
  for (const icon of icons) glyphs.set(glyphKey(icon.name, icon.variant), icon.svg);
  return glyphs;
}

function parentScope(): IconScope | null {
  return inject(LC_ICON_SCOPE, { skipSelf: true, optional: true });
}

function appScope(): IconScope {
  const glyphs = new Map<string, string>();
  let unregistered: LcIconFallback | undefined;
  for (const { icons, options } of inject(LC_ICON_CONTRIBUTIONS)) {
    for (const [key, svg] of glyphMap(icons)) glyphs.set(key, svg);
    if (options.unregistered) unregistered = options.unregistered;
  }
  offerIconSvgs(glyphs.values());
  return { parent: parentScope(), glyphs, unregistered, byApp: true };
}

/**
 * Registers kit glyphs for every `lc-icon` below this injector: `app.config`,
 * a route's `providers` or a component's `providers` (3.6, AS-17). Registered
 * glyphs render synchronously, in prerendered HTML too, and only they (plus
 * the kit's internal ones) are bundled. Glyphs add up along the injector tree
 * and across several calls in one injector; for `unregistered`, the nearest
 * call that sets it wins.
 *
 * Without any call, every 3.5.1 name still renders: the kit's set loads once,
 * lazily (see {@link LcIconOptions}).
 *
 * @example
 * ```ts
 * // app.config.ts — provideLcIcons from the icon entry, the ICON_* constants
 * // from the icons entry (@lifecorner/angular-ui-kit/icons).
 * export const appConfig: ApplicationConfig = {
 *   providers: [provideLcIcons([ICON_HOME, ICON_MAIL, ICON_X_MARK], { unregistered: 'placeholder' })],
 * };
 * ```
 */
export function provideLcIcons(icons: readonly LcIconDefinition[], options: LcIconOptions = {}): Provider[] {
  return [
    { provide: LC_ICON_CONTRIBUTIONS, multi: true, useValue: { icons, options } satisfies IconContribution },
    { provide: LC_ICON_SCOPE, useFactory: appScope },
  ];
}

/**
 * The glyphs a kit component renders itself (chevrons, close, status icons),
 * for its `viewProviders`. Sets no `unregistered` mode and does not count as
 * the app registering glyphs. Not documented for apps; use
 * {@link provideLcIcons}.
 */
export function ɵprovideKitIcons(icons: readonly LcIconDefinition[]): Provider {
  const glyphs = glyphMap(icons);
  return {
    provide: LC_ICON_SCOPE,
    useFactory: (): IconScope => ({ parent: parentScope(), glyphs, unregistered: undefined, byApp: false }),
  };
}

/**
 * The registered markup for a name and variant, nearest scope first.
 * @internal
 */
export function findRegisteredGlyph(scope: IconScope | null, name: string, variant: IconVariant): string | undefined {
  const key = glyphKey(name, variant);
  for (let s = scope; s; s = s.parent) {
    const svg = s.glyphs.get(key);
    if (svg !== undefined) return svg;
  }
  return undefined;
}

/**
 * The nearest `unregistered` setting, `'load'` when nobody set one.
 * @internal
 */
export function unregisteredFallback(scope: IconScope | null): LcIconFallback {
  for (let s = scope; s; s = s.parent) if (s.unregistered) return s.unregistered;
  return 'load';
}

/**
 * Whether the app registers glyphs anywhere above this scope.
 * @internal
 */
export function appRegistersIcons(scope: IconScope | null): boolean {
  for (let s = scope; s; s = s.parent) if (s.byApp) return true;
  return false;
}

// The canonical `lc-icon` name list and its validator (public API). A separate
// entry, `@lifecorner/angular-ui-kit/icon-names`, so that production bundles
// leave the ~5,000 names out unless the app imports them itself (AS-15).
import { ICON_NAMES } from './icon-names.data';

export { ICON_NAMES } from './icon-names.data';

/** Built on the first call, so importing the entry costs nothing until it is used. */
let iconNameSet: ReadonlySet<string> | undefined;

/**
 * Whether `name` is a valid `lc-icon` name — i.e. a served Tabler icon, a
 * documented alias ({@link ICON_ALIASES}), or an inlined icon.
 *
 * `lc-icon` uses it in development builds only, so production bundles leave
 * the list out unless the app imports it.
 *
 * @example
 * ```ts
 * isValidIconName('flask');       // true  (Tabler)
 * isValidIconName('x-mark');      // true  (Heroicon alias)
 * isValidIconName('beaker');      // false (not a Tabler name — did you mean 'flask'?)
 * ```
 */
export function isValidIconName(name: string): boolean {
  iconNameSet ??= new Set(ICON_NAMES);
  return iconNameSet.has(name);
}

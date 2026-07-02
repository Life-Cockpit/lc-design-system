// Canonical `lc-icon` name catalog + validation helpers (public API).
import { ICON_NAMES } from './icon-names.data';

export { ICON_NAMES } from './icon-names.data';
export { ICON_ALIASES } from './icon-aliases';

/**
 * A valid `lc-icon` name.
 *
 * There are ~5000 valid names, so this is intentionally a broad `string` alias
 * rather than a giant union type (which would bloat editors and builds). Prefer
 * runtime validation via {@link isValidIconName}, or lint your usages against
 * the {@link ICON_NAMES} array (also shipped as `icon-names.json`).
 */
export type IconName = string;

const ICON_NAME_SET: ReadonlySet<string> = new Set(ICON_NAMES);

/**
 * Whether `name` is a valid `lc-icon` name — i.e. a served Tabler icon, a
 * documented alias ({@link ICON_ALIASES}), or an inlined icon.
 *
 * @example
 * ```ts
 * isValidIconName('flask');       // true  (Tabler)
 * isValidIconName('x-mark');      // true  (Heroicon alias)
 * isValidIconName('beaker');      // false (not a Tabler name — did you mean 'flask'?)
 * ```
 */
export function isValidIconName(name: string): boolean {
  return ICON_NAME_SET.has(name);
}

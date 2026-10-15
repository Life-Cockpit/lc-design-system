// Canonical `lc-icon` name catalog + validation helpers (public API).
import { ICON_NAMES } from './icon-names.data';
import type { IconVariant } from './icon.component';
import { resolveInlineIconSvg } from './icon-inline-lookup';

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

/**
 * Whether `name` renders from markup shipped in the kit — no request, so it
 * shows offline, at once and in prerendered HTML (3.3, gap G-7). Covers the
 * hand-picked inline set, the Tabler icons inlined at build time (mail,
 * users, settings, logout, key, chevron-right, …) and aliases that resolve
 * to either. Use it to lint an app or a static site against icons that would
 * be fetched.
 *
 * @example
 * ```ts
 * isInlineIconName('x-mark');           // true  (hand-picked, by its alias name)
 * isInlineIconName('envelope');         // true  (alias of the inlined Tabler `mail`)
 * isInlineIconName('anchor');           // false (fetched from the Tabler assets)
 * isInlineIconName('robot', 'solid');   // false (Tabler has no filled robot)
 * ```
 */
export function isInlineIconName(name: string, variant: IconVariant = 'outline'): boolean {
  return resolveInlineIconSvg(name, variant) !== undefined;
}


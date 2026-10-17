import type { IconVariant } from './icon.component';
import { ICON_ALIASES } from './icon-aliases';
import { INLINE_HAND_KEYS, INLINE_TABLER_OUTLINE_KEYS, INLINE_TABLER_SOLID_KEYS } from './icon-inline-index.data';

interface InlineIndex {
  readonly hand: ReadonlySet<string>;
  readonly tabler: Readonly<Record<IconVariant, ReadonlySet<string>>>;
}

let index: InlineIndex | undefined;

function inlineIndex(): InlineIndex {
  if (!index) {
    const set = (keys: string) => new Set(keys.split(' '));
    index = {
      hand: set(INLINE_HAND_KEYS),
      tabler: { outline: set(INLINE_TABLER_OUTLINE_KEYS), solid: set(INLINE_TABLER_SOLID_KEYS) },
    };
  }
  return index;
}

/**
 * The key of the kit glyph a name and variant rendered from in 3.5.1, or
 * `undefined` when the icon has to be fetched. Order (3.3, gap G-7):
 *
 * 1. the hand-picked set by the name as written — many of its keys are
 *    aliases themselves (`x-mark`, `check-circle`, `information-circle`);
 * 2. the same set by the alias target;
 * 3. the Tabler icons inlined at build time by the alias target.
 *
 * The two sets share no key, so the key names the glyph (and its `ICON_*`
 * constant). Since 3.6 (AS-17) this knows the keys only; the markup comes
 * from a registered constant or the lazy `internal/icon-set` entry.
 *
 * @internal
 */
export function resolveInlineGlyph(name: string, variant: IconVariant): string | undefined {
  // A variant outside the type (an untyped template) had no markup in 3.5.1 either.
  if (variant !== 'outline' && variant !== 'solid') return undefined;
  const resolved = ICON_ALIASES[name] ?? name;
  const { hand, tabler } = inlineIndex();
  if (hand.has(name)) return name;
  if (hand.has(resolved)) return resolved;
  if (tabler[variant].has(resolved)) return resolved;
  return undefined;
}

/**
 * The `@lifecorner/angular-ui-kit/icons` constant of a glyph key: `x-mark`
 * → `ICON_X_MARK`, solid → `ICON_X_MARK_SOLID`.
 *
 * @internal
 */
export function iconConstantName(key: string, variant: IconVariant): string {
  return `ICON_${key.toUpperCase().replace(/-/g, '_')}${variant === 'solid' ? '_SOLID' : ''}`;
}

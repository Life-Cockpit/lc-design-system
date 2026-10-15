import type { IconVariant } from './icon.component';
import { ICON_ALIASES } from './icon-aliases';
import { INLINE_ICON_SVGS } from './icon-inline-svgs';
import { INLINE_TABLER_SVGS } from './icon-inline-tabler.data';

/**
 * The inline markup for a name and variant, or `undefined` when the icon has
 * to be fetched. Order (3.3, gap G-7):
 *
 * 1. the hand-picked {@link INLINE_ICON_SVGS} by the name as written — many of
 *    its keys are aliases themselves (`x-mark`, `check-circle`,
 *    `information-circle`); 3.2 resolved the alias first and never found them;
 * 2. the same map by the alias target;
 * 3. the Tabler icons inlined at build time ({@link INLINE_TABLER_SVGS}) by the
 *    alias target.
 *
 * @internal
 */
export function resolveInlineIconSvg(name: string, variant: IconVariant): string | undefined {
  const resolved = ICON_ALIASES[name] ?? name;
  return (
    INLINE_ICON_SVGS[name]?.[variant] ??
    INLINE_ICON_SVGS[resolved]?.[variant] ??
    INLINE_TABLER_SVGS[resolved]?.[variant]
  );
}

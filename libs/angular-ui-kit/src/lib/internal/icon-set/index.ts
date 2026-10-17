/**
 * Internal entry `@lifecorner/angular-ui-kit/internal/icon-set` (3.6, AS-17):
 * the kit's whole 3.5.1 inline set. `lc-icon` imports it with a dynamic
 * `import()`, once per page, only for an inline name that nobody registered,
 * so bundlers put it into a lazy chunk. It must not import
 * `@lifecorner/angular-ui-kit/icons` (or `icon`): a module that both the
 * initial and the lazy graph reach would land in an eagerly loaded chunk.
 * Not part of the public API.
 */
export { INLINE_ICON_SVGS } from './icon-inline-svgs';
export { INLINE_TABLER_NAMES, INLINE_TABLER_SVGS } from './icon-inline-tabler.data';
export type { IconSetVariant } from './icon-set-types';

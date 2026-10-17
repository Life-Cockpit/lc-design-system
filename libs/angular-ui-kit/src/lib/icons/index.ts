/**
 * Public API of the secondary entry `@lifecorner/angular-ui-kit/icons`
 * (3.6, AS-17): one constant per glyph the kit ships, to register with
 * `provideLcIcons()` from `@lifecorner/angular-ui-kit/icon`. Each constant is
 * a plain object literal, so a bundler keeps only the ones an app imports.
 *
 * Name: `ICON_` plus the 3.5.1 key in upper snake case (`x-mark` →
 * `ICON_X_MARK`); the solid glyph adds `_SOLID`. `BUNDLED_ICONS` holds all 133.
 */
export * from './icons.data';

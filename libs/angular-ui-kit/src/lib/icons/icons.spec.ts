import { readFileSync, readdirSync } from 'fs';
import { join } from 'path';
import * as ICONS from './index';
import { BUNDLED_ICONS } from './index';
import { INLINE_ICON_SVGS, INLINE_TABLER_NAMES, INLINE_TABLER_SVGS } from '@lifecorner/angular-ui-kit/internal/icon-set';
import { INLINE_HAND_KEYS, INLINE_TABLER_OUTLINE_KEYS, INLINE_TABLER_SOLID_KEYS } from '../icon/icon-inline-index.data';
import { iconConstantName } from '../icon/icon-inline-lookup';

/**
 * `@lifecorner/angular-ui-kit/icons` (3.6, AS-17): the constants, the key index
 * of `lc-icon` and the lazy `internal/icon-set` are three copies of 3.5.1's
 * inline maps. They must not drift (regenerate with
 * `node scripts/generate-icon-names.mjs` if this fails).
 */
type Variant = 'outline' | 'solid';

/** Every glyph of the 3.5.1 maps, in generator order: hand-picked keys, then Tabler keys; outline before solid. */
const GLYPHS_351: Array<{ name: string; variant: Variant; svg: string }> = [
  ...Object.entries(INLINE_ICON_SVGS).flatMap(([name, v]) =>
    (['outline', 'solid'] as const).filter((variant) => v[variant]).map((variant) => ({ name, variant, svg: v[variant] })),
  ),
  ...Object.entries(INLINE_TABLER_SVGS).flatMap(([name, v]) =>
    (['outline', 'solid'] as const).filter((variant) => v[variant]).map((variant) => ({ name, variant, svg: v[variant] as string })),
  ),
];

describe('@lifecorner/angular-ui-kit/icons (AS-17)', () => {
  it('BUNDLED_ICONS holds the 133 glyphs of 3.5.1, in order, with identical markup', () => {
    expect(GLYPHS_351).toHaveLength(133);
    expect(BUNDLED_ICONS.map(({ name, variant }) => `${variant}:${name}`)).toEqual(GLYPHS_351.map(({ name, variant }) => `${variant}:${name}`));
    const drift = BUNDLED_ICONS.filter((icon, i) => icon.svg !== GLYPHS_351[i].svg).map((icon) => `${icon.variant}:${icon.name}`);
    expect(drift).toEqual([]);
  });

  it('exports one ICON_* constant per glyph under its documented name, and nothing else', () => {
    const exported = ICONS as unknown as Record<string, unknown>;
    for (const icon of BUNDLED_ICONS) expect(exported[iconConstantName(icon.name, icon.variant)]).toBe(icon);
    const names = Object.keys(exported).filter((n) => n.startsWith('ICON_'));
    expect(names).toHaveLength(133);
    expect(Object.keys(exported).filter((n) => !n.startsWith('ICON_'))).toEqual(['BUNDLED_ICONS']);
    expect(exported['ICON_X_MARK']).toMatchObject({ name: 'x-mark', variant: 'outline' });
    expect(exported['ICON_BARS_3_SOLID']).toMatchObject({ name: 'bars-3', variant: 'solid' });
    expect(exported['ICON_MENU_2']).toMatchObject({ name: 'menu-2', variant: 'outline' });
  });

  it('ships plain object literals only, so a bundler keeps just the imported constants', () => {
    const source = readFileSync(join(__dirname, 'icons.data.ts'), 'utf-8');
    const constants = source.split('\n').filter((line) => line.startsWith('export const ICON_'));
    expect(constants).toHaveLength(133);
    for (const line of constants) {
      expect(line).toMatch(/^export const ICON_[A-Z0-9_]+: LcIconDefinition = \{ name: '[a-z0-9-]+', variant: '(outline|solid)', svg: '<svg [^']*<\/svg>' \};$/);
    }
    // No call, no `new`, no import with a value: nothing that runs at import time.
    const code = source.replace(/'[^']*'/g, "''").replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');
    expect(code).not.toMatch(/\b\w+\s*\(|\bnew\b/);
    expect(source).toMatch(/^import type \{ LcIconDefinition \} from '@lifecorner\/angular-ui-kit\/icon';$/m);
  });

  it("lc-icon's key index lists exactly the keys and variants of the maps", () => {
    expect(INLINE_HAND_KEYS.split(' ')).toEqual(Object.keys(INLINE_ICON_SVGS));
    expect(INLINE_TABLER_OUTLINE_KEYS.split(' ')).toEqual([...INLINE_TABLER_NAMES]);
    expect(INLINE_TABLER_SOLID_KEYS.split(' ')).toEqual(INLINE_TABLER_NAMES.filter((n) => INLINE_TABLER_SVGS[n].solid));
    for (const variants of Object.values(INLINE_ICON_SVGS)) expect(Object.keys(variants).sort()).toEqual(['outline', 'solid']);
  });

  it('the hand-picked and the Tabler keys are disjoint (a key names one glyph)', () => {
    expect(Object.keys(INLINE_ICON_SVGS).filter((k) => k in INLINE_TABLER_SVGS)).toEqual([]);
  });

  it('internal/icon-set imports no other kit entry (it would land in a shared, eagerly loaded chunk)', () => {
    const dir = join(__dirname, '../internal/icon-set');
    for (const file of readdirSync(dir).filter((f) => f.endsWith('.ts') && !f.endsWith('.spec.ts'))) {
      expect({ file, imports: readFileSync(join(dir, file), 'utf-8').match(/from '@lifecorner\/[^']+'/g) }).toEqual({ file, imports: null });
    }
  });
});

import { existsSync, readFileSync, readdirSync, statSync } from 'fs';
import { join, relative, resolve } from 'path';

/**
 * The package layout of the secondary entries (3.5, AS-15): one entry per
 * folder of `src/lib/`, plus `internal/*`. Each entry has a one-line
 * `ng-package.json` stub in `libs/angular-ui-kit/<entry>/` that points at the
 * folder's `index.ts`. ng-packagr is the real guard (a relative import across
 * entries fails the build with TS6059); this spec catches a missing stub, a
 * stray one, and an entry the primary forgets, without a build.
 */
const LIB_ROOT = resolve(__dirname, '../..');
const SRC_LIB = resolve(__dirname);
const PACKAGE = '@lifecorner/angular-ui-kit';

const isDir = (p: string) => existsSync(p) && statSync(p).isDirectory();

/** Entry names (`icon`, `internal/overlay`) of every source folder that has an index.ts. */
function sourceEntries(): string[] {
  const entries: string[] = [];
  for (const name of readdirSync(SRC_LIB)) {
    const dir = join(SRC_LIB, name);
    if (!isDir(dir)) continue;
    if (name === 'internal') {
      for (const sub of readdirSync(dir)) {
        if (existsSync(join(dir, sub, 'index.ts'))) entries.push(`internal/${sub}`);
      }
    } else if (existsSync(join(dir, 'index.ts'))) {
      entries.push(name);
    }
  }
  return entries.sort();
}

/** Every ng-package.json below the library root, except the primary's. */
function stubs(): string[] {
  const found: string[] = [];
  const walk = (dir: string) => {
    for (const name of readdirSync(dir)) {
      if (['src', 'node_modules', '.storybook'].includes(name)) continue;
      const p = join(dir, name);
      if (isDir(p)) walk(p);
      else if (name === 'ng-package.json' && dir !== LIB_ROOT) found.push(relative(LIB_ROOT, dir));
    }
  };
  walk(LIB_ROOT);
  return found.sort();
}

/** Library sources of a folder (no specs, no stories). */
function librarySources(dir: string): string[] {
  const out: string[] = [];
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (isDir(p)) out.push(...librarySources(p));
    else if (name.endsWith('.ts') && !/\.(spec|stories)\.ts$/.test(name)) out.push(p);
  }
  return out;
}

describe('secondary entries (AS-15)', () => {
  const entries = sourceEntries();
  const publicEntries = entries.filter((e) => !e.startsWith('internal/'));

  it('has one entry per folder: 109 public and 3 internal', () => {
    expect(publicEntries).toHaveLength(109);
    expect(entries.filter((e) => e.startsWith('internal/'))).toEqual(['internal/chart', 'internal/overlay', 'internal/url']);
    expect(entries).toContain('icon-names');
    expect(isDir(join(SRC_LIB, 'shared'))).toBe(false);
  });

  it('gives every entry its ng-package.json stub, and has no stray stub', () => {
    expect(stubs()).toEqual(entries);
    for (const entry of entries) {
      const stub = JSON.parse(readFileSync(join(LIB_ROOT, entry, 'ng-package.json'), 'utf-8'));
      const back = entry.split('/').map(() => '..').join('/');
      expect(stub).toEqual({ lib: { entryFile: `${back}/src/lib/${entry}/index.ts` } });
    }
  });

  it('re-exports every public entry, and no internal one, from the primary entry', () => {
    const primary = readFileSync(resolve(LIB_ROOT, 'src/index.ts'), 'utf-8');
    const reexported = [...primary.matchAll(/^export \* from '@lifecorner\/angular-ui-kit\/([^']+)';$/gm)].map((m) => m[1]);
    expect([...reexported].sort()).toEqual(publicEntries);
    expect(primary).not.toMatch(/^export .* from '\.\//m);
  });

  it('imports across entries by package path only, never relatively', () => {
    const offenders: string[] = [];
    for (const entry of entries) {
      for (const file of librarySources(join(SRC_LIB, entry))) {
        const src = readFileSync(file, 'utf-8');
        for (const m of src.matchAll(/from '(\.\.\/[^']*)'/g)) offenders.push(`${relative(SRC_LIB, file)}: ${m[1]}`);
        for (const m of src.matchAll(/from '@lifecorner\/angular-ui-kit(?:\/([^']+))?'/g)) {
          if (!m[1] || !entries.includes(m[1]) || m[1] === entry) offenders.push(`${relative(SRC_LIB, file)}: ${m[0]}`);
        }
      }
    }
    expect(offenders).toEqual([]);
  });

  it('has no cycle between entries', () => {
    const deps = new Map<string, Set<string>>();
    for (const entry of entries) {
      const set = new Set<string>();
      for (const file of librarySources(join(SRC_LIB, entry))) {
        for (const m of readFileSync(file, 'utf-8').matchAll(/from '@lifecorner\/angular-ui-kit\/([^']+)'/g)) set.add(m[1]);
      }
      deps.set(entry, set);
    }
    const state = new Map<string, 'visiting' | 'done'>();
    const cycles: string[] = [];
    const visit = (entry: string, path: string[]) => {
      if (state.get(entry) === 'done') return;
      if (state.get(entry) === 'visiting') {
        cycles.push([...path, entry].join(' → '));
        return;
      }
      state.set(entry, 'visiting');
      for (const dep of deps.get(entry) ?? []) visit(dep, [...path, entry]);
      state.set(entry, 'done');
    };
    for (const entry of entries) visit(entry, []);
    expect(cycles).toEqual([]);
  });

  it('keeps the icon name list out of the icon entry, except behind the development guard', () => {
    const icon = readFileSync(join(SRC_LIB, 'icon/icon.component.ts'), 'utf-8');
    expect(icon).toMatch(/import \{ isValidIconName \} from '@lifecorner\/angular-ui-kit\/icon-names';/);
    // Every use of the list sits behind `typeof ngDevMode === 'undefined' || ngDevMode`,
    // which production builds fold to false, so esbuild drops the entry (AC-18).
    const uses = [...icon.matchAll(/isValidIconName\(/g)].length;
    expect(uses).toBe(1);
    expect(icon).toMatch(/if \(typeof ngDevMode === 'undefined' \|\| ngDevMode\) \{\s*if \(!isValidIconName\(/);
  });

  it(`maps ${PACKAGE}/* to the entry sources for Jest, Storybook and the IDE`, () => {
    const base = JSON.parse(readFileSync(resolve(LIB_ROOT, '../../tsconfig.base.json'), 'utf-8'));
    expect(base.compilerOptions.paths[`${PACKAGE}/*`]).toEqual(['libs/angular-ui-kit/src/lib/*/index.ts']);
  });
});

/**
 * Bundle measurement for request 002 (3.6, AS-17 and AS-18): the initial JS of
 * the F1 shell (tools/compat/bundle, Angular 22, production) against 3.5.1
 * from npm and against this build in three configurations:
 *
 *   A  3.5.1, the app opts into nothing (base)
 *   B  this build, the app opts into nothing (base): every glyph as in 3.5.1, the set lazy
 *   C  this build, 25 glyphs registered, unregistered: 'placeholder' (icons)
 *   D  C plus the side navigation in @defer with lc-sidenav-placeholder (icons + defer)
 *
 * Checks: AC-1 — A − C ≥ 7 kB gzip and no glyph nobody registered (the robot
 * path) in C's initial chunks; AC-8 — C − D ≥ 6 kB gzip and lc-sidenav's own
 * code (its drawer close button class) in no initial chunk of D, but in a lazy one.
 * Sizes: the initial JS chunks (main and its static imports, from the esbuild
 * metafile), raw and gzip -9; kB = 1000 bytes.
 *
 * Used by check-angular-majors.mjs --measure (needs the network: npm).
 */
import { cpSync, existsSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { gzipSync } from 'node:zlib';

const HERE = dirname(fileURLToPath(import.meta.url));
const FIXTURE = join(HERE, 'bundle');
const ANGULAR = '^22.0.0';

/** The robot glyph's own paths: only in the kit's full set, never registered by the fixture. */
const ROBOT = '<path d="M5 16l4 -2"/><path d="M15 14l4 2"/>';
/** A class only lc-sidenav's own template and styles have (the drawer's close button). */
const SIDENAV_ONLY = 'lc-sidenav__close';

const kb = (n) => `${(n / 1000).toFixed(2)} kB`;

function app(work, name, kit, run) {
  const dir = join(work, `bundle-${name}`);
  rmSync(dir, { recursive: true, force: true });
  cpSync(FIXTURE, dir, { recursive: true });
  const a = ANGULAR;
  const dependencies = {
    '@angular/cdk': a, '@angular/common': a, '@angular/compiler': a, '@angular/core': a, '@angular/forms': a,
    '@angular/platform-browser': a, '@angular/router': a, '@lifecorner/angular-ui-kit': kit, rxjs: '~7.8.0', tslib: '^2.3.0',
  };
  const devDependencies = { '@angular/build': a, '@angular/cli': a, '@angular/compiler-cli': a, typescript: '~6.0.2' };
  writeFileSync(join(dir, 'package.json'), JSON.stringify({ name: `lc-bundle-${name}`, private: true, dependencies, devDependencies }, null, 2));
  const install = run('npm', ['install', '--no-audit', '--no-fund', '--loglevel=error'], dir);
  if (install.code !== 0) throw new Error(`npm install (bundle-${name}) failed:\n${install.out.slice(-1500)}`);
  return dir;
}

/** Initial JS (main and its static imports) of a browser build, and the lazy JS files. */
function analyze(out) {
  const statsFile = ['stats.json', 'browser-stats.json'].map((f) => join(out, f)).find(existsSync);
  const { outputs } = JSON.parse(readFileSync(statsFile, 'utf8'));
  const main = Object.keys(outputs).find((o) => outputs[o].entryPoint?.endsWith('src/main.ts'));
  const initial = new Set();
  const walk = (o) => {
    if (initial.has(o)) return;
    initial.add(o);
    for (const imp of outputs[o].imports ?? []) if (imp.kind === 'import-statement' && outputs[imp.path]) walk(imp.path);
  };
  walk(main);
  const browser = existsSync(join(out, 'browser')) ? join(out, 'browser') : out;
  const read = (o) => readFileSync(join(browser, o.replace(/^.*\//, '')));
  const js = Object.keys(outputs).filter((o) => o.endsWith('.js'));
  let raw = 0;
  let gzip = 0;
  for (const o of initial) {
    const body = read(o);
    raw += body.length;
    gzip += gzipSync(body, { level: 9 }).length;
  }
  const text = (files) => files.map((o) => read(o).toString('utf8'));
  return { raw, gzip, initialText: text([...initial]).join('\n'), lazyText: text(js.filter((o) => !initial.has(o))).join('\n'), lazyFiles: js.length - initial.size };
}

function build(dir, label, configuration, run) {
  const res = run('npx', ['ng', 'build', `--configuration=${configuration}`, '--stats-json', `--output-path=dist/${label}`], dir);
  writeFileSync(join(dir, `build-${label}.log`), res.out);
  if (res.code !== 0) throw new Error(`ng build ${label} failed:\n${res.out.split('\n').filter((l) => /error|✘/i.test(l)).slice(0, 12).join('\n')}`);
  return analyze(join(dir, 'dist', label));
}

/**
 * Builds the fixture four times and returns `{ rows, checks }`: rows
 * `[label, { raw, gzip, lazyFiles }]`, checks `[label, ok, detail]`.
 */
export function measureBundles({ work, tarball, run }) {
  const before = app(work, '351', '3.5.1', run);
  const A = build(before, 'base', 'production', run);
  const next = app(work, 'next', `file:${tarball}`, run);
  const B = build(next, 'base', 'production', run);
  const C = build(next, 'icons', 'production,icons', run);
  const D = build(next, 'icons-defer', 'production,icons,defer', run);
  const rows = [
    ['A 3.5.1, opts into nothing', A],
    ['B 3.6, opts into nothing', B],
    ['C 3.6, 25 glyphs registered', C],
    ['D C + deferred side navigation', D],
  ];
  const checks = [
    ['AC-1: A − C ≥ 7 kB gzip', A.gzip - C.gzip >= 7000, kb(A.gzip - C.gzip)],
    ['AC-1: the robot glyph (nobody registered it) is in no initial chunk of C', !C.initialText.includes(ROBOT), ''],
    ['AC-1: 3.5.1 had it in the initial chunks (the probe is valid)', A.initialText.includes(ROBOT), ''],
    ['AC-6: B keeps every glyph, in a lazy chunk', !B.initialText.includes(ROBOT) && B.lazyText.includes(ROBOT), ''],
    ['AC-8: C − D ≥ 6 kB gzip', C.gzip - D.gzip >= 6000, kb(C.gzip - D.gzip)],
    ['AC-8: lc-sidenav is in no initial chunk of D, but in a lazy one', !D.initialText.includes(SIDENAV_ONLY) && D.lazyText.includes(SIDENAV_ONLY), ''],
  ];
  return { rows: rows.map(([label, r]) => [label, { raw: r.raw, gzip: r.gzip, lazyFiles: r.lazyFiles }]), checks };
}

export { kb };

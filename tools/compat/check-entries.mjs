#!/usr/bin/env node
/**
 * Package and bundle checks for the secondary entries (3.5, request 001).
 *
 * Package (the packed build against `npm pack @lifecorner/angular-ui-kit@3.4.1`):
 * - AC-13: `createPolicy` occurs in exactly one `fesm2022/*.mjs`, the icon entry's.
 * - AC-14: every export of 3.4.1's primary entry still exists with the same kind
 *   (TypeScript checker), and the file names and non-entry exports are unchanged.
 * - AC-15: every subpath resolves its `types` (TypeScript) and `default` (Node
 *   `import()` after `@angular/compiler`); each public symbol is exported by
 *   exactly one public entry, and together they are the primary entry's.
 * - AC-16: every kit source occurs in exactly one `.mjs.map`; no entry cycle.
 *
 * Bundles (tools/compat/entries, Angular 22, `ng build --stats-json`):
 * - AC-17: an eager shell with the F1 set and a lazy `/reports` route; no
 *   module of a lazy-only entry in an initial chunk, all of them in a lazy one.
 *   The initial JS before (3.4.1's and 3.5's primary entry) and after
 *   (secondary entries), raw and gzip.
 * - AC-18: `abacus-off` (only the name list has it) in no emitted production
 *   file; present in the development build and when the app imports
 *   `isValidIconName` itself (the gzip difference is the saving).
 * - AC-26: without `mermaid` installed and without `externalDependencies`, an
 *   app that doesn't import `lc-markdown` builds and prerenders (production
 *   and development).
 *
 * Prerequisite: `npx nx run angular-ui-kit:build`. Needs the network (npm).
 * Usage: node tools/compat/check-entries.mjs [--work=<dir>] [--keep] [--json=<file>]
 */
import { execFileSync, spawnSync } from 'node:child_process';
import { cpSync, existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, renameSync, rmSync, statSync, symlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { gzipSync } from 'node:zlib';
import ts from 'typescript';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(HERE, '../..');
const DIST = join(ROOT, 'dist/libs/angular-ui-kit');
const FIXTURE = join(HERE, 'entries');
const PKG = '@lifecorner/angular-ui-kit';
const args = Object.fromEntries(
  process.argv.slice(2).map((a) => {
    const [k, ...v] = a.replace(/^--/, '').split('=');
    return [k, v.length ? v.join('=') : true];
  }),
);

if (!existsSync(join(DIST, 'package.json'))) {
  console.error(`No build in ${DIST}. Run \`npx nx run angular-ui-kit:build\` first.`);
  process.exit(2);
}
const work = args.work ? resolve(args.work) : mkdtempSync(join(tmpdir(), 'lc-entries-'));
mkdirSync(work, { recursive: true });

const results = [];
let failed = false;
function check(group, label, ok, detail) {
  results.push({ group, label, ok, ...(detail !== undefined && { detail }) });
  if (!ok) failed = true;
  console.log(`[${ok ? 'ok' : 'FAIL'}] ${group}: ${label}${!ok && detail !== undefined ? `\n       ${JSON.stringify(detail).slice(0, 800)}` : ''}`);
}
const numbers = {};

function run(cmd, cmdArgs, cwd) {
  const res = spawnSync(cmd, cmdArgs, { cwd, encoding: 'utf8', env: { ...process.env, NG_CLI_ANALYTICS: 'false', CI: '1' }, maxBuffer: 64 * 1024 * 1024 });
  return { code: res.status, out: `${res.stdout ?? ''}${res.stderr ?? ''}` };
}

/** Packs or downloads a tarball and unpacks it to `<dir>/node_modules/@lifecorner/angular-ui-kit`, with the repo's Angular next to it. */
function unpack(source, dir) {
  rmSync(dir, { recursive: true, force: true });
  mkdirSync(dir, { recursive: true });
  execFileSync('npm', ['pack', source, '--pack-destination', dir, '--silent'], { stdio: 'ignore' });
  const tarball = join(dir, readdirSync(dir).find((f) => f.endsWith('.tgz')));
  execFileSync('tar', ['xzf', tarball, '-C', dir]);
  const target = join(dir, 'node_modules/@lifecorner/angular-ui-kit');
  mkdirSync(dirname(target), { recursive: true });
  renameSync(join(dir, 'package'), target);
  for (const dep of ['@angular', 'rxjs', 'tslib']) symlinkSync(join(ROOT, 'node_modules', dep), join(dir, 'node_modules', dep));
  return { tarball, root: target, pkg: JSON.parse(readFileSync(join(target, 'package.json'), 'utf8')) };
}

// --- Package checks ---------------------------------------------------------

const next = unpack(DIST, join(work, 'pkg-next'));
const old = unpack(`${PKG}@3.4.1`, join(work, 'pkg-341'));
console.log(`${PKG}@${next.pkg.version} (this build) against ${PKG}@${old.pkg.version} (npm)\n`);

function symbolKind(checker, symbol) {
  const s = symbol.flags & ts.SymbolFlags.Alias ? checker.getAliasedSymbol(symbol) : symbol;
  const kinds = [];
  if (s.flags & ts.SymbolFlags.Class) kinds.push('class');
  if (s.flags & ts.SymbolFlags.Interface) kinds.push('interface');
  if (s.flags & ts.SymbolFlags.TypeAlias) kinds.push('type');
  if (s.flags & ts.SymbolFlags.Function) kinds.push('function');
  if (s.flags & ts.SymbolFlags.Enum) kinds.push('enum');
  if (s.flags & ts.SymbolFlags.Variable) kinds.push('const');
  return kinds.join('+') || `flags:${s.flags}`;
}

/** Export name → kind of each `.d.ts`, from one TypeScript program. */
function exportsOf(files) {
  const program = ts.createProgram(files, {
    module: ts.ModuleKind.ESNext, moduleResolution: ts.ModuleResolutionKind.Bundler, target: ts.ScriptTarget.ES2022,
    skipLibCheck: true, noEmit: true, types: [],
  });
  const checker = program.getTypeChecker();
  return files.map((file) => {
    const source = program.getSourceFile(file);
    const symbol = source && checker.getSymbolAtLocation(source);
    if (!symbol) return null;
    return Object.fromEntries(checker.getExportsOfModule(symbol).map((e) => [e.name, symbolKind(checker, e)]));
  });
}

// AC-13
const fesm = (p) => readdirSync(join(p.root, 'fesm2022')).filter((f) => f.endsWith('.mjs'));
const withPolicy = fesm(next).filter((f) => readFileSync(join(next.root, 'fesm2022', f), 'utf8').includes('createPolicy'));
check('AC-13', 'createPolicy occurs in exactly one fesm2022 file, the icon entry\'s', withPolicy.join() === 'lifecorner-angular-ui-kit-icon.mjs', withPolicy);

// AC-14
const primaryTypes = (p) => join(p.root, p.pkg.exports['.'].types);
const [oldExports, nextExports] = [exportsOf([primaryTypes(old)])[0], exportsOf([primaryTypes(next)])[0]];
const removed = Object.keys(oldExports).filter((n) => !(n in nextExports));
const changed = Object.keys(oldExports).filter((n) => n in nextExports && nextExports[n] !== oldExports[n]).map((n) => `${n}: ${oldExports[n]} → ${nextExports[n]}`);
const added = Object.keys(nextExports).filter((n) => !(n in oldExports));
numbers.primaryExports = { before: Object.keys(oldExports).length, after: Object.keys(nextExports).length, removed, changed, added };
check('AC-14', `all ${Object.keys(oldExports).length} exports of 3.4.1's primary entry keep their name and kind`, removed.length === 0 && changed.length === 0, { removed, changed });
const keptFiles = ['fesm2022/lifecorner-angular-ui-kit.mjs', 'types/lifecorner-angular-ui-kit.d.ts', 'src/assets/icon-names.json', 'src/styles/index.scss'];
check('AC-14', 'the primary FESM, its types, src/assets and src/styles keep their paths', keptFiles.every((f) => existsSync(join(next.root, f))), keptFiles.filter((f) => !existsSync(join(next.root, f))));
const nonEntry = ['.', './styles', './styles/*', './icon-names.json', './package.json'];
check('AC-14', 'the ., ./styles, ./styles/*, ./icon-names.json and ./package.json exports are unchanged', nonEntry.every((k) => k === '.' ? next.pkg.exports[k].default === old.pkg.exports[k].default : JSON.stringify(next.pkg.exports[k]) === JSON.stringify(old.pkg.exports[k])));

// AC-15
const subpaths = Object.keys(next.pkg.exports).filter((k) => !nonEntry.includes(k));
const entries = subpaths.map((k) => k.slice(2));
const publicEntries = entries.filter((e) => !e.startsWith('internal/'));
numbers.entries = { total: entries.length, public: publicEntries.length, internal: entries.length - publicEntries.length };
// 116 since 3.6 (request 002): + icons, sidenav-placeholder, internal/icon-set, internal/navigation.
check('AC-15', `${entries.length} subpaths (${publicEntries.length} public, ${entries.length - publicEntries.length} internal), each with types and default`, entries.length === 116 &&subpaths.every((k) => existsSync(join(next.root, next.pkg.exports[k].types)) && existsSync(join(next.root, next.pkg.exports[k].default))));
const entryExports = exportsOf(subpaths.map((k) => join(next.root, next.pkg.exports[k].types)));
const unresolved = subpaths.filter((_, i) => !entryExports[i]);
check('AC-15', 'every subpath\'s types resolve in TypeScript', unresolved.length === 0, unresolved);
const owners = new Map();
publicEntries.forEach((entry) => {
  for (const name of Object.keys(entryExports[entries.indexOf(entry)] ?? {})) owners.set(name, [...(owners.get(name) ?? []), entry]);
});
const duplicates = [...owners].filter(([, list]) => list.length > 1);
check('AC-15', 'each public symbol is exported by exactly one public entry', duplicates.length === 0, duplicates);
const notInEntries = Object.keys(nextExports).filter((n) => !owners.has(n));
const notInPrimary = [...owners.keys()].filter((n) => !(n in nextExports));
check('AC-15', 'the public entries together export exactly the primary entry\'s symbols', notInEntries.length === 0 && notInPrimary.length === 0, { notInEntries, notInPrimary });
const imported = run(process.execPath, ['--input-type=module', '-e', `
  await import('@angular/compiler');
  const failures = [];
  for (const entry of ${JSON.stringify(['', ...entries])}) {
    try { await import('${PKG}' + (entry ? '/' + entry : '')); } catch (e) { failures.push(entry + ': ' + e.message.split('\\n')[0]); }
  }
  console.log(JSON.stringify(failures));`], join(work, 'pkg-next'));
const importFailures = (() => { try { return JSON.parse(imported.out.trim().split('\n').pop()); } catch { return [imported.out.slice(-800)]; } })();
check('AC-15', 'every subpath (and the primary entry) imports in Node through package.json exports', imported.code === 0 && importFailures.length === 0, importFailures);

// AC-16
const sourceOwners = new Map();
for (const map of readdirSync(join(next.root, 'fesm2022')).filter((f) => f.endsWith('.mjs.map'))) {
  for (const source of JSON.parse(readFileSync(join(next.root, 'fesm2022', map), 'utf8')).sources) {
    sourceOwners.set(source, [...(sourceOwners.get(source) ?? []), map]);
  }
}
const sharedSources = [...sourceOwners].filter(([, maps]) => maps.length > 1);
numbers.sources = sourceOwners.size;
check('AC-16', `each of ${sourceOwners.size} kit sources is in exactly one .mjs.map`, sharedSources.length === 0 && sourceOwners.size > 200, sharedSources.slice(0, 10));
const graph = new Map();
const fileOf = (entry) => `lifecorner-angular-ui-kit-${entry.replace('/', '-')}.mjs`;
for (const entry of entries) {
  const code = readFileSync(join(next.root, 'fesm2022', fileOf(entry)), 'utf8');
  graph.set(entry, new Set([...code.matchAll(/from ['"]@lifecorner\/angular-ui-kit\/([^'"]+)['"]/g)].map((m) => m[1])));
}
const cycles = [];
const state = new Map();
const visit = (entry, path) => {
  if (state.get(entry) === 'done') return;
  if (state.get(entry) === 'open') return void cycles.push([...path, entry].join(' → '));
  state.set(entry, 'open');
  for (const dep of graph.get(entry) ?? []) visit(dep, [...path, entry]);
  state.set(entry, 'done');
};
entries.forEach((e) => visit(e, []));
check('AC-16', 'no cycle between entries (FESM imports)', cycles.length === 0, cycles);
const closure = (roots) => {
  const seen = new Set();
  const add = (e) => { if (!seen.has(e)) { seen.add(e); (graph.get(e) ?? []).forEach(add); } };
  roots.forEach(add);
  return seen;
};

// --- Bundles ----------------------------------------------------------------

const ANGULAR = '^22.0.0';
function app(name, { tarball, mermaid = true }) {
  const dir = join(work, `app-${name}`);
  rmSync(dir, { recursive: true, force: true });
  cpSync(FIXTURE, dir, { recursive: true });
  const dependencies = {
    '@angular/cdk': ANGULAR, '@angular/common': ANGULAR, '@angular/compiler': ANGULAR, '@angular/core': ANGULAR,
    '@angular/forms': ANGULAR, '@angular/platform-browser': ANGULAR, '@angular/platform-server': ANGULAR,
    '@angular/router': ANGULAR, '@angular/ssr': ANGULAR, [PKG]: `file:${tarball}`, rxjs: '~7.8.0', tslib: '^2.3.0',
    ...(mermaid && { mermaid: '^11.0.0' }),
  };
  const devDependencies = { '@angular/build': ANGULAR, '@angular/cli': ANGULAR, '@angular/compiler-cli': ANGULAR, '@types/node': '^24.0.0', typescript: '~6.0.2' };
  writeFileSync(join(dir, 'package.json'), JSON.stringify({ name: `lc-entries-${name}`, private: true, dependencies, devDependencies }, null, 2));
  const install = run('npm', ['install', '--no-audit', '--no-fund', '--loglevel=error'], dir);
  if (install.code !== 0) throw new Error(`npm install (${name}) failed:\n${install.out.slice(-2000)}`);
  return dir;
}

/** Rewrites every secondary-entry import of the fixture to the primary entry (the "before" app). */
function usePrimaryEntry(dir) {
  for (const file of readdirSync(join(dir, 'src/app')).filter((f) => f.endsWith('.ts'))) {
    const path = join(dir, 'src/app', file);
    writeFileSync(path, readFileSync(path, 'utf8').replace(/from '@lifecorner\/angular-ui-kit\/[^']+'/g, `from '${PKG}'`));
  }
}

function build(dir, label, configuration, outputPath) {
  const res = run('npx', ['ng', 'build', `--configuration=${configuration}`, '--stats-json', `--output-path=${outputPath}`], dir);
  writeFileSync(join(dir, `build-${label}.log`), res.out);
  // The CLI's own "Initial total" line: raw and estimated transfer size.
  const total = res.out.match(/Initial total\s*\|\s*([\d.]+ [kM]B)\s*\|\s*([\d.]+ [kM]B)/);
  return { ...res, out: join(dir, outputPath), cli: total ? { raw: total[1], transfer: total[2] } : null };
}

const kitEntryOf = (input) => {
  const m = input.match(/@lifecorner\/angular-ui-kit\/fesm2022\/lifecorner-angular-ui-kit(?:-(.+))?\.mjs$/);
  if (!m) return null;
  if (!m[1]) return '(primary)';
  return m[1].startsWith('internal-') ? `internal/${m[1].slice('internal-'.length)}` : m[1];
};

/** Initial and lazy chunks of a browser build, the kit entries in each, and the initial JS sizes. */
function analyze(out, cli = null) {
  const meta = JSON.parse(readFileSync(join(out, 'browser-stats.json'), 'utf8'));
  const outputs = meta.outputs;
  const main = Object.keys(outputs).find((o) => outputs[o].entryPoint?.endsWith('src/main.ts'));
  const initial = new Set();
  const walk = (o) => {
    if (initial.has(o)) return;
    initial.add(o);
    for (const imp of outputs[o].imports ?? []) if (imp.kind === 'import-statement' && outputs[imp.path]) walk(imp.path);
  };
  walk(main);
  const js = Object.keys(outputs).filter((o) => o.endsWith('.js'));
  const lazy = js.filter((o) => !initial.has(o));
  const kitIn = (files) => {
    const found = new Map();
    for (const o of files) {
      for (const [input, { bytesInOutput }] of Object.entries(outputs[o].inputs ?? {})) {
        const entry = kitEntryOf(input);
        if (entry && bytesInOutput > 0) found.set(entry, (found.get(entry) ?? 0) + bytesInOutput);
      }
    }
    return found;
  };
  const size = (files) => {
    let raw = 0;
    let gzip = 0;
    for (const o of files) {
      const body = readFileSync(join(out, 'browser', o));
      raw += body.length;
      gzip += gzipSync(body, { level: 9 }).length;
    }
    return { raw, gzip };
  };
  const initialKit = kitIn(initial);
  return {
    cli,
    initialFiles: initial.size,
    lazyFiles: lazy.length,
    initial: size(initial),
    kitInitialRaw: [...initialKit.values()].reduce((a, b) => a + b, 0),
    initialKit,
    lazyKit: kitIn(lazy),
  };
}

/** Emitted files (browser and server) that contain `text`. */
function grepOutput(out, text) {
  const hits = [];
  const walk = (dir) => {
    for (const name of readdirSync(dir)) {
      const p = join(dir, name);
      if (statSync(p).isDirectory()) walk(p);
      else if (/\.(m?js)$/.test(name) && readFileSync(p, 'utf8').includes(text)) hits.push(relative(out, p));
    }
  };
  walk(out);
  return hits;
}

const kb = (n) => `${(n / 1000).toFixed(1)} kB`;
const SHELL_ENTRIES = ['alert', 'app-shell', 'bottom-nav', 'button', 'container', 'footer', 'header', 'icon', 'models', 'next-step-card', 'page-header', 'sidenav', 'skeleton', 'toast'];
const REPORT_ENTRIES = ['line-chart', 'markdown', 'modal', 'table'];

try {
  console.log('\nBuilding the fixture (secondary entries, this build) …');
  const after = app('next', { tarball: next.tarball });
  const prod = build(after, 'prod', 'production', 'dist/prod');
  check('AC-17', 'production build with secondary entries', prod.code === 0, prod.code === 0 ? undefined : readFileSync(join(after, 'build-prod.log'), 'utf8').slice(-1500));
  const a = analyze(prod.out, prod.cli);
  const shellClosure = closure(SHELL_ENTRIES);
  const lazyOnly = [...closure(REPORT_ENTRIES)].filter((e) => !shellClosure.has(e)).sort();
  const leaked = lazyOnly.filter((e) => a.initialKit.has(e));
  const missingLazy = lazyOnly.filter((e) => !a.lazyKit.has(e) && graph.get(e) !== undefined && readFileSync(join(next.root, 'fesm2022', fileOf(e)), 'utf8').length > 2000);
  numbers.lazyOnly = lazyOnly;
  numbers.after = { initial: a.initial, cli: a.cli, kitInitialRaw: a.kitInitialRaw, initialEntries: [...a.initialKit.keys()].sort(), initialFiles: a.initialFiles, lazyFiles: a.lazyFiles };
  check('AC-17', `no module of the ${lazyOnly.length} lazy-only entries in an initial chunk (${lazyOnly.join(', ')})`, leaked.length === 0, leaked);
  check('AC-17', 'and each of them is in a lazy chunk', missingLazy.length === 0, missingLazy);
  const notShell = [...a.initialKit.keys()].filter((e) => !shellClosure.has(e));
  check('AC-17', 'the initial chunks hold only entries of the shell\'s closure', notShell.length === 0, notShell);

  const prodHits = grepOutput(prod.out, 'abacus-off');
  check('AC-18', 'production: "abacus-off" (only the name list has it) occurs in no emitted .js/.mjs', prodHits.length === 0, prodHits);
  const dev = build(after, 'dev', 'development', 'dist/dev');
  check('AC-18', 'development build succeeds and contains the list (unknown names still warn)', dev.code === 0 && grepOutput(dev.out, 'abacus-off').length > 0);

  const shellTs = join(after, 'src/app/shell.ts');
  const shellSource = readFileSync(shellTs, 'utf8');
  writeFileSync(shellTs, `import { isValidIconName } from '${PKG}/icon-names';\nconsole.log(isValidIconName('anchor'));\n${shellSource}`);
  const withNames = build(after, 'names', 'production', 'dist/names');
  writeFileSync(shellTs, shellSource);
  const n = withNames.code === 0 ? analyze(withNames.out, withNames.cli) : null;
  numbers.withNames = n && { initial: n.initial, cli: n.cli };
  check('AC-18', 'an app that imports isValidIconName itself still gets the list', withNames.code === 0 && grepOutput(withNames.out, 'abacus-off').length > 0);
  if (n) numbers.nameListSaving = { raw: n.initial.raw - a.initial.raw, gzip: n.initial.gzip - a.initial.gzip };

  usePrimaryEntry(after);
  const primary = build(after, 'primary', 'production', 'dist/primary');
  check('AC-14', '3.5\'s primary entry still builds the same app (imports rewritten to the primary entry)', primary.code === 0);
  if (primary.code === 0) {
    const p = analyze(primary.out, primary.cli);
    numbers.primary35 = { initial: p.initial, cli: p.cli, kitInitialRaw: p.kitInitialRaw, initialFiles: p.initialFiles };
  }

  console.log('\nBuilding the fixture without mermaid …');
  const noMermaid = app('no-mermaid', { tarball: next.tarball, mermaid: false });
  check('AC-26', 'mermaid is not installed', !existsSync(join(noMermaid, 'node_modules/mermaid')));
  const nmProd = build(noMermaid, 'prod', 'production,no-mermaid', 'dist/prod');
  check('AC-26', 'production build and prerender without mermaid and without externalDependencies', nmProd.code === 0 && existsSync(join(nmProd.out, 'browser/reports/index.html')), nmProd.code === 0 ? undefined : readFileSync(join(noMermaid, 'build-prod.log'), 'utf8').slice(-1500));
  const nmDev = build(noMermaid, 'dev', 'development,no-mermaid', 'dist/dev');
  check('AC-26', 'development build and prerender without mermaid', nmDev.code === 0 && existsSync(join(nmDev.out, 'browser/reports/index.html')), nmDev.code === 0 ? undefined : readFileSync(join(noMermaid, 'build-dev.log'), 'utf8').slice(-1500));

  console.log('\nBuilding the fixture on 3.4.1 (primary entry) …');
  const before = app('341', { tarball: old.tarball });
  usePrimaryEntry(before);
  const old341 = build(before, 'prod', 'production', 'dist/prod');
  check('AC-17', '3.4.1 baseline build (primary entry)', old341.code === 0);
  if (old341.code === 0) {
    const b = analyze(old341.out, old341.cli);
    numbers.before341 = { initial: b.initial, cli: b.cli, kitInitialRaw: b.kitInitialRaw, initialFiles: b.initialFiles, nameListInInitial: grepOutput(join(old341.out, 'browser'), 'abacus-off').length > 0 };
  }
} catch (error) {
  failed = true;
  console.log(`ERROR ${error.stack ?? error}`);
}

console.log('\nInitial JS of the fixture (kB = 1000 bytes; gzip level 9; CLI = the build\'s "Initial total" estimated transfer size;');
console.log('the kit share is its minified bytes in the initial chunks, from the metafile):');
const row = (label, x) => x && console.log(`  ${label.padEnd(30)} ${kb(x.initial.raw).padStart(9)} raw  ${kb(x.initial.gzip).padStart(8)} gzip  ${(x.cli?.transfer ?? '?').padStart(9)} CLI   kit ${kb(x.kitInitialRaw ?? 0)} raw`);
row('3.4.1, primary entry', numbers.before341);
row('3.5.0, primary entry', numbers.primary35);
row('3.5.0, secondary entries', numbers.after);
if (numbers.nameListSaving) console.log(`  name list (app importing isValidIconName): +${kb(numbers.nameListSaving.raw)} raw, +${kb(numbers.nameListSaving.gzip)} gzip`);
if (numbers.before341?.nameListInInitial !== undefined) console.log(`  3.4.1 initial chunks contain the name list: ${numbers.before341.nameListInInitial}`);
if (typeof args.json === 'string') writeFileSync(resolve(args.json), JSON.stringify({ results, numbers }, (k, v) => (v instanceof Map ? Object.fromEntries(v) : v), 2));
console.log(`\n${failed ? 'FAIL' : 'PASS'}: ${results.filter((r) => r.ok).length} of ${results.length} checks. Work dir: ${work}`);
if (!args.keep && !args.work && !failed) rmSync(work, { recursive: true, force: true });
process.exit(failed ? 1 : 0);

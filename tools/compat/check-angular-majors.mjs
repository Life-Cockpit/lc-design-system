#!/usr/bin/env node
/**
 * Consumer check for the Angular majors the package claims in its peer range.
 *
 * Angular libraries ship partial-compilation output: the consumer's own
 * compiler links every declaration and compiles the templates. A build made
 * with a newer Angular is therefore only proven to work in an older major by
 * doing exactly that. For every entry of the matrix this script creates an
 * app from ./template, installs the packed library with strict peer
 * resolution, runs `ng build` (AOT, strictTemplates, static prerender — which
 * also executes every rendered component on the server) and checks the
 * prerendered HTML.
 *
 * Prerequisite: `npx nx build angular-ui-kit` (reads dist/libs/angular-ui-kit).
 *
 * Usage: node tools/compat/check-angular-majors.mjs [--only=21.0,22] [--keep]
 *          [--legacy-peer-deps] [--work=<dir>]
 */
import { execFileSync, spawnSync } from 'node:child_process';
import { cpSync, existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const args = Object.fromEntries(
  process.argv.slice(2).map((a) => {
    const [k, v] = a.replace(/^--/, '').split('=');
    return [k, v ?? true];
  }),
);
const ROOT = resolve(args.root ?? join(HERE, '../..'));
const DIST = join(ROOT, 'dist/libs/angular-ui-kit');
const TEMPLATE = join(HERE, 'template');

/** Lowest and newest release line of each major the peer range claims. */
const MATRIX = [
  { name: '21.0', angular: '~21.0.0', typescript: '~5.9.2' },
  { name: '21', angular: '^21.0.0', typescript: '~5.9.2' },
  { name: '22.0', angular: '~22.0.0', typescript: '~6.0.2' },
  { name: '22', angular: '^22.0.0', typescript: '~6.0.2' },
];

/** Strings the prerendered page must contain (rendered on the server, no JS). */
const EXPECT_IN_HTML = [
  ['header', /<header[^>]*class="lc-header/],
  ['primary lg button', /class="btn btn-primary[^"]*btn-lg/],
  ['markdown link', /<a href="https:\/\/example\.org"/],
  ['table row', /Internet/],
  ['footer', /<footer[^>]*role="contentinfo"/],
  ['chart svg', /<svg[^>]*role="img"/],
  // 3.2 features, rendered on the server (no JavaScript needed)
  ['a[lcButton] link', /<a(?=[^>]*href="\/de\/neuigkeiten")(?=[^>]*class="[^"]*btn-primary[^"]*btn-lg)[^>]*>/],
  ['language link', /<a(?=[^>]*hreflang="en")(?=[^>]*lang="en")(?=[^>]*class="[^"]*btn-ghost)[^>]*>/],
  ['header nav', /<nav[^>]*aria-label="Hauptnavigation"/],
  ['current page', /<a(?=[^>]*aria-current="page")[^>]*href="\/de\/sicherheit"/],
  ['plain home link', /<a(?=[^>]*href="\/de\/")(?=[^>]*class="lc-header__logo")[^>]*>/],
  ['footer heading level', /<h2 class="footer__section-title"/],
  ['footer nav', /<nav[^>]*aria-label="Fußzeile"/],
];

function run(cmd, cmdArgs, cwd) {
  const res = spawnSync(cmd, cmdArgs, { cwd, encoding: 'utf8', env: { ...process.env, NG_CLI_ANALYTICS: 'false', CI: '1' } });
  return { code: res.status, out: `${res.stdout ?? ''}${res.stderr ?? ''}` };
}

if (!existsSync(join(DIST, 'package.json'))) {
  console.error(`No build in ${DIST}. Run \`npx nx build angular-ui-kit\` first.`);
  process.exit(2);
}

const work = args.work ? resolve(args.work) : mkdtempSync(join(tmpdir(), 'lc-compat-'));
mkdirSync(work, { recursive: true });
const pkg = JSON.parse(readFileSync(join(DIST, 'package.json'), 'utf8'));
execFileSync('npm', ['pack', DIST, '--pack-destination', work, '--silent'], { stdio: 'ignore' });
const tarball = join(work, readdirSync(work).find((f) => f.endsWith('.tgz')));
console.log(`${pkg.name}@${pkg.version}  peer @angular/core ${pkg.peerDependencies['@angular/core']}`);

const only = typeof args.only === 'string' ? args.only.split(',') : null;
const results = [];
for (const entry of MATRIX.filter((m) => !only || only.includes(m.name))) {
  const dir = join(work, `app-${entry.name}`);
  rmSync(dir, { recursive: true, force: true });
  cpSync(TEMPLATE, dir, { recursive: true });
  const a = entry.angular;
  writeFileSync(
    join(dir, 'package.json'),
    JSON.stringify(
      {
        name: `lc-compat-${entry.name}`,
        private: true,
        dependencies: {
          '@angular/cdk': a,
          '@angular/common': a,
          '@angular/compiler': a,
          '@angular/core': a,
          '@angular/forms': a,
          '@angular/platform-browser': a,
          '@angular/platform-server': a,
          '@angular/router': a,
          '@angular/ssr': a,
          '@life-cockpit/angular-ui-kit': `file:${tarball}`,
          mermaid: '^11.0.0',
          rxjs: '~7.8.0',
          tslib: '^2.3.0',
        },
        devDependencies: {
          '@angular/build': a,
          '@angular/cli': a,
          '@angular/compiler-cli': a,
          '@types/node': '^24.0.0',
          typescript: entry.typescript,
        },
      },
      null,
      2,
    ),
  );

  const installArgs = ['install', '--no-audit', '--no-fund', '--loglevel=error'];
  if (args['legacy-peer-deps']) installArgs.push('--legacy-peer-deps');
  const install = run('npm', installArgs, dir);
  const versions = install.code === 0
    ? ['@angular/core', '@angular/cdk', 'typescript'].map((p) => `${p}@${JSON.parse(readFileSync(join(dir, 'node_modules', p, 'package.json'), 'utf8')).version}`).join(' ')
    : '';
  const result = { name: entry.name, versions, install: install.code === 0, build: false, checks: [], warnings: [] };
  if (!result.install) {
    result.error = install.out.split('\n').filter((l) => /ERESOLVE|peer|error/i.test(l)).slice(0, 8).join('\n');
    results.push(result);
    continue;
  }

  const build = run('npx', ['ng', 'build'], dir);
  writeFileSync(join(dir, 'build.log'), build.out);
  result.build = build.code === 0;
  // mermaid's own CommonJS dependencies warn in every app that installs it;
  // they say nothing about this package and are only counted.
  const lines = build.out.split('\n').map((l) => l.trim());
  const cjs = lines.filter((l) => /is not ESM/.test(l) && /mermaid/.test(l)).length;
  result.warnings = lines.filter(
    (l) => /warning|depends upon a library published using Angular/i.test(l) && !(/is not ESM/.test(l) && /mermaid/.test(l)),
  );
  if (cjs) result.warnings.push(`(${cjs} CommonJS warnings from mermaid's dependencies not shown)`);
  if (!result.build) {
    result.error = build.out.split('\n').filter((l) => /error|✘/i.test(l)).slice(0, 15).join('\n');
    results.push(result);
    continue;
  }
  const html = readFileSync(join(dir, 'dist/compat/browser/index.html'), 'utf8');
  for (const [label, re] of EXPECT_IN_HTML) result.checks.push([label, re.test(html)]);
  results.push(result);
}

let failed = false;
for (const r of results) {
  const checks = r.checks.map(([l, ok]) => `${ok ? 'ok' : 'MISSING'} ${l}`).join(', ');
  const ok = r.install && r.build && r.checks.every(([, v]) => v);
  failed ||= !ok;
  console.log(`\n[${ok ? 'PASS' : 'FAIL'}] Angular ${r.name}  ${r.versions}`);
  console.log(`  install: ${r.install ? 'ok' : 'FAILED'}  build+prerender: ${r.build ? 'ok' : 'FAILED'}`);
  if (checks) console.log(`  prerendered HTML: ${checks}`);
  if (r.warnings.length) console.log(`  warnings:\n    ${r.warnings.join('\n    ')}`);
  if (r.error) console.log(`  ${r.error.replace(/\n/g, '\n  ')}`);
}
console.log(`\nWork dir: ${work}`);
if (!args.keep && !args.work && !failed) rmSync(work, { recursive: true, force: true });
process.exit(failed ? 1 : 0);

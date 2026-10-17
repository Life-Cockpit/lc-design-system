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
 * The app has two route sets: `''` imports everything from the primary entry
 * (as consumers did before 3.5), `/tt` imports the F1 set from the secondary
 * entries only (3.5, request 001). The build keeps Angular's defaults (the
 * existing consumers); tools/compat/check-trusted-types.mjs builds the app
 * once more with life-os's settings (`csp` configuration) and opens the `/tt`
 * pages in a browser under a Trusted Types CSP.
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
import { inlineIconsModule } from './inline-icons.mjs';

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

/** The sidenav's `<nav>` on `/tt`: exactly one aria-current link, the `/tt` one, painted current too (AC-24). */
function oneCurrentSidenavLink(html) {
  const nav = html.match(/<nav(?=[^>]*class="lc-sidenav__nav)[^>]*>([^]*?)<\/nav>/)?.[1] ?? '';
  const current = [...nav.matchAll(/<a\b[^>]*aria-current="page"[^>]*>/g)].map((m) => m[0]);
  return current.length === 1 && /href="\/tt"/.test(current[0]) && /lc-sidenav__nav-item--active/.test(current[0]);
}

/** Every inline icon on `/tt/icons` is prerendered as one decorated `<svg>` (AC-10 a, before JS). */
function everyInlineIconPrerendered(html) {
  const icons = [...html.matchAll(/<lc-icon[^>]*data-icon="[^"]+"[^>]*>([^]*?)<\/lc-icon>/g)];
  return icons.length > 100 && icons.every(([, inner]) => (inner.match(/<svg\b(?=[^>]*width="24px")(?=[^>]*role="img")[^>]*>/g) ?? []).length === 1);
}

/**
 * What the prerendered pages must contain (rendered on the server, no JS):
 * `[label, RegExp | (html) => boolean, page]`, page `index.html` unless named.
 */
const EXPECT_IN_HTML = [
  ['header', /<header[^>]*class="lc-header/],
  ['primary lg button', /class="btn btn-primary[^"]*btn-lg/],
  ['markdown link', /<a href="https:\/\/example\.org"/],
  ['table row', /Internet/],
  ['footer', /<footer[^>]*role="contentinfo"/],
  ['chart svg', /<svg[^>]*role="img"/],
  // 3.2 features, rendered on the server (no JavaScript needed)
  ['a[lcButton] link', /<a(?=[^>]*href="\/de\/neuigkeiten")(?=[^>]*class="[^"]*\bbtn-primary\b)(?=[^>]*class="[^"]*\bbtn-lg\b)[^>]*>/],
  ['language link', /<a(?=[^>]*hreflang="en")(?=[^>]*lang="en")(?=[^>]*class="[^"]*btn-ghost)[^>]*>/],
  ['header nav', /<nav[^>]*aria-label="Hauptnavigation"/],
  ['current page', /<a(?=[^>]*aria-current="page")[^>]*href="\/de\/sicherheit"/],
  ['plain home link', /<a(?=[^>]*href="\/de\/")(?=[^>]*class="lc-header__logo")[^>]*>/],
  ['footer heading level', /<h2[^>]*class="footer__section-title"/],
  ['footer nav', /<nav[^>]*aria-label="Fußzeile"/],
  // 3.3 features, rendered on the server
  ['provider button', /<button(?=[^>]*type="submit")(?=[^>]*class="[^"]*\blc-provider-button--google\b)[^>]*>/],
  ['radio group legend', /<fieldset[^>]*class="lc-radio-group"[^]*?<legend[^>]*>\s*Rolle/],
  ['copy field', /class="lc-copy-field\b/],
  ['bottom nav current item', /<nav(?=[^>]*aria-label="Hauptnavigation unten")(?=[^>]*class="[^"]*lc-bottom-nav--floating)[^>]*>[^]*?aria-current="page"/],
  ['app page aside', /<main[^>]*id="shell-main"[^]*?<\/main>\s*<aside(?=[^>]*aria-label="Mitglieder")[^>]*>/],
  ['shell horizon', /class="lc-app-shell__horizon lc-horizon"/],
  ['page header overline', /class="[^"]*lc-overline[^"]*"[^>]*>\s*Montag, 12\. Oktober/],
  // 3.5 (request 001)
  ['app page busy (AS-12)', /<main(?=[^>]*id="shell-main")(?=[^>]*aria-busy="true")[^>]*>/],
  ['inline icon decorated (AS-14)', /<div[^>]*class="icon-container icon-md icon-outline"[^>]*><svg(?=[^>]*width="24px")(?=[^>]*height="24px")(?=[^>]*role="img")[^>]*>/],
  ['tt: page busy before JS (AS-12)', /<main(?=[^>]*id="tt-main")(?=[^>]*aria-busy="true")[^>]*>/, 'tt/index.html'],
  ['tt: one current sidenav link (AS-16)', oneCurrentSidenavLink, 'tt/index.html'],
  ['tt: logo base path from the primary entry (AS-15)', /<lc-logo[^>]*id="tt-logo"[^]*?src="\/compat-logo\/lifecorner-/, 'tt/index.html'],
  ['tt: every inline icon prerendered (AS-14)', everyInlineIconPrerendered, 'tt/icons/index.html'],
  ['tt: one IconComponent class across entries (AS-15)', /id="tt-primary-icon"[^>]*data-same-class="true"|data-same-class="true"[^>]*id="tt-primary-icon"/, 'tt/icons/index.html'],
  ['tt: fetched icons stay empty on the server', /<lc-icon[^>]*id="tt-anchor"[^>]*><div[^>]*class="icon-container[^"]*"[^>]*><\/div>/, 'tt/fetched/index.html'],
  // 3.5.1: this build keeps Angular's defaults (22: incremental hydration's
  // event-dispatch script; 21: critical-CSS `onload`); the csp build is below.
  ["Angular's default inline scripts (not the csp settings)", (html) => html.includes('</html>') && !noInlineScript(html), 'tt/index.html'],
];

/**
 * The entry that is built once more with the `csp` configuration (life-os's
 * settings) for check-trusted-types.mjs; `withNoIncrementalHydration` needs 22.
 */
const CSP_ENTRY = '22';
const CSP_PAGES = ['tt/index.html', 'tt/household/index.html', 'tt/icons/index.html', 'tt/fetched/index.html'];

/** Nothing `script-src 'self'` blocks: no inline script (JSON data blocks aside), no inline event handler. */
function noInlineScript(html) {
  const scripts = [...html.matchAll(/<script\b([^>]*)>/g)].map((m) => m[1]);
  return html.includes('</html>') && scripts.every((a) => /\bsrc=/.test(a) || /type="application\/json"/.test(a)) && !/<[a-z][^>]*\son[a-z]+=/i.test(html);
}

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
  writeFileSync(join(dir, 'src/app/tt/inline-icons.ts'), inlineIconsModule(ROOT));
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
          '@lifecorner/angular-ui-kit': `file:${tarball}`,
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
  const pages = new Map();
  const page = (name, out = 'compat') => {
    const file = join(dir, `dist/${out}/browser`, name);
    if (!pages.has(file)) pages.set(file, existsSync(file) ? readFileSync(file, 'utf8') : '');
    return pages.get(file);
  };
  for (const [label, test, name = 'index.html'] of EXPECT_IN_HTML) {
    const html = page(name);
    result.checks.push([label, typeof test === 'function' ? test(html) : test.test(html)]);
  }
  if (entry.name === CSP_ENTRY) {
    const csp = run('npx', ['ng', 'build', '--configuration=production,csp'], dir);
    writeFileSync(join(dir, 'build-csp.log'), csp.out);
    result.checks.push(['csp build: /tt pages without inline script', csp.code === 0 && CSP_PAGES.every((name) => noInlineScript(page(name, 'compat-csp')))]);
  }
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

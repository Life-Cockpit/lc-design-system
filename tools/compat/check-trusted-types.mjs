#!/usr/bin/env node
/**
 * The compat app's `/tt` pages in headless Chromium under a Trusted Types CSP
 * (request 001: AC-10, AC-11, AC-12, AC-13, AC-16, AC-24).
 *
 * The pages are the prerendered output of tools/compat/check-angular-majors.mjs
 * (Angular 22): this script serves `<app>/dist/compat/browser` with life-os's
 * CSP (ADR-0034) plus `lc-icon`, opens every `/tt` page at 1280 and 360 px,
 * lets it hydrate, opens the overlays, follows the side navigation and checks
 * the DOM. It collects `securitypolicyviolation` events (through an init
 * script and a binding that survives navigations), console and Log entries
 * that match life-os's violation pattern, uncaught exceptions and hydration
 * messages (NG05xx). A second run drops `lc-icon` from `trusted-types`
 * (AC-11): the app must keep working, bundled icons show the placeholder, and
 * the page says so once.
 *
 * No dependency: chrome-headless-shell over the DevTools protocol (Node's
 * WebSocket), like tools/agents/story-shots.mjs. CHROME_PATH overrides the
 * browser; otherwise Playwright's cache is searched
 * (`npx -y playwright@1.64.0 install chromium-headless-shell`).
 *
 * Usage: node tools/compat/check-trusted-types.mjs --app=<compat work dir>/app-22 [--json=<file>]
 */
import { spawn } from 'node:child_process';
import { createServer } from 'node:http';
import { existsSync, mkdtempSync, readFileSync, readdirSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { homedir, tmpdir } from 'node:os';
import { dirname, extname, join, normalize, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { inlineIcons } from './inline-icons.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(HERE, '../..');
const args = Object.fromEntries(
  process.argv.slice(2).map((a) => {
    const [k, ...v] = a.replace(/^--/, '').split('=');
    return [k, v.length ? v.join('=') : true];
  }),
);
if (typeof args.app !== 'string') {
  console.error('check-trusted-types: pass --app=<compat work dir>/app-22 (run check-angular-majors.mjs --only=22 --work=<dir> first)');
  process.exit(2);
}
const DIST = resolve(args.app, 'dist/compat/browser');
if (!existsSync(join(DIST, 'tt/index.html'))) {
  console.error(`check-trusted-types: no prerendered /tt in ${DIST}`);
  process.exit(2);
}
const TABLER = join(ROOT, 'node_modules/@tabler/icons/icons');
const LOGOS = join(ROOT, 'libs/angular-ui-kit/src/assets');

/** life-os ADR-0034, plus the kit's policy. */
const CSP_BASE =
  "default-src 'none'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self'; " +
  "connect-src 'self'; base-uri 'self'; object-src 'none'; require-trusted-types-for 'script'";
const RUNS = [
  { name: 'AC-10: trusted-types angular lc-icon', csp: `${CSP_BASE}; trusted-types angular lc-icon`, refused: false },
  { name: 'AC-11: trusted-types angular (lc-icon refused)', csp: `${CSP_BASE}; trusted-types angular`, refused: true },
];
/** life-os's e2e violation pattern (apps/cockpit-e2e/src/support/security-listeners.ts). */
const VIOLATION_PATTERN = /Content[- ]Security[- ]Policy|Trusted ?Type|TrustedHTML|TrustedScript|require-trusted-types-for/i;
const CRAFTED_SVG = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" onload="window.__pwned=1"><path d="M0 0h24"/></svg>';

// --- Server: the static pages with the CSP, the Tabler assets, an SPA fallback ---

const MIME = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.mjs': 'text/javascript', '.css': 'text/css',
  '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png', '.ico': 'image/x-icon',
  '.woff2': 'font/woff2', '.txt': 'text/plain',
};
let csp = RUNS[0].csp;
const requests = [];
const server = createServer((req, res) => {
  const path = normalize(decodeURIComponent(new URL(req.url, 'http://x').pathname)).replace(/^(\.\.[/\\])+/, '');
  requests.push(path);
  const send = (status, type, body) => {
    res.writeHead(status, { 'content-type': type, 'content-security-policy': csp, 'cache-control': 'no-store' });
    res.end(body);
  };
  const fallback = () => send(200, MIME['.html'], readFileSync(join(DIST, existsSync(join(DIST, 'index.csr.html')) ? 'index.csr.html' : 'index.html')));
  const tabler = path.match(/^\/tabler-icons\/(outline|filled)\/([a-z0-9-]+)\.svg$/);
  if (tabler) {
    if (tabler[2] === 'lc-crafted') return send(200, MIME['.svg'], CRAFTED_SVG);
    const file = join(TABLER, tabler[1], `${tabler[2]}.svg`);
    return existsSync(file) ? send(200, MIME['.svg'], readFileSync(file)) : fallback();
  }
  const logo = path.match(/^\/compat-logo\/([a-z0-9-]+\.svg)$/);
  if (logo) {
    const file = join(LOGOS, logo[1]);
    return existsSync(file) ? send(200, MIME['.svg'], readFileSync(file)) : send(404, 'text/plain', 'Not Found');
  }
  let file = join(DIST, path);
  if (existsSync(file) && statSync(file).isDirectory()) file = join(file, 'index.html');
  if (!file.startsWith(DIST) || !existsSync(file)) return fallback();
  return send(200, MIME[extname(file)] ?? 'application/octet-stream', readFileSync(file));
});
await new Promise((r) => server.listen(0, '127.0.0.1', r));
const base = `http://127.0.0.1:${server.address().port}`;

// --- Browser over the DevTools protocol ---

function findChrome() {
  if (process.env.CHROME_PATH) return process.env.CHROME_PATH;
  const caches = [join(homedir(), 'Library/Caches/ms-playwright'), join(homedir(), '.cache/ms-playwright')];
  for (const cache of caches.filter(existsSync)) {
    const shells = readdirSync(cache)
      .filter((d) => d.startsWith('chromium_headless_shell-'))
      .sort((a, b) => Number(b.split('-')[1]) - Number(a.split('-')[1]));
    for (const shell of shells) {
      for (const platform of readdirSync(join(cache, shell))) {
        const bin = join(cache, shell, platform, 'chrome-headless-shell');
        if (existsSync(bin)) return bin;
      }
    }
  }
  console.error('check-trusted-types: no chrome-headless-shell - run `npx -y playwright@1.64.0 install chromium-headless-shell` or set CHROME_PATH');
  process.exit(2);
}

const profile = mkdtempSync(join(tmpdir(), 'lc-tt-'));
const chrome = spawn(findChrome(), [
  '--headless', '--remote-debugging-port=0', `--user-data-dir=${profile}`, '--no-first-run',
  '--no-default-browser-check', '--hide-scrollbars', 'about:blank',
], { stdio: ['ignore', 'ignore', 'pipe'] });
const browserWs = await new Promise((res, rej) => {
  let buffer = '';
  const timer = setTimeout(() => rej(new Error('chrome did not start within 15 s')), 15000);
  chrome.stderr.on('data', (chunk) => {
    buffer += chunk;
    const match = buffer.match(/DevTools listening on (ws:\/\/\S+)/);
    if (match) {
      clearTimeout(timer);
      res(match[1]);
    }
  });
  chrome.on('exit', (code) => rej(new Error(`chrome exited with ${code}: ${buffer.slice(-500)}`)));
});

/** A minimal DevTools protocol client: commands and event listeners on one WebSocket. */
async function connect(url) {
  const ws = new WebSocket(url);
  await new Promise((res, rej) => {
    ws.onopen = res;
    ws.onerror = () => rej(new Error(`cannot connect to ${url}`));
  });
  let id = 0;
  const pending = new Map();
  const listeners = [];
  ws.onmessage = ({ data }) => {
    const msg = JSON.parse(data);
    if (msg.method) {
      for (const listener of listeners) listener(msg.method, msg.params);
      return;
    }
    const p = pending.get(msg.id);
    if (!p) return;
    pending.delete(msg.id);
    msg.error ? p.rej(new Error(`${p.method}: ${msg.error.message}`)) : p.res(msg.result);
  };
  return {
    send: (method, params = {}) =>
      new Promise((res, rej) => {
        pending.set(++id, { res, rej, method });
        ws.send(JSON.stringify({ id, method, params }));
      }),
    on: (listener) => listeners.push(listener),
    close: () => ws.close(),
  };
}

const browser = await connect(browserWs);
const { targetId } = await browser.send('Target.createTarget', { url: 'about:blank' });
const page = await connect(browserWs.replace(/\/devtools\/browser\/.*/, `/devtools/page/${targetId}`));

/** Everything the page reports, per page load. */
let log;
const resetLog = () => (log = { violations: [], console: [], exceptions: [] });
resetLog();
page.on((method, params) => {
  if (method === 'Runtime.bindingCalled' && params.name === '__lcViolation') log.violations.push(JSON.parse(params.payload));
  if (method === 'Runtime.consoleAPICalled') {
    const text = params.args.map((a) => a.value ?? a.description ?? '').join(' ');
    log.console.push({ source: 'console', level: params.type, text });
  }
  if (method === 'Log.entryAdded') log.console.push({ source: `log:${params.entry.source}`, level: params.entry.level, text: params.entry.text });
  if (method === 'Runtime.exceptionThrown') log.exceptions.push(params.exceptionDetails.exception?.description ?? params.exceptionDetails.text);
});
await page.send('Page.enable');
await page.send('Runtime.enable');
await page.send('Log.enable');
await page.send('Runtime.addBinding', { name: '__lcViolation' });
await page.send('Page.addScriptToEvaluateOnNewDocument', {
  source: `document.addEventListener('securitypolicyviolation', (e) => window.__lcViolation(JSON.stringify({
    directive: e.effectiveDirective || e.violatedDirective, blocked: e.blockedURI, sample: e.sample, source: e.sourceFile + ':' + e.lineNumber })));`,
});

async function evaluate(expression) {
  const { result, exceptionDetails } = await page.send('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true });
  if (exceptionDetails) throw new Error(exceptionDetails.exception?.description ?? exceptionDetails.text);
  return result.value;
}

async function waitFor(expression, label, timeout = 15000) {
  const deadline = Date.now() + timeout;
  while (Date.now() < deadline) {
    if (await evaluate(`(() => { try { return !!(${expression}); } catch { return false; } })()`)) return true;
    await new Promise((r) => setTimeout(r, 100));
  }
  throw new Error(`timed out waiting for ${label}`);
}

const settle = () => evaluate('new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(() => setTimeout(r, 150))))');

/** Loads a page and waits until it has hydrated: `/tt` clears `aria-busy` after the browser's first render. */
async function load(path) {
  resetLog();
  await page.send('Page.navigate', { url: `${base}${path}` });
  await waitFor(`document.readyState === 'complete' && document.querySelector('main#tt-main') && !document.querySelector('main#tt-main').hasAttribute('aria-busy')`, `${path} to hydrate`);
  await settle();
}

// --- In-page probes ---

/** Elements with a box (or, for hidden-by-design ones, present). */
const PRESENT = `((selectors) => Object.fromEntries(selectors.map((s) => {
  const el = document.querySelector(s);
  const r = el?.getBoundingClientRect();
  return [s, !!el && r.width > 0 && r.height > 0];
})))`;

/** Every lc-icon: its number of <svg> children and their child tags. */
const ICONS = `[...document.querySelectorAll('lc-icon')].map((icon) => {
  const svgs = icon.querySelectorAll('.icon-container > svg');
  return { id: icon.id || icon.dataset.icon || icon.getAttribute('name'), svgs: svgs.length,
           children: svgs[0] ? [...svgs[0].children].map((c) => c.tagName).join(',') : '',
           label: svgs[0]?.getAttribute('aria-label') ?? null, hidden: svgs[0]?.getAttribute('aria-hidden') ?? null };
})`;

/** The side navigation's announced and painted links. */
const SIDENAV = `(() => {
  const nav = document.querySelector('lc-sidenav[shell-nav] nav');
  const links = [...(nav?.querySelectorAll('a') ?? [])];
  return {
    current: links.filter((a) => a.hasAttribute('aria-current')).map((a) => a.getAttribute('href') + '=' + a.getAttribute('aria-current')),
    painted: links.filter((a) => a.classList.contains('lc-sidenav__nav-item--active')).map((a) => a.getAttribute('href')),
  };
})()`;

const click = (selector) => evaluate(`(() => { const el = document.querySelector(${JSON.stringify(selector)}); if (!el) throw new Error('no ${selector}'); el.click(); return true; })()`);
const pressEscape = () => evaluate(`document.activeElement?.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true })) || document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }))`);

// --- The checks ---

const INLINE = inlineIcons(ROOT);
const report = [];
let failed = false;

function check(run, width, label, ok, detail) {
  report.push({ run: run.name, width, label, ok, ...(detail !== undefined && { detail }) });
  if (!ok) failed = true;
}

/** Every page load: violations, pattern-matching console lines, exceptions and NG05xx, as the run expects. */
function checkLog(run, width, path) {
  const matching = log.console.filter((l) => VIOLATION_PATTERN.test(l.text));
  const hydration = log.console.filter((l) => /NG05\d\d/.test(l.text));
  if (!run.refused) {
    check(run, width, `${path}: 0 securitypolicyviolation events`, log.violations.length === 0, log.violations);
    check(run, width, `${path}: 0 console or Log lines matching life-os's pattern`, matching.length === 0, matching);
  } else {
    const warnings = log.console.filter((l) => l.source === 'console' && l.level === 'warning' && /lc-icon/.test(l.text) && /trusted-types/.test(l.text));
    check(run, width, `${path}: exactly 1 console warning naming lc-icon and trusted-types`, warnings.length === 1, warnings.map((w) => w.text));
    const other = log.violations.filter((v) => v.directive !== 'trusted-types');
    check(run, width, `${path}: only the refused policy is reported (trusted-types)`, other.length === 0 && log.violations.length === 1, log.violations);
  }
  check(run, width, `${path}: 0 uncaught exceptions`, log.exceptions.length === 0, log.exceptions);
  check(run, width, `${path}: 0 hydration messages (NG05xx)`, hydration.length === 0, hydration);
}

const F1_TODAY = {
  both: ['lc-app-shell', 'lc-app-page main', 'lc-header header', 'lc-page-header', 'lc-alert', 'lc-next-step-card', 'lc-card',
    'lc-list', 'lc-description-list', 'lc-skeleton', 'lc-badge', 'lc-avatar', 'lc-avatar-group', 'lc-logo img', 'lc-footer footer',
    'lc-button button', 'a[lcButton]'],
  1280: ['lc-sidenav[shell-nav] nav'],
  360: ['lc-bottom-nav nav'],
};
const F1_HOUSEHOLD = ['lc-input input', 'lc-email-input input', 'lc-password-input input', 'lc-verification-code-input input',
  'lc-radio-group fieldset', 'lc-copy-field', 'lc-provider-button button'];

try {
  for (const run of RUNS) {
    csp = run.csp;
    for (const width of [1280, 360]) {
      await page.send('Emulation.setDeviceMetricsOverride', { width, height: 900, deviceScaleFactor: 1, mobile: false });

      // Today: the F1 display set, the overlays, the singletons, the side navigation.
      await load('/tt');
      const present = await evaluate(`${PRESENT}(${JSON.stringify([...F1_TODAY.both, ...F1_TODAY[width]])})`);
      check(run, width, '/tt: every F1 element renders with a box', Object.values(present).every(Boolean), Object.entries(present).filter(([, v]) => !v).map(([k]) => k));
      // The outlet is empty (no box) until a toast shows; that is checked below.
      check(run, width, '/tt: lc-toast-outlet is in the page', await evaluate(`!!document.querySelector('lc-toast-outlet')`));
      const icons = await evaluate(ICONS);
      check(run, width, '/tt: every lc-icon has exactly one <svg> after hydration', icons.length > 5 && icons.every((i) => i.svgs === 1), icons.filter((i) => i.svgs !== 1));
      if (run.refused) {
        check(run, width, '/tt: bundled icons show the placeholder and keep their label', icons.every((i) => i.children === 'rect,text'), icons.filter((i) => i.children !== 'rect,text'));
      }
      check(run, width, '/tt: the logo uses the base path provided through the primary entry', await evaluate(`[...document.querySelectorAll('#tt-logo img')].every((img) => img.getAttribute('src').startsWith('/compat-logo/'))`));

      if (width === 1280) {
        const nav = await evaluate(SIDENAV);
        check(run, width, '/tt: one current sidenav link after hydration (AC-24)', nav.current.join() === '/tt=page' && nav.painted.join() === '/tt', nav);
        await click('lc-sidenav[shell-nav] a[href="/tt/household"]');
        await waitFor(`location.pathname === '/tt/household'`, 'client navigation to /tt/household');
        await settle();
        const household = await evaluate(SIDENAV);
        check(run, width, '/tt → /tt/household: one current link (AC-22)', household.current.join() === '/tt/household=page' && household.painted.join() === '/tt/household', household);
        await click('lc-sidenav[shell-nav] a[href="/tt"]');
        await waitFor(`location.pathname === '/tt'`, 'client navigation back to /tt');
        await settle();
        const back = await evaluate(SIDENAV);
        check(run, width, '/tt/household → /tt: one current link (AC-22)', back.current.join() === '/tt=page' && back.painted.join() === '/tt', back);
      }

      await click('.lc-header__profile-trigger');
      await settle();
      check(run, width, '/tt: the member menu opens', await evaluate(`!!document.querySelector('[role="menu"]') && document.querySelector('.lc-header__profile-trigger').getAttribute('aria-expanded') === 'true'`));
      await pressEscape();
      await click('#tt-open-modal');
      await settle();
      check(run, width, '/tt: the modal opens', await evaluate(`[...document.querySelectorAll('lc-modal [role="dialog"], lc-modal dialog')].some((d) => d.getBoundingClientRect().height > 0)`));
      await pressEscape();
      await settle();
      await click('#tt-open-confirm');
      await settle();
      // ConfirmService mounts lc-confirm-dialog on a <div> host appended to <body>.
      check(run, width, '/tt: the confirm dialog opens', await evaluate(`[...document.querySelectorAll('[role="dialog"], [role="alertdialog"], dialog')].some((d) => d.textContent.includes('Einladung zurückziehen?') && d.getBoundingClientRect().height > 0)`));
      await pressEscape();
      await settle();
      await click('#tt-show-toast');
      await settle();
      check(run, width, '/tt: a toast from the primary entry\'s ToastService shows in the /toast outlet (AC-16)', await evaluate(`document.querySelector('lc-toast-outlet')?.textContent.includes('Gespeichert')`));
      await click('#tt-theme-dark');
      await settle();
      check(run, width, '/tt: the primary entry\'s ThemeService reaches lc-header (AC-16)', await evaluate(`!!document.querySelector('lc-header [aria-label="Hell"], lc-header button[aria-label="Hell"]')`));
      if (width === 360) {
        await click('#tt-open-drawer');
        await settle();
        check(run, width, '/tt: the drawer navigation opens', await evaluate(`(() => { const d = document.querySelector('#tt-drawer aside[role="dialog"]'); return !!d && d.getBoundingClientRect().width > 0; })()`));
        await pressEscape();
      }
      const afterOverlays = await evaluate(ICONS);
      check(run, width, '/tt: every lc-icon (overlays included) has exactly one <svg>', afterOverlays.every((i) => i.svgs === 1), afterOverlays.filter((i) => i.svgs !== 1));
      checkLog(run, width, '/tt');

      // Household: the F1 form set.
      await load('/tt/household');
      const forms = await evaluate(`${PRESENT}(${JSON.stringify(F1_HOUSEHOLD)})`);
      check(run, width, '/tt/household: every F1 form element renders with a box', Object.values(forms).every(Boolean), Object.entries(forms).filter(([, v]) => !v).map(([k]) => k));
      checkLog(run, width, '/tt/household');

      // Icons: every inline name × variant, and the primary-entry probe.
      await load('/tt/icons');
      const all = await evaluate(ICONS);
      const inline = all.filter((i) => i.id && i.id.includes(':'));
      check(run, width, `/tt/icons: all ${INLINE.length} inline name × variant render exactly one <svg>`, inline.length === INLINE.length && inline.every((i) => i.svgs === 1 && i.children.length > 0), inline.filter((i) => i.svgs !== 1).slice(0, 5));
      check(run, width, '/tt/icons: they carry their aria-label', inline.every((i) => i.label === i.id.replace(':', ' ')));
      if (run.refused) {
        check(run, width, '/tt/icons: all of them show the placeholder', inline.every((i) => i.children === 'rect,text'));
      } else {
        check(run, width, '/tt/icons: none of them is the placeholder', inline.every((i) => i.children !== 'rect,text'), inline.filter((i) => i.children === 'rect,text').map((i) => i.id));
      }
      check(run, width, '/tt/icons: the primary entry\'s IconComponent is the /icon class and renders (AC-13)', await evaluate(`document.querySelector('#tt-primary-icon').dataset.sameClass === 'true' && document.querySelectorAll('#tt-primary-icon svg').length === 1`));
      checkLog(run, width, '/tt/icons');

      // Fetched: a Tabler asset, the index.html fallback, a crafted SVG.
      await load('/tt/fetched');
      await waitFor(`['#tt-anchor', '#tt-typo', '#tt-crafted'].every((s) => document.querySelector(s + ' svg'))`, 'the fetched icons');
      await settle();
      const fetched = await evaluate(ICONS);
      const byId = Object.fromEntries(fetched.map((i) => [i.id, i]));
      const anchorPaths = await evaluate(`document.querySelectorAll('#tt-anchor svg > path').length`);
      check(run, width, '/tt/fetched: anchor renders its 3 paths (AC-12)', byId['tt-anchor']?.svgs === 1 && anchorPaths === 3, { ...byId['tt-anchor'], anchorPaths });
      check(run, width, '/tt/fetched: the index.html fallback shows the placeholder', byId['tt-typo']?.children === 'rect,text' && byId['tt-typo']?.label === 'Tippfehler');
      check(run, width, '/tt/fetched: the crafted SVG shows the placeholder and runs nothing', byId['tt-crafted']?.children === 'rect,text' && (await evaluate('window.__pwned === undefined')));
      const warned = (name) => log.console.filter((l) => l.level === 'warning' && l.text.includes(`"${name}"`)).length;
      check(run, width, '/tt/fetched: one warning each for the fallback and the crafted SVG', warned('lc-typo-icon') === 1 && warned('lc-crafted') === 1, log.console.filter((l) => l.level === 'warning').map((l) => l.text));
      checkLog(run, width, '/tt/fetched');
    }
  }
} catch (error) {
  failed = true;
  report.push({ error: error.stack ?? String(error) });
} finally {
  page.close();
  browser.close();
  const exited = new Promise((r) => chrome.once('exit', r));
  chrome.kill();
  await Promise.race([exited, new Promise((r) => setTimeout(r, 3000))]);
  server.close();
  try {
    rmSync(profile, { recursive: true, force: true, maxRetries: 5, retryDelay: 200 });
  } catch {
    // A leftover temp profile is not a failure of the check.
  }
}

for (const run of RUNS) {
  console.log(`\n${run.name}\n  CSP: ${run.csp}`);
  for (const r of report.filter((x) => x.run === run.name)) {
    console.log(`  [${r.ok ? 'ok' : 'FAIL'}] ${r.width} px  ${r.label}${!r.ok && r.detail !== undefined ? `\n         ${JSON.stringify(r.detail).slice(0, 600)}` : ''}`);
  }
}
for (const r of report.filter((x) => x.error)) console.log(`\nERROR ${r.error}`);
const passed = report.filter((r) => r.ok).length;
console.log(`\n${failed ? 'FAIL' : 'PASS'}: ${passed} of ${report.filter((r) => 'ok' in r).length} checks; ${requests.filter((p) => p.startsWith('/tabler-icons/')).length} icon requests served`);
if (typeof args.json === 'string') writeFileSync(resolve(args.json), JSON.stringify(report, null, 2));
process.exit(failed ? 1 : 0);

#!/usr/bin/env node
/**
 * Screenshots and measurements of Storybook stories in headless Chromium, for
 * the design reviews of the agent pipeline (.claude/agents/). No dependency:
 * the script serves the static Storybook build itself and drives Playwright's
 * cached chrome-headless-shell over the DevTools protocol (Node's built-in
 * WebSocket). Animations are off (prefers-reduced-motion), so shots are stable;
 * the page is painted in `--color-background`, as an app would.
 *
 * Prerequisite: `npx nx build-storybook angular-ui-kit` (reads dist/storybook/angular-ui-kit).
 *
 * Usage:
 *   node tools/agents/story-shots.mjs --list=hero
 *   node tools/agents/story-shots.mjs --stories=layout-hero--page-band[,…]
 *        [--widths=360,1024,1280] [--themes=light,dark] [--height=900] [--full]
 *        [--measure='<JS expression, may use await; result must be JSON>']
 *        [--out=tmp/story-shots]
 *
 * Prints one JSON line per shot: { story, width, theme, file, measure }.
 * CHROME_PATH overrides the browser.
 */
import { spawn } from 'node:child_process';
import { createServer } from 'node:http';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { homedir, tmpdir } from 'node:os';
import { dirname, extname, join, normalize, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(HERE, '../..');
const STORYBOOK = join(ROOT, 'dist/storybook/angular-ui-kit');

const args = Object.fromEntries(
  process.argv.slice(2).map((a) => {
    const [k, ...v] = a.replace(/^--/, '').split('=');
    return [k, v.length ? v.join('=') : true];
  }),
);
const list = (v, fallback) => (typeof v === 'string' ? v.split(',').map((s) => s.trim()).filter(Boolean) : fallback);

function fail(message) {
  console.error(`story-shots: ${message}`);
  process.exit(1);
}

if (!existsSync(join(STORYBOOK, 'index.json'))) {
  fail('no Storybook build in dist/storybook/angular-ui-kit - run `npx nx build-storybook angular-ui-kit` first');
}
const storyIds = Object.values(JSON.parse(readFileSync(join(STORYBOOK, 'index.json'), 'utf8')).entries)
  .filter((e) => e.type === 'story')
  .map((e) => e.id);

if (args.list) {
  const filter = typeof args.list === 'string' ? args.list : '';
  for (const id of storyIds.filter((id) => id.includes(filter))) console.log(id);
  process.exit(0);
}

const stories = list(args.stories, []);
if (!stories.length) fail('pass --stories=<id>[,<id>] (find ids with --list=<filter>)');
const unknown = stories.filter((id) => !storyIds.includes(id));
if (unknown.length) {
  const hints = unknown.flatMap((id) => storyIds.filter((s) => s.startsWith(id.split('--')[0]))).slice(0, 15);
  fail(`unknown story id(s): ${unknown.join(', ')}${hints.length ? `\nsame component: ${hints.join(', ')}` : ''}\n(is the Storybook build older than the story?)`);
}
const widths = list(args.widths, ['360', '1024', '1280']).map(Number);
const themes = list(args.themes, ['light', 'dark']);
const height = Number(args.height ?? 900);
const out = resolve(ROOT, typeof args.out === 'string' ? args.out : 'tmp/story-shots');
mkdirSync(out, { recursive: true });

// --- Static server for the Storybook build ---

const MIME = {
  '.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript', '.css': 'text/css',
  '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg',
  '.woff': 'font/woff', '.woff2': 'font/woff2', '.ttf': 'font/ttf', '.ico': 'image/x-icon', '.map': 'application/json',
};
const server = createServer((req, res) => {
  const path = normalize(decodeURIComponent(new URL(req.url, 'http://x').pathname)).replace(/^(\.\.[/\\])+/, '');
  let file = join(STORYBOOK, path);
  if (existsSync(file) && statSync(file).isDirectory()) file = join(file, 'index.html');
  if (!file.startsWith(STORYBOOK) || !existsSync(file)) {
    res.writeHead(404).end();
    return;
  }
  res.writeHead(200, { 'content-type': MIME[extname(file)] ?? 'application/octet-stream' });
  res.end(readFileSync(file));
});
await new Promise((r) => server.listen(0, '127.0.0.1', r));
const base = `http://127.0.0.1:${server.address().port}`;

// --- Browser ---

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
  fail('no chrome-headless-shell in the Playwright cache - run `npx -y playwright@1.64.0 install chromium-headless-shell` or set CHROME_PATH');
}

const profile = mkdtempSync(join(tmpdir(), 'story-shots-'));
const chrome = spawn(findChrome(), [
  '--headless', '--remote-debugging-port=0', `--user-data-dir=${profile}`, '--no-first-run',
  '--no-default-browser-check', '--hide-scrollbars', '--force-color-profile=srgb', 'about:blank',
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

/** A minimal DevTools protocol client on one WebSocket. */
async function connect(url) {
  const ws = new WebSocket(url);
  await new Promise((res, rej) => {
    ws.onopen = res;
    ws.onerror = () => rej(new Error(`cannot connect to ${url}`));
  });
  let id = 0;
  const pending = new Map();
  ws.onmessage = ({ data }) => {
    const msg = JSON.parse(data);
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
    close: () => ws.close(),
  };
}

const browser = await connect(browserWs);
const { targetId } = await browser.send('Target.createTarget', { url: 'about:blank' });
const page = await connect(browserWs.replace(/\/devtools\/browser\/.*/, `/devtools/page/${targetId}`));
await page.send('Page.enable');
await page.send('Runtime.enable');

async function evaluate(expression) {
  const { result, exceptionDetails } = await page.send('Runtime.evaluate', {
    expression, awaitPromise: true, returnByValue: true,
  });
  if (exceptionDetails) throw new Error(exceptionDetails.exception?.description ?? exceptionDetails.text);
  return result.value;
}

/** Waits until Storybook shows the story (or its error), the fonts are loaded and the layout settled. */
async function waitForStory(story) {
  const deadline = Date.now() + 20000;
  while (Date.now() < deadline) {
    const state = await evaluate(`(() => {
      const b = document.body;
      if (!b) return 'loading';
      if (b.classList.contains('sb-show-errordisplay')) return 'error: ' + (document.querySelector('#error-message')?.textContent ?? '').trim();
      return b.classList.contains('sb-show-main') && document.querySelector('#storybook-root')?.childElementCount ? 'ready' : 'loading';
    })()`).catch(() => 'loading');
    if (state === 'ready') {
      // Storybook leaves the page transparent (white in a shot); an app paints it in the theme's background.
      await evaluate(`document.head.insertAdjacentHTML('beforeend', '<style>html { background: var(--color-background); }</style>')`);
      await evaluate('document.fonts.ready.then(() => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r))))');
      await new Promise((r) => setTimeout(r, 300));
      return;
    }
    if (state.startsWith('error')) throw new Error(`${story}: ${state}`);
    await new Promise((r) => setTimeout(r, 150));
  }
  throw new Error(`${story}: not rendered within 20 s`);
}

let failed = false;
try {
  for (const story of stories) {
    for (const theme of themes) {
      for (const width of widths) {
        await page.send('Emulation.setDeviceMetricsOverride', { width, height, deviceScaleFactor: 1, mobile: false });
        await page.send('Emulation.setEmulatedMedia', {
          features: [
            { name: 'prefers-color-scheme', value: theme },
            { name: 'prefers-reduced-motion', value: 'reduce' },
          ],
        });
        const url = `${base}/iframe.html?id=${encodeURIComponent(story)}&viewMode=story&globals=theme:${theme}`;
        try {
          await page.send('Page.navigate', { url });
          await waitForStory(story);
          const measure = typeof args.measure === 'string' ? await evaluate(`(async () => (${args.measure}))()`) : undefined;
          let clip;
          if (args.full) {
            const { cssContentSize } = await page.send('Page.getLayoutMetrics');
            clip = { x: 0, y: 0, width, height: Math.ceil(cssContentSize.height), scale: 1 };
          }
          const { data } = await page.send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: !!clip, ...(clip && { clip }) });
          const file = join(out, `${story}--${width}-${theme}.png`);
          writeFileSync(file, Buffer.from(data, 'base64'));
          console.log(JSON.stringify({ story, width, theme, file: file.replace(`${ROOT}/`, ''), ...(measure !== undefined && { measure }) }));
        } catch (error) {
          failed = true;
          console.log(JSON.stringify({ story, width, theme, error: error.message }));
        }
      }
    }
  }
} finally {
  page.close();
  browser.close();
  chrome.kill();
  server.close();
  rmSync(profile, { recursive: true, force: true });
}
process.exit(failed ? 1 : 0);

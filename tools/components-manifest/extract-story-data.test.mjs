// Run: node --test tools/components-manifest/
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { dedent, extractStoryData } from './extract-story-data.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '../..');
const SRC = join(ROOT, 'libs/angular-ui-kit/src');

// A stories file as the library writes them. Single-quoted lines, so the
// backticks and the escaped backticks (\`) are exactly what the file contains.
const FIXTURE = [
  "import type { Meta, StoryObj } from '@storybook/angular';",
  "import { moduleMetadata } from '@storybook/angular';",
  "import { ShellComponent } from './shell.component';",
  "import { PageComponent } from './page.component';",
  "import { ButtonComponent } from '../button/button.component';",
  "import type { Item } from './item.model';",
  '',
  "const frame = (inner: string, padding = '0', lang = 'en') => `",
  '  <div lang="${lang}" style="padding: ${padding}">',
  '    ${inner}',
  '  </div>`;',
  '',
  "const shared = 'Shared text';",
  '',
  'const meta: Meta<ShellComponent> = {',
  "  title: 'Layout/Shell',",
  '  component: ShellComponent,',
  '  decorators: [moduleMetadata({ imports: [PageComponent] })],',
  '  render: (args) => ({ props: args, template: `<lc-shell [horizon]="horizon" />` }),',
  '  parameters: {',
  '    docs: {',
  '      description: {',
  '        component: `',
  '        \\`lc-shell\\` — the frame. Use \\`horizon\\` to close the page.',
  '',
  '        \\`\\`\\`html',
  '        <lc-shell />',
  '        \\`\\`\\`',
  '        Last line.',
  '        `,',
  '      },',
  '    },',
  '  },',
  '};',
  'export default meta;',
  'type Story = StoryObj<ShellComponent>;',
  '',
  'export const Default: Story = {',
  '  render: (args) => ({',
  '    props: args,',
  '    template: frame(`<lc-shell [horizon]="true" />`),',
  '  }),',
  '};',
  '',
  'export const Padded: Story = {',
  "  parameters: { docs: { description: { story: shared + ' for the padded frame.' } } },",
  "  render: (args) => ({ props: args, template: frame('<lc-shell />', '16px', 'de') }),",
  '};',
  '',
  'export const Reused: Story = { args: { horizon: true }, render: Default.render };',
  '',
  'export const Spread: Story = { ...Padded, args: { horizon: false } };',
  '',
  'export const ArgsOnly: Story = { args: { horizon: true } };',
].join('\n');

test('fixture carries escaped backticks in the description', () => {
  assert.match(FIXTURE, /\\`lc-shell\\`/);
});

test('reads the component description past escaped backticks, unescaped and dedented', () => {
  const { description } = extractStoryData(FIXTURE, []);
  assert.equal(
    description,
    ['`lc-shell` — the frame. Use `horizon` to close the page.', '', '```html', '<lc-shell />', '```', 'Last line.'].join('\n'),
  );
});

test('expands template helpers with their arguments and defaults', () => {
  const { snippets } = extractStoryData(FIXTURE, ['Default', 'Padded']);
  assert.equal(snippets.Default, '<div lang="en" style="padding: 0">\n  <lc-shell [horizon]="true" />\n</div>');
  assert.equal(snippets.Padded, '<div lang="de" style="padding: 16px">\n  <lc-shell />\n</div>');
});

test('follows render references and spreads, falls back to the meta template', () => {
  const { snippets } = extractStoryData(FIXTURE, ['Reused', 'Spread', 'ArgsOnly', 'Missing']);
  assert.match(snippets.Reused, /<lc-shell \[horizon\]="true" \/>/);
  assert.match(snippets.Spread, /lang="de"/);
  assert.equal(snippets.ArgsOnly, '<lc-shell [horizon]="horizon" />');
  assert.equal(snippets.Missing, undefined);
});

test('reads story descriptions, resolving top-level constants', () => {
  const { storyDescriptions } = extractStoryData(FIXTURE, ['Default', 'Padded']);
  assert.deepEqual(storyDescriptions, { Padded: 'Shared text for the padded frame.' });
});

test('lists the same-folder components and directives the stories import', () => {
  assert.deepEqual(extractStoryData(FIXTURE, []).localImports, ['./shell.component', './page.component']);
});

test('dedent keeps relative indentation', () => {
  assert.equal(dedent('\n    a\n      b\n    c\n  '), 'a\n  b\nc');
});

// ── Regression guard against the real library ──────────────────────────────
// The regex this module replaced ended every description at its first escaped
// backtick. Read each description's template literal with an escape-aware
// pattern and require the extractor to reach its last line.

function walk(dir) {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    return statSync(path).isDirectory() ? walk(path) : [path];
  });
}

const storyFiles = walk(SRC).filter((f) => f.endsWith('.stories.ts'));

test('every component description is read to its last line', () => {
  let checked = 0;
  for (const file of storyFiles) {
    const src = readFileSync(file, 'utf8');
    const raw = src.match(/description:\s*\{\s*component:\s*`((?:\\[\s\S]|[^`\\])*)`/);
    if (!raw) continue;
    const lastLine = raw[1]
      .replace(/\\(.)/g, '$1')
      .split('\n')
      .map((l) => l.trim())
      .filter(Boolean)
      .pop();
    if (!lastLine || lastLine.includes('${')) continue;
    const { description } = extractStoryData(src, [], file);
    assert.ok(description.includes(lastLine), `${relative(ROOT, file)}: description ends before "${lastLine}"`);
    assert.ok(!description.includes('\\`'), `${relative(ROOT, file)}: unresolved escape`);
    checked++;
  }
  assert.ok(checked >= 40, `descriptions checked: ${checked}`);
});

// Stories that render a template: all of them when the meta has one, else
// those with their own (a story with args only renders the bare component).
const templatedExportsOf = (src) => {
  const [head, ...blocks] = src.split(/^(?=export const )/m);
  const metaRenders = /\b(render|template)\s*:/.test(head);
  return blocks
    .filter((block) => metaRenders || /\b(render|template)\s*:/.test(block))
    .map((block) => block.match(/^export const (\w+)/)[1]);
};

test('the 3.3 components have a snippet for every story with a template', () => {
  for (const path of [
    'lib/bottom-nav/bottom-nav.stories.ts',
    'lib/app-shell/app-shell.stories.ts',
    'lib/provider-button/provider-button.stories.ts',
    'lib/radio/radio-group.stories.ts',
    'lib/copy-field/copy-field.stories.ts',
  ]) {
    const src = readFileSync(join(SRC, path), 'utf8');
    const names = templatedExportsOf(src);
    assert.ok(names.length, `${path}: no stories found`);
    const { snippets } = extractStoryData(src, names, path);
    const missing = names.filter((n) => !snippets[n]);
    assert.deepEqual(missing, [], `${path}: stories without a snippet`);
  }
});

// Run: node --test tools/components-manifest/
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { entryOf, importDoc, importLine } from './import-line.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '../..');

test('entryOf: the folder of a component path is its entry', () => {
  assert.equal(entryOf('./libs/angular-ui-kit/src/lib/app-shell/app-shell.component.ts'), 'app-shell');
  assert.equal(entryOf('./libs/angular-ui-kit/src/lib/button/button-link.component.ts'), 'button');
  assert.equal(entryOf('./libs/angular-ui-kit/src/docs/getting-started.mdx'), null);
  assert.equal(entryOf(undefined), null);
});

test('importLine: one line, classes once, in order', () => {
  assert.equal(
    importLine('app-shell', ['AppShellComponent', 'AppPageComponent', 'AppShellComponent']),
    "import { AppShellComponent, AppPageComponent } from '@lifecorner/angular-ui-kit/app-shell';",
  );
});

test('importDoc: a separate "Import" entry with the line in a code block', () => {
  const doc = importDoc('components-icon', 'Icon', './libs/angular-ui-kit/src/lib/icon/icon.component.ts', ['IconComponent']);
  assert.deepEqual(Object.keys(doc), ['id', 'name', 'title', 'path', 'content']);
  assert.equal(doc.id, 'components-icon--import');
  assert.equal(doc.name, 'Import');
  assert.match(doc.content, /```typescript\nimport \{ IconComponent \} from '@lifecorner\/angular-ui-kit\/icon';\n```/);
  assert.match(doc.content, /`@lifecorner\/angular-ui-kit` keeps working unchanged/);
  assert.equal(importDoc('x', 'X', './libs/angular-ui-kit/src/lib/icon/icon.component.ts', []), undefined);
});

test('every entry folder the docs name exists and has an ng-package.json stub', () => {
  const lib = join(ROOT, 'libs/angular-ui-kit/src/lib');
  for (const folder of readdirSync(lib).filter((f) => existsSync(join(lib, f, 'index.ts')) && f !== 'internal')) {
    assert.ok(existsSync(join(ROOT, 'libs/angular-ui-kit', folder, 'ng-package.json')), `${folder} has no stub`);
  }
});

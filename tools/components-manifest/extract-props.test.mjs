// Run: node --test tools/components-manifest/
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { extractComponentApi, formatApiSummary, toComponentMeta } from './extract-props.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '../..');
const LIB = join(ROOT, 'libs/angular-ui-kit/src/lib');

const FIXTURE = `
import { Component, Directive, EventEmitter, Input, Output, booleanAttribute, input, model, output } from '@angular/core';

export interface Foo { id: string; label?: string }
export type Size = 'sm' | 'md';
interface Internal { x: number }

@Component({ selector: 'lc-fixture', template: '' })
export class FixtureComponent {
  /** Plain input with a default. */
  readonly a = input('x');
  readonly b = input<number>(1);
  /**
   * Required input.
   *
   * Second paragraph is left out.
   */
  readonly c = input.required<string>();
  readonly d = input.required<Foo>({ alias: 'dee' });
  /** Two-way value. */
  readonly e = model(false);
  readonly f = model.required<string>();
  readonly g = input<Record<string, Array<number>>>({});
  readonly h = input(false, { transform: booleanAttribute });
  readonly i = input<
    'a' | 'b'
  >('a');
  readonly size = input<Size>('md');
  @Input() legacy = 'x';
  @Input({ required: true }) legacyRequired!: string;
  @Input('aliasedLegacy') legacyAliased?: number;
  @Output() changed = new EventEmitter<string>();
  /** Emits on click. */
  readonly clicked = output<void>();
  readonly moved = output<{ x: number }>();
  readonly renamed = output<string>({ alias: 'renamedEvent' });
  private readonly internal = 1;
  protected readonly computedThing = () => 2;
}

@Directive({ selector: '[lcFixture]' })
export class FixtureDirective {
  readonly lcFixture = input.required<string>();
}

/** Not a component: its fields are not API. */
export class Helper {
  readonly notAnInput = input('x');
}
`;

test('reads every signal and decorator input form', () => {
  const { classes } = extractComponentApi(FIXTURE);
  assert.deepEqual(classes.map((c) => [c.name, c.selector]), [
    ['FixtureComponent', 'lc-fixture'],
    ['FixtureDirective', '[lcFixture]'],
  ]);
  const byName = Object.fromEntries(classes[0].inputs.map((p) => [p.name, p]));
  assert.deepEqual(Object.keys(byName), ['a', 'b', 'c', 'dee', 'e', 'f', 'g', 'h', 'i', 'size', 'legacy', 'legacyRequired', 'aliasedLegacy']);

  assert.equal(byName.a.type, 'string');
  assert.equal(byName.a.default, "'x'");
  assert.equal(byName.a.description, 'Plain input with a default.');
  assert.equal(byName.b.type, 'number');
  assert.equal(byName.c.required, true);
  assert.equal(byName.c.default, undefined);
  assert.equal(byName.c.description, 'Required input.');
  assert.equal(byName.dee.property, 'd');
  assert.equal(byName.dee.required, true);
  assert.equal(byName.dee.type, 'Foo');
  assert.equal(byName.e.kind, 'model');
  assert.equal(byName.e.type, 'boolean');
  assert.equal(byName.f.kind, 'model');
  assert.equal(byName.f.required, true);
  assert.equal(byName.g.type, 'Record<string, Array<number>>');
  assert.equal(byName.h.transform, 'booleanAttribute');
  assert.match(byName.i.type, /^'a' \| 'b'$/);
  assert.equal(byName.legacy.kind, 'input');
  assert.equal(byName.legacyRequired.required, true);
  assert.equal(byName.aliasedLegacy.property, 'legacyAliased');
  assert.equal(classes[1].inputs[0].required, true);
});

test('reads outputs, including the implicit output of every model', () => {
  const [cmp] = extractComponentApi(FIXTURE).classes;
  assert.deepEqual(
    cmp.outputs.map((o) => [o.name, o.type, o.kind]),
    [
      ['eChange', 'boolean', 'model'],
      ['fChange', 'string', 'model'],
      ['changed', 'string', 'output'],
      ['clicked', 'void', 'output'],
      ['moved', '{ x: number }', 'output'],
      ['renamedEvent', 'string', 'output'],
    ],
  );
});

test('ignores undecorated classes and private members, exports the public types', () => {
  const api = extractComponentApi(FIXTURE);
  assert.ok(!api.classes.some((c) => c.name === 'Helper'));
  assert.ok(!api.classes[0].inputs.some((p) => p.property === 'internal'));
  assert.equal(api.types.length, 2);
  assert.match(api.types[0], /export interface Foo/);
  assert.match(api.types[1], /export type Size = 'sm' \| 'md';/);
});

test('formats required inputs, models and aliases in the summary', () => {
  const summary = formatApiSummary(extractComponentApi(FIXTURE));
  assert.match(summary, /^\/\/ FixtureComponent \(lc-fixture\)$/m);
  assert.match(summary, /^@Input\(\{ required: true \}\) c: string;$/m);
  assert.match(summary, /^@Input\(\{ required: true \}\) d: Foo;$/m);
  assert.match(summary, /^@Input\(\) e: boolean = false; \/\/ model: two-way \[\(e\)\], emits eChange$/m);
  assert.match(summary, /^@Output\(\) eChange: boolean; \/\/ from model e$/m);
  assert.match(summary, /^\/\*\* Required input\. \*\/$/m);
  assert.match(summary, /^\/\/ Types$/m);
});

// ── Regression guard against the real library ──────────────────────────────
// The regex extractor this module replaced dropped every input.required() and
// model() (≈ 50 props the MCP server never showed). Count the declarations with
// an independent pattern and require the extractor to report all of them.

function walk(dir) {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    return statSync(path).isDirectory() ? walk(path) : [path];
  });
}

const sources = walk(LIB).filter((f) => /\.(component|directive)\.ts$/.test(f));

test('finds every input.required() and model() declared in the library', () => {
  let required = 0;
  let models = 0;
  for (const file of sources) {
    const src = readFileSync(file, 'utf8');
    const expectedRequired = (src.match(/=\s*(input|model)\.required\s*[<(]/g) ?? []).length;
    const expectedModels = (src.match(/=\s*model(\.required)?\s*[<(]/g) ?? []).length;
    const inputs = extractComponentApi(src, file).classes.flatMap((c) => c.inputs);
    const name = relative(ROOT, file);
    assert.equal(inputs.filter((p) => p.required).length, expectedRequired, `${name}: required inputs`);
    assert.equal(inputs.filter((p) => p.kind === 'model').length, expectedModels, `${name}: models`);
    required += expectedRequired;
    models += expectedModels;
  }
  // The library declared 38 required inputs and 14 models when this test was
  // written; fewer means files stopped being scanned.
  assert.ok(required >= 38, `required inputs: ${required}`);
  assert.ok(models >= 14, `models: ${models}`);
});

test('every signal input/output declaration in the library is reported', () => {
  for (const file of sources) {
    const src = readFileSync(file, 'utf8');
    const declared = (src.match(/^\s+(?:readonly\s+)?\w+\s*=\s*(?:input|model)(?:\.required)?\s*[<(]/gm) ?? []).length;
    const reported = extractComponentApi(src, file).classes.flatMap((c) => c.inputs).length;
    assert.ok(reported >= declared, `${relative(ROOT, file)}: ${reported} reported < ${declared} declared`);
  }
});

test('known props of the library reach the summary', () => {
  const summaryOf = (path) => formatApiSummary(extractComponentApi(readFileSync(join(LIB, path), 'utf8')));
  assert.match(summaryOf('hero/hero.component.ts'), /@Input\(\{ required: true \}\) title: string;/);
  assert.match(summaryOf('checkbox/checkbox.component.ts'), /@Input\(\) checked: boolean = false; \/\/ model: two-way/);
  assert.match(summaryOf('checkbox/checkbox.component.ts'), /@Output\(\) checkedChange: boolean;/);
  assert.match(summaryOf('table/table.component.ts'), /@Input\(\) data: Record<string, unknown>\[\] = \[\];/);
  const header = summaryOf('header/header.component.ts');
  assert.match(header, /@Input\(\) navItems: readonly HeaderNavItem\[\] = \[\];/);
  assert.match(header, /export interface HeaderNavItem/);
  assert.match(summaryOf('button/button-link.component.ts'), /^\/\/ Selector: a\[lcButton\]$/m);
});

test('toComponentMeta gives get-documentation every input, model and output', () => {
  const { classes } = extractComponentApi(FIXTURE);
  const { props } = toComponentMeta(classes[0]);
  // the shape @storybook/mcp renders: { description, type: { raw }, defaultValue: { value }, required }
  assert.deepEqual(props.a, { description: 'Plain input with a default.', type: { name: 'string', raw: 'string' }, defaultValue: { value: "'x'" }, required: false });
  assert.equal(props.c.required, true);
  assert.equal(props.c.defaultValue, undefined);
  assert.match(props.dee.description, /alias of the class property d/);
  assert.match(props.e.description, /^Two-way value\. · model\(\): two-way binding \[\(e\)\], emits eChange$/);
  assert.equal(props.i.type.raw, "'a' | 'b'");
  assert.match(props.h.description, /transform: booleanAttribute/);
  // outputs appear as (name); a model's change output is not listed twice
  assert.match(props['(clicked)'].description, /^Emits on click\. · output: emits void$/);
  assert.equal(props['(renamedEvent)'].required, false);
  assert.equal(props['(eChange)'], undefined);
});

test('every library component with an API yields props for get-documentation', () => {
  for (const file of sources) {
    const api = extractComponentApi(readFileSync(file, 'utf-8'), file);
    for (const cls of api.classes) {
      if (!cls.inputs.length && !cls.outputs.length) continue;
      const { props } = toComponentMeta(cls);
      assert.ok(Object.keys(props).length > 0, `${relative(ROOT, file)} ${cls.name}`);
      for (const [name, prop] of Object.entries(props)) {
        assert.ok(prop.type.raw && !/\s{2}/.test(prop.type.raw), `${cls.name}.${name}: type ${prop.type.raw}`);
      }
    }
  }
});


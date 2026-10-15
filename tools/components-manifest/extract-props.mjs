/**
 * Reads the public API of Angular components and directives from their source,
 * for the components manifest the MCP server serves (Angular has no docgen that
 * Storybook could use).
 *
 * Parsed with the TypeScript compiler, not regular expressions: the regex this
 * replaces missed every `input.required()` and `model()` (and any input whose
 * type had nested generics), so about 50 props never reached the MCP server.
 *
 * Recognized, per class decorated with @Component or @Directive:
 *   inputs   input(), input.required(), @Input()            (+ alias, transform)
 *   models   model(), model.required()   — two-way: [(name)], emits nameChange
 *   outputs  output(), outputFromObservable(), @Output() EventEmitter<T>
 * plus the JSDoc of each member and the interfaces / type aliases the file
 * exports (the types the props refer to).
 */
import ts from 'typescript';

const INPUT_FNS = new Set(['input', 'model']);
const OUTPUT_FNS = new Set(['output', 'outputFromObservable']);

/** First paragraph of a JSDoc block, collapsed to one line. */
function docOf(node, sourceFile) {
  const ranges = ts.getLeadingCommentRanges(sourceFile.text, node.getFullStart()) ?? [];
  const jsdoc = ranges
    .map((r) => sourceFile.text.slice(r.pos, r.end))
    .filter((c) => c.startsWith('/**'))
    .pop();
  if (!jsdoc) return undefined;
  const body = jsdoc
    .replace(/^\/\*\*|\*\/$/g, '')
    .split('\n')
    .map((l) => l.replace(/^\s*\*\s?/, ''))
    .join('\n')
    .trim();
  const firstParagraph = body.split(/\n\s*\n|\n\s*@/)[0].replace(/\s+/g, ' ').trim();
  return firstParagraph || undefined;
}

/** Type of a literal default when no type argument is given. */
function typeOfLiteral(expr) {
  if (!expr) return undefined;
  switch (expr.kind) {
    case ts.SyntaxKind.StringLiteral:
    case ts.SyntaxKind.NoSubstitutionTemplateLiteral:
    case ts.SyntaxKind.TemplateExpression:
      return 'string';
    case ts.SyntaxKind.NumericLiteral:
      return 'number';
    case ts.SyntaxKind.TrueKeyword:
    case ts.SyntaxKind.FalseKeyword:
      return 'boolean';
    case ts.SyntaxKind.PrefixUnaryExpression:
      return expr.operand.kind === ts.SyntaxKind.NumericLiteral ? 'number' : undefined;
    default:
      return undefined;
  }
}

/** `{ alias: 'x', transform: fn }` → { alias, transform } */
function optionsOf(expr, sourceFile) {
  const out = {};
  if (!expr || !ts.isObjectLiteralExpression(expr)) return out;
  for (const prop of expr.properties) {
    if (!ts.isPropertyAssignment(prop) || !prop.name) continue;
    const key = prop.name.getText(sourceFile);
    if (key === 'alias' && ts.isStringLiteralLike(prop.initializer)) out.alias = prop.initializer.text;
    if (key === 'transform') out.transform = prop.initializer.getText(sourceFile);
    if (key === 'required' && prop.initializer.kind === ts.SyntaxKind.TrueKeyword) out.required = true;
  }
  return out;
}

/** `input`, `input.required`, `model`, `output`, … → { fn, required } */
function calleeOf(call) {
  const callee = call.expression;
  if (ts.isIdentifier(callee)) return { fn: callee.text, required: false };
  if (ts.isPropertyAccessExpression(callee) && ts.isIdentifier(callee.expression) && callee.name.text === 'required') {
    return { fn: callee.expression.text, required: true };
  }
  return null;
}

function decoratorsOf(node) {
  return (ts.canHaveDecorators(node) ? ts.getDecorators(node) : undefined) ?? [];
}

function decoratorCall(node, name) {
  for (const d of decoratorsOf(node)) {
    if (ts.isCallExpression(d.expression) && ts.isIdentifier(d.expression.expression) && d.expression.expression.text === name) {
      return d.expression;
    }
  }
  return null;
}

function selectorOf(classDecl, sourceFile) {
  const call = decoratorCall(classDecl, 'Component') ?? decoratorCall(classDecl, 'Directive');
  const arg = call?.arguments[0];
  if (!arg || !ts.isObjectLiteralExpression(arg)) return undefined;
  for (const prop of arg.properties) {
    if (ts.isPropertyAssignment(prop) && prop.name?.getText(sourceFile) === 'selector' && ts.isStringLiteralLike(prop.initializer)) {
      return prop.initializer.text;
    }
  }
  return undefined;
}

function memberName(member, sourceFile) {
  return member.name && (ts.isIdentifier(member.name) || ts.isStringLiteral(member.name) || ts.isPrivateIdentifier(member.name))
    ? member.name.text ?? member.name.getText(sourceFile)
    : undefined;
}

/** Inputs, models and outputs of one decorated class. */
function extractClass(classDecl, sourceFile) {
  const inputs = [];
  const outputs = [];
  for (const member of classDecl.members) {
    if (!ts.isPropertyDeclaration(member)) continue;
    const name = memberName(member, sourceFile);
    if (!name) continue;
    const description = docOf(member, sourceFile);

    // Decorator API: @Input() / @Output()
    const inputDecorator = decoratorCall(member, 'Input');
    if (inputDecorator) {
      const arg = inputDecorator.arguments[0];
      const opts = arg && ts.isStringLiteralLike(arg) ? { alias: arg.text } : optionsOf(arg, sourceFile);
      inputs.push({
        name: opts.alias ?? name,
        property: name,
        kind: 'input',
        required: !!opts.required,
        type: member.type?.getText(sourceFile) ?? typeOfLiteral(member.initializer) ?? 'unknown',
        default: member.initializer?.getText(sourceFile),
        transform: opts.transform,
        description,
      });
      continue;
    }
    const outputDecorator = decoratorCall(member, 'Output');
    if (outputDecorator) {
      const arg = outputDecorator.arguments[0];
      const init = member.initializer;
      const typeArg = init && ts.isNewExpression(init) ? init.typeArguments?.[0]?.getText(sourceFile) : undefined;
      outputs.push({
        name: arg && ts.isStringLiteralLike(arg) ? arg.text : name,
        property: name,
        kind: 'output',
        type: typeArg ?? 'void',
        description,
      });
      continue;
    }

    // Signal API: input() / input.required() / model() / output()
    const init = member.initializer;
    if (!init || !ts.isCallExpression(init)) continue;
    const callee = calleeOf(init);
    if (!callee) continue;
    const typeArg = init.typeArguments?.[0]?.getText(sourceFile);

    if (INPUT_FNS.has(callee.fn)) {
      // input(default, options) / input.required(options)
      const [first, second] = init.arguments;
      const defaultExpr = callee.required ? undefined : first;
      const opts = optionsOf(callee.required ? first : second, sourceFile);
      const prop = {
        name: opts.alias ?? name,
        property: name,
        kind: callee.fn === 'model' ? 'model' : 'input',
        required: callee.required,
        type: typeArg ?? typeOfLiteral(defaultExpr) ?? 'unknown',
        default: defaultExpr?.getText(sourceFile),
        transform: opts.transform,
        description,
      };
      inputs.push(prop);
      if (prop.kind === 'model') {
        outputs.push({ name: `${prop.name}Change`, property: name, kind: 'model', type: prop.type, description: `Emits when \`${prop.name}\` changes (two-way binding).` });
      }
    } else if (OUTPUT_FNS.has(callee.fn)) {
      const opts = optionsOf(init.arguments[callee.fn === 'output' ? 0 : 1], sourceFile);
      outputs.push({ name: opts.alias ?? name, property: name, kind: 'output', type: typeArg ?? (callee.fn === 'output' ? 'void' : 'unknown'), description });
    }
  }
  return { inputs, outputs };
}

/**
 * @param {string} source  TypeScript source of a component/directive file
 * @param {string} [fileName]
 * @returns {{ classes: Array<{ name: string, selector?: string, inputs: object[], outputs: object[] }>, types: string[] }}
 */
export function extractComponentApi(source, fileName = 'component.ts') {
  const sourceFile = ts.createSourceFile(fileName, source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS);
  const classes = [];
  const types = [];
  const printer = ts.createPrinter({ removeComments: true });
  for (const stmt of sourceFile.statements) {
    if (ts.isClassDeclaration(stmt) && stmt.name && (decoratorCall(stmt, 'Component') || decoratorCall(stmt, 'Directive'))) {
      classes.push({ name: stmt.name.text, selector: selectorOf(stmt, sourceFile), ...extractClass(stmt, sourceFile) });
    }
    const exported = (ts.getModifiers?.(stmt) ?? []).some((m) => m.kind === ts.SyntaxKind.ExportKeyword);
    if (exported && (ts.isInterfaceDeclaration(stmt) || ts.isTypeAliasDeclaration(stmt))) {
      types.push(printer.printNode(ts.EmitHint.Unspecified, stmt, sourceFile));
    }
  }
  return { classes, types };
}

function propLine(p) {
  const decorator = p.required ? '@Input({ required: true })' : p.name !== p.property ? `@Input('${p.name}')` : '@Input()';
  const def = p.default !== undefined ? ` = ${p.default.replace(/\s+/g, ' ')}` : '';
  const notes = [];
  if (p.kind === 'model') notes.push(`model: two-way [(${p.name})], emits ${p.name}Change`);
  if (p.transform) notes.push(`transform: ${p.transform}`);
  return `${decorator} ${p.property}: ${p.type.replace(/\s+/g, ' ')}${def};${notes.length ? ` // ${notes.join('; ')}` : ''}`;
}

const flat = (text) => text.replace(/\s+/g, ' ').trim();

/**
 * One class's inputs, models and outputs in the docgen shape @storybook/mcp renders
 * as the "## Props" section of `get-documentation` (it reads `reactComponentMeta`,
 * `reactDocgenTypescript` or `reactDocgen`; Angular has none of them, so we write
 * the framework-neutral shape ourselves). Outputs appear as `(name)`; a model's
 * `nameChange` output is described on the model input instead.
 * @param {{ inputs: object[], outputs: object[] }} cls
 * @returns {{ props: Record<string, { description?: string, type: { name: string, raw: string }, defaultValue?: { value: string }, required: boolean }> }}
 */
export function toComponentMeta(cls) {
  const props = {};
  for (const p of cls.inputs) {
    const notes = [];
    if (p.kind === 'model') notes.push(`model(): two-way binding [(${p.name})], emits ${p.name}Change`);
    if (p.name !== p.property) notes.push(`alias of the class property ${p.property}`);
    if (p.transform) notes.push(`transform: ${p.transform}`);
    const type = flat(p.type);
    props[p.name] = {
      description: [p.description, ...notes].filter(Boolean).join(' · ') || undefined,
      type: { name: type, raw: type },
      defaultValue: p.default !== undefined ? { value: flat(p.default) } : undefined,
      required: !!p.required,
    };
  }
  for (const o of cls.outputs) {
    if (o.kind === 'model') continue;
    const type = flat(o.type);
    props[`(${o.name})`] = {
      description: [o.description, `output: emits ${type}`].filter(Boolean).join(' · '),
      type: { name: type, raw: type },
      required: false,
    };
  }
  return { props };
}

/**
 * The TypeScript-like "Props" block of a component in the manifest.
 * @param {ReturnType<typeof extractComponentApi>} api
 */
export function formatApiSummary(api) {
  const lines = [];
  const multiple = api.classes.filter((c) => c.inputs.length || c.outputs.length).length > 1;
  for (const cls of api.classes) {
    if (!cls.inputs.length && !cls.outputs.length) continue;
    if (multiple) lines.push(`// ${cls.name}${cls.selector ? ` (${cls.selector})` : ''}`);
    else if (cls.selector) lines.push(`// Selector: ${cls.selector}`);
    if (cls.inputs.length) {
      lines.push('// Inputs (Props)');
      for (const p of cls.inputs) {
        if (p.description) lines.push(`/** ${p.description} */`);
        lines.push(propLine(p));
      }
    }
    if (cls.outputs.length) {
      lines.push('// Outputs (Events)');
      for (const o of cls.outputs) {
        if (o.description && o.kind !== 'model') lines.push(`/** ${o.description} */`);
        lines.push(`@Output() ${o.name}: ${o.type.replace(/\s+/g, ' ')};${o.kind === 'model' ? ` // from model ${o.property}` : ''}`);
      }
    }
  }
  if (lines.length && api.types.length) {
    lines.push('// Types');
    lines.push(...api.types);
  }
  return lines.join('\n');
}

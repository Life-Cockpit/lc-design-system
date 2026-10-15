/**
 * Reads the texts the components manifest needs from a `*.stories.ts` file:
 * the component description (`parameters.docs.description.component` of the
 * default-exported meta), each story's description
 * (`parameters.docs.description.story`) and each story's template snippet.
 *
 * Parsed with the TypeScript compiler, not regular expressions: the regex this
 * replaces read template literals up to the first backtick, so every
 * description that showed code (`\`lc-button\``) was cut at its first escaped
 * backtick, and escapes reached the MCP server unresolved.
 *
 * Strings are evaluated where that is static: string and template literals
 * (escapes resolved; `${expr}` kept as written), `+` concatenation, `[...].join()`
 * and references to top-level `const`s.
 */
import ts from 'typescript';

function unwrap(expr) {
  let e = expr;
  while (
    e &&
    (ts.isParenthesizedExpression(e) ||
      ts.isAsExpression(e) ||
      ts.isSatisfiesExpression?.(e) ||
      ts.isTypeAssertionExpression?.(e) ||
      ts.isNonNullExpression(e))
  ) {
    e = e.expression;
  }
  return e;
}

/** Removes the indentation all non-empty lines share, then trims. */
export function dedent(text) {
  const lines = text.replace(/\r\n/g, '\n').split('\n');
  const indents = lines.filter((l) => l.trim()).map((l) => l.match(/^[ \t]*/)[0].length);
  const cut = indents.length ? Math.min(...indents) : 0;
  return lines
    .map((l) => l.slice(Math.min(cut, l.match(/^[ \t]*/)[0].length)))
    .join('\n')
    .trim();
}

function createContext(sourceFile) {
  /** Top-level `const name = …` initializers. */
  const consts = new Map();
  for (const stmt of sourceFile.statements) {
    if (ts.isFunctionDeclaration(stmt) && stmt.name && stmt.body) consts.set(stmt.name.text, stmt);
    if (!ts.isVariableStatement(stmt)) continue;
    for (const decl of stmt.declarationList.declarations) {
      if (ts.isIdentifier(decl.name) && decl.initializer) consts.set(decl.name.text, decl.initializer);
    }
  }

  /** The returned expression of a one-expression helper (`(a, b = 'x') => \`…\``). */
  function returnedExpression(fn) {
    if (!fn.body) return undefined;
    if (!ts.isBlock(fn.body)) return fn.body;
    const returns = fn.body.statements.filter(ts.isReturnStatement);
    return fn.body.statements.length === 1 && returns.length === 1 ? returns[0].expression : undefined;
  }

  /**
   * Static string value of an expression, or undefined.
   * `env` holds the parameters of a helper being expanded (name → string).
   */
  function stringOf(expr, env = new Map(), seen = new Set()) {
    const e = unwrap(expr);
    if (!e) return undefined;
    if (ts.isStringLiteral(e) || ts.isNoSubstitutionTemplateLiteral(e)) return e.text;
    if (ts.isTemplateExpression(e)) {
      let out = e.head.text;
      for (const span of e.templateSpans) {
        const inner = stringOf(span.expression, env, seen);
        out += (inner ?? `\${${span.expression.getText(sourceFile)}}`) + span.literal.text;
      }
      return out;
    }
    if (ts.isNumericLiteral(e)) return e.text;
    if (ts.isBinaryExpression(e) && e.operatorToken.kind === ts.SyntaxKind.PlusToken) {
      const left = stringOf(e.left, env, seen);
      const right = stringOf(e.right, env, seen);
      return left !== undefined && right !== undefined ? left + right : undefined;
    }
    if (ts.isCallExpression(e) && ts.isPropertyAccessExpression(e.expression) && e.expression.name.text === 'join') {
      const list = unwrap(e.expression.expression);
      if (!ts.isArrayLiteralExpression(list)) return undefined;
      const parts = list.elements.map((el) => stringOf(el, env, seen));
      if (parts.some((p) => p === undefined)) return undefined;
      const sep = e.arguments.length ? stringOf(e.arguments[0], env, seen) : ',';
      return sep === undefined ? undefined : parts.join(sep);
    }
    // A top-level helper that builds the template: phoneFrame(`<lc-…/>`, '16px')
    if (ts.isCallExpression(e) && ts.isIdentifier(e.expression) && !seen.has(e.expression.text)) {
      const fn = unwrap(consts.get(e.expression.text));
      if (!fn || !(ts.isArrowFunction(fn) || ts.isFunctionExpression(fn) || ts.isFunctionDeclaration(fn))) return undefined;
      const body = returnedExpression(fn);
      if (!body) return undefined;
      const inner = new Map();
      fn.parameters.forEach((param, i) => {
        if (!ts.isIdentifier(param.name)) return;
        const arg = e.arguments[i];
        const value = arg ? stringOf(arg, env, seen) ?? `\${${arg.getText(sourceFile)}}` : param.initializer ? stringOf(param.initializer, new Map(), seen) : undefined;
        if (value !== undefined) inner.set(param.name.text, value);
      });
      const nextSeen = new Set(seen).add(e.expression.text);
      return stringOf(body, inner, nextSeen);
    }
    if (ts.isIdentifier(e)) {
      if (env.has(e.text)) return env.get(e.text);
      if (consts.has(e.text) && !seen.has(e.text)) return stringOf(consts.get(e.text), new Map(), new Set(seen).add(e.text));
    }
    return undefined;
  }

  /** Object literal an expression stands for (follows top-level consts). */
  function objectOf(expr, seen = new Set()) {
    const e = unwrap(expr);
    if (!e) return undefined;
    if (ts.isObjectLiteralExpression(e)) return e;
    if (ts.isIdentifier(e) && consts.has(e.text) && !seen.has(e.text)) {
      seen.add(e.text);
      return objectOf(consts.get(e.text), seen);
    }
    return undefined;
  }

  function propName(prop) {
    if (!prop.name) return undefined;
    if (ts.isIdentifier(prop.name) || ts.isStringLiteral(prop.name)) return prop.name.text;
    return undefined;
  }

  /** `obj.a.b.c` for object literals (spreads of known consts included). */
  function pathOf(obj, path, seen = new Set()) {
    if (!obj) return undefined;
    const [head, ...rest] = path;
    // Later properties win, as at runtime: walk backwards.
    for (let i = obj.properties.length - 1; i >= 0; i--) {
      const prop = obj.properties[i];
      if (ts.isPropertyAssignment(prop) && propName(prop) === head) {
        if (!rest.length) return prop.initializer;
        return pathOf(objectOf(prop.initializer), rest, seen);
      }
      if (ts.isSpreadAssignment(prop)) {
        const spread = unwrap(prop.expression);
        if (ts.isIdentifier(spread) && !seen.has(spread.text)) {
          seen.add(spread.text);
          const found = pathOf(objectOf(spread), path, seen);
          if (found) return found;
        }
      }
    }
    return undefined;
  }

  /**
   * First `template:` property anywhere inside a story (render functions
   * included), following spreads of and references to other top-level consts
   * (`...Default`, `render: Default.render`).
   */
  function findTemplate(node, seen = new Set()) {
    let found;
    const follow = (name, path) => {
      if (!consts.has(name) || seen.has(name)) return;
      seen.add(name);
      const target = path.length ? pathOf(objectOf(consts.get(name)), path) : consts.get(name);
      if (target) found = findTemplate(target, seen);
    };
    const visit = (n) => {
      if (found !== undefined) return;
      if (ts.isPropertyAssignment(n) && propName(n) === 'template') {
        const value = stringOf(n.initializer);
        if (value !== undefined) {
          found = value;
          return;
        }
      }
      if (ts.isShorthandPropertyAssignment(n) && n.name.text === 'template') {
        const value = stringOf(n.name);
        if (value !== undefined) {
          found = value;
          return;
        }
      }
      if (ts.isSpreadAssignment(n) && ts.isIdentifier(unwrap(n.expression))) {
        follow(unwrap(n.expression).text, []);
        if (found !== undefined) return;
      }
      if (ts.isPropertyAccessExpression(n) && ts.isIdentifier(n.expression)) {
        follow(n.expression.text, [n.name.text]);
        if (found !== undefined) return;
      }
      ts.forEachChild(n, visit);
    };
    visit(node);
    return found;
  }

  return { consts, stringOf, objectOf, pathOf, findTemplate };
}

/**
 * @param {string} source       TypeScript source of a `*.stories.ts` file
 * @param {string[]} exportNames story exports to read (from Storybook's index)
 * @param {string} [fileName]
 * @returns {{ description: string, snippets: Record<string, string>, storyDescriptions: Record<string, string>, localImports: string[] }}
 *   `localImports`: the same-folder `*.component` / `*.directive` modules the
 *   file imports (`./app-page.component`) — the subcomponents its stories use.
 */
export function extractStoryData(source, exportNames, fileName = 'component.stories.ts') {
  const sourceFile = ts.createSourceFile(fileName, source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS);
  const ctx = createContext(sourceFile);

  let meta;
  for (const stmt of sourceFile.statements) {
    if (ts.isExportAssignment(stmt) && !stmt.isExportEquals) meta = ctx.objectOf(stmt.expression);
  }

  const componentDesc = meta && ctx.stringOf(ctx.pathOf(meta, ['parameters', 'docs', 'description', 'component']));
  const metaTemplate = meta ? ctx.findTemplate(meta) : undefined;

  const snippets = {};
  const storyDescriptions = {};
  for (const name of exportNames) {
    const init = ctx.consts.get(name);
    if (!init) continue;
    const template = ctx.findTemplate(init) ?? metaTemplate;
    if (template !== undefined && template.trim()) snippets[name] = dedent(template);
    const story = ctx.objectOf(init);
    const desc = story && ctx.stringOf(ctx.pathOf(story, ['parameters', 'docs', 'description', 'story']));
    if (desc && desc.trim()) storyDescriptions[name] = dedent(desc);
  }

  const localImports = sourceFile.statements
    .filter((st) => ts.isImportDeclaration(st) && ts.isStringLiteral(st.moduleSpecifier) && !st.importClause?.isTypeOnly)
    .map((st) => st.moduleSpecifier.text)
    .filter((spec) => /^\.\/[^/]+\.(component|directive)$/.test(spec));

  return { description: componentDesc ? dedent(componentDesc) : '', snippets, storyDescriptions, localImports };
}

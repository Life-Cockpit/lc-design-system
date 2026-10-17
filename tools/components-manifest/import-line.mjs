/**
 * The import line of a component's MCP documentation (3.5, request 001,
 * AC-21): every component is importable from its secondary entry,
 * `@lifecorner/angular-ui-kit/<folder>`, named like its folder in
 * `libs/angular-ui-kit/src/lib/`. A separate "Import" doc entry, so the
 * component's `summary` stays the first sentence of its description.
 */

const PACKAGE = '@lifecorner/angular-ui-kit';

/** The entry of a component path (`./libs/angular-ui-kit/src/lib/app-shell/app-shell.component.ts` → `app-shell`), or null. */
export function entryOf(componentPath) {
  return componentPath?.match(/libs\/angular-ui-kit\/src\/lib\/([^/]+)\/[^/]+\.ts$/)?.[1] ?? null;
}

/** `import { A, B } from '@lifecorner/angular-ui-kit/<entry>';` */
export function importLine(entry, classNames) {
  return `import { ${[...new Set(classNames)].join(', ')} } from '${PACKAGE}/${entry}';`;
}

/**
 * The "Import" doc entry for a component, or undefined when its path is not
 * an entry folder or it has no component or directive class.
 * @param {string} id  the manifest id (`layout-app-shell`)
 * @param {string} name  the component's display name (`App Shell`)
 * @param {string} componentPath
 * @param {string[]} classNames  the component and directive classes, the main one first
 */
export function importDoc(id, name, componentPath, classNames) {
  const entry = entryOf(componentPath);
  if (!entry || !classNames.length) return undefined;
  return {
    id: `${id}--import`,
    name: 'Import',
    title: `${name}: import`,
    path: componentPath,
    content: [
      `Import it from its secondary entry, \`${PACKAGE}/${entry}\`: only this part of the kit ends up in your bundle, and lazy routes take it with them. \`${PACKAGE}\` keeps working unchanged.`,
      '',
      '```typescript',
      importLine(entry, classNames),
      '```',
    ].join('\n'),
  };
}

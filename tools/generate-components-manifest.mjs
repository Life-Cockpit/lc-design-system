#!/usr/bin/env node
/**
 * Generates manifests/components.json from Storybook's index.json + source files.
 * Required because @storybook/mcp needs this manifest but Angular has no
 * built-in docgen to generate it automatically (unlike React).
 *
 * Extracts: story IDs, code snippets (templates), component props — signal
 * input()/input.required()/model()/output() and @Input/@Output, read with the
 * TypeScript compiler (see components-manifest/extract-props.mjs) — and the
 * component and story descriptions from the stories files, also read with the
 * TypeScript compiler (components-manifest/extract-story-data.mjs).
 */
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs';
import { dirname, join, relative, resolve } from 'path';
import { extractComponentApi, formatApiSummary, toComponentMeta } from './components-manifest/extract-props.mjs';
import { extractStoryData } from './components-manifest/extract-story-data.mjs';

const ROOT = process.cwd();
const STORYBOOK_OUTPUT = join(ROOT, 'dist/storybook/angular-ui-kit');
const INDEX_PATH = join(STORYBOOK_OUTPUT, 'index.json');
const MANIFESTS_DIR = join(STORYBOOK_OUTPUT, 'manifests');
const OUTPUT_PATH = join(MANIFESTS_DIR, 'components.json');

// --- Helpers ---

/**
 * Public API (inputs, models, outputs, exported types) of a component .ts file,
 * plus the subcomponents its stories import from the same folder
 * (`lc-app-page` next to `lc-app-shell`, `lc-radio` next to `lc-radio-group`).
 */
function extractProps(componentPath, subcomponentPaths = []) {
  const absPath = resolve(ROOT, componentPath.replace(/^\.\//, ''));
  if (!existsSync(absPath)) return null;
  const api = extractComponentApi(readFileSync(absPath, 'utf-8'), absPath);
  for (const cls of api.classes) cls.path = componentPath;
  for (const subPath of subcomponentPaths) {
    if (subPath === absPath || !existsSync(subPath)) continue;
    const sub = extractComponentApi(readFileSync(subPath, 'utf-8'), subPath);
    for (const cls of sub.classes) {
      cls.path = `./${relative(ROOT, subPath)}`;
      if (!api.classes.some((c) => c.name === cls.name)) api.classes.push(cls);
    }
    for (const type of sub.types) {
      if (!api.types.includes(type)) api.types.push(type);
    }
  }
  const hasMembers = api.classes.some((c) => c.inputs.length || c.outputs.length);
  return hasMembers ? api : null;
}

/** One line for `list-all-documentation`: the description's first sentence, without markdown. */
function oneLineSummary(description) {
  if (!description) return undefined;
  const plain = description
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/`([^`]*)`/g, '$1')
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/[*_#>]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
  const sentence = plain.match(/^.*?[.!?](?=\s|$)/)?.[0] ?? plain;
  return sentence.length > 160 ? `${sentence.slice(0, 157).trimEnd()}...` : sentence || undefined;
}

/**
 * The structured API @storybook/mcp's `get-documentation` renders: the main class's
 * props (`reactComponentMeta`), every other class as a subcomponent with its own
 * props, and the exported types as a "Types" doc entry.
 */
function documentationFields(id, name, api) {
  const withMembers = api.classes.filter((c) => c.inputs.length || c.outputs.length);
  const [main, ...others] = withMembers;
  const fields = {};
  if (main) fields.reactComponentMeta = toComponentMeta(main);
  if (others.length) {
    fields.subcomponents = Object.fromEntries(
      others.map((cls) => [
        cls.name,
        { name: cls.name, description: cls.selector ? `Selector: \`${cls.selector}\`` : undefined, path: cls.path, reactComponentMeta: toComponentMeta(cls) },
      ]),
    );
  }
  if (api.types.length) {
    fields.docs = {
      types: {
        id: `${id}--types`,
        name: 'Types',
        title: `${name}: types`,
        path: main?.path ?? '',
        content: ['The types the props refer to:', '', '```typescript', ...api.types, '```'].join('\n'),
      },
    };
  }
  return fields;
}

/** Component description, story descriptions and template snippets of a .stories.ts file */
function readStoryData(storiesPath, exportNames) {
  const absPath = resolve(ROOT, storiesPath.replace(/^\.\//, ''));
  if (!existsSync(absPath)) return { snippets: {}, description: '', storyDescriptions: {}, localImports: [] };
  const data = extractStoryData(readFileSync(absPath, 'utf-8'), exportNames, absPath);
  data.localImports = data.localImports.map((spec) => resolve(dirname(absPath), `${spec}.ts`));
  return data;
}

// --- Main ---

const index = JSON.parse(readFileSync(INDEX_PATH, 'utf-8'));
const entries = Object.values(index.entries);
const stories = entries.filter(e => e.type === 'story');

// Group stories by componentPath (or title as fallback)
const componentGroups = new Map();
for (const story of stories) {
  const key = story.componentPath || story.title;
  if (!componentGroups.has(key)) {
    componentGroups.set(key, {
      componentPath: story.componentPath,
      title: story.title,
      importPath: story.importPath,
      stories: [],
    });
  }
  componentGroups.get(key).stories.push(story);
}

// Build ComponentsManifest
const components = {};
let totalInputs = 0;
let totalRequired = 0;
let totalModels = 0;
for (const group of componentGroups.values()) {
  const titleParts = group.title.split('/');
  const name = titleParts[titleParts.length - 1];
  const id = group.title.toLowerCase().replace(/[^a-z0-9]+/g, '-');

  // Extract story snippets and descriptions from the stories file
  const exportNames = group.stories.map(s => s.exportName);
  const { snippets, description, storyDescriptions, localImports } = readStoryData(group.importPath, exportNames);

  // Extract props from component source (+ the subcomponents the stories import)
  const props = group.componentPath ? extractProps(group.componentPath, localImports) : null;
  const propsSummary = props ? formatApiSummary(props) : '';
  if (props) {
    for (const cls of props.classes) {
      for (const p of cls.inputs) {
        totalInputs++;
        if (p.required) totalRequired++;
        if (p.kind === 'model') totalModels++;
      }
    }
  }

  components[id] = {
    id,
    path: group.componentPath || group.importPath,
    name,
    description: description || undefined,
    // One line for list-all-documentation; the full API goes to `api` (search_component)
    // and to the structured fields get-documentation renders (documentationFields).
    summary: oneLineSummary(description),
    api: propsSummary || undefined,
    ...(props ? documentationFields(id, name, props) : {}),
    stories: group.stories.map(s => ({
      id: s.id,
      name: s.name,
      description: storyDescriptions[s.exportName] || undefined,
      snippet: snippets[s.exportName] || undefined,
    })),
    jsDocTags: {},
  };
}

const manifest = {
  v: 0,
  components,
};

mkdirSync(MANIFESTS_DIR, { recursive: true });
writeFileSync(OUTPUT_PATH, JSON.stringify(manifest));

// Copy CHANGELOG.md into manifests so the MCP server can serve it
const CHANGELOG_SRC = join(ROOT, 'libs/angular-ui-kit/CHANGELOG.md');
if (existsSync(CHANGELOG_SRC)) {
  const changelogDest = join(MANIFESTS_DIR, 'CHANGELOG.md');
  writeFileSync(changelogDest, readFileSync(CHANGELOG_SRC, 'utf-8'));
  console.log('Copied CHANGELOG.md to manifests/');
} else {
  console.warn('Warning: CHANGELOG.md not found, skipping copy');
}

// Stats
let totalSnippets = 0;
let totalWithProps = 0;
for (const comp of Object.values(components)) {
  if (comp.reactComponentMeta) totalWithProps++;
  for (const s of comp.stories) {
    if (s.snippet) totalSnippets++;
  }
}
console.log(
  `Generated components.json: ${Object.keys(components).length} components, ${totalSnippets} snippets, ` +
    `${totalWithProps} with props (${totalInputs} inputs, ${totalRequired} required, ${totalModels} models)`,
);

#!/usr/bin/env node
/**
 * Generates manifests/components.json from Storybook's index.json + source files.
 * Required because @storybook/mcp needs this manifest but Angular has no
 * built-in docgen to generate it automatically (unlike React).
 *
 * Extracts: story IDs, code snippets (templates), component props — signal
 * input()/input.required()/model()/output() and @Input/@Output, read with the
 * TypeScript compiler (see components-manifest/extract-props.mjs) — and
 * component descriptions from stories meta.
 */
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs';
import { join, resolve } from 'path';
import { extractComponentApi, formatApiSummary } from './components-manifest/extract-props.mjs';

const ROOT = process.cwd();
const STORYBOOK_OUTPUT = join(ROOT, 'dist/storybook/angular-ui-kit');
const INDEX_PATH = join(STORYBOOK_OUTPUT, 'index.json');
const MANIFESTS_DIR = join(STORYBOOK_OUTPUT, 'manifests');
const OUTPUT_PATH = join(MANIFESTS_DIR, 'components.json');

// --- Helpers ---

/** Public API (inputs, models, outputs, exported types) of a component .ts file */
function extractProps(componentPath) {
  const absPath = resolve(ROOT, componentPath.replace(/^\.\//, ''));
  if (!existsSync(absPath)) return null;
  const api = extractComponentApi(readFileSync(absPath, 'utf-8'), absPath);
  const hasMembers = api.classes.some((c) => c.inputs.length || c.outputs.length);
  return hasMembers ? api : null;
}

/** Extract story snippets and description from a .stories.ts file */
function extractStoryData(storiesPath, exportNames) {
  const absPath = resolve(ROOT, storiesPath.replace(/^\.\//, ''));
  if (!existsSync(absPath)) return { snippets: {}, description: '' };
  const src = readFileSync(absPath, 'utf-8');

  // Extract component description from meta
  let description = '';
  const descMatch = src.match(/description:\s*\{\s*component:\s*`([^`]+)`/s) ||
                    src.match(/description:\s*\{\s*component:\s*['"]([^'"]+)['"]/);
  if (descMatch) {
    description = descMatch[1].trim();
  }

  // Extract template snippets per export
  const snippets = {};
  for (const exportName of exportNames) {
    // Find the story export and extract its template
    const storyPattern = new RegExp(
      `export\\s+const\\s+${exportName}[^=]*=\\s*\\{([\\s\\S]*?)(?:^\\};?|^export\\s)`,
      'm'
    );
    const storyMatch = src.match(storyPattern);
    if (storyMatch) {
      const storyBlock = storyMatch[1];
      // Extract template string
      const templateMatch = storyBlock.match(/template:\s*`([^`]+)`/) ||
                           storyBlock.match(/template:\s*'([^']+)'/) ||
                           storyBlock.match(/template:\s*"([^"]+)"/);
      if (templateMatch) {
        snippets[exportName] = templateMatch[1].trim();
      }
    }
  }

  return { snippets, description };
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

  // Extract props from component source
  const props = group.componentPath ? extractProps(group.componentPath) : null;
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

  // Extract story snippets and description from stories file
  const exportNames = group.stories.map(s => s.exportName);
  const { snippets, description } = extractStoryData(group.importPath, exportNames);

  components[id] = {
    id,
    path: group.componentPath || group.importPath,
    name,
    description: description || undefined,
    summary: propsSummary || undefined,
    stories: group.stories.map(s => ({
      id: s.id,
      name: s.name,
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
  if (comp.summary) totalWithProps++;
  for (const s of comp.stories) {
    if (s.snippet) totalSnippets++;
  }
}
console.log(
  `Generated components.json: ${Object.keys(components).length} components, ${totalSnippets} snippets, ` +
    `${totalWithProps} with props (${totalInputs} inputs, ${totalRequired} required, ${totalModels} models)`,
);

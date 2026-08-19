import type { Meta, StoryObj } from '@storybook/angular';
import { TreeViewComponent, type TreeNode } from './tree-view.component';

/**
 * TreeView visualizes file / folder hierarchies — ideal for rendering a
 * complete GitHub project. Folders expand and collapse, and each file
 * automatically gets an icon matching its type (TypeScript, JSON, image,
 * Markdown, …). You can also surface git-style status badges per node.
 */
const meta: Meta<TreeViewComponent> = {
  title: 'Components/TreeView',
  component: TreeViewComponent,
  argTypes: {
    nodes: { description: 'Root-level nodes of the tree (recursive file/folder structure)' },
    selectedId: { description: 'Id (or path) of the selected node — supports two-way binding' },
    showGuides: { control: 'boolean', description: 'Show indentation guide lines' },
    showToolbar: { control: 'boolean', description: 'Show the expand-all / collapse-all toolbar' },
    iconSize: {
      control: 'select',
      options: ['xs', 'sm', 'md'],
      description: 'Size of node icons',
    },
    nodeClick: { description: 'Emitted when a node is activated' },
  },
  parameters: {
    docs: {
      description: {
        component: `
Tree view component for visualizing file / folder hierarchies such as a complete GitHub project.

**Key Features:**
- Recursive folder / file rendering from a single \`nodes\` input
- Automatic file-type icons by extension and well-known file name (with open / closed folder icons)
- Expand / collapse folders, plus expand-all / collapse-all
- Two-way bound selection and a \`nodeClick\` event
- Indentation guide lines and optional git-style status badges
- Keyboard accessible (single tab stop, Arrow keys / Home / End move focus, Enter / Space select, Left / Right collapse / expand) and theme-aware
`,
      },
    },
  },
};

export default meta;
type Story = StoryObj<TreeViewComponent>;

/** A trimmed-down view of a typical GitHub project. */
const githubProject: TreeNode[] = [
  {
    name: '.github',
    expanded: false,
    children: [
      {
        name: 'workflows',
        children: [
          { name: 'ci.yml' },
          { name: 'release.yml' },
        ],
      },
      { name: 'ISSUE_TEMPLATE.md' },
    ],
  },
  {
    name: 'src',
    expanded: true,
    children: [
      {
        name: 'app',
        expanded: true,
        children: [
          { name: 'app.component.ts', status: 'modified', badge: 'M' },
          { name: 'app.component.html' },
          { name: 'app.component.scss' },
          { name: 'app.config.ts' },
        ],
      },
      {
        name: 'assets',
        children: [
          { name: 'logo.svg', status: 'added', badge: 'A' },
          { name: 'banner.png' },
        ],
      },
      { name: 'main.ts' },
      { name: 'styles.scss' },
    ],
  },
  {
    name: 'docs',
    children: [
      { name: 'getting-started.md' },
      { name: 'architecture.md' },
    ],
  },
  { name: '.gitignore' },
  { name: '.editorconfig' },
  { name: 'Dockerfile' },
  { name: 'package.json' },
  { name: 'tsconfig.json' },
  { name: 'README.md' },
  { name: 'LICENSE' },
];

export const Default: Story = {
  args: {
    nodes: githubProject,
    showGuides: true,
    showToolbar: true,
    iconSize: 'sm',
    selectedId: '/src/app/app.component.ts',
  },
  render: (args) => ({
    props: args,
    template: `<div style="max-width: 420px;">
      <lc-tree-view
        [nodes]="nodes"
        [showGuides]="showGuides"
        [showToolbar]="showToolbar"
        [iconSize]="iconSize"
        [(selectedId)]="selectedId"
      />
    </div>`,
  }),
};

/** Without guide lines or toolbar — a compact embedded variant. */
export const Minimal: Story = {
  args: {
    nodes: githubProject,
    showGuides: false,
    showToolbar: false,
    iconSize: 'sm',
  },
  render: (args) => ({
    props: args,
    template: `<div style="max-width: 420px;">
      <lc-tree-view [nodes]="nodes" [showGuides]="showGuides" [showToolbar]="showToolbar" [iconSize]="iconSize" />
    </div>`,
  }),
};

/** A variety of file types showing automatic icon resolution. */
export const FileTypes: Story = {
  args: { showGuides: true, showToolbar: false, iconSize: 'sm' },
  render: (args) => ({
    props: {
      ...args,
      nodes: [
        {
          name: 'mixed-files',
          expanded: true,
          children: [
            { name: 'index.ts' },
            { name: 'styles.css' },
            { name: 'theme.scss' },
            { name: 'data.json' },
            { name: 'config.yaml' },
            { name: 'script.py' },
            { name: 'server.go' },
            { name: 'notes.md' },
            { name: 'report.pdf' },
            { name: 'photo.jpg' },
            { name: 'icon.svg' },
            { name: 'archive.zip' },
            { name: 'song.mp3' },
            { name: 'clip.mp4' },
            { name: 'unknown.xyz' },
          ],
        },
      ] satisfies TreeNode[],
    },
    template: `<div style="max-width: 420px;">
      <lc-tree-view [nodes]="nodes" [showGuides]="showGuides" [showToolbar]="showToolbar" [iconSize]="iconSize" />
    </div>`,
  }),
};

/**
 * Beyond file trees, the tree view renders arbitrary object hierarchies:
 * custom `type` strings show a colored type dot (or explicit `icon`),
 * `status: 'success' | 'busy'` adds a ✓ / pulsing indicator, and `badge`
 * carries compact meta text such as a dependency count.
 */
export const ObjectTree: Story = {
  name: 'Object Tree (custom types)',
  render: () => ({
    props: {
      nodes: [
        {
          name: 'Collection North',
          id: 'col-1',
          type: 'collection',
          color: 'var(--color-primary-500)',
          expanded: true,
          children: [
            {
              name: 'Group One',
              id: 'grp-1',
              type: 'group',
              color: 'var(--color-info)',
              expanded: true,
              badge: '↳2',
              children: [
                {
                  name: 'Entry Alpha',
                  id: 'ent-1',
                  type: 'entry',
                  status: 'success',
                },
                {
                  name: 'Entry Beta — currently being generated',
                  id: 'ent-2',
                  type: 'entry',
                  status: 'busy',
                },
              ],
            },
            {
              name: 'Group Two',
              id: 'grp-2',
              type: 'group',
              color: 'var(--color-info)',
              badge: '↳1',
              children: [
                { name: 'Entry Gamma', id: 'ent-3', type: 'entry' },
              ],
            },
          ],
        },
      ],
      selectedId: 'ent-1',
    },
    template: `
      <div style="max-width: 380px;">
        <lc-tree-view [nodes]="nodes" [selectedId]="selectedId" [showToolbar]="false" />
      </div>`,
  }),
};

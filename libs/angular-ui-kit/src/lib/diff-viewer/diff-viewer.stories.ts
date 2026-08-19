import type { Meta, StoryObj } from '@storybook/angular';
import { DiffViewerComponent } from './diff-viewer.component';

const meta: Meta<DiffViewerComponent> = {
  title: 'Data Display/Diff Viewer',
  component: DiffViewerComponent,
  tags: ['autodocs'],
  argTypes: {
    mode: {
      control: 'radio',
      options: ['side-by-side', 'inline'],
      description: 'Display mode for the diff',
      table: { defaultValue: { summary: 'side-by-side' } },
    },
    showLineNumbers: { control: 'boolean', description: 'Show line numbers alongside the diff', table: { defaultValue: { summary: 'true' } } },
    contextLines: { control: 'number', description: 'Number of surrounding unchanged lines to show (Infinity = all)', table: { defaultValue: { summary: 'Infinity' } } },
    maxLines: { control: 'number', description: 'Per-side line cap; above it a "diff too large" notice is shown instead of a diff', table: { defaultValue: { summary: '20000' } } },
    oldLabel: { control: 'text', description: 'Label for the old/before panel' },
    newLabel: { control: 'text', description: 'Label for the new/after panel' },
  },
  parameters: {
    docs: {
      description: {
        component: `
Diff viewer for comparing two texts, highlighting additions and removals.

**Key Features:**
- Side-by-side and inline display modes
- Minimal line diff (Myers, linear space) — large inputs stay responsive; a per-side \`maxLines\` cap (default 20 000) degrades to a "too large" notice
- Line numbers with synchronized scrolling
- Change statistics (+additions / −deletions)
- Configurable context lines (collapse unchanged regions)
- Custom panel labels (old / new)
- Color-coded lines (green = added, red = removed)
- Dark mode compatible
        `,
      },
    },
  },
};
export default meta;
type Story = StoryObj<DiffViewerComponent>;

const oldCode = `function greet(name) {
  console.log("Hello, " + name);
  return true;
}

function add(a, b) {
  return a + b;
}`;

const newCode = `function greet(name: string) {
  console.log(\`Hello, \${name}!\`);
  return true;
}

function add(a: number, b: number): number {
  return a + b;
}

function subtract(a: number, b: number): number {
  return a - b;
}`;

export const SideBySide: Story = {
  parameters: {
    docs: { description: { story: 'Side-by-side comparison of JavaScript to TypeScript migration with added function.' } },
  },
  args: {
    oldText: oldCode,
    newText: newCode,
    oldLabel: 'Before',
    newLabel: 'After',
    mode: 'side-by-side',
  },
};

export const Inline: Story = {
  parameters: {
    docs: { description: { story: 'Inline mode shows changes in a single column, similar to git diff output.' } },
  },
  args: {
    oldText: oldCode,
    newText: newCode,
    oldLabel: 'v1.0',
    newLabel: 'v2.0',
    mode: 'inline',
  },
};

export const NoLineNumbers: Story = {
  parameters: {
    docs: { description: { story: 'Line numbers hidden for a cleaner, prose-focused comparison.' } },
  },
  args: {
    oldText: 'First line\nSecond line\nThird line',
    newText: 'First line\nModified second\nThird line\nFourth line',
    showLineNumbers: false,
    mode: 'inline',
  },
};

export const ContextLines: Story = {
  parameters: {
    docs: { description: { story: 'Only 2 context lines shown around changes — unchanged regions are collapsed.' } },
  },
  args: {
    oldText: Array.from({ length: 20 }, (_, i) => `Line ${i + 1}: unchanged content`).join('\n'),
    newText: Array.from({ length: 20 }, (_, i) =>
      i === 9 ? 'Line 10: MODIFIED content' : `Line ${i + 1}: unchanged content`
    ).join('\n'),
    contextLines: 2,
    mode: 'inline',
  },
};

export const Identical: Story = {
  parameters: {
    docs: { description: { story: 'When both texts are identical, a clean “no changes” message is shown.' } },
  },
  args: {
    oldText: 'Same content\non both sides',
    newText: 'Same content\non both sides',
    oldLabel: 'File A',
    newLabel: 'File B',
  },
};

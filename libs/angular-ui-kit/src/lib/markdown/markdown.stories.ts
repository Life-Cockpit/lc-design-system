import type { Meta, StoryObj } from '@storybook/angular';
import { MarkdownComponent } from './markdown.component';

const meta: Meta<MarkdownComponent> = {
  title: 'Components/Markdown',
  component: MarkdownComponent,
  parameters: {
    docs: {
      description: {
        component: `
Renders GitHub-Flavored Markdown (GFM) to sanitized HTML with a built-in
renderer (no \`marked\` / \`markdown-it\` dependency).

**Block elements:** headings \`h1\`–\`h6\` (with optional anchor links via
\`showHeadingAnchors\`), paragraphs, ordered & unordered lists, **task lists**
(\`- [ ]\` / \`- [x]\` render an accessible checkbox; plain items keep their
bullet), blockquotes, horizontal rules, images, **GFM tables** (column
alignment via \`:--\` / \`:-:\` / \`--:\`, horizontally scrollable when wide), and
fenced code blocks rendered through \`<lc-code-block>\` (\`syntaxHighlight\`),
including \`mermaid\` diagrams.

**Inline:** bold, italic, \`~~strikethrough~~\`, inline \`code\`, explicit
\`[text](url)\` links, and **autolinks** — bare \`http(s)://\`, \`www.\`, and email
addresses become links (never inside code spans/fences).

**Change highlighting:** pass the pre-edit markdown as \`previousContent\` and set
\`highlightChanges\` to highlight added/edited blocks in place (block / list-item
level), with optional \`changeHighlightFadeMs\` fade and \`scrollToFirstChange\`.

**Sources:** raw markdown via \`content\`, or a URL via \`src\`. Output is
sanitized by default (\`sanitize\`); links honor \`linkTarget\` / \`baseUrl\` and emit
\`linkClick\`.
        `,
      },
    },
  },
  argTypes: {
    variant: {
      control: 'select',
      options: ['default', 'compact'],
    },
    linkTarget: {
      control: 'select',
      options: ['_self', '_blank'],
    },
    highlightChanges: { control: 'boolean', description: 'Highlight changed blocks vs. previousContent' },
    changeHighlightFadeMs: { control: 'number', description: 'Fade highlights after N ms (0/undefined = persist)' },
    scrollToFirstChange: { control: 'boolean', description: 'Scroll the first changed block into view' },
  },
};

export default meta;
type Story = StoryObj<MarkdownComponent>;

const sampleMarkdown = `# Project Overview

This is a **design system** built with *Angular* and ~~jQuery~~ modern tooling.

## Features

- Component library with **75+** components
- Dark mode support
- Accessible by default (WCAG 2.1 AA)

### Code Example

\`\`\`typescript
import { ButtonComponent } from '@life-cockpit/angular-ui-kit';

@Component({
  imports: [ButtonComponent],
  template: \\\`<lc-button variant="primary">Click me</lc-button>\\\`
})
export class MyComponent {}
\`\`\`

## Data Table

| Component | Status | Tests |
|-----------|--------|-------|
| Button    | Stable | 42    |
| Modal     | Stable | 18    |
| Combobox  | New    | 12    |

## Task List

- [x] Implement core components
- [x] Add dark mode
- [ ] Write documentation
- [ ] Publish to npm

> **Note:** This is a blockquote with \`inline code\` inside.

For more info, visit [the docs](https://example.com/docs).
`;

export const Default: Story = {
  args: { content: sampleMarkdown, variant: 'default', syntaxHighlight: true },
};

export const Compact: Story = {
  args: { content: sampleMarkdown, variant: 'compact', syntaxHighlight: true },
  parameters: {
    docs: { description: { story: 'Compact variant with tighter spacing for inline previews.' } },
  },
};

export const WithHeadingAnchors: Story = {
  args: { content: sampleMarkdown, showHeadingAnchors: true },
  parameters: {
    docs: { description: { story: 'Heading anchor links appear on hover for TOC navigation.' } },
  },
};

export const SimpleText: Story = {
  args: {
    content: `A short paragraph with **bold**, *italic*, and \`code\`. Also ~~strikethrough~~.\n\nSecond paragraph with a [link](https://example.com).`,
  },
  parameters: {
    docs: { description: { story: 'Minimal inline formatting.' } },
  },
};

const documentV1 = `## Section One

- First list item
- Second list item

## Section Two

A paragraph of body text that stays the same across edits.
`;

const documentV2 = `## Section One

- First list item
- Second list item, now revised
- A third list item that was added

## Section Two

A paragraph of body text that stays the same across edits.
`;

export const ChangeHighlighting: Story = {
  args: {
    content: documentV2,
    previousContent: documentV1,
    highlightChanges: true,
  },
  parameters: {
    docs: {
      description: {
        story:
          'With `highlightChanges` + a differing `previousContent`, only the changed/added ' +
          'blocks are highlighted in place (a straight left accent bar + subtle tint). ' +
          'Diffing is block-level: a single edited or added list item is marked on its own, ' +
          'not the whole list.',
      },
    },
  },
};

export const ChangeHighlightingInteractive: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'Click **Apply edit** to swap in an edited version. The changed blocks are ' +
          'highlighted, the first is scrolled into view (`scrollToFirstChange`), and the ' +
          'highlight fades after 3s (`changeHighlightFadeMs`). Toggling back recomputes ' +
          'from scratch (no stale highlights).',
      },
    },
  },
  render: () => ({
    props: {
      current: documentV1,
      previous: documentV1,
      lastCount: 0,
      applyEdit() {
        this['previous'] = this['current'];
        this['current'] = this['current'] === documentV1 ? documentV2 : documentV1;
      },
      onHighlighted(e: { changedBlocks: number }) {
        this['lastCount'] = e.changedBlocks;
      },
    },
    template: `
      <div style="display:flex; flex-direction:column; gap:12px; max-width:640px;">
        <div style="display:flex; align-items:center; gap:12px;">
          <button
            type="button"
            (click)="applyEdit()"
            style="padding:6px 12px; border-radius:8px; border:1px solid var(--color-border); background:var(--color-surface); color:var(--color-text-primary); cursor:pointer;"
          >Apply edit</button>
          <span style="font-family:monospace; color:var(--color-text-secondary);">
            changed blocks: {{ lastCount }}
          </span>
        </div>
        <lc-markdown
          [content]="current"
          [previousContent]="previous"
          [highlightChanges]="true"
          [changeHighlightFadeMs]="3000"
          [scrollToFirstChange]="true"
          (changesHighlighted)="onHighlighted($event)"
        ></lc-markdown>
      </div>
    `,
  }),
};

export const GfmFeatures: Story = {
  args: {
    content: `## Task list

- [x] Completed item
- [ ] Open item
- [ ] Another open item
- Plain bullet (keeps its disc)

## Aligned table

| Left | Center | Right |
|:-----|:------:|------:|
| a    | b      | 1     |
| cc   | dd     | 200   |

## Autolinks

Visit https://example.com or www.example.org, or email someone@example.com —
bare URLs become links automatically.
`,
  },
  parameters: {
    docs: {
      description: {
        story:
          'GFM coverage: task lists render a checkbox + label (no bullet; plain items keep ' +
          'their disc), pipe tables honor column alignment and scroll horizontally when wide, ' +
          'and bare URLs / emails are linkified.',
      },
    },
  },
};

export const MermaidSupport: Story = {
  args: {
    content: `### Mermaid Example

\`\`\`mermaid
flowchart TD
  A[Client] --> B[API]
  B --> C[DB]
\`\`\`
`,
  },
  parameters: {
    docs: {
      description: {
        story: 'Small example to verify fenced `mermaid` blocks render as diagrams.',
      },
    },
  },
};

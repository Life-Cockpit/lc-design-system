import type { Meta, StoryObj } from '@storybook/angular';
import { DocumentViewerComponent } from './document-viewer.component';

const SAMPLE_MARKDOWN = `# Getting Started

Welcome to the **LifeCorner** documentation. This guide covers the basics.

## Installation

Install the package via npm:

\`\`\`bash
npm install @lifecorner/angular-ui-kit
\`\`\`

## Usage

Import the component in your module:

\`\`\`typescript
import { DocumentViewerComponent } from '@lifecorner/angular-ui-kit';

@Component({
  imports: [DocumentViewerComponent],
  template: \\\`<lc-document-viewer [content]="md" type="markdown" />\\\`
})
export class MyComponent {
  md = '# Hello World';
}
\`\`\`

## Key Features

- **Auto-detection** — Detects file type from extension
- **Markdown** — Full-featured inline parser
- **PDF** — Native browser rendering
- **Images** — Zoom and pan controls
- **Code** — Syntax highlighting via code-block

> **Note:** For production use, ensure all documents are served over HTTPS.

### Data Table

| Feature | Status | Notes |
| --- | --- | --- |
| PDF Preview | ✅ Done | Browser native |
| Markdown | ✅ Done | Built-in parser |
| Images | ✅ Done | Zoom support |
| Code | ✅ Done | Syntax highlight |
| Office | 🔜 Planned | Future release |

---

*Last updated: 2026-05-06*
`;

const SAMPLE_CODE = `import { Component, input, computed } from '@angular/core';

@Component({
  selector: 'app-greeting',
  standalone: true,
  template: \`<h1>Hello, {{ name() }}!</h1>\`,
})
export class GreetingComponent {
  readonly name = input.required<string>();

  protected readonly greeting = computed(() => {
    return \`Welcome, \${this.name()}\`;
  });
}
`;

const SAMPLE_TEXT = `Application Log — 2026-05-06
============================

[09:00:12] INFO  — Server started on port 3000
[09:00:13] INFO  — Database connection established
[09:01:45] WARN  — Slow query detected (1200ms): SELECT * FROM users
[09:05:22] INFO  — User login: admin@example.com
[09:12:08] ERROR — Failed to send email notification: SMTP timeout
[09:15:00] INFO  — Scheduled task "cleanup" completed (42 records removed)
[09:30:01] INFO  — Health check passed
`;

const meta: Meta<DocumentViewerComponent> = {
  title: 'Data Display/Document Viewer',
  component: DocumentViewerComponent,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: `
Document viewer component for previewing various file types.

**Key Features:**
- Auto-detects file type from URL extension or explicit type input
- PDF rendering via browser-native iframe viewer
- Markdown parsing and rendering with full formatting support
- Image display with zoom controls (25% – 500%)
- Code display using the built-in code block component
- Plain text display
- Toolbar with filename, type badge, zoom, download, and fullscreen
- Loading and error states
- Dark/light theme support
`,
      },
    },
  },
  argTypes: {
    type: {
      control: 'select',
      options: ['auto', 'pdf', 'markdown', 'image', 'text', 'code'],
    },
    language: {
      control: 'select',
      options: ['typescript', 'javascript', 'html', 'css', 'scss', 'json', 'bash', 'python', 'java', 'text'],
    },
  },
};
export default meta;

type Story = StoryObj<DocumentViewerComponent>;

export const MarkdownPreview: Story = {
  args: {
    content: SAMPLE_MARKDOWN,
    type: 'markdown',
    filename: 'getting-started.md',
    height: '600px',
  },
};

export const CodePreview: Story = {
  args: {
    content: SAMPLE_CODE,
    type: 'code',
    language: 'typescript',
    filename: 'greeting.component.ts',
    height: '400px',
  },
};

export const TextPreview: Story = {
  args: {
    content: SAMPLE_TEXT,
    type: 'text',
    filename: 'app.log',
    height: '350px',
  },
};

export const ImagePreview: Story = {
  args: {
    src: 'https://picsum.photos/800/600',
    type: 'image',
    filename: 'sample-image.jpg',
    height: '500px',
  },
};

export const UnsupportedFile: Story = {
  args: {
    src: '/assets/archive.zip',
    filename: 'archive.zip',
    height: '300px',
  },
};

export const NoToolbar: Story = {
  args: {
    content: SAMPLE_MARKDOWN,
    type: 'markdown',
    filename: 'readme.md',
    showToolbar: false,
    height: '500px',
  },
};

export const ErrorState: Story = {
  args: {
    src: '',
    content: '',
    height: '300px',
  },
};

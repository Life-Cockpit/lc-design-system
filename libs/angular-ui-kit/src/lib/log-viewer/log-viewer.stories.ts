import type { Meta, StoryObj } from '@storybook/angular';
import { interval, map } from 'rxjs';
import { LogViewerComponent, LogLine } from './log-viewer.component';

const meta: Meta<LogViewerComponent> = {
  title: 'Data Display/LogViewer',
  component: LogViewerComponent,
  parameters: {
    docs: {
      description: {
        component: `
The LogViewer component displays streaming or static log lines with
virtualized rendering, ANSI color support, auto-scroll, level filtering,
and search. Supports a "log" variant (follows the theme surface) and a
"terminal" variant (always dark).

- The virtual window is sized from the *measured* scroll area, so any
  \`height\` (\`400px\`, \`50vh\`, \`100%\` in a flex parent) renders correctly.
  Row height comes from \`--lc-log-viewer-line-height\` (22px).
- \`autoScroll\` follows new lines only while the reader is at the bottom;
  scrolling up pauses it and shows a "Jump to bottom" button.
- Set \`clickableLines\` when binding \`(lineClick)\` so rows are keyboard-operable.
        `,
      },
    },
  },
  argTypes: {
    variant: {
      control: 'select',
      options: ['log', 'terminal'],
    },
    height: { control: 'text' },
    autoScroll: { control: 'boolean' },
    showTimestamps: { control: 'boolean' },
    showLineNumbers: { control: 'boolean' },
    ansiColors: { control: 'boolean' },
    clickableLines: { control: 'boolean' },
  },
};

export default meta;
type Story = StoryObj<LogViewerComponent>;

function generateLogs(count: number): LogLine[] {
  const levels: LogLine['level'][] = ['debug', 'info', 'warn', 'error'];
  const sources = ['api', 'worker', 'scheduler', 'db'];
  const messages = [
    'Request received GET /api/users',
    'Processing batch job #4521',
    'Connection pool exhausted, waiting for release',
    'Failed to parse response: unexpected token',
    'Cache miss for key user:session:abc123',
    'Retrying operation (attempt 2/3)',
    'Health check passed',
    'Rate limit exceeded for client 10.0.0.5',
    'Transaction committed successfully',
    'Memory usage: 847MB / 2048MB (41.3%)',
  ];

  return Array.from({ length: count }, (_, i) => ({
    text: messages[i % messages.length],
    level: levels[i % levels.length],
    timestamp: new Date(Date.now() - (count - i) * 1000),
    source: sources[i % sources.length],
  }));
}

export const Default: Story = {
  args: {
    lines: generateLogs(50),
    variant: 'log',
    height: '400px',
    showTimestamps: true,
    showLineNumbers: false,
  },
};

export const Terminal: Story = {
  args: {
    lines: generateLogs(100),
    variant: 'terminal',
    height: '500px',
    showTimestamps: true,
    showLineNumbers: true,
  },
  parameters: {
    docs: { description: { story: 'Terminal variant with dark theme and line numbers.' } },
  },
};

export const WithAnsiColors: Story = {
  args: {
    lines: [
      { text: '\x1b[32m✓\x1b[0m All tests passed', level: 'info', timestamp: new Date() },
      { text: '\x1b[33m⚠\x1b[0m Deprecation warning: use \x1b[1mnewApi()\x1b[0m instead', level: 'warn', timestamp: new Date() },
      { text: '\x1b[31m✗\x1b[0m \x1b[1mERROR:\x1b[0m Connection refused to \x1b[36mdb:5432\x1b[0m', level: 'error', timestamp: new Date() },
      { text: '\x1b[90m[debug]\x1b[0m Loading config from \x1b[34m/etc/app/config.yml\x1b[0m', level: 'debug', timestamp: new Date() },
      { text: 'Build complete in \x1b[32m2.4s\x1b[0m — \x1b[35m47 modules\x1b[0m', level: 'info', timestamp: new Date() },
    ],
    variant: 'terminal',
    height: '200px',
    ansiColors: true,
  },
  parameters: {
    docs: { description: { story: 'ANSI color code parsing for terminal output.' } },
  },
};

export const ErrorsOnly: Story = {
  args: {
    lines: generateLogs(200),
    variant: 'log',
    height: '300px',
    levelFilter: ['error'],
  },
  parameters: {
    docs: { description: { story: 'Filtered to show only error-level lines.' } },
  },
};

/** Live stream: a new line every 400 ms; scroll up to pause following. */
export const Streaming: Story = {
  render: (args) => ({
    props: {
      ...args,
      stream$: interval(400).pipe(
        map((i): LogLine => ({
          text: `Tick ${i + 1}: ${['heartbeat ok', 'job processed', 'cache refreshed', 'queue drained'][i % 4]}`,
          level: i % 9 === 8 ? 'warn' : 'info',
          timestamp: new Date(),
          source: 'worker',
        })),
      ),
    },
    template: `
      <lc-log-viewer
        [stream$]="stream$"
        [variant]="variant"
        [height]="height"
        [showTimestamps]="showTimestamps"
        [showLineNumbers]="showLineNumbers"
        [autoScroll]="autoScroll"
        [maxLines]="maxLines"
      />
    `,
  }),
  args: {
    variant: 'terminal',
    height: '320px',
    showTimestamps: true,
    showLineNumbers: true,
    autoScroll: true,
    maxLines: 500,
  },
  parameters: {
    docs: { description: { story: 'Streaming mode with Pause/Resume and follow-mode auto-scroll.' } },
  },
};

/** `height="100%"` inside a fixed-height flex parent — the window fills it. */
export const FlexParent: Story = {
  render: (args) => ({
    props: { ...args, lines: generateLogs(500) },
    template: `
      <div style="display: flex; flex-direction: column; height: 60vh; gap: 8px;">
        <p style="margin: 0; font: 13px/1.4 var(--font-family-sans)">The viewer below uses <code>height="100%"</code> and grows with its flex parent.</p>
        <lc-log-viewer
          style="display: block; flex: 1; min-height: 0;"
          [lines]="lines"
          height="100%"
          [variant]="variant"
          [showLineNumbers]="true"
        />
      </div>
    `,
  }),
  args: { variant: 'log' },
  parameters: {
    docs: { description: { story: 'Percentage / flex heights render a full virtual window (measured, not parsed).' } },
  },
};

export const LargeBuffer: Story = {
  args: {
    lines: generateLogs(5000),
    variant: 'terminal',
    height: '500px',
    showLineNumbers: true,
    maxLines: 5000,
  },
  parameters: {
    docs: { description: { story: '5000 lines with virtualized rendering for smooth scrolling.' } },
  },
};

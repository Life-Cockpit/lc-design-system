import type { Meta, StoryObj } from '@storybook/angular';
import { moduleMetadata } from '@storybook/angular';
import { TimelineComponent } from './timeline.component';
import {
  TimelineContentDirective,
  TimelineMetaDirective,
} from './timeline-templates.directive';
import { CodeBlockComponent } from '../code-block/code-block.component';

const meta: Meta<TimelineComponent> = {
  title: 'Data Display/Timeline',
  component: TimelineComponent,
  decorators: [
    moduleMetadata({
      imports: [TimelineContentDirective, TimelineMetaDirective, CodeBlockComponent],
    }),
  ],
  parameters: {
    docs: {
      description: {
        component: `
Chronological event display for activity feeds, changelogs, and process tracking.

**Key Features:**
- Vertical and horizontal orientations
- Color-coded dots or icons per event
- Entry states (\`success | running | failed | pending\`) — marker colors from the
  semantic tokens; \`running\` pulses (respects \`prefers-reduced-motion\`)
- Composable header line: title + mono suffix (\`titleMono\`) + badge
  (\`badge\`/\`badgeVariant\`) + right-aligned meta (\`meta\`, or the \`lcTimelineMeta\`
  template for live values the app ticks itself)
- Free content per entry below the header via \`lcTimelineContent\`
  (code blocks, prose, collapsible text, diffs)
- Optional description and timestamp
- Compact mode for dense layouts
        `,
      },
    },
  },
  argTypes: {
    orientation: { control: 'select', options: ['vertical', 'horizontal'] },
    compact: { control: 'boolean' },
  },
};

export default meta;
type Story = StoryObj<TimelineComponent>;

const sampleItems = [
  { title: 'Projekt erstellt', description: 'Repository initialisiert und CI/CD eingerichtet.', timestamp: '1. Mai 2026', color: 'primary' as const },
  { title: 'Design System v1.0', description: '25 Komponenten released.', timestamp: '3. Mai 2026', color: 'success' as const, icon: 'check' },
  { title: 'Beta-Feedback', description: 'Nutzertests abgeschlossen, 12 Issues gemeldet.', timestamp: '4. Mai 2026', color: 'warning' as const, icon: 'exclamation-triangle' },
  { title: 'Hotfix deployed', timestamp: '5. Mai 2026', color: 'error' as const },
  { title: 'v1.1 Release', description: '5 neue Komponenten, alle Fixes integriert.', timestamp: '6. Mai 2026', color: 'success' as const, icon: 'rocket-launch' },
];

export const Default: Story = {
  args: { items: sampleItems, orientation: 'vertical', compact: false },
};

export const Compact: Story = {
  args: { items: sampleItems, orientation: 'vertical', compact: true },
};

export const Horizontal: Story = {
  args: {
    items: [
      { title: 'Step 1', description: 'Kickoff', color: 'success' as const },
      { title: 'Step 2', description: 'Development', color: 'success' as const },
      { title: 'Step 3', description: 'Testing', color: 'primary' as const },
      { title: 'Step 4', description: 'Release', color: 'neutral' as const },
    ],
    orientation: 'horizontal',
  },
};

export const MinimalItems: Story = {
  args: {
    items: [
      { title: 'Login', timestamp: '09:15' },
      { title: 'File uploaded', timestamp: '09:22' },
      { title: 'Logout', timestamp: '10:01' },
    ],
  },
};

export const EntryStates: Story = {
  name: 'Entry States',
  args: {
    items: [
      { title: 'Vorbereitung', state: 'success' as const, icon: 'check', meta: '1,2 s' },
      { title: 'Verarbeitung', state: 'success' as const, icon: 'check', meta: '8 s' },
      { title: 'Prüfung', state: 'running' as const, meta: 'läuft' },
      { title: 'Zusammenfassung', state: 'pending' as const },
      { title: 'Veröffentlichung', state: 'failed' as const, icon: 'x-mark', badge: 'Fehlgeschlagen', badgeVariant: 'error' as const },
    ],
  },
};

/**
 * Step transcript of an automated run: composable header line (title + mono
 * tool id + badge + right-aligned meta), a failed step with its command line
 * as free content, and a running step with a live meta slot.
 */
export const Transcript: Story = {
  render: () => ({
    props: {
      items: [
        {
          id: 'step-1',
          title: 'Abhängigkeiten installieren',
          titleMono: 'setup_env',
          state: 'success' as const,
          icon: 'check',
          meta: '14 s',
          description: 'Alle Pakete aus dem Lockfile aufgelöst.',
        },
        {
          id: 'step-2',
          title: 'Tests ausführen',
          titleMono: 'gate_test',
          state: 'failed' as const,
          icon: 'x-mark',
          badge: 'Fehlgeschlagen',
          badgeVariant: 'error' as const,
          meta: '41 s',
          description: '2 von 118 Tests schlagen fehl.',
          command: 'npm test -- --ci --runInBand',
        },
        {
          id: 'step-3',
          title: 'Bericht erstellen',
          titleMono: 'build_report',
          state: 'running' as const,
        },
        {
          id: 'step-4',
          title: 'Ergebnis veröffentlichen',
          titleMono: 'publish',
          state: 'pending' as const,
        },
      ],
    },
    template: `
      <lc-timeline [items]="items" [compact]="true">
        <ng-template lcTimelineMeta let-item>
          @if (item.state === 'running') {
            läuft seit 42 s
          } @else if (item.meta) {
            {{ item.meta }}
          }
        </ng-template>
        <ng-template lcTimelineContent let-item>
          @if (item.command) {
            <lc-code-block [code]="item.command" language="bash" [showLineNumbers]="false" />
          }
        </ng-template>
      </lc-timeline>
    `,
  }),
};

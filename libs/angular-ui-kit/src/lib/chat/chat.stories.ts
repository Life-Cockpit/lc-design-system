import type { Meta, StoryObj } from '@storybook/angular';
import { ChatComponent, ChatMessage } from './chat.component';
import { DiffViewerComponent } from '../diff-viewer/diff-viewer.component';
import { MarkdownComponent } from '../markdown/markdown.component';

const now = new Date();
const t = (min: number) => new Date(now.getTime() - min * 60000);

const conversationMessages: ChatMessage[] = [
  { id: '1', role: 'system', content: 'Chat begonnen', timestamp: t(10) },
  { id: '2', role: 'user', content: 'Hallo! Kannst du mir bei meinem Angular-Projekt helfen?', name: 'Eric', timestamp: t(9) },
  { id: '3', role: 'agent', content: 'Natürlich! Was genau brauchst du Hilfe bei?', name: 'AI Assistant', timestamp: t(8) },
  { id: '4', role: 'user', content: 'Ich brauche einen Calendar-Komponenten mit Day, Week und Month Views.', name: 'Eric', timestamp: t(7) },
  { id: '5', role: 'agent', content: 'Das kann ich erstellen! Ich werde einen CalendarComponent mit drei Views (Tag, Woche, Monat) bauen, inklusive Event-Handling und Navigation.\n\nSoll ich auch Drag & Drop für Events einbauen?', name: 'AI Assistant', timestamp: t(6) },
  { id: '6', role: 'user', content: 'Nein, erstmal ohne D&D. Danke!', name: 'Eric', timestamp: t(5) },
];

const streamingMessages: ChatMessage[] = [
  ...conversationMessages,
  { id: '7', role: 'agent', content: 'Ich erstelle jetzt den Calendar-Komponenten mit Signal-Inputs und OnPush Change Detection…', name: 'AI Assistant', timestamp: new Date(), streaming: true },
];

const multiUserMessages: ChatMessage[] = [
  { id: '1', role: 'user', content: 'Hey Team, das neue Design ist fertig!', name: 'Eric', timestamp: t(15) },
  { id: '2', role: 'agent', content: 'Sieht super aus! Ich habe die Components dafür generiert.', name: 'Copilot', timestamp: t(14) },
  { id: '3', role: 'system', content: 'Anna hat den Chat betreten', timestamp: t(13) },
  { id: '4', role: 'user', content: 'Perfekt, ich kümmere mich um die Tests.', name: 'Anna', timestamp: t(12) },
  { id: '5', role: 'agent', content: 'Die Test-Suite ist ready. 1472 Tests bestehen.', name: 'Copilot', timestamp: t(11) },
];

const statusMessages: ChatMessage[] = [
  { id: '1', role: 'user', content: 'Erstelle eine Spec für das Onboarding-Feature.', name: 'Eric', timestamp: t(6) },
  { id: '2', role: 'agent', content: 'Klar, ich lege die Spec an und fülle Ziel und Zielgruppe aus.', name: 'Spec Author', timestamp: t(5) },
  { id: '3', role: 'system', content: 'Modell gewechselt zu Opus 4.8', status: 'info', timestamp: t(4) },
  { id: '4', role: 'agent', content: 'Spec erstellt und gespeichert.', name: 'Spec Author', status: 'success', timestamp: t(3) },
  { id: '5', role: 'agent', content: 'Rate-Limit erreicht — neuer Versuch in 5 s …', name: 'Spec Author', status: 'warning', timestamp: t(2) },
  { id: '6', role: 'agent', content: 'Agent nicht erreichbar — die Verbindung ist fehlgeschlagen.', name: 'Spec Author', status: 'error', timestamp: t(1) },
];

const meta: Meta<ChatComponent> = {
  title: 'Components/Chat',
  component: ChatComponent,
  tags: ['autodocs'],

  parameters: {
    docs: {
      description: {
        component: `
Chat component for conversational user interfaces.

Compact, document-style layout: agent/system turns flow as full-width text on a
left timeline rail; user turns are right-aligned, accent-tinted bubbles (no name
label) with an optional avatar — an \`avatar\` image or an initials monogram from
\`name\`. Spacing is a single space-efficient scale (no roomy variant), tunable
via the \`--lc-chat-*\` custom properties.

**Key Features:**
- User, agent, and system message roles
- Right-aligned user bubbles with avatar / initials monogram (\`showAvatars\`)
- **Semantic status** per message (\`info\` / \`success\` / \`warning\` / \`error\`)
- Streaming cursor indicator for AI responses
- Typing indicator with animated dots
- Auto-scroll to latest message
- Optional avatars and timestamps
- Configurable header with title
- Send on Enter with Shift+Enter for newline
- **File upload** via \`allowFileUpload\` with \`accept\` / \`maxFileSize\`
  constraints, pending-attachment chips, and rendered attachments
  (image thumbnails / file links) inside messages

**Status:** Set \`status\` on a \`ChatMessage\` to \`info\`, \`success\`,
\`warning\` or \`error\` to flag it semantically — orthogonal to \`role\`
(role = *who* speaks, status = *what kind* of message). It colours the rail
icon with a semantic token, pairs it with an icon and a visually-hidden label,
and sets the matching ARIA (\`error\` → \`role="alert"\` / \`aria-live="assertive"\`,
others → polite). \`error\` never pulses. Omitting \`status\` (or \`'default'\`)
is identical to today's role-coloured output. See the *Semantic status* story.

**Attachments:** Set \`allowFileUpload="true"\` to show the paperclip button.
Selected files appear as chips above the textarea and are emitted on
\`messageSend\` as \`event.attachments\` (\`ChatAttachment[]\`).
Historical messages can also carry \`attachments\` for replay.
See the *With File Upload* story for a full example.
`,
      },
    },
  },
};
export default meta;
type Story = StoryObj<ChatComponent>;

export const Default: Story = {
  render: () => ({
    template: `
      <div style="height: 500px;">
        <lc-chat title="AI Chat" [messages]="messages"></lc-chat>
      </div>
    `,
    props: { messages: conversationMessages },
    moduleMetadata: { imports: [ChatComponent] },
  }),
};

// A tiny inline SVG avatar so the story stays self-contained (no network).
const sampleAvatar =
  'data:image/svg+xml;utf8,' +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48"><rect width="48" height="48" rx="24" fill="#208497"/><text x="24" y="31" font-family="sans-serif" font-size="20" fill="#fff" text-anchor="middle">A</text></svg>`,
  );

/**
 * User turns render as a right-aligned accent bubble. With `showAvatars` (on by
 * default), a user turn shows its `avatar` image on the outer right edge, or a
 * monogram built from `name` when no image is set. Agent turns keep the left
 * rail. Set `showAvatars=false` to drop avatars entirely.
 */
export const UserAvatar: Story = {
  name: 'User avatar & monogram',
  render: () => ({
    template: `
      <div style="height: 500px;">
        <lc-chat title="Spec Author" [messages]="messages"></lc-chat>
      </div>
    `,
    props: {
      messages: [
        { id: '1', role: 'user', content: 'Nachricht mit Avatar-Bild.', name: 'Anna', avatar: sampleAvatar, timestamp: t(5) },
        { id: '2', role: 'agent', content: 'Alles klar, ich übernehme das.', name: 'Spec Author', timestamp: t(4) },
        { id: '3', role: 'user', content: 'Diese hier fällt auf ein Monogramm zurück (kein Bild).', name: 'Eric Fritzsche', timestamp: t(3) },
      ] as ChatMessage[],
    },
    moduleMetadata: { imports: [ChatComponent] },
  }),
};

export const Streaming: Story = {
  render: () => ({
    template: `
      <div style="height: 500px;">
        <lc-chat title="AI Chat" [messages]="messages" [isStreaming]="true"></lc-chat>
      </div>
    `,
    props: { messages: streamingMessages },
    moduleMetadata: { imports: [ChatComponent] },
  }),
};

export const TypingIndicator: Story = {
  render: () => ({
    template: `
      <div style="height: 500px;">
        <lc-chat title="AI Chat" [messages]="messages" [isStreaming]="true"></lc-chat>
      </div>
    `,
    props: { messages: conversationMessages },
    moduleMetadata: { imports: [ChatComponent] },
  }),
};

export const Empty: Story = {
  render: () => ({
    template: `
      <div style="height: 500px;">
        <lc-chat title="Neuer Chat" [messages]="[]" placeholder="Stelle eine Frage…"></lc-chat>
      </div>
    `,
    moduleMetadata: { imports: [ChatComponent] },
  }),
};

export const MultiUser: Story = {
  render: () => ({
    template: `
      <div style="height: 500px;">
        <lc-chat title="Team Chat" [messages]="messages"></lc-chat>
      </div>
    `,
    props: { messages: multiUserMessages },
    moduleMetadata: { imports: [ChatComponent] },
  }),
};

/**
 * `status` marks a message as `info | success | warning | error`, orthogonal to
 * `role`. It colours the rail icon with a semantic token, pairs it with an icon
 * and a visually-hidden label, and sets the right ARIA (`error` → `role="alert"`
 * / `aria-live="assertive"`, others → polite). `error` never pulses. Omitting
 * `status` is identical to the default role-coloured behaviour.
 */
export const MessageStatus: Story = {
  name: 'Semantic status',
  render: () => ({
    template: `
      <div style="height: 500px;">
        <lc-chat title="Spec Author" [messages]="messages"></lc-chat>
      </div>
    `,
    props: { messages: statusMessages },
    moduleMetadata: { imports: [ChatComponent] },
  }),
  parameters: {
    docs: {
      description: {
        story: 'Setze `status` auf einer `ChatMessage` (`info`, `success`, `warning`, `error`), um den Rail-Punkt semantisch einzufärben — z. B. für „Agent nicht erreichbar" (`error`) oder „Spec erstellt" (`success`). Unabhängig von `role`, voll abwärtskompatibel.',
      },
    },
  },
};

export const NoHeader: Story = {
  render: () => ({
    template: `
      <div style="height: 500px;">
        <lc-chat [showHeader]="false" [messages]="messages"></lc-chat>
      </div>
    `,
    props: { messages: conversationMessages.slice(1) },
    moduleMetadata: { imports: [ChatComponent] },
  }),
};

/**
 * `messageAnchor="bottom"` keeps a short conversation pinned to the bottom of
 * the message area (empty space above), like most messaging apps. Once messages
 * overflow the height it scrolls normally and the top stays reachable.
 */
export const BottomAnchored: Story = {
  name: 'Bottom-anchored',
  render: () => ({
    template: `
      <div style="height: 500px;">
        <lc-chat [showHeader]="false" messageAnchor="bottom" [messages]="messages"></lc-chat>
      </div>
    `,
    props: { messages: conversationMessages.slice(1, 4) },
    moduleMetadata: { imports: [ChatComponent] },
  }),
};

/**
 * `bordered=false` drops the card border + rounded corners so the chat fills its
 * container flush — e.g. as the full-height body of an `<lc-page-layout>` sitting
 * directly under a page header. See **Layout/PageLayout → Chat (full height)**.
 */
export const Borderless: Story = {
  name: 'Borderless (flush)',
  render: () => ({
    template: `
      <div style="height: 500px; border: 1px dashed var(--color-border); border-radius: 8px; overflow: hidden;">
        <lc-chat [showHeader]="false" [bordered]="false" [messages]="messages"></lc-chat>
      </div>
    `,
    props: { messages: conversationMessages.slice(1) },
    moduleMetadata: { imports: [ChatComponent] },
  }),
};

/**
 * By default the thread and composer span the full available width.
 * `contentWidth="narrow"` constrains them to a centered reading column (~46rem)
 * for a document-style chat.
 */
export const ReadingColumn: Story = {
  name: 'Narrow reading column',
  render: () => ({
    template: `
      <div style="height: 500px;">
        <lc-chat title="AI Chat" contentWidth="narrow" [messages]="messages"></lc-chat>
      </div>
    `,
    props: { messages: conversationMessages },
    moduleMetadata: { imports: [ChatComponent] },
  }),
};

// --- File upload ---

const fileUploadMessages: ChatMessage[] = [
  { id: '1', role: 'user', content: 'Hier ist das aktuelle Logo:', name: 'Eric', timestamp: t(5),
    attachments: [
      { id: 'a1', name: 'logo.png', type: 'image/png', size: 24_128,
        url: 'https://images.unsplash.com/photo-1611162617213-7d7a39e9b1d7?w=300&h=200&fit=crop' },
    ],
  },
  { id: '2', role: 'agent', content: 'Sieht gut aus! Anbei das Briefing als PDF.', name: 'AI Assistant', timestamp: t(4),
    attachments: [
      { id: 'a2', name: 'briefing.pdf', type: 'application/pdf', size: 184_322 },
      { id: 'a3', name: 'styleguide.docx', type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', size: 56_120 },
    ],
  },
];

export const WithFileUpload: Story = {
  name: 'With File Upload',
  render: () => ({
    template: `
      <div style="height: 600px;">
        <lc-chat
          title="AI Chat"
          [messages]="messages"
          [allowFileUpload]="true"
          accept="image/*,.pdf,.docx,.txt"
          [maxFileSize]="5 * 1024 * 1024"
          (messageSend)="onSend($event)"
          (fileAttach)="onAttach($event)"
        ></lc-chat>
      </div>
    `,
    props: {
      messages: fileUploadMessages,
      onSend: (e: unknown) => console.log('send', e),
      onAttach: (e: unknown) => console.log('attach', e),
    },
    moduleMetadata: { imports: [ChatComponent] },
  }),
  parameters: {
    docs: {
      description: {
        story: 'Aktiviert den Datei-Upload-Button im Input-Bereich. Nutze `allowFileUpload`, `accept` und `maxFileSize`, um Dateitypen und -größen einzuschränken. Angehängte Dateien werden als Chips angezeigt und beim Senden via `messageSend` mitgegeben (`attachments`).',
      },
    },
  },
};

// --- Rich content stories ---

const specOld = `## Ziel\n\n_TBD_\n\n## Zielgruppe\n\n_TBD_`;
const specNew = `## Ziel\n\nEine Plattform für automatisiertes Onboarding neuer Mitarbeiter.\n\n## Zielgruppe\n\nHR-Teams in mittelständischen B2B-SaaS-Unternehmen.`;

const diffMessages: ChatMessage[] = [
  { id: '1', role: 'system', content: 'Spec-Authoring gestartet', timestamp: t(5) },
  { id: '2', role: 'user', content: 'Wir bauen eine Plattform für automatisiertes Onboarding. Zielgruppe sind HR-Teams in mittelständischen B2B-SaaS-Firmen.', name: 'Eric', timestamp: t(4) },
  {
    id: '3', role: 'agent',
    content: 'Ich habe Ziel und Zielgruppe im Template ausgefüllt:',
    name: 'Spec Author',
    timestamp: t(3),
    data: {
      diff: true,
      oldText: specOld,
      newText: specNew,
    },
  },
  { id: '4', role: 'user', content: 'Passt! Kannst du noch die Akzeptanzkriterien ergänzen?', name: 'Eric', timestamp: t(2) },
  {
    id: '5', role: 'agent',
    content: 'Akzeptanzkriterien hinzugefügt:',
    name: 'Spec Author',
    timestamp: t(1),
    data: {
      diff: true,
      oldText: specNew,
      newText: specNew + `\n\n## Akzeptanzkriterien\n\n- [ ] Neuer Mitarbeiter kann Onboarding-Prozess starten\n- [ ] HR-Manager sieht Fortschritt in Echtzeit\n- [ ] E-Mail-Benachrichtigungen bei abgeschlossenen Schritten`,
    },
  },
];

const markdownMessages: ChatMessage[] = [
  { id: '1', role: 'user', content: 'Zeig mir eine Zusammenfassung des API-Designs.', name: 'Eric', timestamp: t(3) },
  {
    id: '2', role: 'agent',
    content: '',
    name: 'AI Assistant',
    timestamp: t(2),
    data: {
      markdown: true,
      markdownContent: `### API Endpoints\n\n| Method | Path | Beschreibung |\n|--------|------|-------------|\n| \`GET\` | \`/api/users\` | Alle Benutzer |\n| \`POST\` | \`/api/users\` | Benutzer erstellen |\n| \`DELETE\` | \`/api/users/:id\` | Benutzer löschen |\n\n> **Hinweis:** Alle Endpoints erfordern einen gültigen JWT-Token.\n\n- Rate Limit: **100 req/min**\n- Response-Format: \`application/json\``,
    },
  },
  { id: '3', role: 'user', content: 'Danke, kannst du den DELETE-Endpoint auf soft-delete umstellen?', name: 'Eric', timestamp: t(1) },
];

export const WithDiffViewer: Story = {
  name: 'With Diff Viewer',
  render: () => ({
    template: `
      <div style="height: 600px;">
        <lc-chat title="Spec Author" [messages]="messages">
          <ng-template #messageTemplate let-msg>
            {{ msg.content }}
            @if (msg.data?.diff) {
              <div style="margin-top: 8px;">
                <lc-diff-viewer
                  [oldText]="msg.data.oldText"
                  [newText]="msg.data.newText"
                  mode="inline"
                  [showLineNumbers]="false"
                  [contextLines]="3"
                />
              </div>
            }
          </ng-template>
        </lc-chat>
      </div>
    `,
    props: { messages: diffMessages },
    moduleMetadata: { imports: [ChatComponent, DiffViewerComponent] },
  }),
  parameters: {
    docs: {
      description: {
        story: 'Agent-Nachrichten können einen eingebetteten Diff-Viewer enthalten, um Änderungen am Dokument direkt im Chat sichtbar zu machen. Nutze `data.diff`, `data.oldText` und `data.newText` auf der ChatMessage zusammen mit einem custom `#messageTemplate`.',
      },
    },
  },
};

export const WithMarkdown: Story = {
  name: 'With Markdown',
  render: () => ({
    template: `
      <div style="height: 600px;">
        <lc-chat title="AI Assistant" [messages]="messages">
          <ng-template #messageTemplate let-msg>
            @if (msg.data?.markdown) {
              <lc-markdown [content]="msg.data.markdownContent" variant="compact" />
            } @else {
              {{ msg.content }}
            }
          </ng-template>
        </lc-chat>
      </div>
    `,
    props: { messages: markdownMessages },
    moduleMetadata: { imports: [ChatComponent, MarkdownComponent] },
  }),
  parameters: {
    docs: {
      description: {
        story: 'Agent-Nachrichten können Markdown rendern — Tabellen, Listen, Codeblöcke und mehr. Nutze `data.markdown` und `data.markdownContent` zusammen mit `#messageTemplate`.',
      },
    },
  },
};

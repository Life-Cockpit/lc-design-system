import {
  ChangeDetectionStrategy,
  Component,
  input,
  output,
  signal,
  computed,
  ElementRef,
  ViewChild,
  AfterViewChecked,
  TemplateRef,
  ContentChild,
} from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
import { MarkdownComponent } from '../markdown/markdown.component';
import { IconComponent } from '../icon/icon.component';

export type ChatMessageRole = 'user' | 'agent' | 'system';

/**
 * Semantic status of a chat message — orthogonal to `role` (role = *who*
 * speaks; status = *what kind* of message). Reuses the semantic vocabulary of
 * `lc-alert` / `lc-callout` and drives the rail dot/accent colour + a status
 * icon. `'default'` (or omitted) reproduces the role-coloured behaviour exactly.
 */
export type ChatMessageStatus = 'default' | 'info' | 'success' | 'warning' | 'error';

/**
 * Controls which messages are rendered as Markdown via `<lc-markdown>`.
 * - `false` (default): plain text rendering (legacy behavior)
 * - `true` / `'all'`: render every role as Markdown
 * - `'agent'`: only agent messages are rendered as Markdown (recommended)
 */
export type ChatRenderMarkdown = boolean | 'agent' | 'all';

/**
 * Represents a file attached to a chat message or pending in the input.
 *
 * The `file` reference is only available for attachments produced by the
 * input (i.e. emitted via `messageSend` / `fileAttach`). Attachments
 * coming from the server or message history typically rely on `url` only.
 */
export interface ChatAttachment {
  id: string;
  name: string;
  /** MIME type, e.g. `image/png`, `application/pdf`. */
  type?: string;
  /** Size in bytes. */
  size?: number;
  /** Object URL or remote URL to preview / download the file. */
  url?: string;
  /** Raw browser File reference (set for newly uploaded files). */
  file?: File;
}

export interface ChatMessage {
  id: string;
  role: ChatMessageRole;
  content: string;
  timestamp?: Date | string;
  avatar?: string;
  name?: string;
  streaming?: boolean;
  /**
   * Semantic status — colours the rail dot/accent and shows a status icon.
   * Independent of `role`: a `role: 'agent'` message can be `status: 'error'`
   * (failed reply) or `status: 'success'` (tool finished). Defaults to
   * `'default'`, which reproduces today's role-coloured behaviour exactly.
   * An `'error'` message never pulses and is announced assertively (`role="alert"`).
   */
  status?: ChatMessageStatus;
  /** Optional file attachments associated with the message. */
  attachments?: ChatAttachment[];
  /** Arbitrary data passed to a custom messageTemplate. */
  data?: Record<string, unknown>;
}

export interface ChatSendEvent {
  content: string;
  /** Files attached to the outgoing message, if any. */
  attachments?: ChatAttachment[];
}

export interface ChatFileAttachEvent {
  attachments: ChatAttachment[];
  /** Files rejected because of `accept` / `maxFileSize` constraints. */
  rejected: { file: File; reason: 'type' | 'size' }[];
}

@Component({
  selector: 'lc-chat',
  standalone: true,
  imports: [NgTemplateOutlet, MarkdownComponent, IconComponent],
  templateUrl: './chat.component.html',
  styleUrls: ['./chat.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
/**
 * Chat component for conversational user interfaces.
 *
 * Compact, document-style layout: agent/system turns flow as full-width text on
 * a left timeline rail, while user turns render as right-aligned, accent-tinted
 * bubbles (no name label) with the timestamp on a muted line beneath. Spacing is
 * a single space-efficient scale (tunable via the `--lc-chat-*` custom
 * properties); there is no separate roomy variant.
 *
 * Features:
 * - User, agent, and system message roles
 * - Right-aligned user bubbles with an optional avatar: `msg.avatar` image, or a
 *   monogram built from `msg.name` initials (gated by `showAvatars`)
 * - Agent/system turns on a left rail with a status dot, avatar or semantic icon
 * - Streaming cursor indicator for AI responses
 * - Typing indicator with animated dots
 * - Auto-scroll to latest message
 * - Optional avatars and timestamps
 * - Configurable header with title
 * - Send on Enter with Shift+Enter for newline
 * - Optional file upload (`allowFileUpload`) with `accept`/`maxFileSize`
 *   constraints, preview chips, and image/file thumbnails inside messages.
 *
 * @example Basic
 * ```html
 * <lc-chat [messages]="messages" title="Support" (messageSend)="onSend($event)" />
 * ```
 *
 * @example With file upload
 * ```html
 * <lc-chat
 *   [messages]="messages"
 *   [allowFileUpload]="true"
 *   accept="image/*,.pdf"
 *   [maxFileSize]="5 * 1024 * 1024"
 *   (messageSend)="onSend($event)"
 *   (fileAttach)="onAttach($event)" />
 * ```
 */
export class ChatComponent implements AfterViewChecked {
  /** Messages to display. */
  messages = input<ChatMessage[]>([]);

  /** Placeholder text for the input. */
  placeholder = input<string>('Nachricht eingeben…');

  /** Title displayed in the header. */
  title = input<string>('Chat');

  /** Whether the agent is currently streaming / typing. */
  isStreaming = input<boolean>(false);

  /** Show the header bar. */
  showHeader = input<boolean>(true);

  /**
   * Draw the chat's own border + rounded corners. Defaults to `true` (card
   * style). Set `false` to render flush/edge-to-edge — e.g. when the chat is
   * the full-height body of an `<lc-page-layout>` and should sit directly under
   * a page header without a nested box.
   */
  bordered = input<boolean>(true);

  /**
   * Where messages stack when they don't fill the height.
   * - `'top'` (default): messages grow from the top down.
   * - `'bottom'`: messages anchor to the bottom (empty space above), like most
   *   messaging apps. Still scrolls to reveal the top once they overflow.
   */
  messageAnchor = input<'top' | 'bottom'>('top');

  /**
   * Width of the message thread and composer.
   * - `'full'` (default): messages span the full available width.
   * - `'narrow'`: a centered, readable column (~46rem) like a document-style chat.
   */
  contentWidth = input<'narrow' | 'full'>('full');

  /** Disable the input. */
  disabled = input<boolean>(false);

  /** Show avatars next to messages. */
  showAvatars = input<boolean>(true);

  /** Show timestamps. */
  showTimestamps = input<boolean>(true);

  /**
   * Render message content as Markdown using `<lc-markdown variant="chat">`.
   * Defaults to `'agent'` so agent replies get rich formatting while user
   * input stays as plain text. Pass `false` to opt out, or `true`/`'all'`
   * to render every role as Markdown.
   */
  renderMarkdown = input<ChatRenderMarkdown>('agent');

  /** Enable the file-upload (paperclip) button in the input area. */
  allowFileUpload = input<boolean>(false);

  /**
   * Comma-separated list of accepted file types, forwarded to the native
   * `<input accept>` attribute. Examples: `image/*`, `.pdf,.docx`.
   */
  accept = input<string>('');

  /** Allow selecting multiple files at once. Defaults to `true`. */
  multiple = input<boolean>(true);

  /** Maximum file size in bytes. `0` disables the check. */
  maxFileSize = input<number>(0);

  /** Emits when user sends a message. */
  messageSend = output<ChatSendEvent>();

  /** Emits whenever files are added to the pending attachments list. */
  fileAttach = output<ChatFileAttachEvent>();

  /** Custom template for rendering message content. Context: { $implicit: ChatMessage } */
  @ContentChild('messageTemplate') messageTemplate?: TemplateRef<{ $implicit: ChatMessage }>;

  protected readonly inputValue = signal('');
  protected readonly pendingAttachments = signal<ChatAttachment[]>([]);
  private shouldScroll = false;
  private attachmentCounter = 0;

  @ViewChild('scrollContainer') private scrollContainer!: ElementRef<HTMLDivElement>;
  @ViewChild('fileInput') private fileInput?: ElementRef<HTMLInputElement>;
  @ViewChild('composerInput') private composerInput?: ElementRef<HTMLTextAreaElement>;

  /** Upper bound for the auto-growing composer before it starts scrolling (px). */
  private static readonly INPUT_MAX_HEIGHT = 192;

  protected readonly formattedMessages = computed(() =>
    this.messages().map(m => ({
      ...m,
      timestamp: m.timestamp instanceof Date ? m.timestamp : m.timestamp ? new Date(m.timestamp) : undefined,
    }))
  );

  ngAfterViewChecked(): void {
    if (this.shouldScroll) {
      this.scrollToBottom();
      this.shouldScroll = false;
    }
  }

  protected onInput(event: Event): void {
    const el = event.target as HTMLTextAreaElement;
    this.inputValue.set(el.value);
    this.autoGrow(el);
  }

  /** Resize the textarea to fit its content so the composer hugs the text. */
  private autoGrow(el: HTMLTextAreaElement): void {
    el.style.height = 'auto';
    el.style.height = `${Math.min(el.scrollHeight, ChatComponent.INPUT_MAX_HEIGHT)}px`;
  }

  protected onKeydown(event: KeyboardEvent): void {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      this.send();
    }
  }

  protected send(): void {
    const content = this.inputValue().trim();
    const attachments = this.pendingAttachments();
    if ((!content && attachments.length === 0) || this.disabled()) return;
    this.messageSend.emit({
      content,
      attachments: attachments.length ? attachments : undefined,
    });
    this.inputValue.set('');
    this.pendingAttachments.set([]);
    this.shouldScroll = true;
    // Collapse the auto-grown textarea back to a single row.
    const el = this.composerInput?.nativeElement;
    if (el) el.style.height = 'auto';
  }

  protected openFilePicker(): void {
    if (this.disabled() || !this.allowFileUpload()) return;
    this.fileInput?.nativeElement.click();
  }

  protected onFilesSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) return;
    this.addFiles(Array.from(input.files));
    // Reset so the same file can be re-selected later.
    input.value = '';
  }

  protected removeAttachment(id: string): void {
    this.pendingAttachments.update(list => {
      const removed = list.find(a => a.id === id);
      if (removed?.url && removed.file) {
        URL.revokeObjectURL(removed.url);
      }
      return list.filter(a => a.id !== id);
    });
  }

  protected formatBytes(size: number | undefined): string {
    if (!size && size !== 0) return '';
    if (size < 1024) return `${size} B`;
    if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
    return `${(size / (1024 * 1024)).toFixed(1)} MB`;
  }

  protected isImage(att: ChatAttachment): boolean {
    return !!att.type?.startsWith('image/');
  }

  private addFiles(files: File[]): void {
    const max = this.maxFileSize();
    const acceptList = this.accept()
      .split(',')
      .map(s => s.trim())
      .filter(Boolean);

    const accepted: ChatAttachment[] = [];
    const rejected: { file: File; reason: 'type' | 'size' }[] = [];

    for (const file of files) {
      if (max > 0 && file.size > max) {
        rejected.push({ file, reason: 'size' });
        continue;
      }
      if (acceptList.length > 0 && !this.matchesAccept(file, acceptList)) {
        rejected.push({ file, reason: 'type' });
        continue;
      }
      accepted.push({
        id: `att-${Date.now()}-${this.attachmentCounter++}`,
        name: file.name,
        type: file.type,
        size: file.size,
        url: URL.createObjectURL(file),
        file,
      });
    }

    if (accepted.length) {
      this.pendingAttachments.update(list => [...list, ...accepted]);
    }
    if (accepted.length || rejected.length) {
      this.fileAttach.emit({ attachments: accepted, rejected });
    }
  }

  private matchesAccept(file: File, acceptList: string[]): boolean {
    const name = file.name.toLowerCase();
    const type = file.type.toLowerCase();
    return acceptList.some(rule => {
      const r = rule.toLowerCase();
      if (r.startsWith('.')) return name.endsWith(r);
      if (r.endsWith('/*')) return type.startsWith(r.slice(0, -1));
      return type === r;
    });
  }

  protected formatTime(date: Date | undefined): string {
    if (!date) return '';
    return date.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' });
  }

  /**
   * Up to two uppercase initials from a name (first + last word), used for the
   * user avatar monogram when no `avatar` image is provided. Returns `''` for an
   * empty/whitespace name so the caller can skip rendering.
   */
  protected initials(name: string | undefined): string {
    if (!name) return '';
    const parts = name.trim().split(/\s+/).filter(Boolean);
    if (parts.length === 0) return '';
    const first = parts[0][0] ?? '';
    const last = parts.length > 1 ? parts[parts.length - 1][0] ?? '' : '';
    return (first + last).toUpperCase();
  }

  /**
   * Whether to show an avatar on a user turn: only when avatars are enabled and
   * the message carries either an image or a name we can build a monogram from.
   * Keeps the labelless bubble clean when there's nothing to show.
   */
  protected showUserAvatar(msg: ChatMessage): boolean {
    return (
      msg.role === 'user' &&
      this.showAvatars() &&
      !!(msg.avatar || this.initials(msg.name))
    );
  }

  protected shouldRenderMarkdown(role: ChatMessageRole): boolean {
    const mode = this.renderMarkdown();
    if (mode === false) return false;
    if (mode === true || mode === 'all') return true;
    return role === mode;
  }

  /** Whether a message carries a semantic (non-`default`) status. */
  protected isSemanticStatus(status: ChatMessageStatus | undefined): boolean {
    return !!status && status !== 'default';
  }

  /** Rail icon for a semantic status — reuses the `lc-alert` icon names. */
  protected statusIcon(status: ChatMessageStatus | undefined): string {
    switch (status) {
      case 'info':
        return 'information-circle';
      case 'success':
        return 'check-circle';
      case 'warning':
        return 'exclamation-triangle';
      case 'error':
        return 'x-circle';
      default:
        return '';
    }
  }

  /** Semantic token colour for a status dot/icon. */
  protected statusColor(status: ChatMessageStatus | undefined): string {
    switch (status) {
      case 'info':
        return 'var(--color-info-500)';
      case 'success':
        return 'var(--color-success-500)';
      case 'warning':
        return 'var(--color-warning-500)';
      case 'error':
        return 'var(--color-error-500)';
      default:
        return 'currentColor';
    }
  }

  /** Visually-hidden prefix so colour/icon is never the only signal. */
  protected statusLabel(status: ChatMessageStatus | undefined): string {
    switch (status) {
      case 'info':
        return 'Info:';
      case 'success':
        return 'Erfolg:';
      case 'warning':
        return 'Warnung:';
      case 'error':
        return 'Fehler:';
      default:
        return '';
    }
  }

  /** ARIA live priority: assertive for `error`, polite for other statuses. */
  protected statusAriaLive(status: ChatMessageStatus | undefined): 'assertive' | 'polite' | null {
    if (status === 'error') return 'assertive';
    if (this.isSemanticStatus(status)) return 'polite';
    return null;
  }

  private scrollToBottom(): void {
    if (this.scrollContainer) {
      const el = this.scrollContainer.nativeElement;
      el.scrollTop = el.scrollHeight;
    }
  }
}

import {
  Component,
  ChangeDetectionStrategy,
  DestroyRef,
  ElementRef,
  Injector,
  NgZone,
  ViewEncapsulation,
  afterNextRender,
  computed,
  effect,
  inject,
  input,
  output,
  signal,
  untracked,
  viewChild,
} from '@angular/core';
import { Observable, Subscription } from 'rxjs';
import { IconComponent } from '../icon/icon.component';

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';
export type LogViewerVariant = 'terminal' | 'log';

export interface LogLine {
  text: string;
  level?: LogLevel;
  timestamp?: Date;
  source?: string;
  meta?: Record<string, unknown>;
}

/** SGR code → CSS class for the ANSI subset the viewer renders. */
const ANSI_CLASSES: Record<string, string> = {
  '1': 'ansi-bold',
  '3': 'ansi-italic',
  '30': 'ansi-black',
  '31': 'ansi-red',
  '32': 'ansi-green',
  '33': 'ansi-yellow',
  '34': 'ansi-blue',
  '35': 'ansi-magenta',
  '36': 'ansi-cyan',
  '37': 'ansi-white',
  '90': 'ansi-gray',
  '91': 'ansi-bright-red',
  '92': 'ansi-bright-green',
  '93': 'ansi-bright-yellow',
  '94': 'ansi-bright-blue',
  '95': 'ansi-bright-magenta',
  '96': 'ansi-bright-cyan',
  '97': 'ansi-bright-white',
};

/** Row height fallback when `--lc-log-viewer-line-height` can't be read (SSR, tests). */
const DEFAULT_LINE_HEIGHT = 22;

/** Distance from the bottom (px) still counted as "at the bottom". */
const AT_BOTTOM_THRESHOLD = 30;

/**
 * Streaming log / terminal viewer component.
 *
 * Supports controlled (lines input) and streaming (stream$ observable) modes,
 * virtualized rendering for large buffers, ANSI color parsing, auto-scroll,
 * and filtering.
 *
 * The virtual window is sized from the *measured* height of the scroll area
 * (ResizeObserver), so any `height` — `400px`, `50vh`, `100%` inside a flex
 * parent — renders a full window. Row height comes from the CSS custom
 * property `--lc-log-viewer-line-height` (default 22px), read once after the
 * first render; override it on the host to change the row density.
 *
 * @example
 * ```html
 * <lc-log-viewer [stream$]="logs$" autoScroll height="600px" variant="terminal" />
 * ```
 */
@Component({
  selector: 'lc-log-viewer',
  standalone: true,
  imports: [IconComponent],
  templateUrl: './log-viewer.component.html',
  styleUrls: ['./log-viewer.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
})
export class LogViewerComponent {
  private static nextId = 0;
  /** Id of the search input (links its visually-hidden label). */
  protected readonly searchInputId = `lc-log-viewer-search-${++LogViewerComponent.nextId}`;

  private readonly ngZone = inject(NgZone);
  private readonly injector = inject(Injector);
  private readonly destroyRef = inject(DestroyRef);
  private readonly scrollContainer = viewChild.required<ElementRef<HTMLElement>>('scrollContainer');
  private readonly searchInput = viewChild<ElementRef<HTMLInputElement>>('searchInput');
  private streamSub?: Subscription;

  /** Controlled mode: array of log lines */
  readonly lines = input<LogLine[]>([]);

  /** Streaming mode: observable of log lines */
  readonly stream$ = input<Observable<LogLine | LogLine[]>>();

  /** Maximum lines to keep in buffer */
  readonly maxLines = input<number>(10_000);

  /**
   * Follow new lines: scroll to the bottom whenever the visible line count
   * changes — but only while the reader is already at the bottom, so scrolling
   * up to inspect older output is never fought.
   */
  readonly autoScroll = input<boolean>(true);

  /** Show timestamps column */
  readonly showTimestamps = input<boolean>(true);

  /** Show line numbers */
  readonly showLineNumbers = input<boolean>(false);

  /** Parse ANSI color codes */
  readonly ansiColors = input<boolean>(true);

  /** Filter by log levels */
  readonly levelFilter = input<LogLevel[]>();

  /** Search query to highlight */
  readonly searchQuery = input<string>();

  /** Container height */
  readonly height = input<string>('400px');

  /** Visual variant */
  readonly variant = input<LogViewerVariant>('log');

  /**
   * Render lines as interactive rows (`role="button"`, focusable, Enter/Space
   * emit `lineClick`). Set this whenever you bind `(lineClick)` so keyboard
   * users can activate a line too; a plain click emits either way.
   */
  readonly clickableLines = input<boolean>(false);

  /** Emitted when a line is clicked (or activated with Enter/Space) */
  readonly lineClick = output<LogLine>();

  /**
   * Emitted with the copied text after "Copy all" — also when the Clipboard
   * API is unavailable (insecure context, denied permission), so consumers can
   * offer their own fallback.
   */
  readonly copyAll = output<string>();

  /** Emitted when scroll state changes */
  readonly scrollStateChange = output<{ atBottom: boolean }>();

  /** Internal buffer of all lines */
  protected buffer = signal<LogLine[]>([]);

  /** Whether stream is paused */
  protected paused = signal(false);

  /** Whether user is at bottom of scroll */
  protected atBottom = signal(true);

  /** Internal search input */
  protected internalSearch = signal('');

  /** Internal level filter */
  protected internalLevelFilter = signal<Set<LogLevel>>(new Set());

  /** Show search bar */
  protected showSearch = signal(false);

  /** Effective search query */
  protected effectiveSearch = computed(() => {
    return this.searchQuery() || this.internalSearch();
  });

  /** Filtered lines for display */
  protected filteredLines = computed(() => {
    let lines = this.buffer();
    const levels = this.levelFilter();
    const internalFilter = this.internalLevelFilter();

    // Apply level filter
    if (levels?.length) {
      lines = lines.filter((l) => l.level && levels.includes(l.level));
    } else if (internalFilter.size > 0) {
      lines = lines.filter((l) => l.level && internalFilter.has(l.level));
    }

    return lines;
  });

  // ── Virtual window ────────────────────────────────────────────────────

  protected scrollTop = signal(0);

  /**
   * Measured `clientHeight` of the scroll area (excludes toolbar and search
   * bar by construction). 0 until the first ResizeObserver callback.
   */
  private readonly viewportHeight = signal(0);

  /** Row height in px — `--lc-log-viewer-line-height`, read once after render. */
  protected readonly lineHeight = signal(DEFAULT_LINE_HEIGHT);

  protected visibleRange = computed(() => {
    const lineHeight = this.lineHeight();
    const measured = this.viewportHeight();
    // Before the first measurement fall back to the declared height (minus a
    // nominal toolbar) so the first frame already shows a plausible window.
    const viewHeight = measured > 0 ? measured : (parseInt(this.height(), 10) || 400) - 40;
    const total = this.filteredLines().length;
    const start = Math.floor(this.scrollTop() / lineHeight);
    const visible = Math.ceil(viewHeight / lineHeight) + 2;
    return {
      start: Math.max(0, start - 1),
      end: Math.min(total, start + visible + 1),
      total,
      totalHeight: total * lineHeight,
    };
  });

  protected visibleLines = computed(() => {
    const range = this.visibleRange();
    return this.filteredLines().slice(range.start, range.end).map((line, i) => ({
      ...line,
      _index: range.start + i,
    }));
  });

  protected containerClasses = computed(() => {
    return `lc-log-viewer lc-log-viewer--${this.variant()}`;
  });

  /** Line counts per level for toolbar */
  protected levelCounts = computed(() => {
    const buf = this.buffer();
    const counts = { debug: 0, info: 0, warn: 0, error: 0 };
    for (const line of buf) {
      if (line.level && line.level in counts) counts[line.level as keyof typeof counts]++;
    }
    return counts;
  });

  constructor() {
    // Controlled mode: mirror `lines` into the buffer — unconditionally, so
    // `[lines]="[]"` clears the view. `maxLines` is read untracked: changing
    // it must not wipe a streamed buffer through this effect.
    effect(() => {
      const input = this.lines();
      untracked(() => this.buffer.set(this.trim(input, this.maxLines())));
    });

    // Streaming mode. The subscribe body runs untracked: BehaviorSubject /
    // ReplaySubject / of() emit synchronously inside this effect, and reading
    // `paused()` / `maxLines()` there would make them dependencies — toggling
    // Pause would then re-subscribe and replay duplicates.
    effect(() => {
      const stream = this.stream$();
      this.streamSub?.unsubscribe();
      this.streamSub = undefined;
      if (!stream) return;
      untracked(() => {
        this.streamSub = stream.subscribe((data) => this.append(Array.isArray(data) ? data : [data]));
      });
    });
    this.destroyRef.onDestroy(() => this.streamSub?.unsubscribe());

    // Follow mode: whenever the visible lines change (new lines, filter),
    // stick to the bottom — but only if the reader is already there.
    effect(() => {
      this.filteredLines();
      if (!this.autoScroll() || !untracked(this.atBottom)) return;
      afterNextRender(() => this.scrollToBottom(), { injector: this.injector });
    });

    afterNextRender(() => {
      const el = this.scrollContainer().nativeElement;

      // Row height from CSS (once) so the virtual window matches the rows.
      const declared = parseFloat(getComputedStyle(el).getPropertyValue('--lc-log-viewer-line-height'));
      if (declared > 0) this.lineHeight.set(declared);

      // Passive scroll tracking outside the zone.
      const onScroll = () => this.onScroll();
      this.ngZone.runOutsideAngular(() => el.addEventListener('scroll', onScroll, { passive: true }));
      this.destroyRef.onDestroy(() => el.removeEventListener('scroll', onScroll));

      // Measure the scroll area so `height="100%"`, `50vh`, flex parents … all
      // yield a correctly sized window (not one derived from parseInt(height)).
      this.viewportHeight.set(el.clientHeight);
      if (typeof ResizeObserver === 'undefined') return;
      const observer = new ResizeObserver(() => this.viewportHeight.set(el.clientHeight));
      observer.observe(el);
      this.destroyRef.onDestroy(() => observer.disconnect());
    });
  }

  private trim(lines: LogLine[], max: number): LogLine[] {
    return lines.length > max ? lines.slice(-max) : lines;
  }

  /** Append streamed lines to the buffer (no-op while paused). */
  private append(newLines: LogLine[]): void {
    if (untracked(this.paused)) return;
    const max = untracked(this.maxLines);
    this.buffer.update((buf) => this.trim([...buf, ...newLines], max));
  }

  protected onScroll(): void {
    const el = this.scrollContainer().nativeElement;
    this.scrollTop.set(el.scrollTop);
    const isAtBottom = el.scrollHeight - el.scrollTop - el.clientHeight < AT_BOTTOM_THRESHOLD;
    if (this.atBottom() !== isAtBottom) {
      this.ngZone.run(() => {
        this.atBottom.set(isAtBottom);
        this.scrollStateChange.emit({ atBottom: isAtBottom });
      });
    }
  }

  protected scrollToBottom(): void {
    const el = this.scrollContainer().nativeElement;
    el.scrollTop = el.scrollHeight;
    this.atBottom.set(true);
  }

  protected togglePause(): void {
    this.paused.update((v) => !v);
  }

  protected clearBuffer(): void {
    this.buffer.set([]);
  }

  protected async onCopyAll(): Promise<void> {
    const text = this.filteredLines()
      .map((l) => {
        const ts = l.timestamp ? `[${l.timestamp.toISOString()}] ` : '';
        const lvl = l.level ? `[${l.level.toUpperCase()}] ` : '';
        return `${ts}${lvl}${l.text}`;
      })
      .join('\n');
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      // Clipboard API unavailable (insecure context / permission denied):
      // still emit so the consumer can fall back to its own copy path.
    }
    this.copyAll.emit(text);
  }

  protected toggleSearch(): void {
    this.showSearch.update((v) => !v);
    if (this.showSearch()) {
      // The input is `@if`-rendered — focus it once it exists (`autofocus`
      // is unreliable for dynamically inserted elements).
      afterNextRender(() => this.searchInput()?.nativeElement.focus(), { injector: this.injector });
    } else {
      this.internalSearch.set('');
    }
  }

  protected toggleLevelFilter(level: LogLevel): void {
    this.internalLevelFilter.update((set) => {
      const newSet = new Set(set);
      if (newSet.has(level)) {
        newSet.delete(level);
      } else {
        newSet.add(level);
      }
      return newSet;
    });
  }

  protected onLineClick(line: LogLine): void {
    this.lineClick.emit(line);
  }

  /**
   * Enter/Space activate an interactive line (see `clickableLines`). Like a
   * native button, Enter fires on keydown and Space on keyup (keydown only
   * prevents the page scroll) — so a consumer that moves focus in its
   * `lineClick` handler doesn't get a stray Space keyup on the new target.
   */
  protected onLineKeydown(event: KeyboardEvent, line: LogLine): void {
    if (!this.clickableLines()) return;
    if (event.key === 'Enter') {
      event.preventDefault();
      this.lineClick.emit(line);
    } else if (event.key === ' ') {
      event.preventDefault();
    }
  }

  protected onLineKeyup(event: KeyboardEvent, line: LogLine): void {
    if (this.clickableLines() && event.key === ' ') {
      event.preventDefault();
      this.lineClick.emit(line);
    }
  }

  protected onKeydown(event: KeyboardEvent): void {
    if (event.key === '/' && !this.showSearch()) {
      event.preventDefault();
      this.toggleSearch();
    }
    if (event.key === 'g' && !event.shiftKey && !this.showSearch()) {
      this.scrollContainer().nativeElement.scrollTo(0, 0);
    }
    if (event.key === 'G' && !this.showSearch()) {
      this.scrollToBottom();
    }
  }

  protected formatTimestamp(date?: Date): string {
    if (!date) return '';
    return date.toLocaleTimeString('en-US', { hour12: false } as Intl.DateTimeFormatOptions);
  }

  /**
   * Render a line's text as HTML: ANSI SGR codes become `<span class="ansi-…">`
   * wrappers, everything else is escaped, and search matches are wrapped in
   * `<mark>`. Highlighting is applied per *text* segment — before the spans
   * are assembled — so a query can never match inside a tag or an entity
   * (`e` used to hit `class="ansi-red"`, `&` / `<` never matched at all).
   */
  protected renderLine(text: string): string {
    const query = this.effectiveSearch();
    const matcher = query
      ? new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi')
      : null;
    // Split the raw text on the query (capturing group → odd parts are the
    // matches), escape every part, wrap the matches.
    const renderText = (segment: string): string =>
      matcher
        ? segment
            .split(matcher)
            .map((part, i) =>
              i % 2 === 1
                ? `<mark class="lc-log-viewer__match">${this.escapeHtml(part)}</mark>`
                : this.escapeHtml(part),
            )
            .join('')
        : this.escapeHtml(segment);

    if (!this.ansiColors()) return renderText(text);

    let html = '';
    let openSpans = 0;
    let cursor = 0;
    // SGR sequences: ESC [ <params> m — params are `;`-separated (may be empty = reset).
    // eslint-disable-next-line no-control-regex -- matching the ESC byte is the point here
    const re = /\x1b\[([\d;]*)m/g;
    let m: RegExpExecArray | null;
    while ((m = re.exec(text)) !== null) {
      html += renderText(text.slice(cursor, m.index));
      cursor = m.index + m[0].length;
      for (const code of (m[1] || '0').split(';')) {
        if (code === '0' || code === '') {
          // Reset closes everything that is open.
          html += '</span>'.repeat(openSpans);
          openSpans = 0;
        } else if (ANSI_CLASSES[code]) {
          html += `<span class="${ANSI_CLASSES[code]}">`;
          openSpans++;
        }
        // Unrecognised codes are stripped.
      }
    }
    html += renderText(text.slice(cursor));
    return html + '</span>'.repeat(openSpans);
  }

  private escapeHtml(text: string): string {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }

  protected getInputValue(event: Event): string {
    return (event.target as HTMLInputElement).value;
  }
}

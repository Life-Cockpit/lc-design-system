import { ComponentFixture, TestBed } from '@angular/core/testing';
import { readFileSync } from 'fs';
import { resolve } from 'path';
import { BehaviorSubject, Subject, of } from 'rxjs';
import { LogViewerComponent, LogLine } from './log-viewer.component';

describe('LogViewerComponent', () => {
  let component: LogViewerComponent;
  let fixture: ComponentFixture<LogViewerComponent>;

  /** jsdom has no layout: fake the scroll metrics of the content area. */
  const layout = (el: HTMLElement, scrollHeight: number, clientHeight: number) => {
    Object.defineProperty(el, 'scrollHeight', { get: () => scrollHeight, configurable: true });
    Object.defineProperty(el, 'clientHeight', { get: () => clientHeight, configurable: true });
  };
  const content = (): HTMLElement => fixture.nativeElement.querySelector('.lc-log-viewer__content');
  const lineTexts = (): string[] =>
    Array.from(fixture.nativeElement.querySelectorAll('.lc-log-viewer__text') as NodeListOf<HTMLElement>).map(
      (e) => e.textContent ?? '',
    );

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LogViewerComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(LogViewerComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should render lines from input', () => {
    const lines: LogLine[] = [
      { text: 'Hello world', level: 'info' },
      { text: 'An error', level: 'error' },
    ];
    fixture.componentRef.setInput('lines', lines);
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelectorAll('.lc-log-viewer__line').length).toBe(2);
  });

  it('should apply terminal variant class', () => {
    fixture.componentRef.setInput('variant', 'terminal');
    fixture.detectChanges();
    const el = fixture.nativeElement.querySelector('.lc-log-viewer--terminal');
    expect(el).toBeTruthy();
  });

  it('should show line numbers when enabled', () => {
    fixture.componentRef.setInput('lines', [{ text: 'line 1' }]);
    fixture.componentRef.setInput('showLineNumbers', true);
    fixture.detectChanges();
    const lineNum = fixture.nativeElement.querySelector('.lc-log-viewer__line-num');
    expect(lineNum).toBeTruthy();
  });

  it('should parse ANSI colors', () => {
    const result = component['renderLine']('\x1b[31mred text\x1b[0m');
    expect(result).toBe('<span class="ansi-red">red text</span>');
  });

  it('should escape HTML in log text', () => {
    const result = component['renderLine']('<script>alert("xss")</script>');
    expect(result).toContain('&lt;script&gt;');
    expect(result).not.toContain('<script>');
  });

  it('should filter by level', () => {
    fixture.componentRef.setInput('lines', [
      { text: 'info line', level: 'info' },
      { text: 'error line', level: 'error' },
      { text: 'debug line', level: 'debug' },
    ]);
    fixture.componentRef.setInput('levelFilter', ['error']);
    fixture.detectChanges();
    expect(component['filteredLines']().length).toBe(1);
    expect(component['filteredLines']()[0].text).toBe('error line');
  });

  it('should respect maxLines buffer', () => {
    const lines: LogLine[] = Array.from({ length: 100 }, (_, i) => ({
      text: `line ${i}`,
    }));
    fixture.componentRef.setInput('lines', lines);
    fixture.componentRef.setInput('maxLines', 50);
    fixture.detectChanges();
    expect(component['buffer']().length).toBe(50);
  });

  it('should apply height style', () => {
    fixture.componentRef.setInput('height', '500px');
    fixture.detectChanges();
    const el = fixture.nativeElement.querySelector('.lc-log-viewer') as HTMLElement;
    expect(el.style.height).toBe('500px');
  });

  it('should emit lineClick on click', () => {
    const lines: LogLine[] = [{ text: 'clickable' }];
    fixture.componentRef.setInput('lines', lines);
    fixture.detectChanges();
    const spy = jest.fn();
    component.lineClick.subscribe(spy);
    const line = fixture.nativeElement.querySelector('.lc-log-viewer__line') as HTMLElement;
    line.click();
    expect(spy).toHaveBeenCalled();
  });

  // ── Controlled mode ───────────────────────────────────────────────────

  describe('controlled lines', () => {
    it('clears the view when lines becomes []', () => {
      fixture.componentRef.setInput('lines', [{ text: 'a' }, { text: 'b' }]);
      fixture.detectChanges();
      expect(fixture.nativeElement.querySelectorAll('.lc-log-viewer__line').length).toBe(2);
      fixture.componentRef.setInput('lines', []);
      fixture.detectChanges();
      expect(fixture.nativeElement.querySelectorAll('.lc-log-viewer__line').length).toBe(0);
      expect(fixture.nativeElement.querySelector('.lc-log-viewer__line-count').textContent).toContain('0 lines');
    });
  });

  // ── Streaming mode ────────────────────────────────────────────────────

  describe('stream$', () => {
    it('renders synchronous (replayed) emissions', () => {
      const stream$ = new BehaviorSubject<LogLine>({ text: 'first' });
      fixture.componentRef.setInput('stream$', stream$);
      fixture.detectChanges();
      expect(lineTexts()).toEqual(['first']);
    });

    it('does not re-subscribe (and duplicate replayed lines) when Pause is toggled', () => {
      const stream$ = new BehaviorSubject<LogLine>({ text: 'first' });
      fixture.componentRef.setInput('stream$', stream$);
      fixture.detectChanges();
      const pause = fixture.nativeElement.querySelector('[aria-label="Pause stream"]') as HTMLButtonElement;
      pause.click();
      fixture.detectChanges();
      pause.click();
      fixture.detectChanges();
      expect(lineTexts()).toEqual(['first']);
    });

    it('does not re-subscribe when maxLines changes', () => {
      const stream$ = of<LogLine[]>([{ text: 'a' }, { text: 'b' }]);
      fixture.componentRef.setInput('stream$', stream$);
      fixture.detectChanges();
      fixture.componentRef.setInput('maxLines', 500);
      fixture.detectChanges();
      expect(lineTexts()).toEqual(['a', 'b']);
    });

    it('drops lines while paused and resumes afterwards', () => {
      const stream$ = new Subject<LogLine>();
      fixture.componentRef.setInput('stream$', stream$);
      fixture.detectChanges();
      stream$.next({ text: 'one' });
      fixture.detectChanges();
      (fixture.nativeElement.querySelector('[aria-label="Pause stream"]') as HTMLButtonElement).click();
      fixture.detectChanges();
      stream$.next({ text: 'dropped' });
      (fixture.nativeElement.querySelector('[aria-label="Resume stream"]') as HTMLButtonElement).click();
      fixture.detectChanges();
      stream$.next({ text: 'two' });
      fixture.detectChanges();
      expect(lineTexts()).toEqual(['one', 'two']);
    });

    it('trims the streamed buffer to maxLines', () => {
      const stream$ = new Subject<LogLine>();
      fixture.componentRef.setInput('stream$', stream$);
      fixture.componentRef.setInput('maxLines', 3);
      fixture.detectChanges();
      for (let i = 0; i < 5; i++) stream$.next({ text: `l${i}` });
      fixture.detectChanges();
      expect(component['buffer']().map((l) => l.text)).toEqual(['l2', 'l3', 'l4']);
    });

    it('unsubscribes on destroy', () => {
      const stream$ = new Subject<LogLine>();
      fixture.componentRef.setInput('stream$', stream$);
      fixture.detectChanges();
      expect(stream$.observed).toBe(true);
      fixture.destroy();
      expect(stream$.observed).toBe(false);
    });
  });

  // ── Auto-scroll ───────────────────────────────────────────────────────

  describe('autoScroll', () => {
    it('scrolls to the bottom when lines arrive and the reader is at the bottom', () => {
      fixture.detectChanges();
      const el = content();
      layout(el, 2200, 300);
      fixture.componentRef.setInput('lines', Array.from({ length: 100 }, (_, i) => ({ text: `l${i}` })));
      fixture.detectChanges();
      expect(el.scrollTop).toBe(2200);
    });

    it('does not fight a reader who scrolled up', () => {
      fixture.componentRef.setInput('lines', Array.from({ length: 100 }, (_, i) => ({ text: `l${i}` })));
      fixture.detectChanges();
      const el = content();
      layout(el, 2200, 300);
      el.scrollTop = 500;
      el.dispatchEvent(new Event('scroll'));
      fixture.detectChanges();
      expect(component['atBottom']()).toBe(false);
      fixture.componentRef.setInput('lines', Array.from({ length: 200 }, (_, i) => ({ text: `l${i}` })));
      fixture.detectChanges();
      expect(el.scrollTop).toBe(500);
      // The "jump to bottom" affordance is offered instead.
      expect(fixture.nativeElement.querySelector('.lc-log-viewer__jump-bottom')).toBeTruthy();
    });

    it('does nothing when autoScroll is false', () => {
      fixture.componentRef.setInput('autoScroll', false);
      fixture.detectChanges();
      const el = content();
      layout(el, 2200, 300);
      fixture.componentRef.setInput('lines', Array.from({ length: 100 }, (_, i) => ({ text: `l${i}` })));
      fixture.detectChanges();
      expect(el.scrollTop).toBe(0);
    });

    it('emits scrollStateChange when the reader leaves the bottom', () => {
      fixture.componentRef.setInput('lines', [{ text: 'a' }]);
      fixture.detectChanges();
      const spy = jest.fn();
      component.scrollStateChange.subscribe(spy);
      const el = content();
      layout(el, 2200, 300);
      el.scrollTop = 100;
      el.dispatchEvent(new Event('scroll'));
      expect(spy).toHaveBeenCalledWith({ atBottom: false });
    });
  });

  // ── Virtual window sizing ─────────────────────────────────────────────

  describe('virtual window', () => {
    const range = () => component['visibleRange']();

    it('derives the visible range from the measured viewport, not from parseInt(height)', () => {
      // A percentage height used to collapse to parseInt('100%') = 100 → 3 rows.
      fixture.componentRef.setInput('height', '100%');
      fixture.componentRef.setInput('lines', Array.from({ length: 1000 }, (_, i) => ({ text: `l${i}` })));
      fixture.detectChanges();
      component['viewportHeight'].set(660); // what the ResizeObserver reports for a 660px scroll area
      fixture.detectChanges();
      const rows = fixture.nativeElement.querySelectorAll('.lc-log-viewer__line').length;
      expect(rows).toBe(Math.ceil(660 / 22) + 3);
      expect(range().totalHeight).toBe(1000 * 22);
    });

    it('falls back to the declared height before the first measurement', () => {
      fixture.componentRef.setInput('height', '400px');
      fixture.componentRef.setInput('lines', Array.from({ length: 1000 }, (_, i) => ({ text: `l${i}` })));
      fixture.detectChanges();
      // (400 - 40 toolbar) / 22 → 17 rows + overscan
      expect(range().end - range().start).toBe(Math.ceil(360 / 22) + 3);
    });

    it('measures the viewport through a ResizeObserver and disconnects on destroy', () => {
      const observe = jest.fn();
      const disconnect = jest.fn();
      let callback: (() => void) | undefined;
      const original = globalThis.ResizeObserver;
      globalThis.ResizeObserver = class {
        constructor(cb: () => void) { callback = cb; }
        observe = observe;
        unobserve = jest.fn();
        disconnect = disconnect;
      } as unknown as typeof ResizeObserver;
      try {
        fixture.componentRef.setInput('lines', Array.from({ length: 1000 }, (_, i) => ({ text: `l${i}` })));
        fixture.detectChanges();
        const el = content();
        expect(observe).toHaveBeenCalledWith(el);
        layout(el, 22_000, 880);
        callback?.();
        fixture.detectChanges();
        expect(fixture.nativeElement.querySelectorAll('.lc-log-viewer__line').length).toBe(Math.ceil(880 / 22) + 3);
        fixture.destroy();
        expect(disconnect).toHaveBeenCalled();
      } finally {
        globalThis.ResizeObserver = original;
      }
    });

    it('positions the window using the line height', () => {
      fixture.componentRef.setInput('lines', Array.from({ length: 1000 }, (_, i) => ({ text: `l${i}` })));
      fixture.detectChanges();
      component['scrollTop'].set(220);
      fixture.detectChanges();
      const win = fixture.nativeElement.querySelector('.lc-log-viewer__window') as HTMLElement;
      // start = floor(220/22) - 1 = 9 → 9 * 22
      expect(win.style.transform).toBe('translateY(198px)');
    });
  });

  // ── Search highlighting ───────────────────────────────────────────────

  describe('search highlight', () => {
    it('marks matches inside ANSI segments without corrupting the markup', () => {
      fixture.componentRef.setInput('searchQuery', 'e');
      fixture.detectChanges();
      const html = component['renderLine']('\x1b[31merror\x1b[0m done');
      expect(html).toBe(
        '<span class="ansi-red"><mark class="lc-log-viewer__match">e</mark>rror</span> don<mark class="lc-log-viewer__match">e</mark>',
      );
      const probe = document.createElement('div');
      probe.innerHTML = html;
      expect(probe.textContent).toBe('error done');
      expect(probe.querySelector('.ansi-red')).toBeTruthy();
      expect(probe.querySelectorAll('mark').length).toBe(2);
    });

    it('matches characters that are HTML-escaped ("&", "<")', () => {
      fixture.componentRef.setInput('searchQuery', '&');
      fixture.detectChanges();
      let html = component['renderLine']('a & b');
      expect(html).toBe('a <mark class="lc-log-viewer__match">&amp;</mark> b');

      fixture.componentRef.setInput('searchQuery', '<b>');
      fixture.detectChanges();
      html = component['renderLine']('x <b> y');
      expect(html).toBe('x <mark class="lc-log-viewer__match">&lt;b&gt;</mark> y');
    });

    it('never matches inside the generated tags', () => {
      fixture.componentRef.setInput('searchQuery', 'span');
      fixture.detectChanges();
      const html = component['renderLine']('\x1b[32mok\x1b[0m');
      expect(html).toBe('<span class="ansi-green">ok</span>');
    });

    it('is case-insensitive and escapes regex metacharacters', () => {
      fixture.componentRef.setInput('searchQuery', 'a.b');
      fixture.detectChanges();
      expect(component['renderLine']('A.B axb')).toBe('<mark class="lc-log-viewer__match">A.B</mark> axb');
    });

    it('applies the highlight in the rendered rows', () => {
      fixture.componentRef.setInput('lines', [{ text: '\x1b[31mfatal error\x1b[0m' }]);
      fixture.componentRef.setInput('searchQuery', 'error');
      fixture.detectChanges();
      const text = fixture.nativeElement.querySelector('.lc-log-viewer__text') as HTMLElement;
      expect(text.textContent).toBe('fatal error');
      expect(text.querySelector('.ansi-red mark.lc-log-viewer__match')?.textContent).toBe('error');
    });
  });

  // ── ANSI parsing ──────────────────────────────────────────────────────

  describe('ANSI', () => {
    it('handles combined SGR parameters and unknown codes', () => {
      expect(component['renderLine']('\x1b[1;31mbold red\x1b[0m plain')).toBe(
        '<span class="ansi-bold"><span class="ansi-red">bold red</span></span> plain',
      );
      expect(component['renderLine']('\x1b[38;5;208mstripped\x1b[m')).toBe('stripped');
    });

    it('closes unterminated spans at the end of the line', () => {
      expect(component['renderLine']('\x1b[34mopen')).toBe('<span class="ansi-blue">open</span>');
    });

    it('renders plain escaped text when ansiColors is off', () => {
      fixture.componentRef.setInput('ansiColors', false);
      fixture.detectChanges();
      expect(component['renderLine']('\x1b[31mred\x1b[0m <b>')).toBe('\x1b[31mred\x1b[0m &lt;b&gt;');
    });
  });

  // ── Copy all ──────────────────────────────────────────────────────────

  describe('copy all', () => {
    const flush = () => new Promise<void>((r) => setTimeout(r, 0));

    it('emits copyAll and does not throw when the clipboard write is rejected', async () => {
      Object.defineProperty(navigator, 'clipboard', {
        value: { writeText: jest.fn().mockRejectedValue(new Error('denied')) },
        configurable: true,
      });
      fixture.componentRef.setInput('lines', [{ text: 'a', level: 'info' }]);
      fixture.detectChanges();
      const spy = jest.fn();
      component.copyAll.subscribe(spy);
      (fixture.nativeElement.querySelector('[aria-label="Copy all lines"]') as HTMLButtonElement).click();
      await flush();
      expect(spy).toHaveBeenCalledWith('[INFO] a');
    });

    it('writes the filtered lines to the clipboard', async () => {
      const writeText = jest.fn().mockResolvedValue(undefined);
      Object.defineProperty(navigator, 'clipboard', { value: { writeText }, configurable: true });
      fixture.componentRef.setInput('lines', [{ text: 'a', level: 'info' }, { text: 'b', level: 'error' }]);
      fixture.componentRef.setInput('levelFilter', ['error']);
      fixture.detectChanges();
      component['onCopyAll']();
      await flush();
      expect(writeText).toHaveBeenCalledWith('[ERROR] b');
    });
  });

  // ── Accessibility ─────────────────────────────────────────────────────

  describe('a11y', () => {
    it('labels the icon-only toolbar buttons', () => {
      fixture.componentRef.setInput('stream$', new Subject<LogLine>());
      fixture.detectChanges();
      const labels = Array.from(
        fixture.nativeElement.querySelectorAll('.lc-log-viewer__tool-btn') as NodeListOf<HTMLElement>,
      ).map((b) => b.getAttribute('aria-label'));
      expect(labels).toEqual(['Pause stream', 'Clear log', 'Copy all lines', 'Search log']);
    });

    it('gives the search input an accessible name and focuses it when opened', () => {
      fixture.detectChanges();
      (fixture.nativeElement.querySelector('[aria-label="Search log"]') as HTMLButtonElement).click();
      fixture.detectChanges();
      const input = fixture.nativeElement.querySelector('.lc-log-viewer__search-input') as HTMLInputElement;
      expect(input).toBeTruthy();
      expect(input.hasAttribute('autofocus')).toBe(false);
      const label = fixture.nativeElement.querySelector(`label[for="${input.id}"]`) as HTMLLabelElement;
      expect(label?.textContent?.trim()).toBe('Search logs');
      expect(document.activeElement).toBe(input);
    });

    it('marks the content area as a log region', () => {
      fixture.detectChanges();
      expect(content().getAttribute('role')).toBe('log');
      expect(content().getAttribute('aria-label')).toBe('Log output');
    });

    it('renders plain rows by default (no role/tabindex)', () => {
      fixture.componentRef.setInput('lines', [{ text: 'a' }]);
      fixture.detectChanges();
      const row = fixture.nativeElement.querySelector('.lc-log-viewer__line') as HTMLElement;
      expect(row.getAttribute('role')).toBeNull();
      expect(row.getAttribute('tabindex')).toBeNull();
    });

    it('makes rows keyboard-operable when clickableLines is set', () => {
      fixture.componentRef.setInput('lines', [{ text: 'a' }]);
      fixture.componentRef.setInput('clickableLines', true);
      fixture.detectChanges();
      const spy = jest.fn();
      component.lineClick.subscribe(spy);
      const row = fixture.nativeElement.querySelector('.lc-log-viewer__line') as HTMLElement;
      expect(row.getAttribute('role')).toBe('button');
      expect(row.getAttribute('tabindex')).toBe('0');

      const enter = new KeyboardEvent('keydown', { key: 'Enter', bubbles: true, cancelable: true });
      row.dispatchEvent(enter);
      expect(spy).toHaveBeenCalledTimes(1);
      // Space: keydown only prevents the scroll, keyup activates (native button semantics).
      const spaceDown = new KeyboardEvent('keydown', { key: ' ', bubbles: true, cancelable: true });
      row.dispatchEvent(spaceDown);
      expect(spaceDown.defaultPrevented).toBe(true);
      expect(spy).toHaveBeenCalledTimes(1);
      row.dispatchEvent(new KeyboardEvent('keyup', { key: ' ', bubbles: true, cancelable: true }));
      expect(spy).toHaveBeenCalledTimes(2);
    });
  });

  // ── Styles (source-level) ─────────────────────────────────────────────

  describe('styles', () => {
    const scss = readFileSync(resolve(__dirname, 'log-viewer.component.scss'), 'utf-8');

    it('scopes the light ANSI palette to the light theme, not to the log variant', () => {
      expect(scss).toMatch(/:root\.light \.lc-log-viewer--log\s*\{/);
      expect(scss).not.toMatch(/^\.lc-log-viewer--log\s*\{\s*\n\s*\.ansi-black/m);
    });

    it('uses status tokens for level ink and the search highlight', () => {
      expect(scss).not.toMatch(/#3b82f6|#f59e0b|#ef4444|#9ca3af|#fbbf2480/);
      expect(scss).toMatch(/--color-info-default/);
      expect(scss).toMatch(/--color-warning-default/);
      expect(scss).toMatch(/--color-error-default/);
    });

    it('drives the row height from --lc-log-viewer-line-height', () => {
      expect(scss).toMatch(/--lc-log-viewer-line-height:\s*22px/);
      expect(scss).toMatch(/height:\s*var\(--lc-log-viewer-line-height\)/);
    });
  });
});

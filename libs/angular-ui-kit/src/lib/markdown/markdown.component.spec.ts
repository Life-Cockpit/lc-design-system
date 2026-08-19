import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { MarkdownComponent } from './markdown.component';

describe('MarkdownComponent', () => {
  let component: MarkdownComponent;
  let fixture: ComponentFixture<MarkdownComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MarkdownComponent],
      providers: [provideHttpClient()],
    }).compileComponents();

    fixture = TestBed.createComponent(MarkdownComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should render headings', () => {
    fixture.componentRef.setInput('content', '# Hello\n\n## World');
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('h1')?.textContent).toContain('Hello');
    expect(el.querySelector('h2')?.textContent).toContain('World');
  });

  it('should render bold and italic', () => {
    fixture.componentRef.setInput('content', '**bold** and *italic*');
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('strong')?.textContent).toBe('bold');
    expect(el.querySelector('em')?.textContent).toBe('italic');
  });

  it('should render links with target', () => {
    fixture.componentRef.setInput('content', '[Click](https://example.com)');
    fixture.componentRef.setInput('linkTarget', '_blank');
    fixture.detectChanges();
    const link = fixture.nativeElement.querySelector('a') as HTMLAnchorElement;
    expect(link.textContent).toBe('Click');
    expect(link.getAttribute('target')).toBe('_blank');
  });

  it('should render tables', () => {
    fixture.componentRef.setInput('content', '| A | B |\n|---|---|\n| 1 | 2 |');
    fixture.detectChanges();
    const table = fixture.nativeElement.querySelector('table');
    expect(table).toBeTruthy();
    expect(table.querySelectorAll('th').length).toBe(2);
  });

  it('should render inline code', () => {
    fixture.componentRef.setInput('content', 'Use `npm install`');
    fixture.detectChanges();
    const code = fixture.nativeElement.querySelector('code');
    expect(code?.textContent).toBe('npm install');
  });

  it('should apply compact variant class', () => {
    fixture.componentRef.setInput('content', 'text');
    fixture.componentRef.setInput('variant', 'compact');
    fixture.detectChanges();
    const container = fixture.nativeElement.querySelector('.lc-markdown--compact');
    expect(container).toBeTruthy();
  });

  it('should render code blocks with lc-code-block', () => {
    fixture.componentRef.setInput('content', '```typescript\nconst x = 1;\n```');
    fixture.detectChanges();
    const codeBlock = fixture.nativeElement.querySelector('lc-code-block');
    expect(codeBlock).toBeTruthy();
  });

  it('should render strikethrough', () => {
    fixture.componentRef.setInput('content', '~~deleted~~');
    fixture.detectChanges();
    const del = fixture.nativeElement.querySelector('del');
    expect(del?.textContent).toBe('deleted');
  });

  it('should render blockquotes', () => {
    fixture.componentRef.setInput('content', '> A quote');
    fixture.detectChanges();
    const bq = fixture.nativeElement.querySelector('blockquote');
    expect(bq?.textContent).toContain('A quote');
  });

  it('should emit linkClick on anchor click', () => {
    fixture.componentRef.setInput('content', '[test](https://example.com)');
    fixture.detectChanges();
    const spy = jest.fn();
    component.linkClick.subscribe(spy);
    const link = fixture.nativeElement.querySelector('a') as HTMLAnchorElement;
    link.click();
    expect(spy).toHaveBeenCalledWith(
      expect.objectContaining({ href: expect.stringContaining('example.com') })
    );
  });

  it('should show heading anchors when enabled', () => {
    fixture.componentRef.setInput('content', '# Title');
    fixture.componentRef.setInput('showHeadingAnchors', true);
    fixture.detectChanges();
    const anchor = fixture.nativeElement.querySelector('.lc-markdown__anchor');
    expect(anchor).toBeTruthy();
  });

  // ── Safety ─────────────────────────────────────────────────────────────
  // The parser builds HTML strings itself; these pin down that nothing in the
  // markdown becomes live markup, on both sanitizer settings.
  describe('Safety', () => {
    const el = () => fixture.nativeElement as HTMLElement;
    const hasEventHandler = () =>
      Array.from(el().querySelectorAll('*')).some((n) =>
        Array.from(n.attributes).some((a) => a.name.startsWith('on')),
      );
    const render = (md: string, sanitize = true) => {
      fixture.componentRef.setInput('content', md);
      fixture.componentRef.setInput('sanitize', sanitize);
      fixture.detectChanges();
    };

    it.each([true, false])('should never emit event-handler attributes (sanitize=%s)', (sanitize) => {
      render('Hi <img src=x onerror="alert(1)"> and ![x](x" onerror="alert(2)) and [l](x" onclick="alert(3))', sanitize);
      expect(hasEventHandler()).toBe(false);
      expect(el().querySelector('img[src="x"]')).toBeNull();
    });

    it.each([true, false])('should not turn javascript: URLs into links or images (sanitize=%s)', (sanitize) => {
      render('[go](javascript:alert(1)) ![i](javascript:alert(2)) [ok](https://example.com)', sanitize);
      const hrefs = Array.from(el().querySelectorAll('a')).map((a) => a.getAttribute('href'));
      expect(hrefs).toEqual(['https://example.com']);
      expect(el().querySelector('img')).toBeNull();
      expect(el().textContent).toContain('go');
    });

    it('should show raw <script> as text', () => {
      render('<script>alert(1)</script> text');
      expect(el().querySelector('script')).toBeNull();
      expect(el().textContent).toContain('<script>');
    });

    it('should keep data: images but not data: links', () => {
      render('![p](data:image/png;base64,AAAA) [d](data:text/html,<script>alert(1)</script>)');
      expect(el().querySelector('img')?.getAttribute('src')).toContain('data:image/png');
      expect(el().querySelector('a')).toBeNull();
    });

    it('should survive a literal code-block placeholder in the text', () => {
      // Used to dereference an absent block and throw inside a computed.
      expect(() => render('<!--CODE_BLOCK_5--> and \u0000LCBLOCK9\u0000\n\n```js\nx\n```')).not.toThrow();
      expect(el().textContent).toContain('<!--CODE_BLOCK_5-->');
      expect(el().querySelector('lc-code-block')).toBeTruthy();
    });
  });

  describe('Heading ids and ordered lists', () => {
    it('should keep heading ids through sanitisation so anchors resolve', () => {
      fixture.componentRef.setInput('content', '# Hello World\n\ntext\n\n```js\nx\n```\n\n## Second Part');
      fixture.componentRef.setInput('showHeadingAnchors', true);
      fixture.detectChanges();
      const el = fixture.nativeElement as HTMLElement;
      expect(el.querySelector('h1')?.id).toBe('hello-world');
      expect(el.querySelector('h2')?.id).toBe('second-part');
      expect(el.querySelector('h1 a.lc-markdown__anchor')?.getAttribute('href')).toBe('#hello-world');
    });

    it('should wrap ordered items in an <ol>', () => {
      fixture.componentRef.setInput('content', '1. First\n2. Second\n\n- a\n- b');
      fixture.detectChanges();
      const el = fixture.nativeElement as HTMLElement;
      const ol = el.querySelector('ol');
      expect(ol).toBeTruthy();
      expect(ol?.querySelectorAll('li').length).toBe(2);
      expect(el.querySelector('ul')?.querySelectorAll('li').length).toBe(2);
    });
  });

  describe('GFM coverage', () => {
    const render = (md: string): HTMLElement => {
      fixture.componentRef.setInput('content', md);
      fixture.detectChanges();
      return fixture.nativeElement as HTMLElement;
    };

    describe('Task lists', () => {
      it('renders a disabled, accessible checkbox + label, no <input>, no bullet', () => {
        const el = render('- [ ] open\n- [x] done');
        const boxes = el.querySelectorAll('.lc-markdown__checkbox');
        expect(boxes.length).toBe(2);
        expect(el.querySelectorAll('input').length).toBe(0); // sanitizer strips <input>
        // accessible state
        expect(boxes[0].getAttribute('role')).toBe('checkbox');
        expect(boxes[0].getAttribute('aria-checked')).toBe('false');
        expect(boxes[0].getAttribute('aria-disabled')).toBe('true');
        expect(boxes[1].getAttribute('aria-checked')).toBe('true');
        expect(boxes[1].classList.contains('lc-markdown__checkbox--checked')).toBe(true);
        // task items carry the marker-suppressing class; labels hold the text
        const items = el.querySelectorAll('.lc-markdown__task-item');
        expect(items.length).toBe(2);
        expect(items[1].querySelector('.lc-markdown__task-label')?.textContent).toContain('done');
      });

      it('accepts uppercase [X] and keeps plain items as regular bullets', () => {
        const el = render('- [X] done\n- plain item');
        expect(el.querySelectorAll('.lc-markdown__checkbox--checked').length).toBe(1);
        const lis = el.querySelectorAll('li');
        const plain = Array.from(lis).find((li) => li.textContent?.includes('plain item'));
        expect(plain?.classList.contains('lc-markdown__task-item')).toBe(false);
        expect(plain?.querySelector('.lc-markdown__checkbox')).toBeNull();
      });
    });

    describe('Tables', () => {
      it('renders a scroll-wrapped table with scope and column alignment', () => {
        const el = render('| A | B | C |\n|:--|:-:|--:|\n| 1 | 2 | 3 |');
        expect(el.querySelector('.lc-markdown__table-wrap')).toBeTruthy();
        const ths = el.querySelectorAll('th');
        expect(ths.length).toBe(3);
        expect(ths[0].getAttribute('scope')).toBe('col');
        expect(ths[0].classList.contains('lc-markdown__cell--left')).toBe(true);
        expect(ths[1].classList.contains('lc-markdown__cell--center')).toBe(true);
        expect(ths[2].classList.contains('lc-markdown__cell--right')).toBe(true);
        const tds = el.querySelectorAll('tbody td');
        expect(tds[1].classList.contains('lc-markdown__cell--center')).toBe(true);
        expect(tds[2].classList.contains('lc-markdown__cell--right')).toBe(true);
      });

      it('leaves an unaligned table without alignment classes', () => {
        const el = render('| A | B |\n|---|---|\n| 1 | 2 |');
        const ths = el.querySelectorAll('th');
        expect(ths.length).toBe(2);
        expect(ths[0].className).toBe('');
      });
    });

    describe('Autolinks', () => {
      it('linkifies bare URLs, www, and emails', () => {
        const el = render('Visit https://example.com or www.test.org or mail a@b.com');
        const links = el.querySelectorAll('a');
        expect(links.length).toBe(3);
        expect(links[0].getAttribute('href')).toBe('https://example.com');
        expect(links[1].getAttribute('href')).toBe('https://www.test.org');
        expect(links[2].getAttribute('href')).toBe('mailto:a@b.com');
      });

      it('respects linkTarget on autolinks', () => {
        fixture.componentRef.setInput('linkTarget', '_blank');
        const el = render('See https://example.com');
        expect(el.querySelector('a')?.getAttribute('target')).toBe('_blank');
      });

      it('does not linkify inside inline code', () => {
        const el = render('Use `https://example.com` here');
        expect(el.querySelectorAll('a').length).toBe(0);
        expect(el.querySelector('code')?.textContent).toContain('https://example.com');
      });

      it('does not double-linkify an explicit link', () => {
        const el = render('[site](https://example.com)');
        const links = el.querySelectorAll('a');
        expect(links.length).toBe(1);
        expect(links[0].textContent).toBe('site');
      });
    });
  });

  describe('Change highlighting', () => {
    const enableHighlight = (content: string, previousContent: string, extra: Record<string, unknown> = {}) => {
      fixture.componentRef.setInput('content', content);
      fixture.componentRef.setInput('previousContent', previousContent);
      fixture.componentRef.setInput('highlightChanges', true);
      for (const [k, v] of Object.entries(extra)) fixture.componentRef.setInput(k, v);
      fixture.detectChanges();
    };
    const el = () => fixture.nativeElement as HTMLElement;
    const changed = () => el().querySelectorAll('.lc-markdown__block--changed');

    it('highlights only the changed/added blocks', () => {
      enableHighlight('Hallo geändert\n\nUnverändert', 'Hallo Welt\n\nUnverändert');
      const marks = changed();
      expect(marks.length).toBe(1);
      expect(marks[0].tagName).toBe('P');
      expect(marks[0].textContent).toContain('Hallo geändert');
    });

    it('highlights a single changed list item, not the whole list', () => {
      enableHighlight('# Titel\n\n- Apfel\n- Kirsche', '# Titel\n\n- Apfel\n- Birne');
      const marks = changed();
      expect(marks.length).toBe(1);
      expect(marks[0].tagName).toBe('LI');
      expect(marks[0].textContent).toContain('Kirsche');
      // The <ul> and the unchanged item are not highlighted.
      expect(el().querySelector('ul')?.classList.contains('lc-markdown__block--changed')).toBe(false);
    });

    it('is byte-for-byte unchanged when highlightChanges is false', () => {
      fixture.componentRef.setInput('content', 'Hallo geändert');
      fixture.componentRef.setInput('previousContent', 'Hallo Welt');
      fixture.componentRef.setInput('highlightChanges', false);
      fixture.detectChanges();
      expect(changed().length).toBe(0);
      expect(component.changedCount()).toBe(0);
    });

    it('produces no highlights when previousContent equals content', () => {
      enableHighlight('Same text', 'Same text');
      expect(changed().length).toBe(0);
      expect(component.changedCount()).toBe(0);
    });

    it('adds a screen-reader "geändert" affordance to changed blocks', () => {
      enableHighlight('Neuer Absatz', 'Alter Absatz');
      const mark = changed()[0];
      const sr = mark.querySelector('.lc-markdown__sr-only');
      expect(sr?.textContent).toContain('geändert');
      // Polite live-region summary is present.
      const status = el().querySelector('[role="status"][aria-live="polite"]');
      expect(status?.textContent).toContain('geändert');
    });

    it('emits changesHighlighted with the changed-block count', () => {
      const spy = jest.fn();
      component.changesHighlighted.subscribe(spy);
      enableHighlight('A neu\n\nB\n\nC neu', 'A\n\nB\n\nC');
      expect(spy).toHaveBeenCalledWith({ changedBlocks: 2 });
    });

    it('fades highlights after changeHighlightFadeMs, persists otherwise', () => {
      jest.useFakeTimers();
      try {
        enableHighlight('Neu', 'Alt', { changeHighlightFadeMs: 1000 });
        expect(el().querySelector('.lc-markdown')?.classList.contains('lc-markdown--faded')).toBe(false);
        jest.advanceTimersByTime(1000);
        fixture.detectChanges();
        expect(el().querySelector('.lc-markdown')?.classList.contains('lc-markdown--faded')).toBe(true);
        // Block keeps its class; only the visual accent transitions out.
        expect(changed().length).toBe(1);
      } finally {
        jest.useRealTimers();
      }
    });

    it('does not fade when changeHighlightFadeMs is unset', () => {
      jest.useFakeTimers();
      try {
        enableHighlight('Neu', 'Alt');
        jest.advanceTimersByTime(10000);
        fixture.detectChanges();
        expect(el().querySelector('.lc-markdown')?.classList.contains('lc-markdown--faded')).toBe(false);
        expect(changed().length).toBe(1);
      } finally {
        jest.useRealTimers();
      }
    });

    it('scrolls the first changed block into view when scrollToFirstChange is set', () => {
      const scrollSpy = jest.fn();
      // jsdom does not implement scrollIntoView.
      Element.prototype.scrollIntoView = scrollSpy;
      jest.useFakeTimers();
      try {
        enableHighlight('Eins neu\n\nZwei neu', 'Eins\n\nZwei', { scrollToFirstChange: true });
        jest.advanceTimersByTime(0);
        expect(scrollSpy).toHaveBeenCalled();
      } finally {
        jest.useRealTimers();
      }
    });
  });
});

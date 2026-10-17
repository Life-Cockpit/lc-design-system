import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient, withXhr } from '@angular/common/http';
import { readFileSync, readdirSync } from 'fs';
import { resolve } from 'path';
import { provideLcIcons, type LcIconDefinition } from '@lifecorner/angular-ui-kit/icon';
import { CodeBlockComponent, CodeBlockLanguage } from './code-block.component';

const CLIPBOARD: LcIconDefinition = {
  name: 'clipboard-document',
  variant: 'outline',
  svg: '<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M9 5h6v4H9z" /></svg>',
};

/**
 * 3.6.1 (request 003, AS-20): the tokens are rendered as elements, not through
 * `[innerHTML]`, so the block works under a Trusted Types CSP. The output has
 * to equal 3.6.0's, captured in Chromium (code-block.golden-3.6.0.json).
 * code-block.component.spec.ts stays unchanged (AC-14).
 */

type Node36 = string | [string, string];
interface GoldenLine {
  t: string;
  k: Node36[];
}
interface Golden {
  code: string;
  lines: GoldenLine[];
}
const GOLDEN = JSON.parse(readFileSync(resolve(__dirname, 'code-block.golden-3.6.0.json'), 'utf-8')) as {
  samples: Record<CodeBlockLanguage, Golden>;
  stories: Record<string, Golden>;
};
const STORY_LANGUAGE: Record<string, CodeBlockLanguage> = {
  'type-script': 'typescript', json: 'json', bash: 'bash', 'no-header': 'typescript', html: 'html',
  python: 'python', java: 'java',
};

const NBSP = String.fromCharCode(0xa0);
const LANGUAGES: CodeBlockLanguage[] = ['typescript', 'javascript', 'html', 'css', 'scss', 'json', 'bash', 'python', 'java', 'text'];

/**
 * The two allowed differences from 3.6.0 (spec AC-4):
 * - D1: SCSS shows the source text; 3.6.0 showed the entities of its escaped
 *   text (`&amp;:hover &gt;`) and coloured the `&` of each.
 * - D2: an empty line before a bash command line holds U+00A0 (as every other
 *   empty line), where 3.6.0 left an empty span (0 px without line numbers).
 *   No golden sample has that case; the AC-6 tests below pin it.
 */
const D1: { language: CodeBlockLanguage; line: number; expected: GoldenLine } = {
  language: 'scss',
  line: 2,
  expected: {
    t: '  &:hover > .title { gap: $gap }',
    k: ['  ', ['token-selector', '&'], ':hover > ', ['token-selector', '.title'], ' { gap: ', ['token-variable', '$gap'], ' }'],
  },
};

function render(code: string, inputs: Record<string, unknown> = {}): ComponentFixture<CodeBlockComponent> {
  const fixture = TestBed.createComponent(CodeBlockComponent);
  fixture.componentRef.setInput('code', code);
  for (const [key, value] of Object.entries(inputs)) fixture.componentRef.setInput(key, value);
  fixture.detectChanges();
  return fixture;
}

const contents = (root: HTMLElement) => [...root.querySelectorAll<HTMLElement>('.code-block__line-content')];

/** The rendered lines in the golden format: text nodes as strings, spans as [class, text]; comment anchors skipped. */
function linesOf(root: HTMLElement): GoldenLine[] {
  return contents(root).map((el) => ({
    t: el.textContent ?? '',
    k: [...el.childNodes]
      .filter((n) => n.nodeType !== Node.COMMENT_NODE)
      .map((n): Node36 => (n.nodeType === Node.TEXT_NODE ? (n.textContent ?? '') : [(n as Element).className, n.textContent ?? ''])),
  }));
}

/** design.md §9: drop empty text and empty spans, merge adjacent text. */
function normalise(k: Node36[]): Node36[] {
  const out: Node36[] = [];
  for (const n of k) {
    if ((typeof n === 'string' ? n : n[1]) === '') continue;
    const last = out[out.length - 1];
    if (typeof n === 'string' && typeof last === 'string') out[out.length - 1] = last + n;
    else out.push(n);
  }
  return out;
}

/** WCAG relative luminance of a #rrggbb colour. */
function luminance(hex: string): number {
  const [r, g, b] = [1, 3, 5].map((i) => {
    const v = parseInt(hex.slice(i, i + 2), 16) / 255;
    return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function contrast(a: string, b: string): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

describe('CodeBlockComponent rendering (3.6.1, AS-20)', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CodeBlockComponent],
      // In an app `clipboard-document` is fetched (Tabler `clipboard`); registered
      // here, so it renders without a request. Both paths decorate the same way.
      providers: [provideHttpClient(withXhr()), provideLcIcons([CLIPBOARD])],
    }).compileComponents();
  });

  describe('AC-1: no string-to-DOM API', () => {
    const dir = __dirname;
    const sources = readdirSync(dir).filter((f) => /\.(ts|html)$/.test(f) && !f.endsWith('.spec.ts'));

    it.each(['code-block.component.ts', 'code-block.component.html'])('%s has no innerHTML, sanitizer or bypass', (file) => {
      const source = readFileSync(resolve(dir, file), 'utf-8');
      expect(source).not.toMatch(
        /innerHTML|outerHTML|insertAdjacentHTML|DOMParser|createContextualFragment|DomSanitizer|SafeHtml|bypassSecurityTrust/,
      );
    });

    it('no file of the folder imports @angular/platform-browser', () => {
      expect(sources.length).toBeGreaterThanOrEqual(4);
      for (const file of sources) {
        expect(readFileSync(resolve(dir, file), 'utf-8')).not.toMatch(/from '@angular\/platform-browser'/);
      }
    });
  });

  describe('AC-4: the same text and token classes as 3.6.0', () => {
    it.each(LANGUAGES)('%s equals the 3.6.0 golden sample (scss: D1)', (language) => {
      const golden = GOLDEN.samples[language];
      const actual = linesOf(render(golden.code, { language }).nativeElement);
      const expected = golden.lines.map((line, i) => (language === D1.language && i === D1.line ? D1.expected : line));
      expect(actual.map((l) => ({ t: l.t, k: normalise(l.k) }))).toEqual(expected.map((l) => ({ t: l.t, k: normalise(l.k) })));
    });

    it('D1 is the only scss difference: 3.6.0 showed the entities there', () => {
      expect(GOLDEN.samples.scss.lines[D1.line].t).toBe('  &amp;:hover &gt; .title { gap: $gap }');
    });

    it.each(Object.keys(STORY_LANGUAGE))('the %s story equals 3.6.0', (story) => {
      const golden = GOLDEN.stories[story];
      const actual = linesOf(render(golden.code, { language: STORY_LANGUAGE[story] }).nativeElement);
      expect(actual.map((l) => ({ t: l.t, k: normalise(l.k) }))).toEqual(golden.lines.map((l) => ({ t: l.t, k: normalise(l.k) })));
    });

    it('re-renders a changed code and language like a fresh block', () => {
      const fixture = render(GOLDEN.samples.typescript.code, { language: 'typescript' });
      for (const language of ['html', 'bash', 'text', 'java'] as CodeBlockLanguage[]) {
        fixture.componentRef.setInput('code', GOLDEN.samples[language].code);
        fixture.componentRef.setInput('language', language);
        fixture.detectChanges();
        const fresh = linesOf(render(GOLDEN.samples[language].code, { language }).nativeElement);
        expect(linesOf(fixture.nativeElement)).toEqual(fresh);
      }
    });
  });

  describe('DOM contract (design.md §3)', () => {
    it('S1: only text and token spans with one class and one text node', () => {
      for (const language of LANGUAGES) {
        for (const el of contents(render(GOLDEN.samples[language].code, { language }).nativeElement)) {
          for (const node of [...el.childNodes].filter((n) => n.nodeType !== Node.COMMENT_NODE)) {
            if (node.nodeType === Node.TEXT_NODE) continue;
            const span = node as Element;
            expect(span.tagName).toBe('SPAN');
            expect(span.classList.length).toBe(1);
            expect(span.className).toMatch(/^token-[a-z]+$/);
            expect([...span.attributes].map((a) => a.name).filter((n) => !n.startsWith('_ngcontent'))).toEqual(['class']);
            expect([...span.childNodes].map((c) => c.nodeType)).toEqual([Node.TEXT_NODE]);
          }
        }
      }
    });

    it('S2: the line texts joined with line feeds equal the source', () => {
      for (const language of LANGUAGES) {
        const { code } = GOLDEN.samples[language];
        const texts = contents(render(code, { language }).nativeElement).map((el) => (el.textContent === NBSP ? '' : el.textContent));
        expect(texts.join('\n')).toBe(code);
      }
    });

    it('S4: an empty code is one line with U+00A0 and line number 1', () => {
      const root = render('').nativeElement as HTMLElement;
      expect(root.querySelectorAll('.code-block__line').length).toBe(1);
      expect(root.querySelector('.code-block__line-number')?.textContent).toBe('1');
      expect(linesOf(root)).toEqual([{ t: NBSP, k: [NBSP] }]);
    });

    it('keeps a CR of CRLF line ends in the text, and copies the raw code', async () => {
      const writeText = jest.fn().mockResolvedValue(undefined);
      Object.defineProperty(navigator, 'clipboard', { value: { writeText }, configurable: true });
      const fixture = render('a\r\nb', { language: 'bash' });
      expect(linesOf(fixture.nativeElement).map((l) => l.t)).toEqual(['a\r', 'b']);
      (fixture.nativeElement.querySelector('.code-block__copy') as HTMLButtonElement).click();
      await new Promise((r) => setTimeout(r, 0));
      expect(writeText).toHaveBeenCalledWith('a\r\nb');
    });

    it('pins the default rendering: header with the language, copy button, numbered lines, plain text', () => {
      const root = render('const a = 1;\nb').nativeElement as HTMLElement;
      expect(root.querySelector('.code-block')?.className).toBe('code-block code-block--text');
      expect(root.querySelector('.code-block__language')?.textContent).toBe('text');
      expect(root.querySelector('.code-block__copy')?.getAttribute('aria-label')).toBe('Copy code');
      expect([...root.querySelectorAll('.code-block__line-number')].map((n) => n.textContent)).toEqual(['1', '2']);
      expect(linesOf(root)).toEqual([
        { t: 'const a = 1;', k: ['const a = 1;'] },
        { t: 'b', k: ['b'] },
      ]);
      // pre > code > (span.code-block__line, "\n")*, as in 3.6.0
      const code = root.querySelector('pre.code-block__pre > code.code-block__code') as HTMLElement;
      const outer = [...code.childNodes].filter((n) => n.nodeType !== Node.COMMENT_NODE);
      expect(outer.map((n) => (n.nodeType === Node.TEXT_NODE ? n.textContent : (n as Element).className))).toEqual([
        'code-block__line', '\n', 'code-block__line', '\n',
      ]);
    });
  });

  describe('AC-5: the source is never markup', () => {
    it.each(['text', 'html'] as CodeBlockLanguage[])('%s: an img tag and entities render as text', (language) => {
      const code = '<img src=x onerror=alert(1)>\n&lt;b&gt;';
      const root = render(code, { language }).nativeElement as HTMLElement;
      const code$ = root.querySelector('code') as HTMLElement;
      expect(code$.querySelectorAll('img').length).toBe(0);
      expect([...code$.querySelectorAll('*')].every((el) => el.tagName === 'SPAN')).toBe(true);
      expect(contents(root).map((el) => el.textContent)).toEqual(['<img src=x onerror=alert(1)>', '&lt;b&gt;']);
    });
  });

  describe('AC-6: an empty line keeps one line height', () => {
    it.each([true, false])('a, empty, b with line numbers %s: the middle line is U+00A0', (showLineNumbers) => {
      const root = render('a\n\nb', { showLineNumbers }).nativeElement as HTMLElement;
      expect(root.querySelectorAll('.code-block__line').length).toBe(3);
      expect(linesOf(root)).toEqual([
        { t: 'a', k: ['a'] },
        { t: NBSP, k: [NBSP] },
        { t: 'b', k: ['b'] },
      ]);
    });

    it('D2: an empty line before a bash command holds U+00A0, not an empty span', () => {
      const root = render('npm install\n\nnpm test', { language: 'bash', showLineNumbers: false }).nativeElement as HTMLElement;
      expect(linesOf(root)).toEqual([
        { t: 'npm install', k: [['token-builtin', 'npm'], ' install'] },
        { t: NBSP, k: [NBSP] },
        { t: 'npm test', k: ['npm test'] },
      ]);
    });
  });

  describe('AC-8: the copy button icons are decorative', () => {
    const settle = async (fixture: ComponentFixture<CodeBlockComponent>) => {
      await new Promise((r) => setTimeout(r, 0));
      fixture.detectChanges();
      await fixture.whenStable();
      fixture.detectChanges();
    };
    const icons = (root: HTMLElement) => [...root.querySelectorAll('.code-block__copy svg')];

    it.each([
      ['EN', {}],
      ['DE', { copyLabel: 'Kopieren', copyAriaLabel: 'Code kopieren', copiedLabel: 'Kopiert', copiedAnnouncement: 'In die Zwischenablage kopiert' }],
    ])('%s: aria-hidden svg without role, idle and copied', async (_, labels) => {
      Object.defineProperty(navigator, 'clipboard', { value: { writeText: jest.fn().mockResolvedValue(undefined) }, configurable: true });
      const fixture = render('const a = 1;', labels);
      await settle(fixture);
      const idle = icons(fixture.nativeElement);
      expect(idle.length).toBe(1);
      expect(idle.map((s) => [s.getAttribute('aria-hidden'), s.getAttribute('role'), s.getAttribute('aria-label')])).toEqual([['true', null, null]]);

      (fixture.nativeElement.querySelector('.code-block__copy') as HTMLButtonElement).click();
      await settle(fixture);
      const copied = icons(fixture.nativeElement);
      expect(copied.length).toBe(1);
      expect(copied.map((s) => [s.getAttribute('aria-hidden'), s.getAttribute('role'), s.getAttribute('aria-label')])).toEqual([['true', null, null]]);
      expect(fixture.nativeElement.querySelector('.code-block__copy')?.getAttribute('aria-label')).toBe(
        (labels as { copiedLabel?: string }).copiedLabel ?? 'Copied',
      );
    });
  });

  describe('AC-15: comments in the muted ink, AA on the block', () => {
    const scss = readFileSync(resolve(__dirname, 'code-block.component.scss'), 'utf-8');
    const value = (name: string) => scss.match(new RegExp(`--lc-code-block-${name}:\\s*(#[0-9a-f]{6})`, 'i'))?.[1] ?? '';

    it('token-comment uses var(--lc-code-block-muted), still italic', () => {
      const rule = scss.match(/\.token-comment \{([^}]*)/)?.[1] ?? '';
      expect(rule).toMatch(/color:\s*var\(--lc-code-block-muted\);/);
      expect(rule).toMatch(/font-style:\s*italic;/);
    });

    it('reaches at least 4.5:1 on the code background (7.02:1)', () => {
      const ratio = contrast(value('muted'), value('bg'));
      expect(ratio).toBeGreaterThanOrEqual(4.5);
      expect(ratio.toFixed(2)).toBe('7.02');
    });
  });
});

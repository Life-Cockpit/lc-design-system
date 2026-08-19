import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Component, signal } from '@angular/core';
import { By } from '@angular/platform-browser';
import { DiffViewerComponent, DiffViewMode } from './diff-viewer.component';

@Component({
  standalone: true,
  imports: [DiffViewerComponent],
  template: `<lc-diff-viewer
    [oldText]="oldText()"
    [newText]="newText()"
    [oldLabel]="oldLabel()"
    [newLabel]="newLabel()"
    [mode]="mode()"
    [showLineNumbers]="showLineNumbers()"
    [contextLines]="contextLines()"
    [maxLines]="maxLines()"
  />`,
})
class TestHost {
  oldText = signal('line1\nline2\nline3');
  newText = signal('line1\nline2 modified\nline3\nline4');
  oldLabel = signal('Original');
  newLabel = signal('Modified');
  mode = signal<DiffViewMode>('side-by-side');
  showLineNumbers = signal(true);
  contextLines = signal(Infinity);
  maxLines = signal(20_000);
}

interface Line { type: 'unchanged' | 'added' | 'removed'; leftNum: number | null; rightNum: number | null; content: string }

/** Reference O(N·M) LCS length — the algorithm the viewer used to run. */
function lcsLength(a: string[], b: string[]): number {
  let prev = new Array<number>(b.length + 1).fill(0);
  for (let i = 1; i <= a.length; i++) {
    const cur = new Array<number>(b.length + 1).fill(0);
    for (let j = 1; j <= b.length; j++) {
      cur[j] = a[i - 1] === b[j - 1] ? prev[j - 1] + 1 : Math.max(prev[j], cur[j - 1]);
    }
    prev = cur;
  }
  return prev[b.length];
}

describe('DiffViewerComponent', () => {
  let fixture: ComponentFixture<TestHost>;
  let host: TestHost;
  let el: HTMLElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [TestHost] }).compileComponents();
    fixture = TestBed.createComponent(TestHost);
    host = fixture.componentInstance;
    fixture.detectChanges();
    el = fixture.nativeElement;
  });

  it('should create', () => {
    expect(el.querySelector('lc-diff-viewer')).toBeTruthy();
  });

  it('should show stats', () => {
    const stats = el.querySelectorAll('.lc-diff__stat');
    expect(stats.length).toBe(2);
  });

  it('should show additions count', () => {
    const add = el.querySelector('.lc-diff__stat--add');
    expect(add?.textContent?.trim()).toMatch(/\+\d+/);
  });

  it('should show deletions count', () => {
    const del = el.querySelector('.lc-diff__stat--del');
    expect(del?.textContent?.trim()).toMatch(/−\d+/);
  });

  it('should render side-by-side by default', () => {
    expect(el.querySelector('.lc-diff__side-by-side')).toBeTruthy();
    expect(el.querySelector('.lc-diff__inline')).toBeFalsy();
  });

  it('should render inline mode', () => {
    host.mode.set('inline');
    fixture.detectChanges();
    expect(el.querySelector('.lc-diff__inline')).toBeTruthy();
    expect(el.querySelector('.lc-diff__side-by-side')).toBeFalsy();
  });

  it('should render left and right panes', () => {
    expect(el.querySelector('.lc-diff__pane--left')).toBeTruthy();
    expect(el.querySelector('.lc-diff__pane--right')).toBeTruthy();
  });

  it('should show diff lines', () => {
    const lines = el.querySelectorAll('.lc-diff__line');
    expect(lines.length).toBeGreaterThan(0);
  });

  it('should highlight added lines', () => {
    const added = el.querySelectorAll('.lc-diff__line--added');
    expect(added.length).toBeGreaterThan(0);
  });

  it('should highlight removed lines', () => {
    const removed = el.querySelectorAll('.lc-diff__line--removed');
    expect(removed.length).toBeGreaterThan(0);
  });

  it('should show pane headers', () => {
    const headers = el.querySelectorAll('.lc-diff__pane-header');
    expect(headers[0]?.textContent?.trim()).toBe('Original');
    expect(headers[1]?.textContent?.trim()).toBe('Modified');
  });

  it('should show line numbers by default', () => {
    expect(el.querySelectorAll('.lc-diff__num').length).toBeGreaterThan(0);
  });

  it('should hide line numbers when disabled', () => {
    host.showLineNumbers.set(false);
    fixture.detectChanges();
    expect(el.querySelectorAll('.lc-diff__num').length).toBe(0);
  });

  it('should handle identical texts', () => {
    host.newText.set('line1\nline2\nline3');
    fixture.detectChanges();
    expect(el.querySelectorAll('.lc-diff__line--added').length).toBe(0);
    expect(el.querySelectorAll('.lc-diff__line--removed').length).toBe(0);
  });

  it('should show inline file label', () => {
    host.mode.set('inline');
    fixture.detectChanges();
    expect(el.querySelector('.lc-diff__file-label')?.textContent).toContain('→');
  });

  it('should support context lines', () => {
    host.oldText.set('a\nb\nc\nd\ne\nf\ng\nh\ni\nj');
    host.newText.set('a\nb\nc\nD\ne\nf\ng\nh\ni\nj');
    host.contextLines.set(1);
    host.mode.set('inline');
    fixture.detectChanges();
    const lines = el.querySelectorAll('.lc-diff__line');
    expect(lines.length).toBeLessThan(12); // less than all
  });

  // ── Diff algorithm ───────────────────────────────────────────────────

  describe('diff algorithm', () => {
    const diffOf = (): Line[] =>
      fixture.debugElement.query(By.directive(DiffViewerComponent)).componentInstance['diffLines']();

    it('produces the expected edit script for a small change', () => {
      host.mode.set('inline');
      fixture.detectChanges();
      expect(diffOf().map(l => `${l.type[0]}:${l.content}`)).toEqual([
        'u:line1',
        'r:line2',
        'a:line2 modified',
        'u:line3',
        'a:line4',
      ]);
      // Line numbers count independently per side.
      expect(diffOf().map(l => [l.leftNum, l.rightNum])).toEqual([
        [1, 1], [2, null], [null, 2], [3, 3], [null, 4],
      ]);
      expect(el.querySelector('.lc-diff__stat--add')?.textContent?.trim()).toBe('+2');
      expect(el.querySelector('.lc-diff__stat--del')?.textContent?.trim()).toBe('−1');
    });

    it('is minimal and lossless (matches the LCS reference on random inputs)', () => {
      // Deterministic LCG so a failure is reproducible.
      let seed = 42;
      const rnd = (n: number) => { seed = (seed * 1103515245 + 12345) & 0x7fffffff; return seed % n; };
      const alphabet = ['a', 'b', 'c', 'd'];
      for (let round = 0; round < 60; round++) {
        const a = Array.from({ length: rnd(12) }, () => alphabet[rnd(alphabet.length)]);
        const b = Array.from({ length: rnd(12) }, () => alphabet[rnd(alphabet.length)]);
        host.oldText.set(a.join('\n'));
        host.newText.set(b.join('\n'));
        fixture.detectChanges();
        const lines = diffOf();
        const left = lines.filter(l => l.type !== 'added').map(l => l.content);
        const right = lines.filter(l => l.type !== 'removed').map(l => l.content);
        // split('\n') of '' yields [''] — mirror that in the expectation.
        expect(left).toEqual(a.length ? a : ['']);
        expect(right).toEqual(b.length ? b : ['']);
        const unchanged = lines.filter(l => l.type === 'unchanged').length;
        expect(unchanged).toBe(lcsLength(a.length ? a : [''], b.length ? b : ['']));
      }
    });

    it('handles a change at the very start and end without common context', () => {
      host.oldText.set('x\nsame\ny');
      host.newText.set('p\nsame\nq');
      fixture.detectChanges();
      expect(diffOf().map(l => `${l.type[0]}:${l.content}`)).toEqual([
        'r:x', 'a:p', 'u:same', 'r:y', 'a:q',
      ]);
    });

    // Perf cases read the computed directly (no DOM render — jsdom layout of
    // thousands of rows would dominate the timing, not the algorithm).
    const diffOnly = (oldText: string, newText: string): Line[] => {
      const direct = TestBed.createComponent(DiffViewerComponent);
      direct.componentRef.setInput('oldText', oldText);
      direct.componentRef.setInput('newText', newText);
      return direct.componentInstance['diffLines']();
    };

    it('diffs two 5 000-line inputs with scattered edits quickly', () => {
      const oldLines = Array.from({ length: 5000 }, (_, i) => `line ${i}`);
      const newLines = oldLines.map((l, i) => (i % 97 === 0 ? `${l} changed` : l));
      newLines.splice(2500, 0, 'inserted A', 'inserted B');
      const started = performance.now();
      const lines = diffOnly(oldLines.join('\n'), newLines.join('\n'));
      expect(performance.now() - started).toBeLessThan(500);
      expect(lines.filter(l => l.type === 'added').length).toBe(52 + 2);
      expect(lines.filter(l => l.type === 'removed').length).toBe(52);
      expect(lines.filter(l => l.type === 'unchanged').length).toBe(5000 - 52);
    });

    it('does not blow up on two large inputs with nothing in common', () => {
      const started = performance.now();
      const lines = diffOnly(
        Array.from({ length: 5000 }, (_, i) => `old ${i}`).join('\n'),
        Array.from({ length: 5000 }, (_, i) => `new ${i}`).join('\n'),
      );
      expect(performance.now() - started).toBeLessThan(2000);
      expect(lines.length).toBe(10_000);
      expect(lines.filter(l => l.type === 'unchanged').length).toBe(0);
    });
  });

  // ── Size cap ─────────────────────────────────────────────────────────

  describe('maxLines cap', () => {
    it('renders a "too large" notice instead of a diff above the cap', () => {
      host.maxLines.set(100);
      host.oldText.set(Array.from({ length: 101 }, (_, i) => `l${i}`).join('\n'));
      host.newText.set('short');
      host.mode.set('inline');
      fixture.detectChanges();
      const notice = el.querySelector('.lc-diff__too-large');
      expect(notice).toBeTruthy();
      expect(notice?.getAttribute('role')).toBe('status');
      expect(notice?.textContent).toContain('101 lines');
      expect(notice?.textContent).toContain('limit 100');
      expect(el.querySelectorAll('.lc-diff__line').length).toBe(0);
      expect(el.querySelector('.lc-diff__stat--add')?.textContent?.trim()).toBe('+0');
    });

    it('diffs normally when both sides are within the cap', () => {
      host.maxLines.set(100);
      host.oldText.set(Array.from({ length: 100 }, (_, i) => `l${i}`).join('\n'));
      host.newText.set(Array.from({ length: 100 }, (_, i) => `l${i}`).join('\n'));
      fixture.detectChanges();
      expect(el.querySelector('.lc-diff__too-large')).toBeNull();
      expect(el.querySelectorAll('.lc-diff__line').length).toBe(200);
    });
  });
});

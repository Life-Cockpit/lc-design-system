import {
  ChangeDetectionStrategy,
  Component,
  input,
  computed,
} from '@angular/core';

export type DiffViewMode = 'side-by-side' | 'inline';

interface DiffLine {
  type: 'unchanged' | 'added' | 'removed';
  leftNum: number | null;
  rightNum: number | null;
  content: string;
}

/** Edit-script op produced by the line diff (before numbering). */
type DiffOp = readonly [type: DiffLine['type'], lines: readonly string[]];

/**
 * Line diff: common prefix/suffix are peeled off cheaply, the remainder goes
 * through Myers' O((N+M)·D) "bisect" (find where the forward and reverse
 * D-paths meet, split there, recurse) — linear space, no N×M matrix. Two
 * 5 000-line inputs used to allocate ~25M numbers and freeze the tab.
 */
function diffLines(a: readonly string[], b: readonly string[]): DiffOp[] {
  if (a.length === 0 && b.length === 0) return [];
  if (a.length === 0) return [['added', b]];
  if (b.length === 0) return [['removed', a]];

  // Common prefix / suffix.
  let start = 0;
  const maxPrefix = Math.min(a.length, b.length);
  while (start < maxPrefix && a[start] === b[start]) start++;
  let end = 0;
  const maxSuffix = maxPrefix - start;
  while (end < maxSuffix && a[a.length - 1 - end] === b[b.length - 1 - end]) end++;

  const ops: DiffOp[] = [];
  if (start > 0) ops.push(['unchanged', a.slice(0, start)]);
  const midA = a.slice(start, a.length - end);
  const midB = b.slice(start, b.length - end);
  if (midA.length && midB.length) ops.push(...bisect(midA, midB));
  else if (midA.length) ops.push(['removed', midA]);
  else if (midB.length) ops.push(['added', midB]);
  if (end > 0) ops.push(['unchanged', a.slice(a.length - end)]);
  return ops;
}

/** Myers middle-snake bisection (as in diff-match-patch), on line arrays. */
function bisect(a: readonly string[], b: readonly string[]): DiffOp[] {
  const n = a.length;
  const m = b.length;
  const maxD = Math.ceil((n + m) / 2);
  const offset = maxD;
  const size = 2 * maxD;
  const v1 = new Int32Array(size).fill(-1);
  const v2 = new Int32Array(size).fill(-1);
  v1[offset + 1] = 0;
  v2[offset + 1] = 0;
  const delta = n - m;
  // With an odd delta the paths can only overlap on the forward pass.
  const front = delta % 2 !== 0;
  let k1start = 0, k1end = 0, k2start = 0, k2end = 0;

  for (let d = 0; d < maxD; d++) {
    // Forward path.
    for (let k1 = -d + k1start; k1 <= d - k1end; k1 += 2) {
      const k1o = offset + k1;
      let x1 = k1 === -d || (k1 !== d && v1[k1o - 1] < v1[k1o + 1]) ? v1[k1o + 1] : v1[k1o - 1] + 1;
      let y1 = x1 - k1;
      while (x1 < n && y1 < m && a[x1] === b[y1]) { x1++; y1++; }
      v1[k1o] = x1;
      if (x1 > n) k1end += 2;
      else if (y1 > m) k1start += 2;
      else if (front) {
        const k2o = offset + delta - k1;
        if (k2o >= 0 && k2o < size && v2[k2o] !== -1 && x1 >= n - v2[k2o]) {
          return splitAt(a, b, x1, y1);
        }
      }
    }
    // Reverse path.
    for (let k2 = -d + k2start; k2 <= d - k2end; k2 += 2) {
      const k2o = offset + k2;
      let x2 = k2 === -d || (k2 !== d && v2[k2o - 1] < v2[k2o + 1]) ? v2[k2o + 1] : v2[k2o - 1] + 1;
      let y2 = x2 - k2;
      while (x2 < n && y2 < m && a[n - x2 - 1] === b[m - y2 - 1]) { x2++; y2++; }
      v2[k2o] = x2;
      if (x2 > n) k2end += 2;
      else if (y2 > m) k2start += 2;
      else if (!front) {
        const k1o = offset + delta - k2;
        if (k1o >= 0 && k1o < size && v1[k1o] !== -1) {
          const x1 = v1[k1o];
          if (x1 >= n - x2) return splitAt(a, b, x1, offset + x1 - k1o);
        }
      }
    }
  }
  // Nothing in common at all.
  return [['removed', a], ['added', b]];
}

function splitAt(a: readonly string[], b: readonly string[], x: number, y: number): DiffOp[] {
  return [...diffLines(a.slice(0, x), b.slice(0, y)), ...diffLines(a.slice(x), b.slice(y))];
}

@Component({
  selector: 'lc-diff-viewer',
  standalone: true,
  templateUrl: './diff-viewer.component.html',
  styleUrls: ['./diff-viewer.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DiffViewerComponent {
  readonly oldText = input.required<string>();
  readonly newText = input.required<string>();
  readonly oldLabel = input('Original');
  readonly newLabel = input('Modified');
  readonly mode = input<DiffViewMode>('side-by-side');
  readonly showLineNumbers = input(true);
  readonly contextLines = input(Infinity);

  /**
   * Upper bound (per side, in lines) above which no diff is computed and a
   * "too large" notice is rendered instead — a UI diff of that size is neither
   * readable nor cheap. Raise it deliberately when you know the inputs.
   */
  readonly maxLines = input(20_000);

  private readonly oldLines = computed(() => this.oldText().split('\n'));
  private readonly newLines = computed(() => this.newText().split('\n'));
  protected readonly oldLineCount = computed(() => this.oldLines().length);
  protected readonly newLineCount = computed(() => this.newLines().length);

  /** True when either side exceeds `maxLines`; the diff is then skipped. */
  protected readonly tooLarge = computed(
    () => Math.max(this.oldLines().length, this.newLines().length) > this.maxLines(),
  );

  protected readonly diffLines = computed<DiffLine[]>(() => {
    if (this.tooLarge()) return [];
    return this.numberOps(diffLines(this.oldLines(), this.newLines()));
  });

  protected readonly filteredLines = computed(() => {
    const ctx = this.contextLines();
    const lines = this.diffLines();
    if (ctx === Infinity) return lines;

    const changed = new Set<number>();
    lines.forEach((l, i) => { if (l.type !== 'unchanged') changed.add(i); });

    const visible = new Set<number>();
    for (const idx of changed) {
      for (let j = Math.max(0, idx - ctx); j <= Math.min(lines.length - 1, idx + ctx); j++) {
        visible.add(j);
      }
    }

    return lines.filter((_, i) => visible.has(i));
  });

  protected readonly sideBySide = computed(() => {
    if (this.mode() !== 'side-by-side') return { left: [], right: [] };

    const lines = this.filteredLines();
    const left: { num: number | null; content: string; type: string }[] = [];
    const right: { num: number | null; content: string; type: string }[] = [];

    for (const line of lines) {
      if (line.type === 'unchanged') {
        left.push({ num: line.leftNum, content: line.content, type: 'unchanged' });
        right.push({ num: line.rightNum, content: line.content, type: 'unchanged' });
      } else if (line.type === 'removed') {
        left.push({ num: line.leftNum, content: line.content, type: 'removed' });
        right.push({ num: null, content: '', type: 'empty' });
      } else {
        left.push({ num: null, content: '', type: 'empty' });
        right.push({ num: line.rightNum, content: line.content, type: 'added' });
      }
    }

    return { left, right };
  });

  protected readonly stats = computed(() => {
    let additions = 0;
    let deletions = 0;
    for (const l of this.diffLines()) {
      if (l.type === 'added') additions++;
      else if (l.type === 'removed') deletions++;
    }
    return { additions, deletions };
  });

  /** Expand the edit script into numbered lines (removed before added). */
  private numberOps(ops: readonly DiffOp[]): DiffLine[] {
    const result: DiffLine[] = [];
    let i = 0, j = 0;
    for (const [type, lines] of ops) {
      for (const content of lines) {
        if (type === 'unchanged') result.push({ type, leftNum: ++i, rightNum: ++j, content });
        else if (type === 'removed') result.push({ type, leftNum: ++i, rightNum: null, content });
        else result.push({ type, leftNum: null, rightNum: ++j, content });
      }
    }
    return result;
  }
}

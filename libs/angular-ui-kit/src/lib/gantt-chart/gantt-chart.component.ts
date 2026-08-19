import {
  ChangeDetectionStrategy,
  Component,
  input,
  output,
  computed,
} from '@angular/core';

export interface GanttDependency {
  from: string;
  to: string;
}

export interface GanttTask {
  id: string;
  title: string;
  start: Date | string;
  end: Date | string;
  progress?: number;
  color?: 'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'info';
  group?: string;
}

interface NormalizedTask {
  id: string;
  title: string;
  start: Date;
  end: Date;
  progress: number;
  color: string;
  group: string;
}

interface BarLayout {
  task: NormalizedTask;
  left: number;
  width: number;
  top: number;
  progress: number;
  colorClass: string;
}

interface DepLine {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}

@Component({
  selector: 'lc-gantt-chart',
  standalone: true,
  templateUrl: './gantt-chart.component.html',
  styleUrls: ['./gantt-chart.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
/**
 * Gantt chart component for project timeline visualization.
 *
 * Features:
 * - Task bars with progress indicators
 * - Dependency lines with Bézier curves and arrowheads
 * - Monthly and daily header timeline
 * - Today marker line
 * - Weekend highlighting
 * - Configurable row height, label width, day width, locale and label header
 * - Task click event handling (bars are focusable, Enter / Space activate)
 *
 * @example
 * ```html
 * <lc-gantt-chart [tasks]="tasks" [dependencies]="deps" [showToday]="true" />
 * ```
 */
export class GanttChartComponent {
  private static nextId = 0;

  /**
   * Per-instance id for the SVG arrowhead marker. `<marker id>` is document
   * global, so two charts on one page must not share it.
   */
  protected readonly markerId = `lc-gantt-arrowhead-${++GanttChartComponent.nextId}`;

  /** Tasks to display. */
  tasks = input.required<GanttTask[]>();

  /** Dependency links between tasks. */
  dependencies = input<GanttDependency[]>([]);

  /** Row height in px. */
  rowHeight = input<number>(40);

  /** Width of the label column in px. */
  labelWidth = input<number>(200);

  /** Column width per day in px. */
  dayWidth = input<number>(36);

  /** Show today marker. */
  showToday = input<boolean>(true);

  /** BCP 47 locale used for the month header labels. */
  locale = input<string>('de-DE');

  /** Header text of the task label column. */
  labelsHeader = input<string>('Aufgaben');

  /** Emits when a task bar is clicked / activated via keyboard. */
  taskClick = output<GanttTask>();

  private readonly normalizedTasks = computed((): NormalizedTask[] =>
    this.tasks().map(t => ({
      id: t.id,
      title: t.title,
      start: t.start instanceof Date ? t.start : new Date(t.start),
      end: t.end instanceof Date ? t.end : new Date(t.end),
      progress: t.progress ?? 0,
      color: t.color ?? 'primary',
      group: t.group ?? '',
    }))
  );

  protected readonly timelineStart = computed(() => {
    const tasks = this.normalizedTasks();
    if (!tasks.length) return new Date();
    const min = Math.min(...tasks.map(t => t.start.getTime()));
    const d = new Date(min);
    d.setDate(d.getDate() - 2);
    return this.startOfDay(d);
  });

  protected readonly timelineEnd = computed(() => {
    const tasks = this.normalizedTasks();
    if (!tasks.length) return new Date();
    const max = Math.max(...tasks.map(t => t.end.getTime()));
    const d = new Date(max);
    d.setDate(d.getDate() + 3);
    return this.startOfDay(d);
  });

  protected readonly totalDays = computed(() => {
    const start = this.timelineStart();
    const end = this.timelineEnd();
    return Math.ceil((end.getTime() - start.getTime()) / 86400000) + 1;
  });

  protected readonly timelineWidth = computed(() => this.totalDays() * this.dayWidth());

  protected readonly dayColumns = computed(() => {
    const start = this.timelineStart();
    const days = this.totalDays();
    const dw = this.dayWidth();
    return Array.from({ length: days }, (_, i) => {
      const d = new Date(start);
      d.setDate(d.getDate() + i);
      return {
        date: d,
        left: i * dw,
        label: d.getDate(),
        isWeekend: d.getDay() === 0 || d.getDay() === 6,
        monthLabel: d.getDate() === 1 ? d.toLocaleDateString(this.locale(), { month: 'short' }) : null,
      };
    });
  });

  protected readonly monthHeaders = computed(() => {
    const cols = this.dayColumns();
    const dw = this.dayWidth();
    const locale = this.locale();
    const months: { label: string; left: number; width: number }[] = [];
    let current: { label: string; left: number; count: number } | null = null;

    for (const col of cols) {
      const label = col.date.toLocaleDateString(locale, { month: 'short', year: 'numeric' });
      if (!current || current.label !== label) {
        if (current) months.push({ label: current.label, left: current.left, width: current.count * dw });
        current = { label, left: col.left, count: 1 };
      } else {
        current.count++;
      }
    }
    if (current) months.push({ label: current.label, left: current.left, width: current.count * dw });
    return months;
  });

  protected readonly bars = computed((): BarLayout[] => {
    const tasks = this.normalizedTasks();
    const start = this.timelineStart().getTime();
    const dw = this.dayWidth();
    const rh = this.rowHeight();

    return tasks.map((t, i) => {
      const dayOffset = (t.start.getTime() - start) / 86400000;
      const duration = Math.max((t.end.getTime() - t.start.getTime()) / 86400000, 1);
      return {
        task: t,
        left: dayOffset * dw,
        width: duration * dw,
        top: i * rh,
        progress: Math.min(Math.max(t.progress, 0), 100),
        colorClass: t.color,
      };
    });
  });

  protected readonly depLines = computed((): DepLine[] => {
    const deps = this.dependencies();
    const barsMap = new Map<string, BarLayout>();
    for (const bar of this.bars()) barsMap.set(bar.task.id, bar);
    const rh = this.rowHeight();

    return deps
      .filter(d => barsMap.has(d.from) && barsMap.has(d.to))
      .map(d => {
        const from = barsMap.get(d.from)!;
        const to = barsMap.get(d.to)!;
        return {
          x1: from.left + from.width,
          y1: from.top + rh / 2,
          x2: to.left,
          y2: to.top + rh / 2,
        };
      });
  });

  protected readonly todayLeft = computed(() => {
    if (!this.showToday()) return -1;
    const start = this.timelineStart().getTime();
    const now = this.startOfDay(new Date()).getTime();
    const dayOffset = (now - start) / 86400000;
    if (dayOffset < 0 || dayOffset > this.totalDays()) return -1;
    return dayOffset * this.dayWidth();
  });

  protected readonly gridHeight = computed(() => this.normalizedTasks().length * this.rowHeight());

  protected onTaskClick(task: NormalizedTask): void {
    this.taskClick.emit(this.tasks().find(t => t.id === task.id)!);
  }

  protected onTaskKeydown(event: KeyboardEvent, task: NormalizedTask): void {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      this.onTaskClick(task);
    }
  }

  private startOfDay(d: Date): Date {
    return new Date(d.getFullYear(), d.getMonth(), d.getDate());
  }
}

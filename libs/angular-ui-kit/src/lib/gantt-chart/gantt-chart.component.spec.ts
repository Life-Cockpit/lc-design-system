import { ComponentFixture, TestBed } from '@angular/core/testing';
import { GanttChartComponent } from './gantt-chart.component';

describe('GanttChartComponent', () => {
  let fixture: ComponentFixture<GanttChartComponent>;

  const tasks = [
    { id: '1', title: 'Design', start: '2025-01-06', end: '2025-01-12', progress: 100, color: 'primary' as const },
    { id: '2', title: 'Development', start: '2025-01-10', end: '2025-01-20', progress: 60, color: 'info' as const },
    { id: '3', title: 'Testing', start: '2025-01-18', end: '2025-01-25', progress: 0, color: 'warning' as const },
  ];

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [GanttChartComponent] }).compileComponents();
    fixture = TestBed.createComponent(GanttChartComponent);
  });

  it('should create', () => {
    fixture.componentRef.setInput('tasks', tasks);
    fixture.detectChanges();
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should render task bars', () => {
    fixture.componentRef.setInput('tasks', tasks);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelectorAll('.lc-gantt__bar').length).toBe(3);
  });

  it('should render task labels', () => {
    fixture.componentRef.setInput('tasks', tasks);
    fixture.detectChanges();
    const labels = fixture.nativeElement.querySelectorAll('.lc-gantt__label-text');
    expect(labels.length).toBe(3);
    expect(labels[0].textContent).toContain('Design');
  });

  it('should render dependency lines', () => {
    fixture.componentRef.setInput('tasks', tasks);
    fixture.componentRef.setInput('dependencies', [{ from: '1', to: '2' }]);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.lc-gantt__dep-line')).toBeTruthy();
  });

  it('should render today marker', () => {
    const today = new Date();
    const start = new Date(today);
    start.setDate(start.getDate() - 5);
    const end = new Date(today);
    end.setDate(end.getDate() + 5);
    fixture.componentRef.setInput('tasks', [
      { id: '1', title: 'Ongoing', start, end },
    ]);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.lc-gantt__today')).toBeTruthy();
  });

  it('should show progress fill', () => {
    fixture.componentRef.setInput('tasks', [tasks[0]]);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.lc-gantt__bar-progress')).toBeTruthy();
  });

  it('should render month headers', () => {
    fixture.componentRef.setInput('tasks', tasks);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelectorAll('.lc-gantt__month-cell').length).toBeGreaterThanOrEqual(1);
  });

  it('uses a per-instance arrowhead marker id shared by marker and lines', () => {
    fixture.componentRef.setInput('tasks', tasks);
    fixture.componentRef.setInput('dependencies', [{ from: '1', to: '2' }]);
    fixture.detectChanges();

    const other = TestBed.createComponent(GanttChartComponent);
    other.componentRef.setInput('tasks', tasks);
    other.componentRef.setInput('dependencies', [{ from: '1', to: '2' }]);
    other.detectChanges();

    const markerA = fixture.nativeElement.querySelector('marker') as SVGMarkerElement;
    const markerB = other.nativeElement.querySelector('marker') as SVGMarkerElement;
    expect(markerA.id).toMatch(/^lc-gantt-arrowhead-\d+$/);
    expect(markerA.id).not.toBe(markerB.id);
    const line = fixture.nativeElement.querySelector('.lc-gantt__dep-line') as SVGPathElement;
    expect(line.getAttribute('marker-end')).toBe(`url(#${markerA.id})`);
  });

  it('renders the label header and month labels from inputs (defaults: Aufgaben / de-DE)', () => {
    fixture.componentRef.setInput('tasks', tasks);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.lc-gantt__labels-header').textContent.trim()).toBe('Aufgaben');
    expect(fixture.nativeElement.querySelector('.lc-gantt__month-cell').textContent).toContain('Jan');

    fixture.componentRef.setInput('labelsHeader', 'Tasks');
    fixture.componentRef.setInput('locale', 'en-US');
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.lc-gantt__labels-header').textContent.trim()).toBe('Tasks');
    expect(fixture.nativeElement.querySelector('.lc-gantt__month-cell').textContent).toContain('Jan 2025');
  });

  it('task bars are keyboard operable and emit taskClick on Enter / Space', () => {
    fixture.componentRef.setInput('tasks', tasks);
    fixture.detectChanges();
    const clicks: string[] = [];
    fixture.componentInstance.taskClick.subscribe(t => clicks.push(t.id));

    const bar = fixture.nativeElement.querySelector('.lc-gantt__bar') as HTMLElement;
    expect(bar.getAttribute('role')).toBe('button');
    expect(bar.getAttribute('tabindex')).toBe('0');
    expect(bar.getAttribute('aria-label')).toContain('Design');

    const enter = new KeyboardEvent('keydown', { key: 'Enter', bubbles: true, cancelable: true });
    bar.dispatchEvent(enter);
    bar.dispatchEvent(new KeyboardEvent('keydown', { key: ' ', bubbles: true }));
    bar.click();

    expect(enter.defaultPrevented).toBe(true);
    expect(clicks).toEqual(['1', '1', '1']);
  });
});

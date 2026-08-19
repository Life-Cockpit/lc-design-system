import { ComponentFixture, TestBed } from '@angular/core/testing';
import { LineChartComponent } from './line-chart.component';

describe('LineChartComponent', () => {
  let component: LineChartComponent;
  let fixture: ComponentFixture<LineChartComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LineChartComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(LineChartComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    fixture.componentRef.setInput('series', [
      { label: 'A', data: [1, 2, 3] },
    ]);
    fixture.detectChanges();
    expect(component).toBeTruthy();
  });

  it('should render a line path for each series', () => {
    fixture.componentRef.setInput('series', [
      { label: 'Revenue', data: [10, 20, 30, 25] },
      { label: 'Costs', data: [5, 15, 10, 20] },
    ]);
    fixture.detectChanges();
    const paths = fixture.nativeElement.querySelectorAll('.lc-line-chart__line');
    expect(paths.length).toBe(2);
  });

  it('should render dots by default', () => {
    fixture.componentRef.setInput('series', [
      { label: 'A', data: [1, 2, 3] },
    ]);
    fixture.detectChanges();
    const dots = fixture.nativeElement.querySelectorAll('.lc-line-chart__dot');
    expect(dots.length).toBe(3);
  });

  it('should hide dots when showDots is false', () => {
    fixture.componentRef.setInput('series', [
      { label: 'A', data: [1, 2, 3] },
    ]);
    fixture.componentRef.setInput('showDots', false);
    fixture.detectChanges();
    const dots = fixture.nativeElement.querySelectorAll('.lc-line-chart__dot');
    expect(dots.length).toBe(0);
  });

  it('should render area when filled is true', () => {
    fixture.componentRef.setInput('series', [
      { label: 'A', data: [1, 2, 3] },
    ]);
    fixture.componentRef.setInput('filled', true);
    fixture.detectChanges();
    const area = fixture.nativeElement.querySelector('.lc-line-chart__area');
    expect(area).toBeTruthy();
  });

  it('should show grid lines by default', () => {
    fixture.componentRef.setInput('series', [
      { label: 'A', data: [10, 20, 30] },
    ]);
    fixture.detectChanges();
    const lines = fixture.nativeElement.querySelectorAll('.lc-line-chart__grid-line');
    expect(lines.length).toBeGreaterThan(0);
  });

  it('should render x-axis labels', () => {
    fixture.componentRef.setInput('series', [
      { label: 'A', data: [1, 2, 3] },
    ]);
    fixture.componentRef.setInput('labels', ['Jan', 'Feb', 'Mar']);
    fixture.detectChanges();
    const labels = fixture.nativeElement.querySelectorAll('.lc-line-chart__x-label');
    expect(labels.length).toBe(3);
  });

  it('should render legend when showLegend is true', () => {
    fixture.componentRef.setInput('series', [
      { label: 'Revenue', data: [10, 20] },
      { label: 'Costs', data: [5, 15] },
    ]);
    fixture.componentRef.setInput('showLegend', true);
    fixture.detectChanges();
    const items = fixture.nativeElement.querySelectorAll('.lc-line-chart__legend-item');
    expect(items.length).toBe(2);
  });

  it('should respect custom dimensions', () => {
    fixture.componentRef.setInput('series', [
      { label: 'A', data: [1, 2] },
    ]);
    fixture.componentRef.setInput('width', 500);
    fixture.componentRef.setInput('height', 300);
    fixture.detectChanges();
    const svg = fixture.nativeElement.querySelector('svg');
    expect(svg.getAttribute('width')).toBe('100%');
    expect(svg.getAttribute('height')).toBe('300');
    expect(svg.getAttribute('viewBox')).toBe('0 0 500 300');
  });

  describe('scale and edge cases', () => {
    const texts = (sel: string) =>
      Array.from(fixture.nativeElement.querySelectorAll(sel) as NodeListOf<SVGTextElement>).map((t) => t.textContent!.trim());
    const paths = () => Array.from(fixture.nativeElement.querySelectorAll('path') as NodeListOf<SVGPathElement>).map((p) => p.getAttribute('d') ?? '');

    it('labels the grid with nice, float-clean ticks that bound the data', () => {
      fixture.componentRef.setInput('series', [{ label: 'A', data: [0.1, 0.2, 0.3] }]);
      fixture.detectChanges();
      const labels = texts('.lc-line-chart__y-label');
      expect(labels).toEqual(['0.1', '0.15', '0.2', '0.25', '0.3']);
      const ys = Array.from(fixture.nativeElement.querySelectorAll('.lc-line-chart__grid-line') as NodeListOf<SVGLineElement>).map((l) => Number(l.getAttribute('y1')));
      // Outermost ticks sit on the plot edges (PT = 10, height 200 - PB 30 = 170).
      expect(Math.min(...ys)).toBe(10);
      expect(Math.max(...ys)).toBe(170);
    });

    it('respects yMin and rounds it into the scale', () => {
      fixture.componentRef.setInput('series', [{ label: 'A', data: [12, 18, 15] }]);
      fixture.componentRef.setInput('yMin', 0);
      fixture.detectChanges();
      expect(texts('.lc-line-chart__y-label')[0]).toBe('0');
    });

    it('renders no NaN for empty inner arrays and single points', () => {
      fixture.componentRef.setInput('series', [{ label: 'A', data: [] }, { label: 'B', data: [5] }]);
      fixture.componentRef.setInput('filled', true);
      fixture.detectChanges();
      expect(paths().join(' ')).not.toMatch(/NaN|Infinity/);
      expect(texts('svg text').join('|')).not.toMatch(/NaN|Infinity/);
      // A single point is a dot without a line.
      expect(fixture.nativeElement.querySelectorAll('.lc-line-chart__line').length).toBe(0);
      expect(fixture.nativeElement.querySelectorAll('.lc-line-chart__dot').length).toBe(1);
    });

    it('coerces NaN / undefined values instead of breaking the path', () => {
      fixture.componentRef.setInput('series', [{ label: 'A', data: [1, NaN, undefined as unknown as number, 4] }]);
      fixture.detectChanges();
      expect(paths().join(' ')).not.toMatch(/NaN|undefined/);
      expect(fixture.nativeElement.querySelectorAll('.lc-line-chart__dot').length).toBe(4);
    });

    it('draws the dot halo in the surface colour', () => {
      fixture.componentRef.setInput('series', [{ label: 'A', data: [1, 2] }]);
      fixture.detectChanges();
      expect(fixture.nativeElement.querySelector('.lc-line-chart__dot').getAttribute('stroke')).toBe('var(--color-surface)');
    });

    it('formats ticks through formatValue', () => {
      fixture.componentRef.setInput('series', [{ label: 'A', data: [0, 1] }]);
      fixture.componentRef.setInput('formatValue', (v: number) => `${v * 100}%`);
      fixture.detectChanges();
      expect(texts('.lc-line-chart__y-label').pop()).toBe('100%');
    });

    it('does not throw on duplicate series labels', () => {
      fixture.componentRef.setInput('series', [{ label: 'X', data: [1, 2] }, { label: 'X', data: [2, 3] }]);
      expect(() => fixture.detectChanges()).not.toThrow();
      expect(fixture.nativeElement.querySelectorAll('.lc-line-chart__line').length).toBe(2);
    });
  });

  describe('accessibility and width', () => {
    it('generates a summary with series names, point counts and ranges', () => {
      fixture.componentRef.setInput('series', [{ label: 'Rev', data: [20, 80, 50] }, { label: 'Cost', data: [15] }]);
      fixture.detectChanges();
      const svg = fixture.nativeElement.querySelector('svg');
      expect(svg.getAttribute('aria-label')).toBe('Line chart: Rev (3 points, 20 to 80), Cost (1 point, 15 to 15)');
      expect(svg.querySelector('title').textContent).toBe('Line chart: Rev (3 points, 20 to 80), Cost (1 point, 15 to 15)');
    });

    it('lets ariaLabel override the summary', () => {
      fixture.componentRef.setInput('series', [{ label: 'A', data: [1] }]);
      fixture.componentRef.setInput('ariaLabel', 'Trend');
      fixture.detectChanges();
      expect(fixture.nativeElement.querySelector('svg').getAttribute('aria-label')).toBe('Trend');
    });

    it('caps the host at width when set', () => {
      fixture.componentRef.setInput('series', [{ label: 'A', data: [1, 2] }]);
      fixture.detectChanges();
      expect(fixture.nativeElement.style.maxWidth).toBe('');
      fixture.componentRef.setInput('width', 500);
      fixture.detectChanges();
      expect(fixture.nativeElement.style.maxWidth).toBe('500px');
    });
  });
});

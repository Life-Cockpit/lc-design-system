import { ComponentFixture, TestBed } from '@angular/core/testing';
import { StackedBarChartComponent } from './stacked-bar-chart.component';

describe('StackedBarChartComponent', () => {
  let fixture: ComponentFixture<StackedBarChartComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [StackedBarChartComponent] }).compileComponents();
    fixture = TestBed.createComponent(StackedBarChartComponent);
  });

  it('should create', () => {
    fixture.componentRef.setInput('categories', [{ label: 'A', values: [10, 20] }]);
    fixture.detectChanges();
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should render segments for stacked values', () => {
    fixture.componentRef.setInput('categories', [
      { label: 'Q1', values: [30, 20, 10] },
      { label: 'Q2', values: [25, 30, 15] },
    ]);
    fixture.detectChanges();
    const segs = fixture.nativeElement.querySelectorAll('.lc-stacked-bar-chart__segment');
    expect(segs.length).toBe(6);
  });

  it('should render legend when legends provided', () => {
    fixture.componentRef.setInput('categories', [{ label: 'A', values: [10, 20] }]);
    fixture.componentRef.setInput('legends', [{ label: 'X' }, { label: 'Y' }]);
    fixture.detectChanges();
    const items = fixture.nativeElement.querySelectorAll('.lc-stacked-bar-chart__legend-item');
    expect(items.length).toBe(2);
  });

  it('should render labels', () => {
    fixture.componentRef.setInput('categories', [{ label: 'Jan', values: [10] }]);
    fixture.detectChanges();
    const label = fixture.nativeElement.querySelector('.lc-stacked-bar-chart__label');
    expect(label.textContent).toContain('Jan');
  });

  it('should handle empty categories', () => {
    fixture.componentRef.setInput('categories', []);
    fixture.detectChanges();
    const segs = fixture.nativeElement.querySelectorAll('.lc-stacked-bar-chart__segment');
    expect(segs.length).toBe(0);
  });

  describe('scale, values and edge cases', () => {
    const texts = (sel: string) =>
      Array.from(fixture.nativeElement.querySelectorAll(sel) as NodeListOf<SVGTextElement>).map((t) => t.textContent!.trim());
    const segs = () => Array.from(fixture.nativeElement.querySelectorAll('.lc-stacked-bar-chart__segment') as NodeListOf<SVGRectElement>);

    it('puts grid and segments on one scale: the top tick equals the value at the plot top', () => {
      fixture.componentRef.setInput('categories', [{ label: 'A', values: [60, 30] }, { label: 'B', values: [50, 50] }]);
      fixture.componentRef.setInput('height', 200);
      fixture.detectChanges();
      const labels = texts('.lc-stacked-bar-chart__grid-label');
      expect(labels[labels.length - 1]).toBe('100');
      const gridLines = fixture.nativeElement.querySelectorAll('.lc-stacked-bar-chart__grid');
      expect(Number(gridLines[gridLines.length - 1].getAttribute('y1'))).toBe(10);
      // Stack B totals 100 → its top segment starts at the plot top; A (90) stays below.
      const topOfB = Math.min(...segs().slice(2).map((r) => Number(r.getAttribute('y'))));
      const topOfA = Math.min(...segs().slice(0, 2).map((r) => Number(r.getAttribute('y'))));
      expect(topOfB).toBeCloseTo(10, 5);
      expect(topOfA).toBeGreaterThan(10);
    });

    it('renders segment values and stack totals when showValues is set', () => {
      fixture.componentRef.setInput('categories', [{ label: 'A', values: [60, 40] }]);
      fixture.componentRef.setInput('showValues', true);
      fixture.componentRef.setInput('height', 240);
      fixture.detectChanges();
      expect(texts('.lc-stacked-bar-chart__segment-value')).toEqual(['60', '40']);
      expect(texts('.lc-stacked-bar-chart__total')).toEqual(['100']);
    });

    it('renders no value labels by default', () => {
      fixture.componentRef.setInput('categories', [{ label: 'A', values: [60, 40] }]);
      fixture.detectChanges();
      expect(fixture.nativeElement.querySelector('.lc-stacked-bar-chart__segment-value')).toBeNull();
      expect(fixture.nativeElement.querySelector('.lc-stacked-bar-chart__total')).toBeNull();
    });

    it('stacks negative values below the zero baseline with non-negative sizes', () => {
      fixture.componentRef.setInput('categories', [{ label: 'A', values: [40, -15] }, { label: 'B', values: [-30, 10] }]);
      fixture.componentRef.setInput('showValues', true);
      fixture.detectChanges();
      for (const r of segs()) {
        expect(Number(r.getAttribute('height'))).toBeGreaterThan(0);
        expect(Number(r.getAttribute('width'))).toBeGreaterThan(0);
      }
      const baselineY = Number(fixture.nativeElement.querySelectorAll('.lc-stacked-bar-chart__axis')[1].getAttribute('y1'));
      expect(baselineY).toBeGreaterThan(10);
      expect(baselineY).toBeLessThan(170);
      // A's negative segment starts at the baseline; totals are the signed sums.
      expect(Number(segs()[1].getAttribute('y'))).toBeCloseTo(baselineY, 5);
      expect(texts('.lc-stacked-bar-chart__total')).toEqual(['25', '-20']);
      expect(texts('svg text').join('|')).not.toMatch(/NaN|Infinity/);
    });

    it('survives empty value arrays, all-zero and NaN values', () => {
      fixture.componentRef.setInput('categories', [{ label: 'A', values: [] }, { label: 'B', values: [0, 0] }, { label: 'C', values: [NaN, undefined as unknown as number] }]);
      fixture.componentRef.setInput('showValues', true);
      fixture.detectChanges();
      for (const r of segs()) expect(Number(r.getAttribute('height'))).toBeGreaterThanOrEqual(0);
      expect(texts('svg text').join('|')).not.toMatch(/NaN|Infinity|undefined/);
    });

    it('formats ticks, values and totals through formatValue', () => {
      fixture.componentRef.setInput('categories', [{ label: 'A', values: [0.5, 0.5] }]);
      fixture.componentRef.setInput('showValues', true);
      fixture.componentRef.setInput('formatValue', (v: number) => `${v * 100}%`);
      fixture.detectChanges();
      expect(texts('.lc-stacked-bar-chart__total')).toEqual(['100%']);
      expect(texts('.lc-stacked-bar-chart__grid-label').pop()).toBe('100%');
    });
  });

  describe('accessibility', () => {
    it('generates a summary with series names and totals, plus a <title>', () => {
      fixture.componentRef.setInput('categories', [{ label: 'Q1', values: [30, 20] }, { label: 'Q2', values: [25, 35] }]);
      fixture.componentRef.setInput('legends', [{ label: 'A' }, { label: 'B' }]);
      fixture.detectChanges();
      const svg = fixture.nativeElement.querySelector('svg');
      expect(svg.getAttribute('aria-label')).toBe('Stacked bar chart (A, B): Q1 50, Q2 60');
      expect(svg.querySelector('title').textContent).toBe('Stacked bar chart (A, B): Q1 50, Q2 60');
    });

    it('lets ariaLabel override the summary', () => {
      fixture.componentRef.setInput('categories', [{ label: 'Q1', values: [1] }]);
      fixture.componentRef.setInput('ariaLabel', 'Custom');
      fixture.detectChanges();
      expect(fixture.nativeElement.querySelector('svg').getAttribute('aria-label')).toBe('Custom');
    });
  });
});

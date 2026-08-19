import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AreaChartComponent } from './area-chart.component';

describe('AreaChartComponent', () => {
  let fixture: ComponentFixture<AreaChartComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [AreaChartComponent] }).compileComponents();
    fixture = TestBed.createComponent(AreaChartComponent);
  });

  it('should create', () => {
    fixture.componentRef.setInput('series', [{ label: 'A', data: [1, 2, 3] }]);
    fixture.detectChanges();
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should render area path', () => {
    fixture.componentRef.setInput('series', [{ label: 'A', data: [10, 20, 15] }]);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.lc-area-chart__area')).toBeTruthy();
  });

  it('should render line path', () => {
    fixture.componentRef.setInput('series', [{ label: 'A', data: [10, 20, 15] }]);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.lc-area-chart__line')).toBeTruthy();
  });

  it('should render multiple series', () => {
    fixture.componentRef.setInput('series', [
      { label: 'A', data: [1, 2] },
      { label: 'B', data: [3, 4] },
    ]);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelectorAll('.lc-area-chart__line').length).toBe(2);
  });

  it('should show legend when enabled', () => {
    fixture.componentRef.setInput('series', [{ label: 'Rev', data: [1, 2] }]);
    fixture.componentRef.setInput('showLegend', true);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.lc-area-chart__legend-item')).toBeTruthy();
  });

  it('should render x labels', () => {
    fixture.componentRef.setInput('series', [{ label: 'A', data: [1, 2, 3] }]);
    fixture.componentRef.setInput('labels', ['Jan', 'Feb', 'Mar']);
    fixture.detectChanges();
    const labels = fixture.nativeElement.querySelectorAll('.lc-area-chart__axis-label');
    expect(labels.length).toBeGreaterThan(0);
  });

  describe('scale and edge cases', () => {
    const texts = (sel: string) =>
      Array.from(fixture.nativeElement.querySelectorAll(sel) as NodeListOf<SVGTextElement>).map((t) => t.textContent!.trim());
    const paths = () => Array.from(fixture.nativeElement.querySelectorAll('path') as NodeListOf<SVGPathElement>).map((p) => p.getAttribute('d') ?? '');

    it('renders finite grid labels for a series with an empty data array', () => {
      fixture.componentRef.setInput('series', [{ label: 'A', data: [] }]);
      fixture.detectChanges();
      const labels = texts('.lc-area-chart__axis-label');
      expect(labels.length).toBeGreaterThan(0);
      expect(labels.join('|')).not.toMatch(/NaN|Infinity/);
      expect(fixture.nativeElement.querySelectorAll('.lc-area-chart__area').length).toBe(0);
    });

    it('handles an empty series inside a stacked chart and NaN values', () => {
      fixture.componentRef.setInput('series', [{ label: 'A', data: [1, NaN, 3] }, { label: 'B', data: [] }]);
      fixture.componentRef.setInput('stacked', true);
      fixture.componentRef.setInput('showDots', true);
      fixture.detectChanges();
      expect(paths().join(' ')).not.toMatch(/NaN|Infinity/);
      expect(texts('svg text').join('|')).not.toMatch(/NaN|Infinity/);
    });

    it('draws a single point as a dot without area or line', () => {
      fixture.componentRef.setInput('series', [{ label: 'A', data: [7] }]);
      fixture.componentRef.setInput('showDots', true);
      fixture.detectChanges();
      expect(fixture.nativeElement.querySelectorAll('.lc-area-chart__line').length).toBe(0);
      expect(fixture.nativeElement.querySelectorAll('.lc-area-chart__area').length).toBe(0);
      expect(fixture.nativeElement.querySelectorAll('.lc-area-chart__dot').length).toBe(1);
    });

    it('labels the grid with nice, float-clean ticks', () => {
      fixture.componentRef.setInput('series', [{ label: 'A', data: [0.1, 0.2, 0.3] }]);
      fixture.detectChanges();
      const labels = texts('.lc-area-chart__axis-label');
      expect(labels).toEqual(['0', '0.1', '0.2', '0.3']);
    });

    it('extends the scale below zero for negative data', () => {
      fixture.componentRef.setInput('series', [{ label: 'A', data: [-5, 10] }]);
      fixture.detectChanges();
      const labels = texts('.lc-area-chart__axis-label');
      expect(labels[0].startsWith('-')).toBe(true);
      expect(labels).toContain('0');
    });

    it('formats ticks through formatValue and draws the dot halo in the surface colour', () => {
      fixture.componentRef.setInput('series', [{ label: 'A', data: [0, 1] }]);
      fixture.componentRef.setInput('formatValue', (v: number) => `${v * 100}%`);
      fixture.componentRef.setInput('showDots', true);
      fixture.detectChanges();
      expect(texts('.lc-area-chart__axis-label').pop()).toBe('100%');
      expect(fixture.nativeElement.querySelector('.lc-area-chart__dot').getAttribute('stroke')).toBe('var(--color-surface)');
    });
  });

  describe('accessibility and width', () => {
    it('generates a data-bearing summary and <title>', () => {
      fixture.componentRef.setInput('series', [{ label: 'A', data: [1, 2, 3] }]);
      fixture.detectChanges();
      const svg = fixture.nativeElement.querySelector('svg');
      expect(svg.getAttribute('aria-label')).toBe('Area chart: A (3 points, 1 to 3)');
      expect(svg.querySelector('title').textContent).toBe('Area chart: A (3 points, 1 to 3)');
    });

    it('names a stacked chart as such and honours ariaLabel', () => {
      fixture.componentRef.setInput('series', [{ label: 'A', data: [1, 2] }]);
      fixture.componentRef.setInput('stacked', true);
      fixture.detectChanges();
      expect(fixture.nativeElement.querySelector('svg').getAttribute('aria-label')).toMatch(/^Stacked area chart/);
      fixture.componentRef.setInput('ariaLabel', 'Custom');
      fixture.detectChanges();
      expect(fixture.nativeElement.querySelector('svg').getAttribute('aria-label')).toBe('Custom');
    });

    it('caps the host at width when set', () => {
      fixture.componentRef.setInput('series', [{ label: 'A', data: [1, 2] }]);
      fixture.componentRef.setInput('width', 480);
      fixture.detectChanges();
      expect(fixture.nativeElement.style.maxWidth).toBe('480px');
    });
  });
});

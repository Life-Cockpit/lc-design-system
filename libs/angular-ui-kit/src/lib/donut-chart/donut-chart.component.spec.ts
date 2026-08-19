import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DonutChartComponent } from './donut-chart.component';

describe('DonutChartComponent', () => {
  let component: DonutChartComponent;
  let fixture: ComponentFixture<DonutChartComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DonutChartComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(DonutChartComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    fixture.componentRef.setInput('segments', [{ value: 50, label: 'A' }]);
    fixture.detectChanges();
    expect(component).toBeTruthy();
  });

  it('should render segments as paths', () => {
    fixture.componentRef.setInput('segments', [
      { value: 60, label: 'A' },
      { value: 40, label: 'B' },
    ]);
    fixture.detectChanges();
    const paths = fixture.nativeElement.querySelectorAll('.lc-donut-chart__segment');
    expect(paths.length).toBe(2);
  });

  it('should display center value', () => {
    fixture.componentRef.setInput('segments', [{ value: 100, label: 'All' }]);
    fixture.componentRef.setInput('centerValue', '100');
    fixture.detectChanges();
    const text = fixture.nativeElement.querySelector('.lc-donut-chart__center-value');
    expect(text.textContent).toContain('100');
  });

  it('should display center label', () => {
    fixture.componentRef.setInput('segments', [{ value: 100, label: 'All' }]);
    fixture.componentRef.setInput('centerValue', '100');
    fixture.componentRef.setInput('centerLabel', 'Total');
    fixture.detectChanges();
    const text = fixture.nativeElement.querySelector('.lc-donut-chart__center-label');
    expect(text.textContent).toContain('Total');
  });

  it('should render legend when showLegend is true', () => {
    fixture.componentRef.setInput('segments', [
      { value: 60, label: 'Apples' },
      { value: 40, label: 'Oranges' },
    ]);
    fixture.componentRef.setInput('showLegend', true);
    fixture.detectChanges();
    const items = fixture.nativeElement.querySelectorAll('.lc-donut-chart__legend-item');
    expect(items.length).toBe(2);
  });

  it('should not render legend by default', () => {
    fixture.componentRef.setInput('segments', [{ value: 100, label: 'All' }]);
    fixture.detectChanges();
    const legend = fixture.nativeElement.querySelector('.lc-donut-chart__legend');
    expect(legend).toBeFalsy();
  });

  it('should handle empty segments', () => {
    fixture.componentRef.setInput('segments', []);
    fixture.detectChanges();
    const paths = fixture.nativeElement.querySelectorAll('.lc-donut-chart__segment');
    expect(paths.length).toBe(0);
  });

  it('should use custom colors from segments', () => {
    fixture.componentRef.setInput('segments', [
      { value: 50, label: 'A', color: '#ff0000' },
    ]);
    fixture.detectChanges();
    const path = fixture.nativeElement.querySelector('.lc-donut-chart__segment');
    expect(path.getAttribute('fill')).toBe('#ff0000');
  });

  describe('edge cases', () => {
    const d = () => Array.from(fixture.nativeElement.querySelectorAll('.lc-donut-chart__segment') as NodeListOf<SVGPathElement>).map((p) => p.getAttribute('d')!);

    it('draws a single segment as a full ring (two outer and two inner arcs)', () => {
      fixture.componentRef.setInput('segments', [{ value: 100, label: 'All' }]);
      fixture.detectChanges();
      const [path] = d();
      expect((path.match(/A/g) ?? []).length).toBe(4);
      expect(path).not.toMatch(/NaN/);
      // A single "M … A … L … A … Z" wedge with start === end would collapse; assert the ring form instead.
      expect(path).not.toContain('L');
    });

    it('draws a full ring when one of several segments holds 100%', () => {
      fixture.componentRef.setInput('segments', [{ value: 0, label: 'A' }, { value: 50, label: 'B' }]);
      fixture.detectChanges();
      expect(d().length).toBe(2);
      expect(d().join(' ')).not.toMatch(/NaN/);
    });

    it('treats NaN and negative values as zero', () => {
      fixture.componentRef.setInput('segments', [{ value: NaN, label: 'A' }, { value: -5, label: 'B' }, { value: 10, label: 'C' }]);
      fixture.componentRef.setInput('showLegend', true);
      fixture.detectChanges();
      expect(d().join(' ')).not.toMatch(/NaN/);
      const pcts = Array.from(fixture.nativeElement.querySelectorAll('.lc-donut-chart__legend-pct') as NodeListOf<HTMLElement>).map((e) => e.textContent!.trim());
      expect(pcts).toEqual(['0%', '0%', '100%']);
    });

    it('does not throw on duplicate or missing labels', () => {
      fixture.componentRef.setInput('segments', [{ value: 1, label: 'X' }, { value: 2, label: 'X' }, { value: 3 }]);
      fixture.componentRef.setInput('showLegend', true);
      expect(() => fixture.detectChanges()).not.toThrow();
      expect(d().length).toBe(3);
    });
  });

  describe('accessibility', () => {
    it('generates a summary with segment shares and a <title>', () => {
      fixture.componentRef.setInput('segments', [{ value: 40, label: 'A' }, { value: 60, label: 'B' }]);
      fixture.detectChanges();
      const svg = fixture.nativeElement.querySelector('svg');
      expect(svg.getAttribute('aria-label')).toBe('Donut chart: A 40%, B 60%');
      expect(svg.querySelector('title').textContent).toBe('Donut chart: A 40%, B 60%');
    });

    it('lets ariaLabel override the summary and reports no data', () => {
      fixture.componentRef.setInput('segments', []);
      fixture.detectChanges();
      expect(fixture.nativeElement.querySelector('svg').getAttribute('aria-label')).toBe('Donut chart: no data');
      fixture.componentRef.setInput('ariaLabel', 'Share of visits');
      fixture.detectChanges();
      expect(fixture.nativeElement.querySelector('svg').getAttribute('aria-label')).toBe('Share of visits');
    });
  });
});

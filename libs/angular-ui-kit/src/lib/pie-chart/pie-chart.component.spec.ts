import { ComponentFixture, TestBed } from '@angular/core/testing';
import { PieChartComponent } from './pie-chart.component';

describe('PieChartComponent', () => {
  let fixture: ComponentFixture<PieChartComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [PieChartComponent] }).compileComponents();
    fixture = TestBed.createComponent(PieChartComponent);
  });

  it('should create', () => {
    fixture.componentRef.setInput('segments', [{ value: 50, label: 'A' }]);
    fixture.detectChanges();
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should render segment paths', () => {
    fixture.componentRef.setInput('segments', [{ value: 60, label: 'A' }, { value: 40, label: 'B' }]);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelectorAll('.lc-pie-chart__segment').length).toBe(2);
  });

  it('should show legend when enabled', () => {
    fixture.componentRef.setInput('segments', [{ value: 50, label: 'A' }, { value: 50, label: 'B' }]);
    fixture.componentRef.setInput('showLegend', true);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelectorAll('.lc-pie-chart__legend-item').length).toBe(2);
  });

  it('should handle single segment', () => {
    fixture.componentRef.setInput('segments', [{ value: 100, label: 'All' }]);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.lc-pie-chart__segment')).toBeTruthy();
  });

  describe('edge cases and accessibility', () => {
    const d = () => Array.from(fixture.nativeElement.querySelectorAll('.lc-pie-chart__segment') as NodeListOf<SVGPathElement>).map((p) => p.getAttribute('d')!);

    it('draws a single segment as a full circle without NaN', () => {
      fixture.componentRef.setInput('segments', [{ value: 100, label: 'All' }]);
      fixture.detectChanges();
      expect((d()[0].match(/A/g) ?? []).length).toBe(2);
      expect(d()[0]).not.toMatch(/NaN/);
    });

    it('treats NaN and negative values as zero', () => {
      fixture.componentRef.setInput('segments', [{ value: NaN, label: 'A' }, { value: -1, label: 'B' }, { value: 4, label: 'C' }]);
      fixture.componentRef.setInput('showLegend', true);
      fixture.detectChanges();
      expect(d().join(' ')).not.toMatch(/NaN/);
      const pcts = Array.from(fixture.nativeElement.querySelectorAll('.lc-pie-chart__legend-pct') as NodeListOf<HTMLElement>).map((e) => e.textContent!.trim());
      expect(pcts).toEqual(['0%', '0%', '100%']);
    });

    it('does not throw on duplicate labels', () => {
      fixture.componentRef.setInput('segments', [{ value: 1, label: 'X' }, { value: 1, label: 'X' }]);
      fixture.componentRef.setInput('showLegend', true);
      expect(() => fixture.detectChanges()).not.toThrow();
    });

    it('generates a summary with segment shares, a <title>, and honours ariaLabel', () => {
      fixture.componentRef.setInput('segments', [{ value: 1, label: 'A' }, { value: 3, label: 'B' }]);
      fixture.detectChanges();
      const svg = fixture.nativeElement.querySelector('svg');
      expect(svg.getAttribute('aria-label')).toBe('Pie chart: A 25%, B 75%');
      expect(svg.querySelector('title').textContent).toBe('Pie chart: A 25%, B 75%');
      fixture.componentRef.setInput('ariaLabel', 'Votes');
      fixture.detectChanges();
      expect(svg.getAttribute('aria-label')).toBe('Votes');
    });
  });
});

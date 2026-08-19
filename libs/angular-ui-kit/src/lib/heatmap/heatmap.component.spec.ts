import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HeatmapComponent } from './heatmap.component';

describe('HeatmapComponent', () => {
  let fixture: ComponentFixture<HeatmapComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [HeatmapComponent] }).compileComponents();
    fixture = TestBed.createComponent(HeatmapComponent);
  });

  it('should create', () => {
    fixture.componentRef.setInput('data', [[1, 2], [3, 4]]);
    fixture.detectChanges();
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should render cells for each data point', () => {
    fixture.componentRef.setInput('data', [[1, 2, 3], [4, 5, 6]]);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelectorAll('.lc-heatmap__cell').length).toBe(6);
  });

  it('should show row labels', () => {
    fixture.componentRef.setInput('data', [[1], [2]]);
    fixture.componentRef.setInput('rowLabels', ['Mon', 'Tue']);
    fixture.detectChanges();
    const labels = fixture.nativeElement.querySelectorAll('.lc-heatmap__label');
    expect(labels.length).toBe(2);
  });

  it('should show values when enabled', () => {
    fixture.componentRef.setInput('data', [[5]]);
    fixture.componentRef.setInput('showValues', true);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.lc-heatmap__cell-value').textContent).toContain('5');
  });

  it('should not show values by default', () => {
    fixture.componentRef.setInput('data', [[5]]);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.lc-heatmap__cell-value')).toBeFalsy();
  });

  describe('colours, formatting and edge cases', () => {
    const cells = () => Array.from(fixture.nativeElement.querySelectorAll('.lc-heatmap__cell') as NodeListOf<SVGRectElement>);
    const values = () => Array.from(fixture.nativeElement.querySelectorAll('.lc-heatmap__cell-value') as NodeListOf<SVGTextElement>);

    it('blends each cell from colorMin to colorMax', () => {
      fixture.componentRef.setInput('data', [[0, 5, 10]]);
      fixture.componentRef.setInput('colorMin', 'var(--color-warning-50)');
      fixture.componentRef.setInput('colorMax', 'var(--color-error-default)');
      fixture.detectChanges();
      const fills = cells().map((c) => c.getAttribute('fill')!);
      expect(fills[0]).toBe('color-mix(in srgb, var(--color-error-default) 0%, var(--color-warning-50))');
      expect(fills[1]).toBe('color-mix(in srgb, var(--color-error-default) 50%, var(--color-warning-50))');
      expect(fills[2]).toBe('color-mix(in srgb, var(--color-error-default) 100%, var(--color-warning-50))');
      for (const c of cells()) expect(c.hasAttribute('opacity')).toBe(false);
    });

    it('picks the value ink per cell from its intensity', () => {
      fixture.componentRef.setInput('data', [[0, 10]]);
      fixture.componentRef.setInput('showValues', true);
      fixture.detectChanges();
      expect(values()[0].getAttribute('fill')).toBe('var(--color-text-primary)');
      expect(values()[1].getAttribute('fill')).toBe('var(--color-surface)');
    });

    it('formats cell values through formatValue', () => {
      fixture.componentRef.setInput('data', [[0.5]]);
      fixture.componentRef.setInput('showValues', true);
      fixture.componentRef.setInput('formatValue', (v: number) => `${v * 100}%`);
      fixture.detectChanges();
      expect(values()[0].textContent!.trim()).toBe('50%');
    });

    it('survives empty rows, NaN values and a flat matrix', () => {
      fixture.componentRef.setInput('data', [[], [NaN, 3], [3, 3]]);
      fixture.componentRef.setInput('showValues', true);
      fixture.detectChanges();
      expect(cells().length).toBe(4);
      const html = fixture.nativeElement.querySelector('svg').innerHTML as string;
      expect(html).not.toMatch(/NaN|Infinity/);
    });

    it('generates a shape/range summary with a <title> and honours ariaLabel', () => {
      fixture.componentRef.setInput('data', [[1, 2, 3], [4, 5, 6]]);
      fixture.detectChanges();
      const svg = fixture.nativeElement.querySelector('svg');
      expect(svg.getAttribute('aria-label')).toBe('Heatmap: 2 rows by 3 columns, values from 1 to 6');
      expect(svg.querySelector('title').textContent).toBe('Heatmap: 2 rows by 3 columns, values from 1 to 6');
      fixture.componentRef.setInput('ariaLabel', 'Activity');
      fixture.detectChanges();
      expect(svg.getAttribute('aria-label')).toBe('Activity');
    });
  });
});

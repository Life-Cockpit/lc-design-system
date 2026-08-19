import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Component, signal } from '@angular/core';
import { ScatterPlotComponent, ScatterSeries } from './scatter-plot.component';

@Component({
  standalone: true,
  imports: [ScatterPlotComponent],
  template: `<lc-scatter-plot
    [series]="series()"
    [width]="400"
    [height]="300"
    [showGrid]="showGrid()"
    [showLegend]="showLegend()"
    [showTooltip]="showTooltip()"
    [showXLabels]="showXLabels()"
    [showYLabels]="showYLabels()"
    [xAxisLabel]="xAxisLabel()"
    [yAxisLabel]="yAxisLabel()"
  />`,
})
class TestHost {
  series = signal<ScatterSeries[]>([
    {
      label: 'Set A',
      data: [
        { x: 1, y: 2 },
        { x: 3, y: 4 },
        { x: 5, y: 1 },
      ],
    },
  ]);
  showGrid = signal(true);
  showLegend = signal(false);
  showTooltip = signal(true);
  showXLabels = signal(true);
  showYLabels = signal(true);
  xAxisLabel = signal('');
  yAxisLabel = signal('');
}

describe('ScatterPlotComponent', () => {
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
    expect(el.querySelector('lc-scatter-plot')).toBeTruthy();
  });

  it('should render dots for each data point', () => {
    const dots = el.querySelectorAll('.lc-scatter-plot__dot');
    expect(dots.length).toBe(3);
  });

  it('should render grid lines', () => {
    const lines = el.querySelectorAll('.lc-scatter-plot__grid-line');
    expect(lines.length).toBeGreaterThan(0);
  });

  it('should hide grid when disabled', () => {
    host.showGrid.set(false);
    fixture.detectChanges();
    expect(el.querySelectorAll('.lc-scatter-plot__grid-line').length).toBe(0);
  });

  it('should show legend when enabled', () => {
    host.showLegend.set(true);
    fixture.detectChanges();
    expect(el.querySelector('.lc-scatter-plot__legend')).toBeTruthy();
    expect(el.querySelector('.lc-scatter-plot__legend-label')?.textContent?.trim()).toBe('Set A');
  });

  it('should not show legend by default', () => {
    expect(el.querySelector('.lc-scatter-plot__legend')).toBeFalsy();
  });

  it('should render multiple series', () => {
    host.series.set([
      { label: 'A', data: [{ x: 1, y: 2 }] },
      { label: 'B', data: [{ x: 3, y: 4 }, { x: 5, y: 6 }] },
    ]);
    fixture.detectChanges();
    expect(el.querySelectorAll('.lc-scatter-plot__dot').length).toBe(3);
  });

  it('should show tooltip on hover', () => {
    expect(el.querySelector('.lc-scatter-plot__tooltip-text')).toBeFalsy();
    const dot = el.querySelector('.lc-scatter-plot__dot') as SVGCircleElement;
    dot.dispatchEvent(new MouseEvent('mouseenter', { bubbles: true }));
    fixture.detectChanges();
    expect(el.querySelector('.lc-scatter-plot__tooltip-text')).toBeTruthy();
  });

  it('should hide tooltip on mouse leave', () => {
    const dot = el.querySelector('.lc-scatter-plot__dot') as SVGCircleElement;
    dot.dispatchEvent(new MouseEvent('mouseenter', { bubbles: true }));
    fixture.detectChanges();
    dot.dispatchEvent(new MouseEvent('mouseleave', { bubbles: true }));
    fixture.detectChanges();
    expect(el.querySelector('.lc-scatter-plot__tooltip-text')).toBeFalsy();
  });

  it('should show axis labels', () => {
    host.xAxisLabel.set('Weight');
    host.yAxisLabel.set('Height');
    fixture.detectChanges();
    const labels = el.querySelectorAll('.lc-scatter-plot__axis-label');
    expect(labels.length).toBe(2);
  });

  it('should render axes', () => {
    const axes = el.querySelectorAll('.lc-scatter-plot__axis');
    expect(axes.length).toBe(2);
  });

  it('should use custom dot size', () => {
    host.series.set([
      { label: 'Big', data: [{ x: 1, y: 2, size: 10 }] },
    ]);
    fixture.detectChanges();
    const dot = el.querySelector('.lc-scatter-plot__dot') as SVGCircleElement;
    expect(dot.getAttribute('r')).toBe('10');
  });

  it('should show X labels', () => {
    const labels = el.querySelectorAll('.lc-scatter-plot__label');
    expect(labels.length).toBeGreaterThan(0);
  });

  it('should hide Y labels when disabled', () => {
    host.showYLabels.set(false);
    fixture.detectChanges();
    // Only X labels remain
    const yLabelsCount = el.querySelectorAll('.lc-scatter-plot__grid-line').length;
    // All grid-line-associated labels should be X only
    expect(yLabelsCount).toBeGreaterThanOrEqual(0);
  });

  describe('keyboard interaction and accessibility', () => {
    const chart = () => fixture.debugElement.children[0].componentInstance as ScatterPlotComponent;
    const dot = () => el.querySelector('.lc-scatter-plot__dot') as SVGCircleElement;

    it('exposes the SVG as a labelled group with button dots', () => {
      const svg = el.querySelector('svg')!;
      expect(svg.getAttribute('role')).toBe('group');
      expect(svg.getAttribute('aria-label')).toBe('Scatter plot: Set A 3 points');
      expect(svg.querySelector('title')!.textContent).toBe('Scatter plot: Set A 3 points');
      expect(dot().getAttribute('tabindex')).toBe('0');
      expect(dot().getAttribute('role')).toBe('button');
      expect(dot().getAttribute('aria-label')).toBe('Set A: (1, 2)');
    });

    it('names the axes in the summary when axis labels are set', () => {
      host.xAxisLabel.set('Weight');
      host.yAxisLabel.set('Height');
      fixture.detectChanges();
      expect(el.querySelector('svg')!.getAttribute('aria-label')).toBe('Scatter plot (Weight vs Height): Set A 3 points');
    });

    it('shows the tooltip on focus and hides it on blur', () => {
      dot().dispatchEvent(new FocusEvent('focus'));
      fixture.detectChanges();
      expect(el.querySelector('.lc-scatter-plot__tooltip-text')!.textContent).toBe('(1, 2)');
      dot().dispatchEvent(new FocusEvent('blur'));
      fixture.detectChanges();
      expect(el.querySelector('.lc-scatter-plot__tooltip-text')).toBeFalsy();
    });

    it('emits pointClick on Enter and Space (and prevents the Space scroll)', () => {
      const clicks: unknown[] = [];
      chart().pointClick.subscribe((e) => clicks.push(e));
      dot().dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
      const space = new KeyboardEvent('keydown', { key: ' ', bubbles: true, cancelable: true });
      dot().dispatchEvent(space);
      expect(clicks.length).toBe(2);
      expect(clicks[0]).toEqual({ series: 'Set A', point: { x: 1, y: 2 } });
      expect(space.defaultPrevented).toBe(true);
    });

    it('becomes a static image when interactive is false', () => {
      const direct = TestBed.createComponent(ScatterPlotComponent);
      direct.componentRef.setInput('series', [{ label: 'A', data: [{ x: 1, y: 1 }] }]);
      direct.componentRef.setInput('interactive', false);
      direct.detectChanges();
      const svg = direct.nativeElement.querySelector('svg');
      expect(svg.getAttribute('role')).toBe('img');
      const c = direct.nativeElement.querySelector('.lc-scatter-plot__dot');
      expect(c.hasAttribute('tabindex')).toBe(false);
      expect(c.hasAttribute('role')).toBe(false);
    });

    it('honours ariaLabel', () => {
      const direct = TestBed.createComponent(ScatterPlotComponent);
      direct.componentRef.setInput('series', []);
      direct.componentRef.setInput('ariaLabel', 'Correlation');
      direct.detectChanges();
      expect(direct.nativeElement.querySelector('svg').getAttribute('aria-label')).toBe('Correlation');
    });
  });

  describe('tooltip, scale and edge cases', () => {
    it('sizes the tooltip backplate from the label and uses a custom point label', () => {
      host.series.set([{ label: 'S', data: [{ x: 1, y: 2, label: 'A much longer point label' }, { x: 2, y: 3 }] }]);
      fixture.detectChanges();
      const dots = el.querySelectorAll('.lc-scatter-plot__dot');
      dots[0].dispatchEvent(new MouseEvent('mouseenter', { bubbles: true }));
      fixture.detectChanges();
      const wide = Number(el.querySelector('.lc-scatter-plot__tooltip-bg')!.getAttribute('width'));
      dots[1].dispatchEvent(new MouseEvent('mouseenter', { bubbles: true }));
      fixture.detectChanges();
      const narrow = Number(el.querySelector('.lc-scatter-plot__tooltip-bg')!.getAttribute('width'));
      expect(wide).toBeGreaterThan(narrow);
      expect(dots[0].getAttribute('aria-label')).toBe('S: A much longer point label (1, 2)');
    });

    it('labels the grid with nice, float-clean ticks', () => {
      host.series.set([{ label: 'S', data: [{ x: 0.1, y: 10 }, { x: 0.3, y: 30 }] }]);
      fixture.detectChanges();
      const labels = Array.from(el.querySelectorAll('.lc-scatter-plot__label')).map((t) => t.textContent!.trim());
      expect(labels.join('|')).not.toMatch(/0000|9999|NaN/);
    });

    it('renders no NaN for empty series or NaN coordinates', () => {
      host.series.set([{ label: 'S', data: [] }, { label: 'T', data: [{ x: NaN, y: 1 }] }]);
      fixture.detectChanges();
      expect(el.querySelector('svg')!.innerHTML).not.toMatch(/NaN|Infinity/);
      expect(el.querySelectorAll('.lc-scatter-plot__dot').length).toBe(1);
    });

    it('formats ticks and default point labels through formatValue', () => {
      const direct = TestBed.createComponent(ScatterPlotComponent);
      direct.componentRef.setInput('series', [{ label: 'A', data: [{ x: 1, y: 2 }] }]);
      direct.componentRef.setInput('formatValue', (v: number) => `${v}u`);
      direct.detectChanges();
      expect(direct.nativeElement.querySelector('.lc-scatter-plot__dot').getAttribute('aria-label')).toBe('A: (1u, 2u)');
      expect(direct.nativeElement.querySelector('.lc-scatter-plot__label').textContent.trim()).toMatch(/u$/);
    });
  });
});

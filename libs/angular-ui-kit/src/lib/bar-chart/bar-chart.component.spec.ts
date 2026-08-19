import { ComponentFixture, TestBed } from '@angular/core/testing';
import { BarChartComponent } from './bar-chart.component';

describe('BarChartComponent', () => {
  let component: BarChartComponent;
  let fixture: ComponentFixture<BarChartComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BarChartComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(BarChartComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    fixture.componentRef.setInput('data', [{ value: 10, label: 'A' }]);
    fixture.detectChanges();
    expect(component).toBeTruthy();
  });

  it('should render bars for each data item', () => {
    fixture.componentRef.setInput('data', [
      { value: 30, label: 'Jan' },
      { value: 50, label: 'Feb' },
      { value: 40, label: 'Mar' },
    ]);
    fixture.detectChanges();
    const bars = fixture.nativeElement.querySelectorAll('.lc-bar-chart__bar');
    expect(bars.length).toBe(3);
  });

  it('should show value labels by default', () => {
    fixture.componentRef.setInput('data', [
      { value: 30, label: 'A' },
    ]);
    fixture.detectChanges();
    const values = fixture.nativeElement.querySelectorAll('.lc-bar-chart__value');
    expect(values.length).toBe(1);
    expect(values[0].textContent.trim()).toBe('30');
  });

  it('should hide value labels when showValues is false', () => {
    fixture.componentRef.setInput('data', [{ value: 30, label: 'A' }]);
    fixture.componentRef.setInput('showValues', false);
    fixture.detectChanges();
    const values = fixture.nativeElement.querySelectorAll('.lc-bar-chart__value');
    expect(values.length).toBe(0);
  });

  it('should show labels by default', () => {
    fixture.componentRef.setInput('data', [{ value: 30, label: 'Jan' }]);
    fixture.detectChanges();
    const labels = fixture.nativeElement.querySelectorAll('.lc-bar-chart__label');
    expect(labels.length).toBe(1);
    expect(labels[0].textContent.trim()).toBe('Jan');
  });

  it('should render grid lines by default', () => {
    fixture.componentRef.setInput('data', [{ value: 100, label: 'A' }]);
    fixture.detectChanges();
    const gridLines = fixture.nativeElement.querySelectorAll('.lc-bar-chart__grid-line');
    expect(gridLines.length).toBeGreaterThan(0);
  });

  it('should handle empty data', () => {
    fixture.componentRef.setInput('data', []);
    fixture.detectChanges();
    const bars = fixture.nativeElement.querySelectorAll('.lc-bar-chart__bar');
    expect(bars.length).toBe(0);
  });

  it('should render axes', () => {
    fixture.componentRef.setInput('data', [{ value: 50, label: 'A' }]);
    fixture.detectChanges();
    const axes = fixture.nativeElement.querySelectorAll('.lc-bar-chart__axis');
    expect(axes.length).toBe(2);
  });

  it('should respect custom height and use width as viewBox fallback', () => {
    fixture.componentRef.setInput('data', [{ value: 50, label: 'A' }]);
    fixture.componentRef.setInput('width', 600);
    fixture.componentRef.setInput('height', 300);
    fixture.detectChanges();
    const svg = fixture.nativeElement.querySelector('svg');
    expect(svg.getAttribute('width')).toBe('100%');
    expect(svg.getAttribute('height')).toBe('300');
    expect(svg.getAttribute('viewBox')).toContain('0 0 600 300');
  });

  describe('scale and edge cases', () => {
    const svgText = () => fixture.nativeElement.querySelector('svg').innerHTML as string;
    const allText = () =>
      Array.from(fixture.nativeElement.querySelectorAll('svg text') as NodeListOf<SVGTextElement>).map((t) => t.textContent!.trim()).join('|');
    const gridLabels = () =>
      Array.from(fixture.nativeElement.querySelectorAll('.lc-bar-chart__grid-label') as NodeListOf<SVGTextElement>).map((t) => t.textContent!.trim());
    const bars = () => Array.from(fixture.nativeElement.querySelectorAll('.lc-bar-chart__bar') as NodeListOf<SVGRectElement>);

    it('places bars and grid on one scale: the top tick is the value at the plot top', () => {
      fixture.componentRef.setInput('data', [{ value: 90, label: 'A' }, { value: 100, label: 'B' }]);
      fixture.componentRef.setInput('height', 200);
      fixture.detectChanges();
      const labels = gridLabels();
      expect(labels[labels.length - 1]).toBe('100');
      const topGridY = Number(fixture.nativeElement.querySelectorAll('.lc-bar-chart__grid-line')[labels.length - 1].getAttribute('y1'));
      // Plot top = PADDING_TOP (10): the 100-bar reaches it, the 90-bar stays below.
      expect(topGridY).toBe(10);
      expect(Number(bars()[1].getAttribute('y'))).toBeCloseTo(topGridY, 5);
      expect(Number(bars()[0].getAttribute('y'))).toBeGreaterThan(topGridY);
    });

    it('rounds ratio scales to nice ticks without float noise', () => {
      fixture.componentRef.setInput('data', [{ value: 1, label: 'A' }, { value: 0.8, label: 'B' }, { value: 0.3, label: 'C' }]);
      fixture.detectChanges();
      const labels = gridLabels();
      expect(labels[labels.length - 1]).toBe('1');
      expect(labels).toEqual(['0', '0.25', '0.5', '0.75', '1']);
      expect(allText()).not.toMatch(/0000|9999|NaN|Infinity/);
    });

    it('draws negative bars downward from a zero baseline with non-negative sizes', () => {
      fixture.componentRef.setInput('data', [{ value: -20, label: 'A' }, { value: 30, label: 'B' }]);
      fixture.detectChanges();
      const [neg, pos] = bars();
      for (const b of bars()) {
        expect(Number(b.getAttribute('height'))).toBeGreaterThan(0);
        expect(Number(b.getAttribute('width'))).toBeGreaterThan(0);
      }
      // Baseline (second axis line) sits inside the plot, negative bar hangs off it, positive bar ends on it.
      const baselineY = Number(fixture.nativeElement.querySelectorAll('.lc-bar-chart__axis')[1].getAttribute('y1'));
      expect(baselineY).toBeGreaterThan(10);
      expect(baselineY).toBeLessThan(170);
      expect(Number(neg.getAttribute('y'))).toBeCloseTo(baselineY, 5);
      expect(Number(pos.getAttribute('y')) + Number(pos.getAttribute('height'))).toBeCloseTo(baselineY, 5);
      expect(gridLabels()).toContain('0');
      expect(gridLabels().some((l) => l.startsWith('-'))).toBe(true);
    });

    it('renders all-negative data instead of vanishing', () => {
      fixture.componentRef.setInput('data', [{ value: -5, label: 'A' }, { value: -12, label: 'B' }]);
      fixture.detectChanges();
      expect(bars().length).toBe(2);
      for (const b of bars()) expect(Number(b.getAttribute('height'))).toBeGreaterThan(0);
      expect(svgText()).not.toMatch(/NaN|Infinity/);
    });

    it('handles horizontal negative bars', () => {
      fixture.componentRef.setInput('data', [{ value: -20, label: 'A' }, { value: 30, label: 'B' }]);
      fixture.componentRef.setInput('orientation', 'horizontal');
      fixture.detectChanges();
      for (const b of bars()) expect(Number(b.getAttribute('width'))).toBeGreaterThan(0);
      expect(fixture.nativeElement.querySelectorAll('.lc-bar-chart__grid-label').length).toBeGreaterThan(0);
      expect(svgText()).not.toMatch(/NaN|Infinity/);
    });

    it('survives all-zero, undefined and NaN values', () => {
      fixture.componentRef.setInput('data', [{ value: 0, label: 'A' }, { value: undefined as unknown as number, label: 'B' }, { value: NaN, label: 'C' }]);
      fixture.detectChanges();
      expect(bars().length).toBe(3);
      for (const b of bars()) expect(Number(b.getAttribute('height'))).toBeGreaterThanOrEqual(0);
      expect(svgText()).not.toMatch(/NaN|Infinity|undefined/);
    });

    it('does not throw on duplicate labels', () => {
      fixture.componentRef.setInput('data', [{ value: 1, label: 'X' }, { value: 2, label: 'X' }, { value: 3 }]);
      expect(() => fixture.detectChanges()).not.toThrow();
      expect(bars().length).toBe(3);
    });
  });

  describe('accessibility', () => {
    it('generates an aria-label and <title> that carry the data', () => {
      fixture.componentRef.setInput('data', [{ value: 120, label: 'Q1' }, { value: 95, label: 'Q2' }]);
      fixture.detectChanges();
      const svg = fixture.nativeElement.querySelector('svg');
      expect(svg.getAttribute('role')).toBe('img');
      expect(svg.getAttribute('aria-label')).toBe('Bar chart: Q1 120, Q2 95');
      expect(svg.querySelector('title').textContent).toBe('Bar chart: Q1 120, Q2 95');
    });

    it('lets ariaLabel override the generated summary', () => {
      fixture.componentRef.setInput('data', [{ value: 1, label: 'A' }]);
      fixture.componentRef.setInput('ariaLabel', 'Orders per quarter');
      fixture.detectChanges();
      expect(fixture.nativeElement.querySelector('svg').getAttribute('aria-label')).toBe('Orders per quarter');
    });
  });

  describe('formatValue and width', () => {
    it('formats value labels, ticks and the summary through formatValue', () => {
      fixture.componentRef.setInput('data', [{ value: 0.5, label: 'A' }, { value: 1, label: 'B' }]);
      fixture.componentRef.setInput('formatValue', (v: number) => `${Math.round(v * 100)}%`);
      fixture.detectChanges();
      const values = Array.from(fixture.nativeElement.querySelectorAll('.lc-bar-chart__value') as NodeListOf<SVGTextElement>).map((t) => t.textContent!.trim());
      expect(values).toEqual(['50%', '100%']);
      const ticks = Array.from(fixture.nativeElement.querySelectorAll('.lc-bar-chart__grid-label') as NodeListOf<SVGTextElement>).map((t) => t.textContent!.trim());
      expect(ticks[ticks.length - 1]).toBe('100%');
      expect(fixture.nativeElement.querySelector('svg').getAttribute('aria-label')).toBe('Bar chart: A 50%, B 100%');
    });

    it('caps the host at width when set and stays fluid otherwise', () => {
      fixture.componentRef.setInput('data', [{ value: 1, label: 'A' }]);
      fixture.detectChanges();
      expect(fixture.nativeElement.style.maxWidth).toBe('');
      fixture.componentRef.setInput('width', 320);
      fixture.detectChanges();
      expect(fixture.nativeElement.style.maxWidth).toBe('320px');
    });
  });
});

import { ComponentFixture, TestBed } from '@angular/core/testing';
import { WaterfallChartComponent } from './waterfall-chart.component';

describe('WaterfallChartComponent', () => {
  let fixture: ComponentFixture<WaterfallChartComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [WaterfallChartComponent] }).compileComponents();
    fixture = TestBed.createComponent(WaterfallChartComponent);
  });

  it('should create', () => {
    fixture.componentRef.setInput('data', [{ label: 'Start', value: 100, type: 'total' }]);
    fixture.detectChanges();
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should render bars', () => {
    fixture.componentRef.setInput('data', [
      { label: 'Start', value: 100, type: 'total' },
      { label: 'Add', value: 30 },
      { label: 'Remove', value: -20 },
      { label: 'End', value: 110, type: 'total' },
    ]);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelectorAll('.lc-waterfall-chart__bar').length).toBe(4);
  });

  it('should render connectors', () => {
    fixture.componentRef.setInput('data', [
      { label: 'A', value: 100, type: 'total' },
      { label: 'B', value: 20 },
      { label: 'C', value: -10 },
    ]);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelectorAll('.lc-waterfall-chart__connector').length).toBe(2);
  });

  it('should show values', () => {
    fixture.componentRef.setInput('data', [{ label: 'A', value: 50, type: 'total' }]);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.lc-waterfall-chart__value')).toBeTruthy();
  });

  it('should handle empty data', () => {
    fixture.componentRef.setInput('data', []);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelectorAll('.lc-waterfall-chart__bar').length).toBe(0);
  });

  describe('value labels, types and scale', () => {
    const values = () => Array.from(fixture.nativeElement.querySelectorAll('.lc-waterfall-chart__value') as NodeListOf<SVGTextElement>).map((t) => t.textContent!.trim());
    const bars = () => Array.from(fixture.nativeElement.querySelectorAll('.lc-waterfall-chart__bar') as NodeListOf<SVGRectElement>);

    it('labels each bar with the item value, not the drifting running difference', () => {
      fixture.componentRef.setInput('data', [
        { label: 'A', value: 0.1 },
        { label: 'B', value: 0.2 },
        { label: 'C', value: 0.3 },
      ]);
      fixture.detectChanges();
      expect(values()).toEqual(['+0.1', '+0.2', '+0.3']);
    });

    it('prints totals without a sign and decreases with a minus', () => {
      fixture.componentRef.setInput('data', [
        { label: 'Start', value: 100, type: 'total' },
        { label: 'Down', value: -20 },
        { label: 'End', value: 80, type: 'total' },
      ]);
      fixture.detectChanges();
      expect(values()).toEqual(['100', '-20', '80']);
    });

    it('respects an explicit type over the sign of the value', () => {
      fixture.componentRef.setInput('data', [
        { label: 'Start', value: 100, type: 'total' },
        { label: 'Down', value: 20, type: 'decrease' },
        { label: 'Up', value: -10, type: 'increase' },
      ]);
      fixture.componentRef.setInput('decreaseColor', 'red');
      fixture.componentRef.setInput('increaseColor', 'green');
      fixture.detectChanges();
      expect(values()).toEqual(['100', '-20', '+10']);
      expect(bars()[1].getAttribute('fill')).toBe('red');
      expect(bars()[2].getAttribute('fill')).toBe('green');
      // Running total: 100 → 80 → 90; the "Down" bar spans 80..100, i.e. its top is the Start bar's top.
      expect(Number(bars()[1].getAttribute('y'))).toBeCloseTo(Number(bars()[0].getAttribute('y')), 5);
      expect(fixture.nativeElement.querySelector('svg').getAttribute('aria-label')).toBe('Waterfall chart: Start 100, Down -20, Up +10');
    });

    it('formats values and ticks through formatValue (sign prefix kept)', () => {
      fixture.componentRef.setInput('data', [{ label: 'T', value: 1000, type: 'total' }, { label: 'A', value: 250 }]);
      fixture.componentRef.setInput('formatValue', (v: number) => `${v / 1000}k`);
      fixture.detectChanges();
      expect(values()).toEqual(['1k', '+0.25k']);
      const ticks = Array.from(fixture.nativeElement.querySelectorAll('.lc-waterfall-chart__grid-label') as NodeListOf<SVGTextElement>).map((t) => t.textContent!.trim());
      expect(ticks.every((t) => t.endsWith('k'))).toBe(true);
    });

    it('uses nice ticks with the zero baseline inside the plot for negative running totals', () => {
      fixture.componentRef.setInput('data', [{ label: 'A', value: -30 }, { label: 'B', value: 90 }]);
      fixture.detectChanges();
      const ticks = Array.from(fixture.nativeElement.querySelectorAll('.lc-waterfall-chart__grid-label') as NodeListOf<SVGTextElement>).map((t) => t.textContent!.trim());
      expect(ticks).toContain('0');
      expect(ticks.join('|')).not.toMatch(/0000|9999|NaN/);
      const baselineY = Number(fixture.nativeElement.querySelectorAll('.lc-waterfall-chart__axis')[1].getAttribute('y1'));
      expect(baselineY).toBeGreaterThan(15);
      expect(baselineY).toBeLessThan(220);
      for (const b of bars()) expect(Number(b.getAttribute('height'))).toBeGreaterThan(0);
    });

    it('survives NaN values and duplicate labels', () => {
      fixture.componentRef.setInput('data', [{ label: 'X', value: NaN }, { label: 'X', value: 5 }]);
      expect(() => fixture.detectChanges()).not.toThrow();
      expect(fixture.nativeElement.querySelector('svg').innerHTML).not.toMatch(/NaN|Infinity/);
    });

    it('renders a <title> and honours ariaLabel', () => {
      fixture.componentRef.setInput('data', [{ label: 'A', value: 5 }]);
      fixture.detectChanges();
      const svg = fixture.nativeElement.querySelector('svg');
      expect(svg.querySelector('title').textContent).toBe('Waterfall chart: A +5');
      fixture.componentRef.setInput('ariaLabel', 'Bridge');
      fixture.detectChanges();
      expect(svg.getAttribute('aria-label')).toBe('Bridge');
    });
  });
});

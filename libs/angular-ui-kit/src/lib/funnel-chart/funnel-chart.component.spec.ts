import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Component, signal } from '@angular/core';
import { FunnelChartComponent, FunnelStep } from './funnel-chart.component';

@Component({
  standalone: true,
  imports: [FunnelChartComponent],
  template: `<lc-funnel-chart
    [steps]="steps()"
    [width]="400"
    [height]="300"
    [showLabels]="showLabels()"
    [showValues]="showValues()"
    [showPercentage]="showPercentage()"
    [orientation]="orientation()"
  />`,
})
class TestHost {
  steps = signal<FunnelStep[]>([
    { label: 'Visitors', value: 1000 },
    { label: 'Leads', value: 600 },
    { label: 'Prospects', value: 300 },
    { label: 'Sales', value: 100 },
  ]);
  showLabels = signal(true);
  showValues = signal(true);
  showPercentage = signal(true);
  orientation = signal<'vertical' | 'horizontal'>('vertical');
}

describe('FunnelChartComponent', () => {
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
    expect(el.querySelector('lc-funnel-chart')).toBeTruthy();
  });

  it('should render steps for each funnel item', () => {
    const steps = el.querySelectorAll('.lc-funnel-chart__step');
    expect(steps.length).toBe(4);
  });

  it('should show labels', () => {
    const labels = el.querySelectorAll('.lc-funnel-chart__label');
    expect(labels.length).toBe(4);
    expect(labels[0].textContent?.trim()).toBe('Visitors');
  });

  it('should hide labels when disabled', () => {
    host.showLabels.set(false);
    fixture.detectChanges();
    expect(el.querySelectorAll('.lc-funnel-chart__label').length).toBe(0);
  });

  it('should show values', () => {
    const values = el.querySelectorAll('.lc-funnel-chart__value');
    expect(values.length).toBe(4);
  });

  it('should hide values when disabled', () => {
    host.showValues.set(false);
    host.showPercentage.set(false);
    fixture.detectChanges();
    expect(el.querySelectorAll('.lc-funnel-chart__value').length).toBe(0);
  });

  it('should show percentages', () => {
    const values = el.querySelectorAll('.lc-funnel-chart__value');
    const text = values[0].textContent || '';
    expect(text).toContain('100%');
  });

  it('should render in horizontal orientation', () => {
    host.orientation.set('horizontal');
    fixture.detectChanges();
    expect(el.querySelectorAll('.lc-funnel-chart__step').length).toBe(4);
  });

  it('should handle single step', () => {
    host.steps.set([{ label: 'Only', value: 500 }]);
    fixture.detectChanges();
    expect(el.querySelectorAll('.lc-funnel-chart__step').length).toBe(1);
  });

  it('should apply custom colors', () => {
    host.steps.set([
      { label: 'A', value: 100, color: '#ff0000' },
      { label: 'B', value: 50, color: '#00ff00' },
    ]);
    fixture.detectChanges();
    const paths = el.querySelectorAll('.lc-funnel-chart__step');
    expect(paths[0].getAttribute('fill')).toBe('#ff0000');
    expect(paths[1].getAttribute('fill')).toBe('#00ff00');
  });

  it('should render SVG with correct dimensions', () => {
    const svg = el.querySelector('.lc-funnel-chart__svg') as SVGElement;
    expect(svg.getAttribute('width')).toBe('100%');
    expect(svg.getAttribute('height')).toBe('300');
    expect(svg.getAttribute('viewBox')).toContain('0 0 400 300');
  });

  describe('label ink, formatting and edge cases', () => {
    const labels = () => Array.from(el.querySelectorAll('.lc-funnel-chart__label') as NodeListOf<SVGTextElement>);
    const values = () => Array.from(el.querySelectorAll('.lc-funnel-chart__value') as NodeListOf<SVGTextElement>);

    it('picks light ink on a dark literal fill and dark ink on a light one', () => {
      host.steps.set([
        { label: 'Dark', value: 100, color: '#102030' },
        { label: 'Light', value: 50, color: '#f5f5f5' },
      ]);
      fixture.detectChanges();
      expect(labels()[0].getAttribute('fill')).toBe('#f9fafb');
      expect(labels()[1].getAttribute('fill')).toBe('#111827');
      expect(labels()[0].classList.contains('lc-funnel-chart__text--halo')).toBe(false);
      expect(values()[1].getAttribute('fill')).toBe('#111827');
    });

    it('falls back to primary text with a surface halo on token fills', () => {
      host.steps.set([{ label: 'A', value: 100 }, { label: 'B', value: 40, color: 'var(--color-info-default)' }]);
      fixture.detectChanges();
      for (const t of [...labels(), ...values()]) {
        expect(t.getAttribute('fill')).toBe('var(--color-text-primary)');
        expect(t.classList.contains('lc-funnel-chart__text--halo')).toBe(true);
      }
    });

    it('uses only 500+ shades in the default palette', () => {
      host.steps.set(Array.from({ length: 8 }, (_, i) => ({ label: `S${i}`, value: 100 - i * 10 })));
      fixture.detectChanges();
      const fills = Array.from(el.querySelectorAll('.lc-funnel-chart__step') as NodeListOf<SVGPathElement>).map((p) => p.getAttribute('fill')!);
      expect(fills.some((f) => /-(300|400)\)/.test(f))).toBe(false);
    });

    it('formats values through formatValue', () => {
      // The host template does not bind formatValue; drive a direct fixture instead.
      const direct = TestBed.createComponent(FunnelChartComponent);
      direct.componentRef.setInput('steps', [{ label: 'A', value: 1500 }, { label: 'B', value: 500 }]);
      direct.componentRef.setInput('formatValue', (v: number) => `${v / 1000}k`);
      direct.detectChanges();
      const texts = Array.from(direct.nativeElement.querySelectorAll('.lc-funnel-chart__value') as NodeListOf<SVGTextElement>).map((t) => t.textContent!.replace(/\s+/g, ' ').trim());
      expect(texts[0]).toBe('1.5k · 100%');
      expect(texts[1]).toBe('0.5k · 33%');
    });

    it('survives NaN, negative and all-zero values', () => {
      host.steps.set([{ label: 'A', value: NaN }, { label: 'B', value: -3 }, { label: 'C', value: 0 }]);
      fixture.detectChanges();
      const ds = Array.from(el.querySelectorAll('.lc-funnel-chart__step') as NodeListOf<SVGPathElement>).map((p) => p.getAttribute('d')!);
      expect(ds.join(' ')).not.toMatch(/NaN|Infinity/);
      expect(Array.from(el.querySelectorAll('svg text')).map((t) => t.textContent).join('|')).not.toMatch(/NaN|Infinity/);
    });

    it('does not throw on duplicate labels', () => {
      host.steps.set([{ label: 'X', value: 10 }, { label: 'X', value: 5 }]);
      expect(() => fixture.detectChanges()).not.toThrow();
    });
  });

  describe('accessibility', () => {
    it('generates a summary with values and shares plus a <title>', () => {
      const svg = el.querySelector('svg')!;
      expect(svg.getAttribute('aria-label')).toBe('Funnel chart: Visitors 1000 (100%), Leads 600 (60%), Prospects 300 (30%), Sales 100 (10%)');
      expect(svg.querySelector('title')!.textContent).toBe(svg.getAttribute('aria-label'));
    });

    it('lets ariaLabel override the summary', () => {
      const direct = TestBed.createComponent(FunnelChartComponent);
      direct.componentRef.setInput('steps', [{ label: 'A', value: 1 }]);
      direct.componentRef.setInput('ariaLabel', 'Conversion');
      direct.detectChanges();
      expect(direct.nativeElement.querySelector('svg').getAttribute('aria-label')).toBe('Conversion');
    });
  });
});

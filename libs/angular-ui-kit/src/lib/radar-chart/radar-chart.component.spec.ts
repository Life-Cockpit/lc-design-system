import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RadarChartComponent } from './radar-chart.component';

describe('RadarChartComponent', () => {
  let fixture: ComponentFixture<RadarChartComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [RadarChartComponent] }).compileComponents();
    fixture = TestBed.createComponent(RadarChartComponent);
  });

  it('should create', () => {
    fixture.componentRef.setInput('series', [{ label: 'A', data: [80, 60, 70, 90, 50] }]);
    fixture.detectChanges();
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should render grid rings', () => {
    fixture.componentRef.setInput('series', [{ label: 'A', data: [80, 60, 70] }]);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelectorAll('.lc-radar-chart__grid').length).toBe(4);
  });

  it('should render series polygon', () => {
    fixture.componentRef.setInput('series', [{ label: 'A', data: [80, 60, 70, 90, 50] }]);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.lc-radar-chart__polygon')).toBeTruthy();
  });

  it('should render multiple series', () => {
    fixture.componentRef.setInput('series', [
      { label: 'A', data: [80, 60, 70] },
      { label: 'B', data: [50, 80, 60] },
    ]);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelectorAll('.lc-radar-chart__polygon').length).toBe(2);
  });

  it('should render axis labels', () => {
    fixture.componentRef.setInput('series', [{ label: 'A', data: [80, 60, 70] }]);
    fixture.componentRef.setInput('axes', ['Speed', 'Power', 'Agility']);
    fixture.detectChanges();
    const labels = fixture.nativeElement.querySelectorAll('.lc-radar-chart__label');
    expect(labels.length).toBe(3);
  });

  describe('accessibility and edge cases', () => {
    it('generates a summary with per-axis values and a <title>', () => {
      fixture.componentRef.setInput('series', [{ label: 'A', data: [80, 60] }]);
      fixture.componentRef.setInput('axes', ['Speed', 'Power']);
      fixture.detectChanges();
      const svg = fixture.nativeElement.querySelector('svg');
      expect(svg.getAttribute('aria-label')).toBe('Radar chart: A (Speed 80, Power 60)');
      expect(svg.querySelector('title').textContent).toBe('Radar chart: A (Speed 80, Power 60)');
    });

    it('honours ariaLabel and formatValue', () => {
      fixture.componentRef.setInput('series', [{ label: 'A', data: [0.5] }]);
      fixture.componentRef.setInput('formatValue', (v: number) => `${v * 100}%`);
      fixture.detectChanges();
      expect(fixture.nativeElement.querySelector('svg').getAttribute('aria-label')).toBe('Radar chart: A (Axis 1 50%)');
      fixture.componentRef.setInput('ariaLabel', 'Profile');
      fixture.detectChanges();
      expect(fixture.nativeElement.querySelector('svg').getAttribute('aria-label')).toBe('Profile');
    });

    it('renders nothing but no NaN for empty data, and clamps NaN / negative values', () => {
      fixture.componentRef.setInput('series', [{ label: 'A', data: [] }]);
      fixture.detectChanges();
      expect(fixture.nativeElement.querySelectorAll('.lc-radar-chart__polygon').length).toBe(0);
      expect(fixture.nativeElement.querySelector('svg').getAttribute('aria-label')).toBe('Radar chart: no data');

      fixture.componentRef.setInput('series', [{ label: 'A', data: [NaN, -20, 50] }]);
      fixture.detectChanges();
      const points = fixture.nativeElement.querySelector('.lc-radar-chart__polygon').getAttribute('points') as string;
      expect(points).not.toMatch(/NaN/);
      // NaN and negative values sit at the centre.
      const [p0, p1] = points.split(' ');
      expect(p0).toBe('125,125');
      expect(p1.split(',').map(Number).every((n) => Math.abs(n - 125) < 1e-9)).toBe(true);
    });

    it('does not throw on duplicate series or axis labels', () => {
      fixture.componentRef.setInput('series', [{ label: 'X', data: [1, 2] }, { label: 'X', data: [2, 1] }]);
      fixture.componentRef.setInput('axes', ['Y', 'Y']);
      fixture.componentRef.setInput('showLegend', true);
      expect(() => fixture.detectChanges()).not.toThrow();
    });
  });
});

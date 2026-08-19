import { ComponentFixture, TestBed } from '@angular/core/testing';
import { GaugeComponent } from './gauge.component';

describe('GaugeComponent', () => {
  let fixture: ComponentFixture<GaugeComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GaugeComponent],
    }).compileComponents();
    fixture = TestBed.createComponent(GaugeComponent);
  });

  it('should create', () => {
    fixture.detectChanges();
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should render track arc', () => {
    fixture.detectChanges();
    const track = fixture.nativeElement.querySelector('.lc-gauge__track');
    expect(track).toBeTruthy();
  });

  it('should render value arc when value > 0', () => {
    fixture.componentRef.setInput('value', 50);
    fixture.detectChanges();
    const arc = fixture.nativeElement.querySelector('.lc-gauge__value-arc');
    expect(arc).toBeTruthy();
  });

  it('should not render value arc when value is 0', () => {
    fixture.componentRef.setInput('value', 0);
    fixture.detectChanges();
    const arc = fixture.nativeElement.querySelector('.lc-gauge__value-arc');
    expect(arc).toBeFalsy();
  });

  it('should display value text', () => {
    fixture.componentRef.setInput('value', 75);
    fixture.detectChanges();
    const text = fixture.nativeElement.querySelector('.lc-gauge__value-text');
    expect(text.textContent).toContain('75%');
  });

  it('should display label', () => {
    fixture.componentRef.setInput('label', 'CPU');
    fixture.detectChanges();
    const label = fixture.nativeElement.querySelector('.lc-gauge__label');
    expect(label.textContent).toContain('CPU');
  });

  it('should clamp value to max', () => {
    fixture.componentRef.setInput('value', 150);
    fixture.componentRef.setInput('max', 100);
    fixture.detectChanges();
    const text = fixture.nativeElement.querySelector('.lc-gauge__value-text');
    expect(text.textContent).toContain('150%');
  });

  it('should use custom suffix', () => {
    fixture.componentRef.setInput('value', 37);
    fixture.componentRef.setInput('suffix', '°C');
    fixture.detectChanges();
    const text = fixture.nativeElement.querySelector('.lc-gauge__value-text');
    expect(text.textContent).toContain('37°C');
  });

  describe('accessibility, formatting and edge cases', () => {
    it('announces the value and max, prefixed by the label', () => {
      fixture.componentRef.setInput('value', 72);
      fixture.componentRef.setInput('label', 'CPU');
      fixture.detectChanges();
      const svg = fixture.nativeElement.querySelector('svg');
      expect(svg.getAttribute('aria-label')).toBe('CPU: 72% of 100%');
      expect(svg.querySelector('title').textContent).toBe('CPU: 72% of 100%');
    });

    it('falls back to "Gauge" without a label and honours ariaLabel', () => {
      fixture.componentRef.setInput('value', 37);
      fixture.componentRef.setInput('max', 50);
      fixture.componentRef.setInput('suffix', '°C');
      fixture.detectChanges();
      expect(fixture.nativeElement.querySelector('svg').getAttribute('aria-label')).toBe('Gauge: 37°C of 50°C');
      fixture.componentRef.setInput('ariaLabel', 'Room temperature');
      fixture.detectChanges();
      expect(fixture.nativeElement.querySelector('svg').getAttribute('aria-label')).toBe('Room temperature');
    });

    it('lets formatValue replace the default value formatting', () => {
      fixture.componentRef.setInput('value', 0.756);
      fixture.componentRef.setInput('max', 1);
      fixture.componentRef.setInput('formatValue', (v: number) => `${(v * 100).toFixed(1)} %`);
      fixture.detectChanges();
      expect(fixture.nativeElement.querySelector('.lc-gauge__value-text').textContent.trim()).toBe('75.6 %');
      expect(fixture.nativeElement.querySelector('svg').getAttribute('aria-label')).toBe('Gauge: 75.6 % of 100.0 %');
    });

    it('does not render NaN for non-finite value or max', () => {
      fixture.componentRef.setInput('value', NaN);
      fixture.componentRef.setInput('max', 0);
      fixture.detectChanges();
      const svg = fixture.nativeElement.querySelector('svg');
      expect(svg.innerHTML).not.toMatch(/NaN|Infinity/);
      expect(fixture.nativeElement.querySelector('.lc-gauge__value-arc')).toBeFalsy();
    });
  });
});

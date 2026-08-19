import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ProgressRingComponent } from './progress-ring.component';

describe('ProgressRingComponent', () => {
  let fixture: ComponentFixture<ProgressRingComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [ProgressRingComponent] }).compileComponents();
    fixture = TestBed.createComponent(ProgressRingComponent);
  });

  it('should create', () => {
    fixture.detectChanges();
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should render track and value circles', () => {
    fixture.componentRef.setInput('value', 50);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.lc-progress-ring__track')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('.lc-progress-ring__value')).toBeTruthy();
  });

  it('should display percentage text', () => {
    fixture.componentRef.setInput('value', 75);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.lc-progress-ring__text').textContent).toContain('75%');
  });

  it('should hide text when showValue is false', () => {
    fixture.componentRef.setInput('value', 50);
    fixture.componentRef.setInput('showValue', false);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.lc-progress-ring__text')).toBeFalsy();
  });

  it('should clamp value between 0 and 100', () => {
    fixture.componentRef.setInput('value', 150);
    fixture.detectChanges();
    const circle = fixture.nativeElement.querySelector('.lc-progress-ring__value');
    const dashoffset = parseFloat(circle.getAttribute('stroke-dashoffset'));
    // at 100%, offset should be 0
    expect(dashoffset).toBe(0);
    // ...and the text / ARIA value are clamped as well
    expect(fixture.nativeElement.querySelector('.lc-progress-ring__text').textContent.trim()).toBe('100%');
    expect(fixture.nativeElement.querySelector('svg').getAttribute('aria-valuenow')).toBe('100');

    fixture.componentRef.setInput('value', -20);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.lc-progress-ring__text').textContent.trim()).toBe('0%');
  });

  it('exposes progressbar semantics with a configurable label', () => {
    fixture.componentRef.setInput('value', 42);
    fixture.detectChanges();
    const svg = fixture.nativeElement.querySelector('svg');
    expect(svg.getAttribute('role')).toBe('progressbar');
    expect(svg.getAttribute('aria-valuenow')).toBe('42');
    expect(svg.getAttribute('aria-valuemin')).toBe('0');
    expect(svg.getAttribute('aria-valuemax')).toBe('100');
    expect(svg.getAttribute('aria-label')).toBe('Progress');

    fixture.componentRef.setInput('ariaLabel', 'Upload');
    fixture.detectChanges();
    expect(svg.getAttribute('aria-label')).toBe('Upload');
  });

  it('accepts showLabel as an alias of showValue', () => {
    fixture.componentRef.setInput('value', 50);
    fixture.componentRef.setInput('showLabel', false);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.lc-progress-ring__text')).toBeFalsy();

    fixture.componentRef.setInput('showValue', false);
    fixture.componentRef.setInput('showLabel', true);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.lc-progress-ring__text')).toBeTruthy();
  });
});

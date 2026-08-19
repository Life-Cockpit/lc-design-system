import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SparklineComponent } from './sparkline.component';

describe('SparklineComponent', () => {
  let component: SparklineComponent;
  let fixture: ComponentFixture<SparklineComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SparklineComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(SparklineComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    fixture.componentRef.setInput('data', [1, 2, 3]);
    fixture.detectChanges();
    expect(component).toBeTruthy();
  });

  it('should render an SVG', () => {
    fixture.componentRef.setInput('data', [10, 20, 30, 20, 25]);
    fixture.detectChanges();
    const svg = fixture.nativeElement.querySelector('svg');
    expect(svg).toBeTruthy();
  });

  it('should render a path for the line', () => {
    fixture.componentRef.setInput('data', [1, 3, 2, 5]);
    fixture.detectChanges();
    const path = fixture.nativeElement.querySelector('.lc-sparkline__line');
    expect(path).toBeTruthy();
    expect(path.getAttribute('d')).toBeTruthy();
  });

  it('should not render with less than 2 data points', () => {
    fixture.componentRef.setInput('data', [5]);
    fixture.detectChanges();
    const path = fixture.nativeElement.querySelector('.lc-sparkline__line');
    expect(path).toBeFalsy();
  });

  it('should render filled area when filled is true', () => {
    fixture.componentRef.setInput('data', [1, 2, 3]);
    fixture.componentRef.setInput('filled', true);
    fixture.detectChanges();
    const area = fixture.nativeElement.querySelector('.lc-sparkline__area');
    expect(area).toBeTruthy();
  });

  it('should not render filled area by default', () => {
    fixture.componentRef.setInput('data', [1, 2, 3]);
    fixture.detectChanges();
    const area = fixture.nativeElement.querySelector('.lc-sparkline__area');
    expect(area).toBeFalsy();
  });

  it('should render end dot when showEndDot is true', () => {
    fixture.componentRef.setInput('data', [1, 2, 3]);
    fixture.componentRef.setInput('showEndDot', true);
    fixture.detectChanges();
    const dot = fixture.nativeElement.querySelector('.lc-sparkline__dot');
    expect(dot).toBeTruthy();
  });

  it('should use linear curve when specified', () => {
    fixture.componentRef.setInput('data', [0, 10, 5]);
    fixture.componentRef.setInput('curve', 'linear');
    fixture.detectChanges();
    const path = fixture.nativeElement.querySelector('.lc-sparkline__line');
    const d = path.getAttribute('d');
    // Linear paths use M and L commands, not C
    expect(d).toContain('M');
    expect(d).toContain('L');
    expect(d).not.toContain('C');
  });

  it('should respect custom height and use width as viewBox fallback', () => {
    fixture.componentRef.setInput('data', [1, 2, 3]);
    fixture.componentRef.setInput('width', 200);
    fixture.componentRef.setInput('height', 50);
    fixture.detectChanges();
    const svg = fixture.nativeElement.querySelector('svg');
    expect(svg.getAttribute('width')).toBe('100%');
    expect(svg.getAttribute('height')).toBe('50');
    expect(svg.getAttribute('viewBox')).toContain('0 0 200 50');
  });

  describe('width, accessibility and edge cases', () => {
    it('is an inline box of exactly width px by default', () => {
      fixture.componentRef.setInput('data', [1, 2, 3]);
      fixture.componentRef.setInput('width', 160);
      fixture.detectChanges();
      expect(fixture.nativeElement.style.width).toBe('160px');
      expect(fixture.nativeElement.classList.contains('lc-sparkline--fluid')).toBe(false);
      expect(fixture.nativeElement.querySelector('svg').getAttribute('viewBox')).toBe('0 0 160 32');
    });

    it('stretches to the container when fluid', () => {
      fixture.componentRef.setInput('data', [1, 2, 3]);
      fixture.componentRef.setInput('fluid', true);
      fixture.detectChanges();
      expect(fixture.nativeElement.style.width).toBe('');
      expect(fixture.nativeElement.classList.contains('lc-sparkline--fluid')).toBe(true);
    });

    it('announces point count, min, max and last value', () => {
      fixture.componentRef.setInput('data', [4, 8, 5, 12, 9]);
      fixture.detectChanges();
      const svg = fixture.nativeElement.querySelector('svg');
      expect(svg.getAttribute('aria-label')).toBe('Sparkline: 5 points, min 4, max 12, last 9');
      expect(svg.querySelector('title').textContent).toBe('Sparkline: 5 points, min 4, max 12, last 9');
    });

    it('honours ariaLabel and formatValue', () => {
      fixture.componentRef.setInput('data', [0.5, 1]);
      fixture.componentRef.setInput('formatValue', (v: number) => `${v * 100}%`);
      fixture.detectChanges();
      expect(fixture.nativeElement.querySelector('svg').getAttribute('aria-label')).toBe('Sparkline: 2 points, min 50%, max 100%, last 100%');
      fixture.componentRef.setInput('ariaLabel', 'Weekly trend');
      fixture.detectChanges();
      expect(fixture.nativeElement.querySelector('svg').getAttribute('aria-label')).toBe('Weekly trend');
    });

    it('renders no NaN for NaN values, flat data or an empty array', () => {
      fixture.componentRef.setInput('data', [1, NaN, 3]);
      fixture.componentRef.setInput('filled', true);
      fixture.componentRef.setInput('showEndDot', true);
      fixture.detectChanges();
      expect(fixture.nativeElement.querySelector('svg').innerHTML).not.toMatch(/NaN|Infinity/);
      fixture.componentRef.setInput('data', [5, 5, 5]);
      fixture.detectChanges();
      expect(fixture.nativeElement.querySelector('svg').innerHTML).not.toMatch(/NaN|Infinity/);
      fixture.componentRef.setInput('data', []);
      fixture.detectChanges();
      expect(fixture.nativeElement.querySelector('.lc-sparkline__line')).toBeFalsy();
      expect(fixture.nativeElement.querySelector('svg').getAttribute('aria-label')).toBe('Sparkline: no data');
    });
  });
});

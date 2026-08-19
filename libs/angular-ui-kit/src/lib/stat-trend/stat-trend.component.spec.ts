import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { provideHttpClient } from '@angular/common/http';
import { StatTrendComponent } from './stat-trend.component';
import { IconComponent } from '../icon/icon.component';

describe('StatTrendComponent', () => {
  let component: StatTrendComponent;
  let fixture: ComponentFixture<StatTrendComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [StatTrendComponent],
      providers: [provideHttpClient()],
    }).compileComponents();

    fixture = TestBed.createComponent(StatTrendComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    fixture.componentRef.setInput('value', '1,234');
    fixture.detectChanges();
    expect(component).toBeTruthy();
  });

  it('should display the value', () => {
    fixture.componentRef.setInput('value', '$42,000');
    fixture.detectChanges();
    const el = fixture.nativeElement.querySelector('.lc-stat-trend__value');
    expect(el.textContent).toContain('$42,000');
  });

  it('should display the label', () => {
    fixture.componentRef.setInput('value', '100');
    fixture.componentRef.setInput('label', 'Revenue');
    fixture.detectChanges();
    const el = fixture.nativeElement.querySelector('.lc-stat-trend__label');
    expect(el.textContent).toContain('Revenue');
  });

  it('should display the change text', () => {
    fixture.componentRef.setInput('value', '100');
    fixture.componentRef.setInput('change', '+12%');
    fixture.detectChanges();
    const el = fixture.nativeElement.querySelector('.lc-stat-trend__change');
    expect(el.textContent).toContain('+12%');
  });

  it('should auto-detect up direction from + prefix', () => {
    fixture.componentRef.setInput('value', '100');
    fixture.componentRef.setInput('change', '+5%');
    fixture.detectChanges();
    const el = fixture.nativeElement.querySelector('.lc-stat-trend__change');
    expect(el.classList.contains('lc-stat-trend__change--up')).toBeTruthy();
  });

  it('should auto-detect down direction from - prefix', () => {
    fixture.componentRef.setInput('value', '100');
    fixture.componentRef.setInput('change', '-3%');
    fixture.detectChanges();
    const el = fixture.nativeElement.querySelector('.lc-stat-trend__change');
    expect(el.classList.contains('lc-stat-trend__change--down')).toBeTruthy();
  });

  it('should use explicit direction over auto-detect', () => {
    fixture.componentRef.setInput('value', '100');
    fixture.componentRef.setInput('change', '+5%');
    fixture.componentRef.setInput('direction', 'down');
    fixture.detectChanges();
    const el = fixture.nativeElement.querySelector('.lc-stat-trend__change');
    expect(el.classList.contains('lc-stat-trend__change--down')).toBeTruthy();
  });

  it('should render sparkline when data is provided', () => {
    fixture.componentRef.setInput('value', '100');
    fixture.componentRef.setInput('sparklineData', [1, 2, 3, 4, 5]);
    fixture.detectChanges();
    const sparkline = fixture.nativeElement.querySelector('lc-sparkline');
    expect(sparkline).toBeTruthy();
  });

  it('should not render sparkline when data has less than 2 points', () => {
    fixture.componentRef.setInput('value', '100');
    fixture.componentRef.setInput('sparklineData', [5]);
    fixture.detectChanges();
    const sparkline = fixture.nativeElement.querySelector('lc-sparkline');
    expect(sparkline).toBeFalsy();
  });

  it('renders the header icon as decorative', () => {
    fixture.componentRef.setInput('value', '100');
    fixture.componentRef.setInput('icon', 'chart-bar');
    fixture.detectChanges();
    const icon = fixture.debugElement.query(By.directive(IconComponent)).componentInstance as IconComponent;
    expect(icon.decorative()).toBe(true);
  });
});

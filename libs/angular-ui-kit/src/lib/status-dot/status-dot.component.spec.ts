import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { StatusDotComponent } from './status-dot.component';

describe('StatusDotComponent', () => {
  let component: StatusDotComponent;
  let fixture: ComponentFixture<StatusDotComponent>;

  const dot = (): HTMLElement => fixture.debugElement.query(By.css('.lc-status-dot')).nativeElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [StatusDotComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(StatusDotComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('Tones', () => {
    it('should default to the open tone', () => {
      expect(dot().classList.contains('lc-status-dot--open')).toBe(true);
    });

    it.each(['done', 'run', 'wait', 'blocked', 'open'] as const)('should apply the %s tone class', (tone) => {
      fixture.componentRef.setInput('tone', tone);
      fixture.detectChanges();
      expect(dot().classList.contains(`lc-status-dot--${tone}`)).toBe(true);
    });
  });

  describe('Sizes', () => {
    it('should default to md', () => {
      expect(dot().classList.contains('lc-status-dot--md')).toBe(true);
    });

    it('should apply the sm size class', () => {
      fixture.componentRef.setInput('size', 'sm');
      fixture.detectChanges();
      expect(dot().classList.contains('lc-status-dot--sm')).toBe(true);
    });
  });

  describe('Pulse', () => {
    it('should not pulse by default', () => {
      expect(dot().classList.contains('lc-status-dot--pulse')).toBe(false);
    });

    it('should apply the pulse class', () => {
      fixture.componentRef.setInput('pulse', true);
      fixture.detectChanges();
      expect(dot().classList.contains('lc-status-dot--pulse')).toBe(true);
    });
  });

  describe('Accessibility', () => {
    it('should be hidden from assistive technology without a label', () => {
      expect(dot().getAttribute('aria-hidden')).toBe('true');
      expect(dot().hasAttribute('role')).toBe(false);
    });

    it('should expose the label via role=img and aria-label', () => {
      fixture.componentRef.setInput('label', 'In Arbeit');
      fixture.detectChanges();
      expect(dot().getAttribute('role')).toBe('img');
      expect(dot().getAttribute('aria-label')).toBe('In Arbeit');
      expect(dot().hasAttribute('aria-hidden')).toBe(false);
    });
  });
});

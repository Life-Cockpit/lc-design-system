import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Component } from '@angular/core';
import { By } from '@angular/platform-browser';
import { ProgressBarComponent, ProgressBarColor, ProgressBarSize } from './progress-bar.component';

@Component({
  standalone: true,
  imports: [ProgressBarComponent],
  template: `
    <lc-progress-bar
      [value]="value"
      [color]="color"
      [size]="size"
      [variant]="variant"
      [showLabel]="showLabel"
      [indeterminate]="indeterminate"
      [ariaLabel]="ariaLabel"
    ></lc-progress-bar>
  `,
})
class TestHostComponent {
  value = 50;
  color: ProgressBarColor = 'primary';
  size: ProgressBarSize = 'md';
  variant: 'linear' | 'circular' = 'linear';
  showLabel = false;
  indeterminate = false;
  ariaLabel = 'Progress';
}

describe('ProgressBarComponent', () => {
  let fixture: ComponentFixture<TestHostComponent>;
  let host: TestHostComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TestHostComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(TestHostComponent);
    host = fixture.componentInstance;
  });

  it('should create', () => {
    fixture.detectChanges();
    const comp = fixture.debugElement.query(By.directive(ProgressBarComponent));
    expect(comp).toBeTruthy();
  });

  describe('Linear variant', () => {
    it('should render linear by default', () => {
      fixture.detectChanges();
      expect(fixture.debugElement.query(By.css('.progress-bar'))).toBeTruthy();
    });

    it('should set fill width to value', () => {
      host.value = 75;
      fixture.detectChanges();
      const fill: HTMLElement = fixture.debugElement.query(By.css('.progress-bar__fill')).nativeElement;
      expect(fill.style.width).toBe('75%');
    });

    it('should clamp value to 0-100', () => {
      host.value = 150;
      fixture.detectChanges();
      const fill: HTMLElement = fixture.debugElement.query(By.css('.progress-bar__fill')).nativeElement;
      expect(fill.style.width).toBe('100%');
    });

    it('should show label when showLabel is true', () => {
      host.showLabel = true;
      host.value = 42;
      fixture.detectChanges();
      const label = fixture.debugElement.query(By.css('.progress-bar__label'));
      expect(label).toBeTruthy();
      expect(label.nativeElement.textContent.trim()).toBe('42%');
    });

    it('should not show label by default', () => {
      fixture.detectChanges();
      expect(fixture.debugElement.query(By.css('.progress-bar__label'))).toBeNull();
    });

    it('should apply color class', () => {
      host.color = 'success';
      fixture.detectChanges();
      const bar = fixture.debugElement.query(By.css('.progress-bar'));
      expect(bar.nativeElement.classList).toContain('progress-bar--success');
    });

    it('should apply size class', () => {
      host.size = 'lg';
      fixture.detectChanges();
      const bar = fixture.debugElement.query(By.css('.progress-bar'));
      expect(bar.nativeElement.classList).toContain('progress-bar--lg');
    });

    it('should apply indeterminate class', () => {
      host.indeterminate = true;
      fixture.detectChanges();
      const bar = fixture.debugElement.query(By.css('.progress-bar'));
      expect(bar.nativeElement.classList).toContain('progress-bar--indeterminate');
    });

    it('should set ARIA attributes', () => {
      host.value = 60;
      host.ariaLabel = 'Upload progress';
      fixture.detectChanges();
      const el = fixture.debugElement.query(By.css('[role="progressbar"]')).nativeElement;
      expect(el.getAttribute('aria-valuenow')).toBe('60');
      expect(el.getAttribute('aria-valuemin')).toBe('0');
      expect(el.getAttribute('aria-valuemax')).toBe('100');
      expect(el.getAttribute('aria-label')).toBe('Upload progress');
    });
  });

  describe('Inline mode', () => {
    it('should not be inline by default', () => {
      fixture.detectChanges();
      const hostEl = fixture.debugElement.query(By.directive(ProgressBarComponent));
      expect(hostEl.nativeElement.classList.contains('lc-progress-bar--inline')).toBe(false);
    });

    it('should apply the inline host class', () => {
      @Component({
        standalone: true,
        imports: [ProgressBarComponent],
        template: `<lc-progress-bar [value]="60" size="sm" [inline]="true"></lc-progress-bar>`,
      })
      class InlineHostComponent {}

      const inlineFixture = TestBed.createComponent(InlineHostComponent);
      inlineFixture.detectChanges();
      const hostEl = inlineFixture.debugElement.query(By.directive(ProgressBarComponent));
      expect(hostEl.nativeElement.classList.contains('lc-progress-bar--inline')).toBe(true);
    });
  });

  describe('Circular variant', () => {
    beforeEach(() => {
      host.variant = 'circular';
    });

    it('should render circular SVG', () => {
      fixture.detectChanges();
      expect(fixture.debugElement.query(By.css('.progress-bar-circular__svg'))).toBeTruthy();
    });

    it('should show label in circular mode', () => {
      host.showLabel = true;
      host.value = 80;
      fixture.detectChanges();
      const label = fixture.debugElement.query(By.css('.progress-bar-circular__label'));
      expect(label).toBeTruthy();
      expect(label.nativeElement.textContent.trim()).toBe('80%');
    });
  });
});

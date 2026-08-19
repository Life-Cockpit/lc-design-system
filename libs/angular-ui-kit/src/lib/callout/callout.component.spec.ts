import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Component, signal } from '@angular/core';
import { By } from '@angular/platform-browser';
import { CalloutComponent, CalloutVariant } from './callout.component';
import { IconComponent } from '../icon/icon.component';
import { provideHttpClient } from '@angular/common/http';

@Component({
  standalone: true,
  imports: [CalloutComponent],
  template: `
    <lc-callout
      [variant]="variant"
      [title]="title"
      [dismissible]="dismissible"
      [(visible)]="visible"
      (dismissed)="onDismissed()"
    >
      {{ body }}
    </lc-callout>
  `,
})
class TestHostComponent {
  variant: CalloutVariant = 'info';
  title = '';
  dismissible = false;
  body = 'Test content';
  visible = signal(true);
  wasDismissed = false;
  onDismissed() {
    this.wasDismissed = true;
  }
}

describe('CalloutComponent', () => {
  let fixture: ComponentFixture<TestHostComponent>;
  let host: TestHostComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TestHostComponent],
      providers: [provideHttpClient()],
    }).compileComponents();

    fixture = TestBed.createComponent(TestHostComponent);
    host = fixture.componentInstance;
  });

  it('should create', () => {
    fixture.detectChanges();
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should render with info variant by default', () => {
    fixture.detectChanges();
    const callout = fixture.nativeElement.querySelector('.callout');
    expect(callout.classList).toContain('callout--info');
  });

  it('should render projected content', () => {
    fixture.detectChanges();
    const body = fixture.nativeElement.querySelector('.callout__body');
    expect(body.textContent.trim()).toBe('Test content');
  });

  it('should render title when provided', () => {
    host.title = 'Heads up';
    fixture.detectChanges();
    const titleEl = fixture.nativeElement.querySelector('.callout__title');
    expect(titleEl).toBeTruthy();
    expect(titleEl.textContent.trim()).toBe('Heads up');
  });

  it('should not render title when empty', () => {
    fixture.detectChanges();
    const titleEl = fixture.nativeElement.querySelector('.callout__title');
    expect(titleEl).toBeNull();
  });

  it('should apply variant classes', () => {
    const variants: CalloutVariant[] = ['info', 'success', 'warning', 'error', 'neutral'];
    for (const v of variants) {
      host.variant = v;
      fixture.changeDetectorRef.detectChanges();
      const callout = fixture.nativeElement.querySelector('.callout');
      expect(callout.classList).toContain(`callout--${v}`);
    }
  });

  it('should not show dismiss button by default', () => {
    fixture.detectChanges();
    const btn = fixture.nativeElement.querySelector('.callout__dismiss');
    expect(btn).toBeNull();
  });

  it('should show dismiss button when dismissible', () => {
    host.dismissible = true;
    fixture.detectChanges();
    const btn = fixture.nativeElement.querySelector('.callout__dismiss');
    expect(btn).toBeTruthy();
  });

  it('should hide callout and emit on dismiss', () => {
    host.dismissible = true;
    fixture.detectChanges();

    const btn = fixture.nativeElement.querySelector('.callout__dismiss');
    btn.click();
    fixture.detectChanges();

    expect(host.wasDismissed).toBe(true);
    const callout = fixture.nativeElement.querySelector('.callout');
    expect(callout).toBeNull();
  });

  it('should render icon', () => {
    fixture.detectChanges();
    const icon = fixture.nativeElement.querySelector('lc-icon.callout__icon');
    expect(icon).toBeTruthy();
  });

  it('uses role="status" for non-urgent variants and role="alert" for error / warning', () => {
    fixture.detectChanges();
    const roleFor = (v: CalloutVariant) => {
      host.variant = v;
      fixture.changeDetectorRef.detectChanges();
      return fixture.nativeElement.querySelector('.callout').getAttribute('role');
    };
    expect(roleFor('info')).toBe('status');
    expect(roleFor('neutral')).toBe('status');
    expect(roleFor('success')).toBe('status');
    expect(roleFor('warning')).toBe('alert');
    expect(roleFor('error')).toBe('alert');
  });

  it('exposes visible as a two-way binding so a dismissed callout can be shown again', () => {
    host.dismissible = true;
    fixture.detectChanges();

    fixture.nativeElement.querySelector('.callout__dismiss').click();
    fixture.detectChanges();
    expect(host.visible()).toBe(false);
    expect(fixture.nativeElement.querySelector('.callout')).toBeNull();

    host.visible.set(true);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.callout')).toBeTruthy();
  });

  it('labels the variant icon and hides the dismiss icon from AT', () => {
    host.dismissible = true;
    host.variant = 'error';
    fixture.detectChanges();
    const icons = fixture.debugElement.queryAll(By.directive(IconComponent)).map(d => d.componentInstance as IconComponent);
    const variantIcon = icons.find(i => i.name() === 'x-circle');
    const dismissIcon = icons.find(i => i.name() === 'x-mark');
    expect(variantIcon?.ariaLabel()).toBe('Error');
    expect(variantIcon?.decorative()).toBe(false);
    expect(dismissIcon?.decorative()).toBe(true);
  });
});

import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Component, signal } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { ColorPickerComponent } from './color-picker.component';

@Component({
  standalone: true,
  imports: [ColorPickerComponent],
  template: `
    <lc-color-picker
      [label]="label()"
      [swatches]="swatches()"
      [showInput]="showInput()"
      [disabled]="disabled()"
      (colorChange)="onColor($event)"
    />
  `,
})
class TestHostComponent {
  label = signal('');
  swatches = signal(['#ef4444', '#22c55e', '#3b82f6', '#000000']);
  showInput = signal(true);
  disabled = signal(false);
  lastColor: string | null = null;
  onColor(val: string) {
    this.lastColor = val;
  }
}

@Component({
  standalone: true,
  imports: [ColorPickerComponent, ReactiveFormsModule],
  template: `
    <lc-color-picker label="Primary" [formControl]="primary" [swatches]="['#ef4444', '#22c55e']" />
    <lc-color-picker label="Secondary" [formControl]="secondary" [swatches]="['#ef4444', '#22c55e']" />
  `,
})
class FormHostComponent {
  primary = new FormControl<string>('#22c55e', { nonNullable: true });
  secondary = new FormControl<string>('#ef4444', { nonNullable: true });
}

describe('ColorPickerComponent', () => {
  let fixture: ComponentFixture<TestHostComponent>;
  let host: TestHostComponent;

  const swatches = (): HTMLButtonElement[] => Array.from(fixture.nativeElement.querySelectorAll('.color-picker__swatch'));

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TestHostComponent, FormHostComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(TestHostComponent);
    host = fixture.componentInstance;
  });

  it('should create', () => {
    fixture.detectChanges();
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should render swatches', () => {
    fixture.detectChanges();
    expect(swatches().length).toBe(4);
  });

  it('should emit color on swatch click', () => {
    fixture.detectChanges();
    swatches()[0].click();
    expect(host.lastColor).toBe('#ef4444');
  });

  it('should render native color input', () => {
    fixture.detectChanges();
    const native = fixture.nativeElement.querySelector('input[type="color"]');
    expect(native).toBeTruthy();
  });

  it('should render hex input when showInput is true', () => {
    fixture.detectChanges();
    const hexInput = fixture.nativeElement.querySelector('.color-picker__hex-input');
    expect(hexInput).toBeTruthy();
  });

  it('should not render hex input when showInput is false', () => {
    host.showInput.set(false);
    fixture.detectChanges();
    const hexInput = fixture.nativeElement.querySelector('.color-picker__hex-input');
    expect(hexInput).toBeNull();
  });

  it('should render label when provided', () => {
    host.label.set('Farbe wählen');
    fixture.detectChanges();
    const label = fixture.nativeElement.querySelector('.color-picker__label');
    expect(label.textContent.trim()).toBe('Farbe wählen');
  });

  it('should apply disabled class', () => {
    host.disabled.set(true);
    fixture.detectChanges();
    const picker = fixture.nativeElement.querySelector('.color-picker');
    expect(picker.classList).toContain('color-picker--disabled');
  });

  it('should not emit when disabled', () => {
    host.disabled.set(true);
    fixture.detectChanges();
    swatches()[0].click();
    expect(host.lastColor).toBeNull();
  });

  it('should mark selected swatch', () => {
    fixture.detectChanges();
    swatches()[2].click(); // #3b82f6
    fixture.detectChanges();
    expect(swatches()[2].classList).toContain('color-picker__swatch--selected');
  });

  describe('accessibility', () => {
    it('should link the label to the native colour input via for/id, unique per instance', () => {
      const formFixture = TestBed.createComponent(FormHostComponent);
      formFixture.detectChanges();
      const root: HTMLElement = formFixture.nativeElement;
      const labels = Array.from(root.querySelectorAll('label')) as HTMLLabelElement[];
      const natives = Array.from(root.querySelectorAll('input[type="color"]')) as HTMLInputElement[];
      expect(natives[0].id).toMatch(/^lc-color-picker-\d+$/);
      expect(natives[0].id).not.toBe(natives[1].id);
      expect(labels[0].htmlFor).toBe(natives[0].id);
      expect(labels[1].htmlFor).toBe(natives[1].id);
      // The visible label names the field — no competing aria-label.
      expect(natives[0].getAttribute('aria-label')).toBeNull();
    });

    it('should fall back to an aria-label on the native input when there is no label', () => {
      fixture.detectChanges();
      const native = fixture.nativeElement.querySelector('input[type="color"]') as HTMLInputElement;
      expect(native.getAttribute('aria-label')).toBe('Color picker');
      expect(fixture.nativeElement.querySelector('.color-picker__hex-input').getAttribute('aria-label')).toBe('Hex color value');
    });

    it('should expose the swatches as a radiogroup with aria-checked on the selected one', () => {
      fixture.detectChanges();
      const group = fixture.nativeElement.querySelector('.color-picker__swatches') as HTMLElement;
      expect(group.getAttribute('role')).toBe('radiogroup');
      for (const s of swatches()) expect(s.getAttribute('role')).toBe('radio');
      expect(swatches().map(s => s.getAttribute('aria-label'))).toEqual(['#ef4444', '#22c55e', '#3b82f6', '#000000']);
      // default value #3b82f6 is the third swatch
      expect(swatches().map(s => s.getAttribute('aria-checked'))).toEqual(['false', 'false', 'true', 'false']);
      expect(swatches().map(s => s.tabIndex)).toEqual([-1, -1, 0, -1]);

      swatches()[0].click();
      fixture.detectChanges();
      expect(swatches().map(s => s.getAttribute('aria-checked'))).toEqual(['true', 'false', 'false', 'false']);
      expect(swatches().map(s => s.tabIndex)).toEqual([0, -1, -1, -1]);
    });

    it('should move selection and focus with the arrow keys', () => {
      fixture.detectChanges();
      const first = swatches()[0];
      first.click();
      fixture.detectChanges();
      first.focus();
      const event = new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true, cancelable: true });
      first.dispatchEvent(event);
      fixture.detectChanges();
      expect(event.defaultPrevented).toBe(true);
      expect(host.lastColor).toBe('#22c55e');
      expect(document.activeElement).toBe(swatches()[1]);

      swatches()[1].dispatchEvent(new KeyboardEvent('keydown', { key: 'End', bubbles: true }));
      fixture.detectChanges();
      expect(host.lastColor).toBe('#000000');
      swatches()[3].dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
      fixture.detectChanges();
      expect(host.lastColor).toBe('#ef4444');
    });
  });

  describe('forms integration', () => {
    it('should reflect the control value, follow disable() and mark touched on blur', () => {
      const formFixture = TestBed.createComponent(FormHostComponent);
      formFixture.detectChanges();
      const root: HTMLElement = formFixture.nativeElement;
      const firstSwatches = Array.from(root.querySelectorAll('lc-color-picker')[0].querySelectorAll('.color-picker__swatch')) as HTMLButtonElement[];
      expect(firstSwatches[1].getAttribute('aria-checked')).toBe('true');

      const control = formFixture.componentInstance.primary;
      firstSwatches[0].click();
      formFixture.detectChanges();
      expect(control.value).toBe('#ef4444');

      expect(control.touched).toBe(false);
      (root.querySelector('input[type="color"]') as HTMLInputElement).dispatchEvent(new Event('blur'));
      expect(control.touched).toBe(true);

      control.disable();
      formFixture.detectChanges();
      expect((root.querySelector('input[type="color"]') as HTMLInputElement).disabled).toBe(true);
      for (const s of firstSwatches) expect(s.disabled).toBe(true);
      expect(root.querySelector('.color-picker--disabled')).toBeTruthy();
    });
  });
});

import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Component, signal } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { SliderComponent } from './slider.component';

@Component({
  standalone: true,
  imports: [SliderComponent],
  template: `
    <lc-slider
      [min]="min()"
      [max]="max()"
      [step]="step()"
      [label]="label()"
      [showValue]="showValue()"
      [disabled]="disabled()"
      (valueChange)="onValueChange($event)"
    />
  `,
})
class TestHostComponent {
  min = signal(0);
  max = signal(100);
  step = signal(1);
  label = signal('');
  showValue = signal(true);
  disabled = signal(false);
  lastValue: number | null = null;
  onValueChange(val: number) {
    this.lastValue = val;
  }
}

@Component({
  standalone: true,
  imports: [SliderComponent, ReactiveFormsModule],
  template: `
    <lc-slider label="First" [formControl]="first" [min]="10" [max]="20" />
    <lc-slider label="Second" [formControl]="second" />
  `,
})
class FormHostComponent {
  first = new FormControl<number | null>(null);
  second = new FormControl<number | null>(null);
}

describe('SliderComponent', () => {
  let fixture: ComponentFixture<TestHostComponent>;
  let host: TestHostComponent;

  const getInput = () => fixture.nativeElement.querySelector('input[type="range"]') as HTMLInputElement;

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

  it('should render range input', () => {
    fixture.detectChanges();
    const input = getInput();
    expect(input).toBeTruthy();
    expect(input.min).toBe('0');
    expect(input.max).toBe('100');
  });

  it('should render label when provided', () => {
    host.label.set('Volume');
    fixture.detectChanges();
    const label = fixture.nativeElement.querySelector('.slider__label');
    expect(label).toBeTruthy();
    expect(label.textContent).toContain('Volume');
  });

  it('should not render label when empty', () => {
    fixture.detectChanges();
    const label = fixture.nativeElement.querySelector('.slider__label');
    expect(label).toBeNull();
  });

  it('should emit value on input', () => {
    fixture.detectChanges();
    const input = getInput();
    input.value = '42';
    input.dispatchEvent(new Event('input'));
    fixture.detectChanges();
    expect(host.lastValue).toBe(42);
  });

  it('should apply disabled state', () => {
    host.disabled.set(true);
    fixture.detectChanges();
    expect(getInput().disabled).toBe(true);
  });

  it('should respect step', () => {
    host.step.set(5);
    fixture.detectChanges();
    expect(getInput().step).toBe('5');
  });

  it('should show value by default', () => {
    fixture.detectChanges();
    // trigger an input event first so value > 0
    const input = getInput();
    input.value = '50';
    input.dispatchEvent(new Event('input'));
    fixture.detectChanges();
    const valueEl = fixture.nativeElement.querySelector('.slider__value');
    expect(valueEl).toBeTruthy();
    expect(valueEl.textContent.trim()).toBe('50');
  });

  it('should hide value when showValue is false', () => {
    host.showValue.set(false);
    fixture.detectChanges();
    const valueEl = fixture.nativeElement.querySelector('.slider__value');
    expect(valueEl).toBeNull();
  });

  describe('value range', () => {
    it('should start at min when min > 0 and nothing has been written', () => {
      host.min.set(10);
      host.label.set('Level');
      fixture.detectChanges();
      const input = getInput();
      expect(input.value).toBe('10');
      expect(fixture.nativeElement.querySelector('.slider__value').textContent.trim()).toBe('10');
      expect(input.style.getPropertyValue('--fill-percent')).toBe('0%');
    });

    it('should re-clamp the shown value when min/max change', () => {
      fixture.detectChanges();
      const input = getInput();
      input.value = '5';
      input.dispatchEvent(new Event('input'));
      fixture.detectChanges();
      expect(fixture.nativeElement.querySelector('.slider__value').textContent.trim()).toBe('5');

      host.min.set(20);
      fixture.detectChanges();
      expect(fixture.nativeElement.querySelector('.slider__value').textContent.trim()).toBe('20');
      expect(input.style.getPropertyValue('--fill-percent')).toBe('0%');
    });
  });

  describe('accessibility & forms', () => {
    it('should give every instance its own id and link its label to it', () => {
      const formFixture = TestBed.createComponent(FormHostComponent);
      formFixture.detectChanges();
      const inputs = formFixture.nativeElement.querySelectorAll('input[type="range"]') as NodeListOf<HTMLInputElement>;
      const labels = formFixture.nativeElement.querySelectorAll('label') as NodeListOf<HTMLLabelElement>;
      expect(inputs.length).toBe(2);
      expect(inputs[0].id).toMatch(/^lc-slider-\d+$/);
      expect(inputs[0].id).not.toBe(inputs[1].id);
      expect(labels[0].htmlFor).toBe(inputs[0].id);
      expect(labels[1].htmlFor).toBe(inputs[1].id);
    });

    it('should show min for a null form value and clamp values written outside the range', () => {
      const formFixture = TestBed.createComponent(FormHostComponent);
      formFixture.detectChanges();
      const first = formFixture.nativeElement.querySelector('input[type="range"]') as HTMLInputElement;
      expect(first.value).toBe('10');
      expect(formFixture.nativeElement.querySelector('.slider__value').textContent.trim()).toBe('10');

      formFixture.componentInstance.first.setValue(99);
      formFixture.detectChanges();
      expect(first.value).toBe('20');
      expect(first.style.getPropertyValue('--fill-percent')).toBe('100%');
    });

    it('should follow control.disable() and mark the control touched on blur', () => {
      const formFixture = TestBed.createComponent(FormHostComponent);
      formFixture.detectChanges();
      const first = formFixture.nativeElement.querySelector('input[type="range"]') as HTMLInputElement;

      formFixture.componentInstance.first.disable();
      formFixture.detectChanges();
      expect(first.disabled).toBe(true);
      expect(formFixture.nativeElement.querySelector('.slider--disabled')).toBeTruthy();

      formFixture.componentInstance.first.enable();
      formFixture.detectChanges();
      expect(first.disabled).toBe(false);
      first.dispatchEvent(new Event('blur'));
      expect(formFixture.componentInstance.first.touched).toBe(true);
    });
  });
});

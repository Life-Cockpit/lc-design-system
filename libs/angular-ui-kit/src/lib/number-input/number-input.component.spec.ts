import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Component, signal } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { NumberInputComponent } from './number-input.component';
import { provideHttpClient } from '@angular/common/http';

@Component({
  standalone: true,
  imports: [NumberInputComponent],
  template: `
    <lc-number-input
      [min]="min()"
      [max]="max()"
      [step]="step()"
      [label]="label()"
      [helperText]="helperText()"
      [error]="error()"
      [disabled]="disabled()"
      (valueChange)="onValueChange($event)"
    />
  `,
})
class TestHostComponent {
  min = signal<number | undefined>(undefined);
  max = signal<number | undefined>(undefined);
  step = signal(1);
  label = signal('');
  helperText = signal<string | undefined>(undefined);
  error = signal<string | undefined>(undefined);
  disabled = signal(false);
  lastValue: number | null = null;
  emitted: number[] = [];
  onValueChange(val: number) {
    this.lastValue = val;
    this.emitted.push(val);
  }
}

@Component({
  standalone: true,
  imports: [NumberInputComponent, ReactiveFormsModule],
  template: `<lc-number-input label="Amount" [formControl]="control" />`,
})
class FormHostComponent {
  control = new FormControl<number | null>(null);
}

describe('NumberInputComponent', () => {
  let fixture: ComponentFixture<TestHostComponent>;
  let host: TestHostComponent;

  const getInput = () => fixture.nativeElement.querySelector('input') as HTMLInputElement;

  function type(text: string): void {
    const input = getInput();
    input.value = text;
    input.dispatchEvent(new Event('input', { bubbles: true }));
    fixture.detectChanges();
  }

  function keydown(key: string): KeyboardEvent {
    const event = new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true });
    getInput().dispatchEvent(event);
    fixture.detectChanges();
    return event;
  }

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TestHostComponent, FormHostComponent],
      providers: [provideHttpClient()],
    }).compileComponents();

    fixture = TestBed.createComponent(TestHostComponent);
    host = fixture.componentInstance;
  });

  it('should create', () => {
    fixture.detectChanges();
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should render increment and decrement buttons', () => {
    fixture.detectChanges();
    const buttons = fixture.nativeElement.querySelectorAll('.number-input__button');
    expect(buttons.length).toBe(2);
  });

  it('should render label when provided', () => {
    host.label.set('Quantity');
    fixture.detectChanges();
    const label = fixture.nativeElement.querySelector('.number-input__label');
    expect(label.textContent).toContain('Quantity');
  });

  it('should increment value on button click', () => {
    fixture.detectChanges();
    const incBtn = fixture.nativeElement.querySelector('.number-input__button--increment');
    incBtn.click();
    fixture.detectChanges();
    expect(host.lastValue).toBe(1);
  });

  it('should decrement value on button click', () => {
    fixture.detectChanges();
    // First increment so value = 1
    const incBtn = fixture.nativeElement.querySelector('.number-input__button--increment');
    incBtn.click();
    fixture.detectChanges();

    const decBtn = fixture.nativeElement.querySelector('.number-input__button--decrement');
    decBtn.click();
    fixture.detectChanges();
    expect(host.lastValue).toBe(0);
  });

  it('should respect min boundary', () => {
    host.min.set(0);
    fixture.detectChanges();

    const decBtn = fixture.nativeElement.querySelector('.number-input__button--decrement');
    decBtn.click();
    fixture.detectChanges();

    // Should stay at 0 (clamped)
    expect(host.lastValue).toBe(0);
  });

  it('should respect max boundary', () => {
    host.max.set(2);
    fixture.detectChanges();

    const incBtn = fixture.nativeElement.querySelector('.number-input__button--increment');
    incBtn.click(); // 1
    incBtn.click(); // 2
    incBtn.click(); // should stay 2
    fixture.detectChanges();

    expect(host.lastValue).toBe(2);
  });

  it('should use step value', () => {
    host.step.set(5);
    fixture.detectChanges();

    const incBtn = fixture.nativeElement.querySelector('.number-input__button--increment');
    incBtn.click();
    fixture.detectChanges();
    expect(host.lastValue).toBe(5);
  });

  it('should apply disabled class', () => {
    host.disabled.set(true);
    fixture.detectChanges();
    const wrapper = fixture.nativeElement.querySelector('.number-input');
    expect(wrapper.classList).toContain('number-input--disabled');
  });

  describe('typing', () => {
    it('should strip non-numeric characters as they are typed and keep the model', () => {
      fixture.detectChanges();
      type('12');
      expect(host.lastValue).toBe(12);

      type('12abc');
      expect(getInput().value).toBe('12');
      expect(host.lastValue).toBe(12);
      expect(host.emitted).toEqual([12]);
    });

    it('should accept a comma as decimal separator', () => {
      fixture.detectChanges();
      type('1,5');
      expect(getInput().value).toBe('1.5');
      expect(host.lastValue).toBe(1.5);
    });

    it('should keep an in-progress "1." in the field until blur', () => {
      fixture.detectChanges();
      type('1.');
      expect(getInput().value).toBe('1.');
      expect(host.lastValue).toBe(1);

      getInput().dispatchEvent(new Event('blur'));
      fixture.detectChanges();
      expect(getInput().value).toBe('1');
    });

    it('should reset a bare "-" to the model value on blur', () => {
      fixture.detectChanges();
      type('-');
      expect(getInput().value).toBe('-');
      getInput().dispatchEvent(new Event('blur'));
      fixture.detectChanges();
      expect(getInput().value).toBe('');
    });

    it('should clamp a typed value into [min, max] on blur', () => {
      host.min.set(0);
      host.max.set(10);
      fixture.detectChanges();
      type('42');
      getInput().dispatchEvent(new Event('blur'));
      fixture.detectChanges();
      expect(host.lastValue).toBe(10);
      expect(getInput().value).toBe('10');
    });
  });

  describe('stepping', () => {
    it('should not accumulate float drift with a fractional step', () => {
      host.step.set(0.1);
      fixture.detectChanges();
      const incBtn = fixture.nativeElement.querySelector('.number-input__button--increment');
      incBtn.click();
      incBtn.click();
      incBtn.click();
      fixture.detectChanges();
      expect(host.lastValue).toBe(0.3);
      expect(getInput().value).toBe('0.3');
    });

    it('should keep the precision of a typed value when stepping', () => {
      host.step.set(0.1);
      fixture.detectChanges();
      type('1.25');
      keydown('ArrowUp');
      expect(host.lastValue).toBe(1.35);
    });

    it('should increment on ArrowUp and decrement on ArrowDown', () => {
      fixture.detectChanges();
      const up = keydown('ArrowUp');
      expect(up.defaultPrevented).toBe(true);
      expect(host.lastValue).toBe(1);
      keydown('ArrowUp');
      expect(host.lastValue).toBe(2);
      keydown('ArrowDown');
      expect(host.lastValue).toBe(1);
      expect(getInput().value).toBe('1');
    });

    it('should not step past max with the keyboard', () => {
      host.max.set(1);
      fixture.detectChanges();
      keydown('ArrowUp');
      keydown('ArrowUp');
      expect(host.emitted).toEqual([1]);
    });

    it('should disable the increment button only at max and decrement only at min', () => {
      host.min.set(0);
      host.max.set(1);
      host.step.set(0.4);
      fixture.detectChanges();
      const incBtn = fixture.nativeElement.querySelector('.number-input__button--increment');
      const decBtn = fixture.nativeElement.querySelector('.number-input__button--decrement');
      type('0.8');
      // 0.8 + 0.4 overshoots max, but the button clamps — it must stay enabled.
      expect(incBtn.disabled).toBe(false);
      incBtn.click();
      fixture.detectChanges();
      expect(host.lastValue).toBe(1);
      expect(incBtn.disabled).toBe(true);
      expect(decBtn.disabled).toBe(false);
    });
  });

  describe('accessibility', () => {
    it('should link the label to the field via for/id and use distinct ids per instance', () => {
      host.label.set('Quantity');
      fixture.detectChanges();
      const label = fixture.nativeElement.querySelector('label') as HTMLLabelElement;
      const input = getInput();
      expect(input.id).toMatch(/^lc-number-input-\d+$/);
      expect(label.htmlFor).toBe(input.id);

      const second = TestBed.createComponent(TestHostComponent);
      second.detectChanges();
      const secondInput = second.nativeElement.querySelector('input') as HTMLInputElement;
      expect(secondInput.id).not.toBe(input.id);
    });

    it('should describe the field by helper text and error, and set aria-invalid on error', () => {
      host.helperText.set('Whole numbers only');
      fixture.detectChanges();
      const input = getInput();
      expect(input.getAttribute('aria-describedby')).toBe(`${input.id}-helper`);
      expect(fixture.nativeElement.querySelector(`#${input.id}-helper`).textContent).toContain('Whole numbers only');
      expect(input.getAttribute('aria-invalid')).toBeNull();

      host.error.set('Too many');
      fixture.detectChanges();
      expect(input.getAttribute('aria-describedby')).toBe(`${input.id}-error`);
      expect(input.getAttribute('aria-invalid')).toBe('true');
      expect(fixture.nativeElement.querySelector('[role="alert"]').textContent).toContain('Too many');
    });

    it('should reflect min and max on the field and label the stepper buttons', () => {
      host.min.set(1);
      host.max.set(9);
      fixture.detectChanges();
      const input = getInput();
      expect(input.getAttribute('min')).toBe('1');
      expect(input.getAttribute('max')).toBe('9');
      const [dec, inc] = fixture.nativeElement.querySelectorAll('.number-input__button');
      expect(dec.getAttribute('aria-label')).toBe('Decrease value');
      expect(inc.getAttribute('aria-label')).toBe('Increase value');
    });
  });

  describe('forms integration', () => {
    it('should follow control.disable() / enable()', () => {
      const formFixture = TestBed.createComponent(FormHostComponent);
      formFixture.detectChanges();
      const input = formFixture.nativeElement.querySelector('input') as HTMLInputElement;
      expect(input.disabled).toBe(false);

      formFixture.componentInstance.control.disable();
      formFixture.detectChanges();
      expect(input.disabled).toBe(true);
      expect(formFixture.nativeElement.querySelector('.number-input--disabled')).toBeTruthy();

      formFixture.componentInstance.control.enable();
      formFixture.detectChanges();
      expect(input.disabled).toBe(false);
    });

    it('should show a value written by the control and report typed values back', () => {
      const formFixture = TestBed.createComponent(FormHostComponent);
      formFixture.componentInstance.control.setValue(7);
      formFixture.detectChanges();
      const input = formFixture.nativeElement.querySelector('input') as HTMLInputElement;
      expect(input.value).toBe('7');

      input.value = '8x';
      input.dispatchEvent(new Event('input', { bubbles: true }));
      formFixture.detectChanges();
      expect(input.value).toBe('8');
      expect(formFixture.componentInstance.control.value).toBe(8);

      expect(formFixture.componentInstance.control.touched).toBe(false);
      input.dispatchEvent(new Event('blur'));
      expect(formFixture.componentInstance.control.touched).toBe(true);
    });
  });
});

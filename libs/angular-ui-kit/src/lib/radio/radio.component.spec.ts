import { Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { FormsModule, ReactiveFormsModule, FormControl } from '@angular/forms';
import { RadioComponent } from './radio.component';

/** Three radios sharing a name without any form binding (the way stories are written). */
@Component({
  standalone: true,
  imports: [RadioComponent],
  template: `
    <lc-radio name="fruit" value="a" label="A" (checkedChange)="log('a', $event)" />
    <lc-radio name="fruit" value="b" label="B" (checkedChange)="log('b', $event)" />
    <lc-radio name="fruit" value="c" label="C" [disabled]="cDisabled()" (valueChange)="selected.set($event)" />
    <lc-radio name="other" value="x" label="X" />
  `,
})
class UnboundGroupHostComponent {
  readonly cDisabled = signal(false);
  readonly selected = signal('');
  readonly log = jest.fn();
}

/** Radios driven by a single reactive FormControl. */
@Component({
  standalone: true,
  imports: [RadioComponent, ReactiveFormsModule],
  template: `
    <lc-radio name="plan" value="a" label="A" [formControl]="control" />
    <lc-radio name="plan" value="b" label="B" [formControl]="control" />
    <lc-radio name="plan" value="c" label="C" [formControl]="control" />
  `,
})
class FormGroupHostComponent {
  readonly control = new FormControl('b');
}

describe('RadioComponent', () => {
  let component: RadioComponent;
  let fixture: ComponentFixture<RadioComponent>;
  let inputElement: HTMLInputElement;
  let labelElement: HTMLLabelElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RadioComponent, FormsModule, ReactiveFormsModule],
    }).compileComponents();

    fixture = TestBed.createComponent(RadioComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
    inputElement = fixture.debugElement.query(By.css('input[type="radio"]')).nativeElement;
    labelElement = fixture.debugElement.query(By.css('label')).nativeElement;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('Basic Rendering', () => {
    it('should render radio input', () => {
      expect(inputElement).toBeTruthy();
      expect(inputElement.type).toBe('radio');
    });

    it('should render label', () => {
      expect(labelElement).toBeTruthy();
    });

    it('should display label text', () => {
      fixture.componentRef.setInput('label', 'Option A');
      fixture.detectChanges();
      expect(labelElement.textContent?.trim()).toBe('Option A');
    });

    it('should not display label when empty', () => {
      fixture.componentRef.setInput('label', '');
      fixture.detectChanges();
      const labelText = labelElement.textContent?.trim();
      expect(labelText).toBe('');
    });
  });

  describe('Value and Name', () => {
    it('should set value attribute', () => {
      fixture.componentRef.setInput('value', 'option-a');
      fixture.detectChanges();
      expect(inputElement.value).toBe('option-a');
    });

    it('should set name attribute', () => {
      fixture.componentRef.setInput('name', 'radio-group');
      fixture.detectChanges();
      expect(inputElement.name).toBe('radio-group');
    });

    it('should have default empty value', () => {
      expect(component.value()).toBe('');
    });
  });

  describe('Checked State', () => {
    it('should be unchecked by default', () => {
      expect(inputElement.checked).toBe(false);
      expect(component.checked()).toBe(false);
    });

    it('should reflect checked state', () => {
      fixture.componentRef.setInput('value', 'test');
      component.writeValue('test');
      fixture.detectChanges();
      expect(inputElement.checked).toBe(true);
      expect(component.checked()).toBe(true);
    });

    it('should check on click', () => {
      // Set a value for the radio
      fixture.componentRef.setInput('value', 'test-value');
      fixture.detectChanges();

      // Register onChange callback that simulates form control behavior
      let formValue = '';
      component.registerOnChange((value: string) => {
        formValue = value;
        // Simulate form control calling writeValue on all radios
        component.writeValue(value);
      });

      expect(component.checked()).toBe(false);
      inputElement.click();
      fixture.detectChanges();
      expect(component.checked()).toBe(true);
      expect(formValue).toBe('test-value');
    });

    it('should emit checkedChange event', () => {
      const spy = jest.fn();
      component.checked.subscribe(spy);

      inputElement.click();
      fixture.detectChanges();

      expect(spy).toHaveBeenCalledWith(true);
      expect(spy).toHaveBeenCalledTimes(1);
    });

    it('should emit valueChange event with value', () => {
      fixture.componentRef.setInput('value', 'test-value');
      const spy = jest.fn();
      component.valueChange.subscribe(spy);

      inputElement.click();
      fixture.detectChanges();

      expect(spy).toHaveBeenCalledWith('test-value');
    });
  });

  describe('Disabled State', () => {
    it('should not be disabled by default', () => {
      expect(inputElement.disabled).toBe(false);
      expect(component.disabled()).toBe(false);
    });

    it('should apply disabled attribute', () => {
      fixture.componentRef.setInput('disabled', true);
      fixture.detectChanges();
      expect(inputElement.disabled).toBe(true);
      expect(component.disabled()).toBe(true);
    });

    it('should not check when disabled', () => {
      fixture.componentRef.setInput('disabled', true);
      fixture.detectChanges();

      const initialState = component.checked();
      inputElement.click();
      fixture.detectChanges();

      expect(component.checked()).toBe(initialState);
    });

    it('should not emit checkedChange when disabled', () => {
      fixture.componentRef.setInput('disabled', true);
      fixture.detectChanges();

      const spy = jest.fn();
      component.checked.subscribe(spy);

      inputElement.click();
      fixture.detectChanges();

      expect(spy).not.toHaveBeenCalled();
    });

    it('should have disabled CSS class', () => {
      fixture.componentRef.setInput('disabled', true);
      fixture.detectChanges();
      expect(labelElement.classList).toContain('radio-disabled');
    });
  });

  describe('Error State', () => {
    it('should not have error by default', () => {
      expect(component.error()).toBe(false);
    });

    it('should apply error state', () => {
      fixture.componentRef.setInput('error', true);
      fixture.detectChanges();
      expect(component.error()).toBe(true);
    });

    it('should have error CSS class', () => {
      fixture.componentRef.setInput('error', true);
      fixture.detectChanges();
      expect(labelElement.classList).toContain('radio-error');
    });

    it('should display error message', () => {
      fixture.componentRef.setInput('error', true);
      fixture.componentRef.setInput('errorMessage', 'Please select an option');
      fixture.detectChanges();

      const errorElement = fixture.debugElement.query(By.css('.radio-error-message'));
      expect(errorElement).toBeTruthy();
      expect(errorElement.nativeElement.textContent.trim()).toBe('Please select an option');
    });

    it('should not display error message when no error', () => {
      fixture.componentRef.setInput('error', false);
      fixture.componentRef.setInput('errorMessage', 'Error text');
      fixture.detectChanges();

      const errorElement = fixture.debugElement.query(By.css('.radio-error-message'));
      expect(errorElement).toBeFalsy();
    });
  });

  describe('Size Variants', () => {
    it('should have medium size by default', () => {
      expect(component.size()).toBe('md');
      expect(labelElement.classList).toContain('radio-md');
    });

    it('should apply xs size', () => {
      fixture.componentRef.setInput('size', 'xs');
      fixture.detectChanges();
      expect(labelElement.classList).toContain('radio-xs');
    });

    it('should apply sm size', () => {
      fixture.componentRef.setInput('size', 'sm');
      fixture.detectChanges();
      expect(labelElement.classList).toContain('radio-sm');
    });

    it('should apply md size', () => {
      fixture.componentRef.setInput('size', 'md');
      fixture.detectChanges();
      expect(labelElement.classList).toContain('radio-md');
    });

    it('should apply lg size', () => {
      fixture.componentRef.setInput('size', 'lg');
      fixture.detectChanges();
      expect(labelElement.classList).toContain('radio-lg');
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA role', () => {
      expect(inputElement.getAttribute('role')).toBe('radio');
    });

    it('should link label to input via id', () => {
      const inputId = inputElement.id;
      expect(inputId).toBeTruthy();
      expect(labelElement.getAttribute('for')).toBe(inputId);
    });

    it('should use custom id when provided', () => {
      fixture.componentRef.setInput('id', 'custom-radio');
      fixture.detectChanges();
      expect(inputElement.id).toBe('custom-radio');
    });

    it('should generate unique id when not provided', () => {
      const fixture1 = TestBed.createComponent(RadioComponent);
      const fixture2 = TestBed.createComponent(RadioComponent);
      fixture1.detectChanges();
      fixture2.detectChanges();

      const input1 = fixture1.debugElement.query(By.css('input')).nativeElement;
      const input2 = fixture2.debugElement.query(By.css('input')).nativeElement;

      expect(input1.id).not.toBe(input2.id);
    });

    it('should set aria-label when provided', () => {
      fixture.componentRef.setInput('ariaLabel', 'Select payment method');
      fixture.detectChanges();
      expect(inputElement.getAttribute('aria-label')).toBe('Select payment method');
    });

    it('should set aria-labelledby when provided', () => {
      fixture.componentRef.setInput('ariaLabelledBy', 'external-label');
      fixture.detectChanges();
      expect(inputElement.getAttribute('aria-labelledby')).toBe('external-label');
    });

    it('should set aria-describedby when provided', () => {
      fixture.componentRef.setInput('ariaDescribedBy', 'help-text');
      fixture.detectChanges();
      expect(inputElement.getAttribute('aria-describedby')).toBe('help-text');
    });

    it('should set aria-required when required', () => {
      fixture.componentRef.setInput('required', true);
      fixture.detectChanges();
      expect(inputElement.getAttribute('aria-required')).toBe('true');
    });

    it('should set aria-invalid when error', () => {
      fixture.componentRef.setInput('error', true);
      fixture.detectChanges();
      expect(inputElement.getAttribute('aria-invalid')).toBe('true');
    });

    it('should set aria-disabled when disabled', () => {
      fixture.componentRef.setInput('disabled', true);
      fixture.detectChanges();
      expect(inputElement.getAttribute('aria-disabled')).toBe('true');
    });
  });

  describe('ControlValueAccessor', () => {
    it('should implement ControlValueAccessor', () => {
      expect(typeof component.writeValue).toBe('function');
      expect(typeof component.registerOnChange).toBe('function');
      expect(typeof component.registerOnTouched).toBe('function');
      expect(typeof component.setDisabledState).toBe('function');
    });

    it('should write boolean value', () => {
      // Set a value for the radio first
      fixture.componentRef.setInput('value', 'test');
      // Write the same value to mark it as checked
      component.writeValue('test');
      fixture.detectChanges();
      expect(component.checked()).toBe(true);
      expect(inputElement.checked).toBe(true);
    });

    it('should write string value matching component value', () => {
      fixture.componentRef.setInput('value', 'option-a');
      component.writeValue('option-a');
      fixture.detectChanges();
      expect(component.checked()).toBe(true);
    });

    it('should not check when value does not match', () => {
      fixture.componentRef.setInput('value', 'option-a');
      component.writeValue('option-b');
      fixture.detectChanges();
      expect(component.checked()).toBe(false);
    });

    it('should handle null value', () => {
      component.writeValue(null);
      fixture.detectChanges();
      expect(component.checked()).toBe(false);
    });

    it('should call onChange callback with value', () => {
      fixture.componentRef.setInput('value', 'test-value');
      const onChange = jest.fn();
      component.registerOnChange(onChange);

      inputElement.click();
      fixture.detectChanges();

      expect(onChange).toHaveBeenCalledWith('test-value');
    });

    it('should call onTouched callback', () => {
      const onTouched = jest.fn();
      component.registerOnTouched(onTouched);

      inputElement.dispatchEvent(new Event('blur'));
      fixture.detectChanges();

      expect(onTouched).toHaveBeenCalled();
    });

    it('should disable via CVA', () => {
      component.setDisabledState(true);
      fixture.detectChanges();
      expect(component.isDisabled()).toBe(true);
      expect(inputElement.disabled).toBe(true);
    });
  });

  describe('Reactive Forms Integration', () => {
    it('should work with FormControl', () => {
      fixture.componentRef.setInput('value', 'option-a');
      const control = new FormControl('');
      component.writeValue(control.value);
      component.registerOnChange((value: string) => control.setValue(value));

      inputElement.click();
      fixture.detectChanges();

      expect(control.value).toBe('option-a');
    });

    it('should update when FormControl value changes', () => {
      fixture.componentRef.setInput('value', 'option-a');
      const control = new FormControl('option-a');
      component.registerOnChange((value: string) => control.setValue(value));

      component.writeValue('option-a');
      fixture.detectChanges();

      expect(component.checked()).toBe(true);
    });

    it('should disable when FormControl disabled', () => {
      const control = new FormControl({ value: '', disabled: true });
      component.setDisabledState(control.disabled);
      fixture.detectChanges();

      expect(component.isDisabled()).toBe(true);
    });
  });

  describe('Keyboard Navigation', () => {
    it('should be focusable', () => {
      inputElement.focus();
      expect(document.activeElement).toBe(inputElement);
    });

    it('should not be focusable when disabled', () => {
      fixture.componentRef.setInput('disabled', true);
      fixture.detectChanges();
      expect(inputElement.tabIndex).toBe(-1);
    });
  });

  describe('Visual Feedback', () => {
    it('should have checked CSS class when checked', () => {
      fixture.componentRef.setInput('value', 'test');
      component.writeValue('test');
      fixture.detectChanges();
      expect(labelElement.classList).toContain('radio-checked');
    });

    it('should remove checked CSS class when unchecked', () => {
      fixture.componentRef.setInput('value', 'test');
      component.writeValue('test');
      fixture.detectChanges();
      expect(labelElement.classList).toContain('radio-checked');

      component.writeValue('other');
      fixture.detectChanges();
      expect(labelElement.classList).not.toContain('radio-checked');
    });
  });

  describe('Help Text', () => {
    it('should display help text', () => {
      fixture.componentRef.setInput('helpText', 'Select one option');
      fixture.detectChanges();

      const helpElement = fixture.debugElement.query(By.css('.radio-help-text'));
      expect(helpElement).toBeTruthy();
      expect(helpElement.nativeElement.textContent.trim()).toBe('Select one option');
    });

    it('should not display help text when empty', () => {
      fixture.componentRef.setInput('helpText', '');
      fixture.detectChanges();

      const helpElement = fixture.debugElement.query(By.css('.radio-help-text'));
      expect(helpElement).toBeFalsy();
    });
  });

  describe('Required State', () => {
    it('should not be required by default', () => {
      expect(component.required()).toBe(false);
      expect(inputElement.required).toBe(false);
    });

    it('should apply required attribute', () => {
      fixture.componentRef.setInput('required', true);
      fixture.detectChanges();
      expect(inputElement.required).toBe(true);
      expect(component.required()).toBe(true);
    });

    it('should have required CSS class', () => {
      fixture.componentRef.setInput('required', true);
      fixture.detectChanges();
      expect(labelElement.classList).toContain('radio-required');
    });
  });

  describe('Radio Group Behavior', () => {
    it('should uncheck other radios in same group', () => {
      const fixture1 = TestBed.createComponent(RadioComponent);
      const fixture2 = TestBed.createComponent(RadioComponent);

      fixture1.componentRef.setInput('name', 'test-group');
      fixture1.componentRef.setInput('value', 'option-1');
      fixture2.componentRef.setInput('name', 'test-group');
      fixture2.componentRef.setInput('value', 'option-2');

      fixture1.detectChanges();
      fixture2.detectChanges();

      const input1 = fixture1.debugElement.query(By.css('input')).nativeElement;
      const input2 = fixture2.debugElement.query(By.css('input')).nativeElement;

      // Add both inputs to DOM for native radio group behavior
      document.body.appendChild(input1);
      document.body.appendChild(input2);

      input1.click();
      expect(input1.checked).toBe(true);
      expect(input2.checked).toBe(false);

      input2.click();
      expect(input1.checked).toBe(false);
      expect(input2.checked).toBe(true);

      // Cleanup
      document.body.removeChild(input1);
      document.body.removeChild(input2);
    });
  });

  describe('Declarative inputs', () => {
    it('should accept checked as an input', () => {
      fixture.componentRef.setInput('checked', true);
      fixture.detectChanges();
      expect(inputElement.checked).toBe(true);
      expect(labelElement.classList).toContain('radio-checked');
    });

    it('should accept disabled as an input', () => {
      fixture.componentRef.setInput('disabled', true);
      fixture.detectChanges();
      expect(inputElement.disabled).toBe(true);
      expect(component.isDisabled()).toBe(true);
    });

    it('should stay disabled while either the input or the form disables it', () => {
      fixture.componentRef.setInput('disabled', true);
      component.setDisabledState(true);
      fixture.detectChanges();
      expect(inputElement.disabled).toBe(true);

      component.setDisabledState(false);
      fixture.detectChanges();
      expect(inputElement.disabled).toBe(true);

      fixture.componentRef.setInput('disabled', false);
      fixture.detectChanges();
      expect(inputElement.disabled).toBe(false);
    });

    it('should let a form write override a checked input binding', () => {
      fixture.componentRef.setInput('checked', true);
      fixture.componentRef.setInput('value', 'a');
      fixture.detectChanges();
      component.writeValue('b');
      fixture.detectChanges();
      expect(inputElement.checked).toBe(false);
    });
  });

  describe('Described-by wiring', () => {
    it('should link help text via aria-describedby', () => {
      fixture.componentRef.setInput('helpText', 'Some help');
      fixture.detectChanges();
      const help = fixture.nativeElement.querySelector('.radio-help-text');
      expect(help.id).toBe(`${component.id()}-help`);
      expect(inputElement.getAttribute('aria-describedby')).toBe(help.id);
    });

    it('should link error message via aria-describedby and set aria-invalid', () => {
      fixture.componentRef.setInput('error', true);
      fixture.componentRef.setInput('errorMessage', 'Nope');
      fixture.detectChanges();
      const err = fixture.nativeElement.querySelector('.radio-error-message');
      expect(err.id).toBe(`${component.id()}-error`);
      expect(inputElement.getAttribute('aria-describedby')).toBe(err.id);
      expect(inputElement.getAttribute('aria-invalid')).toBe('true');
    });

    it('should keep consumer-supplied aria-describedby ids', () => {
      fixture.componentRef.setInput('ariaDescribedBy', 'ext');
      fixture.componentRef.setInput('helpText', 'Some help');
      fixture.detectChanges();
      expect(inputElement.getAttribute('aria-describedby')).toBe(`ext ${component.id()}-help`);
    });
  });
});

describe('RadioComponent group without a form control', () => {
  let fixture: ComponentFixture<UnboundGroupHostComponent>;
  let host: UnboundGroupHostComponent;
  let inputs: HTMLInputElement[];
  let labels: HTMLLabelElement[];

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [UnboundGroupHostComponent] }).compileComponents();
    fixture = TestBed.createComponent(UnboundGroupHostComponent);
    host = fixture.componentInstance;
    fixture.detectChanges();
    inputs = Array.from(fixture.nativeElement.querySelectorAll('input[type="radio"]'));
    labels = Array.from(fixture.nativeElement.querySelectorAll('label'));
  });

  it('should show only the last clicked radio as checked (click A then B)', () => {
    inputs[0].click();
    fixture.detectChanges();
    expect(labels[0].classList).toContain('radio-checked');

    inputs[1].click();
    fixture.detectChanges();
    expect(labels[0].classList).not.toContain('radio-checked');
    expect(labels[1].classList).toContain('radio-checked');
    expect(labels[2].classList).not.toContain('radio-checked');
    expect(inputs[0].checked).toBe(false);
    expect(inputs[1].checked).toBe(true);
  });

  it('should emit checkedChange on the newly checked and the unchecked sibling', () => {
    inputs[0].click();
    inputs[1].click();
    fixture.detectChanges();
    expect(host.log.mock.calls).toEqual([
      ['a', true],
      ['b', true],
      ['a', false],
    ]);
  });

  it('should not touch radios of another group', () => {
    inputs[3].click();
    fixture.detectChanges();
    inputs[0].click();
    fixture.detectChanges();
    expect(labels[3].classList).toContain('radio-checked');
    expect(labels[0].classList).toContain('radio-checked');
  });

  it('should emit valueChange with the radio value', () => {
    inputs[2].click();
    fixture.detectChanges();
    expect(host.selected()).toBe('c');
  });

  it('should honour a disabled binding', () => {
    host.cDisabled.set(true);
    fixture.detectChanges();
    expect(inputs[2].disabled).toBe(true);
    expect(labels[2].classList).toContain('radio-disabled');
  });
});

describe('RadioComponent group bound to a FormControl', () => {
  let fixture: ComponentFixture<FormGroupHostComponent>;
  let host: FormGroupHostComponent;
  let inputs: HTMLInputElement[];
  let labels: HTMLLabelElement[];

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [FormGroupHostComponent] }).compileComponents();
    fixture = TestBed.createComponent(FormGroupHostComponent);
    host = fixture.componentInstance;
    fixture.detectChanges();
    inputs = Array.from(fixture.nativeElement.querySelectorAll('input[type="radio"]'));
    labels = Array.from(fixture.nativeElement.querySelectorAll('label'));
  });

  it('should render the initial control value', () => {
    expect(inputs[1].checked).toBe(true);
    expect(labels[1].classList).toContain('radio-checked');
    expect(labels[0].classList).not.toContain('radio-checked');
  });

  it('should follow setValue and reset', () => {
    host.control.setValue('c');
    fixture.detectChanges();
    expect(labels[2].classList).toContain('radio-checked');
    expect(labels[1].classList).not.toContain('radio-checked');

    host.control.reset();
    fixture.detectChanges();
    expect(labels.some((l) => l.classList.contains('radio-checked'))).toBe(false);
  });

  it('should push a click into the control and unmark the previous radio', () => {
    inputs[0].click();
    fixture.detectChanges();
    expect(host.control.value).toBe('a');
    expect(labels[0].classList).toContain('radio-checked');
    expect(labels[1].classList).not.toContain('radio-checked');
  });

  it('should disable all radios when the control is disabled', () => {
    host.control.disable();
    fixture.detectChanges();
    expect(inputs.every((i) => i.disabled)).toBe(true);
  });
});

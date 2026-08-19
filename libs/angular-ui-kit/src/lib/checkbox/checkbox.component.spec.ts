import { Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { FormsModule, ReactiveFormsModule, FormControl } from '@angular/forms';
import { CheckboxComponent } from './checkbox.component';

@Component({
  standalone: true,
  imports: [CheckboxComponent, ReactiveFormsModule],
  template: `
    <lc-checkbox
      label="Bound"
      [(checked)]="checked"
      [indeterminate]="indeterminate()"
      [disabled]="disabled()"
      helpText="Some help"
      [error]="error()"
      errorMessage="Some error"
      (checkedChange)="onCheckedChange($event)"
    />
    <lc-checkbox label="Form" [formControl]="control" />
  `,
})
class HostComponent {
  readonly checked = signal(false);
  readonly indeterminate = signal(false);
  readonly disabled = signal(false);
  readonly error = signal(false);
  readonly control = new FormControl(false);
  readonly changes: boolean[] = [];

  onCheckedChange(value: boolean): void {
    this.changes.push(value);
  }
}

describe('CheckboxComponent', () => {
  let component: CheckboxComponent;
  let fixture: ComponentFixture<CheckboxComponent>;
  let inputElement: HTMLInputElement;
  let labelElement: HTMLLabelElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CheckboxComponent, FormsModule, ReactiveFormsModule],
    }).compileComponents();

    fixture = TestBed.createComponent(CheckboxComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
    inputElement = fixture.debugElement.query(By.css('input[type="checkbox"]')).nativeElement;
    labelElement = fixture.debugElement.query(By.css('label')).nativeElement;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('Basic Rendering', () => {
    it('should render checkbox input', () => {
      expect(inputElement).toBeTruthy();
      expect(inputElement.type).toBe('checkbox');
    });

    it('should render label', () => {
      expect(labelElement).toBeTruthy();
    });

    it('should display label text', () => {
      fixture.componentRef.setInput('label', 'Accept terms');
      fixture.detectChanges();
      expect(labelElement.textContent?.trim()).toBe('Accept terms');
    });

    it('should not display label when empty', () => {
      fixture.componentRef.setInput('label', '');
      fixture.detectChanges();
      const labelText = labelElement.textContent?.trim();
      expect(labelText).toBe('');
    });
  });

  describe('Checked State', () => {
    it('should be unchecked by default', () => {
      expect(inputElement.checked).toBe(false);
      expect(component.checked()).toBe(false);
    });

    it('should reflect checked state', () => {
      component.checked.set(true);
      fixture.detectChanges();
      expect(inputElement.checked).toBe(true);
      expect(component.checked()).toBe(true);
    });

    it('should toggle checked state on click', () => {
      expect(component.checked()).toBe(false);
      inputElement.click();
      fixture.detectChanges();
      expect(component.checked()).toBe(true);
      inputElement.click();
      fixture.detectChanges();
      expect(component.checked()).toBe(false);
    });

    it('should emit checkedChange event', () => {
      const spy = jest.fn();
      component.checked.subscribe(spy);

      inputElement.click();
      fixture.detectChanges();

      expect(spy).toHaveBeenCalledWith(true);
      expect(spy).toHaveBeenCalledTimes(1);
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

    it('should not toggle when disabled', () => {
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
      expect(labelElement.classList).toContain('checkbox-disabled');
    });
  });

  describe('Indeterminate State', () => {
    it('should not be indeterminate by default', () => {
      expect(inputElement.indeterminate).toBe(false);
      expect(component.indeterminate()).toBe(false);
    });

    it('should apply indeterminate state', () => {
      component.indeterminate.set(true);
      fixture.detectChanges();
      expect(inputElement.indeterminate).toBe(true);
      expect(component.indeterminate()).toBe(true);
    });

    it('should clear indeterminate on check', () => {
      component.indeterminate.set(true);
      fixture.detectChanges();
      expect(component.indeterminate()).toBe(true);

      inputElement.click();
      fixture.detectChanges();
      expect(component.indeterminate()).toBe(false);
    });

    it('should have indeterminate CSS class', () => {
      component.indeterminate.set(true);
      fixture.detectChanges();
      expect(labelElement.classList).toContain('checkbox-indeterminate');
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
      expect(labelElement.classList).toContain('checkbox-error');
    });

    it('should display error message', () => {
      fixture.componentRef.setInput('error', true);
      fixture.componentRef.setInput('errorMessage', 'This field is required');
      fixture.detectChanges();

      const errorElement = fixture.debugElement.query(By.css('.checkbox-error-message'));
      expect(errorElement).toBeTruthy();
      expect(errorElement.nativeElement.textContent.trim()).toBe('This field is required');
    });

    it('should not display error message when no error', () => {
      fixture.componentRef.setInput('error', false);
      fixture.componentRef.setInput('errorMessage', 'Error text');
      fixture.detectChanges();

      const errorElement = fixture.debugElement.query(By.css('.checkbox-error-message'));
      expect(errorElement).toBeFalsy();
    });
  });

  describe('Size Variants', () => {
    it('should have medium size by default', () => {
      expect(component.size()).toBe('md');
      expect(labelElement.classList).toContain('checkbox-md');
    });

    it('should apply xs size', () => {
      fixture.componentRef.setInput('size', 'xs');
      fixture.detectChanges();
      expect(labelElement.classList).toContain('checkbox-xs');
    });

    it('should apply sm size', () => {
      fixture.componentRef.setInput('size', 'sm');
      fixture.detectChanges();
      expect(labelElement.classList).toContain('checkbox-sm');
    });

    it('should apply md size', () => {
      fixture.componentRef.setInput('size', 'md');
      fixture.detectChanges();
      expect(labelElement.classList).toContain('checkbox-md');
    });

    it('should apply lg size', () => {
      fixture.componentRef.setInput('size', 'lg');
      fixture.detectChanges();
      expect(labelElement.classList).toContain('checkbox-lg');
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA role', () => {
      expect(inputElement.getAttribute('role')).toBe('checkbox');
    });

    it('should link label to input via id', () => {
      const inputId = inputElement.id;
      expect(inputId).toBeTruthy();
      expect(labelElement.getAttribute('for')).toBe(inputId);
    });

    it('should use custom id when provided', () => {
      fixture.componentRef.setInput('id', 'custom-checkbox');
      fixture.detectChanges();
      expect(inputElement.id).toBe('custom-checkbox');
    });

    it('should generate unique id when not provided', () => {
      const fixture1 = TestBed.createComponent(CheckboxComponent);
      const fixture2 = TestBed.createComponent(CheckboxComponent);
      fixture1.detectChanges();
      fixture2.detectChanges();

      const input1 = fixture1.debugElement.query(By.css('input')).nativeElement;
      const input2 = fixture2.debugElement.query(By.css('input')).nativeElement;

      expect(input1.id).not.toBe(input2.id);
    });

    it('should set aria-label when provided', () => {
      fixture.componentRef.setInput('ariaLabel', 'Accept privacy policy');
      fixture.detectChanges();
      expect(inputElement.getAttribute('aria-label')).toBe('Accept privacy policy');
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

    it('should write value', () => {
      component.writeValue(true);
      fixture.detectChanges();
      expect(component.checked()).toBe(true);
      expect(inputElement.checked).toBe(true);
    });

    it('should handle null value', () => {
      component.writeValue(null);
      fixture.detectChanges();
      expect(component.checked()).toBe(false);
    });

    it('should call onChange callback', () => {
      const onChange = jest.fn();
      component.registerOnChange(onChange);

      inputElement.click();
      fixture.detectChanges();

      expect(onChange).toHaveBeenCalledWith(true);
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
      const control = new FormControl(false);
      component.writeValue(control.value);
      component.registerOnChange((value: boolean) => control.setValue(value));

      inputElement.click();
      fixture.detectChanges();

      expect(control.value).toBe(true);
    });

    it('should update when FormControl value changes', () => {
      const control = new FormControl(false);
      component.registerOnChange((value: boolean) => control.setValue(value));

      component.writeValue(true);
      fixture.detectChanges();

      expect(component.checked()).toBe(true);
    });

    it('should disable when FormControl disabled', () => {
      const control = new FormControl({ value: false, disabled: true });
      component.setDisabledState(control.disabled);
      fixture.detectChanges();

      expect(component.isDisabled()).toBe(true);
    });
  });

  describe('Keyboard Navigation', () => {
    it('should toggle on Space key', () => {
      // Space key toggles via native checkbox behavior, not a keydown event handler
      const initialState = component.checked();
      // Simulate space key which triggers a click on checkbox
      inputElement.click();
      fixture.detectChanges();
      expect(component.checked()).not.toBe(initialState);
    });

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
      component.checked.set(true);
      fixture.detectChanges();
      expect(labelElement.classList).toContain('checkbox-checked');
    });

    it('should remove checked CSS class when unchecked', () => {
      component.checked.set(true);
      fixture.detectChanges();
      expect(labelElement.classList).toContain('checkbox-checked');

      component.checked.set(false);
      fixture.detectChanges();
      expect(labelElement.classList).not.toContain('checkbox-checked');
    });
  });

  describe('Help Text', () => {
    it('should display help text', () => {
      fixture.componentRef.setInput('helpText', 'Check this to continue');
      fixture.detectChanges();

      const helpElement = fixture.debugElement.query(By.css('.checkbox-help-text'));
      expect(helpElement).toBeTruthy();
      expect(helpElement.nativeElement.textContent.trim()).toBe('Check this to continue');
    });

    it('should not display help text when empty', () => {
      fixture.componentRef.setInput('helpText', '');
      fixture.detectChanges();

      const helpElement = fixture.debugElement.query(By.css('.checkbox-help-text'));
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
      expect(labelElement.classList).toContain('checkbox-required');
    });
  });

  describe('Declarative inputs', () => {
    it('should accept checked as an input', () => {
      fixture.componentRef.setInput('checked', true);
      fixture.detectChanges();
      expect(inputElement.checked).toBe(true);
      expect(labelElement.classList).toContain('checkbox-checked');
    });

    it('should accept indeterminate as an input', () => {
      fixture.componentRef.setInput('indeterminate', true);
      fixture.detectChanges();
      expect(inputElement.indeterminate).toBe(true);
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

    it('should not emit checkedChange when checked is set from outside', () => {
      const spy = jest.fn();
      component.checked.subscribe(spy);
      fixture.componentRef.setInput('checked', true);
      fixture.detectChanges();
      expect(spy).not.toHaveBeenCalled();
    });
  });

  describe('Described-by wiring', () => {
    it('should link help text via aria-describedby', () => {
      fixture.componentRef.setInput('helpText', 'Some help');
      fixture.detectChanges();
      const help = fixture.nativeElement.querySelector('.checkbox-help-text');
      expect(help.id).toBe(`${component.id()}-help`);
      expect(inputElement.getAttribute('aria-describedby')).toBe(help.id);
    });

    it('should link error message via aria-describedby and set aria-invalid', () => {
      fixture.componentRef.setInput('helpText', 'Some help');
      fixture.componentRef.setInput('error', true);
      fixture.componentRef.setInput('errorMessage', 'Nope');
      fixture.detectChanges();
      const err = fixture.nativeElement.querySelector('.checkbox-error-message');
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

    it('should omit aria-describedby when nothing describes the checkbox', () => {
      expect(inputElement.hasAttribute('aria-describedby')).toBe(false);
    });
  });
});

describe('CheckboxComponent in a host', () => {
  let fixture: ComponentFixture<HostComponent>;
  let host: HostComponent;
  let inputs: HTMLInputElement[];

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [HostComponent] }).compileComponents();
    fixture = TestBed.createComponent(HostComponent);
    host = fixture.componentInstance;
    fixture.detectChanges();
    inputs = Array.from(fixture.nativeElement.querySelectorAll('input[type="checkbox"]'));
  });

  it('should reflect [(checked)] two-way binding in both directions', () => {
    host.checked.set(true);
    fixture.detectChanges();
    expect(inputs[0].checked).toBe(true);

    inputs[0].click();
    fixture.detectChanges();
    expect(host.checked()).toBe(false);
  });

  it('should emit checkedChange exactly once per user toggle', () => {
    inputs[0].click();
    fixture.detectChanges();
    inputs[0].click();
    fixture.detectChanges();
    expect(host.changes).toEqual([true, false]);
  });

  it('should honour [disabled] and [indeterminate] bindings', () => {
    host.disabled.set(true);
    host.indeterminate.set(true);
    fixture.detectChanges();
    expect(inputs[0].disabled).toBe(true);
    expect(inputs[0].indeterminate).toBe(true);
  });

  it('should render the form control value and disabled state into the DOM', () => {
    expect(inputs[1].checked).toBe(false);

    host.control.setValue(true);
    fixture.detectChanges();
    expect(inputs[1].checked).toBe(true);

    host.control.disable();
    fixture.detectChanges();
    expect(inputs[1].disabled).toBe(true);

    host.control.enable();
    fixture.detectChanges();
    expect(inputs[1].disabled).toBe(false);
  });

  it('should push user toggles into the form control', () => {
    inputs[1].click();
    fixture.detectChanges();
    expect(host.control.value).toBe(true);
  });
});

import { Component, ChangeDetectionStrategy } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { EmailInputComponent } from './email-input.component';

@Component({
  standalone: true,
  imports: [EmailInputComponent, ReactiveFormsModule],
  changeDetection: ChangeDetectionStrategy.Eager,
  template: `<lc-email-input [formControl]="control" />`,
})
class FormHostComponent {
  readonly control = new FormControl('first@example.com');
}

describe('EmailInputComponent', () => {
  let component: EmailInputComponent;
  let fixture: ComponentFixture<EmailInputComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EmailInputComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(EmailInputComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('Email Validation', () => {
    it('should validate correct email addresses', () => {
      const validEmails = [
        'user@example.com',
        'test.user@example.com',
        'user+tag@example.co.uk',
        'user_name@example-domain.com',
        'a@b.co',
      ];

      validEmails.forEach((email) => {
        component.writeValue(email);
        fixture.detectChanges();
        expect(component['isValid']()).toBe(true);
      });
    });

    it('should reject invalid email addresses', () => {
      const invalidEmails = [
        'notanemail',
        '@example.com',
        'user@',
        'user @example.com',
      ];

      invalidEmails.forEach((email) => {
        component.writeValue(email);
        component.validate(); // Trigger validation
        fixture.detectChanges();
        expect(component['isValid']()).toBe(false);
      });
    });

    it('should show required error when empty and required', () => {
      fixture.componentRef.setInput('required', true);
      component.writeValue('');
      component.validate();
      fixture.detectChanges();

      expect(component['validationError']()).toBe('Email address is required');
    });

    it('should show format error for invalid email', () => {
      component.writeValue('invalid-email');
      component.validate();
      fixture.detectChanges();

      expect(component['validationError']()).toBe('Please enter a valid email address');
    });

    it('should not show error before touched (by default)', () => {
      fixture.componentRef.setInput('validateOnInput', false);
      component.writeValue('invalid-email');
      fixture.detectChanges();

      expect(component['validationError']()).toBeUndefined();
    });

    it('should show error immediately when validateOnInput is true', () => {
      fixture.componentRef.setInput('validateOnInput', true);
      component.writeValue('invalid-email');
      fixture.detectChanges();

      expect(component['validationError']()).toBe('Please enter a valid email address');
    });
  });

  describe('ControlValueAccessor', () => {
    it('should write value correctly', () => {
      component.writeValue('test@example.com');
      expect(component.value()).toBe('test@example.com');
    });

    it('should call onChange when value changes', () => {
      const onChangeSpy = jest.fn();
      component.registerOnChange(onChangeSpy);

      component['onValueChange']('test@example.com');
      expect(onChangeSpy).toHaveBeenCalledWith('test@example.com');
    });

    it('should call onTouched when blurred', () => {
      const onTouchedSpy = jest.fn();
      component.registerOnTouched(onTouchedSpy);

      component['onBlur']();
      expect(onTouchedSpy).toHaveBeenCalled();
    });

    it('should set disabled state', () => {
      component.setDisabledState(true);
      expect(component['isDisabled']).toBe(true);

      component.setDisabledState(false);
      expect(component['isDisabled']).toBe(false);
    });
  });

  describe('Events', () => {
    it('should emit valueChange event', () => {
      const spy = jest.fn();
      component.valueChange.subscribe(spy);

      component['onValueChange']('test@example.com');
      expect(spy).toHaveBeenCalledWith('test@example.com');
    });

    it('should emit validationChange event when validation state changes', (done) => {
      const spy = jest.fn();
      component.validationChange.subscribe(spy);

      component.writeValue('invalid-email');
      component.validate();

      // Wait for effect to run
      setTimeout(() => {
        expect(spy).toHaveBeenCalledWith({
          valid: false,
          error: 'Please enter a valid email address',
        });
        done();
      }, 0);
    });

    it('should emit focused event', () => {
      const spy = jest.fn();
      component.focused.subscribe(spy);

      component['onFocus']();
      expect(spy).toHaveBeenCalled();
    });

    it('should emit blurred event', () => {
      const spy = jest.fn();
      component.blurred.subscribe(spy);

      component['onBlur']();
      expect(spy).toHaveBeenCalled();
    });

    it('should emit enterPressed event', () => {
      const spy = jest.fn();
      component.enterPressed.subscribe(spy);

      component['onEnterPressed']();
      expect(spy).toHaveBeenCalled();
    });
  });

  describe('Public Methods', () => {
    it('should validate and return validation result', () => {
      component.writeValue('invalid-email');
      const result = component.validate();
      expect(result).toBe(false);

      component.writeValue('valid@example.com');
      const result2 = component.validate();
      expect(result2).toBe(true);
    });

    it('should reset validation state', () => {
      component.writeValue('invalid-email');
      component.validate();
      expect(component['validationError']()).toBeDefined();

      component.resetValidation();
      expect(component['validationError']()).toBeUndefined();
    });
  });
});

describe('EmailInputComponent bound to a FormControl', () => {
  let fixture: ComponentFixture<FormHostComponent>;
  let host: FormHostComponent;
  let native: HTMLInputElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [FormHostComponent] }).compileComponents();
    fixture = TestBed.createComponent(FormHostComponent);
    host = fixture.componentInstance;
    fixture.detectChanges();
    native = fixture.nativeElement.querySelector('input');
  });

  it('should render the initial control value in the native input', () => {
    expect(native.value).toBe('first@example.com');
  });

  it('should render setValue / patchValue / reset into the native input', () => {
    host.control.setValue('second@example.com');
    fixture.detectChanges();
    expect(native.value).toBe('second@example.com');

    host.control.reset();
    fixture.detectChanges();
    expect(native.value).toBe('');
  });

  it('should disable the native input when the control is disabled', () => {
    host.control.disable();
    fixture.detectChanges();
    expect(native.disabled).toBe(true);

    host.control.enable();
    fixture.detectChanges();
    expect(native.disabled).toBe(false);
  });

  it('should push typed values into the control', () => {
    native.value = 'typed@example.com';
    native.dispatchEvent(new Event('input'));
    expect(host.control.value).toBe('typed@example.com');
  });
});

// ---------------------------------------------------------------------------
// 3.3: SI-2 (input purpose), SI-9 (requiredIndicator), SI-10 (icon opt-out,
// read-only values that wrap).
// ---------------------------------------------------------------------------
describe('EmailInputComponent 3.3 (sign-in gaps)', () => {
  let fixture: ComponentFixture<EmailInputComponent>;
  const el = () => fixture.nativeElement as HTMLElement;
  const field = () => el().querySelector('input') as HTMLInputElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [EmailInputComponent] }).compileComponents();
    fixture = TestBed.createComponent(EmailInputComponent);
    fixture.detectChanges();
  });

  it('SI-2: renders no autocomplete, name, autocapitalize, spellcheck or enterkeyhint by default', () => {
    for (const attr of ['autocomplete', 'name', 'autocapitalize', 'spellcheck', 'enterkeyhint']) {
      expect(field().hasAttribute(attr)).toBe(false);
    }
  });

  it('SI-2: passes them to the native input (passkey autofill in the email field)', () => {
    fixture.componentRef.setInput('autocomplete', 'username webauthn');
    fixture.componentRef.setInput('name', 'email');
    fixture.componentRef.setInput('autocapitalize', 'off');
    fixture.componentRef.setInput('spellcheck', false);
    fixture.componentRef.setInput('enterkeyhint', 'next');
    fixture.detectChanges();
    expect(field().getAttribute('autocomplete')).toBe('username webauthn');
    expect(field().getAttribute('name')).toBe('email');
    expect(field().getAttribute('autocapitalize')).toBe('off');
    expect(field().getAttribute('spellcheck')).toBe('false');
    expect(field().getAttribute('enterkeyhint')).toBe('next');
    expect(field().getAttribute('type')).toBe('email');
  });

  it('SI-10: shows the mail icon by default and drops it with showIcon=false', () => {
    expect(el().querySelector('.input-icon-before')).toBeTruthy();
    fixture.componentRef.setInput('showIcon', false);
    fixture.detectChanges();
    expect(el().querySelector('.input-icon-before')).toBeNull();
  });

  it('SI-10: a read-only address wraps instead of being clipped (readonlyWrap)', () => {
    fixture.componentRef.setInput('readonly', true);
    fixture.componentRef.setInput('readonlyWrap', true);
    fixture.componentRef.setInput('autocomplete', 'username');
    fixture.componentInstance.writeValue('johanna-friederike.brandt-oberhausen@example.com');
    fixture.detectChanges();
    const value = el().querySelector('.input-readonly-value') as HTMLElement;
    expect(value.textContent?.trim()).toBe('johanna-friederike.brandt-oberhausen@example.com');
    expect(field().hidden).toBe(true);
    expect(field().getAttribute('autocomplete')).toBe('username');
  });

  it('SI-9: keeps required semantics without the asterisk', () => {
    fixture.componentRef.setInput('required', true);
    fixture.componentRef.setInput('requiredIndicator', false);
    fixture.detectChanges();
    expect(el().querySelector('.required-indicator')).toBeNull();
    expect(field().required).toBe(true);
  });
});

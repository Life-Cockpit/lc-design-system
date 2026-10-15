import { Component, signal, ChangeDetectionStrategy } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule, FormControl } from '@angular/forms';
import { readFileSync } from 'fs';
import { resolve } from 'path';
import { InputComponent } from './input.component';

@Component({
  standalone: true,
  imports: [InputComponent, ReactiveFormsModule],
  changeDetection: ChangeDetectionStrategy.Eager,
  template: `
    <lc-input label="Bound" [(value)]="text" (valueChange)="changes.push($event)" />
    <lc-input label="One-way" [value]="preset()" />
    <lc-input label="Form" [formControl]="control" />
  `,
})
class HostComponent {
  readonly text = signal('');
  readonly preset = signal('initial');
  readonly control = new FormControl('from-form');
  readonly changes: string[] = [];
}

describe('InputComponent', () => {
  let component: InputComponent;
  let fixture: ComponentFixture<InputComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [InputComponent, ReactiveFormsModule],
    }).compileComponents();

    fixture = TestBed.createComponent(InputComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('Input Properties', () => {
    it('should have default type "text"', () => {
      expect(component.type()).toBe('text');
    });

    it('should have default size "md"', () => {
      expect(component.size()).toBe('md');
    });

    it('should accept label input', () => {
      fixture.componentRef.setInput('label', 'Email Address');
      expect(component.label()).toBe('Email Address');
    });

    it('should accept placeholder input', () => {
      fixture.componentRef.setInput('placeholder', 'Enter email');
      expect(component.placeholder()).toBe('Enter email');
    });

    it('should accept all type variants', () => {
      const types: Array<'text' | 'email' | 'password' | 'number' | 'tel' | 'url'> = [
        'text',
        'email',
        'password',
        'number',
        'tel',
        'url',
      ];

      types.forEach((type) => {
        fixture.componentRef.setInput('type', type);
        expect(component.type()).toBe(type);
      });
    });

    it('should accept all size variants', () => {
      const sizes: Array<'xs' | 'sm' | 'md' | 'lg'> = ['xs', 'sm', 'md', 'lg'];

      sizes.forEach((size) => {
        fixture.componentRef.setInput('size', size);
        expect(component.size()).toBe(size);
      });
    });

    it('should accept disabled state', () => {
      fixture.componentRef.setInput('disabled', true);
      expect(component.disabled()).toBe(true);
    });

    it('should accept readonly state', () => {
      fixture.componentRef.setInput('readonly', true);
      expect(component.readonly()).toBe(true);
    });

    it('should accept required state', () => {
      fixture.componentRef.setInput('required', true);
      expect(component.required()).toBe(true);
    });

    it('should accept error message', () => {
      fixture.componentRef.setInput('error', 'Invalid email');
      expect(component.error()).toBe('Invalid email');
    });

    it('should accept helper text', () => {
      fixture.componentRef.setInput('helperText', 'We will never share your email');
      expect(component.helperText()).toBe('We will never share your email');
    });

    it('should accept maxLength', () => {
      fixture.componentRef.setInput('maxLength', 100);
      expect(component.maxLength()).toBe(100);
    });

    it('should accept showCharCount', () => {
      fixture.componentRef.setInput('showCharCount', true);
      expect(component.showCharCount()).toBe(true);
    });

    it('should accept iconBefore', () => {
      fixture.componentRef.setInput('iconBefore', 'envelope');
      expect(component.iconBefore()).toBe('envelope');
    });

    it('should accept iconAfter', () => {
      fixture.componentRef.setInput('iconAfter', 'eye');
      expect(component.iconAfter()).toBe('eye');
    });

    it('should accept ariaLabel', () => {
      fixture.componentRef.setInput('ariaLabel', 'Email input field');
      expect(component.ariaLabel()).toBe('Email input field');
    });
  });

  describe('Output Events', () => {
    it('should emit valueChange exactly once per keystroke', () => {
      const spy = jest.fn();
      component.value.subscribe(spy);

      const input = fixture.nativeElement.querySelector('input');
      input.value = 'test@example.com';
      input.dispatchEvent(new Event('input'));

      expect(spy).toHaveBeenCalledTimes(1);
      expect(spy).toHaveBeenCalledWith('test@example.com');
    });

    it('should emit focused when input receives focus', (done) => {
      component.focused.subscribe(() => {
        expect(true).toBe(true);
        done();
      });

      const input = fixture.nativeElement.querySelector('input');
      input.dispatchEvent(new FocusEvent('focus'));
    });

    it('should emit blurred when input loses focus', (done) => {
      component.blurred.subscribe(() => {
        expect(true).toBe(true);
        done();
      });

      const input = fixture.nativeElement.querySelector('input');
      input.dispatchEvent(new FocusEvent('blur'));
    });

    it('should emit enterPressed when Enter key is pressed', (done) => {
      component.enterPressed.subscribe(() => {
        expect(true).toBe(true);
        done();
      });

      const input = fixture.nativeElement.querySelector('input');
      const event = new KeyboardEvent('keydown', { key: 'Enter' });
      input.dispatchEvent(event);
    });
  });

  describe('Methods', () => {
    it('should focus the input when focus() is called', () => {
      const input = fixture.nativeElement.querySelector('input');
      jest.spyOn(input, 'focus');
      component.focus();
      expect(input.focus).toHaveBeenCalled();
    });

    it('should select input text when select() is called', () => {
      const input = fixture.nativeElement.querySelector('input');
      jest.spyOn(input, 'select');
      component.select();
      expect(input.select).toHaveBeenCalled();
    });

    it('should clear the input value when clear() is called', () => {
      component.writeValue('test');
      expect(component.value()).toBe('test');
      component.clear();
      expect(component.value()).toBe('');
    });
  });

  describe('ControlValueAccessor', () => {
    it('should write value', () => {
      component.writeValue('test value');
      expect(component.value()).toBe('test value');
    });

    it('should call onChange callback when value changes', () => {
      const onChange = jest.fn();
      component.registerOnChange(onChange);

      const input = fixture.nativeElement.querySelector('input');
      input.value = 'new value';
      input.dispatchEvent(new Event('input'));

      expect(onChange).toHaveBeenCalledWith('new value');
    });

    it('should call onTouched callback on blur', () => {
      const onTouched = jest.fn();
      component.registerOnTouched(onTouched);

      const input = fixture.nativeElement.querySelector('input');
      input.dispatchEvent(new FocusEvent('blur'));

      expect(onTouched).toHaveBeenCalled();
    });

    it('should set disabled state', () => {
      component.setDisabledState(true);
      fixture.detectChanges();

      const input = fixture.nativeElement.querySelector('input');
      expect(input.disabled).toBe(true);

      component.setDisabledState(false);
      fixture.detectChanges();

      expect(input.disabled).toBe(false);
    });

    it('should work with reactive forms', () => {
      const _control = new FormControl('initial value');

      TestBed.resetTestingModule();
      TestBed.configureTestingModule({
        imports: [InputComponent, ReactiveFormsModule],
      });

      const testFixture = TestBed.createComponent(InputComponent);
      const testComponent = testFixture.componentInstance;

      // Simulate ngModel binding
      testComponent.writeValue('initial value');
      testFixture.detectChanges();

      expect(testComponent.value()).toBe('initial value');

      // Update value programmatically
      testComponent.writeValue('updated value');
      expect(testComponent.value()).toBe('updated value');
    });
  });

  describe('Validation', () => {
    it('should show error when required and value is empty', async () => {
      fixture.componentRef.setInput('required', true);
      fixture.componentRef.setInput('error', 'This field is required');
      fixture.detectChanges();
      await fixture.whenStable();
      fixture.detectChanges(); // Additional change detection for OnPush

      const errorElement = fixture.nativeElement.querySelector('p.input-error[role="alert"]');
      expect(errorElement).toBeTruthy();
      expect(errorElement.textContent.trim()).toBe('This field is required');
    });

    it('should enforce maxLength', () => {
      fixture.componentRef.setInput('maxLength', 10);
      fixture.detectChanges();

      const input = fixture.nativeElement.querySelector('input');
      expect(input.getAttribute('maxlength')).toBe('10');
    });

    it('should display character count when showCharCount is true', () => {
      fixture.componentRef.setInput('maxLength', 100);
      fixture.componentRef.setInput('showCharCount', true);
      component.writeValue('test');
      fixture.detectChanges();

      const charCount = fixture.nativeElement.querySelector('.char-count');
      expect(charCount).toBeTruthy();
      expect(charCount.textContent).toContain('4');
      expect(charCount.textContent).toContain('100');
    });
  });

  describe('States', () => {
    it('should disable input when disabled is true', () => {
      fixture.componentRef.setInput('disabled', true);
      fixture.detectChanges();

      const input = fixture.nativeElement.querySelector('input');
      expect(input.disabled).toBe(true);
    });

    it('should make input readonly when readonly is true', () => {
      fixture.componentRef.setInput('readonly', true);
      fixture.detectChanges();

      const input = fixture.nativeElement.querySelector('input');
      expect(input.readOnly).toBe(true);
    });

    it('should apply error styles when error is provided', () => {
      fixture.componentRef.setInput('error', 'Error message');
      fixture.detectChanges();

      const container = fixture.nativeElement.querySelector('.input-container');
      expect(container.classList.contains('input-error')).toBe(true);
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA attributes', () => {
      fixture.componentRef.setInput('label', 'Email');
      fixture.componentRef.setInput('required', true);
      fixture.detectChanges();

      const input = fixture.nativeElement.querySelector('input');
      expect(input.getAttribute('aria-required')).toBe('true');
    });

    it('should link label to input with id', () => {
      fixture.componentRef.setInput('label', 'Email');
      fixture.detectChanges();

      const label = fixture.nativeElement.querySelector('label');
      const input = fixture.nativeElement.querySelector('input');

      expect(label.getAttribute('for')).toBe(input.getAttribute('id'));
    });

    it('should use ariaLabel when provided', () => {
      fixture.componentRef.setInput('ariaLabel', 'Custom label');
      fixture.detectChanges();

      const input = fixture.nativeElement.querySelector('input');
      expect(input.getAttribute('aria-label')).toBe('Custom label');
    });

    it('should set aria-invalid when error is present', () => {
      fixture.componentRef.setInput('error', 'Invalid input');
      fixture.detectChanges();

      const input = fixture.nativeElement.querySelector('input');
      expect(input.getAttribute('aria-invalid')).toBe('true');
    });
  });
});

describe('InputComponent value binding in a host', () => {
  let fixture: ComponentFixture<HostComponent>;
  let host: HostComponent;
  let inputs: HTMLInputElement[];

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [HostComponent] }).compileComponents();
    fixture = TestBed.createComponent(HostComponent);
    host = fixture.componentInstance;
    fixture.detectChanges();
    inputs = Array.from(fixture.nativeElement.querySelectorAll('input'));
  });

  it('should render a value pushed in via [value]', () => {
    expect(inputs[1].value).toBe('initial');
    host.preset.set('updated');
    fixture.detectChanges();
    expect(inputs[1].value).toBe('updated');
  });

  it('should keep [(value)] in sync in both directions and emit once per keystroke', () => {
    host.text.set('hello');
    fixture.detectChanges();
    expect(inputs[0].value).toBe('hello');
    expect(host.changes).toEqual([]);

    inputs[0].value = 'hello!';
    inputs[0].dispatchEvent(new Event('input'));
    fixture.detectChanges();
    expect(host.text()).toBe('hello!');
    expect(host.changes).toEqual(['hello!']);
  });

  it('should still render and follow a reactive form control', () => {
    expect(inputs[2].value).toBe('from-form');
    host.control.setValue('changed');
    fixture.detectChanges();
    expect(inputs[2].value).toBe('changed');

    inputs[2].value = 'typed';
    inputs[2].dispatchEvent(new Event('input'));
    expect(host.control.value).toBe('typed');
  });
});

// ---------------------------------------------------------------------------
// 3.3: SI-2 (input purpose and keyboard hints), the character count announced
// only near the limit, SI-8 (field border), SI-9 (requiredIndicator),
// SI-10 (read-only values that wrap).
// ---------------------------------------------------------------------------
describe('InputComponent 3.3 (sign-in gaps)', () => {
  let fixture: ComponentFixture<InputComponent>;
  let component: InputComponent;
  const el = () => fixture.nativeElement as HTMLElement;
  const field = () => el().querySelector('input') as HTMLInputElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [InputComponent] }).compileComponents();
    fixture = TestBed.createComponent(InputComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('label', 'Name');
    fixture.detectChanges();
  });

  describe('SI-2: autocomplete, name, autocapitalize, spellcheck, enterkeyhint', () => {
    it('renders none of them by default (3.2 behaviour)', () => {
      for (const attr of ['autocomplete', 'name', 'autocapitalize', 'spellcheck', 'enterkeyhint']) {
        expect(field().hasAttribute(attr)).toBe(false);
      }
    });

    it('passes each one to the native input', () => {
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
    });

    it('renders spellcheck="true" when switched on', () => {
      fixture.componentRef.setInput('spellcheck', true);
      fixture.detectChanges();
      expect(field().getAttribute('spellcheck')).toBe('true');
    });
  });

  describe('character count', () => {
    const live = () => el().querySelector('.input-char-count-live') as HTMLElement;

    beforeEach(() => {
      fixture.componentRef.setInput('maxLength', 80);
      fixture.componentRef.setInput('showCharCount', true);
      fixture.detectChanges();
    });

    it('the visible count is no live region (it no longer speaks on every keystroke)', () => {
      const visible = el().querySelector('.char-count') as HTMLElement;
      expect(visible.textContent).toContain('0 / 80');
      expect(visible.hasAttribute('aria-live')).toBe(false);
    });

    it('a polite live region stays silent while the limit is far', () => {
      expect(live().getAttribute('aria-live')).toBe('polite');
      component.writeValue('x'.repeat(71));
      fixture.detectChanges();
      expect(live().textContent?.trim()).toBe('');
    });

    it('announces the remaining characters near the limit (default: the last 10 %)', () => {
      component.writeValue('x'.repeat(72));
      fixture.detectChanges();
      expect(live().textContent?.trim()).toBe('Characters remaining: 8');
      component.writeValue('x'.repeat(80));
      fixture.detectChanges();
      expect(live().textContent?.trim()).toBe('Characters remaining: 0');
    });

    it('takes a translated label and its own threshold', () => {
      fixture.componentRef.setInput('charCountRemainingLabel', 'Noch {remaining} Zeichen');
      fixture.componentRef.setInput('charCountAnnounceThreshold', 20);
      component.writeValue('x'.repeat(60));
      fixture.detectChanges();
      expect(live().textContent?.trim()).toBe('Noch 20 Zeichen');
    });
  });

  describe('aria-describedby', () => {
    it('is absent without error or helper text', () => {
      expect(field().hasAttribute('aria-describedby')).toBe(false);
    });

    it('points at the helper text', () => {
      fixture.componentRef.setInput('helperText', 'As it appears to others');
      fixture.detectChanges();
      const id = field().getAttribute('aria-describedby') as string;
      expect(el().querySelector(`#${id}`)?.textContent?.trim()).toBe('As it appears to others');
    });

    it('points only at the error while the error replaces the helper text', () => {
      fixture.componentRef.setInput('helperText', 'Help');
      fixture.componentRef.setInput('error', 'Enter your name.');
      fixture.detectChanges();
      const ids = (field().getAttribute('aria-describedby') as string).split(' ');
      expect(ids).toHaveLength(1);
      expect(el().querySelector(`#${ids[0]}`)?.textContent?.trim()).toBe('Enter your name.');
    });
  });

  describe('SI-9: requiredIndicator', () => {
    it('shows the asterisk for required fields by default', () => {
      fixture.componentRef.setInput('required', true);
      fixture.detectChanges();
      expect(el().querySelector('.required-indicator')).toBeTruthy();
    });

    it('keeps the required semantics without the asterisk', () => {
      fixture.componentRef.setInput('required', true);
      fixture.componentRef.setInput('requiredIndicator', false);
      fixture.detectChanges();
      expect(el().querySelector('.required-indicator')).toBeNull();
      expect(field().required).toBe(true);
      expect(field().getAttribute('aria-required')).toBe('true');
    });
  });

  describe('SI-10: readonlyWrap', () => {
    beforeEach(() => {
      fixture.componentRef.setInput('readonly', true);
      fixture.componentRef.setInput('autocomplete', 'username');
      fixture.componentRef.setInput('name', 'username');
      component.writeValue('johanna-friederike.brandt-oberhausen@example.com');
    });

    it('keeps the native read-only input by default', () => {
      fixture.detectChanges();
      expect(field().readOnly).toBe(true);
      expect(field().hidden).toBe(false);
      expect(el().querySelector('.input-readonly-value')).toBeNull();
    });

    it('shows the value as wrapping text, named by the label', () => {
      fixture.componentRef.setInput('readonlyWrap', true);
      fixture.detectChanges();
      const value = el().querySelector('.input-readonly-value') as HTMLElement;
      const label = el().querySelector('label') as HTMLElement;
      expect(value.textContent?.trim()).toBe('johanna-friederike.brandt-oberhausen@example.com');
      expect(value.getAttribute('role')).toBe('textbox');
      expect(value.getAttribute('aria-readonly')).toBe('true');
      expect(value.getAttribute('tabindex')).toBe('0');
      expect(value.getAttribute('aria-labelledby')).toBe(label.id);
      expect(el().querySelector('.input-container')?.classList).toContain('input-readonly-wrap');
    });

    it('keeps a hidden native input with the value for forms and password managers', () => {
      fixture.componentRef.setInput('readonlyWrap', true);
      fixture.detectChanges();
      expect(field().hidden).toBe(true);
      expect(field().value).toBe('johanna-friederike.brandt-oberhausen@example.com');
      expect(field().getAttribute('autocomplete')).toBe('username');
      expect(field().getAttribute('name')).toBe('username');
    });

    it('focus() moves to the visible value', () => {
      fixture.componentRef.setInput('readonlyWrap', true);
      fixture.detectChanges();
      component.focus();
      expect(document.activeElement?.classList).toContain('input-readonly-value');
    });

    it('has no effect on an editable field', () => {
      fixture.componentRef.setInput('readonly', false);
      fixture.componentRef.setInput('readonlyWrap', true);
      fixture.detectChanges();
      expect(field().hidden).toBe(false);
      expect(el().querySelector('.input-readonly-value')).toBeNull();
    });
  });

  describe('SI-8: field border', () => {
    it('draws the field boundary with --color-field-border (≥ 3:1)', () => {
      const scss = readFileSync(resolve(__dirname, 'input.component.scss'), 'utf-8');
      const container = scss.match(/\.input-container \{([^}]*)/)?.[1] ?? '';
      expect(container).toMatch(/border: 1px solid var\(--color-field-border/);
    });
  });
});

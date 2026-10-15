import { Component, signal, ChangeDetectionStrategy } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient, withXhr } from '@angular/common/http';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { readFileSync } from 'fs';
import { resolve } from 'path';
import { PasswordInputComponent, PasswordStrength } from './password-input.component';

@Component({
  standalone: true,
  imports: [PasswordInputComponent, ReactiveFormsModule],
  changeDetection: ChangeDetectionStrategy.Eager,
  template: `
    <lc-password-input
      [formControl]="control"
      [label]="label()"
      [placeholder]="placeholder()"
      [required]="required()"
      [error]="error()"
      [showStrengthMeter]="showStrengthMeter()"
      [showRequirements]="showRequirements()"
      (strengthChange)="strengths.push($event)"
    />
  `,
})
class FormHostComponent {
  readonly control = new FormControl<string>('', { nonNullable: true });
  readonly label = signal('Password');
  readonly placeholder = signal('Enter password');
  readonly required = signal(false);
  readonly error = signal<string | undefined>(undefined);
  readonly showStrengthMeter = signal(false);
  readonly showRequirements = signal(false);
  readonly strengths: PasswordStrength[] = [];
}

@Component({
  standalone: true,
  imports: [PasswordInputComponent],
  changeDetection: ChangeDetectionStrategy.Eager,
  template: `
    <lc-password-input label="Password" [disabled]="disabled()" />
    <lc-password-input label="Confirm Password" />
  `,
})
class TwoInstancesHostComponent {
  readonly disabled = signal(false);
}

describe('PasswordInputComponent', () => {
  describe('with a FormControl host', () => {
    let fixture: ComponentFixture<FormHostComponent>;
    let host: FormHostComponent;

    const input = (): HTMLInputElement => fixture.nativeElement.querySelector('input.lc-input');
    const label = (): HTMLLabelElement => fixture.nativeElement.querySelector('label.lc-label');
    const toggle = (): HTMLButtonElement => fixture.nativeElement.querySelector('button.lc-toggle-btn');
    const errorEl = (): HTMLElement | null => fixture.nativeElement.querySelector('.lc-error');
    const strengthLabel = (): HTMLElement | null => fixture.nativeElement.querySelector('.lc-strength-label');
    const strengthFill = (): HTMLElement | null => fixture.nativeElement.querySelector('.lc-strength-fill');

    const type = (text: string): void => {
      const el = input();
      el.value = text;
      el.dispatchEvent(new Event('input'));
      fixture.detectChanges();
    };

    beforeEach(async () => {
      await TestBed.configureTestingModule({
        imports: [FormHostComponent],
        providers: [provideHttpClient(withXhr())],
      }).compileComponents();

      fixture = TestBed.createComponent(FormHostComponent);
      host = fixture.componentInstance;
      fixture.detectChanges();
    });

    it('renders a password input with label linked via for/id', () => {
      expect(input().type).toBe('password');
      expect(input().placeholder).toBe('Enter password');
      expect(input().id).toMatch(/^lc-password-input-\d+$/);
      expect(label().getAttribute('for')).toBe(input().id);
      expect(label().textContent).toContain('Password');
    });

    it('renders the required indicator hidden from AT and sets aria-required', () => {
      expect(input().hasAttribute('aria-required')).toBe(false);
      host.required.set(true);
      fixture.detectChanges();
      const indicator = fixture.nativeElement.querySelector('.lc-required');
      expect(indicator?.getAttribute('aria-hidden')).toBe('true');
      expect(input().required).toBe(true);
      expect(input().getAttribute('aria-required')).toBe('true');
    });

    it('reflects control.setValue() in the DOM without manual markForCheck', () => {
      host.control.setValue('Secret1!');
      fixture.detectChanges();
      expect(input().value).toBe('Secret1!');
    });

    it('reflects control.disable()/enable() on the input and toggle button', () => {
      host.control.disable();
      fixture.detectChanges();
      expect(input().disabled).toBe(true);
      expect(toggle().disabled).toBe(true);

      host.control.enable();
      fixture.detectChanges();
      expect(input().disabled).toBe(false);
      expect(toggle().disabled).toBe(false);
    });

    it('propagates typed input to the control and marks touched on blur', () => {
      type('abc');
      expect(host.control.value).toBe('abc');
      input().dispatchEvent(new Event('blur'));
      fixture.detectChanges();
      expect(host.control.touched).toBe(true);
    });

    it('toggles visibility with an accessible, pressed-state button', () => {
      expect(toggle().getAttribute('aria-label')).toBe('Show password');
      expect(toggle().getAttribute('aria-pressed')).toBe('false');
      expect(toggle().getAttribute('aria-controls')).toBe(input().id);

      toggle().click();
      fixture.detectChanges();
      expect(input().type).toBe('text');
      expect(toggle().getAttribute('aria-label')).toBe('Hide password');
      expect(toggle().getAttribute('aria-pressed')).toBe('true');

      toggle().click();
      fixture.detectChanges();
      expect(input().type).toBe('password');
    });

    it('links the error via aria-describedby with a per-instance id and sets aria-invalid', () => {
      expect(input().hasAttribute('aria-invalid')).toBe(false);
      expect(input().hasAttribute('aria-describedby')).toBe(false);
      expect(errorEl()).toBeNull();

      host.error.set('Incorrect password');
      fixture.detectChanges();

      expect(input().getAttribute('aria-invalid')).toBe('true');
      expect(input().classList).toContain('lc-input-error');
      expect(errorEl()?.textContent?.trim()).toBe('Incorrect password');
      expect(errorEl()?.getAttribute('role')).toBe('alert');
      expect(errorEl()?.id).toBe(`${input().id}-error`);
      expect(input().getAttribute('aria-describedby')).toBe(errorEl()?.id);
    });

    describe('strength meter', () => {
      beforeEach(() => {
        host.showStrengthMeter.set(true);
        fixture.detectChanges();
      });

      it('exposes an accessible live label and links it to the input', () => {
        expect(strengthLabel()?.getAttribute('role')).toBe('status');
        expect(strengthLabel()?.getAttribute('aria-live')).toBe('polite');
        expect(strengthLabel()?.textContent?.replace(/\s+/g, ' ').trim()).toBe('Password strength: Weak');
        expect(input().getAttribute('aria-describedby')).toContain(strengthLabel()?.id);
        expect(fixture.nativeElement.querySelector('.lc-strength-bar')?.getAttribute('aria-hidden')).toBe('true');
      });

      it.each([
        ['', 'Weak', 0],
        ['abc', 'Weak', 20],
        ['abcdefgh', 'Fair', 40],
        ['Abcdefgh', 'Good', 60],
        ['Abcdefg1', 'Strong', 80],
        ['Abcdefg1!', 'Strong', 100],
      ])('classifies %p as %s (%i%%)', (password, level, percentage) => {
        type(password);
        expect(strengthLabel()?.textContent).toContain(level);
        expect(strengthLabel()?.classList).toContain(`lc-strength-${level.toLowerCase()}`);
        expect(strengthFill()?.classList).toContain(`lc-strength-${level.toLowerCase()}`);
        expect(strengthFill()?.style.width).toBe(`${percentage}%`);
      });

      it('updates the meter for form writes without manual markForCheck', () => {
        host.control.setValue('Abcdefg1!');
        fixture.detectChanges();
        expect(strengthLabel()?.textContent).toContain('Strong');
        expect(strengthFill()?.style.width).toBe('100%');
      });

      it('emits strengthChange on typing and on form writes', () => {
        host.strengths.length = 0;
        type('Abcdefgh');
        expect(host.strengths).toHaveLength(1);
        expect(host.strengths[0]).toEqual({ score: 3, level: 'Good', percentage: 60 });

        host.control.setValue('Abcdefg1!');
        fixture.detectChanges();
        expect(host.strengths).toHaveLength(2);
        expect(host.strengths[1]).toEqual({ score: 5, level: 'Strong', percentage: 100 });
      });
    });

    describe('requirements checklist', () => {
      it('renders one entry per requirement and reflects the met state', () => {
        host.showRequirements.set(true);
        fixture.detectChanges();
        const items: HTMLElement[] = Array.from(fixture.nativeElement.querySelectorAll('.lc-requirement'));
        expect(items).toHaveLength(5);
        expect(items.every((li) => li.classList.contains('lc-requirement-unmet'))).toBe(true);

        type('Abcdefg1!');
        const met: HTMLElement[] = Array.from(fixture.nativeElement.querySelectorAll('.lc-requirement-met'));
        expect(met).toHaveLength(5);
        expect(met[0].textContent).toContain('(met)');
      });
    });
  });

  describe('with two instances', () => {
    let fixture: ComponentFixture<TwoInstancesHostComponent>;
    let host: TwoInstancesHostComponent;

    beforeEach(async () => {
      await TestBed.configureTestingModule({
        imports: [TwoInstancesHostComponent],
        providers: [provideHttpClient(withXhr())],
      }).compileComponents();

      fixture = TestBed.createComponent(TwoInstancesHostComponent);
      host = fixture.componentInstance;
      fixture.detectChanges();
    });

    it('generates unique, label-independent ids across instances', () => {
      const inputs: HTMLInputElement[] = Array.from(fixture.nativeElement.querySelectorAll('input.lc-input'));
      const labels: HTMLLabelElement[] = Array.from(fixture.nativeElement.querySelectorAll('label.lc-label'));
      expect(inputs).toHaveLength(2);
      expect(inputs[0].id).not.toBe(inputs[1].id);
      expect(inputs[0].id).not.toContain(' ');
      expect(inputs[1].id).not.toContain(' ');
      expect(labels[0].getAttribute('for')).toBe(inputs[0].id);
      expect(labels[1].getAttribute('for')).toBe(inputs[1].id);
    });

    it('disables the input and toggle when the disabled input is set', () => {
      const first: HTMLInputElement = fixture.nativeElement.querySelector('input.lc-input');
      const toggle: HTMLButtonElement = fixture.nativeElement.querySelector('button.lc-toggle-btn');
      host.disabled.set(true);
      fixture.detectChanges();
      expect(first.disabled).toBe(true);
      expect(toggle.disabled).toBe(true);
    });
  });

  describe('ControlValueAccessor (direct)', () => {
    let fixture: ComponentFixture<PasswordInputComponent>;
    let component: PasswordInputComponent;

    beforeEach(async () => {
      await TestBed.configureTestingModule({
        imports: [PasswordInputComponent],
        providers: [provideHttpClient(withXhr())],
      }).compileComponents();

      fixture = TestBed.createComponent(PasswordInputComponent);
      component = fixture.componentInstance;
      fixture.detectChanges();
    });

    it('writes null/undefined as empty string', () => {
      component.writeValue('x');
      expect(component.value()).toBe('x');
      component.writeValue(null);
      expect(component.value()).toBe('');
      component.writeValue(undefined);
      expect(component.value()).toBe('');
    });

    it('ORs the disabled input with the form disabled state', () => {
      expect(component.isDisabled()).toBe(false);
      component.setDisabledState(true);
      expect(component.isDisabled()).toBe(true);
      component.setDisabledState(false);
      fixture.componentRef.setInput('disabled', true);
      expect(component.isDisabled()).toBe(true);
    });
  });
});

// ---------------------------------------------------------------------------
// 3.3: SI-2 (input purpose, no keyboard help on a shown password), SI-3 (NIST
// rules: helper text, minLength, length-only meter, 44 px toggle), SI-8
// (field border), SI-9 (requiredIndicator).
// ---------------------------------------------------------------------------
describe('PasswordInputComponent 3.3 (sign-in gaps)', () => {
  let fixture: ComponentFixture<PasswordInputComponent>;
  let component: PasswordInputComponent;
  const el = () => fixture.nativeElement as HTMLElement;
  const field = () => el().querySelector('input') as HTMLInputElement;
  const type = (value: string) => {
    field().value = value;
    field().dispatchEvent(new Event('input'));
    fixture.detectChanges();
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [PasswordInputComponent] }).compileComponents();
    fixture = TestBed.createComponent(PasswordInputComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  describe('SI-2', () => {
    it('renders no autocomplete, name or enterkeyhint by default', () => {
      for (const attr of ['autocomplete', 'name', 'enterkeyhint']) {
        expect(field().hasAttribute(attr)).toBe(false);
      }
    });

    it('passes autocomplete, name and enterkeyhint to the native input', () => {
      fixture.componentRef.setInput('autocomplete', 'new-password');
      fixture.componentRef.setInput('name', 'password');
      fixture.componentRef.setInput('enterkeyhint', 'go');
      fixture.detectChanges();
      expect(field().getAttribute('autocomplete')).toBe('new-password');
      expect(field().getAttribute('name')).toBe('password');
      expect(field().getAttribute('enterkeyhint')).toBe('go');
    });

    it('never capitalises, corrects or spell-checks a password, also while it is shown', () => {
      expect(field().getAttribute('autocapitalize')).toBe('off');
      expect(field().getAttribute('spellcheck')).toBe('false');
      expect(field().getAttribute('autocorrect')).toBe('off');
      (el().querySelector('.lc-toggle-btn') as HTMLButtonElement).click();
      fixture.detectChanges();
      expect(field().getAttribute('type')).toBe('text');
      expect(field().getAttribute('spellcheck')).toBe('false');
      expect(field().getAttribute('autocapitalize')).toBe('off');
    });

    it('lets an app override autocapitalize and spellcheck', () => {
      fixture.componentRef.setInput('autocapitalize', 'none');
      fixture.componentRef.setInput('spellcheck', true);
      fixture.detectChanges();
      expect(field().getAttribute('autocapitalize')).toBe('none');
      expect(field().getAttribute('spellcheck')).toBe('true');
    });
  });

  describe('SI-3', () => {
    it('shows helper text and links it to the input', () => {
      fixture.componentRef.setInput('helperText', 'At least 8 characters.');
      fixture.detectChanges();
      const id = field().getAttribute('aria-describedby') as string;
      expect(el().querySelector(`#${id}`)?.textContent?.trim()).toBe('At least 8 characters.');
    });

    it('the error replaces the helper text', () => {
      fixture.componentRef.setInput('helperText', 'At least 8 characters.');
      fixture.componentRef.setInput('error', 'Too short.');
      fixture.detectChanges();
      expect(el().querySelector('.lc-helper')).toBeNull();
      const ids = (field().getAttribute('aria-describedby') as string).split(' ');
      expect(ids).toEqual([component.errorId]);
    });

    it('sets the native minlength and checks the length requirement against it', () => {
      fixture.componentRef.setInput('minLength', 12);
      fixture.detectChanges();
      expect(field().getAttribute('minlength')).toBe('12');
      type('abcdefghij');
      expect(component.requirements()[0].met).toBe(false);
      type('abcdefghijkl');
      expect(component.requirements()[0].met).toBe(true);
    });

    it('keeps the 3.2 rule of 8 characters without minLength', () => {
      expect(field().hasAttribute('minlength')).toBe(false);
      type('abcdefgh');
      expect(component.requirements()[0].met).toBe(true);
    });

    it('strengthMode "length" scores the length only (NIST), never the character classes', () => {
      fixture.componentRef.setInput('strengthMode', 'length');
      fixture.componentRef.setInput('showStrengthMeter', true);
      fixture.detectChanges();
      type('Ab1!');
      expect(component.strength().level).toBe('Weak');
      type('aaaaaaaa');
      expect(component.strength().level).toBe('Fair');
      type('aaaaaaaaaaaa');
      expect(component.strength().level).toBe('Good');
      type('a'.repeat(16));
      expect(component.strength().level).toBe('Strong');
      expect(component.strength().percentage).toBe(100);
    });

    it('strengthMode "length" lists only the length requirement', () => {
      fixture.componentRef.setInput('strengthMode', 'length');
      fixture.componentRef.setInput('showRequirements', true);
      fixture.detectChanges();
      expect(el().querySelectorAll('.lc-requirement')).toHaveLength(1);
    });

    it('the visibility toggle is a 44 px target', () => {
      const scss = readFileSync(resolve(__dirname, 'password-input.component.scss'), 'utf-8');
      const toggle = scss.match(/\.lc-toggle-btn \{([^}]*)/)?.[1] ?? '';
      expect(toggle).toMatch(/width: 2\.75rem;/);
      expect(toggle).toMatch(/height: 2\.75rem;/);
    });
  });

  describe('SI-8 and SI-9', () => {
    it('draws the field boundary with --color-field-border', () => {
      const scss = readFileSync(resolve(__dirname, 'password-input.component.scss'), 'utf-8');
      const inputRule = scss.match(/\.lc-input \{([^}]*)/)?.[1] ?? '';
      expect(inputRule).toMatch(/border: 1px solid var\(--color-field-border/);
    });

    it('keeps required semantics without the asterisk', () => {
      fixture.componentRef.setInput('required', true);
      fixture.componentRef.setInput('requiredIndicator', false);
      fixture.detectChanges();
      expect(el().querySelector('.lc-required')).toBeNull();
      expect(field().required).toBe(true);
    });
  });
});

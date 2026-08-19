import { Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { PasswordInputComponent, PasswordStrength } from './password-input.component';

@Component({
  standalone: true,
  imports: [PasswordInputComponent, ReactiveFormsModule],
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
        providers: [provideHttpClient()],
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
        providers: [provideHttpClient()],
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
        providers: [provideHttpClient()],
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

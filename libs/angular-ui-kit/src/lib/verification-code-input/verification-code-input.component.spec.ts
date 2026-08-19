import { Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { VerificationCodeInputComponent } from './verification-code-input.component';

@Component({
  standalone: true,
  imports: [VerificationCodeInputComponent, ReactiveFormsModule],
  template: `
    <lc-verification-code-input
      [formControl]="control"
      [label]="label()"
      [length]="length()"
      [required]="required()"
      [error]="error()"
      [hint]="hint()"
      [autoSubmit]="autoSubmit()"
      [autofocus]="autofocus()"
      (complete)="completions.push($event)"
    />
  `,
})
class FormHostComponent {
  readonly control = new FormControl<string>('', { nonNullable: true });
  readonly label = signal('Verification Code');
  readonly length = signal(6);
  readonly required = signal(false);
  readonly error = signal<string | undefined>(undefined);
  readonly hint = signal<string | undefined>(undefined);
  readonly autoSubmit = signal(false);
  readonly autofocus = signal(false);
  readonly completions: string[] = [];
}

@Component({
  standalone: true,
  imports: [VerificationCodeInputComponent],
  template: `
    <lc-verification-code-input label="First" [length]="4" [disabled]="disabled()" />
    <lc-verification-code-input label="Second" [length]="4" [autofocus]="true" />
  `,
})
class TwoInstancesHostComponent {
  readonly disabled = signal(false);
}

describe('VerificationCodeInputComponent', () => {
  describe('with a FormControl host', () => {
    let fixture: ComponentFixture<FormHostComponent>;
    let host: FormHostComponent;

    const inputs = (): HTMLInputElement[] => Array.from(fixture.nativeElement.querySelectorAll('input.lc-digit-input'));
    const group = (): HTMLElement => fixture.nativeElement.querySelector('.lc-digit-inputs');
    const hintEl = (): HTMLElement | null => fixture.nativeElement.querySelector('.lc-hint');
    const errorEl = (): HTMLElement | null => fixture.nativeElement.querySelector('.lc-error');

    const typeDigit = (index: number, value: string): void => {
      const el = inputs()[index];
      el.value = value;
      el.dispatchEvent(new Event('input'));
      fixture.detectChanges();
    };

    const keydown = (index: number, key: string): KeyboardEvent => {
      const event = new KeyboardEvent('keydown', { key, cancelable: true });
      inputs()[index].dispatchEvent(event);
      fixture.detectChanges();
      return event;
    };

    const paste = (text: string): void => {
      const event = new Event('paste', { cancelable: true }) as ClipboardEvent;
      Object.defineProperty(event, 'clipboardData', { value: { getData: () => text } });
      group().dispatchEvent(event);
      fixture.detectChanges();
    };

    beforeEach(async () => {
      await TestBed.configureTestingModule({
        imports: [FormHostComponent],
      }).compileComponents();

      fixture = TestBed.createComponent(FormHostComponent);
      host = fixture.componentInstance;
      fixture.detectChanges();
    });

    it('renders `length` digit inputs and reacts to length changes', () => {
      expect(inputs()).toHaveLength(6);
      expect(inputs()[0].getAttribute('aria-label')).toBe('Digit 1 of 6');

      host.length.set(4);
      fixture.detectChanges();
      expect(inputs()).toHaveLength(4);
      expect(inputs()[3].getAttribute('aria-label')).toBe('Digit 4 of 4');
    });

    it('labels the group and links hint/error via aria-describedby', () => {
      const labelEl: HTMLElement = fixture.nativeElement.querySelector('.lc-label');
      expect(group().getAttribute('role')).toBe('group');
      expect(group().getAttribute('aria-labelledby')).toBe(labelEl.id);
      expect(labelEl.id).toMatch(/^lc-verification-code-\d+-label$/);
      expect(hintEl()?.textContent?.trim()).toBe('Enter the 6-digit code');
      expect(group().getAttribute('aria-describedby')).toBe(hintEl()?.id);

      host.error.set('Invalid code');
      fixture.detectChanges();
      expect(errorEl()?.textContent?.trim()).toBe('Invalid code');
      expect(errorEl()?.getAttribute('role')).toBe('alert');
      expect(group().getAttribute('aria-describedby')).toBe(`${errorEl()?.id} ${hintEl()?.id}`);
      expect(inputs()[0].getAttribute('aria-invalid')).toBe('true');
      expect(inputs()[0].getAttribute('aria-describedby')).toBe(errorEl()?.id);
      expect(inputs()[0].classList).toContain('lc-digit-input-error');
    });

    it('derives the default hint from length, accepts a custom hint and hides an empty one', () => {
      host.length.set(4);
      fixture.detectChanges();
      expect(hintEl()?.textContent?.trim()).toBe('Enter the 4-digit code');

      host.hint.set('Check your authenticator app');
      fixture.detectChanges();
      expect(hintEl()?.textContent?.trim()).toBe('Check your authenticator app');

      host.hint.set('');
      fixture.detectChanges();
      expect(hintEl()).toBeNull();
      expect(group().hasAttribute('aria-describedby')).toBe(false);
    });

    it('marks inputs required and renders the indicator hidden from AT', () => {
      host.required.set(true);
      fixture.detectChanges();
      expect(inputs().every((el) => el.required)).toBe(true);
      expect(inputs()[0].getAttribute('aria-required')).toBe('true');
      expect(fixture.nativeElement.querySelector('.lc-required')?.getAttribute('aria-hidden')).toBe('true');
    });

    it('does not focus on mount unless autofocus is set', () => {
      expect(document.activeElement).not.toBe(inputs()[0]);
    });

    it('reflects control.setValue() in the digit inputs without manual markForCheck', () => {
      host.control.setValue('123456');
      fixture.detectChanges();
      expect(inputs().map((el) => el.value)).toEqual(['1', '2', '3', '4', '5', '6']);
      expect(inputs()[0].classList).toContain('lc-digit-input-filled');

      host.control.setValue('12');
      fixture.detectChanges();
      expect(inputs().map((el) => el.value)).toEqual(['1', '2', '', '', '', '']);

      host.control.setValue('');
      fixture.detectChanges();
      expect(inputs().map((el) => el.value)).toEqual(['', '', '', '', '', '']);
      expect(host.completions).toEqual([]);
    });

    it('reflects control.disable()/enable() in the DOM without manual markForCheck', () => {
      host.control.disable();
      fixture.detectChanges();
      expect(inputs().every((el) => el.disabled)).toBe(true);

      host.control.enable();
      fixture.detectChanges();
      expect(inputs().every((el) => el.disabled)).toBe(false);
    });

    it('advances focus and updates the control while typing digits', () => {
      typeDigit(0, '1');
      expect(host.control.value).toBe('1');
      expect(document.activeElement).toBe(inputs()[1]);

      typeDigit(1, '2');
      expect(host.control.value).toBe('12');
      expect(document.activeElement).toBe(inputs()[2]);
      expect(host.completions).toEqual([]);
    });

    it('rejects non-digit input', () => {
      typeDigit(0, 'a');
      expect(inputs()[0].value).toBe('');
      expect(host.control.value).toBe('');
      expect(document.activeElement).not.toBe(inputs()[1]);
    });

    it('emits complete exactly once when the last digit is typed', () => {
      ['1', '2', '3', '4', '5', '6'].forEach((d, i) => typeDigit(i, d));
      expect(host.control.value).toBe('123456');
      expect(host.control.touched).toBe(true);
      expect(host.completions).toEqual(['123456']);
      expect(document.activeElement).toBe(inputs()[5]);
    });

    it('emits complete exactly once with autoSubmit enabled', async () => {
      host.autoSubmit.set(true);
      fixture.detectChanges();
      ['1', '2', '3', '4', '5', '6'].forEach((d, i) => typeDigit(i, d));
      await new Promise((resolve) => setTimeout(resolve, 150));
      expect(host.completions).toEqual(['123456']);
    });

    it('distributes several digits entered at once (autofill) from the current slot', () => {
      typeDigit(2, '3456');
      expect(host.control.value).toBe('3456');
      expect(inputs().map((el) => el.value)).toEqual(['', '', '3', '4', '5', '6']);
      expect(host.completions).toEqual([]);
    });

    it('splits a pasted code across the inputs and emits complete once', () => {
      paste('12 34-56');
      expect(inputs().map((el) => el.value)).toEqual(['1', '2', '3', '4', '5', '6']);
      expect(host.control.value).toBe('123456');
      expect(host.completions).toEqual(['123456']);
      expect(document.activeElement).toBe(inputs()[5]);
    });

    it('splits a pasted code across the inputs and emits once with autoSubmit', async () => {
      host.autoSubmit.set(true);
      fixture.detectChanges();
      paste('123456');
      await new Promise((resolve) => setTimeout(resolve, 150));
      expect(host.completions).toEqual(['123456']);
    });

    it('fills partial pastes and focuses the next empty slot', () => {
      paste('123');
      expect(inputs().map((el) => el.value)).toEqual(['1', '2', '3', '', '', '']);
      expect(document.activeElement).toBe(inputs()[3]);
      expect(host.completions).toEqual([]);
    });

    it('ignores pastes while disabled', () => {
      host.control.disable();
      fixture.detectChanges();
      paste('123456');
      expect(host.control.value).toBe('');
      expect(host.completions).toEqual([]);
    });

    it('clears the current digit on Backspace, or moves back and clears the previous one', () => {
      host.control.setValue('12');
      fixture.detectChanges();

      const first = keydown(1, 'Backspace');
      expect(first.defaultPrevented).toBe(true);
      expect(host.control.value).toBe('1');
      expect(inputs()[1].value).toBe('');

      keydown(1, 'Backspace');
      expect(host.control.value).toBe('');
      expect(inputs()[0].value).toBe('');
      expect(document.activeElement).toBe(inputs()[0]);
    });

    it('navigates with arrow keys', () => {
      keydown(0, 'ArrowRight');
      expect(document.activeElement).toBe(inputs()[1]);
      keydown(1, 'ArrowLeft');
      expect(document.activeElement).toBe(inputs()[0]);
      // No wrap-around at the edges
      keydown(0, 'ArrowLeft');
      expect(document.activeElement).toBe(inputs()[0]);
    });
  });

  describe('with two instances', () => {
    let fixture: ComponentFixture<TwoInstancesHostComponent>;
    let host: TwoInstancesHostComponent;

    beforeEach(async () => {
      await TestBed.configureTestingModule({
        imports: [TwoInstancesHostComponent],
      }).compileComponents();

      fixture = TestBed.createComponent(TwoInstancesHostComponent);
      host = fixture.componentInstance;
      fixture.detectChanges();
    });

    it('generates unique ids across instances', () => {
      const groups: HTMLElement[] = Array.from(fixture.nativeElement.querySelectorAll('.lc-digit-inputs'));
      const labels: HTMLElement[] = Array.from(fixture.nativeElement.querySelectorAll('.lc-label'));
      expect(groups).toHaveLength(2);
      expect(groups[0].id).not.toBe(groups[1].id);
      expect(groups[0].getAttribute('aria-labelledby')).toBe(labels[0].id);
      expect(groups[1].getAttribute('aria-labelledby')).toBe(labels[1].id);
    });

    it('focuses the first digit of the instance with autofocus', () => {
      const secondFirstDigit: HTMLInputElement = fixture.nativeElement.querySelectorAll('.lc-digit-inputs')[1].querySelector('input');
      expect(document.activeElement).toBe(secondFirstDigit);
    });

    it('disables the digit inputs when the disabled input is set', () => {
      host.disabled.set(true);
      fixture.detectChanges();
      const firstInputs: HTMLInputElement[] = Array.from(
        fixture.nativeElement.querySelectorAll('.lc-digit-inputs')[0].querySelectorAll('input'),
      );
      expect(firstInputs).toHaveLength(4);
      expect(firstInputs.every((el) => el.disabled)).toBe(true);
    });
  });

  describe('ControlValueAccessor (direct)', () => {
    let fixture: ComponentFixture<VerificationCodeInputComponent>;
    let component: VerificationCodeInputComponent;

    beforeEach(async () => {
      await TestBed.configureTestingModule({
        imports: [VerificationCodeInputComponent],
      }).compileComponents();

      fixture = TestBed.createComponent(VerificationCodeInputComponent);
      component = fixture.componentInstance;
      fixture.detectChanges();
    });

    it('writes null/undefined as an empty code and truncates to length', () => {
      component.writeValue('1234567');
      expect(component.code()).toBe('123456');
      component.writeValue(null);
      expect(component.code()).toBe('');
      component.writeValue(undefined);
      expect(component.digits()).toEqual(['', '', '', '', '', '']);
    });

    it('resets the digits when length changes', () => {
      component.writeValue('123456');
      fixture.componentRef.setInput('length', 4);
      expect(component.digits()).toEqual(['', '', '', '']);
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

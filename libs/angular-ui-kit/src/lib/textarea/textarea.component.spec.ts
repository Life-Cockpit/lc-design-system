import { Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { TextareaComponent } from './textarea.component';

@Component({
  standalone: true,
  imports: [TextareaComponent, ReactiveFormsModule],
  template: `
    <lc-textarea
      [formControl]="control"
      [label]="label()"
      [placeholder]="placeholder()"
      [variant]="variant()"
      [size]="size()"
      [error]="error()"
      [errorMessage]="errorMessage()"
      [helperText]="helperText()"
      [required]="required()"
      [readonly]="readonly()"
      [rows]="rows()"
      [maxLength]="maxLength()"
      [showCharacterCount]="showCharacterCount()"
      [autoResize]="autoResize()"
      [ariaLabel]="ariaLabel()"
      (valueChange)="changes.push($event)"
    />
  `,
})
class FormHostComponent {
  readonly control = new FormControl<string>('', { nonNullable: true });
  readonly label = signal('Description');
  readonly placeholder = signal('Enter text');
  readonly variant = signal<'outline' | 'filled'>('outline');
  readonly size = signal<'xs' | 'sm' | 'md' | 'lg'>('md');
  readonly error = signal(false);
  readonly errorMessage = signal('');
  readonly helperText = signal('');
  readonly required = signal(false);
  readonly readonly = signal(false);
  readonly rows = signal(3);
  readonly maxLength = signal<number | undefined>(undefined);
  readonly showCharacterCount = signal(false);
  readonly autoResize = signal(false);
  readonly ariaLabel = signal<string | undefined>(undefined);
  readonly changes: string[] = [];
}

@Component({
  standalone: true,
  imports: [TextareaComponent],
  template: `
    <lc-textarea label="First" [disabled]="disabled()" />
    <lc-textarea label="Second" />
  `,
})
class TwoInstancesHostComponent {
  readonly disabled = signal(false);
}

describe('TextareaComponent', () => {
  describe('with a FormControl host', () => {
    let fixture: ComponentFixture<FormHostComponent>;
    let host: FormHostComponent;

    const textarea = (): HTMLTextAreaElement => fixture.nativeElement.querySelector('textarea');
    const label = (): HTMLLabelElement | null => fixture.nativeElement.querySelector('label.lc-textarea-label');
    const errorEl = (): HTMLElement | null => fixture.nativeElement.querySelector('.lc-textarea-error-message');
    const helperEl = (): HTMLElement | null => fixture.nativeElement.querySelector('.lc-textarea-helper-text');
    const countEl = (): HTMLElement | null => fixture.nativeElement.querySelector('.lc-textarea-character-count');

    const type = (text: string): void => {
      const el = textarea();
      el.value = text;
      el.dispatchEvent(new Event('input'));
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

    it('renders default variant/size classes and the placeholder', () => {
      expect(textarea().classList).toContain('lc-textarea--outline');
      expect(textarea().classList).toContain('lc-textarea--md');
      expect(textarea().placeholder).toBe('Enter text');
      expect(textarea().rows).toBe(3);
    });

    it('updates variant, size and rows when inputs change', () => {
      host.variant.set('filled');
      host.size.set('lg');
      host.rows.set(5);
      fixture.detectChanges();
      expect(textarea().classList).toContain('lc-textarea--filled');
      expect(textarea().classList).toContain('lc-textarea--lg');
      expect(textarea().rows).toBe(5);
    });

    it('associates the label with the textarea via for/id', () => {
      const id = textarea().id;
      expect(id).toMatch(/^lc-textarea-\d+$/);
      expect(label()?.getAttribute('for')).toBe(id);
      expect(label()?.textContent).toContain('Description');
    });

    it('renders the required indicator exactly once, hidden from AT', () => {
      host.required.set(true);
      fixture.detectChanges();
      const indicators = fixture.nativeElement.querySelectorAll('.lc-textarea-required-indicator');
      expect(indicators).toHaveLength(1);
      expect(indicators[0].getAttribute('aria-hidden')).toBe('true');
      expect(label()?.classList.contains('lc-textarea-label--required')).toBe(false);
      expect(textarea().required).toBe(true);
      expect(textarea().getAttribute('aria-required')).toBe('true');
    });

    it('reflects control.setValue() in the DOM without manual markForCheck', () => {
      host.control.setValue('Hello from the form');
      fixture.detectChanges();
      expect(textarea().value).toBe('Hello from the form');
      expect(host.changes).toEqual([]);
    });

    it('reflects control.disable()/enable() in the DOM without manual markForCheck', () => {
      host.control.disable();
      fixture.detectChanges();
      expect(textarea().disabled).toBe(true);
      expect(textarea().classList).toContain('lc-textarea--disabled');

      host.control.enable();
      fixture.detectChanges();
      expect(textarea().disabled).toBe(false);
      expect(textarea().classList).not.toContain('lc-textarea--disabled');
    });

    it('propagates typed input to the control and emits valueChange', () => {
      type('Typed text');
      expect(host.control.value).toBe('Typed text');
      expect(host.changes).toEqual(['Typed text']);
    });

    it('marks the control touched on blur', () => {
      textarea().dispatchEvent(new Event('blur'));
      fixture.detectChanges();
      expect(host.control.touched).toBe(true);
    });

    it('ignores input while readonly', () => {
      host.readonly.set(true);
      fixture.detectChanges();
      expect(textarea().readOnly).toBe(true);
      expect(textarea().classList).toContain('lc-textarea--readonly');
      type('should be ignored');
      expect(host.control.value).toBe('');
      expect(host.changes).toEqual([]);
    });

    it('links the error message via aria-describedby and sets aria-invalid', () => {
      expect(textarea().hasAttribute('aria-invalid')).toBe(false);
      expect(textarea().hasAttribute('aria-describedby')).toBe(false);

      host.error.set(true);
      host.errorMessage.set('Too short');
      fixture.detectChanges();

      expect(textarea().getAttribute('aria-invalid')).toBe('true');
      expect(textarea().classList).toContain('lc-textarea--error');
      expect(errorEl()?.textContent?.trim()).toBe('Too short');
      expect(errorEl()?.getAttribute('role')).toBe('alert');
      expect(errorEl()?.id).toBe(`${textarea().id}-error`);
      expect(textarea().getAttribute('aria-describedby')).toBe(errorEl()?.id);
    });

    it('links the helper text via aria-describedby and hides it while an error shows', () => {
      host.helperText.set('Be descriptive');
      fixture.detectChanges();
      expect(helperEl()?.textContent?.trim()).toBe('Be descriptive');
      expect(helperEl()?.id).toBe(`${textarea().id}-helper`);
      expect(textarea().getAttribute('aria-describedby')).toBe(helperEl()?.id);

      host.error.set(true);
      host.errorMessage.set('Nope');
      fixture.detectChanges();
      expect(helperEl()).toBeNull();
      expect(textarea().getAttribute('aria-describedby')).toBe(errorEl()?.id);
    });

    it('sets aria-label when provided', () => {
      host.ariaLabel.set('Notes field');
      fixture.detectChanges();
      expect(textarea().getAttribute('aria-label')).toBe('Notes field');
    });

    describe('character count', () => {
      it('is hidden by default', () => {
        expect(countEl()).toBeNull();
      });

      it('shows the count without maxLength', () => {
        host.showCharacterCount.set(true);
        fixture.detectChanges();
        type('Hello World');
        expect(countEl()?.textContent?.trim()).toBe('11');
      });

      it('shows the count with maxLength and reacts to maxLength changes', () => {
        host.showCharacterCount.set(true);
        host.maxLength.set(100);
        fixture.detectChanges();
        expect(textarea().getAttribute('maxlength')).toBe('100');
        type('Hello');
        expect(countEl()?.textContent?.trim()).toBe('5 / 100');

        host.maxLength.set(20);
        fixture.detectChanges();
        expect(countEl()?.textContent?.trim()).toBe('5 / 20');
      });

      it('marks the count as over limit when the maxLength input drops below the value length', () => {
        host.showCharacterCount.set(true);
        host.maxLength.set(20);
        fixture.detectChanges();
        host.control.setValue('Hello World');
        fixture.detectChanges();
        expect(countEl()?.classList.contains('lc-textarea-character-count--over-limit')).toBe(false);

        host.maxLength.set(5);
        fixture.detectChanges();
        expect(countEl()?.classList.contains('lc-textarea-character-count--over-limit')).toBe(true);
      });
    });

    describe('auto resize', () => {
      it('drops the rows attribute and adds the auto-resize class', () => {
        host.autoResize.set(true);
        fixture.detectChanges();
        expect(textarea().classList).toContain('lc-textarea--auto-resize');
        expect(textarea().hasAttribute('rows')).toBe(false);
      });

      it('sets an explicit height after a form write', () => {
        host.autoResize.set(true);
        fixture.detectChanges();
        host.control.setValue('Line 1\nLine 2\nLine 3');
        fixture.detectChanges();
        expect(textarea().style.height).toMatch(/px$/);
      });
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
      const areas: HTMLTextAreaElement[] = Array.from(fixture.nativeElement.querySelectorAll('textarea'));
      const labels: HTMLLabelElement[] = Array.from(fixture.nativeElement.querySelectorAll('label'));
      expect(areas).toHaveLength(2);
      expect(areas[0].id).not.toBe(areas[1].id);
      expect(labels[0].getAttribute('for')).toBe(areas[0].id);
      expect(labels[1].getAttribute('for')).toBe(areas[1].id);
    });

    it('disables the textarea when the disabled input is set', () => {
      const first: HTMLTextAreaElement = fixture.nativeElement.querySelector('textarea');
      host.disabled.set(true);
      fixture.detectChanges();
      expect(first.disabled).toBe(true);
      expect(first.classList).toContain('lc-textarea--disabled');
    });
  });

  describe('ControlValueAccessor (direct)', () => {
    let fixture: ComponentFixture<TextareaComponent>;
    let component: TextareaComponent;

    beforeEach(async () => {
      await TestBed.configureTestingModule({
        imports: [TextareaComponent],
      }).compileComponents();

      fixture = TestBed.createComponent(TextareaComponent);
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

    it('calls the registered callbacks', () => {
      const onChange = jest.fn();
      const onTouched = jest.fn();
      component.registerOnChange(onChange);
      component.registerOnTouched(onTouched);
      component.onInput('test');
      component.onBlur();
      expect(onChange).toHaveBeenCalledWith('test');
      expect(onTouched).toHaveBeenCalled();
    });

    it('ignores input while disabled via the form', () => {
      component.setDisabledState(true);
      component.onInput('nope');
      expect(component.value()).toBe('');
      expect(component.isDisabled()).toBe(true);
    });

    it('ORs the disabled input with the form disabled state', () => {
      fixture.componentRef.setInput('disabled', true);
      expect(component.isDisabled()).toBe(true);
      fixture.componentRef.setInput('disabled', false);
      expect(component.isDisabled()).toBe(false);
    });
  });
});

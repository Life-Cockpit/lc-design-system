import { Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { SwitchComponent } from './switch.component';

@Component({
  standalone: true,
  imports: [SwitchComponent, ReactiveFormsModule],
  template: `
    <lc-switch
      [formControl]="control"
      [label]="label()"
      [labelPosition]="labelPosition()"
      [variant]="variant()"
      [size]="size()"
      [required]="required()"
      [loading]="loading()"
      [ariaLabel]="ariaLabel()"
      (checkedChange)="changes.push($event)"
    />
  `,
})
class FormHostComponent {
  readonly control = new FormControl<boolean>(false, { nonNullable: true });
  readonly label = signal('Enable notifications');
  readonly labelPosition = signal<'left' | 'right'>('right');
  readonly variant = signal<'primary' | 'secondary' | 'success' | 'warning' | 'danger'>('primary');
  readonly size = signal<'sm' | 'md' | 'lg'>('md');
  readonly required = signal(false);
  readonly loading = signal(false);
  readonly ariaLabel = signal<string | undefined>(undefined);
  readonly changes: boolean[] = [];
}

@Component({
  standalone: true,
  imports: [SwitchComponent],
  template: `
    <lc-switch label="First" [checked]="checked()" [disabled]="disabled()" (checkedChange)="checked.set($event)" />
    <lc-switch label="Second" />
  `,
})
class TwoInstancesHostComponent {
  readonly checked = signal(false);
  readonly disabled = signal(false);
}

describe('SwitchComponent', () => {
  describe('with a FormControl host', () => {
    let fixture: ComponentFixture<FormHostComponent>;
    let host: FormHostComponent;

    const button = (): HTMLButtonElement => fixture.nativeElement.querySelector('button.lc-switch');
    const label = (): HTMLLabelElement | null => fixture.nativeElement.querySelector('label.lc-switch-label');

    beforeEach(async () => {
      await TestBed.configureTestingModule({
        imports: [FormHostComponent],
      }).compileComponents();

      fixture = TestBed.createComponent(FormHostComponent);
      host = fixture.componentInstance;
      fixture.detectChanges();
    });

    it('renders a native button with role="switch"', () => {
      expect(button()).toBeTruthy();
      expect(button().getAttribute('role')).toBe('switch');
      expect(button().getAttribute('type')).toBe('button');
      expect(button().getAttribute('aria-checked')).toBe('false');
    });

    it('associates the label with the switch via for/id', () => {
      const id = button().id;
      expect(id).toMatch(/^lc-switch-\d+$/);
      expect(label()?.getAttribute('for')).toBe(id);
      expect(label()?.textContent?.trim()).toBe('Enable notifications');
      // No redundant aria-label duplicating the visible label
      expect(button().hasAttribute('aria-label')).toBe(false);
    });

    it('renders the label before the switch when labelPosition is left', () => {
      host.labelPosition.set('left');
      fixture.detectChanges();
      const wrapper: HTMLElement = fixture.nativeElement.querySelector('.lc-switch-wrapper');
      expect(wrapper.classList).toContain('lc-switch-wrapper--label-left');
      expect(wrapper.firstElementChild?.tagName).toBe('LABEL');
      expect(label()?.getAttribute('for')).toBe(button().id);
    });

    it('applies default variant and size classes', () => {
      expect(button().classList).toContain('lc-switch--primary');
      expect(button().classList).toContain('lc-switch--md');
    });

    it('updates variant and size classes when inputs change', () => {
      host.variant.set('success');
      host.size.set('lg');
      fixture.detectChanges();
      expect(button().classList).toContain('lc-switch--success');
      expect(button().classList).toContain('lc-switch--lg');
      expect(button().classList).not.toContain('lc-switch--primary');
    });

    it('reflects control.setValue(true) in the DOM without manual markForCheck', () => {
      host.control.setValue(true);
      fixture.detectChanges();
      expect(button().getAttribute('aria-checked')).toBe('true');
      expect(button().classList).toContain('lc-switch--checked');

      host.control.setValue(false);
      fixture.detectChanges();
      expect(button().getAttribute('aria-checked')).toBe('false');
      expect(button().classList).not.toContain('lc-switch--checked');
    });

    it('does not emit checkedChange for form-driven writes', () => {
      host.control.setValue(true);
      fixture.detectChanges();
      expect(host.changes).toEqual([]);
    });

    it('reflects control.disable()/enable() in the DOM without manual markForCheck', () => {
      host.control.disable();
      fixture.detectChanges();
      expect(button().disabled).toBe(true);
      expect(button().classList).toContain('lc-switch--disabled');

      host.control.enable();
      fixture.detectChanges();
      expect(button().disabled).toBe(false);
      expect(button().classList).not.toContain('lc-switch--disabled');
    });

    it('toggles the control value and emits checkedChange on click', () => {
      button().click();
      fixture.detectChanges();
      expect(host.control.value).toBe(true);
      expect(host.control.touched).toBe(true);
      expect(button().getAttribute('aria-checked')).toBe('true');
      expect(host.changes).toEqual([true]);

      button().click();
      fixture.detectChanges();
      expect(host.control.value).toBe(false);
      expect(host.changes).toEqual([true, false]);
    });

    it('does not toggle when the control is disabled', () => {
      host.control.disable();
      fixture.detectChanges();
      button().click();
      fixture.detectChanges();
      expect(host.control.value).toBe(false);
      expect(host.changes).toEqual([]);
    });

    it('does not toggle while loading, but stays focusable and announces busy', () => {
      host.loading.set(true);
      fixture.detectChanges();
      expect(button().classList).toContain('lc-switch--loading');
      expect(button().disabled).toBe(false);
      expect(button().getAttribute('aria-busy')).toBe('true');
      expect(button().getAttribute('aria-disabled')).toBe('true');
      expect(fixture.nativeElement.querySelector('.lc-switch-loading-spinner')).toBeTruthy();

      button().click();
      fixture.detectChanges();
      expect(host.control.value).toBe(false);
      expect(host.changes).toEqual([]);
    });

    it('sets aria-required when required', () => {
      expect(button().hasAttribute('aria-required')).toBe(false);
      host.required.set(true);
      fixture.detectChanges();
      expect(button().getAttribute('aria-required')).toBe('true');
    });

    it('uses ariaLabel as accessible name override when provided', () => {
      host.ariaLabel.set('Toggle feature');
      fixture.detectChanges();
      expect(button().getAttribute('aria-label')).toBe('Toggle feature');
    });

    it('omits the label element when label is empty', () => {
      host.label.set('');
      fixture.detectChanges();
      expect(label()).toBeNull();
    });
  });

  describe('with a template-driven [checked] host', () => {
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
      const buttons: HTMLButtonElement[] = Array.from(fixture.nativeElement.querySelectorAll('button.lc-switch'));
      const labels: HTMLLabelElement[] = Array.from(fixture.nativeElement.querySelectorAll('label.lc-switch-label'));
      expect(buttons).toHaveLength(2);
      expect(buttons[0].id).not.toBe(buttons[1].id);
      expect(labels[0].getAttribute('for')).toBe(buttons[0].id);
      expect(labels[1].getAttribute('for')).toBe(buttons[1].id);
    });

    it('disables the button and ignores clicks when the disabled input is set', () => {
      const first: HTMLButtonElement = fixture.nativeElement.querySelector('button.lc-switch');
      host.disabled.set(true);
      fixture.detectChanges();
      expect(first.disabled).toBe(true);
      expect(first.classList).toContain('lc-switch--disabled');
      first.click();
      fixture.detectChanges();
      expect(host.checked()).toBe(false);
    });

    it('follows the [checked] input and round-trips via (checkedChange)', () => {
      const first: HTMLButtonElement = fixture.nativeElement.querySelector('button.lc-switch');
      expect(first.getAttribute('aria-checked')).toBe('false');

      host.checked.set(true);
      fixture.detectChanges();
      expect(first.getAttribute('aria-checked')).toBe('true');

      first.click();
      fixture.detectChanges();
      expect(host.checked()).toBe(false);
      expect(first.getAttribute('aria-checked')).toBe('false');
    });
  });

  describe('ControlValueAccessor (direct)', () => {
    let fixture: ComponentFixture<SwitchComponent>;
    let component: SwitchComponent;

    beforeEach(async () => {
      await TestBed.configureTestingModule({
        imports: [SwitchComponent],
      }).compileComponents();

      fixture = TestBed.createComponent(SwitchComponent);
      component = fixture.componentInstance;
      fixture.detectChanges();
    });

    it('writes null/undefined as unchecked', () => {
      component.writeValue(true);
      expect(component.checkedState()).toBe(true);
      component.writeValue(null);
      expect(component.checkedState()).toBe(false);
      component.writeValue(undefined);
      expect(component.checkedState()).toBe(false);
    });

    it('calls the registered onChange and onTouched callbacks on toggle', () => {
      const onChange = jest.fn();
      const onTouched = jest.fn();
      component.registerOnChange(onChange);
      component.registerOnTouched(onTouched);
      component.toggle();
      expect(onChange).toHaveBeenCalledWith(true);
      expect(onTouched).toHaveBeenCalled();
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

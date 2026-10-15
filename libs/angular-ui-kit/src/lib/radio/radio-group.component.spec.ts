import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { readFileSync } from 'fs';
import { resolve } from 'path';
import { RadioComponent } from './radio.component';
import { RadioGroupComponent } from './radio-group.component';

@Component({
  imports: [RadioGroupComponent, RadioComponent],
  changeDetection: ChangeDetectionStrategy.Eager,
  template: `
    <lc-radio-group
      legend="Language"
      [legendHidden]="legendHidden()"
      [helpText]="helpText()"
      [error]="error()"
      [required]="required()"
      [requiredIndicator]="requiredIndicator()"
      [disabled]="disabled()"
      [orientation]="orientation()"
      [(value)]="value"
    >
      <lc-radio value="device" label="Like this device" size="lg" />
      <lc-radio value="en" label="English" size="lg" />
      <lc-radio value="de" label="Deutsch" size="lg" />
    </lc-radio-group>
  `,
})
class HostComponent {
  readonly legendHidden = signal(false);
  readonly helpText = signal('');
  readonly error = signal('');
  readonly required = signal(false);
  readonly requiredIndicator = signal(true);
  readonly disabled = signal(false);
  readonly orientation = signal<'vertical' | 'horizontal'>('vertical');
  readonly value = signal('device');
}

@Component({
  imports: [RadioGroupComponent, RadioComponent, ReactiveFormsModule],
  changeDetection: ChangeDetectionStrategy.Eager,
  template: `
    <lc-radio-group legend="Plan" name="plan" [formControl]="control">
      <lc-radio value="a" label="A" />
      <lc-radio value="b" label="B" />
    </lc-radio-group>
  `,
})
class FormHostComponent {
  readonly control = new FormControl('b');
}

describe('RadioGroupComponent (lc-radio-group, AC-6)', () => {
  describe('with [(value)]', () => {
    let fixture: ComponentFixture<HostComponent>;
    let host: HostComponent;
    const el = () => fixture.nativeElement as HTMLElement;
    const radios = () => Array.from(el().querySelectorAll('input[type="radio"]')) as HTMLInputElement[];
    const fieldset = () => el().querySelector('fieldset') as HTMLFieldSetElement;

    beforeEach(async () => {
      await TestBed.configureTestingModule({ imports: [HostComponent] }).compileComponents();
      fixture = TestBed.createComponent(HostComponent);
      host = fixture.componentInstance;
      fixture.detectChanges();
      fixture.detectChanges();
    });

    it('is a native fieldset named by its legend', () => {
      const legend = fieldset().querySelector('legend') as HTMLElement;
      expect(legend.textContent?.trim()).toBe('Language');
      expect(legend.classList).not.toContain('lc-radio-group__legend--hidden');
    });

    it('can hide the legend visually and keep it for screen readers', () => {
      host.legendHidden.set(true);
      fixture.detectChanges();
      const legend = fieldset().querySelector('legend') as HTMLElement;
      expect(legend.textContent?.trim()).toBe('Language');
      expect(legend.classList).toContain('lc-radio-group__legend--hidden');
    });

    it('gives every radio the same generated name', () => {
      const names = radios().map((r) => r.name);
      expect(names[0]).toMatch(/^lc-radio-group-\d+$/);
      expect(new Set(names).size).toBe(1);
    });

    it('checks the radio of the bound value', () => {
      expect(radios().map((r) => r.checked)).toEqual([true, false, false]);
      host.value.set('de');
      fixture.detectChanges();
      expect(radios().map((r) => r.checked)).toEqual([false, false, true]);
    });

    it('writes the chosen value back and unchecks the others', () => {
      radios()[1].click();
      fixture.detectChanges();
      expect(host.value()).toBe('en');
      expect(radios().map((r) => r.checked)).toEqual([false, true, false]);
    });

    it('links help text and error to the fieldset; the error marks every radio invalid', () => {
      host.helpText.set('Applies to this device only.');
      host.error.set('Choose a language.');
      fixture.detectChanges();
      fixture.detectChanges();
      const ids = (fieldset().getAttribute('aria-describedby') ?? '').split(' ');
      const texts = ids.map((id) => el().querySelector(`#${id}`)?.textContent?.trim());
      expect(texts).toEqual(['Applies to this device only.', 'Choose a language.']);
      expect(el().querySelector(`#${ids[1]}`)?.getAttribute('role')).toBe('alert');
      expect(radios().every((r) => r.getAttribute('aria-invalid') === 'true')).toBe(true);
    });

    it('has no aria-describedby without help text or error', () => {
      expect(fieldset().hasAttribute('aria-describedby')).toBe(false);
    });

    it('required: every radio is required; the legend shows * unless requiredIndicator is off', () => {
      host.required.set(true);
      fixture.detectChanges();
      fixture.detectChanges();
      expect(radios().every((r) => r.required)).toBe(true);
      expect(el().querySelector('legend .lc-radio-group__required')).toBeTruthy();
      host.requiredIndicator.set(false);
      fixture.detectChanges();
      expect(el().querySelector('legend .lc-radio-group__required')).toBeNull();
      expect(radios().every((r) => r.required)).toBe(true);
    });

    it('disabled disables every radio', () => {
      host.disabled.set(true);
      fixture.detectChanges();
      fixture.detectChanges();
      expect(radios().every((r) => r.disabled)).toBe(true);
    });

    it('lays the radios out vertically by default, horizontally on request', () => {
      const options = () => el().querySelector('.lc-radio-group__options') as HTMLElement;
      expect(options().classList).toContain('lc-radio-group__options--vertical');
      host.orientation.set('horizontal');
      fixture.detectChanges();
      expect(options().classList).toContain('lc-radio-group__options--horizontal');
    });
  });

  describe('with a FormControl', () => {
    let fixture: ComponentFixture<FormHostComponent>;
    let host: FormHostComponent;
    const radios = () =>
      Array.from((fixture.nativeElement as HTMLElement).querySelectorAll('input[type="radio"]')) as HTMLInputElement[];

    beforeEach(async () => {
      await TestBed.configureTestingModule({ imports: [FormHostComponent] }).compileComponents();
      fixture = TestBed.createComponent(FormHostComponent);
      host = fixture.componentInstance;
      fixture.detectChanges();
      fixture.detectChanges();
    });

    it('uses the given name and checks the control value', () => {
      expect(radios().map((r) => r.name)).toEqual(['plan', 'plan']);
      expect(radios().map((r) => r.checked)).toEqual([false, true]);
    });

    it('follows control.setValue() and reports a click', () => {
      host.control.setValue('a');
      fixture.detectChanges();
      expect(radios().map((r) => r.checked)).toEqual([true, false]);
      radios()[1].click();
      fixture.detectChanges();
      expect(host.control.value).toBe('b');
    });

    it('follows control.disable()', () => {
      host.control.disable();
      fixture.detectChanges();
      expect(radios().every((r) => r.disabled)).toBe(true);
    });
  });

  describe('lc-radio targets and boundary', () => {
    const scss = readFileSync(resolve(__dirname, 'radio.component.scss'), 'utf-8');

    it('gives the lg label row a 44 px height (AC-6)', () => {
      expect(scss).toMatch(/\.radio-lg \{[^}]*min-height: 2\.75rem;/);
    });

    it('draws the circle with --color-field-border (≥ 3:1, SI-8)', () => {
      expect(scss).toMatch(/\.radio-circle \{[^}]*border: 2px solid var\(--color-field-border\);/);
    });
  });
});

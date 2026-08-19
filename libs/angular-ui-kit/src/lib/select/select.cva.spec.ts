import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SelectComponent } from './select.component';
import { TextareaComponent } from '../textarea/textarea.component';
import { SwitchComponent } from '../switch/switch.component';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { provideAnimations } from '@angular/platform-browser/animations';

/**
 * Integration tests for ControlValueAccessor implementation
 * Verifies that form components (Select, Textarea, Switch) work correctly with Angular forms
 */
/* eslint-disable @typescript-eslint/unbound-method */

describe('ControlValueAccessor Integration Tests', () => {
  const testOptions = [
    { value: '1', label: 'Option 1' },
    { value: '2', label: 'Option 2' },
    { value: '3', label: 'Option 3' },
  ];

  describe('Select Component', () => {
    let fixture: ComponentFixture<SelectComponent>;
    let component: SelectComponent;
    let formControl: FormControl;

    beforeEach(async () => {
      await TestBed.configureTestingModule({
        imports: [SelectComponent, ReactiveFormsModule],
        providers: [provideAnimations()],
      }).compileComponents();

      fixture = TestBed.createComponent(SelectComponent);
      component = fixture.componentInstance;
      fixture.componentRef.setInput('options', testOptions);
      formControl = new FormControl(null);
      fixture.detectChanges();
    });

    it('should implement ControlValueAccessor', () => {
      expect(component.writeValue).toBeDefined();
      expect(component.registerOnChange).toBeDefined();
      expect(component.registerOnTouched).toBeDefined();
      expect(component.setDisabledState).toBeDefined();
    });

    it('should update internal value when writeValue is called', () => {
      component.writeValue('2');
      expect(component.value()).toBe('2');
    });

    it('should call onChange when value changes', () => {
      const onChange = jest.fn();
      component.registerOnChange(onChange);

      component.selectOption(testOptions[1]);
      expect(onChange).toHaveBeenCalledWith('2');
    });

    it('should call onTouched when callback is registered', () => {
      const onTouched = jest.fn();
      component.registerOnTouched(onTouched);

      component.onBlur();
      expect(onTouched).toHaveBeenCalled();
    });

    it('should update disabled state', () => {
      expect(component.isDisabled()).toBe(false);

      component.setDisabledState?.(true);
      expect(component.isDisabled()).toBe(true);

      component.setDisabledState?.(false);
      expect(component.isDisabled()).toBe(false);
    });

    it('should work with reactive forms', () => {
      const form = new FormGroup({
        select: formControl,
      });

      expect(form.get('select')?.value).toBeNull();

      form.patchValue({ select: '2' });
      component.writeValue(form.get('select')?.value);

      expect(component.value()).toBe('2');
    });
  });

  describe('Textarea Component', () => {
    let fixture: ComponentFixture<TextareaComponent>;
    let component: TextareaComponent;

    beforeEach(async () => {
      await TestBed.configureTestingModule({
        imports: [TextareaComponent, ReactiveFormsModule],
      }).compileComponents();

      fixture = TestBed.createComponent(TextareaComponent);
      component = fixture.componentInstance;
      fixture.detectChanges();
    });

    it('should implement ControlValueAccessor', () => {
      expect(component.writeValue).toBeDefined();
      expect(component.registerOnChange).toBeDefined();
      expect(component.registerOnTouched).toBeDefined();
      expect(component.setDisabledState).toBeDefined();
    });

    it('should update internal value when writeValue is called', () => {
      component.writeValue('Test text');
      expect(component.value()).toBe('Test text');
    });

    it('should call onChange when value changes', () => {
      const onChange = jest.fn();
      component.registerOnChange(onChange);

      const textarea = fixture.nativeElement.querySelector('textarea');
      textarea.value = 'New text';
      textarea.dispatchEvent(new Event('input'));

      expect(onChange).toHaveBeenCalledWith('New text');
    });

    it('should call onTouched on blur', () => {
      const onTouched = jest.fn();
      component.registerOnTouched(onTouched);

      const textarea = fixture.nativeElement.querySelector('textarea');
      textarea.dispatchEvent(new Event('blur'));

      expect(onTouched).toHaveBeenCalled();
    });

    it('should update disabled state', () => {
      expect(component.isDisabled()).toBe(false);

      component.setDisabledState?.(true);
      expect(component.isDisabled()).toBe(true);

      component.setDisabledState?.(false);
      expect(component.isDisabled()).toBe(false);
    });
  });

  describe('Switch Component', () => {
    let fixture: ComponentFixture<SwitchComponent>;
    let component: SwitchComponent;

    beforeEach(async () => {
      await TestBed.configureTestingModule({
        imports: [SwitchComponent, ReactiveFormsModule],
      }).compileComponents();

      fixture = TestBed.createComponent(SwitchComponent);
      component = fixture.componentInstance;
      fixture.detectChanges();
    });

    it('should implement ControlValueAccessor', () => {
      expect(component.writeValue).toBeDefined();
      expect(component.registerOnChange).toBeDefined();
      expect(component.registerOnTouched).toBeDefined();
      expect(component.setDisabledState).toBeDefined();
    });

    it('should update internal checked state when writeValue is called', () => {
      component.writeValue(true);
      expect(component.checkedState()).toBe(true);

      component.writeValue(false);
      expect(component.checkedState()).toBe(false);
    });

    it('should call onChange when checked state changes', () => {
      const onChange = jest.fn();
      component.registerOnChange(onChange);

      component.toggle();
      expect(onChange).toHaveBeenCalledWith(true);

      component.toggle();
      expect(onChange).toHaveBeenCalledWith(false);
    });

    it('should call onTouched when clicked', () => {
      const onTouched = jest.fn();
      component.registerOnTouched(onTouched);

      component.onClick();
      expect(onTouched).toHaveBeenCalled();
    });

    it('should update disabled state', () => {
      expect(component.isDisabled()).toBe(false);

      component.setDisabledState?.(true);
      expect(component.isDisabled()).toBe(true);

      component.setDisabledState?.(false);
      expect(component.isDisabled()).toBe(false);
    });

    it('should work with reactive forms', () => {
      const form = new FormGroup({
        enabled: new FormControl(false),
      });

      expect(form.get('enabled')?.value).toBe(false);

      form.patchValue({ enabled: true });
      component.writeValue(form.get('enabled')?.value);

      expect(component.checkedState()).toBe(true);
    });
  });
});

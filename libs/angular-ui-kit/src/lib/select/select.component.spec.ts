import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { Component, signal } from '@angular/core';
import { By } from '@angular/platform-browser';
import { SelectComponent, SelectOption, SelectValue } from './select.component';

const threeOptions: SelectOption[] = [
  { value: '1', label: 'Option 1' },
  { value: '2', label: 'Option 2' },
  { value: '3', label: 'Option 3' },
];

/** The dropdown is rendered through the CDK overlay, i.e. outside the fixture's host element. */
function overlayPanel(): HTMLElement | null {
  return document.querySelector('.lc-select__dropdown');
}

describe('SelectComponent', () => {
  let component: SelectComponent;
  let fixture: ComponentFixture<SelectComponent>;

  const setInput = (name: string, value: unknown) => {
    fixture.componentRef.setInput(name, value);
    fixture.detectChanges();
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SelectComponent, ReactiveFormsModule],
    }).compileComponents();

    fixture = TestBed.createComponent(SelectComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => {
    fixture.destroy();
  });

  describe('Component Creation', () => {
    it('should create', () => {
      expect(component).toBeTruthy();
    });

    it('should have default variant "outline"', () => {
      expect(component.variant()).toBe('outline');
    });

    it('should have default size "md"', () => {
      expect(component.size()).toBe('md');
    });

    it('should not be disabled by default', () => {
      expect(component.disabled()).toBe(false);
      expect(component.isDisabled()).toBe(false);
    });

    it('should not have error state by default', () => {
      expect(component.error()).toBe(false);
    });

    it('should not be required by default', () => {
      expect(component.required()).toBe(false);
    });

    it('should not be in loading state by default', () => {
      expect(component.loading()).toBe(false);
    });

    it('should not be searchable by default', () => {
      expect(component.searchable()).toBe(false);
    });

    it('should not allow multiple selection by default', () => {
      expect(component.multiple()).toBe(false);
    });
  });

  describe('Options Management', () => {
    it('should accept options array', () => {
      setInput('options', threeOptions);
      expect(component.options()).toEqual(threeOptions);
      expect(component.filteredOptions()).toEqual(threeOptions);
    });

    it('should support grouped options', () => {
      const options = [
        { label: 'Group 1', options: [{ value: '1', label: 'Option 1' }] },
        { label: 'Group 2', options: [{ value: '2', label: 'Option 2' }] },
      ];
      setInput('options', options);
      expect(component.options()).toEqual(options);
      expect(component.filteredOptions().map((o) => o.value)).toEqual(['1', '2']);
    });

    it('should filter options when searchable', () => {
      setInput('options', [
        { value: '1', label: 'Apple' },
        { value: '2', label: 'Banana' },
        { value: '3', label: 'Cherry' },
      ]);
      setInput('searchable', true);
      component.searchQuery.set('ban');

      const filtered = component.filteredOptions();
      expect(filtered).toHaveLength(1);
      expect(filtered[0].label).toBe('Banana');
    });

    it('should not filter when not searchable', () => {
      setInput('options', threeOptions);
      component.searchQuery.set('2');
      expect(component.filteredOptions()).toEqual(threeOptions);
    });

    it('should return all options when search query is empty', () => {
      const options = [
        { value: '1', label: 'Apple' },
        { value: '2', label: 'Banana' },
      ];
      setInput('options', options);
      setInput('searchable', true);
      component.searchQuery.set('');

      expect(component.filteredOptions()).toEqual(options);
    });

    it('should reset the highlight when the filtered list changes', () => {
      setInput('options', threeOptions);
      setInput('searchable', true);
      component.highlightedIndex.set(2);
      component.searchQuery.set('Option 1');
      expect(component.highlightedIndex()).toBe(-1);
    });
  });

  describe('Variant Styles', () => {
    it.each(['outline', 'filled'] as const)('should apply %s variant class', (variant) => {
      setInput('variant', variant);
      const select = fixture.nativeElement.querySelector('.lc-select');
      expect(select.classList.contains(`lc-select--${variant}`)).toBe(true);
    });
  });

  describe('Size Styles', () => {
    it.each(['xs', 'sm', 'md', 'lg'] as const)('should apply %s size class', (size) => {
      setInput('size', size);
      const select = fixture.nativeElement.querySelector('.lc-select');
      expect(select.classList.contains(`lc-select--${size}`)).toBe(true);
    });
  });

  describe('State Management', () => {
    it('should apply disabled state', () => {
      setInput('disabled', true);
      const select = fixture.nativeElement.querySelector('.lc-select');
      expect(select.classList.contains('lc-select--disabled')).toBe(true);
      expect(select.getAttribute('tabindex')).toBe('-1');
    });

    it('should apply error state', () => {
      setInput('error', true);
      const select = fixture.nativeElement.querySelector('.lc-select');
      expect(select.classList.contains('lc-select--error')).toBe(true);
    });

    it('should apply loading state', () => {
      setInput('loading', true);
      const select = fixture.nativeElement.querySelector('.lc-select');
      expect(select.classList.contains('lc-select--loading')).toBe(true);
    });

    it('should not open dropdown when disabled', () => {
      setInput('disabled', true);
      component.toggle();
      expect(component.isOpen()).toBe(false);
    });

    it('should not open dropdown when loading', () => {
      setInput('loading', true);
      component.toggle();
      expect(component.isOpen()).toBe(false);
    });
  });

  describe('Dropdown Behavior', () => {
    it('should toggle dropdown open/closed', () => {
      expect(component.isOpen()).toBe(false);
      component.toggle();
      expect(component.isOpen()).toBe(true);
      component.toggle();
      expect(component.isOpen()).toBe(false);
    });

    it('should open dropdown', () => {
      component.open();
      expect(component.isOpen()).toBe(true);
    });

    it('should close dropdown', () => {
      component.open();
      component.close();
      expect(component.isOpen()).toBe(false);
    });

    it('should close dropdown on outside click', () => {
      component.open();
      component.onClickOutside();
      expect(component.isOpen()).toBe(false);
    });

    it('should emit opened once per open and closed once per close', () => {
      const opened = jest.fn();
      const closed = jest.fn();
      component.opened.subscribe(opened);
      component.closed.subscribe(closed);

      component.open();
      component.open(); // no-op while open
      expect(opened).toHaveBeenCalledTimes(1);

      component.close();
      component.close(); // idempotent
      expect(closed).toHaveBeenCalledTimes(1);
    });

    it('should emit closed exactly once when the overlay detaches', () => {
      // Regression: close() flipped isOpen, the CDK overlay detached and its
      // (detach) handler called close() a second time -> two `closed` emissions.
      const closed = jest.fn();
      component.closed.subscribe(closed);

      component.open();
      fixture.detectChanges();
      expect(overlayPanel()).toBeTruthy();

      component.close();
      fixture.detectChanges();
      expect(overlayPanel()).toBeFalsy();
      expect(closed).toHaveBeenCalledTimes(1);
    });
  });

  describe('Selection Behavior', () => {
    beforeEach(() => {
      setInput('options', threeOptions);
    });

    it('should select an option', () => {
      const option = { value: '1', label: 'Option 1' };
      component.selectOption(option);

      expect(component.value()).toBe('1');
      expect(component.selectedLabel()).toBe('Option 1');
    });

    it('should close dropdown after selection in single mode', () => {
      component.open();
      const option = { value: '1', label: 'Option 1' };
      component.selectOption(option);

      expect(component.isOpen()).toBe(false);
    });

    it('should keep dropdown open after selection in multiple mode', () => {
      setInput('multiple', true);
      component.open();
      const option = { value: '1', label: 'Option 1' };
      component.selectOption(option);

      expect(component.isOpen()).toBe(true);
    });

    it('should support multiple selection', () => {
      setInput('multiple', true);
      component.selectOption({ value: '1', label: 'Option 1' });
      component.selectOption({ value: '2', label: 'Option 2' });

      const value = component.value() as string[];
      expect(value).toEqual(['1', '2']);
    });

    it('should deselect option in multiple mode', () => {
      setInput('multiple', true);
      component.selectOption({ value: '1', label: 'Option 1' });
      component.selectOption({ value: '2', label: 'Option 2' });
      component.selectOption({ value: '1', label: 'Option 1' }); // Deselect

      const value = component.value() as string[];
      expect(value).toEqual(['2']);
    });

    it('should not select a disabled option', () => {
      const selectionChange = jest.fn();
      component.selectionChange.subscribe(selectionChange);
      component.selectOption({ value: '9', label: 'Nope', disabled: true });
      expect(component.value()).toBeNull();
      expect(selectionChange).not.toHaveBeenCalled();
    });

    it('should check if option is selected', () => {
      component.selectOption({ value: '1', label: 'Option 1' });

      expect(component.isSelected({ value: '1', label: 'Option 1' })).toBe(true);
      expect(component.isSelected({ value: '2', label: 'Option 2' })).toBe(false);
    });

    it('should clear selection', () => {
      component.selectOption({ value: '1', label: 'Option 1' });
      component.clear();

      expect(component.value()).toBeNull();
      expect(component.selectedLabel()).toBe('');
    });

    it('should toggle the value and emit once when the checkbox of an option is clicked (multiple)', () => {
      // Regression: the checkbox stopped propagation, so the option's click
      // handler never ran — the box flipped visually but the value never changed.
      setInput('multiple', true);
      const selectionChange = jest.fn();
      component.selectionChange.subscribe(selectionChange);

      component.open();
      fixture.detectChanges();

      const checkbox = overlayPanel()!.querySelector<HTMLInputElement>('.lc-select__checkbox');
      expect(checkbox).toBeTruthy();
      checkbox!.click();
      fixture.detectChanges();

      expect(component.value()).toEqual(['1']);
      expect(selectionChange).toHaveBeenCalledTimes(1);
      expect(selectionChange).toHaveBeenCalledWith(['1']);
      expect(checkbox!.checked).toBe(true);
      expect(component.isOpen()).toBe(true);
    });

    it('should select on option click', () => {
      const selectionChange = jest.fn();
      component.selectionChange.subscribe(selectionChange);

      component.open();
      fixture.detectChanges();

      const options = overlayPanel()!.querySelectorAll<HTMLElement>('[role="option"]');
      options[1].click();
      fixture.detectChanges();

      expect(component.value()).toBe('2');
      expect(selectionChange).toHaveBeenCalledTimes(1);
      expect(component.isOpen()).toBe(false);
    });
  });

  describe('ControlValueAccessor', () => {
    it('should write value', () => {
      component.writeValue('2');
      expect(component.value()).toBe('2');
    });

    it('should write null value', () => {
      component.selectOption({ value: '1', label: 'Option 1' });
      component.writeValue(null);
      expect(component.value()).toBeNull();
    });

    it('should register onChange callback', () => {
      const onChange = jest.fn();
      component.registerOnChange(onChange);

      component.selectOption({ value: '1', label: 'Option 1' });
      expect(onChange).toHaveBeenCalledWith('1');
    });

    it('should register onTouched callback', () => {
      const onTouched = jest.fn();
      component.registerOnTouched(onTouched);

      component.onBlur();
      expect(onTouched).toHaveBeenCalled();
    });

    it('should set disabled state without touching the disabled input', () => {
      component.setDisabledState(true);
      expect(component.isDisabled()).toBe(true);
      expect(component.disabled()).toBe(false);

      component.setDisabledState(false);
      expect(component.isDisabled()).toBe(false);
    });

    it('should OR the form disabled state with the disabled input', () => {
      setInput('disabled', true);
      component.setDisabledState(false);
      expect(component.isDisabled()).toBe(true);
    });
  });

  describe('Reactive Forms Integration', () => {
    it('should work with FormControl', () => {
      const control = new FormControl('2');
      component.writeValue(control.value);

      expect(component.value()).toBe('2');
    });

    it('should update FormControl on selection', () => {
      const control = new FormControl('');
      let capturedValue: SelectValue = null;

      component.registerOnChange((value) => {
        capturedValue = value;
        control.setValue(value as string);
      });

      component.selectOption({ value: '1', label: 'Option 1' });

      expect(capturedValue).toBe('1');
      expect(control.value).toBe('1');
    });

    it('should mark as touched on blur', () => {
      const control = new FormControl('');

      component.registerOnTouched(() => {
        control.markAsTouched();
      });

      component.onBlur();

      expect(control.touched).toBe(true);
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA role', () => {
      const select = fixture.nativeElement.querySelector('.lc-select');
      expect(select.getAttribute('role')).toBe('combobox');
      expect(select.getAttribute('aria-haspopup')).toBe('listbox');
    });

    it('should have aria-expanded attribute', () => {
      const select = fixture.nativeElement.querySelector('.lc-select');
      expect(select.getAttribute('aria-expanded')).toBe('false');

      component.open();
      fixture.detectChanges();
      expect(select.getAttribute('aria-expanded')).toBe('true');
    });

    it('should have aria-label when provided', () => {
      setInput('ariaLabel', 'Choose an option');
      const select = fixture.nativeElement.querySelector('.lc-select');
      expect(select.getAttribute('aria-label')).toBe('Choose an option');
    });

    it('should have aria-required when required', () => {
      setInput('required', true);
      const select = fixture.nativeElement.querySelector('.lc-select');
      expect(select.getAttribute('aria-required')).toBe('true');
    });

    it('should have aria-disabled when disabled', () => {
      setInput('disabled', true);
      const select = fixture.nativeElement.querySelector('.lc-select');
      expect(select.getAttribute('aria-disabled')).toBe('true');
    });

    it('should have aria-invalid when error', () => {
      setInput('error', true);
      const select = fixture.nativeElement.querySelector('.lc-select');
      expect(select.getAttribute('aria-invalid')).toBe('true');
    });

    it('should link helper and error text via aria-describedby', () => {
      const select: HTMLElement = fixture.nativeElement.querySelector('.lc-select');
      expect(select.getAttribute('aria-describedby')).toBeNull();

      setInput('helperText', 'Pick one');
      const helperId = select.getAttribute('aria-describedby');
      expect(helperId).toBeTruthy();
      expect(document.getElementById(helperId!)?.textContent).toContain('Pick one');

      setInput('error', true);
      setInput('errorMessage', 'Required');
      const errorId = select.getAttribute('aria-describedby');
      expect(errorId).not.toBe(helperId);
      expect(document.getElementById(errorId!)?.textContent).toContain('Required');
    });

    it('should render a listbox with role=option children and wire aria-controls', () => {
      setInput('options', threeOptions);
      component.open();
      fixture.detectChanges();

      const trigger: HTMLElement = fixture.nativeElement.querySelector('.lc-select');
      const listbox = document.getElementById(component.listboxId);
      expect(listbox).toBeTruthy();
      expect(listbox!.getAttribute('role')).toBe('listbox');
      expect(trigger.getAttribute('aria-controls')).toBe(component.listboxId);

      const options = listbox!.querySelectorAll('[role="option"]');
      expect(options.length).toBe(3);
      options.forEach((opt, i) => {
        expect(opt.id).toBe(component.optionId(i));
        expect(opt.getAttribute('aria-selected')).toBe('false');
      });
    });

    it('should mark the selected option and set aria-multiselectable in multiple mode', () => {
      setInput('options', threeOptions);
      setInput('multiple', true);
      component.writeValue(['2']);
      component.open();
      fixture.detectChanges();

      const listbox = document.getElementById(component.listboxId)!;
      expect(listbox.getAttribute('aria-multiselectable')).toBe('true');
      const options = listbox.querySelectorAll('[role="option"]');
      expect(options[1].getAttribute('aria-selected')).toBe('true');
      // The visual checkbox must not be exposed as a second control.
      const checkbox = options[1].querySelector('input[type="checkbox"]')!;
      expect(checkbox.getAttribute('aria-hidden')).toBe('true');
      expect(checkbox.getAttribute('tabindex')).toBe('-1');
    });

    it('should point aria-activedescendant at the highlighted option', () => {
      setInput('options', threeOptions);
      component.open();
      fixture.detectChanges();

      const trigger: HTMLElement = fixture.nativeElement.querySelector('.lc-select');
      expect(trigger.getAttribute('aria-activedescendant')).toBeNull();

      component.onKeyDown(new KeyboardEvent('keydown', { key: 'ArrowDown' }));
      fixture.detectChanges();
      expect(trigger.getAttribute('aria-activedescendant')).toBe(component.optionId(0));
      expect(document.getElementById(component.optionId(0))).toBeTruthy();
    });

    it('should wire the search input to the listbox and keep keyboard navigation working from it', () => {
      setInput('options', threeOptions);
      setInput('searchable', true);
      component.open();
      fixture.detectChanges();

      const search = overlayPanel()!.querySelector<HTMLInputElement>('.lc-select__search-input')!;
      expect(search.getAttribute('aria-controls')).toBe(component.listboxId);

      search.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }));
      fixture.detectChanges();
      expect(component.highlightedIndex()).toBe(0);
      expect(search.getAttribute('aria-activedescendant')).toBe(component.optionId(0));

      search.dispatchEvent(new KeyboardEvent('keydown', { key: 'End', bubbles: true }));
      expect(component.highlightedIndex()).toBe(2);
      search.dispatchEvent(new KeyboardEvent('keydown', { key: 'Home', bubbles: true }));
      expect(component.highlightedIndex()).toBe(0);

      // Space must type into the search box, not select.
      search.dispatchEvent(new KeyboardEvent('keydown', { key: ' ', bubbles: true }));
      expect(component.value()).toBeNull();

      search.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
      expect(component.value()).toBe('1');
      expect(component.isOpen()).toBe(false);
    });

    it('should return focus to the trigger when closing from the search input', () => {
      setInput('options', threeOptions);
      setInput('searchable', true);
      component.open();
      fixture.detectChanges();

      const search = overlayPanel()!.querySelector<HTMLInputElement>('.lc-select__search-input')!;
      search.focus();
      expect(document.activeElement).toBe(search);

      search.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
      fixture.detectChanges();

      expect(component.isOpen()).toBe(false);
      expect(document.activeElement).toBe(fixture.nativeElement.querySelector('.lc-select'));
    });
  });

  describe('Keyboard Navigation', () => {
    beforeEach(() => {
      setInput('options', threeOptions);
    });

    it('should open dropdown on Enter key', () => {
      const event = new KeyboardEvent('keydown', { key: 'Enter' });
      component.onKeyDown(event);
      expect(component.isOpen()).toBe(true);
    });

    it('should open dropdown on Space key', () => {
      const event = new KeyboardEvent('keydown', { key: ' ' });
      component.onKeyDown(event);
      expect(component.isOpen()).toBe(true);
    });

    it('should close dropdown on Escape key', () => {
      component.open();
      const event = new KeyboardEvent('keydown', { key: 'Escape' });
      component.onKeyDown(event);
      expect(component.isOpen()).toBe(false);
    });

    it('should stop Escape from propagating only while open', () => {
      const closedEvent = new KeyboardEvent('keydown', { key: 'Escape' });
      const stopClosed = jest.spyOn(closedEvent, 'stopPropagation');
      component.onKeyDown(closedEvent);
      expect(stopClosed).not.toHaveBeenCalled();

      component.open();
      const openEvent = new KeyboardEvent('keydown', { key: 'Escape', cancelable: true });
      const stopOpen = jest.spyOn(openEvent, 'stopPropagation');
      component.onKeyDown(openEvent);
      expect(stopOpen).toHaveBeenCalled();
      expect(openEvent.defaultPrevented).toBe(true);
    });

    it('should navigate down with ArrowDown', () => {
      component.open();
      const event = new KeyboardEvent('keydown', { key: 'ArrowDown' });

      component.onKeyDown(event);
      expect(component.highlightedIndex()).toBe(0);

      component.onKeyDown(event);
      expect(component.highlightedIndex()).toBe(1);
    });

    it('should navigate up with ArrowUp', () => {
      component.open();
      component.highlightedIndex.set(2);

      const event = new KeyboardEvent('keydown', { key: 'ArrowUp' });
      component.onKeyDown(event);
      expect(component.highlightedIndex()).toBe(1);
    });

    it('should wrap to last option when navigating up from first', () => {
      component.open();
      component.highlightedIndex.set(0);

      const event = new KeyboardEvent('keydown', { key: 'ArrowUp' });
      component.onKeyDown(event);
      expect(component.highlightedIndex()).toBe(2);
    });

    it('should wrap to first option when navigating down from last', () => {
      component.open();
      component.highlightedIndex.set(2);

      const event = new KeyboardEvent('keydown', { key: 'ArrowDown' });
      component.onKeyDown(event);
      expect(component.highlightedIndex()).toBe(0);
    });

    it('should jump with Home and End', () => {
      component.open();
      component.onKeyDown(new KeyboardEvent('keydown', { key: 'End' }));
      expect(component.highlightedIndex()).toBe(2);
      component.onKeyDown(new KeyboardEvent('keydown', { key: 'Home' }));
      expect(component.highlightedIndex()).toBe(0);
    });

    it('should select highlighted option on Enter', () => {
      component.open();
      component.highlightedIndex.set(1);

      const event = new KeyboardEvent('keydown', { key: 'Enter' });
      component.onKeyDown(event);

      expect(component.value()).toBe('2');
    });

    it('should ignore keys while disabled', () => {
      setInput('disabled', true);
      component.onKeyDown(new KeyboardEvent('keydown', { key: 'Enter' }));
      expect(component.isOpen()).toBe(false);
    });
  });

  describe('Helper Text', () => {
    it('should display helper text', () => {
      setInput('helperText', 'This is helpful');
      const helper = fixture.nativeElement.querySelector('.lc-select__helper');
      expect(helper?.textContent).toContain('This is helpful');
    });

    it('should display error message when in error state', () => {
      setInput('error', true);
      setInput('errorMessage', 'This is an error');
      const error = fixture.nativeElement.querySelector('.lc-select__error');
      expect(error?.textContent).toContain('This is an error');
    });

    it('should prioritize error message over helper text', () => {
      setInput('helperText', 'This is helpful');
      setInput('error', true);
      setInput('errorMessage', 'This is an error');

      const error = fixture.nativeElement.querySelector('.lc-select__error');
      const helper = fixture.nativeElement.querySelector('.lc-select__helper');

      expect(error).toBeTruthy();
      expect(helper).toBeFalsy();
    });
  });

  describe('Placeholder', () => {
    beforeEach(() => {
      setInput('options', [
        { value: '1', label: 'Option 1' },
        { value: '2', label: 'Option 2' },
      ]);
    });

    it('should display placeholder when no selection', () => {
      setInput('placeholder', 'Select an option');
      expect(component.displayValue()).toBe('Select an option');
      expect(fixture.nativeElement.querySelector('.lc-select__placeholder').textContent).toContain(
        'Select an option',
      );
    });

    it('should reflect a placeholder change after init', () => {
      // Regression: displayValue() read a plain @Input, so a later placeholder
      // change was never recomputed.
      setInput('placeholder', 'First');
      expect(component.displayValue()).toBe('First');
      setInput('placeholder', 'Second');
      expect(component.displayValue()).toBe('Second');
      expect(fixture.nativeElement.querySelector('.lc-select__value').textContent).toContain(
        'Second',
      );
    });

    it('should display selected value instead of placeholder', () => {
      setInput('placeholder', 'Select an option');
      component.selectOption({ value: '1', label: 'Option 1' });
      fixture.detectChanges();

      expect(component.displayValue()).toBe('Option 1');
    });

    it('should display count in multiple mode', () => {
      setInput('multiple', true);
      component.selectOption({ value: '1', label: 'Option 1' });
      component.selectOption({ value: '2', label: 'Option 2' });

      expect(component.displayValue()).toContain('2 selected');
    });
  });
});

@Component({
  standalone: true,
  imports: [SelectComponent, ReactiveFormsModule],
  template: `
    <lc-select
      [options]="options()"
      [placeholder]="placeholder()"
      [formControl]="control"
      ariaLabel="Host select"
    />
  `,
})
class HostComponent {
  readonly options = signal<SelectOption[]>(threeOptions);
  readonly placeholder = signal('Pick');
  readonly control = new FormControl<SelectValue>(null);
}

describe('SelectComponent in a reactive form', () => {
  let fixture: ComponentFixture<HostComponent>;
  let host: HostComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [HostComponent] }).compileComponents();
    fixture = TestBed.createComponent(HostComponent);
    host = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => fixture.destroy());

  const trigger = (): HTMLElement => fixture.nativeElement.querySelector('.lc-select');
  const select = (): SelectComponent =>
    fixture.debugElement.query(By.directive(SelectComponent)).componentInstance;

  it('should disable the trigger when the control is disabled', () => {
    expect(trigger().getAttribute('aria-disabled')).toBeNull();
    expect(trigger().getAttribute('tabindex')).toBe('0');

    host.control.disable();
    fixture.detectChanges();

    expect(trigger().getAttribute('aria-disabled')).toBe('true');
    expect(trigger().getAttribute('tabindex')).toBe('-1');
    expect(trigger().classList.contains('lc-select--disabled')).toBe(true);

    trigger().click();
    fixture.detectChanges();
    expect(select().isOpen()).toBe(false);

    host.control.enable();
    fixture.detectChanges();
    expect(trigger().getAttribute('aria-disabled')).toBeNull();
  });

  it('should propagate selections to the control and control values to the view', () => {
    host.control.setValue('2');
    fixture.detectChanges();
    expect(trigger().textContent).toContain('Option 2');

    select().selectOption(threeOptions[2]);
    expect(host.control.value).toBe('3');
  });

  it('should reflect placeholder changes from the host', () => {
    expect(trigger().textContent).toContain('Pick');
    host.placeholder.set('Choose one');
    fixture.detectChanges();
    expect(trigger().textContent).toContain('Choose one');
  });
});

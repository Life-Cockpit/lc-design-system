import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Component, signal } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { Observable, of, throwError } from 'rxjs';
import { ComboboxComponent, ComboboxOption, ComboboxValue } from './combobox.component';

/** The dropdown is rendered in the CDK overlay container (document.body). */
const dropdown = (): HTMLElement | null =>
  document.querySelector('.cdk-overlay-container .lc-combobox__dropdown');

@Component({
  standalone: true,
  imports: [ComboboxComponent, ReactiveFormsModule],
  template: `<lc-combobox label="Fruit" [options]="options()" [formControl]="control" />`,
})
class FormHost {
  options = signal<ComboboxOption[]>([
    { value: '1', label: 'Apple' },
    { value: '2', label: 'Banana' },
  ]);
  control = new FormControl<ComboboxValue>(null);
}

describe('ComboboxComponent', () => {
  let component: ComboboxComponent;
  let fixture: ComponentFixture<ComboboxComponent>;

  const sampleOptions: ComboboxOption[] = [
    { value: '1', label: 'Apple' },
    { value: '2', label: 'Banana' },
    { value: '3', label: 'Cherry' },
    { value: '4', label: 'Date', disabled: true },
  ];

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ComboboxComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(ComboboxComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    fixture.detectChanges();
    expect(component).toBeTruthy();
  });

  it('should render label', () => {
    fixture.componentRef.setInput('label', 'Fruit');
    fixture.detectChanges();
    const label = fixture.nativeElement.querySelector('.lc-combobox__label');
    expect(label?.textContent).toContain('Fruit');
  });

  it('should filter options by query', () => {
    fixture.componentRef.setInput('options', sampleOptions);
    fixture.detectChanges();
    component['query'].set('ban');
    const visible = component['visibleOptions']();
    expect(visible.length).toBe(1);
    expect(visible[0].label).toBe('Banana');
  });

  it('should select an option in single mode', () => {
    fixture.componentRef.setInput('options', sampleOptions);
    fixture.detectChanges();
    const spy = jest.fn();
    component.valueChange.subscribe(spy);
    component['selectOption'](sampleOptions[0]);
    expect(spy).toHaveBeenCalledWith(sampleOptions[0]);
    expect(component['selectedSingle']()?.value).toBe('1');
  });

  it('should select multiple options in multiple mode', () => {
    fixture.componentRef.setInput('options', sampleOptions);
    fixture.componentRef.setInput('multiple', true);
    fixture.detectChanges();
    component['selectOption'](sampleOptions[0]);
    component['selectOption'](sampleOptions[1]);
    expect(component['selectedMultiple']().length).toBe(2);
  });

  it('should remove selected in multiple mode', () => {
    fixture.componentRef.setInput('options', sampleOptions);
    fixture.componentRef.setInput('multiple', true);
    fixture.detectChanges();
    component['selectOption'](sampleOptions[0]);
    component['selectOption'](sampleOptions[1]);
    component['removeSelected'](sampleOptions[0]);
    expect(component['selectedMultiple']().length).toBe(1);
    expect(component['selectedMultiple']()[0].value).toBe('2');
  });

  it('should show create option when allowCreate is enabled', () => {
    fixture.componentRef.setInput('options', sampleOptions);
    fixture.componentRef.setInput('allowCreate', true);
    fixture.detectChanges();
    component['query'].set('Mango');
    expect(component['showCreateOption']()).toBe(true);
  });

  it('should not show create option when query matches existing', () => {
    fixture.componentRef.setInput('options', sampleOptions);
    fixture.componentRef.setInput('allowCreate', true);
    fixture.detectChanges();
    component['query'].set('Apple');
    expect(component['showCreateOption']()).toBe(false);
  });

  it('should emit created on create new', () => {
    fixture.componentRef.setInput('options', []);
    fixture.componentRef.setInput('allowCreate', true);
    fixture.detectChanges();
    const spy = jest.fn();
    component.created.subscribe(spy);
    component['query'].set('NewItem');
    component['onCreateNew']();
    expect(spy).toHaveBeenCalledWith('NewItem');
  });

  it('should apply error class', () => {
    fixture.componentRef.setInput('error', 'Required');
    fixture.detectChanges();
    const el = fixture.nativeElement.querySelector('.lc-combobox--error');
    expect(el).toBeTruthy();
  });

  it('should display helper text', () => {
    fixture.componentRef.setInput('helperText', 'Pick one');
    fixture.detectChanges();
    const helper = fixture.nativeElement.querySelector('.lc-combobox__helper');
    expect(helper?.textContent).toContain('Pick one');
  });

  it('should group options', () => {
    const opts: ComboboxOption[] = [
      { value: '1', label: 'A', group: 'Fruits' },
      { value: '2', label: 'B', group: 'Vegs' },
      { value: '3', label: 'C', group: 'Fruits' },
    ];
    fixture.componentRef.setInput('options', opts);
    fixture.detectChanges();
    component['query'].set('');
    const grouped = component['groupedOptions']();
    expect(grouped.length).toBe(2);
    expect(grouped[0].label).toBe('Fruits');
    expect(grouped[0].items.length).toBe(2);
  });

  it('should implement ControlValueAccessor', () => {
    fixture.detectChanges();
    const fn = jest.fn();
    component.registerOnChange(fn);
    component['selectOption'](sampleOptions[0]);
    expect(fn).toHaveBeenCalledWith(sampleOptions[0]);
  });

  describe('disabled / clear / writeValue', () => {
    it('should clear the selection: null emitted once, query empty', () => {
      fixture.componentRef.setInput('options', sampleOptions);
      fixture.detectChanges();
      const onChange = jest.fn();
      component.registerOnChange(onChange);
      component['selectOption'](sampleOptions[0]);
      fixture.detectChanges();
      const input = fixture.nativeElement.querySelector('input') as HTMLInputElement;
      expect(input.value).toBe('Apple');

      const valueSpy = jest.fn();
      component.valueChange.subscribe(valueSpy);
      onChange.mockClear();
      const clearBtn = fixture.nativeElement.querySelector('.lc-combobox__clear') as HTMLButtonElement;
      expect(clearBtn).toBeTruthy();
      clearBtn.click();
      fixture.detectChanges();

      expect(valueSpy).toHaveBeenCalledTimes(1);
      expect(valueSpy).toHaveBeenCalledWith(null);
      expect(onChange).toHaveBeenCalledTimes(1);
      expect(onChange).toHaveBeenCalledWith(null);
      expect(component['selectedSingle']()).toBeNull();
      expect(component['query']()).toBe('');
      expect(input.value).toBe('');
      expect(fixture.nativeElement.querySelector('.lc-combobox__clear')).toBeFalsy();
    });

    it('should clear the query text on writeValue(null)', () => {
      fixture.componentRef.setInput('options', sampleOptions);
      fixture.detectChanges();
      component.writeValue(sampleOptions[1]);
      fixture.detectChanges();
      const input = fixture.nativeElement.querySelector('input') as HTMLInputElement;
      expect(input.value).toBe('Banana');

      component.writeValue(null);
      fixture.detectChanges();
      expect(component['query']()).toBe('');
      expect(input.value).toBe('');
      expect(component['selectedSingle']()).toBeNull();
    });
  });

  describe('async loading', () => {
    // No zone.js in this test setup, so jest fake timers drive the rxjs `timer`.
    beforeEach(() => jest.useFakeTimers());
    afterEach(() => jest.useRealTimers());

    const type = (value: string) => {
      const input = fixture.nativeElement.querySelector('input') as HTMLInputElement;
      input.value = value;
      input.dispatchEvent(new Event('input'));
      fixture.detectChanges();
    };

    it('should honour debounceMs', () => {
      const loader = jest.fn((q: string): Observable<ComboboxOption[]> => of([{ value: q, label: q }]));
      fixture.componentRef.setInput('loadOptions', loader);
      fixture.componentRef.setInput('debounceMs', 500);
      fixture.detectChanges();

      type('ab');
      jest.advanceTimersByTime(300);
      expect(loader).not.toHaveBeenCalled();
      jest.advanceTimersByTime(200);
      expect(loader).toHaveBeenCalledWith('ab');
    });

    it('should recover from a loader error and keep working', () => {
      let fail = true;
      const loader = jest.fn((q: string): Observable<ComboboxOption[]> =>
        fail ? throwError(() => new Error('boom')) : of([{ value: q, label: q }])
      );
      fixture.componentRef.setInput('loadOptions', loader);
      fixture.componentRef.setInput('debounceMs', 10);
      fixture.detectChanges();

      type('x');
      jest.advanceTimersByTime(10);
      fixture.detectChanges();
      expect(loader).toHaveBeenCalledTimes(1);
      expect(component['isLoading']()).toBe(false);
      expect(component['visibleOptions']()).toEqual([]);

      fail = false;
      type('xy');
      jest.advanceTimersByTime(10);
      fixture.detectChanges();
      expect(loader).toHaveBeenCalledTimes(2);
      expect(component['isLoading']()).toBe(false);
      expect(component['visibleOptions']()).toEqual([{ value: 'xy', label: 'xy' }]);
    });
  });

  describe('overlay dropdown, keyboard and ARIA', () => {
    const keydown = (key: string): KeyboardEvent => {
      const input = fixture.nativeElement.querySelector('input') as HTMLInputElement;
      const ev = new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true });
      input.dispatchEvent(ev);
      fixture.detectChanges();
      return ev;
    };

    beforeEach(() => {
      fixture.componentRef.setInput('options', sampleOptions);
      fixture.componentRef.setInput('label', 'Fruit');
      fixture.detectChanges();
    });

    it('should link label and input, and helper/error via aria-describedby', () => {
      const input = fixture.nativeElement.querySelector('input') as HTMLInputElement;
      const label = fixture.nativeElement.querySelector('label') as HTMLLabelElement;
      expect(input.id).toBeTruthy();
      expect(label.htmlFor).toBe(input.id);
      expect(input.getAttribute('aria-invalid')).toBeNull();

      fixture.componentRef.setInput('error', 'Required');
      fixture.detectChanges();
      expect(input.getAttribute('aria-invalid')).toBe('true');
      const errorEl = fixture.nativeElement.querySelector('.lc-combobox__error') as HTMLElement;
      expect(input.getAttribute('aria-describedby')).toBe(errorEl.id);
    });

    it('should render the listbox in the CDK overlay with option ids and aria-activedescendant', () => {
      const input = fixture.nativeElement.querySelector('input') as HTMLInputElement;
      expect(dropdown()).toBeNull();
      expect(input.getAttribute('aria-expanded')).toBe('false');

      keydown('ArrowDown');
      const list = dropdown();
      expect(list).toBeTruthy();
      expect(list!.getAttribute('role')).toBe('listbox');
      expect(input.getAttribute('aria-expanded')).toBe('true');
      expect(input.getAttribute('aria-controls')).toBe(list!.id);

      const options = list!.querySelectorAll('[role="option"]');
      expect(options.length).toBe(sampleOptions.length);
      expect(options[0].id).toBeTruthy();
      expect(input.getAttribute('aria-activedescendant')).toBe(options[0].id);
      expect(options[0].getAttribute('aria-selected')).toBe('true');

      keydown('ArrowDown');
      expect(input.getAttribute('aria-activedescendant')).toBe(options[1].id);
      expect(options[1].getAttribute('aria-selected')).toBe('true');
      expect(options[0].getAttribute('aria-selected')).toBe('false');
    });

    it('should not close when clicking inside the dropdown but close on outside click', () => {
      keydown('ArrowDown');
      const list = dropdown()!;
      // click on the panel itself (e.g. scrollbar / padding) keeps it open
      list.dispatchEvent(new MouseEvent('click', { bubbles: true }));
      fixture.detectChanges();
      expect(component['isOpen']()).toBe(true);

      document.body.click();
      fixture.detectChanges();
      expect(component['isOpen']()).toBe(false);
      expect(dropdown()).toBeNull();
    });

    it('should close on Escape and stop propagation only when it was open', () => {
      // jsdom clears the propagation flag after dispatch, so observe a document listener
      const outerListener = jest.fn();
      document.addEventListener('keydown', outerListener);

      keydown('Escape');
      expect(outerListener).toHaveBeenCalledTimes(1);

      keydown('ArrowDown');
      expect(component['isOpen']()).toBe(true);
      keydown('Escape');
      expect(component['isOpen']()).toBe(false);
      // still 2 (ArrowDown bubbled), the Escape while open did not reach document
      expect(outerListener).toHaveBeenCalledTimes(2);
      document.removeEventListener('keydown', outerListener);
    });

    it('should not throw on ArrowDown with no options', () => {
      fixture.componentRef.setInput('options', []);
      fixture.detectChanges();
      keydown('ArrowDown');
      expect(component['highlightedIndex']()).toBe(-1);
    });
  });
});

describe('ComboboxComponent with FormControl', () => {
  let hostFixture: ComponentFixture<FormHost>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [FormHost] }).compileComponents();
    hostFixture = TestBed.createComponent(FormHost);
    hostFixture.detectChanges();
  });

  it('should implement setDisabledState (control.disable() disables the input)', () => {
    const input = hostFixture.nativeElement.querySelector('input') as HTMLInputElement;
    expect(input.disabled).toBe(false);

    hostFixture.componentInstance.control.disable();
    hostFixture.detectChanges();
    expect(input.disabled).toBe(true);
    expect(hostFixture.nativeElement.querySelector('.lc-combobox--disabled')).toBeTruthy();

    hostFixture.componentInstance.control.enable();
    hostFixture.detectChanges();
    expect(input.disabled).toBe(false);
  });

  it('should reflect control.setValue(null) by clearing the text', () => {
    const { control } = hostFixture.componentInstance;
    const input = hostFixture.nativeElement.querySelector('input') as HTMLInputElement;
    control.setValue({ value: '2', label: 'Banana' });
    hostFixture.detectChanges();
    expect(input.value).toBe('Banana');

    control.setValue(null);
    hostFixture.detectChanges();
    expect(input.value).toBe('');
  });
});

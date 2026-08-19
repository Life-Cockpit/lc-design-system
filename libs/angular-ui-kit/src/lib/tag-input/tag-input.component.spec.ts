import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Component, signal } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { TagInputComponent } from './tag-input.component';

@Component({
  standalone: true,
  imports: [TagInputComponent],
  template: `<lc-tag-input
    [placeholder]="placeholder()"
    [maxTags]="maxTags()"
    [allowDuplicates]="allowDuplicates()"
    [removable]="removable()"
    [disabled]="disabled()"
    [suggestions]="suggestions()"
    [label]="label()"
    (tagAdded)="added.push($event)"
    (tagRemoved)="removed.push($event)"
  />`,
})
class TestHost {
  placeholder = signal('Add tag…');
  maxTags = signal(Infinity);
  allowDuplicates = signal(false);
  removable = signal(true);
  disabled = signal(false);
  suggestions = signal<string[]>([]);
  label = signal('');
  added: string[] = [];
  removed: string[] = [];
}

@Component({
  standalone: true,
  imports: [TagInputComponent, ReactiveFormsModule],
  template: `<lc-tag-input label="Tags" [formControl]="control" />`,
})
class FormHost {
  control = new FormControl<string[]>(['one']);
}

describe('TagInputComponent', () => {
  let fixture: ComponentFixture<TestHost>;
  let host: TestHost;
  let el: HTMLElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [TestHost, FormHost] }).compileComponents();
    fixture = TestBed.createComponent(TestHost);
    host = fixture.componentInstance;
    fixture.detectChanges();
    el = fixture.nativeElement;
  });

  function getInput(): HTMLInputElement {
    return el.querySelector('.lc-tag-input__input') as HTMLInputElement;
  }

  function typeText(value: string): void {
    const input = getInput();
    input.value = value;
    input.dispatchEvent(new Event('input', { bubbles: true }));
    fixture.detectChanges();
  }

  function press(key: string): KeyboardEvent {
    const event = new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true });
    getInput().dispatchEvent(event);
    fixture.detectChanges();
    return event;
  }

  function addTagViaEnter(value: string): void {
    typeText(value);
    press('Enter');
  }

  function focusInput(): void {
    getInput().dispatchEvent(new Event('focus'));
    fixture.detectChanges();
  }

  it('should create', () => {
    expect(el.querySelector('lc-tag-input')).toBeTruthy();
  });

  it('should show placeholder when empty', () => {
    expect(getInput().placeholder).toBe('Add tag…');
  });

  it('should add tag on Enter', () => {
    addTagViaEnter('Angular');
    expect(el.querySelectorAll('.lc-tag-input__tag').length).toBe(1);
    expect(el.querySelector('.lc-tag-input__tag-text')?.textContent?.trim()).toBe('Angular');
  });

  it('should emit tagAdded event', () => {
    addTagViaEnter('React');
    expect(host.added).toContain('React');
  });

  it('should remove tag on remove button click', () => {
    addTagViaEnter('Vue');
    expect(el.querySelectorAll('.lc-tag-input__tag').length).toBe(1);
    const btn = el.querySelector('.lc-tag-input__tag-remove') as HTMLElement;
    btn.click();
    fixture.detectChanges();
    expect(el.querySelectorAll('.lc-tag-input__tag').length).toBe(0);
  });

  it('should emit tagRemoved event', () => {
    addTagViaEnter('Svelte');
    const btn = el.querySelector('.lc-tag-input__tag-remove') as HTMLElement;
    btn.click();
    fixture.detectChanges();
    expect(host.removed).toContain('Svelte');
  });

  it('should prevent duplicates by default', () => {
    addTagViaEnter('TypeScript');
    addTagViaEnter('TypeScript');
    expect(el.querySelectorAll('.lc-tag-input__tag').length).toBe(1);
  });

  it('should allow duplicates when enabled', () => {
    host.allowDuplicates.set(true);
    fixture.detectChanges();
    addTagViaEnter('TypeScript');
    addTagViaEnter('TypeScript');
    expect(el.querySelectorAll('.lc-tag-input__tag').length).toBe(2);
  });

  it('should respect maxTags and keep the input mounted but read-only at the limit', () => {
    host.maxTags.set(2);
    fixture.detectChanges();
    addTagViaEnter('A');
    addTagViaEnter('B');
    expect(el.querySelectorAll('.lc-tag-input__tag').length).toBe(2);

    const input = getInput();
    expect(input).toBeTruthy();
    expect(input.readOnly).toBe(true);
    expect(input.getAttribute('aria-readonly')).toBe('true');
    expect(input.placeholder).toBe('Maximum of 2 tags reached');

    addTagViaEnter('C');
    expect(el.querySelectorAll('.lc-tag-input__tag').length).toBe(2);

    // Removing a tag re-opens the input.
    (el.querySelector('.lc-tag-input__tag-remove') as HTMLElement).click();
    fixture.detectChanges();
    expect(getInput().readOnly).toBe(false);
  });

  it('should keep focus on the input when the last allowed tag is added', () => {
    host.maxTags.set(1);
    fixture.detectChanges();
    const input = getInput();
    input.focus();
    addTagViaEnter('Only');
    expect(document.activeElement).toBe(input);
  });

  it('should remove last tag on Backspace when input is empty', () => {
    addTagViaEnter('First');
    addTagViaEnter('Second');
    typeText('');
    press('Backspace');
    expect(el.querySelectorAll('.lc-tag-input__tag').length).toBe(1);
  });

  it('should not remove tags on Backspace when not removable', () => {
    host.removable.set(false);
    fixture.detectChanges();
    addTagViaEnter('Fixed');
    typeText('');
    press('Backspace');
    expect(el.querySelectorAll('.lc-tag-input__tag').length).toBe(1);
  });

  it('should not add empty tags', () => {
    addTagViaEnter('   ');
    expect(el.querySelectorAll('.lc-tag-input__tag').length).toBe(0);
  });

  it('should show label when provided and link it to the input', () => {
    host.label.set('Tags');
    fixture.detectChanges();
    const label = el.querySelector('.lc-tag-input__label') as HTMLLabelElement;
    expect(label.textContent?.trim()).toBe('Tags');
    expect(getInput().id).toMatch(/^lc-tag-input-\d+$/);
    expect(label.htmlFor).toBe(getInput().id);
  });

  it('should disable input', () => {
    host.disabled.set(true);
    fixture.detectChanges();
    expect(el.querySelector('.lc-tag-input__container--disabled')).toBeTruthy();
    expect(getInput().disabled).toBe(true);
  });

  it('should hide remove buttons when not removable', () => {
    host.removable.set(false);
    fixture.detectChanges();
    addTagViaEnter('Tag');
    expect(el.querySelector('.lc-tag-input__tag-remove')).toBeFalsy();
  });

  it('should label each remove button with its tag', () => {
    addTagViaEnter('Alpha');
    expect(el.querySelector('.lc-tag-input__tag-remove')?.getAttribute('aria-label')).toBe('Remove Alpha');
  });

  it('should add tag on comma', () => {
    typeText('Test');
    press(',');
    expect(el.querySelectorAll('.lc-tag-input__tag').length).toBe(1);
  });

  describe('suggestions', () => {
    beforeEach(() => {
      host.suggestions.set(['Apple', 'Apricot', 'Banana']);
      fixture.detectChanges();
      focusInput();
    });

    it('should expose the list as a listbox with options and wire the input as a combobox', () => {
      const input = getInput();
      expect(input.getAttribute('role')).toBe('combobox');
      expect(input.getAttribute('aria-expanded')).toBe('false');

      typeText('ap');
      const list = el.querySelector('.lc-tag-input__suggestions') as HTMLElement;
      expect(list.getAttribute('role')).toBe('listbox');
      expect(input.getAttribute('aria-expanded')).toBe('true');
      expect(input.getAttribute('aria-controls')).toBe(list.id);
      const options = list.querySelectorAll('[role="option"]');
      expect(options.length).toBe(2);
      expect(options[0].id).toBeTruthy();
      expect(options[0].getAttribute('aria-selected')).toBe('false');
    });

    it('should highlight with ArrowDown/ArrowUp and select the highlighted one with Enter', () => {
      typeText('ap');
      const down = press('ArrowDown');
      expect(down.defaultPrevented).toBe(true);
      const options = el.querySelectorAll('[role="option"]');
      expect(options[0].getAttribute('aria-selected')).toBe('true');
      expect(getInput().getAttribute('aria-activedescendant')).toBe(options[0].id);

      press('ArrowDown');
      expect(el.querySelectorAll('[role="option"]')[1].getAttribute('aria-selected')).toBe('true');
      press('ArrowUp');
      expect(el.querySelectorAll('[role="option"]')[0].getAttribute('aria-selected')).toBe('true');

      press('Enter');
      expect(host.added).toEqual(['Apple']);
      expect(el.querySelector('.lc-tag-input__tag-text')?.textContent?.trim()).toBe('Apple');
      expect(getInput().value).toBe('');
      expect(getInput().getAttribute('aria-expanded')).toBe('false');
    });

    it('should add the typed text on Enter when nothing is highlighted', () => {
      typeText('ap');
      press('Enter');
      expect(host.added).toEqual(['ap']);
    });

    it('should close the list on Escape and reopen it on further typing', () => {
      typeText('ap');
      expect(el.querySelector('.lc-tag-input__suggestions')).toBeTruthy();
      const esc = press('Escape');
      expect(esc.defaultPrevented).toBe(true);
      expect(el.querySelector('.lc-tag-input__suggestions')).toBeNull();
      expect(getInput().getAttribute('aria-expanded')).toBe('false');

      typeText('apr');
      expect(el.querySelector('.lc-tag-input__suggestions')).toBeTruthy();
    });

    it('should still select a suggestion with the mouse', () => {
      typeText('ban');
      const option = el.querySelector('[role="option"]') as HTMLElement;
      option.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, cancelable: true }));
      fixture.detectChanges();
      expect(host.added).toEqual(['Banana']);
    });
  });

  describe('forms integration', () => {
    it('should follow control.disable() / enable() and write the initial value', () => {
      const formFixture = TestBed.createComponent(FormHost);
      formFixture.detectChanges();
      const root: HTMLElement = formFixture.nativeElement;
      const input = root.querySelector('.lc-tag-input__input') as HTMLInputElement;
      expect(root.querySelectorAll('.lc-tag-input__tag').length).toBe(1);
      expect(input.disabled).toBe(false);

      formFixture.componentInstance.control.disable();
      formFixture.detectChanges();
      expect(input.disabled).toBe(true);
      expect(root.querySelector('.lc-tag-input__container--disabled')).toBeTruthy();
      expect(root.querySelector('.lc-tag-input__tag-remove')).toBeNull();

      formFixture.componentInstance.control.enable();
      formFixture.detectChanges();
      expect(input.disabled).toBe(false);
      expect(root.querySelector('.lc-tag-input__tag-remove')).toBeTruthy();
    });

    it('should push added tags to the control and mark it touched on blur', () => {
      const formFixture = TestBed.createComponent(FormHost);
      formFixture.detectChanges();
      const input = formFixture.nativeElement.querySelector('.lc-tag-input__input') as HTMLInputElement;
      input.value = 'two';
      input.dispatchEvent(new Event('input', { bubbles: true }));
      formFixture.detectChanges();
      input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
      formFixture.detectChanges();
      expect(formFixture.componentInstance.control.value).toEqual(['one', 'two']);

      expect(formFixture.componentInstance.control.touched).toBe(false);
      input.dispatchEvent(new Event('blur'));
      expect(formFixture.componentInstance.control.touched).toBe(true);
    });
  });
});

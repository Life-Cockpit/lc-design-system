import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Component, signal } from '@angular/core';
import { By } from '@angular/platform-browser';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { SearchInputComponent, SearchInputSize } from './search-input.component';

@Component({
  standalone: true,
  imports: [SearchInputComponent],
  template: `
    <label [for]="inputId">Find</label>
    <lc-search-input
      [inputId]="inputId"
      [placeholder]="placeholder()"
      [size]="size()"
      [debounceMs]="debounceMs()"
      [disabled]="disabled()"
      [ariaLabel]="ariaLabel()"
      [(value)]="value"
      (searchChange)="onSearchChange($event)"
      (searchSubmit)="onSearchSubmit($event)"
    ></lc-search-input>
  `,
})
class TestHostComponent {
  readonly inputId = 'find-field';
  readonly placeholder = signal('Search…');
  readonly size = signal<SearchInputSize>('md');
  readonly debounceMs = signal(0); // no debounce in tests unless a test raises it
  readonly disabled = signal(false);
  readonly ariaLabel = signal<string | undefined>(undefined);
  readonly value = signal('');
  readonly searchChanges: string[] = [];
  lastSubmitValue = '';

  onSearchChange(value: string): void {
    this.searchChanges.push(value);
  }

  onSearchSubmit(value: string): void {
    this.lastSubmitValue = value;
  }
}

const flush = (ms = 10) => new Promise((resolve) => setTimeout(resolve, ms));

describe('SearchInputComponent', () => {
  let fixture: ComponentFixture<TestHostComponent>;
  let host: TestHostComponent;

  const nativeInput = (): HTMLInputElement => fixture.debugElement.query(By.css('input')).nativeElement;
  const type = (text: string) => {
    const input = nativeInput();
    input.value = text;
    input.dispatchEvent(new Event('input'));
    fixture.detectChanges();
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TestHostComponent],
      providers: [provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();

    fixture = TestBed.createComponent(TestHostComponent);
    host = fixture.componentInstance;
  });

  it('should create', () => {
    fixture.detectChanges();
    expect(fixture.debugElement.query(By.directive(SearchInputComponent))).toBeTruthy();
  });

  it('should render search icon', () => {
    fixture.detectChanges();
    expect(fixture.debugElement.query(By.css('.search-input__icon'))).toBeTruthy();
  });

  it('should apply size class', () => {
    host.size.set('lg');
    fixture.detectChanges();
    expect(fixture.debugElement.query(By.css('.search-input')).nativeElement.classList).toContain('search-input--lg');
  });

  it('should apply disabled class', () => {
    host.disabled.set(true);
    fixture.detectChanges();
    expect(fixture.debugElement.query(By.css('.search-input')).nativeElement.classList).toContain('search-input--disabled');
  });

  it('should show clear button when value is present', () => {
    fixture.detectChanges();
    type('test');
    expect(fixture.debugElement.query(By.css('.search-input__clear'))).toBeTruthy();
  });

  it('should not show clear button when empty', () => {
    fixture.detectChanges();
    expect(fixture.debugElement.query(By.css('.search-input__clear'))).toBeNull();
  });

  it('should emit searchChange on input', async () => {
    fixture.detectChanges();
    type('hello');
    await flush();
    expect(host.searchChanges).toEqual(['hello']);
  });

  it('should emit searchSubmit on Enter', () => {
    fixture.detectChanges();
    type('query');
    nativeInput().dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter' }));
    fixture.detectChanges();
    expect(host.lastSubmitValue).toBe('query');
  });

  it('should have placeholder', () => {
    host.placeholder.set('Find items...');
    fixture.detectChanges();
    expect(nativeInput().placeholder).toBe('Find items...');
  });

  describe('clear', () => {
    it('should clear the value and emit searchChange("") exactly once', async () => {
      fixture.detectChanges();
      type('text');
      await flush();
      expect(host.searchChanges).toEqual(['text']);

      fixture.debugElement.query(By.css('.search-input__clear')).nativeElement.click();
      fixture.detectChanges();
      expect(host.searchChanges).toEqual(['text', '']);
      expect(nativeInput().value).toBe('');
      expect(host.value()).toBe('');

      await flush(20);
      expect(host.searchChanges).toEqual(['text', '']);
    });

    it('should drop a pending debounced value when cleared', async () => {
      host.debounceMs.set(30);
      fixture.detectChanges();
      type('pending');
      fixture.debugElement.query(By.css('.search-input__clear')).nativeElement.click();
      fixture.detectChanges();
      await flush(60);
      expect(host.searchChanges).toEqual(['']);
    });

    it('should have an accessible clear button', () => {
      fixture.detectChanges();
      type('x');
      const btn = fixture.debugElement.query(By.css('.search-input__clear')).nativeElement;
      expect(btn.getAttribute('aria-label')).toBe('Clear search');
    });
  });

  describe('value model', () => {
    it('should render a value preset by the parent without emitting searchChange', async () => {
      host.value.set('preset');
      fixture.detectChanges();
      await flush();
      expect(nativeInput().value).toBe('preset');
      expect(host.searchChanges).toEqual([]);
      expect(fixture.debugElement.query(By.css('.search-input__clear'))).toBeTruthy();
    });

    it('should reset the field when the parent writes an empty value', async () => {
      fixture.detectChanges();
      type('typed');
      await flush();
      host.value.set('');
      fixture.detectChanges();
      expect(nativeInput().value).toBe('');
      expect(host.searchChanges).toEqual(['typed']);
    });

    it('should emit again when the same text is typed after an external reset', async () => {
      fixture.detectChanges();
      type('abc');
      await flush();
      host.value.set('');
      fixture.detectChanges();
      type('abc');
      await flush();
      expect(host.searchChanges).toEqual(['abc', 'abc']);
    });

    it('should update the two-way bound value on every keystroke', () => {
      fixture.detectChanges();
      type('a');
      expect(host.value()).toBe('a');
      type('ab');
      expect(host.value()).toBe('ab');
    });

    it('should not emit duplicate searchChange for an unchanged value', async () => {
      fixture.detectChanges();
      type('same');
      await flush();
      type('same');
      await flush();
      expect(host.searchChanges).toEqual(['same']);
    });
  });

  describe('debounce', () => {
    it('should debounce with the configured delay', async () => {
      host.debounceMs.set(40);
      fixture.detectChanges();
      type('a');
      type('ab');
      await flush(10);
      expect(host.searchChanges).toEqual([]);
      await flush(60);
      expect(host.searchChanges).toEqual(['ab']);
    });

    it('should pick up a changed debounceMs without re-creating the component', async () => {
      host.debounceMs.set(200);
      fixture.detectChanges();
      host.debounceMs.set(0);
      fixture.detectChanges();
      type('fast');
      await flush(20);
      expect(host.searchChanges).toEqual(['fast']);
    });
  });

  describe('accessibility', () => {
    it('should default the accessible name to "Search"', () => {
      fixture.detectChanges();
      expect(nativeInput().getAttribute('aria-label')).toBe('Search');
    });

    it('should use a custom ariaLabel', () => {
      host.ariaLabel.set('Search members');
      fixture.detectChanges();
      expect(nativeInput().getAttribute('aria-label')).toBe('Search members');
    });

    it('should expose the native input id for an external label', () => {
      fixture.detectChanges();
      expect(nativeInput().id).toBe('find-field');
      const label: HTMLLabelElement = fixture.nativeElement.querySelector('label[for="find-field"]');
      expect(label.control).toBe(nativeInput());
    });

    it('should generate a unique id by default', () => {
      const f1 = TestBed.createComponent(SearchInputComponent);
      const f2 = TestBed.createComponent(SearchInputComponent);
      f1.detectChanges();
      f2.detectChanges();
      const id1 = f1.nativeElement.querySelector('input').id;
      const id2 = f2.nativeElement.querySelector('input').id;
      expect(id1).toMatch(/^lc-search-input-\d+$/);
      expect(id1).not.toBe(id2);
    });
  });
});

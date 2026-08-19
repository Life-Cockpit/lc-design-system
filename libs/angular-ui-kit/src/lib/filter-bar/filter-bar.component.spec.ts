import { Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { FilterBarComponent, FilterConfig, FilterValues } from './filter-bar.component';

@Component({
  standalone: true,
  imports: [FilterBarComponent],
  template: `<lc-filter-bar [filters]="filters" [values]="values()" (valuesChange)="values.set($event)" />`,
})
class HostComponent {
  readonly filters: FilterConfig[] = [
    { key: 'search', label: 'Search', type: 'search', placeholder: 'Search items...' },
    { key: 'kind', label: 'Kind', type: 'select', options: [{ value: 'a', label: 'A' }, { value: 'b', label: 'B' }] },
    { key: 'state', label: 'State', type: 'toggle', options: [{ value: 'all', label: 'All' }, { value: 'on', label: 'On' }] },
    { key: 'unlabelled', label: '', type: 'toggle', options: [{ value: 'x', label: 'X' }] },
  ];
  readonly values = signal<FilterValues>({});
}

describe('FilterBarComponent', () => {
  let component: FilterBarComponent;
  let fixture: ComponentFixture<FilterBarComponent>;

  const mockFilters: FilterConfig[] = [
    {
      key: 'status',
      label: 'Status',
      type: 'toggle',
      options: [
        { value: 'all', label: 'All' },
        { value: 'active', label: 'Active' },
        { value: 'paused', label: 'Paused' },
      ],
    },
    {
      key: 'category',
      label: 'Category',
      type: 'select',
      placeholder: 'All Categories',
      options: [
        { value: 'forex', label: 'Forex' },
        { value: 'commodities', label: 'Commodities' },
      ],
    },
    {
      key: 'search',
      label: '',
      type: 'search',
      placeholder: 'Search strategies...',
    },
  ];

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FilterBarComponent],
      providers: [provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();

    fixture = TestBed.createComponent(FilterBarComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('filters', mockFilters);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should render all filter items', () => {
    const items = fixture.nativeElement.querySelectorAll('.lc-filter-bar__item');
    expect(items.length).toBe(3);
  });

  it('should render toggle buttons', () => {
    const buttons = fixture.nativeElement.querySelectorAll('.lc-filter-bar__toggle-btn');
    expect(buttons.length).toBe(3);
  });

  it('should render select dropdown', () => {
    const select = fixture.nativeElement.querySelector('.lc-filter-bar__select');
    expect(select).toBeTruthy();
  });

  it('should render search input', () => {
    const input = fixture.nativeElement.querySelector('.lc-filter-bar__search .search-input__field');
    expect(input).toBeTruthy();
    expect(input.placeholder).toBe('Search strategies...');
  });

  it('should return correct value for filter key', () => {
    fixture.componentRef.setInput('values', { status: 'active' });
    fixture.detectChanges();
    expect(component.getValue('status')).toBe('active');
    expect(component.getValue('missing')).toBe('');
  });

  it('should emit valuesChange on filter change', () => {
    const spy = jest.spyOn(component.valuesChange, 'emit');
    component.onFilterChange('status', 'active');
    expect(spy).toHaveBeenCalledWith({ status: 'active' });
  });

  it('should preserve other values when changing one filter', () => {
    fixture.componentRef.setInput('values', { status: 'all', category: 'forex' });
    fixture.detectChanges();
    const spy = jest.spyOn(component.valuesChange, 'emit');
    component.onFilterChange('status', 'active');
    expect(spy).toHaveBeenCalledWith({ status: 'active', category: 'forex' });
  });

  it('should check toggle active state correctly', () => {
    fixture.componentRef.setInput('values', { status: 'active' });
    fixture.detectChanges();
    expect(component.isToggleActive('status', 'active')).toBe(true);
    expect(component.isToggleActive('status', 'all')).toBe(false);
  });

  it('should apply active class to active toggle', () => {
    fixture.componentRef.setInput('values', { status: 'active' });
    fixture.detectChanges();
    const classes = component.getToggleClasses('status', { value: 'active', label: 'Active' });
    expect(classes).toContain('lc-filter-bar__toggle-btn--active');
  });

  it('should reflect an external search value into the search field', () => {
    const input: HTMLInputElement = fixture.nativeElement.querySelector('.lc-filter-bar__search input');
    fixture.componentRef.setInput('values', { search: 'from outside' });
    fixture.detectChanges();
    expect(input.value).toBe('from outside');

    fixture.componentRef.setInput('values', {});
    fixture.detectChanges();
    expect(input.value).toBe('');
  });

  it('should return the same select options array across change detection', () => {
    const first = component.selectOptions('category');
    fixture.detectChanges();
    expect(component.selectOptions('category')).toBe(first);
    expect(first).toEqual([
      { value: 'forex', label: 'Forex' },
      { value: 'commodities', label: 'Commodities' },
    ]);
    expect(component.selectOptions('missing')).toEqual([]);
  });

  it('should rebuild select options when filters change', () => {
    const first = component.selectOptions('category');
    fixture.componentRef.setInput('filters', [
      { key: 'category', label: 'Category', type: 'select', options: [{ value: 'x', label: 'X' }] },
    ]);
    fixture.detectChanges();
    const next = component.selectOptions('category');
    expect(next).not.toBe(first);
    expect(next).toEqual([{ value: 'x', label: 'X' }]);
  });

  it('should expose the toggle group with role=group and aria-pressed buttons', () => {
    fixture.componentRef.setInput('values', { status: 'active' });
    fixture.detectChanges();
    const group: HTMLElement = fixture.nativeElement.querySelector('.lc-filter-bar__toggle-group');
    expect(group.getAttribute('role')).toBe('group');
    const label = fixture.nativeElement.querySelector(`#${group.getAttribute('aria-labelledby')}`);
    expect(label.textContent.trim()).toBe('Status');
    const pressed = Array.from(group.querySelectorAll('button')).map((b) => b.getAttribute('aria-pressed'));
    expect(pressed).toEqual(['false', 'true', 'false']);
  });
});

describe('FilterBarComponent in a host', () => {
  let fixture: ComponentFixture<HostComponent>;
  let host: HostComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HostComponent],
      providers: [provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();
    fixture = TestBed.createComponent(HostComponent);
    host = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should link the search label to the search input', () => {
    const label: HTMLLabelElement = fixture.nativeElement.querySelector('label.lc-filter-bar__label');
    const input: HTMLInputElement = fixture.nativeElement.querySelector('.lc-filter-bar__search input');
    expect(label.htmlFor).toBe(input.id);
    expect(label.control).toBe(input);
    expect(input.getAttribute('aria-labelledby')).toBe(label.id);
    expect(input.hasAttribute('aria-label')).toBe(false);
  });

  it('should fall back to aria-label for an unlabelled toggle group', () => {
    const groups: HTMLElement[] = Array.from(fixture.nativeElement.querySelectorAll('.lc-filter-bar__toggle-group'));
    expect(groups[1].getAttribute('aria-label')).toBe('unlabelled');
    expect(groups[1].hasAttribute('aria-labelledby')).toBe(false);
  });

  it('should round-trip search text through valuesChange and clear it from outside', () => {
    const input: HTMLInputElement = fixture.nativeElement.querySelector('.lc-filter-bar__search input');
    input.value = 'query';
    input.dispatchEvent(new Event('input'));
    fixture.detectChanges();
    // The filter bar's search runs with debounceMs 0, which emits synchronously.
    expect(host.values()['search']).toBe('query');

    host.values.set({});
    fixture.detectChanges();
    expect(input.value).toBe('');
  });

  it('should emit toggle changes and mark the pressed button', () => {
    const buttons: HTMLButtonElement[] = Array.from(
      fixture.nativeElement.querySelectorAll('.lc-filter-bar__toggle-group button'),
    );
    buttons[1].click();
    fixture.detectChanges();
    expect(host.values()['state']).toBe('on');
    expect(buttons[1].getAttribute('aria-pressed')).toBe('true');
    expect(buttons[0].getAttribute('aria-pressed')).toBe('false');
  });
});

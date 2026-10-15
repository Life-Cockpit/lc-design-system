import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CopyFieldComponent, CopyFieldLayout } from './copy-field.component';

@Component({
  imports: [CopyFieldComponent],
  changeDetection: ChangeDetectionStrategy.Eager,
  template: `
    <lc-copy-field
      label="Invitation link"
      [value]="value()"
      [layout]="layout()"
      [showIcon]="showIcon()"
      copyLabel="Kopieren"
      copiedLabel="Kopiert"
      copiedAnnouncement="Link kopiert"
      (copied)="copies.push($event)"
      (copyFailed)="failures = failures + 1"
    />
  `,
})
class HostComponent {
  readonly value = signal('https://example.com/join/7f3a9c1e-2b4d-4e8f-9a6b-1c2d3e4f5a6b');
  readonly layout = signal<CopyFieldLayout>('stacked');
  readonly showIcon = signal(true);
  readonly copies: string[] = [];
  failures = 0;
}

describe('CopyFieldComponent (lc-copy-field, AC-11)', () => {
  let fixture: ComponentFixture<HostComponent>;
  let host: HostComponent;
  let writeText: jest.Mock;
  const el = () => fixture.nativeElement as HTMLElement;
  const button = () => el().querySelector('button') as HTMLButtonElement;
  const live = () => el().querySelector('.lc-copy-field__live') as HTMLElement;
  /** Lets the awaited clipboard promise settle (native microtasks). */
  const settle = async () => {
    for (let i = 0; i < 5; i++) await Promise.resolve();
    fixture.detectChanges();
  };

  beforeEach(async () => {
    writeText = jest.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'clipboard', { value: { writeText }, configurable: true });
    await TestBed.configureTestingModule({ imports: [HostComponent] }).compileComponents();
    fixture = TestBed.createComponent(HostComponent);
    host = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('shows the value read-only and wrapping, named by the label', () => {
    const value = el().querySelector('.input-readonly-value') as HTMLElement;
    expect(value.textContent?.trim()).toBe(host.value());
    expect(value.getAttribute('aria-readonly')).toBe('true');
    const labelId = value.getAttribute('aria-labelledby') as string;
    expect(el().querySelector(`#${labelId}`)?.textContent?.trim()).toBe('Invitation link');
  });

  it('has a large (48.5 px) copy button with the visible label as its name', () => {
    expect(button().textContent?.trim()).toBe('Kopieren');
    expect(button().classList).toContain('btn-lg');
    expect(button().getAttribute('type')).toBe('button');
  });

  afterEach(() => jest.useRealTimers());

  it('copies the value, confirms on the button and announces it once', async () => {
    jest.useFakeTimers();
    button().click();
    await settle();
    expect(writeText).toHaveBeenCalledWith(host.value());
    expect(host.copies).toEqual([host.value()]);
    expect(button().textContent?.trim()).toBe('Kopiert');
    expect(live().textContent?.trim()).toBe('Link kopiert');
    expect(live().getAttribute('role')).toBe('status');

    jest.advanceTimersByTime(2000);
    fixture.detectChanges();
    expect(button().textContent?.trim()).toBe('Kopieren');
    expect(live().textContent?.trim()).toBe('');
  });

  it('selects the value when the clipboard refuses, so it can be copied by hand', async () => {
    writeText.mockRejectedValue(new Error('denied'));
    button().click();
    await settle();
    expect(host.failures).toBe(1);
    expect(host.copies).toEqual([]);
    const value = el().querySelector('.input-readonly-value') as HTMLElement;
    expect(document.activeElement).toBe(value);
    expect(document.getSelection()?.toString()).toBe(host.value());
  });

  it('stacks the button below the field by default, beside it with layout="inline"', () => {
    const root = () => el().querySelector('.lc-copy-field') as HTMLElement;
    expect(root().classList).toContain('lc-copy-field--stacked');
    host.layout.set('inline');
    fixture.detectChanges();
    expect(root().classList).toContain('lc-copy-field--inline');
  });

  it('can drop the icon', () => {
    expect(button().querySelector('lc-icon')).toBeTruthy();
    host.showIcon.set(false);
    fixture.detectChanges();
    expect(button().querySelector('lc-icon')).toBeNull();
  });
});

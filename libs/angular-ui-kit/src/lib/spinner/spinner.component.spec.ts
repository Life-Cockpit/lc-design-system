import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SpinnerComponent } from './spinner.component';

describe('SpinnerComponent', () => {
  let fixture: ComponentFixture<SpinnerComponent>;
  let el: HTMLElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [SpinnerComponent] }).compileComponents();
    fixture = TestBed.createComponent(SpinnerComponent);
    el = fixture.nativeElement;
    fixture.detectChanges();
  });

  it('renders the spinner circle', () => {
    expect(el.querySelector('.spinner__circle')).toBeTruthy();
  });

  it('defaults to md and applies size classes', () => {
    expect(el.querySelector('.spinner--md')).toBeTruthy();

    fixture.componentRef.setInput('size', 'sm');
    fixture.detectChanges();
    expect(el.querySelector('.spinner--sm')).toBeTruthy();
    expect(el.querySelector('.spinner--md')).toBeNull();

    fixture.componentRef.setInput('size', 'lg');
    fixture.detectChanges();
    expect(el.querySelector('.spinner--lg')).toBeTruthy();
  });

  it('is a polite status live region', () => {
    const root = el.querySelector('.spinner') as HTMLElement;
    expect(root.getAttribute('role')).toBe('status');
    expect(root.getAttribute('aria-live')).toBe('polite');
  });

  it('exposes a visually hidden "Loading" text when no message is given', () => {
    const srOnly = el.querySelector('.spinner__sr-only');
    expect(srOnly?.textContent?.trim()).toBe('Loading');
    expect(el.querySelector('.spinner__message')).toBeNull();
  });

  it('renders the message instead of the fallback text', () => {
    fixture.componentRef.setInput('message', 'Loading data...');
    fixture.detectChanges();
    expect(el.querySelector('.spinner__message')?.textContent?.trim()).toBe('Loading data...');
    expect(el.querySelector('.spinner__sr-only')).toBeNull();
  });
});

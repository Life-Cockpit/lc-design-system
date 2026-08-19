import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { ToastComponent } from './toast.component';
import type { Toast } from './toast.service';

const toast = (overrides: Partial<Toast> = {}): Toast => ({
  id: 't-1',
  message: 'Hello',
  variant: 'info',
  position: 'top-right',
  duration: 0,
  showCloseButton: true,
  ...overrides,
});

describe('ToastComponent', () => {
  let fixture: ComponentFixture<ToastComponent>;
  let host: HTMLElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ToastComponent],
      providers: [provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();

    fixture = TestBed.createComponent(ToastComponent);
    host = fixture.nativeElement as HTMLElement;
  });

  it('is a polite status region for success/info and an assertive alert for error/warning', () => {
    fixture.componentRef.setInput('toast', toast({ variant: 'success' }));
    fixture.detectChanges();
    expect(host.getAttribute('role')).toBe('status');
    expect(host.getAttribute('aria-live')).toBe('polite');
    expect(host.getAttribute('aria-atomic')).toBe('true');

    fixture.componentRef.setInput('toast', toast({ variant: 'error' }));
    fixture.detectChanges();
    expect(host.getAttribute('role')).toBe('alert');
    expect(host.getAttribute('aria-live')).toBe('assertive');
  });

  it('drops the live-region attributes when announce is false', () => {
    fixture.componentRef.setInput('toast', toast({ variant: 'error' }));
    fixture.componentRef.setInput('announce', false);
    fixture.detectChanges();
    expect(host.hasAttribute('role')).toBe(false);
    expect(host.hasAttribute('aria-live')).toBe(false);
    expect(host.hasAttribute('aria-atomic')).toBe(false);
  });

  it('applies the variant class and message', () => {
    fixture.componentRef.setInput('toast', toast({ variant: 'warning', message: 'Careful' }));
    fixture.detectChanges();
    expect(host.classList).toContain('lc-toast--warning');
    expect(host.textContent).toContain('Careful');
  });

  it('emits closed with the toast id from the close button', () => {
    fixture.componentRef.setInput('toast', toast({ id: 'abc' }));
    fixture.detectChanges();
    const closed: string[] = [];
    fixture.componentInstance.closed.subscribe((id) => closed.push(id));

    host.querySelector<HTMLButtonElement>('.lc-toast__close')!.click();
    expect(closed).toEqual(['abc']);
  });

  it('hides the close button when showCloseButton is false', () => {
    fixture.componentRef.setInput('toast', toast({ showCloseButton: false }));
    fixture.detectChanges();
    expect(host.querySelector('.lc-toast__close')).toBeNull();
  });

  it('runs the action and emits closed from the action button', () => {
    const onClick = jest.fn();
    fixture.componentRef.setInput('toast', toast({ id: 'abc', action: { label: 'Undo', onClick } }));
    fixture.detectChanges();
    const closed: string[] = [];
    fixture.componentInstance.closed.subscribe((id) => closed.push(id));

    const action = host.querySelector<HTMLButtonElement>('.lc-toast__action')!;
    expect(action.textContent?.trim()).toBe('Undo');
    action.click();
    expect(onClick).toHaveBeenCalled();
    expect(closed).toEqual(['abc']);
  });
});

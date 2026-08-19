import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { ToastOutletComponent } from './toast-outlet.component';
import { ToastService } from './toast.service';

describe('ToastOutletComponent', () => {
  let fixture: ComponentFixture<ToastOutletComponent>;
  let service: ToastService;
  let el: HTMLElement;

  const stack = (position: string) => el.querySelector<HTMLElement>(`.lc-toast-outlet__stack--${position}`)!;
  const region = (position: string, live: 'polite' | 'assertive') =>
    stack(position).querySelector<HTMLElement>(`[aria-live="${live}"]`)!;
  const toastsIn = (node: HTMLElement) => Array.from(node.querySelectorAll<HTMLElement>('lc-toast'));

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ToastOutletComponent],
      providers: [provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();

    service = TestBed.inject(ToastService);
    fixture = TestBed.createComponent(ToastOutletComponent);
    el = fixture.nativeElement as HTMLElement;
    fixture.detectChanges();
  });

  afterEach(() => {
    service.closeAll();
  });

  it('renders a persistent polite and assertive live region for every position, even without toasts', () => {
    for (const position of ['top-left', 'top-center', 'top-right', 'bottom-left', 'bottom-center', 'bottom-right']) {
      expect(stack(position)).toBeTruthy();
      expect(region(position, 'polite')).toBeTruthy();
      expect(region(position, 'assertive')).toBeTruthy();
    }
    expect(el.querySelectorAll('lc-toast').length).toBe(0);
  });

  it('renders the toasts of the service and removes them when they are closed', () => {
    const id = service.show({ message: 'Saved', duration: 0 });
    fixture.detectChanges();
    expect(toastsIn(el).length).toBe(1);
    expect(el.textContent).toContain('Saved');

    service.close(id);
    fixture.detectChanges();
    expect(toastsIn(el).length).toBe(0);
  });

  it('groups toasts by position', () => {
    service.show({ message: 'A', position: 'top-right', duration: 0 });
    service.show({ message: 'B', position: 'top-right', duration: 0 });
    service.show({ message: 'C', position: 'bottom-left', duration: 0 });
    fixture.detectChanges();

    expect(toastsIn(stack('top-right')).map((t) => t.textContent?.trim())).toEqual(['A', 'B']);
    expect(toastsIn(stack('bottom-left')).map((t) => t.textContent?.trim())).toEqual(['C']);
    expect(toastsIn(stack('top-left')).length).toBe(0);
  });

  it('announces error and warning toasts assertively and the rest politely', () => {
    service.show({ message: 'ok', variant: 'success', duration: 0 });
    service.show({ message: 'hint', variant: 'info', duration: 0 });
    service.show({ message: 'careful', variant: 'warning', duration: 0 });
    service.show({ message: 'boom', variant: 'error', duration: 0 });
    fixture.detectChanges();

    expect(toastsIn(region('top-right', 'polite')).map((t) => t.textContent?.trim())).toEqual(['ok', 'hint']);
    expect(toastsIn(region('top-right', 'assertive')).map((t) => t.textContent?.trim())).toEqual(['careful', 'boom']);
  });

  it('does not let the toasts announce themselves a second time', () => {
    service.show({ message: 'boom', variant: 'error', duration: 0 });
    fixture.detectChanges();

    const toast = toastsIn(el)[0];
    expect(toast.hasAttribute('role')).toBe(false);
    expect(toast.hasAttribute('aria-live')).toBe(false);
  });

  it('closes the toast in the service when its close button is clicked', () => {
    service.show({ message: 'Saved', duration: 0 });
    fixture.detectChanges();

    el.querySelector<HTMLButtonElement>('.lc-toast__close')!.click();
    fixture.detectChanges();

    expect(service.toasts().length).toBe(0);
    expect(toastsIn(el).length).toBe(0);
  });

  it('runs the action and closes the toast when its action button is clicked', () => {
    const onClick = jest.fn();
    service.show({ message: 'Deleted', duration: 0, action: { label: 'Undo', onClick } });
    fixture.detectChanges();

    el.querySelector<HTMLButtonElement>('.lc-toast__action')!.click();
    fixture.detectChanges();

    expect(onClick).toHaveBeenCalled();
    expect(service.toasts().length).toBe(0);
  });

  it('never shows more than the service maximum of 5 toasts per stack', () => {
    for (let i = 0; i < 7; i++) service.show({ message: `T${i}`, duration: 0 });
    fixture.detectChanges();

    expect(toastsIn(stack('top-right')).map((t) => t.textContent?.trim())).toEqual(['T2', 'T3', 'T4', 'T5', 'T6']);
  });
});

import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { By } from '@angular/platform-browser';
import { ConfirmDialogComponent } from './confirm-dialog.component';
import { IconComponent } from '../icon/icon.component';

describe('ConfirmDialogComponent', () => {
  let component: ConfirmDialogComponent;
  let fixture: ComponentFixture<ConfirmDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ConfirmDialogComponent],
      providers: [provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(ConfirmDialogComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('title', 'Test Title');
    fixture.componentRef.setInput('message', 'Test Message');
  });

  it('should create', () => {
    fixture.detectChanges();
    expect(component).toBeTruthy();
  });

  it('should display title and message when open', () => {
    fixture.componentRef.setInput('open', true);
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;
    expect(el.textContent).toContain('Test Title');
    expect(el.textContent).toContain('Test Message');
  });

  it('should use destructive icon for destructive variant', () => {
    fixture.componentRef.setInput('variant', 'destructive');
    fixture.detectChanges();
    expect(component['resolvedIcon']()).toBe('exclamation-triangle');
  });

  it('should use warning icon for warning variant', () => {
    fixture.componentRef.setInput('variant', 'warning');
    fixture.detectChanges();
    expect(component['resolvedIcon']()).toBe('exclamation-circle');
  });

  it('should disable confirm when requireText is not matched', () => {
    fixture.componentRef.setInput('requireText', { prompt: 'Type "delete"', expected: 'delete' });
    fixture.detectChanges();
    expect(component['confirmAllowed']()).toBe(false);
  });

  it('should enable confirm when requireText matches', () => {
    fixture.componentRef.setInput('requireText', { prompt: 'Type "delete"', expected: 'delete' });
    fixture.detectChanges();
    component['inputValue'].set('delete');
    expect(component['confirmAllowed']()).toBe(true);
  });

  it('should emit confirmed on confirm', () => {
    fixture.componentRef.setInput('open', true);
    fixture.detectChanges();
    const spy = jest.fn();
    component.confirmed.subscribe(spy);
    component['onConfirm']();
    expect(spy).toHaveBeenCalled();
  });

  it('should emit cancelled on cancel', () => {
    fixture.componentRef.setInput('open', true);
    fixture.detectChanges();
    const spy = jest.fn();
    component.cancelled.subscribe(spy);
    component['onCancel']();
    expect(spy).toHaveBeenCalled();
  });

  it('should use custom labels', () => {
    fixture.componentRef.setInput('open', true);
    fixture.componentRef.setInput('confirmLabel', 'Delete');
    fixture.componentRef.setInput('cancelLabel', 'Keep');
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;
    expect(el.textContent).toContain('Delete');
    expect(el.textContent).toContain('Keep');
  });

  describe('Enter key handling', () => {
    const enterOn = (target: Element) =>
      target.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true, cancelable: true }));

    it('should NOT confirm when Enter is pressed on the cancel button', () => {
      fixture.componentRef.setInput('open', true);
      fixture.componentRef.setInput('variant', 'destructive');
      fixture.detectChanges();
      const confirmedSpy = jest.fn();
      component.confirmed.subscribe(confirmedSpy);
      const el = fixture.nativeElement as HTMLElement;
      const cancelBtn = el.querySelector('.lc-confirm__footer lc-button button') as HTMLButtonElement;
      expect(cancelBtn.textContent).toContain('Cancel');
      const closeBtn = el.querySelector('.lc-modal__close') as HTMLButtonElement;

      enterOn(cancelBtn);
      enterOn(closeBtn);
      enterOn(el.querySelector('.lc-modal') ?? el);
      expect(confirmedSpy).not.toHaveBeenCalled();
    });

    it('should confirm on Enter in the require-text input only once the text matches', () => {
      fixture.componentRef.setInput('open', true);
      fixture.componentRef.setInput('requireText', { prompt: 'Type "delete"', expected: 'delete' });
      fixture.detectChanges();
      const confirmedSpy = jest.fn();
      component.confirmed.subscribe(confirmedSpy);
      const el = fixture.nativeElement as HTMLElement;
      const input = el.querySelector('.lc-confirm__require-text input') as HTMLInputElement;
      expect(input).toBeTruthy();
      // the prompt is an associated <label for>
      const label = el.querySelector('.lc-confirm__require-text label') as HTMLLabelElement;
      expect(label.htmlFor).toBe(input.id);
      expect(label.textContent).toContain('Type "delete"');

      input.value = 'del';
      input.dispatchEvent(new Event('input'));
      fixture.detectChanges();
      enterOn(input);
      expect(confirmedSpy).not.toHaveBeenCalled();
      const confirmBtn = el.querySelectorAll('.lc-confirm__footer lc-button button')[1] as HTMLButtonElement;
      expect(confirmBtn.disabled).toBe(true);

      input.value = 'delete';
      input.dispatchEvent(new Event('input'));
      fixture.detectChanges();
      expect(confirmBtn.disabled).toBe(false);
      enterOn(input);
      expect(confirmedSpy).toHaveBeenCalledTimes(1);
    });
  });

  describe('3.3: real-use options (AC-5)', () => {
    const dialog = (): HTMLElement => document.querySelector('[role="dialog"]') as HTMLElement;

    beforeEach(() => {
      fixture.componentRef.setInput('open', true);
    });

    it('is named by its title', () => {
      fixture.detectChanges();
      const labelledBy = dialog().getAttribute('aria-labelledby');
      expect(labelledBy).toMatch(/^lc-confirm-title-\d+$/);
      expect(document.getElementById(labelledBy as string)?.textContent).toContain('Test Title');
    });

    it('passes a translated close label to the modal', () => {
      fixture.componentRef.setInput('closeAriaLabel', 'Schließen');
      fixture.detectChanges();
      expect(dialog().querySelector('.lc-modal__close')?.getAttribute('aria-label')).toBe('Schließen');
    });

    it('renders the buttons in the requested size', () => {
      fixture.componentRef.setInput('buttonSize', 'lg');
      fixture.detectChanges();
      const buttons = dialog().querySelectorAll('.lc-confirm__footer .btn');
      expect(buttons.length).toBe(2);
      buttons.forEach((b) => expect(b.classList).toContain('btn-lg'));
    });

    it('shows a busy confirm button and ignores a second confirm while loading', () => {
      const spy = jest.fn();
      component.confirmed.subscribe(spy);
      fixture.componentRef.setInput('confirmLoading', true);
      fixture.detectChanges();
      const confirm = dialog().querySelectorAll('.lc-confirm__footer .btn')[1] as HTMLButtonElement;
      expect(confirm.getAttribute('aria-busy')).toBe('true');
      confirm.click();
      expect(spy).not.toHaveBeenCalled();
    });

    it('passes the placement to the modal', () => {
      fixture.componentRef.setInput('placement', 'auto');
      fixture.detectChanges();
      expect(dialog().classList).toContain('lc-modal--placement-auto');
    });

    it('hides the header icon from assistive tech (the title says it)', () => {
      fixture.detectChanges();
      const icon = fixture.debugElement.query(By.css('.lc-confirm__header lc-icon'))
        .componentInstance as IconComponent;
      expect(icon.decorative()).toBe(true);
    });
  });
});


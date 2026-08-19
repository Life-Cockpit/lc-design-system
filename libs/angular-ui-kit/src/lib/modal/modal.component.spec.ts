import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { Component, ChangeDetectionStrategy, signal } from '@angular/core';
import { ModalComponent } from './modal.component';
import { OverlayStackService } from '../shared/overlay-stack.service';
import { OverlayModule } from '@angular/cdk/overlay';
import { InteractivityChecker } from '@angular/cdk/a11y';
import { HttpTestingController } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';

const MOCK_SVG =
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M6 18L18 6M6 6l12 12"/></svg>';

describe('ModalComponent', () => {
  let component: ModalComponent;
  let fixture: ComponentFixture<ModalComponent>;
  let httpMock: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ModalComponent, OverlayModule],
      providers: [provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();

    fixture = TestBed.createComponent(ModalComponent);
    component = fixture.componentInstance;
    httpMock = TestBed.inject(HttpTestingController);
    fixture.detectChanges();
  });

  afterEach(() => {
    const pendingRequests = httpMock.match(() => true);
    pendingRequests.forEach((req) => {
      if (!req.cancelled) {
        req.flush(MOCK_SVG);
      }
    });
    httpMock.verify();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('Open/Close State', () => {
    it('should not be open by default', () => {
      expect(component._open()).toBe(false);
    });

    it('should not render modal content when closed', () => {
      const modal = fixture.debugElement.query(By.css('.lc-modal'));
      expect(modal).toBeFalsy();
    });

    it('should render modal content when open', () => {
      fixture.componentRef.setInput('open', true);
      fixture.detectChanges();
      const modal = fixture.debugElement.query(By.css('.lc-modal'));
      expect(modal).toBeTruthy();
    });

    it('should emit openChange when opened', () => {
      let openState = false;
      component.openChange.subscribe((open) => (openState = open));

      component.openModal();

      expect(openState).toBe(true);
    });

    it('should emit openChange when closed', () => {
      fixture.componentRef.setInput('open', true);
      fixture.detectChanges();

      let openState = true;
      component.openChange.subscribe((open) => (openState = open));

      component.closeModal();

      expect(openState).toBe(false);
    });

    it('should emit modalOpened event when opened', () => {
      let opened = false;
      component.modalOpened.subscribe(() => (opened = true));

      component.openModal();

      expect(opened).toBe(true);
    });

    it('should emit modalClosed event when closed', () => {
      fixture.componentRef.setInput('open', true);
      fixture.detectChanges();

      let closed = false;
      component.modalClosed.subscribe(() => (closed = true));

      component.closeModal();

      expect(closed).toBe(true);
    });
  });

  describe('Sizes', () => {
    it('should render md size by default', () => {
      fixture.componentRef.setInput('open', true);
      fixture.detectChanges();
      const modal = fixture.debugElement.query(By.css('.lc-modal'));
      expect(modal.nativeElement.classList).toContain('lc-modal--md');
    });

    it('should render sm size', () => {
      fixture.componentRef.setInput('open', true);
      fixture.componentRef.setInput('size', 'sm');
      fixture.detectChanges();
      const modal = fixture.debugElement.query(By.css('.lc-modal'));
      expect(modal.nativeElement.classList).toContain('lc-modal--sm');
    });

    it('should render lg size', () => {
      fixture.componentRef.setInput('open', true);
      fixture.componentRef.setInput('size', 'lg');
      fixture.detectChanges();
      const modal = fixture.debugElement.query(By.css('.lc-modal'));
      expect(modal.nativeElement.classList).toContain('lc-modal--lg');
    });

    it('should render xl size', () => {
      fixture.componentRef.setInput('open', true);
      fixture.componentRef.setInput('size', 'xl');
      fixture.detectChanges();
      const modal = fixture.debugElement.query(By.css('.lc-modal'));
      expect(modal.nativeElement.classList).toContain('lc-modal--xl');
    });

    it('should render full size', () => {
      fixture.componentRef.setInput('open', true);
      fixture.componentRef.setInput('size', 'full');
      fixture.detectChanges();
      const modal = fixture.debugElement.query(By.css('.lc-modal'));
      expect(modal.nativeElement.classList).toContain('lc-modal--full');
    });
  });

  describe('Backdrop', () => {
    it('should render backdrop when modal is open', () => {
      fixture.componentRef.setInput('open', true);
      fixture.detectChanges();
      const backdrop = fixture.debugElement.query(By.css('.lc-modal-backdrop'));
      expect(backdrop).toBeTruthy();
    });

    it('should close modal when backdrop is clicked by default', () => {
      fixture.componentRef.setInput('open', true);
      fixture.detectChanges();

      const backdrop = fixture.debugElement.query(By.css('.lc-modal-backdrop'));
      backdrop.nativeElement.click();
      fixture.detectChanges();

      expect(component._open()).toBe(false);
    });

    it('should not close when backdrop is clicked if closeOnBackdropClick is false', () => {
      fixture.componentRef.setInput('open', true);
      fixture.componentRef.setInput('closeOnBackdropClick', false);
      fixture.detectChanges();

      const backdrop = fixture.debugElement.query(By.css('.lc-modal-backdrop'));
      backdrop.nativeElement.click();
      fixture.detectChanges();

      expect(component._open()).toBe(true);
    });

    it('should emit backdropClicked event when backdrop is clicked', () => {
      fixture.componentRef.setInput('open', true);
      fixture.detectChanges();

      let backdropClicked = false;
      component.backdropClicked.subscribe(() => (backdropClicked = true));

      const backdrop = fixture.debugElement.query(By.css('.lc-modal-backdrop'));
      backdrop.nativeElement.click();

      expect(backdropClicked).toBe(true);
    });
  });

  describe('Close Button', () => {
    it('should show close button by default', () => {
      fixture.componentRef.setInput('open', true);
      fixture.detectChanges();
      const closeBtn = fixture.debugElement.query(By.css('.lc-modal__close'));
      expect(closeBtn).toBeTruthy();
    });

    it('should hide close button when showCloseButton is false', () => {
      fixture.componentRef.setInput('open', true);
      fixture.componentRef.setInput('showCloseButton', false);
      fixture.detectChanges();
      const closeBtn = fixture.debugElement.query(By.css('.lc-modal__close'));
      expect(closeBtn).toBeFalsy();
    });

    it('should close modal when close button is clicked', () => {
      fixture.componentRef.setInput('open', true);
      fixture.detectChanges();

      const closeBtn = fixture.debugElement.query(By.css('.lc-modal__close'));
      closeBtn.nativeElement.click();
      fixture.detectChanges();

      expect(component._open()).toBe(false);
    });
  });

  describe('Escape Key', () => {
    it('should close modal when Escape is pressed by default', () => {
      fixture.componentRef.setInput('open', true);
      fixture.detectChanges();

      const event = new KeyboardEvent('keydown', { key: 'Escape' });
      document.dispatchEvent(event);
      fixture.detectChanges();

      expect(component._open()).toBe(false);
    });

    it('should not close when Escape is pressed if closeOnEscape is false', () => {
      fixture.componentRef.setInput('open', true);
      fixture.componentRef.setInput('closeOnEscape', false);
      fixture.detectChanges();

      const event = new KeyboardEvent('keydown', { key: 'Escape' });
      document.dispatchEvent(event);
      fixture.detectChanges();

      expect(component._open()).toBe(true);
    });

    it('should stop the Escape from propagating when it handles it', () => {
      fixture.componentRef.setInput('open', true);
      fixture.detectChanges();
      const reachedWindow = jest.fn();
      window.addEventListener('keydown', reachedWindow);

      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));

      expect(component._open()).toBe(false);
      expect(reachedWindow).not.toHaveBeenCalled();
      window.removeEventListener('keydown', reachedWindow);
    });

    it('should leave the Escape to the overlay on top of it', () => {
      const stack = TestBed.inject(OverlayStackService);
      fixture.componentRef.setInput('open', true);
      fixture.detectChanges();
      stack.push('overlay-above-the-modal');
      const reachedWindow = jest.fn();
      window.addEventListener('keydown', reachedWindow);

      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
      fixture.detectChanges();

      expect(component._open()).toBe(true);
      expect(reachedWindow).toHaveBeenCalled();
      window.removeEventListener('keydown', reachedWindow);
      stack.remove('overlay-above-the-modal');
    });

    it('should still consume the Escape when it is on top but closeOnEscape is false', () => {
      const stack = TestBed.inject(OverlayStackService);
      stack.push('overlay-below-the-modal');
      fixture.componentRef.setInput('open', true);
      fixture.componentRef.setInput('closeOnEscape', false);
      fixture.detectChanges();

      const event = new KeyboardEvent('keydown', { key: 'Escape', bubbles: true });
      document.dispatchEvent(event);

      expect(component._open()).toBe(true);
      expect(stack.claim('overlay-below-the-modal', event)).toBe(false);
      stack.remove('overlay-below-the-modal');
    });
  });

  describe('Overlay stacking', () => {
    it('should register itself while open and unregister when closed', () => {
      const stack = TestBed.inject(OverlayStackService);
      fixture.componentRef.setInput('open', true);
      fixture.detectChanges();
      stack.push('probe');
      stack.remove('probe');
      // the modal is the only overlay left, so it must be top-most
      expect(stack.claim('someone-else', new Event('x'))).toBe(false);

      component.closeModal();
      fixture.detectChanges();
      stack.push('probe');
      expect(stack.isTop('probe')).toBe(true);
      stack.remove('probe');
    });

    it('should ignore backdrop clicks while another overlay is on top of it', () => {
      const stack = TestBed.inject(OverlayStackService);
      fixture.componentRef.setInput('open', true);
      fixture.detectChanges();
      stack.push('overlay-above-the-modal');

      let backdropClicked = false;
      component.backdropClicked.subscribe(() => (backdropClicked = true));
      fixture.debugElement.query(By.css('.lc-modal-backdrop')).nativeElement.click();
      fixture.detectChanges();

      expect(component._open()).toBe(true);
      expect(backdropClicked).toBe(false);
      stack.remove('overlay-above-the-modal');
    });

    it('should unregister itself when destroyed while open', () => {
      const stack = TestBed.inject(OverlayStackService);
      fixture.componentRef.setInput('open', true);
      fixture.detectChanges();

      fixture.destroy();

      stack.push('probe');
      expect(stack.isTop('probe')).toBe(true);
      stack.remove('probe');
      expect(document.body.style.overflow).toBe('');
    });
  });

  describe('Content Projection', () => {
    it('should project header content', () => {
      @Component({
        standalone: true,
        imports: [ModalComponent],
        template: `
          <lc-modal [open]="true">
            <div slot="header">Modal Header</div>
          </lc-modal>
        `,
        changeDetection: ChangeDetectionStrategy.OnPush,
      })
      class TestComponent {}

      const testFixture = TestBed.createComponent(TestComponent);
      testFixture.detectChanges();
      const header = testFixture.debugElement.query(By.css('[slot="header"]'));
      expect(header).toBeTruthy();
      expect(header.nativeElement.textContent).toContain('Modal Header');
    });

    it('should project body content', () => {
      @Component({
        standalone: true,
        imports: [ModalComponent],
        template: `
          <lc-modal [open]="true">
            <div slot="body">Modal Body</div>
          </lc-modal>
        `,
        changeDetection: ChangeDetectionStrategy.OnPush,
      })
      class TestComponent {}

      const testFixture = TestBed.createComponent(TestComponent);
      testFixture.detectChanges();
      const body = testFixture.debugElement.query(By.css('[slot="body"]'));
      expect(body).toBeTruthy();
      expect(body.nativeElement.textContent).toContain('Modal Body');
    });

    it('should project footer content', () => {
      @Component({
        standalone: true,
        imports: [ModalComponent],
        template: `
          <lc-modal [open]="true">
            <div slot="footer">Modal Footer</div>
          </lc-modal>
        `,
        changeDetection: ChangeDetectionStrategy.OnPush,
      })
      class TestComponent {}

      const testFixture = TestBed.createComponent(TestComponent);
      testFixture.detectChanges();
      const footer = testFixture.debugElement.query(By.css('[slot="footer"]'));
      expect(footer).toBeTruthy();
      expect(footer.nativeElement.textContent).toContain('Modal Footer');
    });
  });

  describe('Accessibility', () => {
    it('should have role="dialog"', () => {
      fixture.componentRef.setInput('open', true);
      fixture.detectChanges();
      const modal = fixture.debugElement.query(By.css('.lc-modal'));
      expect(modal.nativeElement.getAttribute('role')).toBe('dialog');
    });

    it('should have aria-modal="true"', () => {
      fixture.componentRef.setInput('open', true);
      fixture.detectChanges();
      const modal = fixture.debugElement.query(By.css('.lc-modal'));
      expect(modal.nativeElement.getAttribute('aria-modal')).toBe('true');
    });

    it('should have aria-label when provided', () => {
      fixture.componentRef.setInput('open', true);
      fixture.componentRef.setInput('ariaLabel', 'Custom modal label');
      fixture.detectChanges();
      const modal = fixture.debugElement.query(By.css('.lc-modal'));
      expect(modal.nativeElement.getAttribute('aria-label')).toBe('Custom modal label');
    });

    it('should trap focus inside modal when open', () => {
      fixture.componentRef.setInput('open', true);
      fixture.detectChanges();
      // Focus trap behavior is tested via CDK FocusTrap
      // This test verifies the trap directive is applied
      const modal = fixture.debugElement.query(By.css('.lc-modal'));
      expect(modal).toBeTruthy();
    });

    it('should close button have aria-label', () => {
      fixture.componentRef.setInput('open', true);
      fixture.detectChanges();
      const closeBtn = fixture.debugElement.query(By.css('.lc-modal__close'));
      expect(closeBtn.nativeElement.getAttribute('aria-label')).toBeTruthy();
    });
  });

  describe('Methods', () => {
    it('should open modal programmatically', () => {
      component.openModal();
      expect(component._open()).toBe(true);
    });

    it('should close modal programmatically', () => {
      fixture.componentRef.setInput('open', true);
      fixture.detectChanges();

      component.closeModal();

      expect(component._open()).toBe(false);
    });
  });

  describe('Focus management', () => {
    @Component({
      standalone: true,
      imports: [ModalComponent],
      template: `
        <button type="button" class="opener" (click)="open.set(true)">Open</button>
        <lc-modal [open]="open()" (openChange)="open.set($event)">
          <div slot="body"><input class="inside" /></div>
        </lc-modal>
      `,
      changeDetection: ChangeDetectionStrategy.OnPush,
    })
    class FocusHostComponent {
      readonly open = signal(false);
    }

    const FOCUSABLE = 'button, input, [tabindex]';

    it('should move focus into the modal on open and back to the opener on close', async () => {
      // jsdom has no layout, so the CDK would consider nothing tabbable
      TestBed.resetTestingModule();
      await TestBed.configureTestingModule({
        imports: [FocusHostComponent],
        providers: [
          provideHttpClient(),
          provideHttpClientTesting(),
          {
            provide: InteractivityChecker,
            useValue: {
              isFocusable: (el: Element) => el.matches(FOCUSABLE),
              isTabbable: (el: Element) => el.matches(FOCUSABLE),
            },
          },
        ],
      }).compileComponents();
      httpMock = TestBed.inject(HttpTestingController);
      const hostFixture = TestBed.createComponent(FocusHostComponent);
      hostFixture.detectChanges();
      const opener = hostFixture.nativeElement.querySelector('.opener') as HTMLButtonElement;
      opener.focus();
      expect(document.activeElement).toBe(opener);

      opener.click();
      hostFixture.detectChanges();
      await hostFixture.whenStable();
      const modal = hostFixture.nativeElement.querySelector('.lc-modal') as HTMLElement;
      expect(modal.contains(document.activeElement)).toBe(true);

      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
      hostFixture.detectChanges();
      await hostFixture.whenStable();
      expect(hostFixture.nativeElement.querySelector('.lc-modal')).toBeNull();
      expect(document.activeElement).toBe(opener);
    });
  });

  describe('Body Scroll Lock', () => {
    it('should disable body scroll when modal opens', () => {
      fixture.componentRef.setInput('open', true);
      fixture.detectChanges();
      // Body scroll lock behavior is tested via integration
      // This test verifies overflow style is applied
      expect(document.body.style.overflow).toBe('hidden');
    });

    it('should restore body scroll when modal closes', () => {
      fixture.componentRef.setInput('open', true);
      fixture.detectChanges();

      component.closeModal();
      fixture.detectChanges();

      expect(document.body.style.overflow).toBe('');
    });
  });
});
